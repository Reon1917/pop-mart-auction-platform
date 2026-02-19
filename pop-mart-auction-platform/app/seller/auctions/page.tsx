"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getAllAuctions,
  getSellerListings,
  getSession,
  getSessionUser,
  settleDueAuctions,
  type Auction,
  type SellerListing,
  type Session,
} from "@/app/lib/storage";

type SellerAuctionMonitor = Auction & {
  timeLabel: string;
  ended: boolean;
};

function topNavLinkClass(active: boolean) {
  return `rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
  }`;
}

function listingStatusClass(status: SellerListing["status"]) {
  if (status === "pending") return "border-amber-300 bg-amber-50 text-amber-800";
  if (status === "approved") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  return "border-rose-300 bg-rose-50 text-rose-700";
}

function auctionStatusClass(status: Auction["status"]) {
  if (status === "live") return "border-sky-300 bg-sky-50 text-sky-800";
  if (status === "paid_escrowed") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (status === "payment_failed") return "border-rose-300 bg-rose-50 text-rose-700";
  return "border-zinc-300 bg-zinc-100 text-zinc-700";
}

export default function SellerAuctionsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      const allAuctions = getAllAuctions();
      const allListings = getSellerListings();

      setSession(nextSession);
      if (nextUser?.role === "seller") {
        setAuctions(
          allAuctions
            .filter((item) => item.sellerId === nextUser.id)
            .sort((a, b) => b.createdAtMs - a.createdAtMs)
        );
        setListings(
          allListings
            .filter((item) => item.sellerId === nextUser.id)
            .sort((a, b) => b.createdAtMs - a.createdAtMs)
        );
      } else {
        setAuctions([]);
        setListings([]);
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

  const auctionMonitor = useMemo<SellerAuctionMonitor[]>(() => {
    return auctions.map((item) => {
      const remaining = item.endsAtMs - nowMs;
      return {
        ...item,
        ended: remaining <= 0,
        timeLabel: formatDuration(remaining),
      };
    });
  }, [auctions, nowMs]);

  const liveAuctions = auctionMonitor.filter((item) => item.status === "live");
  const pendingListings = listings.filter((item) => item.status === "pending");
  const rejectedListings = listings.filter((item) => item.status === "rejected");
  const approvedListings = listings.filter((item) => item.status === "approved");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Seller</p>
            <h1 className="text-lg font-semibold text-zinc-900">Auctions</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/seller" className={topNavLinkClass(false)}>
              Dashboard
            </Link>
            <Link href="/seller/auctions" className={topNavLinkClass(true)}>
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
            Sign in as a seller to view listing decisions and monitor auctions.
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active auctions</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{liveAuctions.length}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending approvals</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{pendingListings.length}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Rejected listings</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{rejectedListings.length}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Approved listings</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{approvedListings.length}</p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
              <section className="rounded-md border border-zinc-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900">Listing Review Results</h2>
                  <Link
                    href="/seller"
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400"
                  >
                    New Listing
                  </Link>
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  Rejected requests show the exact admin reason so sellers can correct and resubmit.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  {listings.length === 0 ? (
                    <p className="text-sm text-zinc-600">No listing requests submitted yet.</p>
                  ) : (
                    listings.map((item) => (
                      <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-zinc-900">{item.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                              {item.series} | Start {formatThb(item.startingBidThb)} | +{formatThb(item.minIncrementThb)} | {item.durationHours}h
                            </p>
                          </div>
                          <span
                            className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${listingStatusClass(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {item.status === "rejected" ? (
                          <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            Rejection reason: {item.reviewReason || "No reason provided."}
                          </p>
                        ) : null}

                        {item.status === "approved" ? (
                          <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            Approved and published as auction {item.approvedAuctionId}.
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-md border border-zinc-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-zinc-900">Active Auction Monitor</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Live state updates for active listings with bid level, timer, and payment outcome status.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  {auctionMonitor.length === 0 ? (
                    <p className="text-sm text-zinc-600">No approved auctions yet.</p>
                  ) : (
                    auctionMonitor.map((item) => (
                      <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-zinc-900">{item.title}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                              Current {formatThb(item.currentBidThb)} | Bids {item.bidsCount} | Increment {formatThb(item.minIncrementThb)}
                            </p>
                          </div>
                          <span
                            className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${auctionStatusClass(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                            Time remaining: {item.timeLabel}
                          </div>
                          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                            {item.ended ? "Auction window closed." : "Auction currently running."}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
