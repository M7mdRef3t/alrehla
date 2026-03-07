import type { FC } from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from "../state/mapState";
import { setInLocalStorage } from "../services/browserStorage";
import { recordFlowEvent } from "../services/journeyTracking";
import { FirstSparkOnboarding } from "./FirstSparkOnboarding";
import type { AdviceCategory } from "../data/adviceScripts";

/* ════════════════════════════════════════════════
   ONBOARDING FLOW — 3 خطوات للرحلة
   بص جواك → حط كل حد في مكانه → شوف الصورة
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
}


/* ── Slide transition ── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir * -60, opacity: 0, filter: "blur(6px)" }),
  center: { x: 0, opacity: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({ x: dir * 60, opacity: 0, filter: "blur(6px)" }),
};

const slideTransition = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

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
}> = ({ onNext, onSkip }) => {
  const [items, setItems] = useState<{ name: string; category: AdviceCategory }[]>([
    { name: "", category: "family" },
    { name: "", category: "family" },
    { name: "", category: "family" },
  ]);

  const updateName = (i: number, val: string) => {
    setItems((prev) => {
      const n = [...prev];
      n[i] = { ...n[i], name: val };
      return n;
    });
  };

  const updateCategory = (i: number, cat: AdviceCategory) => {
    setItems((prev) => {
      const n = [...prev];
      n[i] = { ...n[i], category: cat };
      return n;
    });
  };

  const filled = items.filter((item) => item.name.trim().length > 0);
  const canContinue = filled.length >= 1;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Illustration */}
      <div className="flex justify-center">
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.12), rgba(139,92,246,0.12))",
            border: "1.5px solid rgba(45,212,191,0.25)",
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(45,212,191,0.8)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </motion.div>
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
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
            className="flex flex-col gap-2 p-2 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder={i === 0 ? "الاسم الأول.." : i === 1 ? "الاسم الثاني.." : "الاسم الثالث (اختياري).."}
              className="w-full rounded-xl px-4 py-2 text-sm text-right outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${item.name.trim() ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: "var(--text-primary)",
              }}
              maxLength={30}
              dir="rtl"
            />
            {item.name.trim() && (
              <div className="flex gap-1 justify-end items-center">
                <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>ده يقربلك إيه؟</span>
                {(["family", "work", "general"] as AdviceCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateCategory(i, cat)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                    style={{
                      background: item.category === cat ? "rgba(45,212,191,0.2)" : "transparent",
                      border: `1px solid ${item.category === cat ? "rgba(45,212,191,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color: item.category === cat ? "var(--soft-teal)" : "var(--text-muted)"
                    }}
                  >
                    {cat === "family" ? "عيلة" : cat === "work" ? "شغل" : "تاني"}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.button
        type="button"
        onClick={() => onNext(items.filter((item) => item.name.trim()))}
        disabled={!canContinue}
        className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all"
        style={{
          background: canContinue ? "rgba(45,212,191,0.9)" : "rgba(255,255,255,0.05)",
          color: canContinue ? "#0f172a" : "rgba(255,255,255,0.25)",
          cursor: canContinue ? "pointer" : "not-allowed",
        }}
        whileTap={canContinue ? { scale: 0.97 } : {}}
      >
        يلا نكمل →
      </motion.button>

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
};

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
            <motion.div
              key={c.name}
              className="px-4 py-2 rounded-full text-sm font-semibold cursor-grab active:cursor-grabbing select-none"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--text-primary)",
              }}
              draggable
              onDragStart={() => setDragging(i)}
              onDragEnd={() => setDragging(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
            >
              {c.name}
            </motion.div>
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
      <AnimatePresence>
        {firstPlaced && !allPlaced && (
          <motion.p
            className="text-center text-xs"
            style={{ color: "rgba(45,212,191,0.7)" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            بالظبط كدة.. إنت اللي بتحدد المساحة.
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => onNext(cards)}
        disabled={!allPlaced}
        className="w-full rounded-2xl py-3.5 text-sm font-bold transition-all"
        style={{
          background: allPlaced ? "rgba(45,212,191,0.9)" : "rgba(255,255,255,0.05)",
          color: allPlaced ? "#0f172a" : "rgba(255,255,255,0.25)",
          cursor: allPlaced ? "pointer" : "not-allowed",
        }}
        whileTap={allPlaced ? { scale: 0.97 } : {}}
      >
        شوف الصورة →
      </motion.button>

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

      {/* Animated map glow */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {[44, 68, 88].map((r, i) => (
          <motion.div
            key={r}
            className="absolute rounded-full"
            style={{ width: r, height: r, border: `1px solid rgba(45,212,191,${0.35 - i * 0.08})` }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        ))}
        {/* Center pulse */}
        <motion.div
          className="rounded-full"
          style={{ width: 18, height: 18, background: "rgba(45,212,191,0.9)", boxShadow: "0 0 24px rgba(45,212,191,0.5)" }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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

      <motion.button
        type="button"
        onClick={onComplete}
        className="w-full rounded-2xl py-3.5 text-sm font-bold"
        style={{ background: "rgba(45,212,191,0.9)", color: "#0f172a" }}
        whileHover={{ background: "rgba(45,212,191,1)" }}
        whileTap={{ scale: 0.97 }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        أنطلق لرحلتك ←
      </motion.button>

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
export const OnboardingFlow: FC<OnboardingFlowProps> = ({ onComplete }) => {
  const addNode = useMapState((s) => s.addNode);
  const [step, setStep] = useState(0); // 0 (noise), 1 (inventory), 2 (placement), 3 (review)
  const [direction, setDirection] = useState(-1);
  const [collectedItems, setCollectedItems] = useState<{ name: string; category: AdviceCategory }[]>([]);

  const goTo = useCallback((next: number) => {
    setDirection(next > step ? -1 : 1);
    setStep(next);
  }, [step]);

  const handleSkip = useCallback(() => {
    const stepId = step === 0 ? "noise" : step === 1 ? "inventory" : step === 2 ? "mapping" : "review";
    recordFlowEvent("onboarding_skipped", { atStep: stepId });
    markJourneyOnboardingDone();
    onComplete(true); // true indicates skipped
  }, [onComplete, step]);


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
    recordFlowEvent("onboarding_completed", {
      meta: { itemsCount: collectedItems.length }
    });
    markJourneyOnboardingDone();
    onComplete(false); // false indicates completed normally
  }, [collectedItems.length, onComplete]);


  /* Progress dots */
  const dots = [0, 1, 2, 3];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(8,12,24,0.96)", backdropFilter: "blur(8px)" }}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl flex flex-col max-h-[95vh] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
        style={{
          background: "linear-gradient(160deg, rgba(15,23,42,0.98), rgba(12,18,38,0.98))",
          border: "1px solid rgba(45,212,191,0.15)",
        }}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5 pb-1">
          {dots.map((d: number) => (
            <motion.div
              key={d}
              className="rounded-full"
              animate={{
                width: d === step ? 20 : 6,
                background: d === step ? "rgba(45,212,191,0.9)" : d < step ? "rgba(45,212,191,0.4)" : "rgba(255,255,255,0.12)",
              }}
              style={{ height: 6 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Content area with slide animation */}
        <div className="px-6 py-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.div
                key="stepN"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <FirstSparkOnboarding onComplete={handleNoiseNext} />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <StepInventory onNext={handleInventoryNext} onSkip={handleSkip} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="mapping"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <StepMapping items={collectedItems} onNext={handleMappingNext} onSkip={handleSkip} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="insight"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
              >
                <StepInsight items={collectedItems} onComplete={handleComplete} onSkip={handleComplete} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
