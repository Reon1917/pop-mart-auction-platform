"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getAllAuctions,
  getEscrowCases,
  getNotificationsForUser,
  getSession,
  getSessionUser,
  markNotificationRead,
  settleDueAuctions,
  type Auction,
  type NotificationRecord,
  type Session,
} from "@/app/lib/storage";

type AuctionView = Auction & {
  timeLabel: string;
  hasEnded: boolean;
  nextBid: number;
};

function topNavLinkClass(active: boolean) {
  return `rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
  }`;
}

export default function CustomerPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [wonItemCount, setWonItemCount] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      setSession(nextSession);
      setAuctions(getAllAuctions());

      if (nextUser?.role === "buyer") {
        setNotifications(getNotificationsForUser(nextUser.id));
        setWonItemCount(getEscrowCases().filter((item) => item.buyerId === nextUser.id).length);
      } else {
        setNotifications([]);
        setWonItemCount(0);
      }

      setNowMs(Date.now());
    };

    refresh();
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const auctionsWithTime: AuctionView[] = useMemo(() => {
    return auctions.map((auction) => {
      const remaining = auction.endsAtMs - nowMs;
      return {
        ...auction,
        hasEnded: remaining <= 0,
        timeLabel: formatDuration(remaining),
        nextBid: auction.currentBidThb + auction.minIncrementThb,
      };
    });
  }, [auctions, nowMs]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Buyer</p>
            <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/customer" className={topNavLinkClass(true)}>
              Dashboard
            </Link>
            <Link href="/customer/progress" className={topNavLinkClass(false)}>
              Progress
            </Link>
            <Link href="/customer/payments" className={topNavLinkClass(false)}>
              Payments
            </Link>
            <Link href="/customer/profile" className={topNavLinkClass(false)}>
              Profile
            </Link>
            <Link
              href="/"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400"
            >
              Landing
            </Link>
            {session ? (
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setSession(null);
                }}
                className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        {session?.role !== "buyer" ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Sign in as a buyer to access bidding, progress tracking, and payment pages.
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live auctions</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {auctionsWithTime.filter((item) => item.status === "live").length}
            </p>
          </div>
          <Link
            href="/customer/progress"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Won items</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{wonItemCount}</p>
          </Link>
          <Link
            href="/customer/payments"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Unread notifications</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{unreadCount}</p>
          </Link>
        </section>

        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Live Auctions</h2>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
                {auctionsWithTime.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">Open any item to place realtime bids.</p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {auctionsWithTime.length === 0 ? (
                <p className="text-sm text-zinc-600">No auctions available.</p>
              ) : (
                auctionsWithTime.map((auction) => (
                  <Link
                    key={auction.id}
                    href={`/customer/${auction.id}`}
                    className="rounded-md border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-zinc-900">{auction.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{auction.series}</p>
                      </div>
                      <span
                        className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          auction.status === "live"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : auction.status === "paid_escrowed"
                              ? "border-sky-300 bg-sky-50 text-sky-800"
                              : auction.status === "payment_failed"
                                ? "border-rose-300 bg-rose-50 text-rose-800"
                                : "border-zinc-300 bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {auction.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Current</p>
                        <p className="mt-1 text-lg font-semibold text-zinc-900">{formatThb(auction.currentBidThb)}</p>
                      </div>
                      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Next</p>
                        <p className="mt-1 text-lg font-semibold text-zinc-900">{formatThb(auction.nextBid)}</p>
                      </div>
                      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Time left</p>
                        <p
                          className={`mt-1 text-lg font-semibold ${
                            auction.hasEnded ? "text-zinc-400" : "text-zinc-900"
                          }`}
                        >
                          {auction.timeLabel}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Quick Access</h2>
              <p className="mt-1 text-sm text-zinc-600">Open focused pages instead of dashboard clutter.</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <Link
                  href="/customer/progress"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  Won Item Progress
                </Link>
                <Link
                  href="/customer/payments"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  Payments
                </Link>
                <Link
                  href="/customer/profile"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  Profile
                </Link>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Recent Notifications</h2>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
                  {notifications.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">Outbid, payment, and account updates.</p>

              <div className="mt-3 flex flex-col gap-2">
                {notifications.length === 0 ? (
                  <p className="text-sm text-zinc-600">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(item.id);
                        setNotifications((previous) =>
                          previous.map((entry) =>
                            entry.id === item.id ? { ...entry, read: true } : entry
                          )
                        );
                      }}
                      className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                        item.read
                          ? "border-zinc-200 bg-zinc-50 text-zinc-700"
                          : "border-sky-300 bg-sky-50 text-sky-900"
                      }`}
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs">{item.message}</p>
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}
