import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Eye, Hand, ChevronLeft, X, Volume2, VolumeX } from "lucide-react";

/* ══════════════════════════════════════════
   GROUNDING TOOLKIT — أدوات تهدئة الجسم أولاً
   Body-first techniques: 5-4-3-2-1, box breathing,
   body scan, progressive muscle relaxation
   ══════════════════════════════════════════ */

type GroundingTechnique = "five_senses" | "box_breathing" | "body_scan" | "muscle_release";

interface TechniqueConfig {
  id: GroundingTechnique;
  title: string;
  subtitle: string;
  icon: FC<{ className?: string }>;
  color: string;
  bg: string;
  duration: string;
}

const TECHNIQUES: TechniqueConfig[] = [
  {
    id: "five_senses",
    title: "5-4-3-2-1",
    subtitle: "تقنية الحواس — ارجع للحاضر",
    icon: Eye,
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    duration: "دقيقتين",
  },
  {
    id: "box_breathing",
    title: "تنفس مربع",
    subtitle: "4-4-4-4 — هدّي الجهاز العصبي",
    icon: Wind,
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    duration: "دقيقة",
  },
  {
    id: "body_scan",
    title: "مسح الجسم",
    subtitle: "اسمع جسمك — فين التوتر؟",
    icon: Hand,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    duration: "3 دقايق",
  },
  {
    id: "muscle_release",
    title: "شد وإرخاء",
    subtitle: "اشد العضلة 5 ثواني — ثم اتركها",
    icon: Hand,
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    duration: "دقيقتين",
  },
];

/* ── 5-4-3-2-1 Grounding ── */
const FIVE_SENSES_STEPS = [
  { count: 5, sense: "👀 شوف", prompt: "5 حاجات تقدر تشوفها حواليك", color: "#38bdf8" },
  { count: 4, sense: "👂 اسمع", prompt: "4 أصوات تسمعها دلوقتي", color: "#a78bfa" },
  { count: 3, sense: "✋ حس", prompt: "3 حاجات تقدر تلمسها", color: "#34d399" },
  { count: 2, sense: "👃 اشم", prompt: "2 ريحة تقدر تشمها", color: "#fbbf24" },
  { count: 1, sense: "👅 دوق", prompt: "1 طعم تقدر تحسه", color: "#f87171" },
];

/* ── Box Breathing ── */
const BOX_PHASES = [
  { label: "شهيق", duration: 4000, scale: [0.8, 1.3] as [number, number] },
  { label: "ثبّت", duration: 4000, scale: [1.3, 1.3] as [number, number] },
  { label: "زفير", duration: 4000, scale: [1.3, 0.8] as [number, number] },
  { label: "ثبّت", duration: 4000, scale: [0.8, 0.8] as [number, number] },
];

/* ── Body Scan Steps ── */
const BODY_SCAN_STEPS = [
  { area: "🦶 القدمين", instruction: "ركّز في قدمك. حس بالأرض تحتك. اتركهم يرتاحوا." },
  { area: "🦵 الرجلين", instruction: "حس بالعضلات. لو فيه توتر — خليه يمشي مع الزفير." },
  { area: "🫃 البطن", instruction: "حط إيدك على بطنك. حس بالتنفس. ارخي عضلات البطن." },
  { area: "🫁 الصدر", instruction: "لاحظ حركة الصدر. الهواء بيدخل ويخرج. مش محتاج تتحكم." },
  { area: "💪 الكتف والرقبة", instruction: "نزّل كتفك لتحت. اللي متشد — اسمحله يرتاح." },
  { area: "🧠 الوجه والرأس", instruction: "ارخي الفك. ارخي الجبهة. الوجه ده مش محتاج يشيل حاجة." },
];

/* ── Muscle Release Steps ── */
const MUSCLE_STEPS = [
  { muscle: "الإيدين ✊", instruction: "اقبض إيدك بقوة 5 ثواني... ثم اتركها." },
  { muscle: "الكتف 💪", instruction: "ارفع كتفك لأذنك 5 ثواني... ثم نزّلهم بسرعة." },
  { muscle: "الوجه 😤", instruction: "اعصر وجهك كله 5 ثواني... ثم ارخيه خالص." },
  { muscle: "البطن 🫃", instruction: "اشد عضلات بطنك 5 ثواني... ثم اتركها ترتاح." },
  { muscle: "الرجلين 🦶", instruction: "اشد عضلات رجلك 5 ثواني... ثم خليها ترتاح." },
];

interface GroundingToolkitProps {
  onBack: () => void;
}

export const GroundingToolkit: FC<GroundingToolkitProps> = ({ onBack }) => {
  const [activeTechnique, setActiveTechnique] = useState<GroundingTechnique | null>(null);

  return (
    <motion.div
      className="min-h-screen pb-24"
      style={{ background: "var(--bg-primary, #0a0a1a)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      dir="rtl"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(10,10,26,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white/70" />
        </button>
        <div>
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            🫁 تقنيات تهدئة الجسم
          </h1>
          <p className="text-[11px] text-white/40">الجسم أولاً — ابدأ من هنا قبل ما تفكر</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Technique selection */}
        {!activeTechnique && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <p className="text-sm text-white/50 text-right">اختار تقنية التهدئة:</p>
            {TECHNIQUES.map((tech) => {
              const Icon = tech.icon;
              return (
                <motion.button
                  key={tech.id}
                  onClick={() => setActiveTechnique(tech.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-right transition-all"
                  style={{ background: tech.bg, border: `1px solid ${tech.color}20` }}
                  whileHover={{ scale: 1.01, borderColor: `${tech.color}50` }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${tech.color}20` }}>
                    <span style={{ color: tech.color }}><Icon className="w-6 h-6" /></span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{tech.title}</h3>
                    <p className="text-[11px] text-white/40">{tech.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: `${tech.color}15`, color: tech.color }}>
                    {tech.duration}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Active Technique Exercises */}
        <AnimatePresence mode="wait">
          {activeTechnique === "five_senses" && (
            <FiveSensesExercise onDone={() => setActiveTechnique(null)} />
          )}
          {activeTechnique === "box_breathing" && (
            <BoxBreathingExercise onDone={() => setActiveTechnique(null)} />
          )}
          {activeTechnique === "body_scan" && (
            <SteppedExercise
              title="مسح الجسم"
              steps={BODY_SCAN_STEPS.map((s) => ({ label: s.area, instruction: s.instruction }))}
              color="#a78bfa"
              onDone={() => setActiveTechnique(null)}
            />
          )}
          {activeTechnique === "muscle_release" && (
            <SteppedExercise
              title="شد وإرخاء"
              steps={MUSCLE_STEPS.map((s) => ({ label: s.muscle, instruction: s.instruction }))}
              color="#fb923c"
              onDone={() => setActiveTechnique(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ── 5-4-3-2-1 Exercise ── */
const FiveSensesExercise: FC<{ onDone: () => void }> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const current = FIVE_SENSES_STEPS[step];
  const isLast = step === FIVE_SENSES_STEPS.length - 1;

  return (
    <motion.div
      key="five_senses"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <button onClick={onDone} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
        <X className="w-3 h-3" /> إنهاء
      </button>

      {/* Progress */}
      <div className="flex gap-1.5">
        {FIVE_SENSES_STEPS.map((s, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{ background: i <= step ? s.color : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>

      {/* Current step */}
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <p className="text-6xl font-black mb-4" style={{ color: current.color }}>{current.count}</p>
        <p className="text-lg font-bold text-white mb-2">{current.sense}</p>
        <p className="text-sm text-white/50 max-w-xs mx-auto">{current.prompt}</p>
      </motion.div>

      <button
        onClick={() => isLast ? onDone() : setStep((s) => s + 1)}
        className="w-full py-3.5 rounded-2xl font-bold text-white transition-all"
        style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}90)` }}
      >
        {isLast ? "✓ خلصت — أنا أحسن" : "التالي →"}
      </button>
    </motion.div>
  );
};

/* ── Box Breathing Exercise ── */
const BoxBreathingExercise: FC<{ onDone: () => void }> = ({ onDone }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [muted, setMuted] = useState(false);
  const maxCycles = 4;
  const phase = BOX_PHASES[phaseIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIndex = (phaseIndex + 1) % BOX_PHASES.length;
      setPhaseIndex(nextIndex);
      if (nextIndex === 0) {
        setCycles((c) => c + 1);
      }
    }, phase.duration);
    return () => clearTimeout(timer);
  }, [phaseIndex, phase.duration]);

  useEffect(() => {
    if (cycles >= maxCycles) onDone();
  }, [cycles, onDone]);

  return (
    <motion.div
      key="box_breathing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center py-8 space-y-6"
    >
      <div className="flex items-center justify-between w-full">
        <button onClick={onDone} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
          <X className="w-3 h-3" /> إنهاء
        </button>
        <button onClick={() => setMuted(!muted)} className="p-2 rounded-full hover:bg-white/10">
          {muted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-white/40" />}
        </button>
      </div>

      {/* Cycle counter */}
      <p className="text-[10px] text-white/30 font-mono">{cycles + 1} / {maxCycles} دورة</p>

      {/* Breathing circle */}
      <motion.div
        className="w-40 h-40 rounded-full flex items-center justify-center"
        style={{ border: "3px solid rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.1)" }}
        animate={{ scale: phase.scale }}
        transition={{ duration: phase.duration / 1000, ease: "easeInOut" }}
      >
        <motion.p
          key={phaseIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-black text-emerald-300"
        >
          {phase.label}
        </motion.p>
      </motion.div>

      <p className="text-sm text-white/40">4 ثواني لكل خطوة</p>
    </motion.div>
  );
};

/* ── Generic Stepped Exercise (Body Scan / Muscle Release) ── */
const SteppedExercise: FC<{
  title: string;
  steps: { label: string; instruction: string }[];
  color: string;
  onDone: () => void;
}> = ({ title, steps, color, onDone }) => {
  const [step, setStep] = useState(0);
  const [autoTimer, setAutoTimer] = useState(true);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const advance = useCallback(() => {
    if (isLast) onDone();
    else setStep((s) => s + 1);
  }, [isLast, onDone]);

  useEffect(() => {
    if (!autoTimer) return;
    const t = setTimeout(advance, 8000);
    return () => clearTimeout(t);
  }, [step, autoTimer, advance]);

  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <button onClick={onDone} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
          <X className="w-3 h-3" /> إنهاء
        </button>
        <button
          onClick={() => setAutoTimer(!autoTimer)}
          className="text-[10px] text-white/30 underline"
        >
          {autoTimer ? "إيقاف التلقائي" : "تشغيل التلقائي"}
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
            style={{ background: i <= step ? color : "rgba(255,255,255,0.08)" }} />
        ))}
      </div>

      {/* Current step */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-10 space-y-4"
      >
        <p className="text-4xl">{current.label.split(" ")[0]}</p>
        <p className="text-lg font-bold text-white">{current.label}</p>
        <p className="text-sm text-white/50 max-w-xs mx-auto leading-relaxed">{current.instruction}</p>
      </motion.div>

      <button
        onClick={advance}
        className="w-full py-3.5 rounded-2xl font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}90)` }}
      >
        {isLast ? "✓ خلصت" : "التالي →"}
      </button>
    </motion.div>
  );
};
