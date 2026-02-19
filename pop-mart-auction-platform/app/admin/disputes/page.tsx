"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import {
  clearSession,
  ensurePrototypeData,
  getDisputes,
  getSession,
  getSessionUser,
  resolveDispute,
  settleDueAuctions,
  type DisputeCase,
  type Session,
} from "@/app/lib/storage";

type UiMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

export default function AdminDisputesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<UiMessage>({
    tone: "neutral",
    text: "Resolve disputes with refund, release, or rejection outcomes.",
  });

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextSession = getSession();
      const nextUser = getSessionUser();
      setSession(nextSession);
      setAdminUserId(nextUser?.role === "admin" ? nextUser.id : null);
      setDisputes(getDisputes());
    };

    refresh();
    const timer = window.setInterval(refresh, 1200);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function handleResolve(
    disputeId: string,
    status: "resolved_refund" | "resolved_release" | "rejected"
  ) {
    if (!canAdminAct || !adminUserId) {
      setMessage({ tone: "warning", text: "Sign in as admin to resolve disputes." });
      return;
    }

    const note = (resolutionNote[disputeId] ?? "").trim() || "Resolved by admin.";
    const result = resolveDispute(disputeId, { status, note }, adminUserId);
    setMessage({ tone: result.ok ? "success" : "warning", text: result.message });
  }

  const openCount = disputes.filter((item) => item.status === "open").length;
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
        active="disputes"
        title="Disputes"
        subtitle="Review and resolve buyer-seller disputes with auditable outcomes."
        session={session}
        onSignOut={() => {
          clearSession();
          setSession(null);
        }}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        {!canAdminAct ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Sign in as admin to resolve dispute cases.
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total disputes</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{disputes.length}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Open disputes</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{openCount}</p>
          </div>
        </section>

        <section className={`rounded-md border px-5 py-4 text-sm ${messageToneClass}`}>{message.text}</section>

        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Dispute Queue</h2>

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
                          setResolutionNote((previous) => ({
                            ...previous,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Resolution note"
                        disabled={!canAdminAct}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                      />
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id, "resolved_refund")}
                          disabled={!canAdminAct}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                        >
                          Resolve Refund
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id, "resolved_release")}
                          disabled={!canAdminAct}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-800 transition hover:border-zinc-400"
                        >
                          Resolve Release
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolve(item.id, "rejected")}
                          disabled={!canAdminAct}
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
      </main>
    </div>
  );
}
