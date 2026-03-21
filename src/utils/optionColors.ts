/**
 * ألوان الاختيارات حسب المعنى في كل المنصة:
 * أحمر = أسوأ (استنزاف كثير، لا أمان)، برتقالي، أصفر، أخضر = أفضل.
 */

export type OptionTier = "red" | "amber" | "yellow" | "green";

const TIER_STYLES: Record<
  OptionTier,
  { selected: string; unselected: string; unselectedHover: string }
> = {
  red: {
    selected: "bg-rose-500 text-white border-2 border-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    unselected: "bg-white/5 text-slate-400 border-2 border-transparent",
    unselectedHover: "hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400"
  },
  amber: {
    selected: "bg-amber-500 text-white border-2 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    unselected: "bg-white/5 text-slate-400 border-2 border-transparent",
    unselectedHover: "hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400"
  },
  yellow: {
    selected: "bg-yellow-400 text-slate-950 border-2 border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.3)]",
    unselected: "bg-white/5 text-slate-400 border-2 border-transparent",
    unselectedHover: "hover:bg-yellow-400/10 hover:border-yellow-400/20 hover:text-yellow-400"
  },
  green: {
    selected: "bg-teal-500 text-white border-2 border-teal-600 shadow-[0_0_15px_rgba(20,184,166,0.3)]",
    unselected: "bg-white/5 text-slate-400 border-2 border-transparent",
    unselectedHover: "hover:bg-teal-500/10 hover:border-teal-500/20 hover:text-teal-400"
  }
};

const FOCUS_RING: Record<OptionTier, string> = {
  red: "focus-visible:ring-rose-400",
  amber: "focus-visible:ring-amber-400",
  yellow: "focus-visible:ring-amber-400",
  green: "focus-visible:ring-teal-400"
};

export function getOptionButtonClass(tier: OptionTier, isSelected: boolean): string {
  const base = "inline-flex items-center justify-center text-center whitespace-normal leading-tight rounded-2xl min-h-[44px] px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const t = TIER_STYLES[tier];
  if (isSelected) return `${base} ${t.selected} ${FOCUS_RING[tier]}`;
  return `${base} ${t.unselected} ${t.unselectedHover} focus-visible:ring-slate-300`;
}

/** صيغة قياسية: high→أحمر، medium→برتقالي، low→أصفر، zero→أخضر (للسؤال السلبي مثل استنزاف) */
export const standardNegativeTier: Record<string, OptionTier> = {
  high: "red",
  medium: "amber",
  low: "yellow",
  zero: "green",
  no: "green",
  often: "red",
  sometimes: "amber",
  rarely: "yellow",
  never: "green"
};

/** صيغة قياسية معكوسة: high→أخضر، zero→أحمر (للسؤال الإيجابي مثل أمان/تواصل) */
export const standardPositiveTier: Record<string, OptionTier> = {
  high: "green",
  medium: "amber",
  low: "yellow",
  zero: "red",
  yes: "green",
  no: "red",
  often: "green",
  sometimes: "amber",
  rarely: "yellow",
  never: "red"
};

/** سؤالين سريعين — س1 (استنزاف): سلبي */
export const quick1Tier = standardNegativeTier;

/** سؤالين سريعين — س2 (أمان): إيجابي */
export const quick2Tier = standardPositiveTier;

/** تأثير العلاقة: غالباً أسوأ → سلبي */
export const impactTier = standardNegativeTier;

/** الواقع (تواصل): غالباً أفضل → إيجابي */
export const realityTier = standardPositiveTier;
