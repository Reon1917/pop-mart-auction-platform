"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import { formatThb } from "@/app/lib/format";
import {
  closeAuctionAndProcessPayment,
  clearSession,
  ensurePrototypeData,
  getAllAuctions,
  getAllUsers,
  getBidActivity,
  getSession,
  getSessionUser,
  resetPrototypeData,
  runMockCompetingBidTick,
  runPaymentRetryNow,
  setUserBalance,
  settleDueAuctions,
  type Auction,
  type BidActivityEvent,
  type Session,
  type UserAccount,
} from "@/app/lib/storage";

type UiMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

export default function AdminMonitorPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [isDemoPanelOpen, setIsDemoPanelOpen] = useState(false);
  const [selectedDemoAuctionId, setSelectedDemoAuctionId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [events, setEvents] = useState<BidActivityEvent[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [message, setMessage] = useState<UiMessage>({
    tone: "neutral",
    text: "Live monitoring is active.",
  });

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      setSession(nextSession);
      setAdminUserId(nextUser?.role === "admin" ? nextUser.id : null);
      setAuctions(getAllAuctions());
      setEvents(getBidActivity());
      setUsers(getAllUsers());
    };

    refresh();
    const timer = window.setInterval(refresh, 1200);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const liveAuctions = auctions.filter((item) => item.status === "live");
  const sortedAuctions = [...auctions].sort((a, b) => b.createdAtMs - a.createdAtMs);
  const demoBuyer = users.find((item) => item.email.toLowerCase() === "buyer@popmart.demo") ?? null;

  const selectedDemoAuction = useMemo(() => {
    if (sortedAuctions.length === 0) {
      return null;
    }
    if (!selectedDemoAuctionId) {
      return sortedAuctions[0];
    }
    return sortedAuctions.find((item) => item.id === selectedDemoAuctionId) ?? sortedAuctions[0];
  }, [sortedAuctions, selectedDemoAuctionId]);

  function updateMessage(tone: UiMessage["tone"], text: string) {
    setMessage({ tone, text });
  }

  function handleSimulatedBid(auctionId: string) {
    if (!canAdminAct) {
      updateMessage("warning", "Sign in as admin to run demo controls.");
      return;
    }
    const result = runMockCompetingBidTick(auctionId);
    updateMessage(result.ok ? "success" : "warning", result.message);
  }

  function handleCloseAndProcess(auctionId: string) {
    if (!canAdminAct) {
      updateMessage("warning", "Sign in as admin to run demo controls.");
      return;
    }
    const result = closeAuctionAndProcessPayment(auctionId);
    updateMessage(result.ok ? "success" : "warning", result.message);
  }

  function handleRetryNow(auctionId: string) {
    if (!canAdminAct) {
      updateMessage("warning", "Sign in as admin to run demo controls.");
      return;
    }
    const result = runPaymentRetryNow(auctionId);
    updateMessage(result.ok ? "success" : "warning", result.message);
  }

  function handleSetDemoBuyerFunds(balanceThb: number) {
    if (!canAdminAct) {
      updateMessage("warning", "Sign in as admin to run demo controls.");
      return;
    }

    if (!demoBuyer) {
      updateMessage("warning", "Demo buyer account not found.");
      return;
    }

    const result = setUserBalance(demoBuyer.id, balanceThb);
    updateMessage(result.ok ? "success" : "warning", result.message);
  }

  function handleResetDemo() {
    if (!canAdminAct) {
      updateMessage("warning", "Sign in as admin to run demo controls.");
      return;
    }
    resetPrototypeData();
    updateMessage("success", "Demo data reset.");
  }

  const canAdminAct = session?.role === "admin" && Boolean(adminUserId);

  const messageToneClass =
    message.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : message.tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-50 text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <AdminHeader
        active="monitor"
        title="Live Monitoring"
        subtitle="Observe live bidding and run controlled demo scenarios."
        session={session}
        onSignOut={() => {
          clearSession();
          setSession(null);
        }}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        {!canAdminAct ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Sign in as admin to run simulation controls.
          </section>
        ) : null}

        <section className={`rounded-md border px-5 py-4 text-sm ${messageToneClass}`}>{message.text}</section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Live Auctions</h2>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                {liveAuctions.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">Real-time status feed for active auctions.</p>

            <div className="mt-4 flex max-h-[30rem] flex-col gap-2 overflow-y-auto">
              {liveAuctions.length === 0 ? (
                <p className="text-sm text-zinc-600">No live auctions.</p>
              ) : (
                liveAuctions.map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-900">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Current {formatThb(item.currentBidThb)}
                        </p>
                      </div>
                      <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
                        bids {item.bidsCount}
                      </span>
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
                events.slice(0, 24).map((event) => (
                  <div key={event.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
                    <p className="font-semibold text-zinc-900">
                      {event.bidderName} bid {formatThb(event.amountThb)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {event.mode} | {new Date(event.createdAtMs).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </main>

      {canAdminAct ? (
        <div className="fixed bottom-5 right-5 z-50">
          {isDemoPanelOpen ? (
          <section className="w-[22rem] rounded-md border border-zinc-300 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Demo Controls</p>
                <h2 className="text-sm font-semibold text-zinc-900">Simulation Panel</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoPanelOpen(false)}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400"
              >
                Close
              </button>
            </div>

            <label className="mt-3 flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Auction</span>
              <select
                value={selectedDemoAuction?.id ?? ""}
                onChange={(event) => setSelectedDemoAuctionId(event.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
              >
                {sortedAuctions.length === 0 ? (
                  <option value="">No auction</option>
                ) : (
                  sortedAuctions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.status})
                    </option>
                  ))
                )}
              </select>
            </label>

            {selectedDemoAuction ? (
              <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                <p className="font-semibold text-zinc-900">{selectedDemoAuction.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {selectedDemoAuction.status.replaceAll("_", " ")} | current {formatThb(selectedDemoAuction.currentBidThb)}
                </p>
                {selectedDemoAuction.paymentRetryDueAtMs ? (
                  <p className="mt-1 text-xs text-zinc-600">
                    Retry due {new Date(selectedDemoAuction.paymentRetryDueAtMs).toLocaleTimeString()}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!selectedDemoAuction) return;
                  handleSimulatedBid(selectedDemoAuction.id);
                }}
                disabled={!selectedDemoAuction || selectedDemoAuction.status !== "live"}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Counter Bid
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedDemoAuction) return;
                  handleCloseAndProcess(selectedDemoAuction.id);
                }}
                disabled={
                  !selectedDemoAuction ||
                  selectedDemoAuction.status === "paid_escrowed" ||
                  selectedDemoAuction.status === "payment_failed"
                }
                className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                Close + Process
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedDemoAuction) return;
                  handleRetryNow(selectedDemoAuction.id);
                }}
                disabled={
                  !selectedDemoAuction ||
                  !(selectedDemoAuction.status === "ended" && selectedDemoAuction.paymentAttempts > 0)
                }
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Retry Now
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            </div>

            <button
              type="button"
              onClick={handleResetDemo}
              className="mt-3 w-full rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-400"
            >
              Reset Demo
            </button>
          </section>
          ) : (
            <button
              type="button"
              onClick={() => setIsDemoPanelOpen(true)}
              className="rounded-md border border-zinc-900 bg-zinc-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-zinc-800"
            >
              Demo Controls
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
