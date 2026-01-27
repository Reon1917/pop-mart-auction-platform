"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
}

export function Header({
  title,
  subtitle,
  badge,
  children,
  className = "",
}: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 backdrop-blur-md ${className}`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
          >
            PM
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-900">{title}</h1>
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-zinc-500 uppercase tracking-[0.15em]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-2">{children}</nav>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  children: ReactNode;
  isActive?: boolean;
}

export function NavLink({ href, children, isActive = false }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}

interface UserMenuProps {
  name?: string;
  role?: string;
  onSignOut?: () => void;
}

export function UserMenu({ name, role, onSignOut }: UserMenuProps) {
  if (!name) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-right">
        <p className="text-sm font-medium text-zinc-900">{name}</p>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          {role}
        </p>
      </div>
      <button
        onClick={onSignOut}
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
      >
        Sign out
      </button>
    </div>
  );
}
