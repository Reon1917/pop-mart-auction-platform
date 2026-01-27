export type CustomerAuction = {
  id: string;
  title: string;
  series: string;
  seller: string;
  currentBidThb: number;
  minIncrementThb: number;
  bids: number;
  endsAtMs: number;
};

type CustomerAuctionSeed = {
  id: string;
  title: string;
  series: string;
  seller: string;
  startingBidThb: number;
  minIncrementThb: number;
  durationHours: number;
};

const CUSTOMER_AUCTION_SEEDS: CustomerAuctionSeed[] = [
  {
    id: "skullpanda-warmth",
    title: "Skullpanda: The Warmth",
    series: "Skullpanda",
    seller: "collector_amy",
    startingBidThb: 4200,
    minIncrementThb: 100,
    durationHours: 6,
  },
  {
    id: "dimoo-secret",
    title: "DIMOO Aquarium Secret",
    series: "DIMOO",
    seller: "milo_pop",
    startingBidThb: 3200,
    minIncrementThb: 80,
    durationHours: 3,
  },
];

export function createDefaultCustomerAuctions(nowMs = Date.now()): CustomerAuction[] {
  return CUSTOMER_AUCTION_SEEDS.map((seed, index) => {
    const staggerMs = index * 45 * 60 * 1000;

    return {
      id: seed.id,
      title: seed.title,
      series: seed.series,
      seller: seed.seller,
      currentBidThb: seed.startingBidThb,
      minIncrementThb: seed.minIncrementThb,
      bids: 0,
      endsAtMs: nowMs + seed.durationHours * 60 * 60 * 1000 - staggerMs,
    };
  });
}
