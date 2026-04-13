'use client';

import type { FC } from "react";
import { useState, useCallback, useEffect, useRef, memo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from '@/modules/map/dawayirIndex';
import { useJourneyProgress } from "@/domains/journey";
import { setInLocalStorage } from "@/services/browserStorage";
import { trackingService } from "@/domains/journey";
import { type PulseEntry } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { soundManager } from "@/services/soundManager";
import { analyticsService, AnalyticsEvents, generateUUID } from "@/domains/analytics";
import { FirstSparkOnboarding } from "./FirstSparkOnboarding";
import { AlertTriangle, Mail, ArrowRight, Sparkles, Zap, Smartphone, User, Lock, ShieldCheck, Target, Activity } from "lucide-react";
import { PATH_NAMES, generateDynamicPlan, SYMPTOM_TYPE_LABELS, PATTERN_TYPE_LABELS } from "@/modules/pathEngine/pathResolver";
import type { DynamicRecoveryPlan, SymptomType, ContactLevel } from "@/modules/pathEngine/pathTypes";
import { signInWithMagicLink } from "@/services/authService";
import { sendRecoveryPlanEmail } from "@/services/emailService";
import type { AdviceCategory } from "@/data/adviceScripts";
import { enableNotificationsWithPrompt, getNotificationPermission } from "@/services/pushNotifications";
import { marketingLeadService } from "@/services/marketingLeadService";
import { StepPainDump } from "./StepPainDump";
import { classifyState, safetyTriage, type TransformationDiagnosis, type PoeticState } from "../transformationEngine/interpretationEngine";
import { generateSovereignInsight } from "@/services/interpretationAI";


const ONBOARDING_STYLES = `
@keyframes ob-ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.08); opacity: 1; }
}
@keyframes ob-center-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.2); filter: brightness(1.3); }
}
@keyframes ob-icon-breathe {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px var(--soft-teal-glow)); }
  50% { transform: scale(1.08); filter: drop-shadow(0 0 24px var(--soft-teal-glow)); }
}
.ob-step-enter {
  opacity: 1; transform: translateX(0) scale(1);
  transition: opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.ob-step-exit {
  opacity: 0; transform: translateX(60px) scale(0.95);
  transition: opacity 0.25s ease-in, transform 0.25s ease-in;
  pointer-events: none; position: absolute; inset: 0;
}
.ob-btn-tap:active { transform: scale(0.96); transition: transform 0.1s; }

/* Force premium variables */
.ob-dark-force {
  --color-primary-soft: rgba(5, 8, 20, 0.98);
  --glass-bg: rgba(5, 8, 20, 0.85);
  --glass-bg-hover: rgba(10, 15, 35, 0.9);
  --glass-border: rgba(0, 240, 255, 0.25);
  --glass-border-hover: rgba(0, 240, 255, 0.5);
  --text-primary: #ffffff;
  --text-secondary: #e0f2fe;
  --text-muted: rgba(148, 163, 184, 0.8);
  --text-accent: #00f0ff;
  --soft-teal: #00f0ff;
  --soft-teal-dim: rgba(0, 240, 255, 0.15);
  --soft-teal-glow: rgba(0, 240, 255, 0.4);
}

/* ── Cinematic background ── */
.ob-bg {
  background: #020408;
}
.ob-bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform;
  filter: blur(80px);
}
.ob-orb-1 {
  width: 750px; height: 750px;
  background: radial-gradient(circle, rgba(0,240,255,0.18) 0%, transparent 75%);
  top: -20%; right: -12%;
  animation: ob-orb-drift1 45s ease-in-out infinite alternate;
}
.ob-orb-2 {
  width: 620px; height: 620px;
  background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 75%);
  bottom: -25%; left: -15%;
  animation: ob-orb-drift2 60s ease-in-out infinite alternate;
}
.ob-orb-3 {
  width: 480px; height: 480px;
  background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 75%);
  top: 45%; left: 15%;
  animation: ob-orb-drift3 52s ease-in-out infinite alternate;
}
.ob-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 25%, transparent 100%);
  opacity: 0.55;
  pointer-events: none;
}
@keyframes ob-orb-drift1 {
  0%   { transform: translate(0%, 0%)  scale(1);    }
  50%  { transform: translate(-8%, 10%) scale(1.15);  }
  100% { transform: translate(5%, -5%) scale(0.9); }
}
@keyframes ob-orb-drift2 {
  0%   { transform: translate(0%, 0%)    scale(1);    }
  50%  { transform: translate(10%, -12%) scale(1.1); }
  100% { transform: translate(-6%, 8%)  scale(0.95); }
}
@keyframes ob-orb-drift3 {
  0%   { transform: translate(0%, 0%)  scale(1);    }
  100% { transform: translate(6%, -10%) scale(1.2); }
}
`;


/* ════════════════════════════════════════════════
   ONBOARDING FLOW — رحلة اكتشاف الذات
   ════════════════════════════════════════════════ */

const ONBOARDING_KEY = "dawayir-journey-onboarding-done";

/* eslint-disable react-refresh/only-export-components */
export function markJourneyOnboardingDone(): void {
  setInLocalStorage(ONBOARDING_KEY, "true");
}

export function resetJourneyOnboarding(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ONBOARDING_KEY);
  }
}

export function hasCompletedJourneyOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}
/* eslint-enable react-refresh/only-export-components */

interface OnboardingFlowProps {
  onComplete: (skipped?: boolean) => void;
  initialMirrorName?: string | null;
  gateContext?: {
    message: string;
    painPoint?: string | null;
    intent?: string | null;
  } | null;
}

type Ring = "green" | "yellow" | "red";

interface NameCard { name: string; category: AdviceCategory; ring: Ring | null; placed: boolean; symptomIds?: string[] }

interface DerivedOnboardingResult {
  relationshipCount: number;
  redCount: number;
  yellowCount: number;
  greenCount: number;
  dominantPattern: string;
  primarySymptom: string;
  protocolKey: "boundary" | "clarity" | "stabilization" | "support";
  protocolLabel: string;
  pathName: string;
  routeReason: string;
  firstStepTitle: string;
  firstStepBody: string;
  insightLine: string;
  contextLabel?: string;
  contextNote?: string;
}

const RING_COLORS = {
  green: { bg: "rgba(45,212,191,0.15)", border: "rgba(45,212,191,0.5)", label: "green", labelAr: "مطمن" },
  yellow: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.5)", label: "yellow", labelAr: "متقلب" },
  red: { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.5)", label: "red", labelAr: "مستنزف" },
};

/* ── Poetic State UI Config ── */
const POETIC_STATE_CONFIG: Record<PoeticState, { icon: any; color: string }> = {
  "توهة المدارات": { icon: Sparkles, color: "text-amber-400" },
  "نبض مشحون": { icon: Zap, color: "text-rose-400" },
  "نزيف طاقة": { icon: AlertTriangle, color: "text-rose-500" },
  "محطة انتظار": { icon: Activity, color: "text-teal-400" },
  "مستقر نسبياً": { icon: ShieldCheck, color: "text-teal-500" },
};

function deriveOnboardingResult(
  items: Array<{ ring?: Ring | null; symptomIds?: string[] }>,
  gateContext?: OnboardingFlowProps["gateContext"]
): DerivedOnboardingResult {
  const redCount = items.filter((item) => item.ring === "red").length;
  const yellowCount = items.filter((item) => item.ring === "yellow").length;
  const greenCount = items.filter((item) => item.ring === "green").length;
  const symptomCounts = new Map<string, number>();

  for (const item of items) {
    for (const symptomId of item.symptomIds ?? []) {
      symptomCounts.set(symptomId, (symptomCounts.get(symptomId) ?? 0) + 1);
    }
  }

  const dominantSymptom =
    [...symptomCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    (redCount > 0 ? "drain" : yellowCount > 0 ? "fear" : "default");
  const dominantPattern = PATTERN_TYPE_LABELS[dominantSymptom] || PATTERN_TYPE_LABELS.default;

  if (redCount >= 2 || (redCount >= 1 && greenCount === 0)) {
    const result: DerivedOnboardingResult = {
      relationshipCount: items.length,
      redCount,
      yellowCount,
      greenCount,
      dominantPattern,
      primarySymptom: dominantSymptom,
      protocolKey: "boundary",
      protocolLabel: "Boundary Protocol",
      pathName: PATH_NAMES["path_protection"],
      routeReason: "الخريطة فيها نزيف واضح، فالأولوية دلوقتي وقف الاحتكاك قبل أي إصلاح أعمق.",
      firstStepTitle: "قلل نقطة النزيف الأكبر",
      firstStepBody: "اختار أول علاقة في الدائرة الحمراء وقلل الاحتكاك المباشر معاها لمدة 7 أيام أو حط لها حد زمني واضح.",
      insightLine: "أول مكسب حقيقي هنا إنك توقف النزيف، مش إنك تشرح نفسك أكتر."
    };
    if (gateContext?.painPoint || gateContext?.intent) {
      result.contextLabel = "بداية الرحلة";
      result.contextNote = gateContext.message;
    }
    return result;
  }

  if (yellowCount >= Math.max(redCount, greenCount) && yellowCount > 0) {
    const result: DerivedOnboardingResult = {
      relationshipCount: items.length,
      redCount,
      yellowCount,
      greenCount,
      dominantPattern,
      primarySymptom: dominantSymptom,
      protocolKey: "clarity",
      protocolLabel: "Clarity Protocol",
      pathName: PATH_NAMES["path_negotiation"],
      routeReason: "المشهد عندك ضبابي أكتر من كونه خطر مباشر، فالمطلوب وضوح وحدود خفيفة قبل أي قرار نهائي.",
      firstStepTitle: "سمّي العلاقة الرمادية",
      firstStepBody: "اختار شخص واحد من الدائرة الصفراء واكتب في جملة واحدة: هو بيديك إيه وبيسحب منك إيه.",
      insightLine: "الوضوح هنا أهم من الحسم السريع، لأن الضباب هو اللي بيطول اللخبطة."
    };
    if (gateContext?.painPoint || gateContext?.intent) {
      result.contextLabel = "إشارة البداية";
      result.contextNote = `${gateContext.message} والنتيجة الحالية بتقول إن الوضوح أهم من الاندفاع.`;
    }
    return result;
  }

  if (greenCount === 0 && redCount > 0) {
    const result: DerivedOnboardingResult = {
      relationshipCount: items.length,
      redCount,
      yellowCount,
      greenCount,
      dominantPattern,
      primarySymptom: dominantSymptom,
      protocolKey: "stabilization",
      protocolLabel: "Stabilization Protocol",
      pathName: PATH_NAMES["path_protection"],
      routeReason: "عندك ضغط من غير سند كفاية، فالمسار الأول لازم يثبتك قبل ما يطلب منك مواجهة أكبر.",
      firstStepTitle: "ابنِ نقطة أمان واحدة",
      firstStepBody: "اختار شخص آمن واحد أو مساحة هدوء ثابتة ترجع لها قبل أي قرار يخص العلاقات المستنزفة.",
      insightLine: "من غير أرض ثابتة، أي خطوة شجاعة هتتحول لاستنزاف جديد."
    };
    if (gateContext?.painPoint || gateContext?.intent) {
      result.contextLabel = "إشارة البداية";
      result.contextNote = `${gateContext.message} وده متسق مع احتياجك لتثبيت الأرض قبل أي مواجهة.`;
    }
    return result;
  }

  const result: DerivedOnboardingResult = {
    relationshipCount: items.length,
    redCount,
    yellowCount,
    greenCount,
    dominantPattern,
    primarySymptom: dominantSymptom,
    protocolKey: "support",
    protocolLabel: "Support Protocol",
    pathName: PATH_NAMES["path_deepening"],
    routeReason: "فيه دعم موجود في الخريطة، فالمكسب الأسرع هو تقوية النواة بدل مطاردة كل علاقة مرة واحدة.",
    firstStepTitle: "قوّي الدائرة الخضرا",
    firstStepBody: "خذ خطوة تواصل مقصودة مع أقرب شخص داعم واطلب منه دور واضح يساعدك الأسبوع ده.",
    insightLine: "لما السند يبقى واضح، قرارك مع العلاقات المرهقة بيبقى أسهل وأهدى."
  };
  if (gateContext?.painPoint || gateContext?.intent) {
    result.contextLabel = "إشارة البداية";
    result.contextNote = `${gateContext.message} والخريطة بتقول إن عندك نواة ينفع تبني عليها.`;
  }
  return result;
}

/* ── Symptom Trigger Modal ── */
const SymptomTriggerModal: FC<{ 
  name: string; 
  onSelect: (symptom: string) => void;
  onClose: () => void;
}> = ({ name, onSelect, onClose }) => {
  const options = [
    { id: "drain", label: "استنزاف و إرهاق", desc: "بياخد من طاقتك أكتر ما بيدي." },
    { id: "guilt", label: "ذنب و تبرير", desc: "دايماً حاسس إنك مقصر معاه." },
    { id: "fear", label: "قلق و تجنب", desc: "بتفكر مرتين قبل ما تتعامل معاه." },
    { id: "anger", label: "غضب مكبوت", desc: "فيه كلام كتير جواك مش عارف تقوله." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-[#020408]/90 backdrop-blur-xl p-6"
    >
      <div className="w-full max-w-xs space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-white">إيه أكتر حاجة بتوجعك مع {name}؟</h3>
          <p className="text-[11px] text-slate-400">التشخيص الدقيق هو أول خطوة لدرع الحماية.</p>
        </div>

        <div className="grid gap-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="group flex flex-col items-center p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all ob-btn-tap"
            >
              <span className="text-sm font-bold text-slate-200 group-hover:text-rose-400">{opt.label}</span>
              <span className="text-[9px] text-slate-500">{opt.desc}</span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-2">تخطي التشخيص</button>
      </div>
    </motion.div>
  );
};

/* ── Step 1: Inventory ── */
const StepInventory: FC<{
  onNext: (items: { name: string; category: AdviceCategory }[]) => void;
  onSkip: () => void;
  mirrorName?: string;
}> = memo(({ onNext, onSkip, mirrorName }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const [categories, setCategories] = useState<AdviceCategory[]>(["family", "family", "family"]);
  const [hasText, setHasText] = useState<boolean[]>([false, false, false]);
  const [canContinue, setCanContinue] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncHasText = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newHasText = inputRefs.current.map((ref) => (ref?.value?.trim()?.length ?? 0) > 0);
      setHasText(newHasText);
      setCanContinue(newHasText.some(Boolean));
    }, 200);
  }, []);

  const updateCategory = useCallback((i: number, cat: AdviceCategory) => {
    setCategories((prev) => {
      const n = [...prev];
      n[i] = cat;
      return n;
    });
    // Auto-focus next input for frictionless UI
    if (i < 2 && inputRefs.current[i + 1]) {
      setTimeout(() => {
        inputRefs.current[i + 1]?.focus();
      }, 50);
    }
  }, []);

  const handleNext = useCallback(() => {
    const items = inputRefs.current
      .map((ref, i) => ({
        name: ref?.value?.trim() ?? "",
        category: categories[i],
      }))
      .filter((item) => item.name.length > 0);
    onNext(items);
  }, [categories, onNext]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.12), rgba(139,92,246,0.12))",
            border: "1.5px solid rgba(45,212,191,0.25)",
            animation: "ob-icon-breathe 3s ease-in-out infinite",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(45,212,191,0.8)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold mb-2 text-white">بص جواك</h2>
        {mirrorName && (
          <p className="text-[11px] font-bold mb-2 text-teal-400">ده اسمك أنت: {mirrorName}</p>
        )}
        <p className="text-sm leading-relaxed text-slate-300">
          قبل ما نرسم، فكّر في 3 أشخاص تانيين واخدين مساحة من تفكيرك النهاردة.. سواء بالسلب أو الإيجاب.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.08]"
          >
            <input
              type="text"
              id={`inventory-person-${i + 1}`}
              name={`inventoryPerson${i + 1}`}
              ref={(el) => { inputRefs.current[i] = el; }}
              defaultValue=""
              onInput={syncHasText}
              placeholder={i === 0 ? "الاسم الأول.." : i === 1 ? "الاسم الثاني.." : "الاسم الثالث (اختياري).."}
              className="w-full rounded-xl px-4 py-2 text-sm text-right outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${hasText[i] ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: "#ffffff",
              }}
              maxLength={30}
              dir="rtl"
            />
            {hasText[i] && (
              <div className="flex gap-1 justify-end items-center">
                <span className="text-[10px] ml-1 text-slate-500">ده يقربلك إيه؟</span>
                {(["family", "work", "general"] as AdviceCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateCategory(i, cat)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                    style={{
                      background: categories[i] === cat ? "rgba(45,212,191,0.2)" : "transparent",
                      border: `1px solid ${categories[i] === cat ? "rgba(45,212,191,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color: categories[i] === cat ? "#2dd4bf" : "rgba(255,255,255,0.4)"
                    }}
                  >
                    {cat === "family" ? "عيلة" : cat === "work" ? "شغل" : "صحاب/معارف"}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canContinue}
        className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all ob-btn-tap"
        style={{
          background: canContinue ? "#2dd4bf" : "rgba(255,255,255,0.1)",
          color: canContinue ? "#0f172a" : "rgba(255,255,255,0.3)",
          cursor: canContinue ? "pointer" : "not-allowed",
        }}
      >
        يلا نكمل →
      </button>

      <button onClick={onSkip} className="text-center text-xs text-slate-500 hover:text-slate-300 transition-colors">ادخل الملاذ الآمن</button>
    </div>
  );
});

/* ── Step 2: Mapping ── */
const StepMapping: FC<{ 
  items: NameCard[]; 
  onNext: (items: NameCard[]) => void;
  onRingSelected: (cardIdx: number, ring: Ring) => void;
  onSkip: () => void;
}> = ({ items, onNext, onRingSelected, onSkip }) => {
  const [cards, setCards] = useState<NameCard[]>(
    items.map((item) => ({ ...item, ring: null, placed: false }))
  );
  
  // Update local cards when parent state changes (if needed) but here cards are derived from items
  useEffect(() => {
    setCards(items.map((item) => ({ ...item, ring: item.ring ?? null, placed: item.placed ?? false })));
  }, [items]);

  const [insightMessage, setInsightMessage] = useState<string | null>(null);

  const handleRingClick = (cardIdx: number, ring: Ring) => {
    // 1. Haptic feedback
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }

    // 2. Contextual insight
    const cardCategory = cards[cardIdx].category;
    if (ring === "red") {
      if (cardCategory === "family") {
        setInsightMessage("أقرب الناس ممكن يكونوا أكبر مصدر للاستنزاف.. إنت مش لوحدك.");
      } else {
        setInsightMessage("أول خطوة للتعافي إنك تعترف بالاحتكاك ده.");
      }
    } else if (ring === "green") {
      setInsightMessage("نعمة السند.. الخريطة بتنور بوجودهم.");
    } else {
      setInsightMessage("مش كل العلاقات واضحة على طول، وده طبيعي.");
    }

    onRingSelected(cardIdx, ring);
  };

  const allPlaced = cards.every((c) => c.placed);

  return (
    <div className="flex flex-col gap-4 w-full text-center">
      <div className="space-y-1 mb-2">
        <h2 className="text-[18px] font-extrabold text-white tracking-wide">ارسم الواقع بصدق</h2>
        <p className="text-[11px] text-slate-300 leading-relaxed px-1">
          حط كل شخص في المكان اللي يمثل <span className="text-teal-400 font-bold">تأثيره على طاقتك دلوقتي</span>، مش المكان اللي بتتمناه. الخريطة دي عشان تشوف الحقيقة، مش عشان تجمّلها.
        </p>
      </div>

      {/* Concentric Radar Area */}
      <div className="relative w-full h-[260px] bg-[#020408]/60 rounded-[2rem] border border-white/5 overflow-hidden flex justify-center shadow-inner">
        {/* Core Point (Center is X: 50%, Y: 85px) */}
        <div className="absolute top-[85px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-teal-300 shadow-[0_0_12px_#2dd4bf] z-40" />

        {/* Red Ring (Outer) */}
        <div className="absolute top-[85px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-rose-500/20 bg-rose-500/[0.015] z-10 pointer-events-none">
           <div className="absolute bottom-[28px] left-1/2 -translate-x-1/2 w-[70%] pointer-events-auto flex flex-wrap gap-2 justify-center z-50">
             <AnimatePresence>
               {cards.map((c, i) => c.placed && c.ring === "red" && (
                  <motion.span layoutId={`card-${i}-layout`} key={c.name} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 shadow-sm backdrop-blur-md">
                    {c.name}
                  </motion.span>
               ))}
             </AnimatePresence>
           </div>
           <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-rose-500/50 text-[8px] font-bold mt-2 uppercase tracking-widest whitespace-nowrap">المدار الخارجي (مستنزِف)</span>
        </div>

        {/* Yellow Ring (Middle) */}
        <div className="absolute top-[85px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border border-amber-500/30 bg-amber-500/[0.03] z-20 pointer-events-none">
           <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 w-[85%] pointer-events-auto flex flex-wrap gap-2 justify-center z-50">
             <AnimatePresence>
               {cards.map((c, i) => c.placed && c.ring === "yellow" && (
                  <motion.span layoutId={`card-${i}-layout`} key={c.name} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm backdrop-blur-md">
                    {c.name}
                  </motion.span>
               ))}
             </AnimatePresence>
           </div>
           <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-amber-500/60 text-[8px] font-bold mt-1 uppercase tracking-widest whitespace-nowrap">المدار الأوسط (مُتعب / متقلب)</span>
        </div>

        {/* Green Ring (Core) */}
        <div className="absolute top-[85px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] rounded-full border-[1.5px] border-teal-500/50 bg-teal-500/10 z-30 shadow-[0_0_30px_rgba(45,212,191,0.15)] pointer-events-none">
           <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[90%] pointer-events-auto flex flex-wrap gap-1 justify-center z-50">
             <AnimatePresence>
               {cards.map((c, i) => c.placed && c.ring === "green" && (
                  <motion.span layoutId={`card-${i}-layout`} key={c.name} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#18f1d7] border border-[#2dd4bf] text-slate-900 shadow-[0_2px_10px_rgba(45,212,191,0.4)]">
                    {c.name}
                  </motion.span>
               ))}
             </AnimatePresence>
           </div>
           <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-teal-400/80 text-[8px] font-bold uppercase tracking-widest whitespace-nowrap">النواة (مطمن)</span>
        </div>
      </div>

      {/* Contextual Feedback */}
      <AnimatePresence mode="wait">
        {insightMessage && (
          <motion.div 
            key={insightMessage}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="px-4 py-2 mx-auto max-w-[90%] bg-teal-500/10 border border-teal-500/30 rounded-xl"
          >
            <p className="text-[11px] text-teal-300 font-bold">{insightMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 min-h-[140px] pt-1">
        <AnimatePresence>
          {cards.map((c, i) => !c.placed && (
            <motion.div 
              layoutId={`card-container-${i}`} 
              key={`unplaced-${c.name}-${i}`}
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} 
              className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-2 pl-3 shadow-sm hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-2 max-w-[30%]">
                 <motion.span layoutId={`card-${i}-layout`} className="text-sm font-bold text-white tracking-wide truncate">
                   {c.name}
                 </motion.span>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleRingClick(i, "green")} className="text-[10px] font-bold px-2 py-2 rounded-xl border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 active:scale-95 transition-all bg-[#0a1128]/50">مطمن</button>
                <button onClick={() => handleRingClick(i, "yellow")} className="text-[10px] font-bold px-2 py-2 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/20 active:scale-95 transition-all bg-[#1a1408]/50">متقلب</button>
                <button onClick={() => handleRingClick(i, "red")} className="text-[10px] font-bold px-2 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all bg-[#1a080c]/50">مستنزِف</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="pt-2">
        <button
          onClick={() => onNext(cards)}
          disabled={!allPlaced}
          className="w-full rounded-2xl py-4 text-[15px] font-extrabold transition-all ob-btn-tap relative overflow-hidden group"
          style={{
            background: allPlaced ? "#2dd4bf" : "rgba(255,255,255,0.05)",
            color: allPlaced ? "#0f172a" : "rgba(255,255,255,0.2)",
            boxShadow: allPlaced ? "0 4px 20px rgba(45,212,191,0.3)" : "none"
          }}
        >
          {allPlaced && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
          <span className="relative z-10 flex items-center justify-center gap-2">
            شوف النتيجة <ArrowRight className="w-4 h-4 rotate-180" />
          </span>
        </button>
        <button onClick={onSkip} className="text-xs text-slate-500 mt-4 hover:text-slate-300">ادخل الملاذ الآمن</button>
      </div>
    </div>
  );
};

/* ── Step 3: Insight — The "Aha" Moment ── */
const StepInsight: FC<{ items: { name: string; category: AdviceCategory }[]; onComplete: () => void; onSkip: () => void }> = ({ items, onComplete, onSkip }) => {
  const count = items.length;
  const names = items.map(i => i.name);

  return (
    <div className="flex flex-col gap-6 w-full items-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {[44, 68, 88].map((r, i) => (
          <div
            key={r}
            className="absolute rounded-full border border-teal-500/20"
            style={{
              width: r, height: r,
              animation: `ob-ring-pulse ${2.5 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
            }}
          />
        ))}
        <div className="w-4 h-4 rounded-full bg-teal-400 shadow-[0_0_15px_#2dd4bf] animate-pulse" />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3 text-white">مبروك.. دي أول خريطة لوعيك</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {count === 1 ? `حطيت ${names[0]} في مداره.` : `حطيت ${count} في مداراتهم.`}
          {" "}التعافي مش سحر، هو إنك بقيت شايف خريطتك بوضوح.
        </p>
      </div>

      <div className="w-full p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
        <p className="text-[13px] text-slate-300 leading-relaxed">
          علاقاتك اللي بتستنزفك مش بس أسماء، دي بتتحول لـ <span className="text-rose-400 font-bold">ثقوب سوداء</span> تسحب طاقتك.. إحنا هنا عشان نوقّف النزيف ده.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full rounded-2xl py-3.5 text-sm font-bold bg-teal-400 text-zinc-900 transition-all ob-btn-tap shadow-[0_4px_20px_rgba(45,212,191,0.2)]"
      >
        كَمّل لخطتك ←
      </button>

      <button onClick={onSkip} className="text-xs text-slate-500">ادخل الملاذ الآمن</button>
    </div>
  );
};

/* ── Step 4: Contact Capture — WhatsApp-first ── */
const StepContactCapture: FC<{ 
  initialName?: string;
  onComplete: (name: string, email: string, whatsapp: string) => void; 
  onSkip: () => void 
}> = ({ initialName = "", onComplete, onSkip }) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const nextName = initialName.trim();
    if (nextName) {
      setName(nextName);
    }
  }, [initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!whatsapp.trim()) {
      setError("حط رقم الواتساب عشان نقدر نبعتلك خطة التعافي.");
      return;
    }
    setLoading(true);
    try {
      await onComplete(name, email, whatsapp);
    } catch {
      setError("حصلت مشكلة في الاتصال المشفّر. جرب تاني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full text-center px-1">
      <div className="mx-auto relative w-16 h-16 rounded-full bg-[#0a1128] border border-teal-500/30 flex items-center justify-center mb-1 shadow-[0_0_30px_rgba(45,212,191,0.15)]">
         <div className="absolute inset-0 rounded-full border border-teal-400/30 animate-ping opacity-20"></div>
         <Smartphone className="w-7 h-7 text-teal-400 relative z-10" />
      </div>
      
      <div className="space-y-1.5 mb-2">
        <h2 className="text-[20px] font-extrabold text-white tracking-wide">روشتة الدواير جاهزة</h2>
        <p className="text-[11px] text-slate-300 leading-relaxed font-medium px-2">
          سيب بياناتك عشان نبعتلك <span className="text-teal-400 font-bold">خريطة وعيك المصورة</span> وتفاصيل أول خطوة في التعافي فوراً على الواتساب.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-right w-full">
        {/* Name Input */}
        {!initialName.trim() ? (
          <div className="space-y-1.5 group">
            <label className="text-[10px] font-bold text-teal-400/80 mr-1 flex items-center gap-1.5 justify-start">
              <User className="w-3 h-3"/> الاسم (عشان روشتة التعافي تطلع باسمك)
            </label>
            <div className="relative">
               <input
                 type="text"
                 id="contact-name"
                 name="contactName"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="اسمك الأول أو لقبك.."
                 className="w-full rounded-2xl px-4 py-3.5 text-sm bg-[#020408]/50 border border-white/10 text-white focus:border-teal-400 focus:bg-[#0a1128]/80 outline-none transition-all shadow-inner placeholder:text-slate-600"
                 dir="rtl"
               />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl px-4 py-3.5 border border-teal-500/20 bg-teal-500/5 text-right">
            <p className="text-[10px] font-bold text-teal-400/80 mb-1">الاسم اتسحب من الهيرو</p>
            <p className="text-sm font-bold text-white">{name}</p>
          </div>
        )}

        {/* WhatsApp Input */}
        <div className="space-y-1.5 group">
          <label className="text-[10px] font-bold text-teal-400 mr-1 flex items-center gap-1.5 justify-start">
            <Smartphone className="w-3 h-3"/> واتساب الأساسي (مهم جداً)
          </label>
          <div className="relative">
             {/* Country Code Prefix Fake */}
             <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-60">
               <span className="text-[13px] font-bold text-teal-400 tracking-widest" dir="ltr">+20</span>
               <div className="w-px h-5 bg-teal-500/30"></div>
             </div>
             <input
               type="tel"
               id="contact-whatsapp"
               name="contactWhatsapp"
               value={whatsapp}
               onChange={(e) => setWhatsapp(e.target.value)}
               placeholder="10xxxxxxxx"
               autoFocus
               dir="ltr"
               className="w-full rounded-2xl pl-16 pr-4 py-3.5 text-[15px] font-bold tracking-widest bg-[#020408]/50 border border-teal-500/40 text-white focus:border-teal-400 focus:bg-[#0a1128]/80 outline-none transition-all shadow-[0_0_15px_rgba(45,212,191,0.1)] focus:shadow-[0_0_25px_rgba(45,212,191,0.25)] placeholder:text-slate-600 placeholder:font-normal placeholder:text-sm placeholder:tracking-normal text-right pr-4"
             />
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-1.5 group mt-1">
          <label className="text-[10px] font-bold text-slate-500 mr-1 flex items-center gap-1.5 justify-start">
            <Mail className="w-3 h-3"/> الإيميل (اختياري كنسخة احتياطية)
          </label>
          <div className="relative">
             <input
               type="email"
               id="contact-email"
               name="contactEmail"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="name@email.com"
               className="w-full rounded-2xl px-4 py-3.5 text-sm bg-white/[0.02] border border-white/5 text-slate-300 focus:border-white/20 focus:bg-white/[0.05] outline-none transition-all placeholder:text-slate-600 text-right"
               dir="ltr"
             />
          </div>
        </div>

        {/* Error State */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.95 }} className="flex items-center gap-2 text-rose-400">
                 <AlertTriangle className="w-3 h-3" />
                 <p className="text-[10px] font-bold">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-1.5 opacity-70">
           <Lock className="w-3 h-3 text-slate-400" />
           <span className="text-[9px] text-slate-400 font-semibold tracking-wide">بياناتك مشفرة بالكامل ومعزولة في الملاذ الآمن</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full relative overflow-hidden group rounded-2xl py-4 bg-teal-400 text-slate-950 font-extrabold ob-btn-tap transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] disabled:opacity-50 mt-1"
        >
          <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-[150%] transition-transform duration-1000 group-hover:translate-x-[50%] skew-x-12"></div>
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? "جاري الإرسال المشفّر..." : "استلم خطة التعافي دلوقتي"}
            {!loading && <Sparkles className="w-4 h-4 text-[#064e3b]" />}
          </span>
        </button>
      </form>

      <button onClick={onSkip} className="text-[10px] text-slate-500 mt-2 hover:text-slate-300 transition-colors uppercase font-bold tracking-widest inline-flex items-center justify-center gap-1 mx-auto">
        ادخل الملاذ الآمن <ArrowRight className="w-3 h-3 rotate-180"/>
      </button>
    </div>
  );
};

/* ── Step 5: Recovery Plan Preview ── */
const StepRecoveryPlanPreview: FC<{ 
  userName?: string;
  plan?: DynamicRecoveryPlan | null;
  onComplete: () => void; 
}> = ({ userName, plan, onComplete }) => {
  const displayName = userName ? `يا ${userName}` : "";
  
  // Extract primary pattern label
  const patternLabel = plan?.primaryPattern ? (PATTERN_TYPE_LABELS[plan.primaryPattern] || "نمط سلوكي") : "نمط استنزاف عام";
  const pathLabel = plan?.ring === "red" ? PATH_NAMES["path_protection"] : plan?.ring === "yellow" ? PATH_NAMES["path_negotiation"] : PATH_NAMES["path_deepening"];
  const week1 = plan?.steps.find(s => s.week === 1);

  return (
    <div className="flex flex-col gap-6 w-full py-2 text-right">
      <div className="space-y-2 text-center">
        <ShieldCheck className="w-10 h-10 text-teal-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">خطتك {displayName} جاهزة!</h2>
        <p className="text-xs text-slate-400">تم تحليل خريطتك بواسطة المحرك السيادي لتحديد أسرع مسار للهدوء.</p>
      </div>

      <div className="space-y-4">
        {/* Pattern Card */}
        <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 shadow-[0_0_15px_rgba(45,212,191,0.05)]">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <Activity className="w-4 h-4 text-teal-400" />
               <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">النمط المرصود</span>
             </div>
             <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/10 text-teal-300 border border-teal-400/20">{pathLabel}</span>
           </div>
           <p className="text-lg font-bold text-white mb-1">{patternLabel}</p>
           <p className="text-[11px] text-slate-400 leading-relaxed italic">"هذا النمط يسحب ٤٥٪ من طاقتك الذهنية يومياً."</p>
        </div>

        {/* Action Card */}
        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <Target className="w-5 h-5 text-teal-500/40" />
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">تحدي الأسبوع الأول</span>
              <h4 className="text-md font-bold text-white mt-1">{week1?.title || "فهم المسافة"}</h4>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {week1?.goal || "ابدأ بوضع حدود زمنية واضحة لتقليل الضغط."}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onComplete}
          className="w-full rounded-2xl py-4 bg-teal-400 text-zinc-900 font-extrabold ob-btn-tap shadow-[0_4px_25px_rgba(45,212,191,0.3)] hover:scale-[1.02] transition-all"
        >
          تفعيل الدرع والدخول للملاذ ←
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-4">تم تشفير وتحميل الخطة الكاملة (٤ أسابيع) في حسابك.</p>
      </div>
    </div>
  );
};

const StepResultsScreen: FC<{
  diagnosis?: TransformationDiagnosis | null;
  userName?: string;
  result?: DerivedOnboardingResult | null;
  plan?: DynamicRecoveryPlan | null;
  painDump?: string;
  onComplete: () => void;
}> = ({ diagnosis, userName, result, plan, painDump, onComplete }) => {
  const { aiInterpretation, setAiInterpretation } = useMapState();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate AI insight if we have a diagnosis and no saved interpretation
    if (diagnosis && !aiInterpretation && !isGenerating && !error) {
      const triggerGeneration = async () => {
        setIsGenerating(true);
        try {
          const insight = await generateSovereignInsight({
            diagnosis,
            painDump,
            userName,
            metrics: {
              totalRelationships: (result?.redCount ?? 0) + (result?.yellowCount ?? 0) + (result?.greenCount ?? 0),
              redOrbits: result?.redCount ?? 0,
              yellowOrbits: result?.yellowCount ?? 0,
              greenOrbits: result?.greenCount ?? 0
            }
          });
          setAiInterpretation(insight);
        } catch (err) {
          console.error("Failed to generate insight:", err);
          setError("لم نتمكن من الوصول للرؤية حالياً، لكن رحلتك مستمرة.");
        } finally {
          setIsGenerating(false);
        }
      };
      void triggerGeneration();
    }
  }, [diagnosis, aiInterpretation, isGenerating, error, painDump, userName, result, setAiInterpretation]);

  const displayName = userName ? `يا ${userName}` : "";
  const protocolLabel = result?.protocolLabel || diagnosis?.protocolKey || (plan?.ring === "red" ? PATH_NAMES["path_protection"] : plan?.ring === "yellow" ? PATH_NAMES["path_negotiation"] : PATH_NAMES["path_deepening"]);
  const headline = result ? `دي أول نتيجة واضحة ${displayName}` : "رؤيتك السيادية جاهزة!";
  const subheadline = result?.routeReason || "تم تحليل مسارك وفك شفرات الطاقة في رحلتك.";
  const bodyTitle = result?.dominantPattern || diagnosis?.state || "نتيجة أولية";
  const bodyText = result?.contextNote || result?.insightLine || diagnosis?.rootTension || "دي أول قراءة تشغيلية للخريطة.";

  const safeDiagnosis = diagnosis || ({ state: "مستقر نسبياً", rootTension: "قيد المراجعة السيادية", protocolKey: "clarity", firstStep: "المراقبة الذاتية", commitmentPledge: "ألتزم بمراقبة مشاعري بصدق", riskLevel: "low" } as TransformationDiagnosis);
  const redValue = result?.redCount ?? (safeDiagnosis.riskLevel === "emergency" || safeDiagnosis.riskLevel === "high" ? 1 : 0);
  const yellowValue = result?.yellowCount ?? (safeDiagnosis.riskLevel === "medium" ? 1 : 0);
  const greenValue = result?.greenCount ?? (safeDiagnosis.riskLevel === "low" ? 1 : 0);
  const pledgeLabel = result ? "أول خطوة واضحة" : "عهد المسافر";
  const pledgeText = result?.firstStepBody || safeDiagnosis.commitmentPledge || plan?.steps.find((s) => s.week === 1)?.goal || "ابدأ بأول خطوة عملية من النتيجة الحالية.";
  return (
    <div className="flex flex-col gap-6 w-full py-2 text-right">
      <div className="space-y-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-teal-500/30">
           <ShieldCheck className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">رؤيتك السيادية جاهزة!</h2>
        <p className="text-xs text-slate-400">تم تحليل مسارك وفك شفرات الطاقة في رحلتك.</p>
      </div>

      <div className="space-y-4">
        {/* Poetic State Card */}
        <div className="p-5 rounded-3xl border border-teal-500/30 bg-teal-500/10 shadow-[0_0_30px_rgba(45,212,191,0.1)] relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50"></div>
           <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.2em]">الحالة الروحية</span>
              <div className="px-2 py-1 rounded-md bg-teal-400/20 text-[10px] font-bold text-teal-200 border border-teal-400/20">
                {protocolLabel}
              </div>
           </div>
           <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
             {bodyTitle}
           </h3>
            <p className="text-sm text-slate-300 leading-relaxed italic">
              "{bodyText}"
            </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center">
            <div className="text-[9px] font-bold text-rose-500 mb-1 uppercase tracking-widest">نزيف</div>
            <div className="text-xl font-black text-white">{redValue}</div>
          </div>
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
            <div className="text-[9px] font-bold text-amber-500 mb-1 uppercase tracking-widest">حذر</div>
            <div className="text-xl font-black text-white">{yellowValue}</div>
          </div>
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center">
            <div className="text-[9px] font-bold text-emerald-500 mb-1 uppercase tracking-widest">نمو</div>
            <div className="text-xl font-black text-white">{greenValue}</div>
          </div>
        </div>

        {/* Sovereign Insight (AI) Card */}
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 rounded-[2.5rem] bg-teal-500/5 border border-teal-500/20 flex flex-col items-center justify-center gap-4 text-center min-h-[200px]"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-teal-300 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-teal-100 tracking-wide">جاري استحضار الرؤية السِياديّة...</p>
                <p className="text-[10px] text-teal-500/60 font-medium">نحلل أنماط الطاقة في دوائرك الآن</p>
              </div>
            </motion.div>
          ) : aiInterpretation ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-[2.5rem] bg-gradient-to-br from-teal-500/15 to-blue-500/5 border border-teal-400/30 shadow-[0_20px_50px_rgba(45,212,191,0.15)] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Sparkles className="w-6 h-6 text-teal-300" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf]"></div>
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">الرؤية السِياديّة</span>
              </div>
              <div className="text-slate-100 leading-relaxed space-y-4">
                {aiInterpretation.split('\n').map((line, i) => (
                  <p key={i} className={i === 0 ? "text-lg font-bold leading-snug text-white" : "text-sm opacity-90"}>
                    {line}
                  </p>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Pledge Card (Commitment Loop) */}
        {!isGenerating && (
          <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 relative group">
             <div className="absolute -top-3 -right-3 w-12 h-12 bg-teal-500/20 rounded-full blur-xl group-hover:bg-teal-500/40 transition-all opacity-50"></div>
             <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">عهد المسافر</span>
             </div>
             <p className="text-md font-bold text-slate-100 leading-relaxed mb-4">
               {pledgeText}
             </p>
             <div className="flex items-center gap-2 text-[10px] text-teal-400 font-bold border-t border-white/5 pt-4">
                <Zap className="w-3 h-3" />
                <span>أنت الآن في منطقة السيادة الذاتية</span>
             </div>
          </div>
        )}
      </div>

      <div className="pt-4">
        <button
          onClick={onComplete}
          className="w-full rounded-2xl py-4.5 bg-gradient-to-r from-teal-500 to-teal-400 text-zinc-950 font-black ob-btn-tap shadow-[0_10px_30px_rgba(45,212,191,0.3)] hover:shadow-[0_15px_40px_rgba(45,212,191,0.4)] transition-all flex items-center justify-center gap-2 group"
        >
          دخول الملاذ السيادي
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rotate-180" />
        </button>
      </div>
    </div>
  );
};

const onboardingRingPalette = RING_COLORS;
void onboardingRingPalette;

/* ── Main OnboardingFlow Component ── */

const StepSafetyTriage = () => (
  <div className="text-center py-8 space-y-6">
    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
      <AlertTriangle className="w-10 h-10 text-red-500" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">أمانك هو الأولوية القصوى</h2>
    <p className="text-slate-300 leading-relaxed">
      من خلال كلماتك، يبدو أنك تمر بلحظة صعبة جداً وتتطلب دعماً فورياً متخصصاً.
    </p>
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-right">
      <p className="text-sm text-slate-400 mb-4">برجاء التواصل مع المتخصصين فوراً:</p>
      <ul className="space-y-3 text-white">
        <li>• الخط الساخن للأمان النفسي: 16328</li>
        <li>• أو التوجه لأقرب مستشفى للطوارئ.</li>
      </ul>
    </div>
    <p className="text-xs text-slate-500 italic">
      "رحلتك" منصة توعوية وليست بديلاً عن العلاج الطبي أو التدخل في الأزمات.
    </p>
  </div>
);

export const OnboardingFlow: FC<OnboardingFlowProps> = memo(({ onComplete, initialMirrorName, gateContext = null }) => {
  const addNode = useMapState((s) => s.addNode);
  const clientEventIdRef = useRef<string | null>(null);

  if (!clientEventIdRef.current) {
    clientEventIdRef.current = generateUUID();
  }
  const setMirrorName = useJourneyProgress().setMirrorName;
  
  const [step, setStep] = useState(0);
  const [, setPrevStep] = useState(-1);
  const [name, setName] = useState((initialMirrorName ?? "").trim());
  const [painDump, setPainDump] = useState("");
  const [diagnosis, setDiagnosis] = useState<TransformationDiagnosis | null>(null);
  const [isSafetyTriggered, setIsSafetyTriggered] = useState(false);
  const [derivedResult, setDerivedResult] = useState<DerivedOnboardingResult | null>(null);
  const [collectedItems, setCollectedItems] = useState<{ 
    name: string; 
    category: AdviceCategory; 
    ring?: Ring; 
    placed?: boolean; 
    symptomIds?: string[] 
  }[]>([]);
  
  const [primaryPlan, setPrimaryPlan] = useState<DynamicRecoveryPlan | null>(null);
  
  const [diagnosticModal, setDiagnosticModal] = useState<{ cardIdx: number; name: string } | null>(null);
  
  const leadTrackedRef = useRef(false);
  const completionTrackedRef = useRef(false);
  const [, startTransition] = useTransition();
  const stepRef = useRef(0);
  
  const seededMirrorName = (initialMirrorName ?? "").trim();

  useEffect(() => {
    if (seededMirrorName) {
      setName(seededMirrorName);
    }
  }, [seededMirrorName]);

  useEffect(() => {
    trackingService.recordFlow("onboarding_opened");
    analyticsService.track(AnalyticsEvents.ONBOARDING_STARTED, { 
      entry_point: seededMirrorName ? "landing_bridge" : "direct",
      client_event_id: clientEventIdRef.current!
    });
  }, [seededMirrorName]);

  // 🟢 Funnel Traceability: Track step views for drop-off analysis
  useEffect(() => {
    const stepNames = [
      "pain_dump",
      "noise_check", 
      "inventory", 
      "mapping", 
      "insight", 
      "contact_capture", 
      "recovery_plan_preview",
      "safety_route"
    ];
    if (step < stepNames.length) {
      analyticsService.track(`onboarding_step_${stepNames[step]}`, {
        step_index: step,
        client_event_id: clientEventIdRef.current!
      });
    }
  }, [step]);

  const goTo = useCallback((next: number) => {
    startTransition(() => {
      setStep((prev) => {
        setPrevStep(prev);
        return next;
      });
      stepRef.current = next;
    });
  }, [startTransition]);

  const handleSkip = useCallback(() => {
    trackingService.recordFlow("onboarding_skipped", {
      atStep: `step_${stepRef.current}`,
    });
    markJourneyOnboardingDone();
    onComplete(true);
  }, [onComplete]);

  const handlePainDumpNext = useCallback((text: string) => {
    setPainDump(text);
    if (safetyTriage(text)) {
      setIsSafetyTriggered(true);
      goTo(7); // Go to Safety Step
    } else {
      goTo(1);
    }
  }, [goTo]);

  const handleNoiseNext = useCallback(() => {
    trackingService.recordFlow("onboarding_phase_noise_completed");
    goTo(2);
  }, [goTo]);

  const handleInventoryNext = useCallback((items: { name: string; category: AdviceCategory }[]) => {
    setCollectedItems(items);
    trackingService.recordFlow("onboarding_phase_inventory_completed", {
      meta: { relationshipCount: items.length }
    });
    goTo(3);
  }, [goTo]);

  const handleRingSelected = useCallback((cardIdx: number, ring: Ring) => {
    if (ring === "red") {
      setDiagnosticModal({ cardIdx, name: collectedItems[cardIdx].name });
    } else {
      setCollectedItems((prev) =>
        prev.map((c, i) => i === cardIdx ? { ...c, ring, placed: true, symptomIds: [] } : c)
      );
    }
  }, [collectedItems]);

  const handleSymptomSelect = (symptomId: string) => {
    if (!diagnosticModal) return;
    const { cardIdx } = diagnosticModal;
    setCollectedItems((prev) =>
      prev.map((c, i) => i === cardIdx ? { ...c, ring: "red", placed: true, symptomIds: [symptomId] } : c)
    );
    setDiagnosticModal(null);
  };

  const handleMappingNext = useCallback((mapped: NameCard[]) => {
    const redCount = mapped.filter(m => m.ring === "red").length;
    const yellowCount = mapped.filter(m => m.ring === "yellow").length;
    const greenCount = mapped.filter(m => m.ring === "green").length;
    const nextDiagnosis = classifyState(painDump, { red: redCount, yellow: yellowCount, green: greenCount });
    setDiagnosis(nextDiagnosis);
    setDerivedResult(deriveOnboardingResult(mapped, gateContext));
    setCollectedItems(mapped.map((item) => ({ ...item, ring: item.ring ?? undefined })));
    
    trackingService.recordFlow("onboarding_phase_mapping_completed", {
      meta: {
        relationshipCount: mapped.length,
        redCount,
        yellowCount,
        greenCount,
        protocol: nextDiagnosis.protocolKey,
        dominantPattern: nextDiagnosis.rootTension,
        poeticState: nextDiagnosis.state
      }
    });

    for (let i = 0; i < mapped.length; i++) {
      const item = mapped[i];
      if (item.name.trim()) {
        addNode(
          item.name.trim(), 
          (item.ring ?? "yellow") as Ring, 
          undefined, 
          item.category,
          undefined, // treeRelation
          undefined, // detachmentMode
          undefined, // contact
          undefined, // isSOS
          undefined, // realityAnswers
          undefined, // safetyAnswer
          false,     // isAnalyzing
          false,     // isMirrorNode
          item.symptomIds ?? []
        );
      }
    }
    goTo(3);
  }, [addNode, gateContext, goTo, collectedItems, painDump]);

  const handleContactCapture = useCallback(async (providedName: string, email: string, whatsapp: string) => {
    if (!leadTrackedRef.current) {
      trackingService.recordFlow("lead_form_submitted", { meta: { name: providedName, email, whatsapp } });
      analyticsService.trackLead({ 
        method: "whatsapp", 
        has_email: !!email, 
        has_whatsapp: !!whatsapp,
        client_event_id: clientEventIdRef.current!
      });
      analyticsService.setStoredClientEventId(clientEventIdRef.current!);
      leadTrackedRef.current = true;
    }

    const finalName = providedName.trim() || seededMirrorName;
    const nextResult = derivedResult ?? deriveOnboardingResult(collectedItems, gateContext);
    setDerivedResult(nextResult);
    const currentDiagnosis = diagnosis || classifyState(painDump, {
      red: collectedItems.filter(c => c.ring === "red").length,
      yellow: collectedItems.filter(c => c.ring === "yellow").length,
      green: collectedItems.filter(c => c.ring === "green").length,
    });
    if (finalName) {
      setName(finalName);
      setMirrorName(finalName);
    }

    // CRM synchronization
    if (whatsapp.trim()) {
      await marketingLeadService.syncLead({
        phone: whatsapp.trim(),
        status: "engaged",
        source: "onboarding",
        sourceType: "website",
        metadata: {
          hasEmail: !!email.trim(),
          name: finalName,
          redCount: collectedItems.filter(c => c.ring === "red").length,
          yellowCount: collectedItems.filter(c => c.ring === "yellow").length,
          greenCount: collectedItems.filter(c => c.ring === "green").length,
          protocol: currentDiagnosis.protocolKey,
          dominantPattern: currentDiagnosis.rootTension,
          poeticState: currentDiagnosis.state
        }
      }).catch(err => console.warn("[CRM] Onboarding sync failed:", err));
    }

    // 🎯 Sovereign Engine Ignition
    // Generate a plan for the first red-ring person found
    const primaryPerson = collectedItems.find(c => c.ring === "red") || collectedItems[0];
    if (primaryPerson) {
      const mockPattern = {
        type: (nextResult.primarySymptom as any) || (primaryPerson.symptomIds?.[0] as any) || "emotional",
        examples: ["مواقف متكررة من الاستنزاف"],
        frequency: 3
      };
      
      const plan = generateDynamicPlan(
        primaryPerson.name,
        (primaryPerson.ring || "yellow") as any,
        [mockPattern as any],
        ["أنت بحاجة لحماية طاقتك العاطفية أولاً."]
      );
      setPrimaryPlan(plan);
    }

    if (email.trim()) {
      try {
        await signInWithMagicLink(email.trim());
        await sendRecoveryPlanEmail(email.trim(), {
          relationshipCount: collectedItems.length,
          redCount: nextResult.redCount,
          yellowCount: nextResult.yellowCount,
          greenCount: nextResult.greenCount,
          userName: finalName || undefined,
          magicLink: window.location.origin
        });
      } catch (err) {
        console.warn("[Auth] Onboarding email action failed:", err);
      }
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("dawayir-lead-email", email);
      window.sessionStorage.setItem("dawayir-lead-whatsapp", whatsapp);
    }
    goTo(5);
  }, [collectedItems, derivedResult, diagnosis, gateContext, painDump, seededMirrorName, goTo, setMirrorName]);

  const handleComplete = useCallback(() => {
    if (!completionTrackedRef.current) {
      trackingService.recordFlow("onboarding_completed", {
        meta: {
          redCount: collectedItems.filter(c => c.ring === "red").length,
          yellowCount: collectedItems.filter(c => c.ring === "yellow").length,
          greenCount: collectedItems.filter(c => c.ring === "green").length,
          protocol: diagnosis?.protocolKey
        }
      });
      analyticsService.trackOnboardingCompleted({ 
        flow: "onboarding",
        client_event_id: clientEventIdRef.current!
      });
      completionTrackedRef.current = true;
    }

    // Gamification & Persistence
    const { addXP, addCoins, awardBadge } = useGamificationState.getState();
    const { setTransformationDiagnosis } = useMapState.getState();

    if (diagnosis) {
      setTransformationDiagnosis(diagnosis);
    }

    addXP(100, "بداية الرحلة السِياديّة 🚀");
    addCoins(200, "أول مورد سِيادي 🪙");
    awardBadge(
      "badge_sovereign_start", 
      "المستكشف الأول", 
      "وضع أول علامة على خريطة حياته بشجاعة.", 
      "compass"
    );

    markJourneyOnboardingDone();
    onComplete(false);
    if (getNotificationPermission() === "default") {
      setTimeout(() => { void enableNotificationsWithPrompt(); }, 1500);
    }
  }, [collectedItems, diagnosis, onComplete]);

  const dots = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 ob-dark-force ob-bg"
      dir="rtl"
    >
      <style>{ONBOARDING_STYLES}</style>

      {/* ── Cinematic ambient background ── */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="ob-bg-orb ob-orb-1" />
        <div className="ob-bg-orb ob-orb-2" />
        <div className="ob-bg-orb ob-orb-3" />
        <div className="ob-grid" />
        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 35%, rgba(2,4,8,0.65) 100%)"
        }} />
      </div>

      <div 
        className="relative z-10 w-full max-w-sm rounded-[2.5rem] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl border border-white/10"
        style={{ background: "rgba(8, 12, 22, 0.82)", backdropFilter: "blur(28px)" }}
      >
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {dots.map((d) => (
            <div 
              key={d} 
              className="rounded-full transition-all duration-300" 
              style={{
                height: 5,
                width: d === step ? 24 : 5,
                background: d === step ? "#2dd4bf" : d < step ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.1)"
              }}
            />
          ))}
        </div>

        <div className="px-8 py-6 pb-10 overflow-y-auto custom-scrollbar relative">
          {step === 0 && <FirstSparkOnboarding onComplete={handleNoiseNext} gateContext={gateContext} />}
          {step === 1 && <StepInventory onNext={handleInventoryNext} onSkip={handleSkip} mirrorName={seededMirrorName} />}
          {step === 2 && (
            <StepMapping 
              items={collectedItems as any} 
              onNext={handleMappingNext} 
              onRingSelected={handleRingSelected}
              onSkip={handleSkip} 
            />
          )}
          {step === 3 && <StepInsight items={collectedItems as any} onComplete={() => goTo(4)} onSkip={() => goTo(4)} />}
          {step === 4 && (
            <StepContactCapture
              initialName={name}
              onComplete={handleContactCapture}
              onSkip={() => {
                trackingService.recordFlow("onboarding_contact_skipped", {
                  meta: {
                    redCount: derivedResult?.redCount ?? 0,
                    yellowCount: derivedResult?.yellowCount ?? 0,
                    greenCount: derivedResult?.greenCount ?? 0
                  }
                });
                goTo(5);
              }}
            />
          )}
          {step === 5 && (
            <StepResultsScreen 
              userName={name} 
              diagnosis={diagnosis} 
              result={derivedResult} 
              plan={primaryPlan} 
              painDump={painDump}
              onComplete={handleComplete} 
            />
          )}
          
          <AnimatePresence>
            {diagnosticModal && (
              <SymptomTriggerModal 
                name={diagnosticModal.name}
                onSelect={handleSymptomSelect}
                onClose={() => {
                   const { cardIdx } = diagnosticModal;
                   setCollectedItems((prev) =>
                     prev.map((c, i) => i === cardIdx ? { ...c, ring: "red", placed: true, symptomIds: [] } : c)
                   );
                   setDiagnosticModal(null);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

OnboardingFlow.displayName = "OnboardingFlow";
