"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import { formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getAllUsers,
  getEscrowCases,
  getSession,
  saveEscrowCaseProgress,
  settleDueAuctions,
  type EscrowCase,
  type Session,
  type ShipmentStatus,
  type UserAccount,
  type VerificationStatus,
} from "@/app/lib/storage";

type CaseDraft = {
  verificationStatus: VerificationStatus;
  shipmentStatus: ShipmentStatus;
};

type UiMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

export default function AdminVerificationPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [escrowCases, setEscrowCases] = useState<EscrowCase[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [caseDrafts, setCaseDrafts] = useState<Record<string, CaseDraft>>({});
  const [message, setMessage] = useState<UiMessage>({
    tone: "neutral",
    text: "Select state values and save to advance verification workflow.",
  });

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextEscrowCases = getEscrowCases();
      setSession(getSession());
      setEscrowCases(nextEscrowCases);
      setUsers(getAllUsers());
      setCaseDrafts((previous) => {
        const next: Record<string, CaseDraft> = {};
        for (const item of nextEscrowCases) {
          const existing = previous[item.id];
          next[item.id] = existing
            ? existing
            : {
                verificationStatus: item.verificationStatus,
                shipmentStatus: item.shipmentStatus,
              };
        }
        return next;
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

  const userMap = useMemo(() => {
    return new Map(users.map((item) => [item.id, item.name]));
  }, [users]);

  function updateCaseDraft(
    caseId: string,
    field: keyof CaseDraft,
    value: VerificationStatus | ShipmentStatus
  ) {
    setCaseDrafts((previous) => ({
      ...previous,
      [caseId]: {
        verificationStatus:
          field === "verificationStatus"
            ? (value as VerificationStatus)
            : previous[caseId]?.verificationStatus ?? "pending",
        shipmentStatus:
          field === "shipmentStatus"
            ? (value as ShipmentStatus)
            : previous[caseId]?.shipmentStatus ?? "pending_pickup",
      },
    }));
  }

  function handleSaveCaseState(caseId: string) {
    const draft = caseDrafts[caseId];
    if (!draft) {
      setMessage({ tone: "warning", text: "Choose verification and shipment states before saving." });
      return;
    }

    const result = saveEscrowCaseProgress(caseId, {
      verificationStatus: draft.verificationStatus,
      shipmentStatus: draft.shipmentStatus,
    });

    setMessage({ tone: result.ok ? "success" : "warning", text: result.message });
  }

  const heldCount = escrowCases.filter((item) => item.escrowStatus === "held").length;
  const closedCount = escrowCases.length - heldCount;

  const messageToneClass =
    message.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : message.tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-50 text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <AdminHeader
        active="verification"
        title="Escrow and Verification"
        subtitle="Save verification and shipment states to move escrow cases to closure."
        session={session}
        onSignOut={() => {
          clearSession();
          setSession(null);
        }}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total cases</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{escrowCases.length}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Held cases</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{heldCount}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Closed cases</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{closedCount}</p>
          </div>
        </section>

        <section className={`rounded-md border px-5 py-4 text-sm ${messageToneClass}`}>{message.text}</section>

        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Workflow Cases</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Delivered with verification passed closes the case and releases seller payout.
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
                        Buyer {userMap.get(item.buyerId) ?? item.buyerId} | Seller {userMap.get(item.sellerId) ?? item.sellerId}
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

                  {item.escrowStatus === "held" ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Verification (save)
                        </span>
                        <select
                          value={caseDrafts[item.id]?.verificationStatus ?? item.verificationStatus}
                          onChange={(event) =>
                            updateCaseDraft(
                              item.id,
                              "verificationStatus",
                              event.target.value as VerificationStatus
                            )
                          }
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                        >
                          <option value="pending">pending</option>
                          <option value="passed">passed</option>
                          <option value="failed">failed</option>
                        </select>
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Shipment (save)
                        </span>
                        <select
                          value={caseDrafts[item.id]?.shipmentStatus ?? item.shipmentStatus}
                          onChange={(event) =>
                            updateCaseDraft(item.id, "shipmentStatus", event.target.value as ShipmentStatus)
                          }
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                        >
                          <option value="pending_pickup">pending_pickup</option>
                          <option value="picked_up">picked_up</option>
                          <option value="in_transit">in_transit</option>
                          <option value="delivered">delivered</option>
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleSaveCaseState(item.id)}
                        className="self-end rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
                      >
                        Save State
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                      Case closed ({item.escrowStatus}). No further changes allowed.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
