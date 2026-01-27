"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  addBidRecord,
  clearSession,
  ensureCustomerAuctions,
  getBidRecords,
  getCustomerAuctions,
  getMockCredentials,
  getSession,
  setCustomerAuctions,
  STORAGE_KEYS,
  type BidRecord,
  type Session,
} from "@/app/lib/storage";
import type { CustomerAuction } from "@/app/mock/customer-data";

type ActionState = {
  tone: "neutral" | "success" | "warning";
  message: string;
};

type AuctionWithTime = CustomerAuction & {
  hasEnded: boolean;
  nextBid: number;
  timeLabel: string;
};

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `bid-${Math.random().toString(36).slice(2, 10)}`;
}

function findLatestBid(records: BidRecord[], auctionId: string) {
  return records.find((record) => record.auctionId === auctionId) ?? null;
}

export default function AuctionDetailPage() {
  const params = useParams<{ auctionId: string }>();
  const auctionId = Array.isArray(params?.auctionId) ? params.auctionId[0] : params?.auctionId;

  const [auctions, setAuctions] = useState<CustomerAuction[]>([]);
  const [bids, setBids] = useState<BidRecord[]>(() => getBidRecords());
  const [session, setSession] = useState<Session | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bidInput, setBidInput] = useState<string>("");
  const [actionState, setActionState] = useState<ActionState>({
    tone: "neutral",
    message: "Minimum bid validation is enforced locally.",
  });

  useEffect(() => {
    const initialAuctions = ensureCustomerAuctions();
    const initialBids = getBidRecords();
    const initialSession = getSession();

    const rafId = window.requestAnimationFrame(() => {
      setAuctions(initialAuctions);
      setBids(initialBids);
      setSession(initialSession);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === STORAGE_KEYS.customerAuctions) {
        const latest = getCustomerAuctions();
        if (latest.length > 0) {
          setAuctions(latest);
        }
      }
      if (event.key === STORAGE_KEYS.bids) {
        setBids(getBidRecords());
      }
      if (event.key === STORAGE_KEYS.session) {
        setSession(getSession());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const auctionWithTime: AuctionWithTime | null = useMemo(() => {
    if (!auctionId) return null;
    const auction = auctions.find((item) => item.id === auctionId);
    if (!auction) return null;

    const msRemaining = auction.endsAtMs - nowMs;
    const hasEnded = msRemaining <= 0;
    const nextBid = auction.currentBidThb + auction.minIncrementThb;

    return {
      ...auction,
      hasEnded,
      nextBid,
      timeLabel: formatDuration(msRemaining),
    };
  }, [auctionId, auctions, nowMs]);

  const auctionKey = auctionWithTime?.id ?? null;
  const nextBidValue = auctionWithTime?.nextBid ?? null;

  const latestBid = useMemo(() => {
    if (!auctionKey) return null;
    return findLatestBid(bids, auctionKey);
  }, [auctionKey, bids]);

  const recentBids = useMemo(() => {
    if (!auctionKey) return [];
    return bids.filter((record) => record.auctionId === auctionKey).slice(0, 5);
  }, [auctionKey, bids]);

  useEffect(() => {
    if (!nextBidValue) return;
    const nextDefault = nextBidValue.toString();
    const rafId = window.requestAnimationFrame(() => {
      setBidInput(nextDefault);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [auctionKey, nextBidValue]);

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  function placeBid(amountThb: number) {
    if (!auctionWithTime) {
      setActionState({ tone: "warning", message: "Auction not found." });
      return;
    }

    if (auctionWithTime.hasEnded) {
      setActionState({ tone: "warning", message: "This auction has ended." });
      return;
    }

    const minimumAllowed = auctionWithTime.nextBid;
    if (amountThb < minimumAllowed) {
      setActionState({
        tone: "warning",
        message: `Minimum next bid is ${formatThb(minimumAllowed)}.`,
      });
      return;
    }

    const step = auctionWithTime.minIncrementThb;
    const remainder = (amountThb - minimumAllowed) % step;
    if (remainder !== 0) {
      setActionState({
        tone: "warning",
        message: `Bids must increase by ${formatThb(step)} increments.`,
      });
      return;
    }

    const updatedAuctions = auctions.map((item) => {
      if (item.id !== auctionWithTime.id) return item;
      return {
        ...item,
        currentBidThb: amountThb,
        bids: item.bids + 1,
      };
    });

    setAuctions(updatedAuctions);
    setCustomerAuctions(updatedAuctions);

    const nextRecords = addBidRecord({
      id: makeId(),
      auctionId: auctionWithTime.id,
      amountThb,
      placedAtMs: nowMs,
    });
    setBids(nextRecords);

    setActionState({
      tone: "success",
      message: `Your bid is now ${formatThb(amountThb)}. Funds would be held in escrow if you win.`,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(bidInput);
    if (!Number.isFinite(amount)) {
      setActionState({ tone: "warning", message: "Enter a valid bid amount." });
      return;
    }
    placeBid(Math.round(amount));
  }

  const actionToneClass =
    actionState.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : actionState.tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-50 text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Customer View
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Auction detail</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/customer"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Back to list
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Login
            </Link>
            {session ? (
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setSession(null);
                }}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <section className="flex items-center justify-between">
          <Link
            href="/customer"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 transition hover:text-zinc-900"
          >
            Customer / Auctions
          </Link>
          <Link
            href={sessionRoute}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
          >
            Dashboard
          </Link>
        </section>

        {!auctionWithTime ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
            Auction not found. Go back to the list and select another item.
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.95fr]">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6">
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-100 to-zinc-200 p-6">
                <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {auctionWithTime.series}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <h2 className="text-2xl font-semibold text-zinc-900">{auctionWithTime.title}</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Seller • {auctionWithTime.seller}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current price</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-900">
                    {formatThb(auctionWithTime.currentBidThb)}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Time left</p>
                  <p className={`mt-1 text-2xl font-semibold ${auctionWithTime.hasEnded ? "text-zinc-400" : "text-zinc-900"}`}>
                    {auctionWithTime.timeLabel}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Minimum next bid: <span className="font-semibold text-zinc-900">{formatThb(auctionWithTime.nextBid)}</span>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <section className="rounded-3xl border border-zinc-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-zinc-900">Place a bid</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Bids below the minimum are rejected.
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((step) => {
                    const amount = auctionWithTime.nextBid + step * auctionWithTime.minIncrementThb;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => placeBid(amount)}
                        disabled={auctionWithTime.hasEnded}
                        className="rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
                      >
                        {formatThb(amount)}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Custom bid (THB)
                    </span>
                    <input
                      type="number"
                      min={auctionWithTime.nextBid}
                      step={auctionWithTime.minIncrementThb}
                      value={bidInput}
                      onChange={(event) => setBidInput(event.target.value)}
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={auctionWithTime.hasEnded}
                    className="rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    Confirm bid
                  </button>
                </form>
              </section>

              <section className="rounded-3xl border border-zinc-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-zinc-900">Your bids</h3>
                {latestBid ? (
                  <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                    <p className="text-sm text-zinc-600">Amount</p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-900">
                      {formatThb(latestBid.amountThb)}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {new Date(latestBid.placedAtMs).toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-600">No bids yet.</p>
                )}

                {recentBids.length > 0 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      Recent bids
                    </p>
                    {recentBids.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm"
                      >
                        <span className="font-semibold text-zinc-900">
                          {formatThb(record.amountThb)}
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          {new Date(record.placedAtMs).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${actionToneClass}`}>
                  {actionState.message}
                </div>
              </section>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
