'use client';

import type { FC } from "react";
import { useState, useCallback, useEffect, useRef, memo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { useJourneyProgress } from "@/domains/journey";
import { setInLocalStorage } from "@/services/browserStorage";
import { trackingService } from "@/domains/journey";
import { type PulseEntry } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { soundManager } from "@/services/soundManager";
import { analyticsService, AnalyticsEvents, generateUUID } from "@/domains/analytics";
import { FirstSparkOnboarding } from "./FirstSparkOnboarding";
import { AlertTriangle, Mail, ArrowRight, Sparkles, Zap, Smartphone, User, Lock } from "lucide-react";
import { signInWithMagicLink } from "@/services/authService";
import { sendRecoveryPlanEmail } from "@/services/emailService";
import type { AdviceCategory } from "@/data/adviceScripts";
import { enableNotificationsWithPrompt, getNotificationPermission } from "@/services/pushNotifications";
import { marketingLeadService } from "@/services/marketingLeadService";

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
  --color-primary-soft: rgba(8, 12, 28, 0.98);
  --glass-bg: rgba(10, 15, 35, 0.75);
  --glass-bg-hover: rgba(14, 20, 48, 0.85);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-hover: rgba(255, 255, 255, 0.15);
  --text-primary: #ffffff;
  --text-secondary: rgba(214, 224, 235, 0.9);
  --text-muted: rgba(148, 163, 184, 0.65);
  --text-accent: #2dd4bf;
  --soft-teal: #2dd4bf;
  --soft-teal-dim: rgba(45, 212, 191, 0.1);
  --soft-teal-glow: rgba(45, 212, 191, 0.3);
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
  background: radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 75%);
  top: -20%; right: -12%;
  animation: ob-orb-drift1 45s ease-in-out infinite alternate;
}
.ob-orb-2 {
  width: 620px; height: 620px;
  background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 75%);
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
}

type Ring = "green" | "yellow" | "red";

const RING_COLORS: Record<Ring, { bg: string; border: string; label: string; labelAr: string }> = {
  green: { bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.5)", label: "green", labelAr: "قريب" },
  yellow: { bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.5)", label: "yellow", labelAr: "متذبذب" },
  red: { bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.5)", label: "red", labelAr: "بعيد" },
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
  items: { name: string; category: AdviceCategory }[];
  onNext: (mapped: NameCard[]) => void;
  onSkip: () => void;
}> = ({ items, onNext, onSkip }) => {
  const [cards, setCards] = useState<NameCard[]>(
    items.map((item) => ({ ...item, ring: null, placed: false }))
  );

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

    setCards((prev) =>
      prev.map((c, i) => i === cardIdx ? { ...c, ring, placed: true } : c)
    );
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
  collectedItems: { name: string; category: AdviceCategory }[]; 
  onComplete: () => void; 
}> = ({ userName, collectedItems: _collectedItems, onComplete }) => {
  const displayName = userName ? `يا ${userName}` : "";
  return (
    <div className="flex flex-col gap-6 w-full py-2 text-center">
      <div className="space-y-2">
        <Sparkles className="w-8 h-8 text-teal-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">خطتك {displayName} جاهزة!</h2>
        <p className="text-sm text-slate-400">تم تحليل خريطتك وبناء "روشتة الدواير" الخاصة بك كأول خطوة في رحلة تعافيك.</p>
      </div>

      <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-right">
        <div className="flex items-center gap-2 text-teal-400 text-[10px] font-bold mb-2 uppercase tracking-wide">
          <Zap className="w-3 h-3" /> الخطوة الأولى المقترحة
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          ابدأ بتفعيل "درع الدواير" للأشخاص في الدائرة الحمراء لتقليل الضجيج العاطفي اللي بيسحب طاقتك.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full rounded-2xl py-4 bg-teal-400 text-zinc-900 font-bold ob-btn-tap shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all"
      >
        دخول الملاذ الآمن ←
      </button>

      <p className="text-[10px] text-slate-500">نسخة مفصلة اتبعتت على وسيلة التواصل اللي سبتها (تأكد من الـ Spam).</p>
    </div>
  );
};

interface NameCard { name: string; category: AdviceCategory; ring: Ring | null; placed: boolean }
const onboardingRingPalette = RING_COLORS;
void onboardingRingPalette;

/* ── Main OnboardingFlow Component ── */
export const OnboardingFlow: FC<OnboardingFlowProps> = memo(({ onComplete, initialMirrorName }) => {
  const addNode = useMapState((s) => s.addNode);
  const clientEventIdRef = useRef<string | null>(null);

  if (!clientEventIdRef.current) {
    clientEventIdRef.current = generateUUID();
  }
  const setMirrorName = useJourneyProgress().setMirrorName;
  
  const [step, setStep] = useState(0);
  const [, setPrevStep] = useState(-1);
  const [name, setName] = useState((initialMirrorName ?? "").trim());
  const [collectedItems, setCollectedItems] = useState<{ name: string; category: AdviceCategory }[]>([]);
  
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
      "noise_check",
      "inventory",
      "mapping",
      "insight",
      "contact_capture",
      "recovery_plan_preview"
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
    markJourneyOnboardingDone();
    onComplete(true);
  }, [onComplete]);

  const handleInventoryNext = useCallback((items: { name: string; category: AdviceCategory }[]) => {
    setCollectedItems(items);
    goTo(2);
  }, [goTo]);

  const handleNoiseNext = useCallback(() => goTo(1), [goTo]);

  const handleMappingNext = useCallback((mapped: NameCard[]) => {
    for (const item of mapped) {
      if (item.name.trim()) {
        addNode(item.name.trim(), (item.ring ?? "yellow") as Ring, undefined, item.category);
      }
    }
    goTo(3);
  }, [addNode, goTo]);

  const handleContactCapture = useCallback(async (providedName: string, email: string, whatsapp: string) => {
    trackingService.recordFlow("lead_form_submitted", { meta: { name: providedName, email, whatsapp } });
    
    if (!leadTrackedRef.current) {
      analyticsService.trackLead({ 
        method: "whatsapp", 
        has_email: !!email, 
        has_whatsapp: !!whatsapp,
        client_event_id: clientEventIdRef.current!
      });
      // Persist the ID for the next steps in the funnel (Payment)
      analyticsService.setStoredClientEventId(clientEventIdRef.current!);
      leadTrackedRef.current = true;
    }

    const finalName = providedName.trim() || seededMirrorName;
    if (finalName) {
      setName(finalName);
      setMirrorName(finalName);
    }

    // CRM synchronization
    if (whatsapp.trim()) {
      marketingLeadService.syncLead({
        phone: whatsapp.trim(),
        status: "engaged",
        source: "onboarding",
        sourceType: "website",
        metadata: { hasEmail: !!email.trim(), name: finalName }
      }).catch(err => console.warn("[CRM] Onboarding sync failed:", err));
    }

    if (email.trim()) {
      try {
        await signInWithMagicLink(email.trim());
        await sendRecoveryPlanEmail(email.trim(), {
          relationshipCount: collectedItems.length,
          redCount: 0,
          yellowCount: 0,
          greenCount: 0,
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
  }, [collectedItems.length, seededMirrorName, goTo, setMirrorName]);

  const handleComplete = useCallback(() => {
    if (!completionTrackedRef.current) {
      analyticsService.trackOnboardingCompleted({ 
        flow: "onboarding",
        client_event_id: clientEventIdRef.current!
      });
      completionTrackedRef.current = true;
    }

    // Gamification: Welcome Package
    const { addXP, addCoins, awardBadge } = useGamificationState.getState();
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
  }, [onComplete]);

  const dots = [0, 1, 2, 3, 4];

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
                width: d === Math.min(step, 4) ? 24 : 5,
                background: d === Math.min(step, 4) ? "#2dd4bf" : d < Math.min(step, 4) ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.1)"
              }}
            />
          ))}
        </div>

        <div className="px-8 py-6 pb-10 overflow-y-auto custom-scrollbar relative">
          {step === 0 && <FirstSparkOnboarding onComplete={handleNoiseNext} />}
          {step === 1 && <StepInventory onNext={handleInventoryNext} onSkip={handleSkip} mirrorName={seededMirrorName} />}
          {step === 2 && <StepMapping items={collectedItems} onNext={handleMappingNext} onSkip={handleSkip} />}
          {step === 3 && <StepInsight items={collectedItems} onComplete={() => goTo(4)} onSkip={() => goTo(4)} />}
          {step === 4 && <StepContactCapture initialName={name} onComplete={handleContactCapture} onSkip={() => goTo(5)} />}
          {step === 5 && <StepRecoveryPlanPreview userName={name} collectedItems={collectedItems} onComplete={handleComplete} />}
        </div>
      </div>
    </div>
  );
});

OnboardingFlow.displayName = "OnboardingFlow";
