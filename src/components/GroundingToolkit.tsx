/* eslint-disable */
import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Eye, Hand, ChevronLeft, X, Volume2, VolumeX, Activity, Brain } from "lucide-react";

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
  colorClass: { text: string, bg: string, border: string, glow: string };
  duration: string;
}

const TECHNIQUES: TechniqueConfig[] = [
  {
    id: "five_senses",
    title: "5-4-3-2-1",
    subtitle: "تقنية الحواس — إعادة الاتصال الميداني",
    icon: Eye,
    colorClass: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(56,189,248,0.3)] shadow-[inset_0_0_15px_rgba(56,189,248,0.1)]" },
    duration: "دقيقتين",
  },
  {
    id: "box_breathing",
    title: "التنفس المربع",
    subtitle: "4-4-4-4 — تبريد مسارات الجهاز العصبي",
    icon: Wind,
    colorClass: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]" },
    duration: "دقيقة",
  },
  {
    id: "body_scan",
    title: "مسح الجسم التكتيكي",
    subtitle: "الرصد الداخلي — استكشاف نقاط التوتر",
    icon: Activity,
    colorClass: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)] shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]" },
    duration: "3 دقائق",
  },
  {
    id: "muscle_release",
    title: "استرخاء الشد والطرد",
    subtitle: "تفعيل التوتر الموجه ثم تفريغه",
    icon: Brain,
    colorClass: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)] shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]" },
    duration: "دقيقتين",
  },
];

/* ── 5-4-3-2-1 Grounding ── */
const FIVE_SENSES_STEPS = [
  { count: 5, sense: "رصد بصري", prompt: "حدد 5 أهداف مرئية محيطة بك", colorClass: "bg-sky-500", textClass: "text-sky-400" },
  { count: 4, sense: "رصد سمعي", prompt: "عزل 4 إشارات صوتية في الخلفية", colorClass: "bg-violet-500", textClass: "text-violet-400" },
  { count: 3, sense: "رصد حسي", prompt: "التقط 3 تركيبات ملموسة بأسطح مختلفة", colorClass: "bg-emerald-500", textClass: "text-emerald-400" },
  { count: 2, sense: "رصد شمّي", prompt: "استنتج رائحتين في بيئتك الحالية", colorClass: "bg-amber-500", textClass: "text-amber-400" },
  { count: 1, sense: "رصد ذوقي", prompt: "انتبه لطعم واحد أو إحساس في فمك", colorClass: "bg-rose-500", textClass: "text-rose-400" },
];

/* ── Box Breathing ── */
const BOX_PHASES = [
  { label: "شهيق", duration: 4000, scale: [0.8, 1.3] as [number, number] },
  { label: "ثبات", duration: 4000, scale: [1.3, 1.3] as [number, number] },
  { label: "زفير", duration: 4000, scale: [1.3, 0.8] as [number, number] },
  { label: "تفريغ", duration: 4000, scale: [0.8, 0.8] as [number, number] },
];

/* ── Body Scan Steps ── */
const BODY_SCAN_STEPS = [
  { area: "القاعدة الأرضية", instruction: "توجيه الانتباه لنقاط التلامس. اشعر بقوة الجاذبية تدعمك. حرر أي مقاومة سفلية." },
  { area: "الجذع السفلي", instruction: "تحقق من العضلات. في حالة رصد انقباض غير مبرر مسحراً، افرغه مع تدفق الزفير." },
  { area: "المركز (البطن)", instruction: "تمركز عند مركز التنفس. راقب التمدد الطبيعي. أعطِ البطن تصريحاً بالاسترخاء المطلق." },
  { area: "منطقة الصدر", instruction: "راقب الإيقاع بلا تحكم. دع الهواء يتولى العملية التلقائية في الدخول والخروج." },
  { area: "الأكتاف والمحور", instruction: "حرر الحمولة. اسمح لمنظومة الأكتاف بالنزول. التوتر المتراكم لا لزوم له الآن." },
  { area: "قمرة القيادة (الرأس)", instruction: "إرخاء الفك والجبهة. قم بتحرير مركز المعالجة البصرية. الوجوه لا تحتاج إلى شد." },
];

/* ── Muscle Release Steps ── */
const MUSCLE_STEPS = [
  { muscle: "الأطراف العلوية", instruction: "قم بضغط قبضتيك للدرجة القصوى لـ 5 ثواني... ثم أطلق السراح تماماً." },
  { muscle: "محور الرفع الأكتاف", instruction: "ارفعها كأنها تحمي رأسك لـ 5 ثواني... ثم أسقط الحمولة فجأة." },
  { muscle: "عضلات الوجه", instruction: "قم بإحكام كل شيء حول عينيك وفمك لـ 5 ثواني... ثم حولها لوجه مسترخٍ جداً." },
  { muscle: "مركز الجسد البطن", instruction: "قم بالانقباض وامتصاص الهواء للداخل لـ 5 ثواني... ثم اسمح بالتفريغ الكامل." },
  { muscle: "القاعدة السفلية", instruction: "أحكم عضلات السيقان وثبتها لـ 5 ثواني... ثم اتركها تنطفئ وتسترخي." },
];

interface GroundingToolkitProps {
  onBack: () => void;
}

export const GroundingToolkit: FC<GroundingToolkitProps> = ({ onBack }) => {
  const [activeTechnique, setActiveTechnique] = useState<GroundingTechnique | null>(null);

  return (
    <motion.div
      className="min-h-screen pb-24 bg-slate-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      dir="rtl"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors w-10 h-10 flex items-center justify-center bg-white/5">
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <Wind className="w-5 h-5 text-sky-400" />
              أدوات التهدئة الأرضية
            </h1>
            <p className="text-[11px] text-sky-300/50 font-medium mt-0.5">السيطرة الجسدية أولاً</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

        {/* Technique selection */}
        {!activeTechnique && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <p className="text-sm text-white/40 font-bold text-right uppercase tracking-wider">حدد بروتوكول التدخل:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TECHNIQUES.map((tech) => {
                const Icon = tech.icon;
                const { bg, text, border, glow } = tech.colorClass;
                return (
                  <motion.button
                    key={tech.id}
                    onClick={() => setActiveTechnique(tech.id)}
                    className={`flex items-start gap-4 p-5 rounded-2xl text-right transition-all border block relative overflow-hidden group ${bg} ${border} ${glow}`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${border} bg-black/20 shadow-inner group-hover:scale-110 transition-transform relative z-10`}>
                      <Icon className={`w-7 h-7 ${text}`} />
                    </div>
                    <div className="flex-1 relative z-10">
                      <h3 className="text-base font-black text-white mb-1 leading-tight">{tech.title}</h3>
                      <p className="text-[11px] font-medium text-white/50 leading-relaxed mb-3">{tech.subtitle}</p>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${border} ${bg} ${text} inline-block`}>
                        زمن التنفيذ: {tech.duration}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            <div className="mt-8 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <p className="text-[12px] text-white/50 leading-relaxed">
                الجسد المذعور لا يستطيع اتخاذ قرارات تكتيكية.<br/> 
                <span className="font-bold text-white/80">استخدم هذه الأدوات لإعادة تشغيل النظام العصبي بمنطقية.</span>
              </p>
            </div>
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
              title="مسح الجسم التكتيكي"
              steps={BODY_SCAN_STEPS.map((s) => ({ label: s.area, instruction: s.instruction }))}
              colorClass="bg-violet-500"
              glowColor="139,92,246"
              onDone={() => setActiveTechnique(null)}
            />
          )}
          {activeTechnique === "muscle_release" && (
            <SteppedExercise
              title="استرخاء الشد والطرد"
              steps={MUSCLE_STEPS.map((s) => ({ label: s.muscle, instruction: s.instruction }))}
              colorClass="bg-amber-500"
              glowColor="245,158,11"
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 bg-slate-900 border border-sky-500/20 p-6 rounded-[2rem] shadow-[0_0_40px_-10px_rgba(56,189,248,0.15)] relative overflow-hidden text-center"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10 w-full mb-4 outline-none">
        <button onClick={onDone} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> إحباط المعالجة
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-2 relative z-10 w-full mb-8">
        {FIVE_SENSES_STEPS.map((s, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-500 ${i <= step ? s.colorClass : 'bg-white/10'} ${i === step ? 'animate-pulse shadow-[0_0_10px_currentColor]' : ''}`} />
        ))}
      </div>

      {/* Current step */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 relative z-10"
      >
        <p className={`text-[8rem] font-black mb-2 leading-none drop-shadow-lg ${current.textClass}`}>{current.count}</p>
        <p className="text-2xl font-black text-white mb-3 tracking-wide">{current.sense}</p>
        <p className="text-sm font-medium text-white/60 max-w-sm mx-auto leading-relaxed">{current.prompt}</p>
      </motion.div>

      <button
        onClick={() => isLast ? onDone() : setStep((s) => s + 1)}
        className={`w-full py-4 rounded-2xl font-black text-white text-lg transition-all relative z-10 shadow-lg ${current.colorClass}`}
        style={{ backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0))" }}
      >
        {isLast ? "✓ تم إعادة التهيئة — جاهز" : "التالي"}
      </button>
    </motion.div>
  );
};

/* ── Box Breathing Exercise ── */
const BoxBreathingExercise: FC<{ onDone: () => void }> = ({ onDone }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const maxCycles = 4;
  const phase = BOX_PHASES[phaseIndex];

  // Start only when user triggers (optional, or immediate)
  useEffect(() => {
    setIsRunning(true);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setTimeout(() => {
      const nextIndex = (phaseIndex + 1) % BOX_PHASES.length;
      setPhaseIndex(nextIndex);
      if (nextIndex === 0) {
        setCycles((c) => c + 1);
      }
    }, phase.duration);
    return () => clearTimeout(timer);
  }, [phaseIndex, phase.duration, isRunning]);

  useEffect(() => {
    if (cycles >= maxCycles) {
      setTimeout(() => onDone(), 1000);
    }
  }, [cycles, onDone]);

  const progressPct = ((cycles * 4 + phaseIndex) / (maxCycles * 4)) * 100;

  return (
    <motion.div
      key="box_breathing"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center py-6 px-4 space-y-8 bg-slate-900 border border-emerald-500/20 rounded-[2rem] shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] relative overflow-hidden"
    >
       <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between w-full relative z-10">
        <button onClick={onDone} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> مغادرة المحطة
        </button>
        <button onClick={() => setMuted(!muted)} className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          {muted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      <div className="w-full relative z-10 px-8">
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-emerald-500/20">
          <div className="h-full bg-emerald-500 transition-all duration-[4000ms] ease-linear" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-[10px] text-emerald-400/50 font-bold tracking-widest mt-2 uppercase text-center">{cycles} / {maxCycles} دورة مكتملة</p>
      </div>

      {/* Breathing circle */}
      <div className="relative w-64 h-64 flex items-center justify-center z-10 my-8">
         <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500/10 border-2 border-emerald-400"
            style={{ boxShadow: "0 0 40px rgba(52,211,153,0.3)" }}
            animate={{ scale: phase.scale }}
            transition={{ duration: phase.duration / 1000, ease: "easeInOut" }}
         />
         <motion.div
           key={phaseIndex + '-' + cycles}
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative z-10 text-center"
         >
           <p className="text-4xl font-black text-emerald-300 drop-shadow-lg tracking-wider">
             {phase.label}
           </p>
         </motion.div>
      </div>

      <p className="text-xs font-bold text-emerald-200/40 uppercase tracking-widest relative z-10 border border-emerald-500/20 px-4 py-2 rounded-full bg-black/20">
        عملية التنظيم العصبي جارية
      </p>
    </motion.div>
  );
};

/* ── Generic Stepped Exercise (Body Scan / Muscle Release) ── */
const SteppedExercise: FC<{
  title: string;
  steps: { label: string; instruction: string }[];
  colorClass: string;
  glowColor: string; // RGB format for shadow
  onDone: () => void;
}> = ({ title, steps, colorClass, glowColor, onDone }) => {
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`space-y-6 bg-slate-900 border p-6 rounded-[2rem] relative overflow-hidden shadow-[0_0_40px_-10px_rgba(${glowColor},0.15)]`}
      style={{ borderColor: `rgba(${glowColor},0.2)` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom right, rgba(${glowColor}, 0.05), transparent)` }} />

      <div className="flex items-center justify-between relative z-10">
        <button onClick={onDone} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/50 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> مغادرة مسار المسح
        </button>
        <button
          onClick={() => setAutoTimer(!autoTimer)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${autoTimer ? `bg-[rgba(${glowColor},0.1)] border-[rgba(${glowColor},0.3)] text-[rgb(${glowColor})]` : 'bg-white/5 border-white/10 text-white/40'}`}
        >
          {autoTimer ? "الطيار الآلي: مفعل" : "الطيار الآلي: متوقف"}
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 relative z-10 py-4">
        {steps.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? colorClass : 'bg-white/10'} ${i === step ? 'animate-pulse' : ''}`} style={{ filter: i === step ? `drop-shadow(0 0 5px rgba(${glowColor},0.5))` : 'none' }} />
        ))}
      </div>

      {/* Current step */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-10 space-y-4 relative z-10"
      >
        <h2 className="text-2xl font-black text-white">{current.label}</h2>
        <p className="text-sm font-medium text-white/60 max-w-sm mx-auto leading-relaxed px-4 py-3 bg-black/20 rounded-xl border border-white/5">{current.instruction}</p>
      </motion.div>

      <button
        onClick={advance}
        className={`w-full py-4 rounded-2xl font-black text-white text-lg transition-all relative z-10 shadow-lg ${colorClass}`}
        style={{ backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0))" }}
      >
        {isLast ? "✓ تم الفحص — جاهز للعودة" : "التالي"}
      </button>
    </motion.div>
  );
};
