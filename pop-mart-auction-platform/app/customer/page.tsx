import Link from "next/link";

type AuctionItem = {
  id: string;
  name: string;
  seller: string;
  currentBidUsd: number;
  minIncrementUsd: number;
  timeLeft: string;
  bids: number;
  yourBidUsd?: number;
  isLeading?: boolean;
};

const auctions: AuctionItem[] = [
  {
    id: "skullpanda-warmth",
    name: "Skullpanda: The Warmth",
    seller: "collector_amy",
    currentBidUsd: 142,
    minIncrementUsd: 5,
    timeLeft: "02:14:09",
    bids: 18,
    yourBidUsd: 135,
    isLeading: false,
  },
  {
    id: "dimoo-secret",
    name: "DIMOO Aquarium Secret",
    seller: "milo_pop",
    currentBidUsd: 96,
    minIncrementUsd: 3,
    timeLeft: "00:48:22",
    bids: 11,
    yourBidUsd: 96,
    isLeading: true,
  },
  {
    id: "labubu-night",
    name: "LABUBU Forest Night",
    seller: "serena_box",
    currentBidUsd: 173,
    minIncrementUsd: 5,
    timeLeft: "05:03:51",
    bids: 24,
  },
  {
    id: "hirono-mime",
    name: "HIRONO Mime Limited",
    seller: "toy_quest",
    currentBidUsd: 128,
    minIncrementUsd: 4,
    timeLeft: "12:19:33",
    bids: 9,
  },
];

const notifications = [
  {
    title: "Outbid Alert",
    body: "User X outbid you on Skullpanda: The Warmth with $142.",
    tone: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  },
  {
    title: "Winning Locked",
    body: "You are currently leading DIMOO Aquarium Secret at $96.",
    tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  },
  {
    title: "Escrow Reminder",
    body: "Winning bids are auto-charged and held until verification completes.",
    tone: "border-pink-300/30 bg-pink-300/10 text-pink-100",
  },
] as const;

const walletRules = [
  "A payment method must be linked before bidding.",
  "If funds are insufficient at auction close, the system retries payment.",
  "Repeated failed payments can lead to account suspension.",
] as const;

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CustomerPage() {
  const spotlight = auctions[0];
  const suggestedBid = spotlight.currentBidUsd + spotlight.minIncrementUsd;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-pink-400" />
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pink-300">
              Customer View
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-pink-300 hover:text-pink-200"
            >
              Landing
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-300 hover:text-zinc-950"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-pink-300/90">
              Marketplace Prototype
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              Live bidding with escrow-protected checkout.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              This page demonstrates the buyer journey: browse auctions, react to
              outbid alerts, and understand that winning payments are held until
              authenticity verification is done.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Live", value: auctions.length.toString() },
              { label: "Leading", value: "1" },
              { label: "Outbid", value: "1" },
              { label: "Escrow", value: "On" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Auctions</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Static mock data representing current bid, time left, and bid
                  increments.
                </p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "All", active: true },
                  { label: "Ending Soon" },
                  { label: "My Bids" },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      tab.active
                        ? "border-pink-300/60 bg-pink-300/15 text-pink-100"
                        : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {auctions.map((auction) => {
                const nextBid = auction.currentBidUsd + auction.minIncrementUsd;
                const youAreLeading = auction.isLeading;

                return (
                  <article
                    key={auction.id}
                    className="flex h-full flex-col rounded-3xl border border-white/10 bg-black/30 p-4 transition hover:-translate-y-1 hover:border-pink-300/40"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">
                        {auction.name}
                      </p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-300">
                        {auction.timeLeft}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Seller: {auction.seller}
                    </p>

                    <div className="mt-4 h-28 rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/25 via-fuchsia-500/15 to-violet-500/25" />

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                          Current
                        </p>
                        <p className="text-2xl font-semibold text-pink-300">
                          {formatUsd(auction.currentBidUsd)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Next bid</p>
                        <p className="text-sm font-semibold text-white">
                          {formatUsd(nextBid)}
                        </p>
                      </div>
                    </div>

                    {auction.yourBidUsd ? (
                      <div
                        className={`mt-4 rounded-2xl border px-3 py-2 text-xs font-medium ${
                          youAreLeading
                            ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
                            : "border-amber-300/40 bg-amber-300/10 text-amber-100"
                        }`}
                      >
                        {youAreLeading
                          ? `You are leading at ${formatUsd(auction.yourBidUsd)}.`
                          : `You bid ${formatUsd(auction.yourBidUsd)}. Currently outbid.`}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-pink-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-pink-300"
                    >
                      Bid {formatUsd(nextBid)}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-semibold text-white">Bidding Panel</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Focused view of a single auction with rules that map to your
                requirement doc.
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {spotlight.name}
                    </p>
                    <p className="text-xs text-zinc-500">Seller: {spotlight.seller}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">
                    {spotlight.timeLeft}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Current bid
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-pink-300">
                      {formatUsd(spotlight.currentBidUsd)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Min increment
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {formatUsd(spotlight.minIncrementUsd)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-pink-300/30 bg-pink-300/10 p-3 text-sm text-pink-100">
                  Suggested next bid: <span className="font-semibold">{formatUsd(suggestedBid)}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[suggestedBid, suggestedBid + 5, suggestedBid + 10, suggestedBid + 20].map(
                    (amount) => (
                      <button
                        key={amount}
                        type="button"
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:border-pink-300 hover:text-pink-200"
                      >
                        {formatUsd(amount)}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-2xl bg-pink-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-pink-300"
                >
                  Confirm Bid
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Outbid and auction-end alerts are core to the experience.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {notifications.map((note) => (
                  <div
                    key={note.title}
                    className={`rounded-2xl border px-4 py-3 text-sm ${note.tone}`}
                  >
                    <p className="font-semibold">{note.title}</p>
                    <p className="mt-1 text-xs text-white/80">{note.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-semibold text-white">Wallet Rules</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Prototype copy that communicates the payment and ban policy.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {walletRules.map((rule) => (
                  <div
                    key={rule}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-300"
                  >
                    {rule}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
