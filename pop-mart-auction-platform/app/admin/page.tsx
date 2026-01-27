import Link from "next/link";

type ScreeningItem = {
  id: string;
  title: string;
  seller: string;
  submittedAt: string;
  risk: "low" | "medium" | "high";
  startingPriceUsd: number;
};

type EscrowItem = {
  id: string;
  title: string;
  buyer: string;
  seller: string;
  amountUsd: number;
  status: "awaiting pickup" | "verifying" | "ready to ship";
  dueIn: string;
};

const screeningQueue: ScreeningItem[] = [
  {
    id: "screen-1",
    title: "SKULLPANDA: The Warmth",
    seller: "collector_amy",
    submittedAt: "10:22",
    risk: "low",
    startingPriceUsd: 80,
  },
  {
    id: "screen-2",
    title: "DIMOO Aquarium Secret",
    seller: "milo_pop",
    submittedAt: "09:58",
    risk: "medium",
    startingPriceUsd: 60,
  },
  {
    id: "screen-3",
    title: "LABUBU Forest Night",
    seller: "serena_box",
    submittedAt: "09:41",
    risk: "high",
    startingPriceUsd: 120,
  },
];

const escrowItems: EscrowItem[] = [
  {
    id: "escrow-1",
    title: "HIRONO Mime Limited",
    buyer: "bidder_jay",
    seller: "toy_quest",
    amountUsd: 128,
    status: "awaiting pickup",
    dueIn: "Pickup in 6h",
  },
  {
    id: "escrow-2",
    title: "DIMOO Aquarium Secret",
    buyer: "you",
    seller: "milo_pop",
    amountUsd: 96,
    status: "verifying",
    dueIn: "Verify in 2d",
  },
  {
    id: "escrow-3",
    title: "SKULLPANDA: The Warmth",
    buyer: "bidder_lin",
    seller: "collector_amy",
    amountUsd: 142,
    status: "ready to ship",
    dueIn: "Ship today",
  },
];

const verificationFlow = [
  {
    stage: "Courier Pickup",
    detail: "Dispatch rider and confirm handoff from seller.",
  },
  {
    stage: "Authenticity Check",
    detail: "Inspect condition, originality, and match to listing photos.",
  },
  {
    stage: "Ship to Buyer",
    detail: "Release shipment only after passing verification.",
  },
  {
    stage: "Payout Seller",
    detail: "Deduct service fee and pay seller within 7 days of delivery.",
  },
] as const;

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function riskTone(risk: ScreeningItem["risk"]) {
  if (risk === "high") {
    return "border-rose-300/40 bg-rose-300/10 text-rose-100";
  }
  if (risk === "medium") {
    return "border-amber-300/40 bg-amber-300/10 text-amber-100";
  }
  return "border-emerald-300/40 bg-emerald-300/10 text-emerald-100";
}

function escrowTone(status: EscrowItem["status"]) {
  if (status === "verifying") {
    return "border-sky-300/40 bg-sky-300/10 text-sky-100";
  }
  if (status === "ready to ship") {
    return "border-emerald-300/40 bg-emerald-300/10 text-emerald-100";
  }
  return "border-pink-300/40 bg-pink-300/10 text-pink-100";
}

export default function AdminPage() {
  const totalEscrowUsd = escrowItems.reduce((sum, item) => sum + item.amountUsd, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-pink-400" />
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pink-300">
              Admin View
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
              href="/customer"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-300 hover:text-zinc-950"
            >
              Customer
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-pink-300/90">
              Operations Prototype
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              Escrow, verification, and payout control center.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              This admin-side prototype showcases the workflow that keeps buyers
              safe: screening listings, holding payments, verifying authenticity,
              and releasing funds only after delivery.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Screening", value: screeningQueue.length.toString() },
              { label: "Escrow", value: escrowItems.length.toString() },
              { label: "Held", value: formatUsd(totalEscrowUsd) },
              { label: "SLA", value: "7 days" },
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

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Screening Queue</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Admin review before listings go live helps prevent fraud and
                    mismatched items.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300 transition hover:border-pink-300 hover:text-pink-200"
                >
                  Bulk Review
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {screeningQueue.map((item) => (
                  <article
                    key={item.id}
                    className="flex h-full flex-col rounded-3xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${riskTone(
                          item.risk
                        )}`}
                      >
                        {item.risk}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">Seller: {item.seller}</p>
                    <div className="mt-4 h-24 rounded-2xl border border-white/10 bg-gradient-to-br from-pink-500/25 via-fuchsia-500/10 to-violet-500/25" />
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                          Submitted
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">{item.submittedAt}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                          Start price
                        </p>
                        <p className="mt-1 text-sm font-semibold text-pink-300">
                          {formatUsd(item.startingPriceUsd)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100 transition hover:bg-emerald-300/20"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-100 transition hover:bg-rose-300/20"
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-2xl font-semibold text-white">Verification Pipeline</h2>
              <p className="mt-1 text-sm text-zinc-400">
                The escrow workflow is operationalized as a clear, auditable
                pipeline.
              </p>

              <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {verificationFlow.map((step, index) => (
                  <li
                    key={step.stage}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300/80">
                      Stage {index + 1}
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">{step.stage}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{step.detail}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Escrow Ledger</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Funds are held until verification and delivery are complete.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                    Total held
                  </p>
                  <p className="text-lg font-semibold text-pink-300">{formatUsd(totalEscrowUsd)}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                {escrowItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Buyer: {item.buyer} • Seller: {item.seller}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${escrowTone(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                          Held amount
                        </p>
                        <p className="text-xl font-semibold text-pink-300">
                          {formatUsd(item.amountUsd)}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-zinc-400">{item.dueIn}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-pink-300 hover:text-pink-200"
                      >
                        Open Case
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-pink-300/40 bg-pink-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pink-100 transition hover:bg-pink-300/20"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-pink-400/15 via-fuchsia-400/10 to-violet-400/15 p-6">
              <h2 className="text-2xl font-semibold text-white">Policy Anchors</h2>
              <p className="mt-2 text-sm text-zinc-200">
                These are the guardrails you can point to in a requirement
                engineering presentation.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-zinc-100">
                {[
                  "Money is only released after authenticity verification and delivery confirmation.",
                  "Verification and logistics are intentionally capped at a 7-day SLA.",
                  "The platform deducts a service fee automatically before seller payout.",
                  "Admins can suspend fraudulent users and intervene in disputes.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3"
                  >
                    {item}
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
