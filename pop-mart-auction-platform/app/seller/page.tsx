"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  clearSession,
  createSellerListingRequest,
  ensurePrototypeData,
  getAllAuctions,
  getEscrowCases,
  getNotificationsForUser,
  getSellerListings,
  getSession,
  getSessionUser,
  settleDueAuctions,
  type Auction,
  type NotificationRecord,
  type SellerListing,
  type Session,
} from "@/app/lib/storage";

type SellerAuctionView = Auction & {
  timeLabel: string;
  ended: boolean;
};

type StatusMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

function topNavLinkClass(active: boolean) {
  return `rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
  }`;
}

export default function SellerPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [soldItemCount, setSoldItemCount] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [title, setTitle] = useState("HIRONO Mime Limited");
  const [series, setSeries] = useState("HIRONO");
  const [startingBidThb, setStartingBidThb] = useState(3600);
  const [minIncrementThb, setMinIncrementThb] = useState(100);
  const [durationHours, setDurationHours] = useState(6);

  const [statusMessage, setStatusMessage] = useState<StatusMessage>({
    tone: "neutral",
    text: "Submit listings for admin approval. Only approved listings become live auctions.",
  });

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      const allAuctions = getAllAuctions();
      const allCases = getEscrowCases();
      const allListings = getSellerListings();

      setSession(nextSession);
      if (nextUser?.role === "seller") {
        setSellerId(nextUser.id);
        setAuctions(allAuctions.filter((item) => item.sellerId === nextUser.id));
        setListings(
          allListings
            .filter((item) => item.sellerId === nextUser.id)
            .sort((a, b) => b.createdAtMs - a.createdAtMs)
        );
        setNotifications(getNotificationsForUser(nextUser.id));
        setSoldItemCount(allCases.filter((item) => item.sellerId === nextUser.id).length);
      } else {
        setSellerId(null);
        setAuctions([]);
        setListings([]);
        setNotifications([]);
        setSoldItemCount(0);
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

  const sellerAuctions: SellerAuctionView[] = useMemo(() => {
    return auctions.map((item) => {
      const remaining = item.endsAtMs - nowMs;
      return {
        ...item,
        ended: remaining <= 0,
        timeLabel: formatDuration(remaining),
      };
    });
  }, [auctions, nowMs]);

  const pendingListingsCount = listings.filter((item) => item.status === "pending").length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sellerId) {
      setStatusMessage({
        tone: "warning",
        text: "Sign in as seller to submit listings.",
      });
      return;
    }

    const result = createSellerListingRequest({
      sellerId,
      title,
      series,
      startingBidThb,
      minIncrementThb,
      durationHours,
    });

    setStatusMessage({ tone: result.ok ? "success" : "warning", text: result.message });

    if (result.ok) {
      setTitle("New Pop Mart Figure");
      setSeries("Pop Mart");
      setStartingBidThb(3000);
      setMinIncrementThb(100);
      setDurationHours(6);
    }
  }

  const messageToneClass =
    statusMessage.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : statusMessage.tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-50 text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Seller</p>
            <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/seller" className={topNavLinkClass(true)}>
              Dashboard
            </Link>
            <Link href="/seller/auctions" className={topNavLinkClass(false)}>
              Auctions
            </Link>
            <Link href="/seller/payouts" className={topNavLinkClass(false)}>
              Payouts
            </Link>
            <Link href="/seller/profile" className={topNavLinkClass(false)}>
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
                  setSellerId(null);
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
        {session?.role !== "seller" ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Sign in as a seller to submit listings and manage approved auctions.
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Link
            href="/seller/auctions"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active auctions</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {sellerAuctions.filter((item) => item.status === "live").length}
            </p>
          </Link>
          <Link
            href="/seller/auctions"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending approvals</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{pendingListingsCount}</p>
          </Link>
          <Link
            href="/seller/payouts"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Sold items</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{soldItemCount}</p>
          </Link>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Notifications</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{notifications.length}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Submit Listing for Approval</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Admin approval is required before an auction can be published live.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Item Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. HIRONO Mime Limited"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Series</span>
                <input
                  value={series}
                  onChange={(event) => setSeries(event.target.value)}
                  placeholder="e.g. HIRONO"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Starting Bid (THB)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={startingBidThb}
                    onChange={(event) => setStartingBidThb(Number(event.target.value))}
                    placeholder="3000"
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Min Increment (THB)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={minIncrementThb}
                    onChange={(event) => setMinIncrementThb(Number(event.target.value))}
                    placeholder="100"
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Duration (Hours)</span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={durationHours}
                  onChange={(event) => setDurationHours(Number(event.target.value))}
                  placeholder="1 - 24"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
              </label>

              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Submit for Admin Review
              </button>
            </form>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Quick Access</h2>
              <p className="mt-1 text-sm text-zinc-600">Open focused pages for profile and settlement details.</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <Link
                  href="/seller/auctions"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  Auctions Monitor
                </Link>
                <Link
                  href="/seller/payouts"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  Verification and Payouts
                </Link>
                <Link
                  href="/seller/profile"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  Seller Profile
                </Link>
              </div>
            </section>

            <section className={`rounded-md border px-4 py-3 text-sm ${messageToneClass}`}>
              {statusMessage.text}
            </section>
          </aside>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Listing Requests</h2>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
                {listings.length}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {listings.length === 0 ? (
                <p className="text-sm text-zinc-600">No listing requests yet.</p>
              ) : (
                listings.map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                          {item.series} | {formatThb(item.startingBidThb)} start | +{formatThb(item.minIncrementThb)} | {item.durationHours}h
                        </p>
                      </div>
                      <span
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          item.status === "pending"
                            ? "border-amber-300 bg-amber-50 text-amber-800"
                            : item.status === "approved"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : "border-rose-300 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {item.status === "rejected" ? (
                      <p className="mt-2 text-sm text-rose-700">Rejection reason: {item.reviewReason}</p>
                    ) : null}

                    {item.status === "approved" ? (
                      <p className="mt-2 text-sm text-emerald-700">Approved and published live.</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Your Auctions</h2>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
                {sellerAuctions.length}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {sellerAuctions.length === 0 ? (
                <p className="text-sm text-zinc-600">No approved live auctions yet.</p>
              ) : (
                sellerAuctions.map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <p className="font-semibold text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Current {formatThb(item.currentBidThb)} | {item.timeLabel}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">Status: {item.status.replaceAll("_", " ")}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>

        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Recent Notifications</h2>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
              {notifications.length}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-zinc-600">No notifications yet.</p>
            ) : (
              notifications.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
                  <p className="font-semibold text-zinc-900">{item.title}</p>
                  <p className="mt-1 text-zinc-700">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
