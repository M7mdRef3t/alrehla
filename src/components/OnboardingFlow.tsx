"use client";

import type { FC } from "react";
import { useState, useCallback, useEffect, useRef, memo, useTransition } from "react";
import { motion } from "framer-motion";

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
`;
import { useMapState } from "../state/mapState";
import { setInLocalStorage } from "../services/browserStorage";
import { recordFlowEvent } from "../services/journeyTracking";
import { AnalyticsEvents, trackCompleteRegistration, trackEvent } from "../services/analytics";
import { FirstSparkOnboarding } from "./FirstSparkOnboarding";
import { AlertTriangle } from "lucide-react";
import type { AdviceCategory } from "../data/adviceScripts";
import { enableNotificationsWithPrompt, getNotificationPermission } from "../services/pushNotifications";

/* ════════════════════════════════════════════════
   ONBOARDING FLOW — 3 خطوات للرحلة
   بص جواك → حط كل حد في مكانه → شوف الصورة
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
}


/* ── Slide transition removed: now CSS-only (see ONBOARDING_STYLES) ── */

/* ── Ring colors ── */
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
}> = memo(({ onNext, onSkip }) => {
  // Use refs for input values to avoid re-rendering the entire tree on each keystroke
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);
  const [categories, setCategories] = useState<AdviceCategory[]>(["family", "family", "family"]);
  // Track which inputs have text (for UI updates like border color and category buttons)
  const [hasText, setHasText] = useState<boolean[]>([false, false, false]);
  // Track if at least one field is filled for the button state
  const [canContinue, setCanContinue] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncHasText = useCallback(() => {
    // Debounce: only trigger React state update after 200ms of inactivity
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
      {/* Illustration */}
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
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          بص جواك
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          قبل ما نرسم، فكّر في أكتر 3 أشخاص واخدين مساحة من تفكيرك النهاردة.. سواء بالسلب أو الإيجاب.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 p-2 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
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
                color: "var(--text-primary)",
              }}
              maxLength={30}
              dir="rtl"
            />
            {hasText[i] && (
              <div className="flex gap-1 justify-end items-center">
                <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>ده يقربلك إيه؟</span>
                {(["family", "work", "general"] as AdviceCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateCategory(i, cat)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                    style={{
                      background: categories[i] === cat ? "rgba(45,212,191,0.2)" : "transparent",
                      border: `1px solid ${categories[i] === cat ? "rgba(45,212,191,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color: categories[i] === cat ? "var(--soft-teal)" : "var(--text-muted)"
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
          background: canContinue ? "rgba(45,212,191,0.9)" : "rgba(255,255,255,0.05)",
          color: canContinue ? "#0f172a" : "rgba(255,255,255,0.25)",
          cursor: canContinue ? "pointer" : "not-allowed",
        }}
      >
        يلا نكمل →
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="text-center text-xs transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        تخطي
      </button>
    </div>
  );
});

/* ── Step 2: Mapping (drag-drop simulation) ── */
interface NameCard { name: string; category: AdviceCategory; ring: Ring | null; placed: boolean }

const StepMapping: FC<{
  items: { name: string; category: AdviceCategory }[];
  onNext: (mapped: NameCard[]) => void;
  onSkip: () => void;
}> = ({ items, onNext, onSkip }) => {
  const [cards, setCards] = useState<NameCard[]>(
    items.map((item) => ({ ...item, ring: null, placed: false }))
  );
  const [dragging, setDragging] = useState<number | null>(null);
  const [firstPlaced, setFirstPlaced] = useState(false);

  const handleDrop = (ring: Ring, e: React.DragEvent) => {
    e.preventDefault();
    if (dragging === null) return;
    setCards((prev) =>
      prev.map((c, i) =>
        i === dragging ? { ...c, ring, placed: true } : c
      )
    );
    if (!firstPlaced) setFirstPlaced(true);
    setDragging(null);
  };

  const handleRingClick = (cardIdx: number, ring: Ring) => {
    setCards((prev) =>
      prev.map((c, i) =>
        i === cardIdx ? { ...c, ring, placed: true } : c
      )
    );
    if (!firstPlaced) setFirstPlaced(true);
  };

  const allPlaced = cards.every((c) => c.placed);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center">
        <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          حط كل حد في مكانه
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          اختار لكل اسم مداره.. القريب للقلب في النص، والبعيد في المدارات الخارجية.
        </p>
      </div>

      {/* Ring drop zones */}
      <div className="flex flex-col gap-2">
        {(["green", "yellow", "red"] as Ring[]).map((ring) => {
          const conf = RING_COLORS[ring];
          const placedHere = cards.filter((c) => c.ring === ring);
          return (
            <div
              key={ring}
              className="rounded-2xl px-4 py-3 flex items-center gap-3 transition-all"
              style={{ background: conf.bg, border: `1.5px solid ${conf.border}`, minHeight: 56 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(ring, e)}
            >
              <span className="text-xs font-semibold w-16 text-right shrink-0" style={{ color: conf.border }}>
                {conf.labelAr}
              </span>
              <div className="flex gap-2 flex-wrap flex-1">
                {placedHere.map((c) => (
                  <span
                    key={c.name}
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: conf.border, color: "#0f172a" }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Name cards — unplaced */}
      <div className="flex flex-wrap gap-2 justify-center min-h-[40px]">
        {cards.map((c, i) =>
          !c.placed ? (
            <div
              key={c.name}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-105 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--text-primary)",
              }}
              draggable
              onDragStart={() => setDragging(i)}
              onDragEnd={() => setDragging(null)}
            >
              {c.name}
            </div>
          ) : null
        )}
      </div>

      {/* Tap to place fallback (mobile) */}
      {!allPlaced && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
            أو اضغط على الاسم واختار مداره
          </p>
          {cards.map((c, i) =>
            !c.placed ? (
              <div key={c.name} className="flex items-center gap-2 justify-center">
                <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {c.name}:
                </span>
                {(["green", "yellow", "red"] as Ring[]).map((ring) => (
                  <button
                    key={ring}
                    type="button"
                    onClick={() => handleRingClick(i, ring)}
                    className="text-[11px] font-bold px-3 py-1 rounded-full transition-all"
                    style={{
                      background: RING_COLORS[ring].bg,
                      border: `1px solid ${RING_COLORS[ring].border}`,
                      color: RING_COLORS[ring].border,
                    }}
                  >
                    {RING_COLORS[ring].labelAr}
                  </button>
                ))}
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Encouragement after first placement */}
      {firstPlaced && !allPlaced && (
        <p
          className="text-center text-xs transition-opacity duration-300"
          style={{ color: "rgba(45,212,191,0.7)" }}
        >
          بالظبط كدة.. إنت اللي بتحدد المساحة.
        </p>
      )}

      <button
        type="button"
        onClick={() => onNext(cards)}
        disabled={!allPlaced}
        className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all ob-btn-tap"
        style={{
          background: allPlaced ? "rgba(45,212,191,0.9)" : "rgba(255,255,255,0.05)",
          color: allPlaced ? "#0f172a" : "rgba(255,255,255,0.25)",
          cursor: allPlaced ? "pointer" : "not-allowed",
        }}
      >
        شوف الصورة →
      </button>

      <button type="button" onClick={onSkip} className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
        تخطي
      </button>
    </div>
  );
};

/* ── Step 3: Insight ── */
const StepInsight: FC<{ items: { name: string; category: AdviceCategory }[]; onComplete: () => void; onSkip: () => void }> = ({ items, onComplete, onSkip }) => {
  const count = items.length;
  const names = items.map(i => i.name);

  return (
    <div className="flex flex-col gap-6 w-full items-center text-center">

      {/* Animated map glow - CSS animations (no JS blocking) */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {[44, 68, 88].map((r, i) => (
          <div
            key={r}
            className="absolute rounded-full"
            style={{
              width: r,
              height: r,
              border: `1px solid rgba(45,212,191,${0.35 - i * 0.08})`,
              animation: `ob-ring-pulse ${2.5 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
            }}
          />
        ))}
        {/* Center pulse */}
        <div
          className="rounded-full"
          style={{ width: 18, height: 18, background: "rgba(45,212,191,0.9)", boxShadow: "0 0 24px rgba(45,212,191,0.5)", animation: "ob-center-pulse 2s ease-in-out infinite" }}
        />
        {/* Node dots around center */}
        {names.slice(0, 3).map((_, i) => {
          const angle = (i / 3) * 2 * Math.PI - Math.PI / 2;
          const r = 34;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 10, height: 10,
                background: ["rgba(52,211,153,0.9)", "rgba(251,191,36,0.9)", "rgba(248,113,113,0.9)"][i],
                left: 60 + Math.cos(angle) * r - 5,
                top: 60 + Math.sin(angle) * r - 5,
                boxShadow: `0 0 10px ${["rgba(52,211,153,0.5)", "rgba(251,191,36,0.5)", "rgba(248,113,113,0.5)"][i]}`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 200, damping: 15 }}
            />
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          مبروك.. دي أول خريطة لوعيك
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {count === 1
            ? `حطيت ${names[0]} في مداره.`
            : count === 2
              ? `حطيت ${names[0]} و${names[1]} في مداراتهم.`
              : `حطيت ${names[0]}، ${names[1]}، و${names[2]} في مداراتهم.`}
          {" "}مش محتاجة تكون مثالية، المهم إنها حقيقية.
        </p>
      </div>

      <div
        className="w-full rounded-2xl p-4"
        style={{
          background: "linear-gradient(135deg, rgba(45,212,191,0.06), rgba(139,92,246,0.06))",
          border: "1px solid rgba(45,212,191,0.2)",
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: "rgba(45,212,191,0.85)" }}>
          "التعافي مش سحر، هو إنك بقيت شايف خريطتك بوضوح."
        </p>
      </div>

      <div
        className="w-full rounded-2xl p-4 border border-rose-500/20 bg-rose-950/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
        <p className="text-xs font-bold text-rose-400 mb-1 flex items-center gap-1 justify-center">
          <AlertTriangle className="w-4 h-4" />
          سر الدواير (The Aha Moment)
        </p>
        <p className="text-[13px] text-slate-300 leading-relaxed mt-2">
          علاقاتك اللي بتستنزفك مش بس أسماء، دي بتتحول لـ <span className="text-rose-400 font-bold">ثقوب سوداء</span> مرئية تسحب طاقتك بانقباض مستمر.. إحنا هنا عشان نوقّف النزيف ده.
        </p>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="w-full rounded-2xl py-3.5 text-sm font-bold ob-btn-tap hover:brightness-110 transition-all"
        style={{ background: "rgba(45,212,191,0.9)", color: "#0f172a" }}
      >
        أنطلق لرحلتك ←
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        className="text-center text-xs transition-colors hover:text-slate-300 cursor-pointer"
        style={{ color: "var(--text-muted)" }}
      >
        تخطي
      </button>

      <p className="text-[11px]" style={{ color: "rgba(148,163,184,0.5)" }}>
        متقلقش، مفيش إجابة غلط.. دي خريطتك إنت.
      </p>

    </div>
  );
};


/* ════════════════════════════════════════════════
   Main OnboardingFlow
   ════════════════════════════════════════════════ */
export const OnboardingFlow: FC<OnboardingFlowProps> = memo(({ onComplete }) => {
  const addNode = useMapState((s) => s.addNode);
  const [step, setStep] = useState(0);
  const [prevStep, setPrevStep] = useState(-1);
  const [collectedItems, setCollectedItems] = useState<{ name: string; category: AdviceCategory }[]>([]);
  const completionTrackedRef = useRef(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      recordFlowEvent("onboarding_opened");
      trackEvent(AnalyticsEvents.ONBOARDING_STARTED, {
        entry_point: "relationship_map"
      });
    } catch {
      // Never block onboarding rendering on analytics failures.
    }
  }, []);

  const stepRef = useRef(0);

  const goTo = useCallback((next: number) => {
    startTransition(() => {
      setStep((prev) => {
        setPrevStep(prev);
        stepRef.current = next;
        return next;
      });
    });
  }, [startTransition]);

  const handleSkip = useCallback(() => {
    const currentStep = stepRef.current;
    const stepId = currentStep === 0 ? "noise" : currentStep === 1 ? "inventory" : currentStep === 2 ? "mapping" : "review";
    recordFlowEvent("onboarding_skipped", { atStep: stepId });
    markJourneyOnboardingDone();
    onComplete(true);
  }, [onComplete]);


  const handleInventoryNext = useCallback((items: { name: string; category: AdviceCategory }[]) => {
    recordFlowEvent("onboarding_phase_inventory_completed", {
      meta: { itemsCount: items.length }
    });
    setCollectedItems(items);
    goTo(2);
  }, [goTo]);

  const handleNoiseNext = useCallback(() => {
    recordFlowEvent("onboarding_phase_noise_completed");
    goTo(1);
  }, [goTo]);

  const handleMappingNext = useCallback((mapped: NameCard[]) => {
    recordFlowEvent("onboarding_phase_mapping_completed", {
      meta: { mappedCount: mapped.length }
    });
    // Add nodes to mapState
    for (const item of mapped) {
      if (item.name.trim()) {
        addNode(
          item.name.trim(),
          (item.ring ?? "yellow") as "green" | "yellow" | "red",
          undefined,
          item.category // goalId effectively
        );
      }
    }
    goTo(3);
  }, [addNode, goTo]);

  const handleComplete = useCallback(() => {
    const hasTrackedThisSession =
      completionTrackedRef.current ||
      (typeof window !== "undefined" &&
        window.sessionStorage.getItem(ONBOARDING_COMPLETION_SESSION_KEY) === "true");

    if (!hasTrackedThisSession) {
      recordFlowEvent("onboarding_completed", {
        meta: { itemsCount: collectedItems.length }
      });
      trackCompleteRegistration({
        items_count: collectedItems.length,
        flow: "relationship_onboarding"
      });
      completionTrackedRef.current = true;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(ONBOARDING_COMPLETION_SESSION_KEY, "true");
      }
    }

    markJourneyOnboardingDone();
    onComplete(false);

    // Push Notification: best moment = right after completing the journey
    if (typeof window !== "undefined" && getNotificationPermission() === "default") {
      setTimeout(() => { void enableNotificationsWithPrompt(); }, 2000);
    }
  }, [collectedItems.length, onComplete]);


  /* Progress dots */
  const dots = [0, 1, 2, 3];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(8,12,24,0.96)", backdropFilter: "blur(8px)" }}
      dir="rtl"
    >
      <style>{ONBOARDING_STYLES}</style>
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl flex flex-col max-h-[95vh] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
        style={{
          background: "linear-gradient(160deg, rgba(15,23,42,0.98), rgba(12,18,38,0.98))",
          border: "1px solid rgba(45,212,191,0.15)",
        }}
      >
        {/* Progress dots — CSS transition only */}
        <div className="flex justify-center gap-2 pt-5 pb-1">
          {dots.map((d: number) => (
            <div
              key={d}
              className="rounded-full transition-all duration-300"
              style={{
                height: 6,
                width: d === step ? 20 : 6,
                background: d === step ? "rgba(45,212,191,0.9)" : d < step ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>

        {/* Content area — CSS transitions, no AnimatePresence blocking */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar relative">
          {step === 0 && (
            <div key="stepN" className={prevStep < 0 ? "ob-step-enter" : "ob-step-enter"}>
              <FirstSparkOnboarding onComplete={handleNoiseNext} />
            </div>
          )}

          {step === 1 && (
            <div key="step0" className="ob-step-enter">
              <StepInventory onNext={handleInventoryNext} onSkip={handleSkip} />
            </div>
          )}
          {step === 2 && (
            <div key="mapping" className="ob-step-enter">
              <StepMapping items={collectedItems} onNext={handleMappingNext} onSkip={handleSkip} />
            </div>
          )}
          {step === 3 && (
            <div key="insight" className="ob-step-enter">
              <StepInsight items={collectedItems} onComplete={handleComplete} onSkip={handleComplete} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
(OnboardingFlow as unknown as { displayName: string }).displayName = "OnboardingFlow";
