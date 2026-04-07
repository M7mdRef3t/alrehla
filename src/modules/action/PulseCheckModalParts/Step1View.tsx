import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Tag } from "lucide-react";

import type { PulseMood, PulseFocus } from "@/state/pulseState";
import { VoiceInput } from '@/modules/meta/VoiceInput';
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

  const showMood = energy !== null;
  const showFocusAndBeyond = showMood && mood !== null;

  const revealVariants: Variants = {
    hidden: { opacity: 0, height: 0, overflow: "hidden", marginTop: 0 },
    visible: { opacity: 1, height: "auto", overflow: "visible", marginTop: 12, transition: { duration: 0.4 } },
    exit: { opacity: 0, height: 0, overflow: "hidden", marginTop: 0, transition: { duration: 0.3 } }
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
        <div className="w-56 h-40 relative flex items-center justify-center">
          <EnergyGauge 
            energy={energy}
            isNeedleHovering={false}
            needleMouseAngle={0}
          />
          <motion.div
            key={energy}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute bottom-4 flex flex-col items-center"
          >
            <span className="text-4xl font-black font-mono tracking-tighter" style={{ color: "var(--ds-color-primary)", textShadow: "0 0 20px rgba(45, 212, 191, 0.3)" }}>
              {energy !== null ? Math.round(energy) : "—"}
            </span>
          </motion.div>
        </div>

        <motion.p
          key={energyStateLabel}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[10px] font-black mt-2 uppercase tracking-[0.3em] transition-colors px-3 py-1 rounded-full"
          style={{
            background: "rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.05)",
            color: energy === null ? "var(--ds-color-muted)"
              : energy <= 2 ? "rgba(248, 113, 113, 0.9)"
              : energy <= 4 ? "rgba(245, 158, 11, 0.9)"
              : energy <= 6 ? "rgba(45, 212, 191, 0.9)"
              : energy <= 8 ? "rgba(52, 211, 153, 0.9)"
              : "rgba(20, 184, 166, 0.9)"
          }}
        >
          {energyStateLabel}
        </motion.p>

        {/* Slider Track — Professional Instrument Feel */}
        <div className="w-full max-w-xs px-2 pt-6 pb-2" dir="ltr">
          <div className="relative">
            <div className="h-1.5 rounded-full overflow-hidden bg-white/5 border border-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: energy === null ? "transparent"
                    : energy <= 3 ? "linear-gradient(90deg, #f87171, #fbbf24)"
                    : energy <= 6 ? "linear-gradient(90deg, #fbbf24, #2dd4bf)"
                    : "linear-gradient(90deg, #2dd4bf, #10b981)",
                  boxShadow: energy !== null && energy > 0
                    ? `0 0 20px ${energy <= 3 ? "rgba(248,113,113,0.3)" : energy <= 6 ? "rgba(251,191,36,0.25)" : "rgba(16,185,129,0.3)"}`
                    : "none",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${((energy ?? 0) / 10) * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>

            <input
              id="energy-slider"
              name="energyLevel"
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
              style={{ top: "-10px", height: "32px" }}
              tabIndex={0}
              aria-label="طاقتك دلوقتي"
            />

            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/30 z-[5] pointer-events-none"
              style={{
                background: "#fff",
                boxShadow: "0 0 15px rgba(255,255,255,0.5)"
              }}
              animate={{ left: `calc(${((energy ?? 0) / 10) * 100}% - 8px)` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <div className="flex justify-between mt-4 px-1">
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
                className="text-[10px] font-black transition-all cursor-pointer px-1 py-0.5 rounded opacity-40 hover:opacity-100"
                style={{
                  color: energy !== null && Math.abs(energy - anchor.val) <= 1
                    ? "var(--ds-color-primary)"
                    : "var(--ds-color-muted)",
                  transform: energy !== null && Math.abs(energy - anchor.val) <= 1 ? "scale(1.1)" : "scale(1)"
                }}
              >
                {anchor.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Mood Picker — Sovereign Selection */}
      <AnimatePresence>
        {showMood && (
          <motion.div 
            variants={revealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-4"
          >
            <label className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              مودك إيه دلوقتي؟
            </label>
            <div className="grid grid-cols-4 gap-2.5 p-3.5 rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-md">
              {MOODS.map((m) => {
                const isSelected = mood === m.id;
                const mStyle = MOOD_COSMIC[m.id];
                return (
                  <button
                    key={m.id} 
                    type="button" 
                    onClick={() => setMoodValue(m.id)}
                    className="flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all relative overflow-hidden group"
                    style={{ 
                      background: isSelected ? `${mStyle.text}22` : 'transparent',
                      boxShadow: isSelected ? `inset 0 0 20px ${mStyle.text}11` : 'none'
                    }}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="mood-active-glow"
                        className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                      />
                    )}
                    <span className="text-3xl transition-transform duration-300 group-hover:scale-110" style={{ filter: isSelected ? 'drop-shadow(0 0 15px rgba(255,255,255,0.2))' : 'grayscale(1) opacity(0.2)' }}>
                      {m.emoji}
                    </span>
                    <span className={`text-[10px] font-black tracking-tight transition-all ${isSelected ? 'opacity-100' : 'opacity-30'}`} style={{ color: isSelected ? '#fff' : 'var(--ds-color-secondary)' }}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Focus Picker & 4. Notes */}
      <AnimatePresence>
        {showFocusAndBeyond && (
          <motion.div
            variants={revealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-10"
          >
            {/* 3. Focus Picker */}
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                ناوي تركز على إيه؟
              </label>
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {FOCUS_OPTIONS.map((f) => {
                  const isSelected = focus === f.id;
                  const label = f.id === "none" ? FOCUS_LABELS["none_new"] : FOCUS_LABELS[f.labelKey];
                  const fStyle = FOCUS_COSMIC[f.id];
                  return (
                    <button
                      key={f.id} 
                      type="button" 
                      onClick={() => setFocusValue(f.id)}
                      className="relative flex flex-col items-center justify-center py-5 px-4 rounded-2xl border text-[10px] font-black tracking-widest uppercase transition-all overflow-hidden"
                      style={{
                        background: isSelected ? `${fStyle.bg}33` : 'rgba(255,255,255,0.02)',
                        borderColor: isSelected ? fStyle.border : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#fff' : 'var(--ds-color-muted)',
                        boxShadow: isSelected ? `0 8px 32px ${fStyle.bg}22, inset 0 0 20px ${fStyle.bg}11` : 'none'
                      }}
                    >
                      {isSelected && (
                        <motion.div 
                          layoutId="focus-active-indicator" 
                          className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" 
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3.5. Topics */}
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                إيه اللي في دماغك؟ (اختياري)
              </label>
              <div className="flex flex-wrap gap-2.5">
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
                      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-[11px] font-bold transition-all"
                      style={{
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                        borderColor: isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#818cf8' : 'var(--ds-color-muted)',
                      }}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Notes */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40">
                  لو حابب تفتح قلبك وتفضفض
                </label>
                <div className="scale-90 origin-right">
                  <VoiceInput 
                    onTranscript={(text) => {
                      setNotes(prev => prev ? `${prev} ${text}` : text);
                    }}
                  />
                </div>
              </div>
              <textarea
                id="pulse-notes"
                name="pulseNotes"
                ref={notesRef} 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="اكتب اللي في بالك هنا.. فضفض براحتك."
                className="w-full h-32 p-5 rounded-[2rem] outline-none transition-all resize-none bg-black/20 border border-white/5 text-white placeholder:text-white/20 focus:border-teal-500/30 focus:bg-black/30"
                style={{
                  fontFamily: "var(--font-sans)",
                  boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)"
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
