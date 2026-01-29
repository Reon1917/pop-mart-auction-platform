"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensureCustomerAuctions,
  getCustomerAuctions,
  getMockCredentials,
  getSession,
  resetPrototypeData,
  STORAGE_KEYS,
  type Session,
} from "@/app/lib/storage";
import type { CustomerAuction } from "@/app/mock/customer-data";

type AuctionWithTime = CustomerAuction & {
  hasEnded: boolean;
  nextBid: number;
  timeLabel: string;
};

export default function CustomerPage() {
  const [auctions, setAuctions] = useState<CustomerAuction[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const handleReset = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Reset demo data and timers? This clears bids, listings, and logs.")
    ) {
      return;
    }
    resetPrototypeData();
    setAuctions(getCustomerAuctions());
    setSession(getSession());
    setNowMs(Date.now());
  };

  useEffect(() => {
    const initialAuctions = ensureCustomerAuctions();
    const initialSession = getSession();

    const rafId = window.requestAnimationFrame(() => {
      setAuctions(initialAuctions);
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
      if (event.key === STORAGE_KEYS.session) {
        setSession(getSession());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const auctionsWithTime: AuctionWithTime[] = useMemo(() => {
    return auctions.map((auction) => {
      const msRemaining = auction.endsAtMs - nowMs;
      const hasEnded = msRemaining <= 0;
      const nextBid = auction.currentBidThb + auction.minIncrementThb;

      return {
        ...auction,
        hasEnded,
        nextBid,
        timeLabel: formatDuration(msRemaining),
      };
    });
  }, [auctions, nowMs]);

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";
  const showSellerAdminLinks = session?.role !== "buyer";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Customer View
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Auctions</h1>
          </div>
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
            >
              Reset demo
            </button>
            <Link
              href="/"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Landing
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Login
            </Link>
            {showSellerAdminLinks ? (
              <>
                <Link
                  href="/seller"
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
                >
                  Seller
                </Link>
                <Link
                  href="/admin"
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
                >
                  Admin
                </Link>
              </>
            ) : null}
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
        <section className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Select one auction.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">
            This list shows only surface information. Click any item to see full
            auction details and place a bid.
          </p>
        </section>

        {session ? (
          <section className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Signed in as {session.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-700">
                {session.role}
              </p>
            </div>
            <Link
              href={sessionRoute}
              className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-300"
            >
              Open your dashboard
            </Link>
          </section>
        ) : (
          <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">You are not signed in.</p>
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Go to login
            </Link>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {auctionsWithTime.map((auction) => (
            <Link
              key={auction.id}
              href={`/customer/${auction.id}`}
              className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-zinc-300"
            >
              <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-100 to-zinc-200 p-6">
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {auction.series}
                </div>
              </div>

              <div className="mt-4 flex flex-1 flex-col gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">{auction.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Seller • {auction.seller}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                      Current
                    </p>
                    <p className="mt-1 text-xl font-semibold text-zinc-900">
                      {formatThb(auction.currentBidThb)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                      Time left
                    </p>
                    <p className={`mt-1 text-xl font-semibold ${auction.hasEnded ? "text-zinc-400" : "text-zinc-900"}`}>
                      {auction.timeLabel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm font-semibold text-zinc-900">
                    Next bid {formatThb(auction.nextBid)}
                  </p>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 transition group-hover:translate-x-0.5">
                    View details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
