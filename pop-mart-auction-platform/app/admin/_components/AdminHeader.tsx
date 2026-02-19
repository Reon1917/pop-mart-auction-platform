"use client";

import Link from "next/link";
import type { Session } from "@/app/lib/storage";

export type AdminSection =
  | "dashboard"
  | "monitor"
  | "verification"
  | "disputes"
  | "users"
  | "reports";

type AdminHeaderProps = {
  active: AdminSection;
  title: string;
  subtitle: string;
  session: Session | null;
  onSignOut: () => void;
};

function navItemClass(active: boolean) {
  return `rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
  }`;
}

export function AdminHeader({ active, title, subtitle, session, onSignOut }: AdminHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Admin</p>
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
          <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link href="/admin" className={navItemClass(active === "dashboard")}>
            Dashboard
          </Link>
          <Link href="/admin/monitor" className={navItemClass(active === "monitor")}>
            Monitor
          </Link>
          <Link href="/admin/verification" className={navItemClass(active === "verification")}>
            Verification
          </Link>
          <Link href="/admin/disputes" className={navItemClass(active === "disputes")}>
            Disputes
          </Link>
          <Link href="/admin/users" className={navItemClass(active === "users")}>
            Users
          </Link>
          <Link href="/admin/reports" className={navItemClass(active === "reports")}>
            Reports
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
              onClick={onSignOut}
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
  );
}
