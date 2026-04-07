"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Check, ChevronLeft, Zap } from 'lucide-react';

interface ChatInterfaceProps {
    onAnalyze: (answers: string[]) => void;
    isLoading: boolean;
}

// ── Step 0: What drains you (multi-select, max 3) ──
const DRAIN_CATEGORIES = [
    { id: 'work',      emoji: '💼', label: 'الشغل والأداء',       desc: 'ضغوط، توقعات، إنتاجية' },
    { id: 'relations', emoji: '👥', label: 'العلاقات',            desc: 'ناس بتستنزفك أو علاقات صعبة' },
    { id: 'money',     emoji: '💰', label: 'الفلوس والمستقبل',    desc: 'قلق مالي، أهداف ما اتحققتش' },
    { id: 'ambition',  emoji: '🎯', label: 'طموح ماشيش',          desc: 'أفكار كبيرة وما نفذتهاش' },
    { id: 'health',    emoji: '😴', label: 'الصحة والطاقة',       desc: 'إرهاق، نوم، مزاج متقلب' },
    { id: 'home',      emoji: '🏠', label: 'البيت والأسرة',       desc: 'مسؤوليات، توقعات أهل' },
];

// ── Step 1: Drain level (1-10, auto-advance) ──
const DRAIN_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ── Step 2: What are you avoiding ──
const AVOIDANCE_OPTIONS = [
    { id: 'conversation', emoji: '💬', label: 'محادثة صعبة لازم تعملها' },
    { id: 'decision',     emoji: '⚡', label: 'قرار مهم بتأجله' },
    { id: 'habit',        emoji: '🔄', label: 'عادة سيئة مش قادر تبطلها' },
    { id: 'project',      emoji: '📋', label: 'مشروع أو هدف متأخر' },
    { id: 'change',       emoji: '🌊', label: 'تغيير جذري خايف منه' },
    { id: 'unknown',      emoji: '🤔', label: 'مش عارف — وده اللي بيقلقني' },
];

const QUESTIONS = [
    "اللي بيشغل تفكيرك أكتر؟",
    "من 1 لـ 10، كام بتحس إنك مستنزف؟",
    "الحاجة اللي بتتجنبها وتعرف إنك لازم تعملها؟",
];

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit:  (dir: number) => ({ x: dir < 0 ? 50 : -50, opacity: 0, scale: 0.97 }),
};

export default function ChatInterface({ onAnalyze, isLoading }: ChatInterfaceProps) {
    const [step, setStep]           = useState(0);
    const [direction, setDirection] = useState(1);
    const [categories, setCategories]   = useState<string[]>([]);
    const [drainLevel, setDrainLevel]   = useState<number | null>(null);
    const [avoidance, setAvoidance]     = useState<string | null>(null);

    // ── Navigation ──
    const goNext = () => {
        if (step < 2) { setDirection(1); setStep(s => s + 1); }
        else {
            const catLabels  = categories.map(id => DRAIN_CATEGORIES.find(c => c.id === id)?.label ?? id).join('، ');
            const avoidLabel = AVOIDANCE_OPTIONS.find(o => o.id === avoidance)?.label ?? '';
            onAnalyze([
                `المجالات التي تشغل تفكيري: ${catLabels}`,
                `مستوى الاستنزاف: ${drainLevel} من 10`,
                `الحاجة التي أتجنبها: ${avoidLabel}`,
            ]);
        }
    };
    const goPrev = () => { if (step > 0) { setDirection(-1); setStep(s => s - 1); } };

    const canProceed =
        (step === 0 && categories.length > 0) ||
        (step === 1 && drainLevel !== null) ||
        (step === 2 && avoidance !== null);

    const toggleCategory = (id: string) =>
        setCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id)
          : prev.length >= 3  ? prev
          : [...prev, id]
        );

    // Drain level color helpers
    const drainColor = (lvl: number) =>
        lvl <= 3 ? '#2dd4bf' : lvl <= 6 ? '#fbbf24' : '#f87171';
    const drainBg = (lvl: number) =>
        lvl <= 3 ? 'rgba(20,184,166,0.13)' : lvl <= 6 ? 'rgba(251,191,36,0.13)' : 'rgba(248,113,113,0.13)';
    const drainBorder = (lvl: number) =>
        lvl <= 3 ? 'rgba(45,212,191,0.5)' : lvl <= 6 ? 'rgba(251,191,36,0.5)' : 'rgba(248,113,113,0.5)';
    const drainMsg = (lvl: number) =>
        lvl <= 3 ? '🌿 طاقتك كويسة — في خسارة خفية'
      : lvl <= 6 ? '⚠️ استنزاف ملحوظ — الجسم بيحسسك'
      : '🔴 منطقة خطر حمرا — لازم تتحرك';

    // ── Loading screen ──
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-14 gap-8">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-teal-500/15 blur-2xl animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-teal-400 animate-spin" />
                    <div className="absolute inset-4 rounded-full border-b-2 border-teal-600/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2.4s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 text-teal-400 animate-pulse" />
                    </div>
                </div>
                <p className="text-[11px] font-black tracking-[0.3em] uppercase animate-pulse" style={{ color: '#5eead4' }}>
                    جاري بناء خريطتك...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full p-5" dir="rtl" style={{ userSelect: 'none' }}>

            {/* ── Progress bar ── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2 items-center">
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            className="h-[3px] rounded-full"
                            animate={{
                                width: i === step ? 36 : 12,
                                background: i < step
                                    ? '#2dd4bf'
                                    : i === step
                                        ? '#2dd4bf'
                                        : 'rgba(255,255,255,0.1)',
                                boxShadow: i === step ? '0 0 8px rgba(45,212,191,0.7)' : 'none',
                            }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-black tracking-[0.2em] tabular-nums" style={{ color: '#6b8fa8' }}>
                    {step + 1} / 3
                </span>
            </div>

            {/* ── Question slide ── */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Question title */}
                    <h3 className="text-lg font-black text-white mb-1 leading-snug">
                        {QUESTIONS[step]}
                    </h3>

                    {/* ── STEP 0: Category grid ── */}
                    {step === 0 && (
                        <>
                            <p className="text-[11px] mb-4" style={{ color: '#6b8fa8' }}>
                                اختار لغاية 3 مجالات ({categories.length} / 3)
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                                {DRAIN_CATEGORIES.map((cat, i) => {
                                    const sel = categories.includes(cat.id);
                                    return (
                                        <motion.button
                                            key={cat.id}
                                            type="button"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => toggleCategory(cat.id)}
                                            className="relative rounded-2xl p-3.5 text-right transition-all duration-200"
                                            style={{
                                                border: sel ? '1px solid rgba(45,212,191,0.55)' : '1px solid rgba(255,255,255,0.07)',
                                                background: sel ? 'rgba(20,184,166,0.11)' : 'rgba(255,255,255,0.03)',
                                                boxShadow: sel ? '0 0 22px rgba(20,184,166,0.12), inset 0 0 16px rgba(20,184,166,0.05)' : 'none',
                                                cursor: !sel && categories.length >= 3 ? 'not-allowed' : 'pointer',
                                                opacity: !sel && categories.length >= 3 ? 0.45 : 1,
                                            }}
                                        >
                                            {sel && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-2 left-2 w-4 h-4 rounded-full bg-teal-400 flex items-center justify-center"
                                                >
                                                    <Check className="w-2.5 h-2.5 text-slate-900 stroke-[3]" />
                                                </motion.div>
                                            )}
                                            <span className="text-xl mb-1.5 block">{cat.emoji}</span>
                                            <p className="text-sm font-black leading-tight" style={{ color: sel ? '#5eead4' : '#e2e8f0' }}>
                                                {cat.label}
                                            </p>
                                            <p className="text-[10px] mt-1 leading-4" style={{ color: '#6b8fa8' }}>
                                                {cat.desc}
                                            </p>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ── STEP 1: Drain scale ── */}
                    {step === 1 && (
                        <div className="pt-3 pb-1">
                            <div className="flex justify-between text-[10px] mb-4 px-1" style={{ color: '#6b8fa8' }}>
                                <span>طاقتك ممتازة ✨</span>
                                <span>جافّ تماماً 🔴</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2.5">
                                {DRAIN_LEVELS.map((lvl, i) => {
                                    const sel = drainLevel === lvl;
                                    return (
                                        <motion.button
                                            key={lvl}
                                            type="button"
                                            initial={{ opacity: 0, scale: 0.75 }}
                                            animate={{
                                                opacity: 1,
                                                scale: sel ? 1.12 : 1,
                                                background: sel ? drainBg(lvl) : 'rgba(255,255,255,0.04)',
                                                boxShadow: sel ? `0 0 18px ${drainBg(lvl).replace('0.13', '0.35')}` : 'none',
                                            }}
                                            transition={{ delay: i * 0.04, scale: { duration: 0.2 } }}
                                            whileHover={{ scale: sel ? 1.12 : 1.07 }}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => {
                                                setDrainLevel(lvl);
                                                setTimeout(() => { setDirection(1); setStep(2); }, 650);
                                            }}
                                            className="aspect-square rounded-xl flex items-center justify-center font-black text-sm transition-colors"
                                            style={{
                                                border: sel ? `2px solid ${drainBorder(lvl)}` : '2px solid rgba(255,255,255,0.08)',
                                                color: sel ? drainColor(lvl) : 'rgba(255,255,255,0.45)',
                                            }}
                                        >
                                            {lvl}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            <AnimatePresence>
                                {drainLevel && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center text-xs font-bold mt-5"
                                        style={{ color: drainColor(drainLevel) }}
                                    >
                                        {drainMsg(drainLevel)}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* ── STEP 2: Avoidance list ── */}
                    {step === 2 && (
                        <div className="flex flex-col gap-2 mt-3">
                            {AVOIDANCE_OPTIONS.map((opt, i) => {
                                const sel = avoidance === opt.id;
                                return (
                                    <motion.button
                                        key={opt.id}
                                        type="button"
                                        initial={{ opacity: 0, x: 18 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        onClick={() => setAvoidance(opt.id)}
                                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-right transition-all duration-200"
                                        style={{
                                            border: sel ? '1px solid rgba(45,212,191,0.5)' : '1px solid rgba(255,255,255,0.07)',
                                            background: sel ? 'rgba(20,184,166,0.10)' : 'rgba(255,255,255,0.03)',
                                            boxShadow: sel ? '0 0 20px rgba(20,184,166,0.10)' : 'none',
                                        }}
                                    >
                                        <span className="text-lg shrink-0">{opt.emoji}</span>
                                        <span className="text-sm font-bold flex-1 leading-snug" style={{ color: sel ? '#5eead4' : '#e2e8f0' }}>
                                            {opt.label}
                                        </span>
                                        {sel && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center shrink-0"
                                            >
                                                <Check className="w-3 h-3 text-slate-900 stroke-[3]" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ── Navigation row ── */}
            {step !== 1 && (
                <div className="flex items-center justify-between mt-5 gap-3">
                    {/* Back button */}
                    {step > 0 ? (
                        <button
                            type="button"
                            onClick={goPrev}
                            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                            style={{
                                color: '#6b8fa8',
                                border: '1px solid rgba(255,255,255,0.07)',
                                background: 'rgba(255,255,255,0.03)',
                            }}
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            رجوع
                        </button>
                    ) : <div />}

                    {/* Next / Submit button */}
                    <motion.button
                        type="button"
                        onClick={goNext}
                        disabled={!canProceed}
                        whileHover={canProceed ? { scale: 1.03 } : {}}
                        whileTap={canProceed ? { scale: 0.97 } : {}}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all"
                        style={{
                            background: canProceed ? '#14b8a6' : 'rgba(255,255,255,0.06)',
                            color:      canProceed ? '#020408' : 'rgba(255,255,255,0.2)',
                            boxShadow:  canProceed ? '0 0 24px rgba(20,184,166,0.4)' : 'none',
                            cursor:     canProceed ? 'pointer' : 'not-allowed',
                            pointerEvents: canProceed ? 'auto' : 'none',
                        }}
                    >
                        {step === 2 ? (
                            <>
                                <Zap className="w-4 h-4" />
                                اكتشف خريطتك
                            </>
                        ) : (
                            <>
                                التالي
                                <ChevronLeft className="w-4 h-4" />
                            </>
                        )}
                    </motion.button>
                </div>
            )}
        </div>
    );
}
