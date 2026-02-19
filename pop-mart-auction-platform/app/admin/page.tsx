"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatThb } from "@/app/lib/format";
import {
  advanceEscrowWorkflow,
  closeAuctionAndProcessPayment,
  clearSession,
  ensurePrototypeData,
  getAllAuctions,
  getAllUsers,
  getBidActivity,
  getDisputes,
  getEscrowCases,
  getMockCredentials,
  getReportsSummary,
  getSession,
  getTransactions,
  resetPrototypeData,
  resolveDispute,
  runMockCompetingBidTick,
  runPaymentRetryNow,
  setUserBalance,
  setUserStatus,
  settleDueAuctions,
  type Auction,
  type BidActivityEvent,
  type DisputeCase,
  type EscrowCase,
  type ReportsSummary,
  type Session,
  type TransactionRecord,
  type UserAccount,
} from "@/app/lib/storage";

type AdminTab = "monitor" | "verification" | "disputes" | "users" | "reports";

type UiMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
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
};

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("monitor");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [events, setEvents] = useState<BidActivityEvent[]>([]);
  const [escrowCases, setEscrowCases] = useState<EscrowCase[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [report, setReport] = useState<ReportsSummary>(EMPTY_REPORT);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<UiMessage>({
    tone: "neutral",
    text: "Admin controls are active.",
  });

  const refreshData = useCallback(() => {
    settleDueAuctions();
    setSession(getSession());
    setAuctions(getAllAuctions());
    setEvents(getBidActivity());
    setEscrowCases(getEscrowCases());
    setDisputes(getDisputes());
    setUsers(getAllUsers());
    setTransactions(getTransactions());
    setReport(getReportsSummary());
  }, []);

  useEffect(() => {
    ensurePrototypeData();
    const rafId = window.requestAnimationFrame(refreshData);
    const timer = window.setInterval(refreshData, 1200);
    window.addEventListener("storage", refreshData);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearInterval(timer);
      window.removeEventListener("storage", refreshData);
    };
  }, [refreshData]);

  const userMap = useMemo(() => {
    return new Map(users.map((item) => [item.id, item.name]));
  }, [users]);

  const liveAuctions = auctions.filter((item) => item.status === "live");
  const sortedAuctions = [...auctions].sort((a, b) => b.createdAtMs - a.createdAtMs);
  const demoBuyer = users.find((item) => item.email.toLowerCase() === "buyer@popmart.demo") ?? null;

  function updateMessage(tone: UiMessage["tone"], text: string) {
    setMessage({ tone, text });
  }

  function handleEscrowAction(
    caseId: string,
    action: "pickup" | "verify_pass" | "verify_fail" | "ship_to_buyer" | "mark_delivered"
  ) {
    const result = advanceEscrowWorkflow(caseId, action);
    updateMessage(result.ok ? "success" : "warning", result.message);
    refreshData();
  }

  function handleResolve(
    disputeId: string,
    status: "resolved_refund" | "resolved_release" | "rejected"
  ) {
    const note = (resolutionNote[disputeId] ?? "").trim() || "Resolved by admin.";
    const result = resolveDispute(disputeId, { status, note });
    updateMessage(result.ok ? "success" : "warning", result.message);
    refreshData();
  }

  function handleUserStatus(userId: string, status: "active" | "suspended" | "banned") {
    const result = setUserStatus(userId, status, "Updated by admin moderation.");
    updateMessage(result.ok ? "success" : "warning", result.message);
    refreshData();
  }

  function handleSimulatedBid(auctionId: string) {
    const result = runMockCompetingBidTick(auctionId);
    updateMessage(result.ok ? "success" : "warning", result.message);
    refreshData();
  }

  function handleCloseAndProcess(auctionId: string) {
    const result = closeAuctionAndProcessPayment(auctionId);
    updateMessage(result.ok ? "success" : "warning", result.message);
    refreshData();
  }

  function handleRetryNow(auctionId: string) {
    const result = runPaymentRetryNow(auctionId);
    updateMessage(result.ok ? "success" : "warning", result.message);
    refreshData();
  }

  function handleSetDemoBuyerFunds(balanceThb: number) {
    if (!demoBuyer) {
      updateMessage("warning", "Demo buyer account not found.");
      return;
    }

    const result = setUserBalance(demoBuyer.id, balanceThb);
    updateMessage(result.ok ? "success" : "warning", result.message);
    refreshData();
  }

  function handleResetDemo() {
    resetPrototypeData();
    updateMessage("success", "Demo data reset.");
    refreshData();
  }

  const messageToneClass =
    message.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : message.tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-50 text-zinc-700";

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Admin Dashboard
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Escrow, Moderation, and Reports</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Landing
            </Link>
            <Link
              href={sessionRoute}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Dashboard
            </Link>
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
            ) : (
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <section className={`rounded-md border px-5 py-4 text-sm ${messageToneClass}`}>{message.text}</section>

        <section className="flex flex-wrap gap-2">
          {[
            { key: "monitor" as const, label: "Live Monitoring" },
            { key: "verification" as const, label: "Escrow & Verification" },
            { key: "disputes" as const, label: "Disputes" },
            { key: "users" as const, label: "User Moderation" },
            { key: "reports" as const, label: "Reports" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                activeTab === tab.key
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </section>

        {activeTab === "monitor" ? (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Demo Controls</h2>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                  Live {liveAuctions.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Use buttons to run demo scenarios without console commands.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleSetDemoBuyerFunds(10)}
                  disabled={!demoBuyer}
                  className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800 transition hover:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Low Funds
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDemoBuyerFunds(22000)}
                  disabled={!demoBuyer}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Restore Funds
                </button>
                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-400"
                >
                  Reset Demo
                </button>
              </div>

              <div className="mt-4 flex max-h-[30rem] flex-col gap-2 overflow-y-auto">
                {sortedAuctions.length === 0 ? (
                  <p className="text-sm text-zinc-600">No auctions available.</p>
                ) : (
                  sortedAuctions.map((item) => (
                    <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900">{item.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                            {item.status.replaceAll("_", " ")} • Current {formatThb(item.currentBidThb)}
                          </p>
                          {item.paymentRetryDueAtMs ? (
                            <p className="mt-1 text-xs text-zinc-600">
                              Retry due {new Date(item.paymentRetryDueAtMs).toLocaleTimeString()}
                            </p>
                          ) : null}
                        </div>
                        <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
                          bids {item.bidsCount}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => handleSimulatedBid(item.id)}
                          disabled={item.status !== "live"}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Simulate Bid
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCloseAndProcess(item.id)}
                          disabled={item.status === "paid_escrowed" || item.status === "payment_failed"}
                          className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                        >
                          Close + Process
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRetryNow(item.id)}
                          disabled={!(item.status === "ended" && item.paymentAttempts > 0)}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Retry Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Bid Activity Stream</h2>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                  {events.length}
                </span>
              </div>
              <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-sm text-zinc-600">No bid events yet.</p>
                ) : (
                  events.slice(0, 20).map((event) => (
                    <div key={event.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
                      <p className="font-semibold text-zinc-900">
                        {event.bidderName} bid {formatThb(event.amountThb)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {event.mode} • {new Date(event.createdAtMs).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === "verification" ? (
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Escrow & Verification Workflow</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Payment remains in escrow until verification passes and delivery completes.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {escrowCases.length === 0 ? (
                <p className="text-sm text-zinc-600">No escrow cases yet.</p>
              ) : (
                escrowCases.map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Buyer {userMap.get(item.buyerId) ?? item.buyerId} • Seller {userMap.get(item.sellerId) ?? item.sellerId}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-700">Escrow {item.escrowStatus}</p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-700 sm:grid-cols-4">
                      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">Verification: {item.verificationStatus}</div>
                      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">Shipment: {item.shipmentStatus}</div>
                      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">Payout: {item.payoutStatus}</div>
                      <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">Net: {formatThb(item.netPayoutThb)}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <button
                        type="button"
                        onClick={() => handleEscrowAction(item.id, "pickup")}
                        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                      >
                        Pickup
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEscrowAction(item.id, "verify_pass")}
                        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                      >
                        Verify Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEscrowAction(item.id, "verify_fail")}
                        className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-400"
                      >
                        Verify Fail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEscrowAction(item.id, "ship_to_buyer")}
                        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                      >
                        Ship
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEscrowAction(item.id, "mark_delivered")}
                        className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
                      >
                        Delivered
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "disputes" ? (
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Dispute Resolution</h2>

            <div className="mt-4 flex flex-col gap-3">
              {disputes.length === 0 ? (
                <p className="text-sm text-zinc-600">No disputes opened.</p>
              ) : (
                disputes.map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                    <p className="font-semibold text-zinc-900">Dispute {item.id.slice(-8)}</p>
                    <p className="mt-1 text-sm text-zinc-700">Reason: {item.reason}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Status {item.status.replaceAll("_", " ")}
                    </p>

                    {item.status === "open" ? (
                      <div className="mt-3">
                        <input
                          value={resolutionNote[item.id] ?? ""}
                          onChange={(event) =>
                            setResolutionNote((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          placeholder="Resolution note"
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                        />
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => handleResolve(item.id, "resolved_refund")}
                            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                          >
                            Resolve Refund
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolve(item.id, "resolved_release")}
                            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                          >
                            Resolve Release
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolve(item.id, "rejected")}
                            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-700">{item.resolutionNote || "Resolved."}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "users" ? (
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">User Moderation</h2>

            <div className="mt-4 flex flex-col gap-3">
              {users
                .filter((item) => item.role !== "admin")
                .map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                          {item.role} • status {item.status} • failed payments {item.failedPaymentIncidents}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUserStatus(item.id, "active")}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUserStatus(item.id, "suspended")}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                        >
                          Suspend
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUserStatus(item.id, "banned")}
                          className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-400"
                        >
                          Ban
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ) : null}

        {activeTab === "reports" ? (
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Transaction & Revenue Reports</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gross volume</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(report.grossVolumeThb)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Fee revenue</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(report.serviceFeeRevenueThb)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Refunds</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(report.refundsThb)}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Payouts</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(report.payoutsThb)}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Transactions: {report.transactionCount}
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Failed payments: {report.failedPaymentCount}
              </div>
              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Held escrows: {report.heldEscrowCount}
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
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
                    transactions.slice(0, 20).map((item) => (
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
        ) : null}
      </main>
    </div>
  );
}
