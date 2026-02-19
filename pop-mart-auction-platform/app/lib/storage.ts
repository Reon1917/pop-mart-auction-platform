import {
  AUCTION_SEEDS,
  DISPUTE_SEEDS,
  NOTIFICATION_SEEDS,
  TRANSACTION_SEEDS,
  USER_SEEDS,
} from "@/app/mock/prototype-data";

export type UserRole = "buyer" | "seller" | "admin";

export type UserStatus = "active" | "suspended" | "banned";

export type AuctionStatus = "live" | "ended" | "payment_failed" | "paid_escrowed";

export type VerificationStatus = "pending" | "passed" | "failed";

export type ShipmentStatus = "pending_pickup" | "picked_up" | "in_transit" | "delivered";

export type PayoutStatus = "locked" | "released";

export type DisputeStatus = "open" | "resolved_refund" | "resolved_release" | "rejected";

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

export type UserAccount = {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  status: UserStatus;
  paymentMethodLabel: string;
  balanceThb: number;
  failedPaymentIncidents: number;
};

export type Auction = {
  id: string;
  title: string;
  series: string;
  sellerId: string;
  currentBidThb: number;
  minIncrementThb: number;
  bidsCount: number;
  highestBidderId: string | null;
  endsAtMs: number;
  status: AuctionStatus;
  paymentAttempts: number;
  paymentRetryDueAtMs: number | null;
  createdAtMs: number;
};

export type BidActivityEvent = {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amountThb: number;
  createdAtMs: number;
  mode: "manual" | "simulated";
};

export type NotificationType =
  | "outbid"
  | "sold"
  | "payment"
  | "refund"
  | "payout"
  | "shipment"
  | "account"
  | "dispute";

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAtMs: number;
  read: boolean;
};

export type EscrowStatus = "held" | "released" | "refunded";

export type EscrowCase = {
  id: string;
  auctionId: string;
  title: string;
  buyerId: string;
  sellerId: string;
  grossAmountThb: number;
  serviceFeeThb: number;
  netPayoutThb: number;
  escrowStatus: EscrowStatus;
  verificationStatus: VerificationStatus;
  shipmentStatus: ShipmentStatus;
  payoutStatus: PayoutStatus;
  note: string;
  createdAtMs: number;
  updatedAtMs: number;
};

export type TransactionType = "payment_hold" | "refund" | "payout_release";

export type TransactionRecord = {
  id: string;
  auctionId: string;
  caseId: string;
  type: TransactionType;
  amountThb: number;
  serviceFeeThb: number;
  createdAtMs: number;
};

export type DisputeCase = {
  id: string;
  caseId: string;
  createdByUserId: string;
  reason: string;
  status: DisputeStatus;
  resolutionNote: string;
  createdAtMs: number;
  resolvedAtMs: number | null;
};

export type SellerListing = {
  id: string;
  title: string;
  series: string;
  sellerId: string;
  startingBidThb: number;
  minIncrementThb: number;
  durationHours: number;
  createdAtMs: number;
};

export type CreateDisputePayload = {
  caseId: string;
  createdByUserId: string;
  reason: string;
};

export type ResolveDisputePayload = {
  status: Exclude<DisputeStatus, "open">;
  note: string;
};

export type ReportsSummary = {
  transactionCount: number;
  grossVolumeThb: number;
  serviceFeeRevenueThb: number;
  refundsThb: number;
  payoutsThb: number;
  failedPaymentCount: number;
  openDisputeCount: number;
  heldEscrowCount: number;
};

export type ActionResult<T = undefined> = {
  ok: boolean;
  message: string;
  data?: T;
};

type JsonValue =
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null;

const SERVICE_FEE_RATE = 0.1;
const PAYMENT_RETRY_DELAY_MS = 30_000;

const KEYS = {
  users: "pm_users",
  auctions: "pm_auctions",
  bidEvents: "pm_bid_events",
  notifications: "pm_notifications",
  escrowCases: "pm_escrow_cases",
  transactions: "pm_transactions",
  disputes: "pm_disputes",
  listings: "pm_seller_listings",
  session: "pm_session",
  simCounter: "pm_sim_counter",
} as const;

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

function readJson<T extends JsonValue>(key: string, fallback: T): T {
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

function writeJson<T extends JsonValue>(key: string, value: T) {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function now() {
  return Date.now();
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultUsers(): UserAccount[] {
  return USER_SEEDS.map((seed) => ({
    id: seed.id,
    role: seed.role,
    name: seed.name,
    email: seed.email,
    status: "active",
    paymentMethodLabel: seed.paymentMethodLabel,
    balanceThb: seed.balanceThb,
    failedPaymentIncidents: 0,
  }));
}

function createDefaultAuctions(createdAtMs = now()): Auction[] {
  return AUCTION_SEEDS.map((seed, index) => ({
    id: seed.id,
    title: seed.title,
    series: seed.series,
    sellerId: seed.sellerId,
    currentBidThb: seed.startingBidThb,
    minIncrementThb: seed.minIncrementThb,
    bidsCount: 0,
    highestBidderId: null,
    endsAtMs: createdAtMs + seed.durationHours * 60 * 60 * 1000 - index * 30 * 60 * 1000,
    status: "live",
    paymentAttempts: 0,
    paymentRetryDueAtMs: null,
    createdAtMs,
  }));
}

function createDefaultNotifications(): NotificationRecord[] {
  return NOTIFICATION_SEEDS.map((seed) => ({ ...seed }));
}

function createDefaultTransactions(): TransactionRecord[] {
  return TRANSACTION_SEEDS.map((seed) => ({ ...seed }));
}

function createDefaultDisputes(): DisputeCase[] {
  return DISPUTE_SEEDS.map((seed) => ({ ...seed }));
}

function getSimCounter() {
  return readJson<number>(KEYS.simCounter, 0);
}

function setSimCounter(value: number) {
  writeJson(KEYS.simCounter, value);
}

function ensureKey<T extends JsonValue>(key: string, defaultFactory: () => T): T {
  const existing = readJson<T>(key, null as T);
  if (existing !== null) {
    return existing;
  }
  const created = defaultFactory();
  writeJson(key, created);
  return created;
}

function getUsers() {
  return readJson<UserAccount[]>(KEYS.users, []);
}

function setUsers(users: UserAccount[]) {
  writeJson(KEYS.users, users);
}

function getAuctionsUnsafe() {
  return readJson<Auction[]>(KEYS.auctions, []);
}

function setAuctions(auctions: Auction[]) {
  writeJson(KEYS.auctions, auctions);
}

function getBidEventsUnsafe() {
  return readJson<BidActivityEvent[]>(KEYS.bidEvents, []);
}

function setBidEvents(events: BidActivityEvent[]) {
  writeJson(KEYS.bidEvents, events);
}

function getNotificationsUnsafe() {
  return readJson<NotificationRecord[]>(KEYS.notifications, []);
}

function setNotifications(notifications: NotificationRecord[]) {
  writeJson(KEYS.notifications, notifications);
}

function getEscrowCasesUnsafe() {
  return readJson<EscrowCase[]>(KEYS.escrowCases, []);
}

function setEscrowCases(cases: EscrowCase[]) {
  writeJson(KEYS.escrowCases, cases);
}

function getTransactionsUnsafe() {
  return readJson<TransactionRecord[]>(KEYS.transactions, []);
}

function setTransactions(transactions: TransactionRecord[]) {
  writeJson(KEYS.transactions, transactions);
}

function getDisputesUnsafe() {
  return readJson<DisputeCase[]>(KEYS.disputes, []);
}

function setDisputes(disputes: DisputeCase[]) {
  writeJson(KEYS.disputes, disputes);
}

function getSellerListingsUnsafe() {
  return readJson<SellerListing[]>(KEYS.listings, []);
}

function pushNotification(
  notifications: NotificationRecord[],
  userId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  notifications.unshift({
    id: makeId("notif"),
    userId,
    type,
    title,
    message,
    createdAtMs: now(),
    read: false,
  });
}

function createEscrowCase(auction: Auction): EscrowCase | null {
  if (!auction.highestBidderId) {
    return null;
  }

  const gross = auction.currentBidThb;
  const fee = Math.round(gross * SERVICE_FEE_RATE);
  const net = gross - fee;

  return {
    id: makeId("case"),
    auctionId: auction.id,
    title: auction.title,
    buyerId: auction.highestBidderId,
    sellerId: auction.sellerId,
    grossAmountThb: gross,
    serviceFeeThb: fee,
    netPayoutThb: net,
    escrowStatus: "held",
    verificationStatus: "pending",
    shipmentStatus: "pending_pickup",
    payoutStatus: "locked",
    note: "Payment held in escrow until verification and delivery complete.",
    createdAtMs: now(),
    updatedAtMs: now(),
  };
}

function recordTransaction(
  transactions: TransactionRecord[],
  auctionId: string,
  caseId: string,
  type: TransactionType,
  amountThb: number,
  serviceFeeThb = 0
) {
  transactions.unshift({
    id: makeId("tx"),
    auctionId,
    caseId,
    type,
    amountThb,
    serviceFeeThb,
    createdAtMs: now(),
  });
}

function attemptWinnerPayment(
  auctionId: string,
  allowRetryWindowBypass: boolean
): ActionResult<{ auction: Auction }> {
  ensurePrototypeData();

  const currentTime = now();
  const auctions = getAuctionsUnsafe();
  const users = getUsers();
  const notifications = getNotificationsUnsafe();
  const transactions = getTransactionsUnsafe();
  const escrowCases = getEscrowCasesUnsafe();

  const auctionIndex = auctions.findIndex((item) => item.id === auctionId);
  if (auctionIndex < 0) {
    return { ok: false, message: "Auction not found." };
  }

  const auction = auctions[auctionIndex];
  if (auction.status === "paid_escrowed") {
    return { ok: true, message: "Auction is already paid and escrowed.", data: { auction } };
  }

  if (auction.status === "payment_failed") {
    return { ok: false, message: "Auction is already marked payment failed." };
  }

  if (auction.status === "live" && auction.endsAtMs > currentTime) {
    return { ok: false, message: "Auction has not ended yet." };
  }

  if (!auction.highestBidderId) {
    const nextAuction = { ...auction, status: "ended" as const, paymentRetryDueAtMs: null };
    auctions[auctionIndex] = nextAuction;
    setAuctions(auctions);
    return { ok: true, message: "Auction ended with no winner.", data: { auction: nextAuction } };
  }

  if (
    !allowRetryWindowBypass &&
    auction.paymentAttempts > 0 &&
    auction.paymentRetryDueAtMs &&
    currentTime < auction.paymentRetryDueAtMs
  ) {
    return { ok: false, message: "Retry window not reached yet." };
  }

  const buyerIndex = users.findIndex((user) => user.id === auction.highestBidderId);
  if (buyerIndex < 0) {
    return { ok: false, message: "Winning buyer account not found." };
  }

  const buyer = users[buyerIndex];
  const nextAttempt = auction.paymentAttempts + 1;
  const seller = users.find((user) => user.id === auction.sellerId) ?? null;

  if (buyer.balanceThb >= auction.currentBidThb) {
    users[buyerIndex] = {
      ...buyer,
      balanceThb: buyer.balanceThb - auction.currentBidThb,
    };

    const caseExists = escrowCases.some((item) => item.auctionId === auction.id);
    const escrowCase = caseExists ? null : createEscrowCase(auction);
    if (escrowCase) {
      escrowCases.unshift(escrowCase);
      recordTransaction(
        transactions,
        auction.id,
        escrowCase.id,
        "payment_hold",
        escrowCase.grossAmountThb,
        escrowCase.serviceFeeThb
      );
    }

    const nextAuction: Auction = {
      ...auction,
      status: "paid_escrowed",
      paymentAttempts: nextAttempt,
      paymentRetryDueAtMs: null,
    };
    auctions[auctionIndex] = nextAuction;

    pushNotification(
      notifications,
      buyer.id,
      "payment",
      "Payment held in escrow",
      `Payment ${formatMoney(auction.currentBidThb)} has been secured in escrow for ${auction.title}.`
    );
    if (seller) {
      pushNotification(
        notifications,
        seller.id,
        "sold",
        "Item sold",
        `${auction.title} was sold. Payment is held in escrow pending verification and delivery.`
      );
    }

    setUsers(users);
    setAuctions(auctions);
    setEscrowCases(escrowCases);
    setTransactions(transactions);
    setNotifications(notifications);

    return {
      ok: true,
      message: "Payment processed and held in escrow.",
      data: { auction: nextAuction },
    };
  }

  const nextUser: UserAccount = {
    ...buyer,
    failedPaymentIncidents: buyer.failedPaymentIncidents,
  };

  let nextAuction: Auction;
  if (nextAttempt < 2) {
    nextAuction = {
      ...auction,
      status: "ended",
      paymentAttempts: nextAttempt,
      paymentRetryDueAtMs: currentTime + PAYMENT_RETRY_DELAY_MS,
    };

    pushNotification(
      notifications,
      buyer.id,
      "payment",
      "Insufficient funds",
      `Payment retry is scheduled in 30 seconds for ${auction.title}.`
    );
    if (seller) {
      pushNotification(
        notifications,
        seller.id,
        "payment",
        "Payment retry pending",
        `Winner payment failed on first attempt for ${auction.title}. Completion is blocked until payment succeeds.`
      );
    }
  } else {
    nextUser.failedPaymentIncidents = buyer.failedPaymentIncidents + 1;

    let accountMessage = "Payment failed twice. Auction completion is cancelled.";
    if (nextUser.failedPaymentIncidents >= 2) {
      nextUser.status = "banned";
      accountMessage =
        "Payment failed twice again. Your account has been banned due to repeated non-payment.";
    }

    nextAuction = {
      ...auction,
      status: "payment_failed",
      paymentAttempts: nextAttempt,
      paymentRetryDueAtMs: null,
    };

    pushNotification(notifications, buyer.id, "account", "Payment failed", accountMessage);

    if (seller) {
      pushNotification(
        notifications,
        seller.id,
        "payment",
        "Auction payment failed",
        `Payment failed for ${auction.title}. Auction cannot complete.`
      );
    }
  }

  users[buyerIndex] = nextUser;
  auctions[auctionIndex] = nextAuction;

  setUsers(users);
  setAuctions(auctions);
  setNotifications(notifications);

  return {
    ok: true,
    message:
      nextAuction.status === "payment_failed"
        ? "Payment failed after retry."
        : "Payment failed. Retry scheduled.",
    data: { auction: nextAuction },
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ensurePrototypeData() {
  ensureKey<UserAccount[]>(KEYS.users, createDefaultUsers);
  ensureKey<Auction[]>(KEYS.auctions, () => createDefaultAuctions(now()));
  ensureKey<BidActivityEvent[]>(KEYS.bidEvents, () => []);
  ensureKey<NotificationRecord[]>(KEYS.notifications, createDefaultNotifications);
  ensureKey<EscrowCase[]>(KEYS.escrowCases, () => []);
  ensureKey<TransactionRecord[]>(KEYS.transactions, createDefaultTransactions);
  ensureKey<DisputeCase[]>(KEYS.disputes, createDefaultDisputes);
  ensureKey<SellerListing[]>(KEYS.listings, () => []);
  ensureKey<number>(KEYS.simCounter, () => 0);
}

export function getAllUsers() {
  ensurePrototypeData();
  return getUsers();
}

export function getAllAuctions() {
  ensurePrototypeData();
  return getAuctionsUnsafe();
}

export function getBidActivity() {
  ensurePrototypeData();
  return getBidEventsUnsafe();
}

export function getEscrowCases() {
  ensurePrototypeData();
  return getEscrowCasesUnsafe();
}

export function getTransactions() {
  ensurePrototypeData();
  return getTransactionsUnsafe();
}

export function getDisputes() {
  ensurePrototypeData();
  return getDisputesUnsafe();
}

export function getSellerListings() {
  ensurePrototypeData();
  return getSellerListingsUnsafe();
}

export function getUserByEmail(email: string) {
  ensurePrototypeData();
  const normalized = email.trim().toLowerCase();
  return getUsers().find((item) => item.email.toLowerCase() === normalized) ?? null;
}

export function getUserById(userId: string) {
  ensurePrototypeData();
  return getUsers().find((item) => item.id === userId) ?? null;
}

export function placeBidRealtime(
  auctionId: string,
  bidderId: string,
  amountThb: number
): ActionResult<{ auction: Auction }> {
  ensurePrototypeData();
  settleDueAuctions();

  const currentTime = now();
  const auctions = getAuctionsUnsafe();
  const users = getUsers();
  const notifications = getNotificationsUnsafe();
  const bidEvents = getBidEventsUnsafe();

  const bidder = users.find((user) => user.id === bidderId);
  if (!bidder) {
    return { ok: false, message: "Bidder not found." };
  }

  if (bidder.status !== "active") {
    return { ok: false, message: "Only active users can bid." };
  }

  const auctionIndex = auctions.findIndex((item) => item.id === auctionId);
  if (auctionIndex < 0) {
    return { ok: false, message: "Auction not found." };
  }

  const auction = auctions[auctionIndex];
  if (auction.status !== "live" || auction.endsAtMs <= currentTime) {
    return { ok: false, message: "Auction is not accepting bids." };
  }

  const minimumAllowed = auction.currentBidThb + auction.minIncrementThb;
  if (amountThb < minimumAllowed) {
    return { ok: false, message: `Minimum next bid is ${formatMoney(minimumAllowed)}.` };
  }

  const remainder = (amountThb - minimumAllowed) % auction.minIncrementThb;
  if (remainder !== 0) {
    return {
      ok: false,
      message: `Bids must increase by ${formatMoney(auction.minIncrementThb)} increments.`,
    };
  }

  const previousHighestBidderId = auction.highestBidderId;

  const nextAuction: Auction = {
    ...auction,
    currentBidThb: amountThb,
    bidsCount: auction.bidsCount + 1,
    highestBidderId: bidder.id,
  };

  auctions[auctionIndex] = nextAuction;

  bidEvents.unshift({
    id: makeId("bid"),
    auctionId,
    bidderId: bidder.id,
    bidderName: bidder.name,
    amountThb,
    createdAtMs: currentTime,
    mode: "manual",
  });

  if (previousHighestBidderId && previousHighestBidderId !== bidder.id) {
    pushNotification(
      notifications,
      previousHighestBidderId,
      "outbid",
      "You were outbid",
      `${bidder.name} placed ${formatMoney(amountThb)} on ${auction.title}.`
    );
  }

  setAuctions(auctions);
  setBidEvents(bidEvents.slice(0, 80));
  setNotifications(notifications);

  return {
    ok: true,
    message: `Bid placed at ${formatMoney(amountThb)}.`,
    data: { auction: nextAuction },
  };
}

export function runMockCompetingBidTick(auctionId: string): ActionResult<{ auction: Auction }> {
  ensurePrototypeData();
  settleDueAuctions();

  const auctions = getAuctionsUnsafe();
  const users = getUsers();
  const bidEvents = getBidEventsUnsafe();
  const notifications = getNotificationsUnsafe();

  const auctionIndex = auctions.findIndex((item) => item.id === auctionId);
  if (auctionIndex < 0) {
    return { ok: false, message: "Auction not found." };
  }

  const auction = auctions[auctionIndex];
  if (auction.status !== "live" || auction.endsAtMs <= now()) {
    return { ok: false, message: "Auction is not active." };
  }

  const activeBuyers = users.filter((user) => user.role === "buyer" && user.status === "active");
  const candidates = activeBuyers.filter((user) => user.id !== auction.highestBidderId);
  if (candidates.length === 0) {
    return { ok: false, message: "No competitor available." };
  }

  const counter = getSimCounter();
  const bidder = candidates[counter % candidates.length];
  setSimCounter(counter + 1);

  const amount = auction.currentBidThb + auction.minIncrementThb;
  const previousHighestBidderId = auction.highestBidderId;

  const nextAuction: Auction = {
    ...auction,
    currentBidThb: amount,
    bidsCount: auction.bidsCount + 1,
    highestBidderId: bidder.id,
  };
  auctions[auctionIndex] = nextAuction;

  bidEvents.unshift({
    id: makeId("bid"),
    auctionId,
    bidderId: bidder.id,
    bidderName: bidder.name,
    amountThb: amount,
    createdAtMs: now(),
    mode: "simulated",
  });

  if (previousHighestBidderId && previousHighestBidderId !== bidder.id) {
    pushNotification(
      notifications,
      previousHighestBidderId,
      "outbid",
      "You were outbid",
      `${bidder.name} placed ${formatMoney(amount)} on ${auction.title}.`
    );
  }

  setAuctions(auctions);
  setBidEvents(bidEvents.slice(0, 80));
  setNotifications(notifications);

  return {
    ok: true,
    message: "Simulated competing bid applied.",
    data: { auction: nextAuction },
  };
}

export function finalizeAuctionAndProcessPayment(auctionId: string) {
  return attemptWinnerPayment(auctionId, true);
}

export function retryWinnerPayment(auctionId: string) {
  return attemptWinnerPayment(auctionId, false);
}

export function closeAuctionAndProcessPayment(
  auctionId: string
): ActionResult<{ auction: Auction }> {
  ensurePrototypeData();

  const auctions = getAuctionsUnsafe();
  const auctionIndex = auctions.findIndex((item) => item.id === auctionId);
  if (auctionIndex < 0) {
    return { ok: false, message: "Auction not found." };
  }

  const auction = auctions[auctionIndex];
  if (auction.status === "paid_escrowed" || auction.status === "payment_failed") {
    return {
      ok: false,
      message: "Auction is already finalized.",
    };
  }

  auctions[auctionIndex] = {
    ...auction,
    endsAtMs: now() - 1,
  };
  setAuctions(auctions);

  return finalizeAuctionAndProcessPayment(auctionId);
}

export function runPaymentRetryNow(auctionId: string): ActionResult<{ auction: Auction }> {
  ensurePrototypeData();

  const auctions = getAuctionsUnsafe();
  const auctionIndex = auctions.findIndex((item) => item.id === auctionId);
  if (auctionIndex < 0) {
    return { ok: false, message: "Auction not found." };
  }

  const auction = auctions[auctionIndex];
  if (auction.status !== "ended") {
    return { ok: false, message: "Only pending ended auctions can be retried." };
  }

  auctions[auctionIndex] = {
    ...auction,
    paymentRetryDueAtMs: now() - 1,
  };
  setAuctions(auctions);

  return retryWinnerPayment(auctionId);
}

export function settleDueAuctions() {
  ensurePrototypeData();
  const auctions = getAuctionsUnsafe();
  const currentTime = now();

  for (const auction of auctions) {
    if (auction.status === "live" && auction.endsAtMs <= currentTime) {
      attemptWinnerPayment(auction.id, true);
      continue;
    }

    if (
      auction.status === "ended" &&
      auction.paymentAttempts > 0 &&
      auction.paymentRetryDueAtMs !== null &&
      auction.paymentRetryDueAtMs <= currentTime
    ) {
      attemptWinnerPayment(auction.id, false);
    }
  }
}

export function advanceEscrowWorkflow(
  caseId: string,
  action: "pickup" | "verify_pass" | "verify_fail" | "ship_to_buyer" | "mark_delivered"
): ActionResult<{ escrowCase: EscrowCase }> {
  ensurePrototypeData();

  const escrowCases = getEscrowCasesUnsafe();
  const caseIndex = escrowCases.findIndex((item) => item.id === caseId);
  if (caseIndex < 0) {
    return { ok: false, message: "Escrow case not found." };
  }

  const currentCase = escrowCases[caseIndex];
  const nextCase = { ...currentCase };

  if (action === "pickup") {
    nextCase.shipmentStatus = "picked_up";
    nextCase.note = "Courier pickup completed.";
  }

  if (action === "verify_pass") {
    nextCase.verificationStatus = "passed";
    nextCase.note = "Authenticity verified successfully.";
  }

  if (action === "verify_fail") {
    nextCase.verificationStatus = "failed";
    nextCase.note = "Authenticity verification failed. Buyer will be refunded.";
  }

  if (action === "ship_to_buyer") {
    if (currentCase.verificationStatus !== "passed" && nextCase.verificationStatus !== "passed") {
      return {
        ok: false,
        message: "Cannot ship before verification is marked passed.",
      };
    }
    nextCase.shipmentStatus = "in_transit";
    nextCase.note = "Shipment dispatched to buyer.";
  }

  if (action === "mark_delivered") {
    if (currentCase.verificationStatus !== "passed" && nextCase.verificationStatus !== "passed") {
      return {
        ok: false,
        message: "Cannot deliver before verification is marked passed.",
      };
    }
    if (currentCase.shipmentStatus !== "in_transit" && nextCase.shipmentStatus !== "in_transit") {
      return {
        ok: false,
        message: "Shipment must be in transit before marking delivered.",
      };
    }
    nextCase.shipmentStatus = "delivered";
    nextCase.note = "Delivered to buyer.";
  }

  nextCase.updatedAtMs = now();
  escrowCases[caseIndex] = nextCase;
  setEscrowCases(escrowCases);

  if (action === "verify_fail") {
    const refundResult = issueRefund(caseId, "Verification failed");
    if (!refundResult.ok) {
      return { ok: false, message: refundResult.message };
    }
    const refreshed = getEscrowCasesUnsafe().find((item) => item.id === caseId);
    if (!refreshed) {
      return { ok: false, message: "Escrow case missing after refund." };
    }
    return { ok: true, message: "Verification failed and refund issued.", data: { escrowCase: refreshed } };
  }

  if (action === "mark_delivered") {
    const payoutResult = releaseSellerPayout(caseId);
    if (!payoutResult.ok) {
      return { ok: false, message: payoutResult.message };
    }
    const refreshed = getEscrowCasesUnsafe().find((item) => item.id === caseId);
    if (!refreshed) {
      return { ok: false, message: "Escrow case missing after payout." };
    }
    return { ok: true, message: "Delivery completed and payout released.", data: { escrowCase: refreshed } };
  }

  const notifications = getNotificationsUnsafe();
  pushNotification(
    notifications,
    nextCase.buyerId,
    "shipment",
    "Case update",
    `${nextCase.title}: ${nextCase.note}`
  );
  pushNotification(
    notifications,
    nextCase.sellerId,
    "shipment",
    "Case update",
    `${nextCase.title}: ${nextCase.note}`
  );
  setNotifications(notifications);

  return { ok: true, message: "Escrow workflow updated.", data: { escrowCase: nextCase } };
}

export function issueRefund(caseId: string, reason: string): ActionResult<{ escrowCase: EscrowCase }> {
  ensurePrototypeData();

  const escrowCases = getEscrowCasesUnsafe();
  const users = getUsers();
  const transactions = getTransactionsUnsafe();
  const notifications = getNotificationsUnsafe();

  const caseIndex = escrowCases.findIndex((item) => item.id === caseId);
  if (caseIndex < 0) {
    return { ok: false, message: "Escrow case not found." };
  }

  const caseItem = escrowCases[caseIndex];
  if (caseItem.escrowStatus === "refunded") {
    return { ok: true, message: "Escrow case already refunded.", data: { escrowCase: caseItem } };
  }

  const buyerIndex = users.findIndex((user) => user.id === caseItem.buyerId);
  if (buyerIndex < 0) {
    return { ok: false, message: "Buyer account not found." };
  }

  users[buyerIndex] = {
    ...users[buyerIndex],
    balanceThb: users[buyerIndex].balanceThb + caseItem.grossAmountThb,
  };

  const nextCase: EscrowCase = {
    ...caseItem,
    escrowStatus: "refunded",
    payoutStatus: "locked",
    note: `Refund issued: ${reason}.`,
    updatedAtMs: now(),
  };
  escrowCases[caseIndex] = nextCase;

  recordTransaction(transactions, caseItem.auctionId, caseItem.id, "refund", caseItem.grossAmountThb);

  pushNotification(
    notifications,
    caseItem.buyerId,
    "refund",
    "Refund issued",
    `${caseItem.title}: ${formatMoney(caseItem.grossAmountThb)} refunded.`
  );
  pushNotification(
    notifications,
    caseItem.sellerId,
    "refund",
    "Case refunded",
    `${caseItem.title}: buyer refunded because ${reason}.`
  );

  setUsers(users);
  setEscrowCases(escrowCases);
  setTransactions(transactions);
  setNotifications(notifications);

  return { ok: true, message: "Refund issued.", data: { escrowCase: nextCase } };
}

export function releaseSellerPayout(caseId: string): ActionResult<{ escrowCase: EscrowCase }> {
  ensurePrototypeData();

  const escrowCases = getEscrowCasesUnsafe();
  const users = getUsers();
  const transactions = getTransactionsUnsafe();
  const notifications = getNotificationsUnsafe();

  const caseIndex = escrowCases.findIndex((item) => item.id === caseId);
  if (caseIndex < 0) {
    return { ok: false, message: "Escrow case not found." };
  }

  const caseItem = escrowCases[caseIndex];

  if (caseItem.escrowStatus === "refunded") {
    return { ok: false, message: "Cannot release payout for refunded case." };
  }

  if (caseItem.verificationStatus !== "passed" || caseItem.shipmentStatus !== "delivered") {
    return {
      ok: false,
      message: "Payout can only be released after verification passed and delivery completed.",
    };
  }

  if (caseItem.payoutStatus === "released") {
    return { ok: true, message: "Payout already released.", data: { escrowCase: caseItem } };
  }

  const sellerIndex = users.findIndex((user) => user.id === caseItem.sellerId);
  if (sellerIndex < 0) {
    return { ok: false, message: "Seller account not found." };
  }

  users[sellerIndex] = {
    ...users[sellerIndex],
    balanceThb: users[sellerIndex].balanceThb + caseItem.netPayoutThb,
  };

  const nextCase: EscrowCase = {
    ...caseItem,
    escrowStatus: "released",
    payoutStatus: "released",
    note: "Seller payout released after verification and delivery.",
    updatedAtMs: now(),
  };
  escrowCases[caseIndex] = nextCase;

  recordTransaction(transactions, caseItem.auctionId, caseItem.id, "payout_release", caseItem.netPayoutThb);

  pushNotification(
    notifications,
    caseItem.sellerId,
    "payout",
    "Payout released",
    `${caseItem.title}: ${formatMoney(caseItem.netPayoutThb)} released after ${formatMoney(
      caseItem.serviceFeeThb
    )} fee deduction.`
  );

  setUsers(users);
  setEscrowCases(escrowCases);
  setTransactions(transactions);
  setNotifications(notifications);

  return { ok: true, message: "Seller payout released.", data: { escrowCase: nextCase } };
}

export function createDispute(payload: CreateDisputePayload): ActionResult<{ dispute: DisputeCase }> {
  ensurePrototypeData();

  const escrowCases = getEscrowCasesUnsafe();
  const notifications = getNotificationsUnsafe();
  const disputes = getDisputesUnsafe();

  const caseItem = escrowCases.find((item) => item.id === payload.caseId);
  if (!caseItem) {
    return { ok: false, message: "Escrow case not found." };
  }

  const dispute: DisputeCase = {
    id: makeId("dispute"),
    caseId: payload.caseId,
    createdByUserId: payload.createdByUserId,
    reason: payload.reason.trim(),
    status: "open",
    resolutionNote: "",
    createdAtMs: now(),
    resolvedAtMs: null,
  };

  disputes.unshift(dispute);

  pushNotification(
    notifications,
    "admin-demo",
    "dispute",
    "New dispute opened",
    `${caseItem.title}: ${payload.reason.trim()}`
  );

  setDisputes(disputes);
  setNotifications(notifications);

  return { ok: true, message: "Dispute created.", data: { dispute } };
}

export function resolveDispute(
  disputeId: string,
  resolution: ResolveDisputePayload
): ActionResult<{ dispute: DisputeCase }> {
  ensurePrototypeData();

  const disputes = getDisputesUnsafe();
  const notifications = getNotificationsUnsafe();
  const disputeIndex = disputes.findIndex((item) => item.id === disputeId);

  if (disputeIndex < 0) {
    return { ok: false, message: "Dispute not found." };
  }

  const dispute = disputes[disputeIndex];
  if (dispute.status !== "open") {
    return { ok: false, message: "Dispute already resolved." };
  }

  if (resolution.status === "resolved_refund") {
    const refundResult = issueRefund(dispute.caseId, resolution.note || "Dispute refund");
    if (!refundResult.ok) {
      return { ok: false, message: refundResult.message };
    }
  }

  if (resolution.status === "resolved_release") {
    const payoutResult = releaseSellerPayout(dispute.caseId);
    if (!payoutResult.ok) {
      return { ok: false, message: payoutResult.message };
    }
  }

  const nextDispute: DisputeCase = {
    ...dispute,
    status: resolution.status,
    resolutionNote: resolution.note,
    resolvedAtMs: now(),
  };

  disputes[disputeIndex] = nextDispute;

  const escrowCase = getEscrowCasesUnsafe().find((item) => item.id === dispute.caseId);
  if (escrowCase) {
    pushNotification(
      notifications,
      escrowCase.buyerId,
      "dispute",
      "Dispute resolved",
      `${escrowCase.title}: ${resolution.status.replaceAll("_", " ")}.`
    );
    pushNotification(
      notifications,
      escrowCase.sellerId,
      "dispute",
      "Dispute resolved",
      `${escrowCase.title}: ${resolution.status.replaceAll("_", " ")}.`
    );
  }

  setDisputes(disputes);
  setNotifications(notifications);

  return { ok: true, message: "Dispute resolved.", data: { dispute: nextDispute } };
}

export function setUserStatus(
  userId: string,
  status: UserStatus,
  reason: string
): ActionResult<{ user: UserAccount }> {
  ensurePrototypeData();

  const users = getUsers();
  const notifications = getNotificationsUnsafe();
  const userIndex = users.findIndex((item) => item.id === userId);
  if (userIndex < 0) {
    return { ok: false, message: "User not found." };
  }

  const nextUser: UserAccount = {
    ...users[userIndex],
    status,
  };
  users[userIndex] = nextUser;

  pushNotification(
    notifications,
    nextUser.id,
    "account",
    "Account status updated",
    `Your account is now ${status}. ${reason}`
  );

  setUsers(users);
  setNotifications(notifications);

  return { ok: true, message: "User status updated.", data: { user: nextUser } };
}

export function setUserBalance(
  userId: string,
  balanceThb: number
): ActionResult<{ user: UserAccount }> {
  ensurePrototypeData();

  const users = getUsers();
  const userIndex = users.findIndex((item) => item.id === userId);
  if (userIndex < 0) {
    return { ok: false, message: "User not found." };
  }

  if (!Number.isFinite(balanceThb) || balanceThb < 0) {
    return { ok: false, message: "Balance must be a non-negative number." };
  }

  const nextUser: UserAccount = {
    ...users[userIndex],
    balanceThb: Math.round(balanceThb),
  };
  users[userIndex] = nextUser;
  setUsers(users);

  return {
    ok: true,
    message: `Balance updated to ${formatMoney(nextUser.balanceThb)}.`,
    data: { user: nextUser },
  };
}

export function getReportsSummary(): ReportsSummary {
  ensurePrototypeData();

  const transactions = getTransactionsUnsafe();
  const disputes = getDisputesUnsafe();
  const auctions = getAuctionsUnsafe();
  const escrowCases = getEscrowCasesUnsafe();

  const grossVolumeThb = transactions
    .filter((item) => item.type === "payment_hold")
    .reduce((sum, item) => sum + item.amountThb, 0);

  const serviceFeeRevenueThb = transactions
    .filter((item) => item.type === "payment_hold")
    .reduce((sum, item) => sum + item.serviceFeeThb, 0);

  const refundsThb = transactions
    .filter((item) => item.type === "refund")
    .reduce((sum, item) => sum + item.amountThb, 0);

  const payoutsThb = transactions
    .filter((item) => item.type === "payout_release")
    .reduce((sum, item) => sum + item.amountThb, 0);

  return {
    transactionCount: transactions.length,
    grossVolumeThb,
    serviceFeeRevenueThb,
    refundsThb,
    payoutsThb,
    failedPaymentCount: auctions.filter((item) => item.status === "payment_failed").length,
    openDisputeCount: disputes.filter((item) => item.status === "open").length,
    heldEscrowCount: escrowCases.filter((item) => item.escrowStatus === "held").length,
  };
}

export function getNotificationsForUser(userId: string) {
  ensurePrototypeData();
  return getNotificationsUnsafe()
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export function markNotificationRead(notificationId: string): ActionResult {
  ensurePrototypeData();

  const notifications = getNotificationsUnsafe();
  const nextNotifications = notifications.map((item) =>
    item.id === notificationId ? { ...item, read: true } : item
  );

  setNotifications(nextNotifications);
  return { ok: true, message: "Notification marked as read." };
}

export function createSellerAuction(input: {
  sellerId: string;
  title: string;
  series: string;
  startingBidThb: number;
  minIncrementThb: number;
  durationHours: number;
}): ActionResult<{ auction: Auction }> {
  ensurePrototypeData();

  if (input.durationHours < 1 || input.durationHours > 24) {
    return { ok: false, message: "Duration must be between 1 and 24 hours." };
  }

  if (input.startingBidThb <= 0 || input.minIncrementThb <= 0) {
    return { ok: false, message: "Starting bid and increment must be positive." };
  }

  const auctions = getAuctionsUnsafe();

  const auction: Auction = {
    id: makeId("auction"),
    title: input.title.trim(),
    series: input.series.trim() || "Pop Mart",
    sellerId: input.sellerId,
    currentBidThb: Math.round(input.startingBidThb),
    minIncrementThb: Math.round(input.minIncrementThb),
    bidsCount: 0,
    highestBidderId: null,
    endsAtMs: now() + input.durationHours * 60 * 60 * 1000,
    status: "live",
    paymentAttempts: 0,
    paymentRetryDueAtMs: null,
    createdAtMs: now(),
  };

  auctions.unshift(auction);
  setAuctions(auctions);

  return { ok: true, message: "Auction created.", data: { auction } };
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

export function getSessionUser() {
  const session = getSession();
  if (!session) return null;
  return getUserByEmail(session.email);
}

export type ResetOptions = {
  keepSession?: boolean;
};

export function resetPrototypeData(options: ResetOptions = {}) {
  if (!hasWindow()) {
    return;
  }

  const { keepSession = true } = options;
  const session = keepSession ? getSession() : null;

  writeJson(KEYS.users, createDefaultUsers());
  writeJson(KEYS.auctions, createDefaultAuctions(now()));
  writeJson(KEYS.bidEvents, [] as BidActivityEvent[]);
  writeJson(KEYS.notifications, [] as NotificationRecord[]);
  writeJson(KEYS.escrowCases, [] as EscrowCase[]);
  writeJson(KEYS.transactions, [] as TransactionRecord[]);
  writeJson(KEYS.disputes, [] as DisputeCase[]);
  writeJson(KEYS.listings, [] as SellerListing[]);
  writeJson(KEYS.simCounter, 0);

  if (session) {
    writeJson(KEYS.session, session);
  } else {
    window.localStorage.removeItem(KEYS.session);
  }
}

export const STORAGE_KEYS = KEYS;
