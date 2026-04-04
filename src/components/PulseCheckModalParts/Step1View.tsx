import { motion } from "framer-motion";
import { Tag } from "lucide-react";

import type { PulseMood, PulseFocus } from "../../state/pulseState";
import { VoiceInput } from "../VoiceInput";
import { 
  MOODS, 
  MOOD_COSMIC, 
  FOCUS_OPTIONS, 
  FOCUS_LABELS, 
  FOCUS_COSMIC, 
  TOPIC_OPTIONS
} from "./constants";
import { EnergyGauge } from "./EnergyGauge";

interface Step1ViewProps {
  energy: number | null;
  setEnergyValue: (val: number, options?: { skipHaptic?: boolean }) => void;
  energyStateLabel: string;
  handleEnergyKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  mood: PulseMood | null;
  setMoodValue: (mood: PulseMood) => void;
  focus: PulseFocus | null;
  setFocusValue: (focus: PulseFocus) => void;
  isStartRecovery: boolean;
  topics: string[];
  setTopics: (updater: (prev: string[]) => string[]) => void;
  notes: string;
  setNotes: (notes: string | ((prev: string) => string)) => void;
  notesRef: React.RefObject<HTMLTextAreaElement>;
}

export function Step1View({
  energy,
  setEnergyValue,
  energyStateLabel,
  handleEnergyKeyUp,
  mood,
  setMoodValue,
  focus,
  setFocusValue,
  isStartRecovery: _isStartRecovery,
  topics,
  setTopics,
  notes,
  setNotes,
  notesRef
}: Step1ViewProps) {

  const cosmicUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } }
  };

  return (
    <motion.div 
      className="pulse-check-section flex flex-col gap-10 py-4" 
      custom={1} 
      variants={cosmicUp} 
      initial="hidden" 
      animate="visible"
    >
      {/* 1. Energy Level — Radial Compass */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-56 h-36 relative flex items-center justify-center">
          <EnergyGauge 
            energy={energy}
            isNeedleHovering={false}
            needleMouseAngle={0}
          />
          <motion.div
            key={energy}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute bottom-2 flex flex-col items-center"
          >
            <span className="text-3xl font-black font-mono tracking-tighter" style={{ color: "var(--text-primary)" }}>
              {energy !== null ? Math.round(energy) : "—"}
            </span>
          </motion.div>
        </div>

        <motion.p
          key={energyStateLabel}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-black mt-1 uppercase tracking-widest"
          style={{
            color: energy === null ? "#64748B"
              : energy <= 2 ? "#f87171"
              : energy <= 4 ? "#fbbf24"
              : energy <= 6 ? "#2dd4bf"
              : energy <= 8 ? "#34d399"
              : "#14b8a6"
          }}
        >
          {energyStateLabel}
        </motion.p>

        {/* Slider Track */}
        <div className="w-full max-w-xs px-2 pt-4 pb-2" dir="ltr">
          <div className="relative">
            <div 
              className="h-3 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: energy === null ? "transparent"
                    : energy <= 3 ? "linear-gradient(90deg, #ef4444, #f59e0b)"
                    : energy <= 6 ? "linear-gradient(90deg, #f59e0b, #2dd4bf)"
                    : "linear-gradient(90deg, #2dd4bf, #14b8a6)",
                  boxShadow: energy !== null && energy > 0
                    ? `0 0 16px ${energy <= 3 ? "rgba(239,68,68,0.3)" : energy <= 6 ? "rgba(251,191,36,0.25)" : "rgba(20,184,166,0.35)"}`
                    : "none",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${((energy ?? 0) / 10) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={energy ?? 0}
              onKeyUp={handleEnergyKeyUp}
              onChange={(e) => {
                const val = Number(e.target.value);
                setEnergyValue(val);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0 p-0"
              style={{ top: "-6px", height: "32px" }}
              tabIndex={0}
              aria-label="طاقتك دلوقتي"
            />

            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white z-[5] pointer-events-none"
              style={{
                background: energy === null ? "#475569"
                  : energy <= 3 ? "#f59e0b"
                  : energy <= 6 ? "#2dd4bf"
                  : "#14b8a6",
                boxShadow: `0 0 12px ${energy === null ? "transparent"
                  : energy <= 3 ? "rgba(245,158,11,0.5)"
                  : energy <= 6 ? "rgba(45,212,191,0.4)"
                  : "rgba(20,184,166,0.5)"}`,
              }}
              animate={{ left: `calc(${((energy ?? 0) / 10) * 100}% - 12px)` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <div className="flex justify-between mt-3 px-0.5">
            {[
              { val: 0, label: "واقع" },
              { val: 3, label: "هابط" },
              { val: 5, label: "مستقر" },
              { val: 8, label: "فايق" },
              { val: 10, label: "وحش" },
            ].map((anchor) => (
              <button
                key={anchor.val}
                type="button"
                onClick={() => setEnergyValue(anchor.val)}
                className="text-[9px] font-bold transition-all cursor-pointer px-1 py-0.5 rounded"
                style={{
                  color: energy !== null && Math.abs(energy - anchor.val) <= 1
                    ? "#fff"
                    : "rgba(148,163,184,0.5)",
                }}
              >
                {anchor.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Mood Picker */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          مودك إيه دلوقتي؟
        </label>
        <div className="grid grid-cols-4 gap-2.5 p-3 rounded-3xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          {MOODS.map((m) => {
            const isSelected = mood === m.id;
            const mStyle = MOOD_COSMIC[m.id];
            return (
              <button
                key={m.id} 
                type="button" 
                onClick={() => setMoodValue(m.id)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all"
                style={{ background: isSelected ? `${mStyle.text}22` : 'transparent' }}
              >
                <span className="text-2xl" style={{ filter: isSelected ? 'none' : 'grayscale(1) opacity(0.3)' }}>
                  {m.emoji}
                </span>
                <span className={`text-[9px] font-bold whitespace-nowrap ${isSelected ? 'opacity-100' : 'opacity-40'}`} style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Focus Picker */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          ناوي تركز على إيه؟
        </label>
        <div className="grid grid-cols-2 gap-3 pb-2">
          {FOCUS_OPTIONS.map((f) => {
            const isSelected = focus === f.id;
            const label = f.id === "none" ? FOCUS_LABELS["none_new"] : FOCUS_LABELS[f.labelKey];
            const fStyle = FOCUS_COSMIC[f.id];
            return (
              <button
                key={f.id} 
                type="button" 
                onClick={() => setFocusValue(f.id)}
                className="relative flex flex-col items-center justify-center p-4 rounded-2xl border text-[10px] font-black transition-all"
                style={{
                  background: isSelected ? `${fStyle.bg}44` : 'var(--glass-bg)',
                  borderColor: isSelected ? fStyle.border : 'var(--glass-border)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {isSelected && (
                  <motion.div 
                    layoutId="f-dot" 
                    className="absolute top-2 right-2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" 
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3.5. Topics */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          إيه اللي في دماغك؟ (اختياري)
        </label>
        <div className="flex flex-wrap gap-2 pb-2">
          {TOPIC_OPTIONS.map((t) => {
            const isSelected = topics.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTopics((prev) =>
                    isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                  );
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all"
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--glass-bg)',
                  borderColor: isSelected ? 'rgba(99, 102, 241, 0.4)' : 'var(--glass-border)',
                  color: isSelected ? '#818cf8' : 'var(--text-muted)',
                }}
              >
                <Tag className="w-3 h-3" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Notes */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            لو حبب تفتح قلبك وتفضفض
          </label>
          <VoiceInput 
            onTranscript={(text) => {
              setNotes(prev => prev ? `${prev} ${text}` : text);
            }}
          />
        </div>
        <textarea
          ref={notesRef} 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)}
          placeholder="اكتب اللي في بالك هنا.. فضفض براحتك."
          className="w-full h-24 p-4 rounded-2xl outline-none transition-all resize-none shadow-inner"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)"
          }}
        />
      </div>
    </motion.div>
  );
}
