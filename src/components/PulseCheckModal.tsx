import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { PulseFocus, PulseMood } from "../state/pulseState";
import { energyColorHex, energyPct } from "../utils/pulseUi";

interface PulseCheckModalProps {
  isOpen: boolean;
  context?: "regular" | "start_recovery";
  onSubmit: (payload: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean; notes?: string }) => void;
  onClose: () => void;
}

const MOODS: Array<{ id: PulseMood; label: string; emoji: string }> = [
  { id: "bright", label: "رايق", emoji: "☀️" },
  { id: "calm", label: "هادئ", emoji: "🌤️" },
  { id: "tense", label: "متوتر", emoji: "🌀" },
  { id: "hopeful", label: "متفائل", emoji: "🌈" },
  { id: "anxious", label: "قلقان", emoji: "☁️" },
  { id: "angry", label: "غضبان", emoji: "⛈️" },
  { id: "sad", label: "حزين", emoji: "🌧️" },
  { id: "overwhelmed", label: "إرهاق", emoji: "🌪️" }
];

const FOCUS_OPTIONS_BASE: Array<{ id: PulseFocus; labelKey: "event" | "thought" | "body" | "none_new" | "none_returning" }> = [
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

/* ── Cosmic Mood Colors ── */
const MOOD_COSMIC: Record<PulseMood, { bg: string; border: string; glow: string; text: string }> = {
  bright: {
    bg: "rgba(250, 204, 21, 0.15)",
    border: "rgba(250, 204, 21, 0.4)",
    glow: "0 0 20px rgba(250, 204, 21, 0.25)",
    text: "#facc15"
  },
  calm: {
    bg: "rgba(45, 212, 191, 0.15)",
    border: "rgba(45, 212, 191, 0.4)",
    glow: "0 0 20px rgba(45, 212, 191, 0.25)",
    text: "#2dd4bf"
  },
  anxious: {
    bg: "rgba(251, 191, 36, 0.15)",
    border: "rgba(251, 191, 36, 0.4)",
    glow: "0 0 20px rgba(251, 191, 36, 0.25)",
    text: "#fbbf24"
  },
  angry: {
    bg: "rgba(248, 113, 113, 0.15)",
    border: "rgba(248, 113, 113, 0.4)",
    glow: "0 0 20px rgba(248, 113, 113, 0.25)",
    text: "#f87171"
  },
  sad: {
    bg: "rgba(96, 165, 250, 0.15)",
    border: "rgba(96, 165, 250, 0.4)",
    glow: "0 0 20px rgba(96, 165, 250, 0.25)",
    text: "#60a5fa"
  },
  tense: {
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
    glow: "0 0 20px rgba(245, 158, 11, 0.25)",
    text: "#f59e0b"
  },
  hopeful: {
    bg: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.4)",
    glow: "0 0 20px rgba(34, 197, 94, 0.25)",
    text: "#22c55e"
  },
  overwhelmed: {
    bg: "rgba(139, 92, 246, 0.15)",
    border: "rgba(139, 92, 246, 0.4)",
    glow: "0 0 20px rgba(139, 92, 246, 0.25)",
    text: "#8b5cf6"
  }
};

const FOCUS_COSMIC: Record<PulseFocus, { bg: string; border: string; text: string }> = {
  event: { bg: "rgba(45, 212, 191, 0.12)", border: "rgba(45, 212, 191, 0.3)", text: "#2dd4bf" },
  thought: { bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.3)", text: "#a78bfa" },
  body: { bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.3)", text: "#f87171" },
  none: { bg: "rgba(45, 212, 191, 0.08)", border: "rgba(45, 212, 191, 0.2)", text: "#2dd4bf" }
};

/* ── Energy → Background Gradient (ambient color shift) ── */
function energyGradient(energy: number): string {
  if (energy <= 2) return "radial-gradient(ellipse at 50% 60%, rgba(248, 113, 113, 0.12) 0%, transparent 60%)";
  if (energy <= 4) return "radial-gradient(ellipse at 50% 60%, rgba(251, 191, 36, 0.1) 0%, transparent 60%)";
  if (energy <= 6) return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.08) 0%, transparent 55%)";
  if (energy <= 8) return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.12) 0%, transparent 55%)";
  return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.18) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 65%)";
}

/* ── Cosmic Fade Animation ── */
const cosmicUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

export const PulseCheckModal: FC<PulseCheckModalProps> = ({
  isOpen,
  context = "regular",
  onSubmit,
  onClose
}) => {
  const isStartRecovery = context === "start_recovery";
  const [energy, setEnergy] = useState(5);
  const [selectedMoods, setSelectedMoods] = useState<PulseMood[]>(["calm"]);
  const [focus, setFocus] = useState<PulseFocus>("none");
  const [notes, setNotes] = useState("");
  const fillHex = energyColorHex(energy);
  const pct = energyPct(energy, { min: 1, max: 10 });

  const primaryMood: PulseMood = useMemo(() => {
    if (!selectedMoods.length) return "calm";
    const priority: PulseMood[] = ["overwhelmed", "angry", "tense", "anxious", "sad", "calm", "bright", "hopeful"];
    const copy = [...selectedMoods];
    copy.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));
    return copy[0] ?? "calm";
  }, [selectedMoods]);

  useEffect(() => {
    if (!isOpen) return;
    setEnergy(5);
    setSelectedMoods(["calm"]);
    setFocus("none");
    setNotes("");
  }, [isOpen]);

  // إيقاف أي سكرول في الخلفية أثناء فتح شاشة البوصلة
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit({ energy, mood: primaryMood, focus, notes: notes.trim() || undefined });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* ── Full-screen cosmic backdrop — reacts to energy ── */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                ${energyGradient(energy)},
                radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 70%, rgba(45, 212, 191, 0.06) 0%, transparent 45%),
                var(--space-void, #0a0a1a)
              `,
              transition: "background 0.8s ease"
            }}
            onClick={onClose}
          />

          {/* ── Floating star particles ── */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: "rgba(255, 255, 255, 0.3)",
                  top: `${15 + i * 14}%`,
                  left: `${10 + (i * 17) % 80}%`
                }}
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4
                }}
              />
            ))}
          </div>

          {/* ── Glass Card Content ── */}
          <motion.div
            className="relative z-10 w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "rgba(15, 20, 50, 0.7)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "1.5rem",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between p-4">
              <motion.div custom={0} variants={cosmicUp} initial="hidden" animate="visible">
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}
                >
                  ضبط البوصلة
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  النبض اللحظي قبل كل شيء
                </p>
              </motion.div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.05)" }}
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Content ── */}
            <div className="px-5 pb-4 space-y-4">

              {/* ── Energy Slider — The Emotional Compass Core ── */}
              <motion.div className="space-y-2" custom={1} variants={cosmicUp} initial="hidden" animate="visible">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  مؤشر طاقتك
                </label>

                {/* Cosmic energy orb — breathing visualization */}
                <div className="flex justify-center py-2">
                  <motion.div
                    className="relative w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at 40% 35%, ${fillHex}40, ${fillHex}15 60%, transparent 80%)`,
                      boxShadow: `0 0 ${energy * 4}px ${fillHex}30, inset 0 0 20px ${fillHex}10`,
                      border: `1.5px solid ${fillHex}40`
                    }}
                    animate={{
                      scale: [1, 1 + energy * 0.008, 1],
                      boxShadow: [
                        `0 0 ${energy * 3}px ${fillHex}20`,
                        `0 0 ${energy * 6}px ${fillHex}40`,
                        `0 0 ${energy * 3}px ${fillHex}20`
                      ]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                    <span className="text-xl font-bold" style={{ color: fillHex }}>
                      {energy}
                    </span>
                  </motion.div>
                </div>

                {/* Slider track */}
                <div className="relative w-full py-2">
                  <div
                    className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full"
                    style={{ background: "rgba(255, 255, 255, 0.08)" }}
                  />
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${fillHex}80, ${fillHex})`,
                      boxShadow: `0 0 12px ${fillHex}40`
                    }}
                  />
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="pulse-range relative w-full"
                    style={{ accentColor: fillHex, "--pulse-fill": fillHex } as React.CSSProperties}
                  />
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>فاصل شحن</span>
                  <span className="font-semibold" style={{ color: fillHex }}>{energy}/10</span>
                  <span>فايق ومستعد</span>
                </div>
              </motion.div>

              {/* ── Mood — Inner Weather ── */}
              <motion.div className="space-y-2" custom={2} variants={cosmicUp} initial="hidden" animate="visible">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  الطقس الداخلي
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((item) => {
                    const isSelected = selectedMoods.includes(item.id);
                    const mStyle = MOOD_COSMIC[item.id];
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSelectedMoods((prev) => {
                            const exists = prev.includes(item.id);
                            if (exists) {
                              const next = prev.filter((m) => m !== item.id);
                              return next.length ? next : ["calm"];
                            }
                            return [...prev, item.id];
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold min-w-[112px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
                        style={{
                          background: isSelected ? mStyle.bg : "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${isSelected ? mStyle.border : "rgba(255, 255, 255, 0.08)"}`,
                          color: isSelected ? mStyle.text : "var(--text-secondary)",
                          boxShadow: isSelected ? mStyle.glow : "none"
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-base">{item.emoji}</span>
                        {item.label}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* ── Focus — Current Anchor ── */}
              <motion.div className="space-y-2" custom={3} variants={cosmicUp} initial="hidden" animate="visible">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  التركيز الحالي
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_OPTIONS_BASE.map((item) => {
                    const isSelected = focus === item.id;
                    const label = item.id === "none"
                      ? FOCUS_LABELS[isStartRecovery ? "none_new" : "none_returning"]
                      : FOCUS_LABELS[item.labelKey];
                    const fStyle = FOCUS_COSMIC[item.id];
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => setFocus(item.id)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
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

              {/* ── Notes — Optional Depth ── */}
              <motion.div className="space-y-1.5" custom={4} variants={cosmicUp} initial="hidden" animate="visible">
                <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  لو حابب تشرح أكتر
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب جملة أو موقف: أنا مخنوق عشان حصل كذا..."
                  className="w-full rounded-xl px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30 focus-visible:ring-offset-0 resize-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "var(--text-primary)",
                    letterSpacing: "0.02em"
                  }}
                />
              </motion.div>

              {/* ── Submit — Cosmic CTA ── */}
              <motion.div custom={5} variants={cosmicUp} initial="hidden" animate="visible">
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full cta-primary py-3 text-sm font-semibold cosmic-shimmer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-0"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isStartRecovery ? "احفظ القراية وادخل" : "جاهز"}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
