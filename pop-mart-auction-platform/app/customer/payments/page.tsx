"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getEscrowCases,
  getPaymentGatewayLogs,
  getSession,
  getSessionUser,
  settleDueAuctions,
  type EscrowCase,
  type PaymentGatewayLog,
  type Session,
} from "@/app/lib/storage";

function topNavLinkClass(active: boolean) {
  return `rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
  }`;
}

export default function CustomerPaymentsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [cases, setCases] = useState<EscrowCase[]>([]);
  const [paymentGatewayLogs, setPaymentGatewayLogs] = useState<PaymentGatewayLog[]>([]);

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      setSession(nextSession);

      if (nextUser?.role === "buyer") {
        setCases(getEscrowCases().filter((item) => item.buyerId === nextUser.id));
        setPaymentGatewayLogs(getPaymentGatewayLogs().filter((item) => item.buyerId === nextUser.id));
      } else {
        setCases([]);
        setPaymentGatewayLogs([]);
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

  const latestGatewayByAuction = useMemo(() => {
    const map = new Map<string, PaymentGatewayLog>();
    for (const entry of paymentGatewayLogs) {
      if (!map.has(entry.auctionId)) {
        map.set(entry.auctionId, entry);
      }
    }
    return map;
  }, [paymentGatewayLogs]);

  const gatewayAttemptCount = paymentGatewayLogs.filter((item) => item.status === "initiated").length;
  const gatewayFailureCount = paymentGatewayLogs.filter((item) => item.status === "failed").length;
  const capturedCount = paymentGatewayLogs.filter((item) => item.status === "captured").length;
  const refundedAmountThb = cases
    .filter((item) => item.escrowStatus === "refunded")
    .reduce((sum, item) => sum + item.grossAmountThb, 0);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Buyer</p>
            <h1 className="text-lg font-semibold text-zinc-900">Payments</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/customer" className={topNavLinkClass(false)}>
              Dashboard
            </Link>
            <Link href="/customer/progress" className={topNavLinkClass(false)}>
              Progress
            </Link>
            <Link href="/customer/payments" className={topNavLinkClass(true)}>
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
            Sign in as a buyer to view payment details.
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gateway attempts</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{gatewayAttemptCount}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gateway failures</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{gatewayFailureCount}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Captured payments</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{capturedCount}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Refund total</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{formatThb(refundedAmountThb)}</p>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Won Item Payment Status</h2>
              <p className="mt-1 text-sm text-zinc-600">Settlement state for each won auction.</p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                      <th className="px-2 py-2">Item</th>
                      <th className="px-2 py-2">Gateway</th>
                      <th className="px-2 py-2">Escrow</th>
                      <th className="px-2 py-2">Amount</th>
                      <th className="px-2 py-2">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-zinc-600">
                          No won item payments yet.
                        </td>
                      </tr>
                    ) : (
                      cases.map((item) => {
                        const gateway = latestGatewayByAuction.get(item.auctionId);
                        return (
                          <tr key={item.id} className="border-b border-zinc-100 text-zinc-700">
                            <td className="px-2 py-3 font-semibold text-zinc-900">{item.title}</td>
                            <td className="px-2 py-3">{gateway?.status ?? "no log"}</td>
                            <td className="px-2 py-3">{item.escrowStatus}</td>
                            <td className="px-2 py-3">{formatThb(item.grossAmountThb)}</td>
                            <td className="px-2 py-3">
                              {item.escrowStatus === "refunded"
                                ? "Buyer refunded"
                                : item.escrowStatus === "released"
                                  ? "Settled"
                                  : "In progress"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Payment Gateway Activity</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Initiated, authorized, captured, and failed gateway events for your account.
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                      <th className="px-2 py-2">Item</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Attempt</th>
                      <th className="px-2 py-2">Amount</th>
                      <th className="px-2 py-2">Message</th>
                      <th className="px-2 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentGatewayLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-zinc-600">
                          No gateway logs yet.
                        </td>
                      </tr>
                    ) : (
                      paymentGatewayLogs.slice(0, 30).map((item) => {
                        const caseMatch = cases.find((caseItem) => caseItem.auctionId === item.auctionId);
                        return (
                          <tr key={item.id} className="border-b border-zinc-100 text-zinc-700">
                            <td className="px-2 py-3 font-semibold text-zinc-900">
                              {caseMatch?.title ?? item.auctionId}
                            </td>
                            <td className="px-2 py-3">{item.status}</td>
                            <td className="px-2 py-3">{item.attempt}</td>
                            <td className="px-2 py-3">{formatThb(item.amountThb)}</td>
                            <td className="px-2 py-3">{item.message}</td>
                            <td className="px-2 py-3">{new Date(item.createdAtMs).toLocaleTimeString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
