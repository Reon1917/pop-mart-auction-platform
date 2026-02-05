"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  addPendingListing,
  clearSession,
  ensureCustomerAuctions,
  getCustomerAuctions,
  getMockCredentials,
  getPendingListings,
  getSession,
  resetPrototypeData,
  STORAGE_KEYS,
  type Session,
  type SellerListing,
} from "@/app/lib/storage";
import type { CustomerAuction } from "@/app/mock/customer-data";

type SellerMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `listing-${Math.random().toString(36).slice(2, 10)}`;
}

export default function SellerPage() {
  const [sellerName, setSellerName] = useState("collector_amy");
  const [title, setTitle] = useState("Skullpanda: Winter Bloom");
  const [series, setSeries] = useState("Skullpanda");
  const [startingPriceThb, setStartingPriceThb] = useState(3600);
  const [durationHours, setDurationHours] = useState(6);

  const [pending, setPending] = useState<SellerListing[]>([]);
  const [auctions, setAuctions] = useState<CustomerAuction[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [session, setSession] = useState<Session | null>(null);

  const [message, setMessage] = useState<SellerMessage>({
    tone: "neutral",
    text: "Submissions go to the admin review queue via localStorage.",
  });

  const handleReset = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Reset demo data and timers? This clears bids, listings, and logs.")
    ) {
      return;
    }
    resetPrototypeData();
    setPending(getPendingListings());
    setAuctions(getCustomerAuctions());
    setNowMs(Date.now());
    setSession(getSession());
    setMessage({
      tone: "neutral",
      text: "Demo data reset. Submissions go to the admin review queue via localStorage.",
    });
  };

  useEffect(() => {
    ensureCustomerAuctions();
    const refresh = () => {
      setPending(getPendingListings());
      setAuctions(getCustomerAuctions());
      setNowMs(Date.now());
      setSession(getSession());
    };

    const rafId = window.requestAnimationFrame(refresh);

    const onFocus = () => refresh();
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (
        event.key === STORAGE_KEYS.pendingListings ||
        event.key === STORAGE_KEYS.customerAuctions ||
        event.key === STORAGE_KEYS.session
      ) {
        refresh();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(timer);
    };
  }, []);

  const sellerPending = useMemo(
    () => pending.filter((item) => item.seller.toLowerCase() === sellerName.toLowerCase()),
    [pending, sellerName]
  );

  const sellerAuctions = useMemo(() => {
    return auctions
      .filter((item) => item.seller.toLowerCase() === sellerName.toLowerCase())
      .map((item) => {
        const msRemaining = item.endsAtMs - nowMs;
        return {
          ...item,
          msRemaining,
          timeLabel: formatDuration(msRemaining),
          ended: msRemaining <= 0,
        };
      });
  }, [auctions, nowMs, sellerName]);

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage({ tone: "warning", text: "Title is required." });
      return;
    }

    if (startingPriceThb <= 0) {
      setMessage({ tone: "warning", text: "Starting price must be positive." });
      return;
    }

    if (durationHours < 1 || durationHours > 24) {
      setMessage({ tone: "warning", text: "Duration must be between 1 and 24 hours." });
      return;
    }

    const listing: SellerListing = {
      id: makeId(),
      title: title.trim(),
      series: series.trim() || "Pop Mart",
      seller: sellerName.trim() || "seller_demo",
      startingPriceThb: Math.round(startingPriceThb),
      durationHours: Math.round(durationHours),
      submittedAtMs: Date.now(),
    };

    const nextPending = addPendingListing(listing);
    setPending(nextPending);
    setMessage({
      tone: "success",
      text: "Submitted. Admins can now approve or reject this listing.",
    });
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
              Seller View
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Listings</h1>
          </div>
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
            >
              Reset demo
            </button>
            <Link
              href="/"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Landing
            </Link>
            {!session ? (
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
              >
                Login
              </Link>
            ) : null}
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

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <section className="flex flex-col gap-2">
          <h2 className="text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Submit, then wait for review.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">
            This flow sends listings to the admin review queue. Approved requests
            become live auctions for customers.
          </p>
        </section>

        {session ? (
          <section className="flex flex-col gap-3 rounded-md border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Signed in as {session.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-700">
                {session.role}
              </p>
            </div>
            <Link
              href={sessionRoute}
              className="rounded-md border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-300"
            >
              Open your dashboard
            </Link>
          </section>
        ) : (
          <section className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">You are not signed in.</p>
            <Link
              href="/login"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Go to login
            </Link>
          </section>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-zinc-900">New Listing</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Duration must be between 1 hour and 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Seller name
                </span>
                <input
                  value={sellerName}
                  onChange={(event) => setSellerName(event.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Title
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Series
                  </span>
                  <input
                    value={series}
                    onChange={(event) => setSeries(event.target.value)}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Starting price (THB)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={startingPriceThb}
                    onChange={(event) => setStartingPriceThb(Number(event.target.value))}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Duration (hours)
                </span>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={durationHours}
                  onChange={(event) => setDurationHours(Number(event.target.value))}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
              </label>

              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Submit for review
              </button>
            </form>
          </section>

          <div className="flex flex-col gap-6">
            <section className={`rounded-md border px-4 py-3 text-sm ${messageToneClass}`}>
              {message.text}
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <div className="flex items-end justify-between">
                <h3 className="text-lg font-semibold text-zinc-900">Your Pending Listings</h3>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  {sellerPending.length}
                </span>
              </div>
              {sellerPending.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">No pending listings.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {sellerPending.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
                    >
                      <p className="font-semibold text-zinc-900">{item.title}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {item.series} • {formatThb(item.startingPriceThb)} • {item.durationHours}h
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <div className="flex items-end justify-between">
                <h3 className="text-lg font-semibold text-zinc-900">Your Live Auctions</h3>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  {sellerAuctions.length}
                </span>
              </div>
              {sellerAuctions.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-600">
                  None yet. Ask an admin to approve your listing.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {sellerAuctions.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-zinc-900">{item.title}</p>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          {item.ended ? "Ended" : item.timeLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Current bid {formatThb(item.currentBidThb)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
