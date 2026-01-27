"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearSession,
  getMockCredentials,
  getSession,
  listMockCredentials,
  setSession,
  type MockCredentials,
  type UserRole,
} from "@/app/lib/storage";
import { Button } from "@/app/components/Button";
import { Card, CardHeader } from "@/app/components/Card";
import { Input } from "@/app/components/Input";
import { Badge } from "@/app/components/Badge";

// Icons
const Icons = {
  ArrowLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Info: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  SignOut: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  ShoppingBag: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  Store: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

type LoginMessage = {
  tone: "neutral" | "success" | "warning";
  text: string;
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  buyer: <Icons.ShoppingBag />,
  seller: <Icons.Store />,
  admin: <Icons.Shield />,
};

const roleColors: Record<UserRole, string> = {
  buyer: "from-violet-500 to-fuchsia-500",
  seller: "from-emerald-500 to-teal-500",
  admin: "from-amber-500 to-orange-500",
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<LoginMessage>({
    tone: "neutral",
    text: "Use Quick Login to auto-fill demo credentials.",
  });
  const [activeSessionLabel, setActiveSessionLabel] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const credentialList = useMemo(() => listMockCredentials(), []);

  useEffect(() => {
    const session = getSession();
    const label = session ? `${session.name} (${session.role})` : null;
    const rafId = window.requestAnimationFrame(() => {
      setMounted(true);
      if (label) {
        setActiveSessionLabel(label);
      }
    });
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  function applyRole(targetRole: UserRole) {
    const creds = getMockCredentials(targetRole);
    setRole(targetRole);
    setEmail(creds.email);
    setPassword(creds.password);
    setMessage({
      tone: "neutral",
      text: `Demo credentials loaded for ${targetRole}.`,
    });
  }

  function resolveCredentials(): MockCredentials | null {
    const byEmail = credentialList.find(
      (item) => item.email.toLowerCase() === email.toLowerCase()
    );
    if (byEmail) return byEmail;
    return getMockCredentials(role);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const creds = resolveCredentials();
    if (!creds) {
      setMessage({ tone: "warning", text: "Unable to resolve demo credentials." });
      return;
    }

    const nextSession = {
      role: creds.role,
      name: creds.name,
      email: creds.email,
    } as const;

    setSession(nextSession);
    setMessage({
      tone: "success",
      text: `Signed in as ${creds.name}. Redirecting...`,
    });
    router.push(creds.redirectTo);
  }

  const messageStyles = {
    neutral: "border-zinc-200 bg-zinc-50 text-zinc-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 via-white to-white text-zinc-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/25">
              PM
            </span>
            <div>
              <p className="text-sm font-bold text-zinc-900">Pop Mart Auction</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Prototype
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/customer"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
            >
              Customer
            </Link>
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition w-fit"
        >
          <Icons.ArrowLeft />
          Back to home
        </Link>

        {/* Header */}
        <section
          className={`transition-all duration-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Badge variant="purple" className="mb-3">
            Demo Environment
          </Badge>
          <h1 className="text-4xl font-bold text-zinc-900">Sign in</h1>
          <p className="mt-2 text-lg text-zinc-600 max-w-xl">
            This is a mock login. Choosing a role auto-fills credentials and
            sends you to the corresponding dashboard.
          </p>
        </section>

        {/* Active Session Alert */}
        {activeSessionLabel && (
          <section
            className={`flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between animate-scaleIn`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <Icons.Check />
              </div>
              <p className="font-semibold text-emerald-900">
                Currently signed in as {activeSessionLabel}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                clearSession();
                setActiveSessionLabel(null);
                setMessage({ tone: "neutral", text: "Session cleared." });
              }}
              leftIcon={<Icons.SignOut />}
            >
              Sign out
            </Button>
          </section>
        )}

        {/* Main Content */}
        <section
          className={`grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] transition-all duration-500 delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* Login Form */}
          <Card padding="lg" className="relative overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />

            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
                <Icons.User />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Welcome back</h2>
                <p className="text-sm text-zinc-500">Demo access</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@popmart.demo"
                leftIcon={<Icons.User />}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="demo1234"
                leftIcon={<Icons.Lock />}
              />

              <Button type="submit" size="lg" className="mt-2">
                Sign in
              </Button>
            </form>

            {/* Quick Login */}
            <div className="mt-8 pt-6 border-t border-zinc-100">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-4">
                Quick login
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(["buyer", "seller", "admin"] as const).map((itemRole) => (
                  <button
                    key={itemRole}
                    type="button"
                    onClick={() => applyRole(itemRole)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                      role === itemRole
                        ? "border-violet-400 bg-violet-50"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${roleColors[itemRole]} text-white`}
                    >
                      {roleIcons[itemRole]}
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        role === itemRole ? "text-violet-700" : "text-zinc-600"
                      }`}
                    >
                      {itemRole}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Status Message */}
            <div
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${messageStyles[message.tone]}`}
            >
              {message.tone === "success" ? (
                <Icons.Check />
              ) : message.tone === "warning" ? (
                <Icons.Alert />
              ) : (
                <Icons.Info />
              )}
              {message.text}
            </div>

            {/* Demo Accounts */}
            <Card padding="lg">
              <CardHeader
                title="Demo Accounts"
                subtitle="These are the mock credentials stored in localStorage."
              />
              <div className="space-y-3">
                {credentialList.map((item) => (
                  <div
                    key={item.role}
                    className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 transition hover:border-zinc-200"
                  >
                    <div
                      className={`h-10 w-10 rounded-xl bg-gradient-to-br ${roleColors[item.role]} flex items-center justify-center text-white text-sm font-bold`}
                    >
                      {item.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">{item.email}</p>
                    </div>
                    <Badge variant={item.role === "admin" ? "warning" : item.role === "seller" ? "success" : "default"} size="sm">
                      {item.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* What Happens Next */}
            <Card padding="lg" className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-4">What happens next</h3>
              <ul className="space-y-3">
                {[
                  { icon: Icons.ShoppingBag, text: "Buyer: live countdown and local bidding." },
                  { icon: Icons.Store, text: "Seller: submit listings into the screening queue." },
                  { icon: Icons.Shield, text: "Admin: approve listings and advance escrow cases." },
                ].map((item) => (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 text-sm text-zinc-300"
                  >
                    <span className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 text-zinc-400">
                      <item.icon />
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
}
