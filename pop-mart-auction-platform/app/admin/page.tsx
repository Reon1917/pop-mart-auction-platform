"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatThb } from "@/app/lib/format";
import {
  appendAdminLog,
  clearSession,
  ensureAdminEscrow,
  ensureAdminScreening,
  ensureCustomerAuctions,
  getAdminEscrow,
  getAdminLog,
  getAdminScreening,
  getCustomerAuctions,
  getMockCredentials,
  getPendingListings,
  getSession,
  setAdminEscrow,
  setAdminScreening,
  setCustomerAuctions,
  setPendingListings,
  STORAGE_KEYS,
  type Session,
} from "@/app/lib/storage";
import type { AdminEscrowItem, AdminScreeningItem } from "@/app/mock/admin-data";
import type { CustomerAuction } from "@/app/mock/customer-data";
import type { SellerListing } from "@/app/lib/storage";

type AdminTab = "screening" | "payment";

type QueueItem = {
  source: "admin" | "pending";
  id: string;
  title: string;
  series: string;
  seller: string;
  startingPriceThb: number;
  durationHours: number;
  submittedLabel: string;
  risk: "low" | "medium" | "high";
};

const ESCROW_FLOW: AdminEscrowItem["status"][] = [
  "awaiting pickup",
  "verifying",
  "ready to ship",
  "delivered",
];

const ESCROW_NOTE: Record<AdminEscrowItem["status"], string> = {
  "awaiting pickup": "Pickup window in 6h",
  verifying: "Verification in progress",
  "ready to ship": "Ready to ship to buyer",
  delivered: "Delivered — ready for payout",
};

function makeAuctionFromQueueItem(item: QueueItem, nowMs: number): CustomerAuction {
  return {
    id: `auction-${item.id}`,
    title: item.title,
    series: item.series,
    seller: item.seller,
    currentBidThb: item.startingPriceThb,
    minIncrementThb: 100,
    bids: 0,
    endsAtMs: nowMs + item.durationHours * 60 * 60 * 1000,
  };
}

function limitAuctions(nextAuction: CustomerAuction, existing: CustomerAuction[]) {
  const combined = [nextAuction, ...existing];
  combined.sort((a, b) => a.endsAtMs - b.endsAtMs);
  return combined.slice(0, 2);
}

function riskTone(risk: QueueItem["risk"]) {
  if (risk === "high") return "border-rose-300 bg-rose-50 text-rose-800";
  if (risk === "medium") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-emerald-300 bg-emerald-50 text-emerald-800";
}

function escrowTone(status: AdminEscrowItem["status"]) {
  if (status === "verifying") return "border-sky-300 bg-sky-50 text-sky-800";
  if (status === "ready to ship") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (status === "delivered") return "border-zinc-400 bg-zinc-100 text-zinc-800";
  return "border-zinc-300 bg-zinc-50 text-zinc-700";
}

function toQueueItemFromAdmin(item: AdminScreeningItem): QueueItem {
  return {
    source: "admin",
    id: item.id,
    title: item.title,
    series: "Screened",
    seller: item.seller,
    startingPriceThb: item.startingPriceThb,
    durationHours: item.durationHours,
    submittedLabel: item.submittedLabel,
    risk: item.risk,
  };
}

function toQueueItemFromPending(item: SellerListing): QueueItem {
  return {
    source: "pending",
    id: item.id,
    title: item.title,
    series: item.series,
    seller: item.seller,
    startingPriceThb: item.startingPriceThb,
    durationHours: item.durationHours,
    submittedLabel: new Date(item.submittedAtMs).toLocaleTimeString(),
    risk: "medium",
  };
}

export default function AdminPage() {
  const [screening, setScreening] = useState<AdminScreeningItem[]>([]);
  const [pendingListings, setPending] = useState<SellerListing[]>([]);
  const [escrow, setEscrow] = useState<AdminEscrowItem[]>([]);
  const [, setAuctions] = useState<CustomerAuction[]>([]);
  const [, setAdminLog] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [queueFilter, setQueueFilter] = useState<"all" | "seller" | "platform">("all");
  const [activeTab, setActiveTab] = useState<AdminTab>("screening");

  useEffect(() => {
    const initialScreening = ensureAdminScreening();
    const initialEscrow = ensureAdminEscrow();
    const initialAuctions = ensureCustomerAuctions();
    const initialPending = getPendingListings();
    const initialLog = getAdminLog();
    const initialSession = getSession();

    const rafId = window.requestAnimationFrame(() => {
      setScreening(initialScreening);
      setEscrow(initialEscrow);
      setAuctions(initialAuctions);
      setPending(initialPending);
      setAdminLog(initialLog);
      setNowMs(Date.now());
      setSession(initialSession);
    });

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === STORAGE_KEYS.adminScreening) {
        setScreening(getAdminScreening());
      }
      if (event.key === STORAGE_KEYS.pendingListings) {
        setPending(getPendingListings());
      }
      if (event.key === STORAGE_KEYS.adminEscrow) {
        setEscrow(getAdminEscrow());
      }
      if (event.key === STORAGE_KEYS.customerAuctions) {
        setAuctions(getCustomerAuctions());
      }
      if (event.key === STORAGE_KEYS.adminLog) {
        setAdminLog(getAdminLog());
      }
      if (event.key === STORAGE_KEYS.session) {
        setSession(getSession());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const queue: QueueItem[] = useMemo(() => {
    const fromAdmin = screening.map(toQueueItemFromAdmin);
    const fromPending = pendingListings.map(toQueueItemFromPending);
    return [...fromPending, ...fromAdmin];
  }, [pendingListings, screening]);

  const filteredQueue = useMemo(() => {
    if (queueFilter === "seller") {
      return queue.filter((item) => item.source === "pending");
    }
    if (queueFilter === "platform") {
      return queue.filter((item) => item.source === "admin");
    }
    return queue;
  }, [queue, queueFilter]);

  const heldThb = useMemo(
    () => escrow.reduce((sum, item) => sum + item.amountThb, 0),
    [escrow]
  );

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  function approveItem(item: QueueItem) {
    if (nowMs === 0) {
      return;
    }
    const newAuction = makeAuctionFromQueueItem(item, nowMs);

    const existingAuctions = ensureCustomerAuctions();
    const nextAuctions = limitAuctions(newAuction, existingAuctions);
    setCustomerAuctions(nextAuctions);
    setAuctions(nextAuctions);

    if (item.source === "pending") {
      const nextPending = pendingListings.filter((entry) => entry.id !== item.id);
      setPendingListings(nextPending);
      setPending(nextPending);
      const nextLog = appendAdminLog(`Approved seller listing: ${item.title}`);
      setAdminLog(nextLog);
      return;
    }

    const nextScreening = screening.filter((entry) => entry.id !== item.id);
    setAdminScreening(nextScreening);
    setScreening(nextScreening);
    const nextLog = appendAdminLog(`Approved screened item: ${item.title}`);
    setAdminLog(nextLog);
  }

  function rejectItem(item: QueueItem) {
    if (item.source === "pending") {
      const nextPending = pendingListings.filter((entry) => entry.id !== item.id);
      setPendingListings(nextPending);
      setPending(nextPending);
      const nextLog = appendAdminLog(`Rejected seller listing: ${item.title}`);
      setAdminLog(nextLog);
      return;
    }

    const nextScreening = screening.filter((entry) => entry.id !== item.id);
    setAdminScreening(nextScreening);
    setScreening(nextScreening);
    const nextLog = appendAdminLog(`Rejected screened item: ${item.title}`);
    setAdminLog(nextLog);
  }

  function advanceEscrow(id: string) {
    const nextEscrow = escrow.map((item) => {
      if (item.id !== id) return item;
      const currentIndex = ESCROW_FLOW.indexOf(item.status);
      const nextStatus = ESCROW_FLOW[Math.min(currentIndex + 1, ESCROW_FLOW.length - 1)];
      return {
        ...item,
        status: nextStatus,
        note: ESCROW_NOTE[nextStatus],
      };
    });

    setAdminEscrow(nextEscrow);
    setEscrow(nextEscrow);
    const target = nextEscrow.find((item) => item.id === id);
    if (target) {
      const nextLog = appendAdminLog(`Escrow updated: ${target.title} → ${target.status}`);
      setAdminLog(nextLog);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Admin View
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Operations</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Landing
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Login
            </Link>
            <Link
              href="/customer"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Customer
            </Link>
            <Link
              href="/seller"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
            >
              Seller
            </Link>
            {session ? (
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setSession(null);
                }}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
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
            Keep it simple: screen, then process payment.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">
            This admin view is intentionally minimal for demos.
          </p>
        </section>

        {session ? (
          <section className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm text-violet-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Signed in as {session.name}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-700">
                {session.role}
              </p>
            </div>
            <Link
              href={sessionRoute}
              className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-300"
            >
              Open your dashboard
            </Link>
          </section>
        ) : (
          <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">You are not signed in.</p>
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Go to login
            </Link>
          </section>
        )}

        <section className="flex flex-wrap gap-2">
          {[
            { key: "screening" as const, label: "Screening", count: queue.length },
            { key: "payment" as const, label: "Payment Processing", count: escrow.length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                activeTab === tab.key
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </section>

        {activeTab === "screening" ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Screening queue</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Approve items to keep the buyer view focused.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                {filteredQueue.length}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "seller", label: "Seller" },
                { key: "platform", label: "Platform" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setQueueFilter(filter.key as typeof queueFilter)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    queueFilter === filter.key
                      ? "border-violet-300 bg-violet-50 text-violet-700"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {filteredQueue.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600">No items to review.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {filteredQueue.map((item) => {
                  const sourceLabel = item.source === "pending" ? "seller" : "platform";

                  return (
                    <article
                      key={`${item.source}-${item.id}`}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-zinc-900">{item.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                            {item.series} • {item.seller}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                            {sourceLabel}
                          </span>
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskTone(
                              item.risk
                            )}`}
                          >
                            {item.risk}
                          </span>
                          <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-700">
                            {item.submittedLabel}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                            Start
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-900">
                            {formatThb(item.startingPriceThb)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                            Duration
                          </p>
                          <p className="mt-1 text-sm font-semibold text-zinc-900">
                            {item.durationHours}h
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => approveItem(item)}
                          disabled={nowMs === 0}
                          className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectItem(item)}
                          className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="rounded-3xl border border-zinc-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Payment processing</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Advance escrow cases to simulate payout readiness.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  Cases {escrow.length}
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                  Held {formatThb(heldThb)}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {escrow.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-zinc-900">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {item.buyer} • {item.seller}
                      </p>
                    </div>
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${escrowTone(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                        Held
                      </p>
                      <p className="mt-1 text-lg font-semibold text-zinc-900">
                        {formatThb(item.amountThb)}
                      </p>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      {item.note}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => advanceEscrow(item.id)}
                    className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                  >
                    Advance
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
