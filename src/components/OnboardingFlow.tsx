"use client";

import type { FC } from "react";
import { useState, useCallback, useEffect, useRef, memo, useTransition } from "react";
import { motion } from "framer-motion";
import { useMapState } from "../state/mapState";
import { useJourneyState } from "../state/journeyState";
import { setInLocalStorage } from "../services/browserStorage";
import { recordFlowEvent } from "../services/journeyTracking";
import { AnalyticsEvents, trackCompleteRegistration, trackEvent, trackLead } from "../services/analytics";
import { FirstSparkOnboarding } from "./FirstSparkOnboarding";
import { AlertTriangle, CheckCircle2, ShieldCheck, Mail, ArrowRight, Sparkles, Layout, Zap } from "lucide-react";
import { signInWithMagicLink } from "../services/authService";
import { sendRecoveryPlanEmail } from "../services/emailService";
import { getStoredLeadAttribution } from "../services/marketingAttribution";
import type { AdviceCategory } from "../data/adviceScripts";
import { enableNotificationsWithPrompt, getNotificationPermission } from "../services/pushNotifications";
import { marketingLeadService } from "../services/marketingLeadService";

const ONBOARDING_STYLES = `
@keyframes ob-ring-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes ob-center-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
@keyframes ob-icon-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
.ob-step-enter {
  opacity: 1; transform: translateX(0);
  transition: opacity 0.32s ease-out, transform 0.32s ease-out;
}
.ob-step-exit {
  opacity: 0; transform: translateX(40px);
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
  pointer-events: none; position: absolute; inset: 0;
}
.ob-btn-tap:active { transform: scale(0.97); }

/* Force dark-mode variables inside onboarding regardless of theme */
.ob-dark-force {
  --color-primary-soft: rgba(10, 14, 31, 0.95);
  --glass-bg: rgba(12, 17, 40, 0.78);
  --glass-bg-hover: rgba(15, 22, 50, 0.88);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-border-hover: rgba(255, 255, 255, 0.18);
  --text-primary: #ffffff;
  --text-secondary: rgba(203, 213, 225, 0.95);
  --text-muted: rgba(148, 163, 184, 0.7);
  --text-accent: #2dd4bf;
  --soft-teal: #2dd4bf;
  --soft-teal-dim: rgba(45, 212, 191, 0.12);
  --soft-teal-glow: rgba(45, 212, 191, 0.25);
}

/* ── Cinematic background matching hero ── */
.ob-bg {
  background: #020408;
}
.ob-bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform;
}
.ob-orb-1 {
  width: 650px; height: 650px;
  background: radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%);
  top: -15%; right: -8%;
  animation: ob-orb-drift1 38s ease-in-out infinite alternate;
}
.ob-orb-2 {
  width: 550px; height: 550px;
  background: radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%);
  bottom: -20%; left: -10%;
  animation: ob-orb-drift2 52s ease-in-out infinite alternate;
}
.ob-orb-3 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(245,158,11,0.055) 0%, transparent 70%);
  top: 40%; left: 25%;
  animation: ob-orb-drift3 44s ease-in-out infinite alternate;
}
.ob-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%);
  opacity: 0.65;
  pointer-events: none;
}
@keyframes ob-orb-drift1 {
  0%   { transform: translate(0%, 0%)  scale(1);    }
  50%  { transform: translate(-5%, 7%) scale(1.1);  }
  100% { transform: translate(4%, -4%) scale(0.93); }
}
@keyframes ob-orb-drift2 {
  0%   { transform: translate(0%, 0%)    scale(1);    }
  50%  { transform: translate(7%, -9%)  scale(1.07); }
  100% { transform: translate(-4%, 5%)  scale(0.96); }
}
@keyframes ob-orb-drift3 {
  0%   { transform: translate(0%, 0%)  scale(1);    }
  100% { transform: translate(4%, -7%) scale(1.14); }
}
`;


/* ════════════════════════════════════════════════
   ONBOARDING FLOW — رحلة اكتشاف الذات
   ════════════════════════════════════════════════ */

const ONBOARDING_KEY = "dawayir-journey-onboarding-done";
const ONBOARDING_COMPLETION_SESSION_KEY = "dawayir-onboarding-completed-session";

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
                    {cat === "family" ? "عيلة" : cat === "work" ? "شغل" : "تاني"}
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

      <button onClick={onSkip} className="text-center text-xs text-slate-500 hover:text-slate-300 transition-colors">تخطي</button>
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
  const [dragging, setDragging] = useState<number | null>(null);

  const handleRingClick = (cardIdx: number, ring: Ring) => {
    setCards((prev) =>
      prev.map((c, i) => i === cardIdx ? { ...c, ring, placed: true } : c)
    );
  };

  const allPlaced = cards.every((c) => c.placed);

  return (
    <div className="flex flex-col gap-5 w-full text-center">
      <h2 className="text-lg font-bold text-white">حط كل حد في مكانه</h2>
      <p className="text-sm text-slate-300">
        اختار لكل اسم مداره.. القريب للقلب في النص، والبعيد في المدارات الخارجية.
      </p>

      <div className="flex flex-col gap-2">
        {(["green", "yellow", "red"] as Ring[]).map((ring) => {
          const conf = RING_COLORS[ring];
          const placedHere = cards.filter((c) => c.ring === ring);
          return (
            <div
              key={ring}
              className="rounded-2xl px-4 py-3 flex items-center gap-3 border transition-all"
              style={{ background: conf.bg, borderColor: conf.border, minHeight: 56 }}
            >
              <span className="text-xs font-semibold w-16 text-right shrink-0" style={{ color: conf.border }}>
                {conf.labelAr}
              </span>
              <div className="flex gap-2 flex-wrap">
                {placedHere.map((c) => (
                  <span key={c.name} className="text-xs font-bold px-3 py-1 rounded-full text-zinc-900" style={{ background: conf.border }}>
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {cards.map((c, i) => !c.placed && (
          <div key={c.name} className="flex items-center gap-2 justify-center py-1">
            <span className="text-sm font-semibold text-white">{c.name}:</span>
            {(["green", "yellow", "red"] as Ring[]).map((ring) => (
              <button
                key={ring}
                onClick={() => handleRingClick(i, ring)}
                className="text-[10px] font-bold px-3 py-1 rounded-full border transition-all"
                style={{ background: RING_COLORS[ring].bg, borderColor: RING_COLORS[ring].border, color: RING_COLORS[ring].border }}
              >
                {RING_COLORS[ring].labelAr}
              </button>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={() => onNext(cards)}
        disabled={!allPlaced}
        className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all ob-btn-tap"
        style={{
          background: allPlaced ? "#2dd4bf" : "rgba(255,255,255,0.05)",
          color: allPlaced ? "#0f172a" : "rgba(255,255,255,0.2)",
        }}
      >
        شوف النتيجة →
      </button>

      <button onClick={onSkip} className="text-xs text-slate-500">تخطي</button>
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

      <button onClick={onSkip} className="text-xs text-slate-500">مش دلوقتي</button>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!whatsapp.trim()) {
      setError("حط رقم الواتساب عشان نوصلك بخطتك.");
      return;
    }
    setLoading(true);
    try {
      await onComplete(name, email, whatsapp);
    } catch {
      setError("حصلت مشكلة. جرب تاني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-1">
        <span className="text-2xl">📲</span>
      </div>
      <h2 className="text-lg font-bold text-white">طريقك للوضوح بدأ</h2>
      <p className="text-xs text-slate-400 mb-2 leading-relaxed">سيب اسمك ورقم الواتساب وهنبعتلك "روشتة الدواير" وصورة خريطتك فوراً.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-right">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 mr-2 uppercase tracking-widest">الاسم (هيظهر على الخريطة)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمك أو لقبك.."
            className="w-full rounded-xl px-4 py-3.5 text-sm bg-white/5 border border-white/10 text-white focus:border-teal-400/50 outline-none transition-all"
            dir="rtl"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-teal-400 tracking-widest mr-2 uppercase">واتساب (أساسي)</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="01xxxxxxxxx"
            autoFocus
            dir="ltr"
            className="w-full rounded-xl px-4 py-3.5 text-sm bg-white/5 border border-white/10 text-white focus:border-teal-400/50 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 mr-2 uppercase tracking-widest">الإيميل (اختياري)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            className="w-full rounded-xl px-4 py-3.5 text-sm bg-white/5 border border-white/10 text-white outline-none"
          />
        </div>

        {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl py-4 bg-teal-400 text-zinc-900 font-bold ob-btn-tap transition-all shadow-lg"
        >
          {loading ? "جاري التجهيز..." : "استلم خطة التعافي"}
        </button>
      </form>

      <button onClick={onSkip} className="text-xs text-slate-500 mt-2">تخطي، دخلني الملاذ الآمن</button>
    </div>
  );
};

/* ── Step 5: Recovery Plan Preview ── */
const StepRecoveryPlanPreview: FC<{ 
  userName?: string;
  collectedItems: { name: string; category: AdviceCategory }[]; 
  onComplete: () => void; 
}> = ({ userName, collectedItems, onComplete }) => {
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

/* ── Main OnboardingFlow Component ── */
export const OnboardingFlow: FC<OnboardingFlowProps> = memo(({ onComplete, initialMirrorName }) => {
  const addNode = useMapState((s) => s.addNode);
  const setMirrorName = useJourneyState((s) => s.setMirrorName);
  
  const [step, setStep] = useState(0);
  const [prevStep, setPrevStep] = useState(-1);
  const [name, setName] = useState((initialMirrorName ?? "").trim());
  const [collectedItems, setCollectedItems] = useState<{ name: string; category: AdviceCategory }[]>([]);
  
  const completionTrackedRef = useRef(false);
  const [, startTransition] = useTransition();
  const stepRef = useRef(0);
  
  const seededMirrorName = (initialMirrorName ?? "").trim();

  useEffect(() => {
    recordFlowEvent("onboarding_opened");
    trackEvent(AnalyticsEvents.ONBOARDING_STARTED, { 
      entry_point: seededMirrorName ? "landing_bridge" : "direct" 
    });
  }, [seededMirrorName]);

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
    recordFlowEvent("lead_form_submitted", { meta: { name: providedName, email, whatsapp } });
    trackLead({ method: "whatsapp", has_email: !!email, has_whatsapp: !!whatsapp });

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
      trackCompleteRegistration({ flow: "onboarding" });
      completionTrackedRef.current = true;
    }
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

(OnboardingFlow as any).displayName = "OnboardingFlow";
