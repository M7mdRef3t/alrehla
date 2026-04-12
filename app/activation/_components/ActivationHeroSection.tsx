"use client";

import { ShieldCheck, Zap, Infinity as InfinityIcon } from "lucide-react";

type PricingRow = {
  title: string;
  value: string;
  note: string;
};

type ActivationHeroSectionProps = {
  funnelStep: number;
  priceLine: string;
  pricingRows: PricingRow[];
  seatsLeft: number | null;
  totalSeats: number;
  source: string;
  scarcityPct: number;
  steps: string[];
  userName?: string | null;
};

const FUNNEL_STEPS = [
  { n: 1, label: "Ø§Ø®ØªÙŠØ§Ø± ÙˆØ³ÙŠÙ„Ø© Ø§Ù„Ø¯ÙØ¹" },
  { n: 2, label: "Ø¥ØªÙ…Ø§Ù… Ø§Ù„ØªØ­ÙˆÙŠÙ„" },
  { n: 3, label: "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø«Ø¨Ø§Øª" },
] as const;

export function ActivationHeroSection({
  funnelStep,
  priceLine,
  pricingRows,
  seatsLeft,
  totalSeats,
  source,
  scarcityPct,
  steps,
  userName,
}: ActivationHeroSectionProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,_rgba(20,184,166,0.12),_transparent)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-10 pb-6">

        {/* â”€â”€â”€ Funnel progress â”€â”€â”€ */}
        <div className="mb-8 flex items-center justify-center gap-0">
          {FUNNEL_STEPS.map((step, index) => (
            <div key={step.n} className="contents">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-500 ${
                    funnelStep >= step.n
                      ? "bg-teal-400 text-slate-950 shadow-[0_0_16px_rgba(20,184,166,0.6)]"
                      : "bg-white/10 text-slate-500"
                  }`}
                >
                  {funnelStep > step.n ? "âœ“" : step.n}
                </div>
                <span
                  className={`hidden text-center text-[10px] font-bold sm:block ${
                    funnelStep >= step.n ? "text-teal-300" : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < FUNNEL_STEPS.length - 1 ? (
                <div
                  className={`mx-2 mb-4 h-px w-16 rounded-full transition-all duration-700 sm:w-24 ${
                    funnelStep > step.n ? "bg-teal-400/60" : "bg-white/10"
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* â”€â”€â”€ Main hero split â”€â”€â”€ */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]" dir="rtl">

          {/* Left: Copy */}
          <div>
            {userName ? (
              <p className="mb-2 text-sm font-bold text-teal-400">
                Ø£Ù‡Ù„Ø§Ù‹ {userName} ðŸ‘‹
              </p>
            ) : null}
            <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-500/70">
              Founding Cohort
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">
              ÙØ¹ÙÙ‘Ù„ ÙˆØµÙˆÙ„Ùƒ Ø¥Ù„Ù‰ Ø§Ù„Ø±Ø­Ù„Ø©
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
              Ø§Ø®ØªØ± ÙˆØ³ÙŠÙ„Ø© Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø©ØŒ Ø£ØªÙ…Ù‘ Ø§Ù„ØªØ­ÙˆÙŠÙ„ØŒ ÙˆØ£Ø±Ø³Ù„ Ø§Ù„Ø¥Ø«Ø¨Ø§Øª â€” Ø³ÙŠØªÙˆÙ„Ù‰ Ø§Ù„ÙØ±ÙŠÙ‚ Ø±Ø¨Ø· Ø­Ø³Ø§Ø¨Ùƒ ÙÙˆØ±Ø§Ù‹.
            </p>

            {/* Price badge */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-teal-400/25 bg-teal-400/10 px-5 py-3 backdrop-blur-sm">
              <span className="text-sm font-black text-teal-200">{priceLine}</span>
            </div>

            {/* Feature pills */}
            <div className="mt-5 flex flex-wrap gap-3">
              {pricingRows.map((row) => (
                <div
                  key={row.title}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2.5 backdrop-blur-sm"
                >
                  <div className="h-5 w-5 shrink-0 text-teal-400">
                    {row.title === "Ø§Ù„Ù…Ø¯Ø©" ? <InfinityIcon className="h-5 w-5" /> : row.title === "Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª" ? <Zap className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-black text-white">{row.value}</span>
                    <span className="mx-1 text-slate-600">Â·</span>
                    <span className="text-xs text-slate-400">{row.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Scarcity + Steps */}
          <div className="flex flex-col gap-4">

            {/* Scarcity card */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                  <ShieldCheck className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Ø§Ù„Ù…Ù‚Ø§Ø¹Ø¯ Ø§Ù„Ù…ØªØ§Ø­Ø©</p>
                  <p className="text-xs text-amber-200/60">ØªØ­Ø¯ÙŠØ« ÙÙˆØ±ÙŠ</p>
                </div>
                <p className="mr-auto text-3xl font-black text-white tabular-nums">
                  {typeof seatsLeft === "number" ? seatsLeft : "â€”"}
                </p>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${scarcityPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {typeof seatsLeft === "number"
                  ? `${seatsLeft} Ù…Ù† Ø£ØµÙ„ ${totalSeats} Ù…Ù‚Ø¹Ø¯ Ù…ØªØ§Ø­`
                  : "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ù…Ø§ÙƒÙ†"}
              </p>
            </div>

            {/* Steps */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400/70">
                Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªÙØ¹ÙŠÙ„
              </p>
              <ol className="mt-4 space-y-3">
                {steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10 text-[10px] font-black text-teal-300">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-sm leading-6 text-slate-300">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

