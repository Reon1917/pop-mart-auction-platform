"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearSession,
  ensureAdminEscrow,
  ensureAdminScreening,
  ensureCustomerAuctions,
  getMockCredentials,
  getPendingListings,
  getSession,
  type Session,
} from "@/app/lib/storage";

type LandingStats = {
  auctions: number;
  screeningItems: number;
  escrowCases: number;
};

const EMPTY_STATS: LandingStats = {
  auctions: 0,
  screeningItems: 0,
  escrowCases: 0,
};

function computeStats(): LandingStats {
  if (typeof window === "undefined") {
    return EMPTY_STATS;
  }

  const auctions = ensureCustomerAuctions();
  const screening = ensureAdminScreening();
  const escrow = ensureAdminEscrow();
  const pendingListings = getPendingListings();

  return {
    auctions: auctions.length,
    screeningItems: screening.length + pendingListings.length,
    escrowCases: escrow.length,
  };
}

const flows = [
  {
    title: "Buyer",
    detail: "View an item and place bids with minimum validation.",
    href: "/customer",
  },
  {
    title: "Seller",
    detail: "Submit a listing into the screening queue.",
    href: "/seller",
  },
  {
    title: "Admin",
    detail: "Screen items, then process payment cases.",
    href: "/admin",
  },
] as const;

export default function HomePage() {
  const [stats, setStats] = useState<LandingStats>(EMPTY_STATS);
  const [session, setSession] = useState<Session | null>(null);

  const refreshAll = () => {
    setStats(computeStats());
    setSession(getSession());
  };

  useEffect(() => {
    const rafId = window.requestAnimationFrame(refreshAll);

    const onFocus = () => refreshAll();
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      onFocus();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-sm font-bold text-white">
              PM
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Pop Mart Auction</p>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Prototype</p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Login
            </Link>
            <Link
              href={sessionRoute}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {session ? "Dashboard" : "Open"}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
        <section className="rounded-2xl border border-zinc-200 bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Requirement engineering prototype
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-900 sm:text-5xl">
            Pop Mart Auction Platform
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            A simple no-backend demo of screened listings, escrow protection,
            and controlled payout flow.
          </p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Auctions {stats.auctions} • Screening {stats.screeningItems} • Escrow {stats.escrowCases}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Open login
            </Link>
            <Link
              href={sessionRoute}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
            >
              {session ? "Continue" : "Preview flows"}
            </Link>
          </div>
        </section>

        {session ? (
          <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Signed in as {session.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{session.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={sessionRoute}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Go to dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  refreshAll();
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
              >
                Sign out
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {flows.map((flow) => (
            <article key={flow.title} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h2 className="text-base font-semibold text-zinc-900">{flow.title}</h2>
              <p className="mt-2 text-sm text-zinc-600">{flow.detail}</p>
              <div className="mt-4">
                <Link
                  href={flow.href}
                  className="inline-flex items-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                >
                  Open {flow.title}
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
