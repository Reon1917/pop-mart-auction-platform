"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getAllAuctions,
  getMockCredentials,
  getNotificationsForUser,
  getSession,
  getSessionUser,
  placeBidRealtime,
  runMockCompetingBidTick,
  settleDueAuctions,
  type Auction,
  type NotificationRecord,
  type Session,
} from "@/app/lib/storage";

type LocalMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

export default function AuctionDetailPage() {
  const params = useParams<{ auctionId: string }>();
  const auctionId = Array.isArray(params?.auctionId) ? params.auctionId[0] : params?.auctionId;

  const [session, setSession] = useState<Session | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [buyerStatus, setBuyerStatus] = useState<"active" | "suspended" | "banned" | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bidInput, setBidInput] = useState("0");
  const [message, setMessage] = useState<LocalMessage>({
    tone: "neutral",
    text: "Manual bids and simulated competing bids update in realtime.",
  });

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      const nextAuction = auctionId
        ? getAllAuctions().find((item) => item.id === auctionId) ?? null
        : null;

      setSession(nextSession);
      setBuyerId(nextUser?.role === "buyer" ? nextUser.id : null);
      setBuyerStatus(nextUser?.role === "buyer" ? nextUser.status : null);
      setAuction(nextAuction);
      if (nextUser?.role === "buyer") {
        setNotifications(getNotificationsForUser(nextUser.id));
      } else {
        setNotifications([]);
      }
      setNowMs(Date.now());

      if (nextAuction) {
        setBidInput((prev) => {
          if (prev !== "0") {
            return prev;
          }
          return String(nextAuction.currentBidThb + nextAuction.minIncrementThb);
        });
      }
    };

    refresh();

    const timer = window.setInterval(() => {
      refresh();
      if (auctionId) {
        runMockCompetingBidTick(auctionId);
      }
    }, 6000);

    const secondTimer = window.setInterval(() => setNowMs(Date.now()), 1000);

    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(secondTimer);
      window.removeEventListener("storage", refresh);
    };
  }, [auctionId]);

  const auctionView = useMemo(() => {
    if (!auction) return null;
    const msRemaining = auction.endsAtMs - nowMs;
    return {
      ...auction,
      hasEnded: msRemaining <= 0,
      timeLabel: formatDuration(msRemaining),
      nextBid: auction.currentBidThb + auction.minIncrementThb,
    };
  }, [auction, nowMs]);

  const latestOutbid = notifications.find((item) => item.type === "outbid" && !item.read);
  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  function handleBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auctionView || !buyerId) {
      setMessage({ tone: "warning", text: "Sign in as a buyer to place bids." });
      return;
    }

    if (buyerStatus !== "active") {
      setMessage({
        tone: "warning",
        text: `Your account is ${buyerStatus}. Bidding is blocked by moderation rules.`,
      });
      return;
    }

    const amount = Math.round(Number(bidInput));
    if (!Number.isFinite(amount)) {
      setMessage({ tone: "warning", text: "Enter a valid bid amount." });
      return;
    }

    const result = placeBidRealtime(auctionView.id, buyerId, amount);
    setMessage({ tone: result.ok ? "success" : "warning", text: result.message });

    const nextAuction = getAllAuctions().find((item) => item.id === auctionView.id) ?? null;
    setAuction(nextAuction);
    setNowMs(Date.now());
  }

  const messageToneClass =
    message.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : message.tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-50 text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Buyer Dashboard
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Auction Detail</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/customer"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Back to list
            </Link>
            <Link
              href={sessionRoute}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Dashboard
            </Link>
            {session ? (
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setSession(null);
                }}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        {latestOutbid ? (
          <section className="rounded-md border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-900">
            <p className="font-semibold">Outbid alert</p>
            <p className="mt-1">{latestOutbid.message}</p>
          </section>
        ) : null}

        {!auctionView ? (
          <section className="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
            Auction not found.
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.95fr]">
            <section className="rounded-md border border-zinc-200 bg-white p-6">
              <h2 className="text-2xl font-semibold text-zinc-900">{auctionView.title}</h2>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Series {auctionView.series} • Status {auctionView.status.replaceAll("_", " ")}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current bid</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-900">
                    {formatThb(auctionView.currentBidThb)}
                  </p>
                </div>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Time left</p>
                  <p className={`mt-1 text-2xl font-semibold ${auctionView.hasEnded ? "text-zinc-400" : "text-zinc-900"}`}>
                    {auctionView.timeLabel}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Minimum next bid: <span className="font-semibold text-zinc-900">{formatThb(auctionView.nextBid)}</span>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-zinc-900">Place Realtime Bid</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Bids are validated by minimum increment and account status.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((step) => {
                  const amount = auctionView.nextBid + step * auctionView.minIncrementThb;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setBidInput(String(amount))}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
                    >
                      {formatThb(amount)}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleBid} className="mt-4 flex flex-col gap-3">
                <input
                  type="number"
                  min={auctionView.nextBid}
                  step={auctionView.minIncrementThb}
                  value={bidInput}
                  onChange={(event) => setBidInput(event.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
                <button
                  type="submit"
                  disabled={auctionView.status !== "live" || auctionView.hasEnded}
                  className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  Confirm bid
                </button>
              </form>

              <div className={`mt-4 rounded-md border px-4 py-3 text-sm ${messageToneClass}`}>
                {message.text}
              </div>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
