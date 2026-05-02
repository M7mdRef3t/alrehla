/**
 * masaratContext.ts
 * ══════════════════════════════════════════════════
 * يقرأ البيانات الحية (Pulse + Hafiz/Vertical Resonance)
 * ويوفر سياق ذكي للمسار عشان يتكيف مع حالة المستخدم.
 *
 * إلزامي: كل خدمة AI لازم تستورد getVerticalResonanceState()
 * (راجع AGENTS.md — Vertical Axis Doctrine)
 */

import { usePulseState, type PulseMood } from "@/domains/consciousness/store/pulse.store";
import { useHafizState, getVerticalResonanceState, type VerticalResonanceState } from "@/modules/hafiz/store/hafiz.store";
import {
  syncNiyyaWithPath,
  checkKhalwaNeed,
  getActivePledgesForJourney,
  getCurrentCycleSnapshot,
  getMaskContrast,
} from "./platformBridge";

// ─── Types ─────────────────────────────────────────────────

export interface PulseSnapshot {
  energy: number;       // 1-10
  mood: PulseMood;
  isLow: boolean;       // energy ≤ 3
  isHigh: boolean;      // energy ≥ 8
  isDistressed: boolean; // anxious | overwhelmed | sad
}

export interface AdaptiveHints {
  /** أسئلة أخف — طاقة منخفضة أو حالة صعبة */
  shouldSoften: boolean;
  /** أسئلة أعمق — طاقة عالية واتصال مستقر */
  shouldDeepen: boolean;
  /** أداة تهدئة أولاً قبل السؤال */
  calmingToolFirst: boolean;
  /** ربط روحي — آية أو ذكر مع الخطوة */
  spiritualAnchor: boolean;
  /** رسالة دعم تظهر في بداية الخطوة */
  supportMessage: string | null;
}

export interface KhalwaSuggestion {
  suggested: boolean;
  reason: string | null;
  intention: string | null;
}

export interface NiyyaSync {
  hasIntention: boolean;
  intention: string | null;
  category: string | null;
}

export interface MasaratContext {
  pulse: PulseSnapshot | null;
  resonance: VerticalResonanceState | null;
  hints: AdaptiveHints;
  khalwa: KhalwaSuggestion;
  niyya: NiyyaSync;
  // Tier 2
  mithaq: { hasPledges: boolean; pledges: Array<{ id: string; title: string; category: string }> };
  dawra: { hasData: boolean; energy: { phase: string; trend: string } | null; mood: { phase: string; trend: string } | null; bestDay: string | null };
  qinaa: { hasData: boolean; overallAuthenticity: number; mostMasked: string | null; mostAuthentic: string | null; contrast: number };
}

// ─── Distressed moods ─────────────────────────────────────
const DISTRESSED_MOODS: PulseMood[] = ["anxious", "overwhelmed", "sad", "angry"];

// ─── Support messages ─────────────────────────────────────
const SUPPORT_MESSAGES: Record<string, string> = {
  low_energy:     "💙 طاقتك منخفضة — خد وقتك. الأسئلة خفيفة النهاردة.",
  distressed:     "🤲 حاسس بضغط — مساحة آمنة هنا. مفيش صح وغلط.",
  disconnected:   "🌙 اتصالك بالمصدر ضعيف — ممكن لحظة سكون تفرق.",
  high_radiant:   "✨ طاقتك عالية واتصالك قوي — يلا نعمّق.",
};

// ─── Core Function ─────────────────────────────────────────

/**
 * يقرأ Pulse State + Hafiz Vertical Resonance ويرجع سياق ذكي.
 * آمن للاستدعاء في أي وقت — لو مفيش بيانات يرجع defaults.
 */
export function getMasaratContext(): MasaratContext {
  // ── Read Pulse ──
  let pulse: PulseSnapshot | null = null;
  try {
    const { lastPulse } = usePulseState.getState();
    if (lastPulse) {
      pulse = {
        energy: lastPulse.energy,
        mood: lastPulse.mood,
        isLow: lastPulse.energy <= 3,
        isHigh: lastPulse.energy >= 8,
        isDistressed: DISTRESSED_MOODS.includes(lastPulse.mood),
      };
    }
  } catch {
    // pulse store not available
  }

  // ── Read Vertical Resonance (Hafiz) ──
  let resonance: VerticalResonanceState | null = null;
  try {
    const memories = useHafizState.getState().memories;
    resonance = getVerticalResonanceState(memories);
  } catch {
    // hafiz store not available
  }

  // ── Compute Adaptive Hints ──
  const hints = computeHints(pulse, resonance);

  // ── Khalwa suggestion ──
  const khalwa = checkKhalwaNeed({
    isDistressed: pulse?.isDistressed ?? false,
    isLowEnergy: pulse?.isLow ?? false,
    resonanceLevel: resonance?.level ?? null,
  });

  // ── Niyya sync ──
  const niyya = syncNiyyaWithPath("");

  // ── Tier 2 ──
  const mithaq = getActivePledgesForJourney();
  const dawra = getCurrentCycleSnapshot();
  const qinaa = getMaskContrast();

  return { pulse, resonance, hints, khalwa, niyya, mithaq, dawra, qinaa };
}

// ─── Hint Logic ─────────────────────────────────────────────

function computeHints(
  pulse: PulseSnapshot | null,
  resonance: VerticalResonanceState | null,
): AdaptiveHints {
  const defaults: AdaptiveHints = {
    shouldSoften: false,
    shouldDeepen: false,
    calmingToolFirst: false,
    spiritualAnchor: false,
    supportMessage: null,
  };

  if (!pulse && !resonance) return defaults;

  const hints = { ...defaults };

  // ── Pulse-based hints ──
  if (pulse) {
    if (pulse.isLow || pulse.isDistressed) {
      hints.shouldSoften = true;
      hints.supportMessage = pulse.isDistressed
        ? SUPPORT_MESSAGES.distressed
        : SUPPORT_MESSAGES.low_energy;
    }

    if (pulse.isDistressed) {
      hints.calmingToolFirst = true;
    }

    if (pulse.isHigh) {
      hints.shouldDeepen = true;
    }
  }

  // ── Resonance-based hints ──
  if (resonance) {
    if (resonance.level === "disconnected") {
      hints.spiritualAnchor = true;
      // لو مفيش رسالة من pulse، حط رسالة الاتصال
      if (!hints.supportMessage) {
        hints.supportMessage = SUPPORT_MESSAGES.disconnected;
      }
    }

    if (resonance.level === "radiant" && pulse?.isHigh) {
      hints.shouldDeepen = true;
      hints.supportMessage = SUPPORT_MESSAGES.high_radiant;
    }

    // Steady أو Radiant + مفيش distress → ربط روحي طبيعي
    if (resonance.level === "steady" || resonance.level === "radiant") {
      hints.spiritualAnchor = true;
    }
  }

  // ── Safety: soften overrides deepen ──
  if (hints.shouldSoften) {
    hints.shouldDeepen = false;
  }

  return hints;
}
