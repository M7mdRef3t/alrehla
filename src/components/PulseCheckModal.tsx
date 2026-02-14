import type { CSSProperties, FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PulseFocus, PulseMood } from "../state/pulseState";
import { usePulseState } from "../state/pulseState";
import { energyColorHex, energyPct } from "../utils/pulseUi";
import { recordFlowEvent } from "../services/journeyTracking";

interface PulseCheckModalProps {
  isOpen: boolean;
  context?: "regular" | "start_recovery";
  onSubmit: (payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean; notes?: string }) => void;
  onClose: (reason?: "backdrop" | "close_button") => void;
}

const EARLY_PHASE_NOTES_COLLAPSE_COUNT = 3;

const MOODS: Array<{ id: PulseMood; label: string; emoji: string }> = [
  { id: "bright", label: "رايق", emoji: "☀️" },
  { id: "calm", label: "هادئ", emoji: "🌤️" },
  { id: "tense", label: "متوتر", emoji: "🌪️" },
  { id: "hopeful", label: "متفائل", emoji: "🌈" },
  { id: "anxious", label: "قلقان", emoji: "☁️" },
  { id: "angry", label: "غضبان", emoji: "⛈️" },
  { id: "sad", label: "حزين", emoji: "🌧️" },
  { id: "overwhelmed", label: "إرهاق", emoji: "🌫️" }
];

const FOCUS_OPTIONS: Array<{ id: PulseFocus; labelKey: "event" | "thought" | "body" | "none_new" | "none_returning" }> = [
  { id: "event", labelKey: "event" },
  { id: "thought", labelKey: "thought" },
  { id: "body", labelKey: "body" },
  { id: "none", labelKey: "none_returning" }
];

const FOCUS_LABELS: Record<string, string> = {
  event: "موقف حصل",
  thought: "فكرة مش بتروح",
  body: "جسدي تعبان",
  none_returning: "ولا حاجة، جاي أكمل",
  none_new: "ولا حاجة، جاي أكتشف"
};

const MOOD_COSMIC: Record<PulseMood, { bg: string; border: string; glow: string; text: string }> = {
  bright: { bg: "rgba(250, 204, 21, 0.15)", border: "rgba(250, 204, 21, 0.4)", glow: "0 0 20px rgba(250, 204, 21, 0.25)", text: "#facc15" },
  calm: { bg: "rgba(45, 212, 191, 0.15)", border: "rgba(45, 212, 191, 0.4)", glow: "0 0 20px rgba(45, 212, 191, 0.25)", text: "#2dd4bf" },
  anxious: { bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.4)", glow: "0 0 20px rgba(251, 191, 36, 0.25)", text: "#fbbf24" },
  angry: { bg: "rgba(248, 113, 113, 0.15)", border: "rgba(248, 113, 113, 0.4)", glow: "0 0 20px rgba(248, 113, 113, 0.25)", text: "#f87171" },
  sad: { bg: "rgba(96, 165, 250, 0.15)", border: "rgba(96, 165, 250, 0.4)", glow: "0 0 20px rgba(96, 165, 250, 0.25)", text: "#60a5fa" },
  tense: { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)", glow: "0 0 20px rgba(245, 158, 11, 0.25)", text: "#f59e0b" },
  hopeful: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.4)", glow: "0 0 20px rgba(34, 197, 94, 0.25)", text: "#22c55e" },
  overwhelmed: { bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.4)", glow: "0 0 20px rgba(139, 92, 246, 0.25)", text: "#8b5cf6" }
};

const FOCUS_COSMIC: Record<PulseFocus, { bg: string; border: string; text: string }> = {
  event: { bg: "rgba(45, 212, 191, 0.12)", border: "rgba(45, 212, 191, 0.3)", text: "#2dd4bf" },
  thought: { bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.3)", text: "#a78bfa" },
  body: { bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.3)", text: "#f87171" },
  none: { bg: "rgba(45, 212, 191, 0.08)", border: "rgba(45, 212, 191, 0.2)", text: "#2dd4bf" }
};

function energyGradient(energy: number): string {
  if (energy <= 2) return "radial-gradient(ellipse at 50% 60%, rgba(248, 113, 113, 0.12) 0%, transparent 60%)";
  if (energy <= 4) return "radial-gradient(ellipse at 50% 60%, rgba(251, 191, 36, 0.1) 0%, transparent 60%)";
  if (energy <= 6) return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.08) 0%, transparent 55%)";
  if (energy <= 8) return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.12) 0%, transparent 55%)";
  return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.18) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 65%)";
}

const cosmicUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

export const PulseCheckModal: FC<PulseCheckModalProps> = ({
  isOpen,
  context = "regular",
  onSubmit,
  onClose
}) => {
  const isStartRecovery = context === "start_recovery";
  const pulseLogs = usePulseState((s) => s.logs);
  const isFirstPulse = pulseLogs.length === 0;
  const isEarlyPhase = pulseLogs.length < EARLY_PHASE_NOTES_COLLAPSE_COUNT;
  const allowSkip = !isFirstPulse;

  const [energy, setEnergy] = useState(5);
  const [hasPickedEnergy, setHasPickedEnergy] = useState(true);
  const [mood, setMood] = useState<PulseMood | null>(null);
  const [focus, setFocus] = useState<PulseFocus | null>(null);
  const [notes, setNotes] = useState("");
  const [notesExpanded, setNotesExpanded] = useState(!isEarlyPhase);
  const [showRequiredHint, setShowRequiredHint] = useState(false);
  const [hasTrackedNotesUsage, setHasTrackedNotesUsage] = useState(false);
  const [isCompactMobile, setIsCompactMobile] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const fillHex = energyColorHex(energy);
  const pct = energyPct(energy, { min: 1, max: 10 });
  const isComplete = useMemo(() => hasPickedEnergy && Boolean(mood) && Boolean(focus), [hasPickedEnergy, mood, focus]);

  useEffect(() => {
    const updateCompact = () => {
      if (typeof window === "undefined") return;
      const compact = window.matchMedia("(max-width: 640px)").matches || window.innerHeight < 760;
      setIsCompactMobile(compact);
    };
    updateCompact();
    window.addEventListener("resize", updateCompact);
    return () => window.removeEventListener("resize", updateCompact);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setEnergy(5);
    setHasPickedEnergy(true);
    setMood(null);
    setFocus(null);
    setNotes("");
    setNotesExpanded(!isEarlyPhase);
    setShowRequiredHint(false);
    setHasTrackedNotesUsage(false);
    setStep(1);
  }, [isOpen, isEarlyPhase]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const handleClose = (reason: "backdrop" | "close_button") => {
    if (!allowSkip) return;
    onClose(reason);
  };

  const handleSubmit = () => {
    if (!isComplete || !mood || !focus) {
      setShowRequiredHint(true);
      return;
    }
    onSubmit({ energy, mood, focus, notes: notes.trim() || undefined });
  };

  const handleNextStep = () => {
    if (!isComplete) {
      setShowRequiredHint(true);
      return;
    }
    setStep(2);
    window.setTimeout(() => {
      notesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const shouldShowNotesSection = !isCompactMobile || step === 2;
  const shouldShowCoreSection = !isCompactMobile || step === 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div
            className="absolute inset-0"
            style={{
              background: `${energyGradient(energy)}, radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(45, 212, 191, 0.06) 0%, transparent 45%), var(--space-void, #0a0a1a)`,
              transition: "background 0.8s ease"
            }}
            onClick={() => handleClose("backdrop")}
          />

          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ background: "rgba(255, 255, 255, 0.3)", top: `${15 + i * 14}%`, left: `${10 + (i * 17) % 80}%` }}
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              />
            ))}
          </div>

          <motion.div
            className="pulse-check-shell relative z-10 w-[calc(100%-0.9rem)] max-w-md h-[min(96dvh,740px)] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "rgba(15, 20, 50, 0.7)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "1.5rem"
            }}
          >
            <div className="pulse-check-header flex items-center justify-between p-3.5 sm:p-4">
              <motion.div custom={0} variants={cosmicUp} initial="hidden" animate="visible">
                <h2 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}>
                  ضبط البوصلة
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {isCompactMobile ? `خطوة ${step} من 2` : "النبض اللحظي قبل كل شيء"}
                </p>
              </motion.div>
              {allowSkip && (
                <button
                  type="button"
                  onClick={() => handleClose("close_button")}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{ color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  aria-label="تخطي اليوم"
                >
                  تخطي اليوم
                </button>
              )}
            </div>

            <div className="pulse-check-content flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 pb-28 sm:pb-24 scroll-pb-28">
              {shouldShowCoreSection && (
                <>
                  <motion.div className="pulse-check-section flex flex-col gap-2" custom={1} variants={cosmicUp} initial="hidden" animate="visible">
                    <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      مؤشر طاقتك <span style={{ color: "rgba(248, 113, 113, 0.95)" }}>*</span>
                    </label>
                    <div className="flex justify-center py-1.5">
                      <motion.div
                        className="pulse-check-energy-orb relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                        style={{
                          background: `radial-gradient(circle at 40% 35%, ${fillHex}40, ${fillHex}15 60%, transparent 80%)`,
                          boxShadow: `0 0 ${energy * 4}px ${fillHex}30, inset 0 0 20px ${fillHex}10`,
                          border: `1.5px solid ${fillHex}40`
                        }}
                        animate={{
                          scale: [1, 1 + energy * 0.008, 1],
                          boxShadow: [`0 0 ${energy * 3}px ${fillHex}20`, `0 0 ${energy * 6}px ${fillHex}40`, `0 0 ${energy * 3}px ${fillHex}20`]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <span className="text-base sm:text-lg font-bold" style={{ color: fillHex }}>
                          {energy}
                        </span>
                      </motion.div>
                    </div>
                    <div className="relative w-full py-2">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full" style={{ background: "rgba(255, 255, 255, 0.08)" }} />
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${fillHex}80, ${fillHex})`, boxShadow: `0 0 12px ${fillHex}40` }}
                      />
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={energy}
                        onChange={(e) => {
                          setEnergy(Number(e.target.value));
                          setHasPickedEnergy(true);
                          if (showRequiredHint) setShowRequiredHint(false);
                        }}
                        className="pulse-range relative w-full"
                        style={{ accentColor: fillHex, "--pulse-fill": fillHex } as CSSProperties}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>فاصل شحن</span>
                      <span className="font-semibold" style={{ color: fillHex }}>{energy}/10</span>
                      <span>فايق ومستعد</span>
                    </div>
                  </motion.div>

                  <motion.div className="pulse-check-section mt-3 flex flex-col gap-2" custom={2} variants={cosmicUp} initial="hidden" animate="visible">
                    <label className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                      الطقس الداخلي <span style={{ color: "rgba(248, 113, 113, 0.95)" }}>*</span>
                    </label>
                    <div className="pulse-check-mood-grid grid grid-cols-4 gap-2">
                      {MOODS.map((item) => {
                        const isSelected = mood === item.id;
                        const mStyle = MOOD_COSMIC[item.id];
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setMood(item.id);
                              if (showRequiredHint) setShowRequiredHint(false);
                            }}
                            className="inline-flex items-center justify-center gap-1 px-1.5 py-2 rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
                            style={{
                              background: isSelected ? mStyle.bg : "rgba(255, 255, 255, 0.05)",
                              border: `1px solid ${isSelected ? mStyle.border : "rgba(255, 255, 255, 0.08)"}`,
                              color: isSelected ? mStyle.text : "var(--text-secondary)",
                              boxShadow: isSelected ? mStyle.glow : "none"
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span>{item.emoji}</span>
                            <span className="truncate">{item.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  <motion.div className="pulse-check-section mt-3 flex flex-col gap-2" custom={3} variants={cosmicUp} initial="hidden" animate="visible">
                    <label className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                      التركيز الحالي <span style={{ color: "rgba(248, 113, 113, 0.95)" }}>*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FOCUS_OPTIONS.map((item) => {
                        const isSelected = focus === item.id;
                        const label = item.id === "none"
                          ? FOCUS_LABELS[isStartRecovery ? "none_new" : "none_returning"]
                          : FOCUS_LABELS[item.labelKey];
                        const fStyle = FOCUS_COSMIC[item.id];
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setFocus(item.id);
                              if (showRequiredHint) setShowRequiredHint(false);
                            }}
                            className="px-2 py-2 rounded-lg text-xs font-semibold transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
                            style={{
                              background: isSelected ? fStyle.bg : "rgba(255, 255, 255, 0.04)",
                              border: `1px solid ${isSelected ? fStyle.border : "rgba(255, 255, 255, 0.06)"}`,
                              color: isSelected ? fStyle.text : "var(--text-secondary)"
                            }}
                            whileTap={{ scale: 0.96 }}
                          >
                            {label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}

              {shouldShowNotesSection && (
                <motion.div className="pulse-check-section mt-4 flex flex-col gap-2" custom={4} variants={cosmicUp} initial="hidden" animate="visible">
                  {!notesExpanded ? (
                    <button
                      type="button"
                      onClick={() => setNotesExpanded(true)}
                      className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-right transition-colors"
                      style={{ color: "var(--text-secondary)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      إضافة ملاحظة (اختياري)
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          لو حابب تشرح أكتر
                        </label>
                        {isEarlyPhase && (
                          <button
                            type="button"
                            onClick={() => setNotesExpanded(false)}
                            className="text-xs font-semibold"
                            style={{ color: "var(--text-muted)" }}
                          >
                            إخفاء
                          </button>
                        )}
                      </div>
                      <textarea
                        ref={notesRef}
                        rows={isCompactMobile ? 4 : 3}
                        value={notes}
                        onFocus={(e) => {
                          window.setTimeout(() => {
                            e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 120);
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNotes(value);
                          if (!hasTrackedNotesUsage && value.trim().length > 0) {
                            recordFlowEvent("pulse_notes_used");
                            setHasTrackedNotesUsage(true);
                          }
                        }}
                        placeholder="اكتب جملة أو موقف: أنا مخنوق عشان حصل كذا..."
                        className="w-full rounded-lg px-2.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30 focus-visible:ring-offset-0 resize-y max-h-36 overflow-auto"
                        style={{
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "var(--text-primary)",
                          letterSpacing: "0.02em"
                        }}
                      />
                    </>
                  )}
                </motion.div>
              )}
            </div>

            <div
              className="absolute bottom-0 left-0 right-0 px-4 sm:px-5 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
              style={{ background: "linear-gradient(180deg, rgba(15,20,50,0) 0%, rgba(15,20,50,0.92) 35%)" }}
            >
              {!isComplete && !showRequiredHint && (
                <p className="text-xs mb-2 text-center" style={{ color: "var(--text-muted)" }}>
                  اختَر الطاقة والطقس الداخلي والتركيز الحالي أولاً.
                </p>
              )}
              {showRequiredHint && !isComplete && (
                <p className="text-xs mb-2 text-center" style={{ color: "rgba(248, 113, 113, 0.95)" }}>
                  مطلوب اختيار الطاقة والمزاج والتركيز قبل المتابعة.
                </p>
              )}

              <div className="flex items-center gap-2">
                {isCompactMobile && step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl px-3 py-2 text-sm font-semibold"
                    style={{ color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    رجوع
                  </button>
                )}
                <motion.button
                  type="button"
                  onClick={isCompactMobile && step === 1 ? handleNextStep : handleSubmit}
                  aria-disabled={!isComplete}
                  className={`w-full cta-primary py-2.5 text-sm font-semibold cosmic-shimmer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-0 ${isComplete ? "" : "opacity-80"}`}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isCompactMobile && step === 1 ? "التالي" : "احفظ حالتك"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
