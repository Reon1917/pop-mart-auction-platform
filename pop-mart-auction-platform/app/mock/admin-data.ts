export type AdminScreeningItem = {
  id: string;
  title: string;
  seller: string;
  startingPriceThb: number;
  durationHours: number;
  submittedLabel: string;
  risk: "low" | "medium" | "high";
};

export type AdminEscrowItem = {
  id: string;
  title: string;
  buyer: string;
  seller: string;
  amountThb: number;
  status: "awaiting pickup" | "verifying" | "ready to ship" | "delivered";
  note: string;
};

export const DEFAULT_ADMIN_SCREENING: AdminScreeningItem[] = [
  {
    id: "screen-1",
    title: "HIRONO Mime Limited",
    seller: "toy_quest",
    startingPriceThb: 3800,
    durationHours: 4,
    submittedLabel: "10:22",
    risk: "low",
  },
  {
    id: "screen-2",
    title: "LABUBU Forest Night",
    seller: "serena_box",
    startingPriceThb: 5200,
    durationHours: 8,
    submittedLabel: "09:58",
    risk: "medium",
  },
];

export const DEFAULT_ADMIN_ESCROW: AdminEscrowItem[] = [
  {
    id: "escrow-1",
    title: "Skullpanda: The Warmth",
    buyer: "bidder_lin",
    seller: "collector_amy",
    amountThb: 4500,
    status: "awaiting pickup",
    note: "Pickup window in 6h",
  },
  {
    id: "escrow-2",
    title: "DIMOO Aquarium Secret",
    buyer: "bidder_jay",
    seller: "milo_pop",
    amountThb: 3360,
    status: "verifying",
    note: "Verification in progress",
  },
];

export const VERIFICATION_STEPS = [
  {
    stage: "Courier Pickup",
    detail: "Dispatch courier and confirm handoff from seller.",
  },
  {
    stage: "Authenticity Check",
    detail: "Inspect condition, originality, and match listing photos.",
  },
  {
    stage: "Ship to Buyer",
    detail: "Release shipment only after verification passes.",
  },
  {
    stage: "Payout Seller",
    detail: "Deduct service fee and pay seller within 7 days of delivery.",
  },
] as const;
