"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearSession,
  ensurePrototypeData,
  getAllAuctions,
  getEscrowCases,
  getMockCredentials,
  getSession,
  getDisputes,
  type Session,
} from "@/app/lib/storage";

type Snapshot = {
  liveAuctions: number;
  escrowCases: number;
  openDisputes: number;
};

const EMPTY: Snapshot = {
  liveAuctions: 0,
  escrowCases: 0,
  openDisputes: 0,
};

export default function HomePage() {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      const auctions = getAllAuctions();
      const escrowCases = getEscrowCases();
      const disputes = getDisputes();
      setSnapshot({
        liveAuctions: auctions.filter((item) => item.status === "live").length,
        escrowCases: escrowCases.length,
        openDisputes: disputes.filter((item) => item.status === "open").length,
      });
      setSession(getSession());
    };

    refresh();
    const timer = window.setInterval(refresh, 1500);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Prototype Demo
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Pop Mart Auction Platform</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Login
            </Link>
            <Link
              href={sessionRoute}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {session ? "Dashboard" : "Open Flow"}
            </Link>
            {session ? (
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setSession(null);
                }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
              >
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <section className="rounded-md border border-zinc-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-zinc-900">Auction Operations Snapshot</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Live prototype data for auctions, fulfillment, and disputes.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live auctions</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{snapshot.liveAuctions}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Escrow cases</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{snapshot.escrowCases}</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Open disputes</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{snapshot.openDisputes}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="rounded-md border border-zinc-200 bg-white p-5">
            <h3 className="text-base font-semibold text-zinc-900">Buyer</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Realtime bids, outbid notifications, payment, refund, and shipment tracking.
            </p>
            <Link
              href="/customer"
              className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
            >
              Open Buyer
            </Link>
          </article>

          <article className="rounded-md border border-zinc-200 bg-white p-5">
            <h3 className="text-base font-semibold text-zinc-900">Seller</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Duration-limited listing, sold alerts, verification tracking, and fee deductions.
            </p>
            <Link
              href="/seller"
              className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
            >
              Open Seller
            </Link>
          </article>

          <article className="rounded-md border border-zinc-200 bg-white p-5">
            <h3 className="text-base font-semibold text-zinc-900">Admin</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Escrow control, verification workflow, monitoring, disputes, moderation, reports.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
            >
              Open Admin
            </Link>
          </article>
        </section>
      </main>
    </div>
  );
}
