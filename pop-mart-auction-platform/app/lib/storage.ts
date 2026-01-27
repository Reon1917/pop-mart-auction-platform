import type { AdminEscrowItem, AdminScreeningItem } from "@/app/mock/admin-data";
import type { CustomerAuction } from "@/app/mock/customer-data";
import { DEFAULT_ADMIN_ESCROW, DEFAULT_ADMIN_SCREENING } from "@/app/mock/admin-data";
import { createDefaultCustomerAuctions } from "@/app/mock/customer-data";

export type SellerListing = {
  id: string;
  title: string;
  series: string;
  seller: string;
  startingPriceThb: number;
  durationHours: number;
  submittedAtMs: number;
};

export type BidRecord = {
  id: string;
  auctionId: string;
  amountThb: number;
  placedAtMs: number;
};

export type UserRole = "buyer" | "seller" | "admin";

export type Session = {
  role: UserRole;
  name: string;
  email: string;
};

export type MockCredentials = {
  role: UserRole;
  name: string;
  email: string;
  password: string;
  redirectTo: "/customer" | "/seller" | "/admin";
};

const KEYS = {
  customerAuctions: "pm_customer_auctions",
  pendingListings: "pm_pending_listings",
  bids: "pm_bids",
  adminScreening: "pm_admin_screening",
  adminEscrow: "pm_admin_escrow",
  adminLog: "pm_admin_log",
  session: "pm_session",
} as const;

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

const MOCK_CREDENTIALS: Record<UserRole, MockCredentials> = {
  buyer: {
    role: "buyer",
    name: "Buyer Demo",
    email: "buyer@popmart.demo",
    password: "demo1234",
    redirectTo: "/customer",
  },
  seller: {
    role: "seller",
    name: "Seller Demo",
    email: "seller@popmart.demo",
    password: "demo1234",
    redirectTo: "/seller",
  },
  admin: {
    role: "admin",
    name: "Admin Demo",
    email: "admin@popmart.demo",
    password: "demo1234",
    redirectTo: "/admin",
  },
};

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJson<T extends JsonValue>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T extends JsonValue>(key: string, value: T) {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function ensureCustomerAuctions(): CustomerAuction[] {
  const existing = readJson<CustomerAuction[]>(KEYS.customerAuctions, []);
  if (existing.length > 0) {
    return existing;
  }

  const defaults = createDefaultCustomerAuctions();
  writeJson(KEYS.customerAuctions, defaults);
  return defaults;
}

export function getCustomerAuctions() {
  return readJson<CustomerAuction[]>(KEYS.customerAuctions, []);
}

export function setCustomerAuctions(auctions: CustomerAuction[]) {
  writeJson(KEYS.customerAuctions, auctions);
}

export function ensureAdminScreening(): AdminScreeningItem[] {
  const existing = readJson<AdminScreeningItem[]>(KEYS.adminScreening, []);
  if (existing.length > 0) {
    return existing;
  }
  writeJson(KEYS.adminScreening, DEFAULT_ADMIN_SCREENING);
  return DEFAULT_ADMIN_SCREENING;
}

export function getAdminScreening() {
  return readJson<AdminScreeningItem[]>(KEYS.adminScreening, []);
}

export function setAdminScreening(items: AdminScreeningItem[]) {
  writeJson(KEYS.adminScreening, items);
}

export function ensureAdminEscrow(): AdminEscrowItem[] {
  const existing = readJson<AdminEscrowItem[]>(KEYS.adminEscrow, []);
  if (existing.length > 0) {
    return existing;
  }
  writeJson(KEYS.adminEscrow, DEFAULT_ADMIN_ESCROW);
  return DEFAULT_ADMIN_ESCROW;
}

export function getAdminEscrow() {
  return readJson<AdminEscrowItem[]>(KEYS.adminEscrow, []);
}

export function setAdminEscrow(items: AdminEscrowItem[]) {
  writeJson(KEYS.adminEscrow, items);
}

export function getPendingListings() {
  return readJson<SellerListing[]>(KEYS.pendingListings, []);
}

export function setPendingListings(items: SellerListing[]) {
  writeJson(KEYS.pendingListings, items);
}

export function addPendingListing(item: SellerListing) {
  const existing = getPendingListings();
  const next = [item, ...existing];
  setPendingListings(next);
  return next;
}

export function getBidRecords() {
  return readJson<BidRecord[]>(KEYS.bids, []);
}

export function addBidRecord(record: BidRecord) {
  const existing = getBidRecords();
  const next = [record, ...existing];
  writeJson(KEYS.bids, next);
  return next;
}

export function appendAdminLog(message: string) {
  const existing = readJson<string[]>(KEYS.adminLog, []);
  const entry = `${new Date().toLocaleTimeString()} — ${message}`;
  const next = [entry, ...existing].slice(0, 12);
  writeJson(KEYS.adminLog, next);
  return next;
}

export function getAdminLog() {
  return readJson<string[]>(KEYS.adminLog, []);
}

export function getMockCredentials(role: UserRole) {
  return MOCK_CREDENTIALS[role];
}

export function listMockCredentials() {
  return Object.values(MOCK_CREDENTIALS);
}

export function getSession() {
  return readJson<Session | null>(KEYS.session, null);
}

export function setSession(session: Session) {
  writeJson(KEYS.session, session);
}

export function clearSession() {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.removeItem(KEYS.session);
}

export const STORAGE_KEYS = KEYS;
