"use client";

import { ShieldCheck, Zap, Infinity } from "lucide-react";

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
  { n: 1, label: "اختيار وسيلة الدفع" },
  { n: 2, label: "إتمام التحويل" },
  { n: 3, label: "إرسال الإثبات" },
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

        {/* ─── Funnel progress ─── */}
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
                  {funnelStep > step.n ? "✓" : step.n}
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

        {/* ─── Main hero split ─── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]" dir="rtl">

          {/* Left: Copy */}
          <div>
            {userName ? (
              <p className="mb-2 text-sm font-bold text-teal-400">
                أهلاً {userName} 👋
              </p>
            ) : null}
            <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-500/70">
              Founding Cohort
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">
              فعِّل وصولك إلى الرحلة
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
              اختر وسيلة الدفع المناسبة، أتمّ التحويل، وأرسل الإثبات — سيتولى الفريق ربط حسابك فوراً.
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
                    {row.title === "المدة" ? <Infinity className="h-5 w-5" /> : row.title === "التحديثات" ? <Zap className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-black text-white">{row.value}</span>
                    <span className="mx-1 text-slate-600">·</span>
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
                  <p className="text-sm font-black text-white">المقاعد المتاحة</p>
                  <p className="text-xs text-amber-200/60">تحديث فوري</p>
                </div>
                <p className="mr-auto text-3xl font-black text-white tabular-nums">
                  {typeof seatsLeft === "number" ? seatsLeft : "—"}
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
                  ? `${seatsLeft} من أصل ${totalSeats} مقعد متاح`
                  : "جارٍ تحميل بيانات الأماكن"}
              </p>
            </div>

            {/* Steps */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-5 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400/70">
                خطوات التفعيل
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
