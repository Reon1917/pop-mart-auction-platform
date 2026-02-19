export type UserSeed = {
  id: string;
  role: "buyer" | "seller" | "admin";
  name: string;
  email: string;
  paymentMethodLabel: string;
  shippingAddress: string;
  balanceThb: number;
};

export type AuctionSeed = {
  id: string;
  title: string;
  series: string;
  sellerId: string;
  startingBidThb: number;
  minIncrementThb: number;
  durationHours: number;
};

export type NotificationSeed = {
  id: string;
  userId: string;
  type: "outbid" | "sold" | "payment" | "refund" | "payout" | "shipment" | "account" | "dispute";
  title: string;
  message: string;
  createdAtMs: number;
  read: boolean;
};

export type TransactionSeed = {
  id: string;
  auctionId: string;
  caseId: string;
  type: "payment_hold" | "refund" | "payout_release";
  amountThb: number;
  serviceFeeThb: number;
  createdAtMs: number;
};

export type DisputeSeed = {
  id: string;
  caseId: string;
  createdByUserId: string;
  reason: string;
  status: "open" | "resolved_refund" | "resolved_release" | "rejected";
  resolutionNote: string;
  createdAtMs: number;
  resolvedAtMs: number | null;
};

export type PaymentGatewaySeed = {
  id: string;
  auctionId: string;
  buyerId: string;
  attempt: number;
  provider: string;
  status: "initiated" | "authorized" | "captured" | "failed";
  amountThb: number;
  message: string;
  createdAtMs: number;
};

export const USER_SEEDS: UserSeed[] = [
  {
    id: "buyer-demo",
    role: "buyer",
    name: "Buyer Demo",
    email: "buyer@popmart.demo",
    paymentMethodLabel: "Visa •••• 1108",
    shippingAddress: "18 Sukhumvit Road, Bangkok 10110",
    balanceThb: 22000,
  },
  {
    id: "buyer-rival-1",
    role: "buyer",
    name: "Bidder Lin",
    email: "bidder.lin@popmart.demo",
    paymentMethodLabel: "Mastercard •••• 2184",
    shippingAddress: "77 Rama IX Road, Bangkok 10310",
    balanceThb: 16000,
  },
  {
    id: "buyer-rival-2",
    role: "buyer",
    name: "Bidder Jay",
    email: "bidder.jay@popmart.demo",
    paymentMethodLabel: "Debit •••• 9021",
    shippingAddress: "55 Petchburi Road, Bangkok 10400",
    balanceThb: 9000,
  },
  {
    id: "seller-demo",
    role: "seller",
    name: "Seller Demo",
    email: "seller@popmart.demo",
    paymentMethodLabel: "Bank •••• 5532",
    shippingAddress: "Warehouse A, 199 Ladprao Road, Bangkok 10230",
    balanceThb: 3500,
  },
  {
    id: "seller-quest",
    role: "seller",
    name: "Toy Quest",
    email: "toy.quest@popmart.demo",
    paymentMethodLabel: "Bank •••• 7891",
    shippingAddress: "Toy Quest Hub, 45 Ratchadaphisek Road, Bangkok 10320",
    balanceThb: 4200,
  },
  {
    id: "admin-demo",
    role: "admin",
    name: "Admin Demo",
    email: "admin@popmart.demo",
    paymentMethodLabel: "Platform Wallet",
    shippingAddress: "Pop Mart Operations HQ",
    balanceThb: 0,
  },
];

export const AUCTION_SEEDS: AuctionSeed[] = [
  {
    id: "auction-warmth",
    title: "Skullpanda: The Warmth",
    series: "Skullpanda",
    sellerId: "seller-demo",
    startingBidThb: 4200,
    minIncrementThb: 100,
    durationHours: 5,
  },
  {
    id: "auction-aquarium",
    title: "DIMOO Aquarium Secret",
    series: "DIMOO",
    sellerId: "seller-quest",
    startingBidThb: 3200,
    minIncrementThb: 80,
    durationHours: 3,
  },
];

export const NOTIFICATION_SEEDS: NotificationSeed[] = [];

export const TRANSACTION_SEEDS: TransactionSeed[] = [];

export const DISPUTE_SEEDS: DisputeSeed[] = [];

export const PAYMENT_GATEWAY_SEEDS: PaymentGatewaySeed[] = [];
