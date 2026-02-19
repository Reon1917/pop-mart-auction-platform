"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminHeader } from "@/app/admin/_components/AdminHeader";
import { formatThb } from "@/app/lib/format";
import {
  approveSellerListing,
  clearSession,
  ensurePrototypeData,
  getAllUsers,
  getEscrowCases,
  getSellerListings,
  getSession,
  getSessionUser,
  rejectSellerListing,
  saveEscrowCaseProgress,
  settleDueAuctions,
  type EscrowCase,
  type SellerListing,
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
  const [adminUserId, setAdminUserId] = useState<string>("admin-demo");
  const [escrowCases, setEscrowCases] = useState<EscrowCase[]>([]);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [caseDrafts, setCaseDrafts] = useState<Record<string, CaseDraft>>({});
  const [listingReviewNote, setListingReviewNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<UiMessage>({
    tone: "neutral",
    text: "Review listing approvals and escrow state transitions from one workflow page.",
  });

  useEffect(() => {
    ensurePrototypeData();

    const refresh = () => {
      settleDueAuctions();
      const nextEscrowCases = getEscrowCases();
      const nextListings = getSellerListings().sort((a, b) => b.createdAtMs - a.createdAtMs);
      const nextSession = getSession();
      const nextUser = getSessionUser();

      setSession(nextSession);
      setAdminUserId(nextUser?.role === "admin" ? nextUser.id : "admin-demo");
      setEscrowCases(nextEscrowCases);
      setListings(nextListings);
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

  function handleApproveListing(listingId: string) {
    const result = approveSellerListing(listingId, adminUserId);
    setMessage({ tone: result.ok ? "success" : "warning", text: result.message });
  }

  function handleRejectListing(listingId: string) {
    const reason = (listingReviewNote[listingId] ?? "").trim();
    if (!reason) {
      setMessage({ tone: "warning", text: "Rejection reason is required." });
      return;
    }

    const result = rejectSellerListing(listingId, adminUserId, reason);
    setMessage({ tone: result.ok ? "success" : "warning", text: result.message });
    if (result.ok) {
      setListingReviewNote((previous) => ({ ...previous, [listingId]: "" }));
    }
  }

  const heldCount = escrowCases.filter((item) => item.escrowStatus === "held").length;
  const closedCount = escrowCases.length - heldCount;
  const pendingListings = listings.filter((item) => item.status === "pending").length;
  const approvedListings = listings.filter((item) => item.status === "approved").length;
  const rejectedListings = listings.filter((item) => item.status === "rejected").length;

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
        subtitle="Approve listings before publish and manage escrow progression."
        session={session}
        onSignOut={() => {
          clearSession();
          setSession(null);
        }}
      />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Held cases</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{heldCount}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Closed cases</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{closedCount}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending listings</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{pendingListings}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Approved listings</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{approvedListings}</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Rejected listings</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{rejectedListings}</p>
          </div>
        </section>

        <section className={`rounded-md border px-5 py-4 text-sm ${messageToneClass}`}>{message.text}</section>

        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Listing Review Queue</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Admin approval is required before a seller listing appears as a live auction.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {listings.length === 0 ? (
              <p className="text-sm text-zinc-600">No listing requests submitted yet.</p>
            ) : (
              listings.map((listing) => (
                <div key={listing.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">{listing.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        Seller {userMap.get(listing.sellerId) ?? listing.sellerId} | Start {formatThb(listing.startingBidThb)} | +{formatThb(listing.minIncrementThb)} | {listing.durationHours}h
                      </p>
                    </div>
                    <span
                      className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        listing.status === "pending"
                          ? "border-amber-300 bg-amber-50 text-amber-800"
                          : listing.status === "approved"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-rose-300 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>

                  {listing.status === "pending" ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Rejection reason (required to reject)
                        </span>
                        <input
                          value={listingReviewNote[listing.id] ?? ""}
                          onChange={(event) =>
                            setListingReviewNote((previous) => ({
                              ...previous,
                              [listing.id]: event.target.value,
                            }))
                          }
                          placeholder="Enter reason if rejecting"
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleApproveListing(listing.id)}
                        className="self-end rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectListing(listing.id)}
                        className="self-end rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700 transition hover:border-rose-400"
                      >
                        Reject
                      </button>
                    </div>
                  ) : listing.status === "rejected" ? (
                    <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                      Rejected reason: {listing.reviewReason}
                    </p>
                  ) : (
                    <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Approved and published live.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Escrow Workflow Cases</h2>
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
