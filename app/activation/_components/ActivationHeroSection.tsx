"use client";

import { ShieldCheck } from "lucide-react";

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
  { n: 1, label: "اختار طريقة الدفع" },
  { n: 2, label: "حوّل الفلوس" },
  { n: 3, label: "ابعت الإثبات" }
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
    <>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="flex items-center gap-0" dir="rtl">
          {FUNNEL_STEPS.map((step, index) => (
            <div key={step.n} className="contents">
              <div className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-all duration-500 ${
                    funnelStep >= step.n
                      ? "bg-teal-400 text-slate-950 shadow-[0_0_18px_rgba(20,184,166,0.55)]"
                      : "bg-white/10 text-slate-500"
                  }`}
                >
                  {funnelStep > step.n ? "✓" : step.n}
                </div>
                <span
                  className={`hidden text-center text-[11px] font-bold leading-tight sm:block ${
                    funnelStep >= step.n ? "text-teal-300" : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < FUNNEL_STEPS.length - 1 ? (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded-full transition-all duration-700 ${
                    funnelStep > step.n ? "bg-teal-400/60" : "bg-white/10"
                  }`}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04]">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">Founding Cohort</p>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight md:text-5xl">
              {userName ? (
                <>
                  <span className="block text-teal-400 mb-2 text-2xl md:text-3xl">أهلاً يا {userName}، نورت الرحلة.</span>
                </>
              ) : null}
              فعّل رحلتك من غير لف ودوران
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base md:leading-8">
              اختار طريقة الدفع، ابعت الإثبات، وإحنا نراجع التفعيل يدويًا على نفس الحساب.
            </p>
            <div className="mt-5 inline-flex rounded-2xl border border-teal-300/20 bg-teal-400/10 px-4 py-3 text-sm font-bold text-teal-100">
              {priceLine}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pricingRows.map((row) => (
                <div key={row.title} className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{row.title}</p>
                  <p className="mt-2 text-xl font-black text-white">{row.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{row.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/20 p-6 md:p-8 lg:border-r lg:border-t-0">
            <div className="rounded-[28px] border border-amber-300/15 bg-amber-400/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-200/10 text-amber-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">الحجز الحالي</p>
                  <p className="text-xs text-amber-100/80">التحديث حيّ لما المصدر يكون متاح</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-white">{typeof seatsLeft === "number" ? seatsLeft : "--"}</p>
              <p className="mt-1 text-sm text-slate-300">
                {typeof seatsLeft === "number" ? "مقاعد متبقية الآن" : "بيانات المقاعد غير متاحة"}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-teal-300 transition-all duration-500" style={{ width: `${scarcityPct}%` }} />
              </div>
              <p className="mt-3 text-xs text-slate-400">المصدر: {source} • السعة الكلية: {totalSeats}</p>
            </div>

            <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-black text-white">الخطوات</p>
              <ol className="mt-4 space-y-3">
                {steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-teal-200">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
