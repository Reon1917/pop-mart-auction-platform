"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import { formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getReportsSummary,
  getSession,
  getTransactions,
  settleDueAuctions,
  type ReportsSummary,
  type Session,
  type TransactionRecord,
} from "@/app/lib/storage";

const EMPTY_REPORT: ReportsSummary = {
  transactionCount: 0,
  grossVolumeThb: 0,
  serviceFeeRevenueThb: 0,
  refundsThb: 0,
  payoutsThb: 0,
  failedPaymentCount: 0,
  openDisputeCount: 0,
  heldEscrowCount: 0,
};

export default function AdminReportsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [report, setReport] = useState<ReportsSummary>(EMPTY_REPORT);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      setSession(getSession());
      setReport(getReportsSummary());
      setTransactions(getTransactions());
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
        active="reports"
        title="Reports"
        subtitle="Transaction and revenue analytics from the prototype ledger."
        session={session}
        onSignOut={() => {
          clearSession();
          setSession(null);
        }}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gross volume</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(report.grossVolumeThb)}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fee revenue</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(report.serviceFeeRevenueThb)}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Refunds</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(report.refundsThb)}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Payouts</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(report.payoutsThb)}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            Transactions: {report.transactionCount}
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            Failed payments: {report.failedPaymentCount}
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            Held escrows: {report.heldEscrowCount}
          </div>
        </section>

        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Transactions</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Fee</th>
                  <th className="px-2 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-zinc-600">
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 24).map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100 text-zinc-700">
                      <td className="px-2 py-3">{item.type.replaceAll("_", " ")}</td>
                      <td className="px-2 py-3">{formatThb(item.amountThb)}</td>
                      <td className="px-2 py-3">{formatThb(item.serviceFeeThb)}</td>
                      <td className="px-2 py-3">{new Date(item.createdAtMs).toLocaleTimeString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
