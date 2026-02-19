"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import {
  clearSession,
  ensurePrototypeData,
  getAllUsers,
  getSession,
  setUserStatus,
  settleDueAuctions,
  type Session,
  type UserAccount,
} from "@/app/lib/storage";

type UiMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

export default function AdminUsersPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [message, setMessage] = useState<UiMessage>({
    tone: "neutral",
    text: "Use moderation controls to set user account status.",
  });

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      setSession(getSession());
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

  function handleUserStatus(userId: string, status: "active" | "suspended" | "banned") {
    const result = setUserStatus(userId, status, "Updated by admin moderation.");
    setMessage({ tone: result.ok ? "success" : "warning", text: result.message });
  }

  const nonAdminUsers = users.filter((item) => item.role !== "admin");
  const suspendedCount = nonAdminUsers.filter((item) => item.status === "suspended").length;
  const bannedCount = nonAdminUsers.filter((item) => item.status === "banned").length;

  const messageToneClass =
    message.tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : message.tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-50 text-zinc-700";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <AdminHeader
        active="users"
        title="User Moderation"
        subtitle="Warn, suspend, or ban users based on policy and payment behavior."
        session={session}
        onSignOut={() => {
          clearSession();
          setSession(null);
        }}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Accounts</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{nonAdminUsers.length}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Suspended</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{suspendedCount}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Banned</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{bannedCount}</p>
          </div>
        </section>

        <section className={`rounded-md border px-5 py-4 text-sm ${messageToneClass}`}>{message.text}</section>

        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Moderation Queue</h2>

          <div className="mt-4 flex flex-col gap-3">
            {nonAdminUsers.map((item) => (
              <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900">{item.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {item.role} | status {item.status} | failed payments {item.failedPaymentIncidents}
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
      </main>
    </div>
  );
}
