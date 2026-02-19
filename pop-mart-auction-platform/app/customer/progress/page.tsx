"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatThb } from "@/app/lib/format";
import {
  clearSession,
  createDispute,
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

export default function CustomerProgressPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [cases, setCases] = useState<EscrowCase[]>([]);
  const [paymentGatewayLogs, setPaymentGatewayLogs] = useState<PaymentGatewayLog[]>([]);
  const [disputeReason, setDisputeReason] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState(
    "Track verification, shipment, and closure progress for won auctions."
  );

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      setSession(nextSession);

      if (nextUser?.role === "buyer") {
        setBuyerId(nextUser.id);
        setCases(getEscrowCases().filter((item) => item.buyerId === nextUser.id));
        setPaymentGatewayLogs(getPaymentGatewayLogs().filter((item) => item.buyerId === nextUser.id));
      } else {
        setBuyerId(null);
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

  const openCases = cases.filter((item) => item.escrowStatus === "held").length;
  const closedCases = cases.length - openCases;
  const refundedCases = cases.filter((item) => item.escrowStatus === "refunded").length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Buyer</p>
            <h1 className="text-lg font-semibold text-zinc-900">Won Item Progress</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/customer" className={topNavLinkClass(false)}>
              Dashboard
            </Link>
            <Link href="/customer/progress" className={topNavLinkClass(true)}>
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
                  setBuyerId(null);
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
            Sign in as a buyer to view won item progress.
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Open cases</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{openCases}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Closed cases</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{closedCases}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Refunded cases</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">{refundedCases}</p>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Won Item Timeline</h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Each case is closed only after verification and final settlement.
                  </p>
                </div>
                <Link
                  href="/customer/payments"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400"
                >
                  Open Payments
                </Link>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {cases.length === 0 ? (
                  <p className="text-sm text-zinc-600">No won items yet.</p>
                ) : (
                  cases.map((item) => {
                    const gateway = latestGatewayByAuction.get(item.auctionId);

                    return (
                      <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                        <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Verification {item.verificationStatus} | Shipment {item.shipmentStatus}
                        </p>
                        <p className="mt-2 text-sm text-zinc-700">
                          Escrow: {item.escrowStatus} | Amount {formatThb(item.grossAmountThb)}
                        </p>
                        <p className="mt-1 text-sm text-zinc-700">
                          Gateway: <span className="font-semibold text-zinc-900">{gateway?.status ?? "no log"}</span>
                          {gateway?.message ? <span className="text-zinc-600"> | {gateway.message}</span> : null}
                        </p>

                        <div className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-3">
                          <div className="flex flex-col gap-2">
                            {[
                              {
                                label: "Payment held",
                                done:
                                  item.escrowStatus === "held" ||
                                  item.escrowStatus === "released" ||
                                  item.escrowStatus === "refunded",
                              },
                              {
                                label: "Verification completed",
                                done: item.verificationStatus !== "pending",
                              },
                              {
                                label: "Courier picked up item",
                                done:
                                  item.shipmentStatus === "picked_up" ||
                                  item.shipmentStatus === "in_transit" ||
                                  item.shipmentStatus === "delivered",
                              },
                              {
                                label: "Shipment in transit",
                                done:
                                  item.shipmentStatus === "in_transit" ||
                                  item.shipmentStatus === "delivered",
                              },
                              {
                                label: "Case closed",
                                done: item.escrowStatus !== "held",
                              },
                            ].map((stage) => (
                              <div key={stage.label} className="flex items-center gap-2.5">
                                <span
                                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold ${
                                    stage.done
                                      ? "border-zinc-900 bg-zinc-900 text-white"
                                      : "border-zinc-300 bg-white text-zinc-500"
                                  }`}
                                >
                                  {stage.done ? "OK" : ".."}
                                </span>
                                <p className={`text-sm ${stage.done ? "text-zinc-900" : "text-zinc-500"}`}>
                                  {stage.label}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                          {item.verificationStatus === "failed"
                            ? "Verification failed and refund issued."
                            : item.escrowStatus === "released"
                              ? "Delivered and payout released to seller."
                              : item.shipmentStatus === "delivered"
                                ? "Delivered; final settlement in progress."
                                : "Case is still in progress."}
                        </div>

                        {buyerId ? (
                          <div className="mt-3">
                            <input
                              value={disputeReason[item.id] ?? ""}
                              onChange={(event) =>
                                setDisputeReason((previous) => ({
                                  ...previous,
                                  [item.id]: event.target.value,
                                }))
                              }
                              placeholder="Dispute reason"
                              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const reason = (disputeReason[item.id] ?? "").trim();
                                if (!reason) {
                                  setStatusMessage("Enter a dispute reason before submitting.");
                                  return;
                                }

                                const result = createDispute({
                                  caseId: item.id,
                                  createdByUserId: buyerId,
                                  reason,
                                });

                                setStatusMessage(result.message);
                                if (result.ok) {
                                  setDisputeReason((previous) => ({ ...previous, [item.id]: "" }));
                                }
                              }}
                              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                            >
                              Open Dispute
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700">
              {statusMessage}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
