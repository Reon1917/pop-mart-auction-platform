"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatThb } from "@/app/lib/format";
import {
  clearSession,
  ensurePrototypeData,
  getSession,
  getSessionUser,
  updateUserProfile,
  type Session,
} from "@/app/lib/storage";

function topNavLinkClass(active: boolean) {
  return `rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
  }`;
}

export default function SellerProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<string>("-");
  const [balanceThb, setBalanceThb] = useState(0);
  const [paymentMethodLabel, setPaymentMethodLabel] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [message, setMessage] = useState("Update payout method and address for settlement simulation.");
  const loadedUserRef = useRef<string | null>(null);

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      const nextSession = getSession();
      const nextUser = getSessionUser();
      setSession(nextSession);

      if (nextUser?.role === "seller") {
        setSellerId(nextUser.id);
        setAccountStatus(nextUser.status);
        setBalanceThb(nextUser.balanceThb);

        if (loadedUserRef.current !== nextUser.id) {
          setPaymentMethodLabel(nextUser.paymentMethodLabel);
          setShippingAddress(nextUser.shippingAddress);
          loadedUserRef.current = nextUser.id;
        }
      } else {
        setSellerId(null);
        setAccountStatus("-");
        setBalanceThb(0);
        setPaymentMethodLabel("");
        setShippingAddress("");
        loadedUserRef.current = null;
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 1500);
    window.addEventListener("storage", refresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function handleSaveProfile() {
    if (!sellerId) {
      setMessage("Sign in as a seller to update profile details.");
      return;
    }

    const result = updateUserProfile(sellerId, {
      paymentMethodLabel,
      shippingAddress,
    });

    setMessage(result.message);

    if (result.ok && result.data) {
      setPaymentMethodLabel(result.data.user.paymentMethodLabel);
      setShippingAddress(result.data.user.shippingAddress);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Seller</p>
            <h1 className="text-lg font-semibold text-zinc-900">Profile</h1>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link href="/seller" className={topNavLinkClass(false)}>
              Dashboard
            </Link>
            <Link href="/seller/payouts" className={topNavLinkClass(false)}>
              Payouts
            </Link>
            <Link href="/seller/profile" className={topNavLinkClass(true)}>
              Profile
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
                onClick={() => {
                  clearSession();
                  setSession(null);
                  setSellerId(null);
                }}
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

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        {session?.role !== "seller" ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Sign in as a seller to edit profile details.
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Account status</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900">{accountStatus}</p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Seller balance</p>
                <p className="mt-1 text-xl font-semibold text-zinc-900">{formatThb(balanceThb)}</p>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-zinc-900">Payout and Address Details</h2>
              <p className="mt-1 text-sm text-zinc-600">
                These values are displayed in prototype settlement and payout simulations.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Debit Card / Payout Method
                  </span>
                  <input
                    value={paymentMethodLabel}
                    onChange={(event) => setPaymentMethodLabel(event.target.value)}
                    placeholder="Debit card •••• 5678"
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Address</span>
                  <textarea
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    placeholder="Enter seller address"
                    rows={4}
                    className="resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Save Profile
                </button>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-700">
              {message}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
