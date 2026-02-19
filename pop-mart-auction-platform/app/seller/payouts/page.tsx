"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getEscrowCases,
  getSession,
  getSessionUser,
  settleDueAuctions,
  type EscrowCase,
  type Session,
} from "@/app/lib/storage";

function topNavLinkClass(active: boolean) {
  return `rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
  }`;
}

export default function SellerPayoutsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [escrowCases, setEscrowCases] = useState<EscrowCase[]>([]);

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      const allCases = getEscrowCases();

      setSession(nextSession);
      if (nextUser?.role === "seller") {
        setEscrowCases(allCases.filter((item) => item.sellerId === nextUser.id));
      } else {
        setEscrowCases([]);
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const summary = useMemo(() => {
    const gross = escrowCases.reduce((sum, item) => sum + item.grossAmountThb, 0);
    const fee = escrowCases.reduce((sum, item) => sum + item.serviceFeeThb, 0);
    const net = escrowCases.reduce((sum, item) => sum + item.netPayoutThb, 0);
    const released = escrowCases.filter((item) => item.payoutStatus === "released").length;

    return {
      gross,
      fee,
      net,
      released,
    };
  }, [escrowCases]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Seller</p>
            <h1 className="text-lg font-semibold text-zinc-900">Verification and Payouts</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/seller" className={topNavLinkClass(false)}>
              Dashboard
            </Link>
            <Link href="/seller/payouts" className={topNavLinkClass(true)}>
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
            Sign in as a seller to view verification and payout tracking.
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cases</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{escrowCases.length}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gross</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{formatThb(summary.gross)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fee (10%)</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{formatThb(summary.fee)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Released payouts</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{summary.released}</p>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Settlement Table</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Service fee remains fixed at 10% with net payout visibility per sold item.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                      <th className="px-2 py-2">Item</th>
                      <th className="px-2 py-2">Verification</th>
                      <th className="px-2 py-2">Shipment</th>
                      <th className="px-2 py-2">Escrow</th>
                      <th className="px-2 py-2">Gross</th>
                      <th className="px-2 py-2">Fee</th>
                      <th className="px-2 py-2">Net Payout</th>
                      <th className="px-2 py-2">Payout Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrowCases.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-2 py-4 text-zinc-600">
                          No sold items yet.
                        </td>
                      </tr>
                    ) : (
                      escrowCases.map((item) => (
                        <tr key={item.id} className="border-b border-zinc-100 text-zinc-700">
                          <td className="px-2 py-3 font-semibold text-zinc-900">{item.title}</td>
                          <td className="px-2 py-3">{item.verificationStatus}</td>
                          <td className="px-2 py-3">{item.shipmentStatus}</td>
                          <td className="px-2 py-3">{item.escrowStatus}</td>
                          <td className="px-2 py-3">{formatThb(item.grossAmountThb)}</td>
                          <td className="px-2 py-3">{formatThb(item.serviceFeeThb)}</td>
                          <td className="px-2 py-3">{formatThb(item.netPayoutThb)}</td>
                          <td className="px-2 py-3">{item.payoutStatus}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700">
              Net payout total from listed cases: <span className="font-semibold text-zinc-900">{formatThb(summary.net)}</span>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
