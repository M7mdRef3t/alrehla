import type { FC } from "react";

type InlineIntent = "clarity" | "boundaries" | "calm";

interface InlineCompassProps {
  inlineIntent: InlineIntent;
  onIntentChange: (intent: InlineIntent) => void;
  recommendation: string;
  pulseAvg: number | null;
  onStartJourney: () => void;
}

const INTENT_BUTTON_BASE = "rounded-full border min-h-[44px] px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#132030]";
const INTENT_ACTIVE = "border-teal-300/70 bg-teal-400/20 text-teal-100";
const INTENT_INACTIVE = "border-white/15 bg-white/5 text-slate-200";

export const InlineCompass: FC<InlineCompassProps> = ({
  inlineIntent,
  onIntentChange,
  recommendation,
  pulseAvg,
  onStartJourney
}) => (
  <div
    className="landing-inline-compass mt-5 w-full max-w-xl rounded-2xl border border-teal-500/25 bg-teal-500/10 p-4 text-right"
    role="group"
    aria-labelledby="compass-heading"
  >
    <p id="compass-heading" className="text-sm font-bold uppercase tracking-[0.15em] text-teal-300" lang="en">AI Compass</p>
    <p className="mt-2 text-sm font-semibold text-slate-200">
      {pulseAvg != null && pulseAvg < 45
        ? "ابدأ بخطوة استعادة هادئة قبل أي قرار كبير."
        : "ابدأ بخطوة واحدة واضحة وثبّت الإيقاع اليومي."}
    </p>
    <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="اختر نيّتك">
      {([
        { key: "clarity" as const, label: "وضوح" },
        { key: "boundaries" as const, label: "حدود" },
        { key: "calm" as const, label: "اتزان" }
      ]).map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onIntentChange(key)}
          aria-pressed={inlineIntent === key}
          className={`${INTENT_BUTTON_BASE} ${inlineIntent === key ? INTENT_ACTIVE : INTENT_INACTIVE}`}
        >
          {label}
        </button>
      ))}
    </div>
    <p className="mt-3 text-sm font-semibold text-slate-100" aria-live="polite" aria-atomic="true">{recommendation}</p>
    <button
      type="button"
      onClick={onStartJourney}
      className="mt-3 min-h-[44px] rounded-lg border border-teal-300/40 bg-teal-500/20 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#132030]"
    >
      ابدأ بالمسار المقترح
    </button>
  </div>
);
