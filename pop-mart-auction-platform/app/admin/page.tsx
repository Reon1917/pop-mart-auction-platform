"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import { formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getAllAuctions,
  getDisputes,
  getEscrowCases,
  getReportsSummary,
  getSession,
  settleDueAuctions,
  type ReportsSummary,
  type Session,
} from "@/app/lib/storage";

type Snapshot = {
  liveAuctions: number;
  heldEscrows: number;
  openDisputes: number;
};

const EMPTY_REPORT: ReportsSummary = {
  transactionCount: 0,
  grossVolumeThb: 0,
  serviceFeeRevenueThb: 0,
  refundsThb: 0,
  payoutsThb: 0,
  failedPaymentCount: 0,
  openDisputeCount: 0,
  heldEscrowCount: 0,
  gatewayAttemptCount: 0,
  gatewayFailureCount: 0,
};

const EMPTY_SNAPSHOT: Snapshot = {
  liveAuctions: 0,
  heldEscrows: 0,
  openDisputes: 0,
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [report, setReport] = useState<ReportsSummary>(EMPTY_REPORT);
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const auctions = getAllAuctions();
      const cases = getEscrowCases();
      const disputes = getDisputes();

      setSession(getSession());
      setReport(getReportsSummary());
      setSnapshot({
        liveAuctions: auctions.filter((item) => item.status === "live").length,
        heldEscrows: cases.filter((item) => item.escrowStatus === "held").length,
        openDisputes: disputes.filter((item) => item.status === "open").length,
      });
    };

    refresh();
    const timer = window.setInterval(refresh, 1200);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <AdminHeader
        active="dashboard"
        title="Dashboard"
        subtitle="Control room overview with focused pages for each admin workflow."
        session={session}
        onSignOut={() => {
          clearSession();
          setSession(null);
        }}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        {session?.role !== "admin" ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Sign in as admin to run monitoring, verification, disputes, moderation, and reporting.
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Link
            href="/admin/monitor"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Live auctions</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{snapshot.liveAuctions}</p>
          </Link>
          <Link
            href="/admin/verification"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Held escrows</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{snapshot.heldEscrows}</p>
          </Link>
          <Link
            href="/admin/disputes"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Open disputes</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{snapshot.openDisputes}</p>
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Failed payments</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{report.failedPaymentCount}</p>
          </Link>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-zinc-600">Open a focused page for each requirement area.</p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                href="/admin/monitor"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
              >
                Live Monitoring
              </Link>
              <Link
                href="/admin/verification"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
              >
                Escrow and Verification
              </Link>
              <Link
                href="/admin/disputes"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
              >
                Dispute Resolution
              </Link>
              <Link
                href="/admin/users"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
              >
                User Moderation
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 sm:col-span-2"
              >
                Transaction and Revenue Reports
              </Link>
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Reporting Snapshot</h2>
            <p className="mt-1 text-sm text-zinc-600">Current totals from the mock ledger.</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gross volume</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{formatThb(report.grossVolumeThb)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fee revenue</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{formatThb(report.serviceFeeRevenueThb)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Refunds</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{formatThb(report.refundsThb)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Payouts</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">{formatThb(report.payoutsThb)}</p>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
