import Link from "next/link";

type FeaturedAuction = {
  id: string;
  name: string;
  series: string;
  currentBidUsd: number;
  bids: number;
  timeLeft: string;
};

const featuredAuctions: FeaturedAuction[] = [
  {
    id: "skullpanda-01",
    name: "Skullpanda: The Warmth",
    series: "Skullpanda",
    currentBidUsd: 142,
    bids: 18,
    timeLeft: "02:14:09",
  },
  {
    id: "dimoo-02",
    name: "DIMOO Aquarium Secret",
    series: "DIMOO",
    currentBidUsd: 96,
    bids: 11,
    timeLeft: "00:48:22",
  },
  {
    id: "labubu-03",
    name: "LABUBU Forest Night",
    series: "The Monsters",
    currentBidUsd: 173,
    bids: 24,
    timeLeft: "05:03:51",
  },
  {
    id: "hirono-04",
    name: "HIRONO Mime Limited",
    series: "HIRONO",
    currentBidUsd: 128,
    bids: 9,
    timeLeft: "12:19:33",
  },
];

const processSteps = [
  {
    title: "List & Screen",
    description:
      "Sellers submit photos and details. Admin reviews before anything goes live.",
  },
  {
    title: "Bid Live",
    description:
      "Buyers bid with fair increments and clear countdowns. Outbid alerts keep them engaged.",
  },
  {
    title: "Escrow & Verify",
    description:
      "Winning payments are held. Items are couriered to the office and checked for authenticity.",
  },
  {
    title: "Deliver & Payout",
    description:
      "Verified items ship to buyers. Sellers are paid within 7 days, minus the platform fee.",
  },
] as const;

const trustSignals = [
  {
    label: "Escrow First",
    detail: "Funds stay protected until verification and delivery are confirmed.",
  },
  {
    label: "Pop Mart Only",
    detail: "The platform is focused to make screening and authenticity checks realistic.",
  },
  {
    label: "Notification Driven",
    detail: "Outbid and auction-end updates are designed as core user moments.",
  },
] as const;

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-pink-400" />
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pink-300">
              Pop Mart Auction
            </p>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              href="/customer"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-pink-300 hover:text-pink-200"
            >
              Customer Flow
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-pink-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-pink-300"
            >
              Admin Flow
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-pink-300/90">
              Requirement Engineering Prototype
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-white sm:text-6xl">
              Secure auctions for Pop Mart collectors.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
              A no-backend prototype focused on the core story: verified listings,
              live bidding, escrow protection, and authenticity checks before
              payout.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/customer"
                className="inline-flex items-center justify-center rounded-xl bg-pink-400 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-pink-300"
              >
                Explore Customer Side
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-pink-300 hover:text-pink-200"
              >
                View Admin Side
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Screened Listings", value: "100%" },
                { label: "Escrow Protected", value: "7 days" },
                { label: "Service Fee", value: "Auto" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5"
                >
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-xl">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Live Auction Snapshot
                  </p>
                  <p className="text-xs text-zinc-500">Mock data • No backend</p>
                </div>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-medium text-emerald-200">
                  Real-time UI
                </span>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3">
                {featuredAuctions.slice(0, 3).map((auction) => (
                  <div
                    key={auction.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {auction.name}
                      </p>
                      <p className="text-xs text-zinc-400">{auction.series}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-pink-300">
                        {formatUsd(auction.currentBidUsd)}
                      </p>
                      <p className="text-xs text-zinc-500">{auction.timeLeft}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-pink-300/20 bg-pink-300/10 px-4 py-3 text-sm text-pink-100">
                When you win, funds go on hold until authenticity verification is
                complete.
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Featured Auctions
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
                These cards are powered by static mock data that mirrors the
                auction rules and user expectations.
              </p>
            </div>
            <Link
              href="/customer"
              className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-pink-300 hover:text-pink-200 sm:inline-flex"
            >
              Go To Marketplace
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredAuctions.map((auction) => (
              <article
                key={auction.id}
                className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-1 hover:border-pink-300/40"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-zinc-300">
                    {auction.series}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {auction.timeLeft}
                  </span>
                </div>

                <div className="mt-4 h-32 rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/30 via-fuchsia-500/20 to-violet-500/30" />

                <h3 className="mt-4 text-base font-semibold text-white">
                  {auction.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">{auction.bids} bids</p>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Current bid
                    </p>
                    <p className="text-2xl font-semibold text-pink-300">
                      {formatUsd(auction.currentBidUsd)}
                    </p>
                  </div>
                  <Link
                    href="/customer"
                    className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-300 hover:text-zinc-950"
                  >
                    Place bid
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-semibold text-white">How It Works</h2>
              <p className="mt-2 text-sm text-zinc-400">
                The prototype follows the full auction-to-payout workflow described
                in your requirements.
              </p>
              <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {processSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300/80">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {step.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-semibold text-white">Why Buyers Trust It</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Trust is a product feature here. These signals map directly to the
                escrow and verification model.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4">
                {trustSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="text-sm font-semibold text-white">
                      {signal.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {signal.detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-pink-400/15 via-fuchsia-400/10 to-violet-400/15 p-4 text-sm text-zinc-200">
                Admins hold funds in escrow, dispatch couriers, verify authenticity,
                and release payouts within 7 days after delivery.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Pop Mart Auction Platform</p>
            <p className="text-xs text-zinc-500">No-backend prototype for requirement engineering.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/customer"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-pink-300 hover:text-pink-200"
            >
              Customer
            </Link>
            <Link
              href="/admin"
              className="rounded-full bg-pink-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-950 transition hover:bg-pink-300"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
