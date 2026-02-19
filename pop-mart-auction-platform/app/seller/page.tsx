"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatDuration, formatThb } from "@/app/lib/format";
import {
  clearSession,
  createSellerAuction,
  ensurePrototypeData,
  getAllAuctions,
  getEscrowCases,
  getMockCredentials,
  getNotificationsForUser,
  getSession,
  getSessionUser,
  settleDueAuctions,
  type Auction,
  type EscrowCase,
  type NotificationRecord,
  type Session,
} from "@/app/lib/storage";

type SellerAuctionView = Auction & {
  timeLabel: string;
  ended: boolean;
};

type StatusMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

export default function SellerPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [escrowCases, setEscrowCases] = useState<EscrowCase[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [title, setTitle] = useState("HIRONO Mime Limited");
  const [series, setSeries] = useState("HIRONO");
  const [startingBidThb, setStartingBidThb] = useState(3600);
  const [minIncrementThb, setMinIncrementThb] = useState(100);
  const [durationHours, setDurationHours] = useState(6);

  const [statusMessage, setStatusMessage] = useState<StatusMessage>({
    tone: "neutral",
    text: "Seller notifications and verification tracking are active.",
  });

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      const allAuctions = getAllAuctions();
      const allCases = getEscrowCases();

      setSession(nextSession);
      if (nextUser?.role === "seller") {
        setSellerId(nextUser.id);
        setAuctions(allAuctions.filter((item) => item.sellerId === nextUser.id));
        setEscrowCases(allCases.filter((item) => item.sellerId === nextUser.id));
        setNotifications(getNotificationsForUser(nextUser.id));
      } else {
        setSellerId(null);
        setAuctions([]);
        setEscrowCases([]);
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

  const sellerAuctions: SellerAuctionView[] = useMemo(() => {
    return auctions.map((item) => {
      const remaining = item.endsAtMs - nowMs;
      return {
        ...item,
        ended: remaining <= 0,
        timeLabel: formatDuration(remaining),
      };
    });
  }, [auctions, nowMs]);

  const sessionRoute = session ? getMockCredentials(session.role).redirectTo : "/login";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sellerId) {
      setStatusMessage({
        tone: "warning",
        text: "Sign in as seller to create auctions.",
      });
      return;
    }

    const result = createSellerAuction({
      sellerId,
      title,
      series,
      startingBidThb,
      minIncrementThb,
      durationHours,
    });

    setStatusMessage({ tone: result.ok ? "success" : "warning", text: result.message });

    if (result.ok) {
      setTitle("New Pop Mart Figure");
      setSeries("Pop Mart");
      setStartingBidThb(3000);
      setMinIncrementThb(100);
      setDurationHours(6);
    }
  }

  const messageToneClass =
    statusMessage.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : statusMessage.tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-50 text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Seller Dashboard
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Sales, Verification, and Fees</h1>
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
                  setSellerId(null);
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
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-900">Create Auction</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Requirement rule: duration must stay between 1 and 24 hours.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Item title"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
              />
              <input
                value={series}
                onChange={(event) => setSeries(event.target.value)}
                placeholder="Series"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min={1}
                  value={startingBidThb}
                  onChange={(event) => setStartingBidThb(Number(event.target.value))}
                  placeholder="Starting bid (THB)"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
                <input
                  type="number"
                  min={1}
                  value={minIncrementThb}
                  onChange={(event) => setMinIncrementThb(Number(event.target.value))}
                  placeholder="Increment (THB)"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                />
              </div>
              <input
                type="number"
                min={1}
                max={24}
                value={durationHours}
                onChange={(event) => setDurationHours(Number(event.target.value))}
                placeholder="Duration (hours)"
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
              />

              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Publish auction
              </button>
            </form>
          </section>

          <section className={`rounded-md border px-4 py-3 text-sm ${messageToneClass}`}>
            {statusMessage.text}
          </section>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Your Auctions</h2>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                {sellerAuctions.length}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {sellerAuctions.length === 0 ? (
                <p className="text-sm text-zinc-600">No auctions yet.</p>
              ) : (
                sellerAuctions.map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <p className="font-semibold text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Current {formatThb(item.currentBidThb)} • {item.timeLabel}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700">
                      Status: {item.status.replaceAll("_", " ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">Notifications</h2>
              <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                {notifications.length}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-zinc-600">No notifications yet.</p>
              ) : (
                notifications.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
                    <p className="font-semibold text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-zinc-700">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>

        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Verification & Payout Tracking</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Service fee is fixed at 10% and shown per transaction.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="px-2 py-2">Item</th>
                  <th className="px-2 py-2">Verification</th>
                  <th className="px-2 py-2">Shipment</th>
                  <th className="px-2 py-2">Gross</th>
                  <th className="px-2 py-2">Fee</th>
                  <th className="px-2 py-2">Net Payout</th>
                  <th className="px-2 py-2">Payout Status</th>
                </tr>
              </thead>
              <tbody>
                {escrowCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-zinc-600">
                      No sold items yet.
                    </td>
                  </tr>
                ) : (
                  escrowCases.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100 text-zinc-700">
                      <td className="px-2 py-3 font-semibold text-zinc-900">{item.title}</td>
                      <td className="px-2 py-3">{item.verificationStatus}</td>
                      <td className="px-2 py-3">{item.shipmentStatus}</td>
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
      </main>
    </div>
  );
}
