"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  clearSession,
  createDispute,
  ensurePrototypeData,
  getAllAuctions,
  getEscrowCases,
  getMockCredentials,
  getNotificationsForUser,
  getSession,
  getSessionUser,
  markNotificationRead,
  settleDueAuctions,
  type Auction,
  type EscrowCase,
  type NotificationRecord,
  type Session,
} from "@/app/lib/storage";

type AuctionView = Auction & {
  timeLabel: string;
  hasEnded: boolean;
  nextBid: number;
};

export default function CustomerPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [cases, setCases] = useState<EscrowCase[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [disputeReason, setDisputeReason] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("Realtime updates are active.");

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      setSession(nextSession);
      setBuyerId(nextUser?.role === "buyer" ? nextUser.id : null);
      setAuctions(getAllAuctions());
      if (nextUser?.role === "buyer") {
        setCases(getEscrowCases().filter((item) => item.buyerId === nextUser.id));
        setNotifications(getNotificationsForUser(nextUser.id));
      } else {
        setCases([]);
        setNotifications([]);
      }
      setNowMs(Date.now());
    };

    refresh();
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const auctionsWithTime: AuctionView[] = useMemo(() => {
    return auctions.map((auction) => {
      const remaining = auction.endsAtMs - nowMs;
      return {
        ...auction,
        hasEnded: remaining <= 0,
        timeLabel: formatDuration(remaining),
        nextBid: auction.currentBidThb + auction.minIncrementThb,
      };
    });
  }, [auctions, nowMs]);

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Buyer Dashboard
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Realtime Bidding & Tracking</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Landing
            </Link>
            {!session ? (
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-400"
              >
                Login
              </Link>
            ) : null}
            {session ? (
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setSession(null);
                  setBuyerId(null);
                }}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        {session ? (
          <section className="rounded-md border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700">
            Signed in as <span className="font-semibold">{session.name}</span> ({session.role}).
            <Link
              href={sessionRoute}
              className="ml-3 inline-flex rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400"
            >
              Dashboard
            </Link>
          </section>
        ) : (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Please sign in with the buyer account to place bids and receive notifications.
          </section>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Live Auctions</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Open an auction to place bids and receive outbid notifications.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {auctionsWithTime.map((auction) => (
                <Link
                  key={auction.id}
                  href={`/customer/${auction.id}`}
                  className="rounded-md border border-zinc-200 bg-zinc-50 p-4 transition hover:border-zinc-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-zinc-900">{auction.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {auction.series}
                      </p>
                    </div>
                    <span
                      className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        auction.status === "live"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : auction.status === "paid_escrowed"
                            ? "border-sky-300 bg-sky-50 text-sky-800"
                            : auction.status === "payment_failed"
                              ? "border-rose-300 bg-rose-50 text-rose-800"
                              : "border-zinc-300 bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {auction.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Current</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-900">
                        {formatThb(auction.currentBidThb)}
                      </p>
                    </div>
                    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Next</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-900">
                        {formatThb(auction.nextBid)}
                      </p>
                    </div>
                    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Time left</p>
                      <p className={`mt-1 text-lg font-semibold ${auction.hasEnded ? "text-zinc-400" : "text-zinc-900"}`}>
                        {auction.timeLabel}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Notifications</h2>
                <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                  {notifications.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">Outbid alerts and payment updates.</p>

              <div className="mt-3 flex flex-col gap-2">
                {notifications.length === 0 ? (
                  <p className="text-sm text-zinc-600">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(item.id);
                        setNotifications((prev) =>
                          prev.map((entry) =>
                            entry.id === item.id ? { ...entry, read: true } : entry
                          )
                        );
                      }}
                      className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                        item.read
                          ? "border-zinc-200 bg-zinc-50 text-zinc-700"
                          : "border-sky-300 bg-sky-50 text-sky-900"
                      }`}
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs">{item.message}</p>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Shipment Tracking</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Verification and delivery progress for won auctions.
              </p>

              <div className="mt-3 flex flex-col gap-3">
                {cases.length === 0 ? (
                  <p className="text-sm text-zinc-600">No escrow cases yet.</p>
                ) : (
                  cases.map((item) => (
                    <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Verification {item.verificationStatus} • Shipment {item.shipmentStatus}
                      </p>
                      <p className="mt-2 text-sm text-zinc-700">
                        Escrow: {item.escrowStatus} • Amount {formatThb(item.grossAmountThb)}
                      </p>

                      {buyerId ? (
                        <div className="mt-3">
                          <input
                            value={disputeReason[item.id] ?? ""}
                            onChange={(event) =>
                              setDisputeReason((prev) => ({ ...prev, [item.id]: event.target.value }))
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
                                setDisputeReason((prev) => ({ ...prev, [item.id]: "" }));
                              }
                            }}
                            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
                          >
                            Open dispute
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </section>

        <section className="rounded-md border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700">
          {statusMessage}
        </section>
      </main>
    </div>
  );
}
