import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowLeft } from "lucide-react";

/* ════════════════════════════════════════════════
   FIRST SPARK — The Cinematic Launch
   Stage 1: Chaos (The Reality Check)
   Stage 2: Order (The Orbit Strategy)
   Stage 3: Value (The Immediate Action)
   ════════════════════════════════════════════════ */

interface FirstSparkProps {
    onComplete: () => void;
}

export const FirstSparkOnboarding: FC<FirstSparkProps> = ({ onComplete }) => {
    const [stage, setStage] = useState<0 | 1 | 2>(0);

    // Sound effect placeholders (could be integrated with soundManager later)
    const playSound = (_type: "swoosh" | "ping" | "click") => {
        // soundManager.play(type);
    };

    const nextStage = () => {
        playSound("click");
        if (stage === 0) setStage(1);
        else if (stage === 1) setStage(2);
        else onComplete();
    };

    return (
        <div className="relative w-full h-[420px] flex flex-col items-center justify-between py-6 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <AnimatePresence mode="wait">
                {stage === 0 && <StageChaos key="chaos" onNext={nextStage} />}
                {stage === 1 && <StageOrder key="order" onNext={nextStage} />}
                {stage === 2 && <StageValue key="value" onNext={nextStage} />}
            </AnimatePresence>

            {/* Progress Indicators */}
            <div className="flex gap-2 z-10">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="h-1 rounded-full bg-slate-700"
                        initial={{ width: 6, backgroundColor: "rgba(51, 65, 85, 1)" }}
                        animate={{
                            width: i === stage ? 24 : 6,
                            backgroundColor: i === stage ? "rgba(45, 212, 191, 1)" : "rgba(51, 65, 85, 1)"
                        }}
                        transition={{ duration: 0.3 }}
                    />
                ))}
            </div>
        </div>
    );
};

/* ── Stage 1: Chaos (The Reality Check) ── */
const StageChaos: FC<{ onNext: () => void }> = ({ onNext }) => {
    // Generate random chaotic dots
    const dots = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 280,
        y: (Math.random() - 0.5) * 280,
        scale: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 2
    })), []);

    return (
        <motion.div
            className="flex flex-col items-center justify-center flex-1 w-full relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            {/* Visual: Chaos */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                {/* The User (Center) */}
                <motion.div
                    className="w-4 h-4 bg-white rounded-full z-10 shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Chaotic Dots */}
                {dots.map((d) => (
                    <motion.div
                        key={d.id}
                        className="absolute w-2 h-2 rounded-full bg-slate-500/40"
                        initial={{ x: d.x, y: d.y }}
                        animate={{
                            x: [d.x, d.x + (Math.random() - 0.5) * 40, d.x],
                            y: [d.y, d.y + (Math.random() - 0.5) * 40, d.y],
                            opacity: [0.3, 0.7, 0.3]
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: d.delay
                        }}
                    />
                ))}

                {/* Pulse Waves indicating stress */}
                <motion.div
                    className="absolute inset-0 border border-red-500/20 rounded-full"
                    animate={{ scale: [0.8, 1.2], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>

            {/* Copy */}
            <div className="text-center px-6 max-w-sm z-10">
                <h2 className="text-xl font-bold text-white mb-2">
                    حاسس إن طاقتك بتخلص؟
                </h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    في خناقات مش بتاعتك.. الشوشرة دي سببها إن مفيش <span className="text-teal-400 font-bold">"حدود"</span>.
                </p>

                <motion.button
                    onClick={onNext}
                    className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    نضّف الميدان
                </motion.button>
            </div>
        </motion.div>
    );
};

/* ── Stage 2: Order (The Orbit Strategy) ── */
const StageOrder: FC<{ onNext: () => void }> = ({ onNext }) => {
    return (
        <motion.div
            className="flex flex-col items-center justify-center flex-1 w-full relative"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
        >
            {/* Visual: Orbits Clearing */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                {/* Orbits */}
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full border"
                        style={{
                            width: i * 80,
                            height: i * 80,
                            borderColor: i === 1 ? "rgba(52,211,153,0.3)" : i === 2 ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)",
                            borderWidth: 1.5
                        }}
                        initial={{ scale: 0, opacity: 0, rotate: 180 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ delay: i * 0.15, type: "spring", stiffness: 60, damping: 12 }}
                    />
                ))}

                {/* User */}
                <div className="w-3 h-3 bg-white rounded-full z-10" />

                {/* Dots aligning */}
                <motion.div
                    className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                    initial={{ x: 80, y: -40, opacity: 0 }}
                    animate={{ x: 28, y: -28, opacity: 1 }} // Inner orbit
                    transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
                />
                <motion.div
                    className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                    initial={{ x: -90, y: 80, opacity: 0 }}
                    animate={{ x: -60, y: 60, opacity: 1 }} // Middle orbit
                    transition={{ delay: 0.6, duration: 0.6, type: "spring" }}
                />
                <motion.div
                    className="absolute w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]"
                    initial={{ x: 120, y: 20, opacity: 0 }}
                    animate={{ x: 100, y: 0, opacity: 1 }} // Outer orbit
                    transition={{ delay: 0.7, duration: 0.6, type: "spring" }}
                />
            </div>

            {/* Copy */}
            <div className="text-center px-6 max-w-sm z-10">
                <motion.h2
                    className="text-xl font-bold text-white mb-2"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    في "دواير".. بنرتب حياتك
                </motion.h2>
                <motion.p
                    className="text-sm text-slate-400 mb-6 leading-relaxed"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    كل حد ليه مكان.. يا إما <span className="text-emerald-400">سند</span>، يا <span className="text-amber-400">محتاج حدود</span>، يا <span className="text-rose-400">بيسحب طاقتك</span>.
                </motion.p>

                <motion.button
                    onClick={onNext}
                    className="bg-transparent border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 font-bold py-3 px-8 rounded-full transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    وريني الخريطة
                </motion.button>
            </div>
        </motion.div>
    );
};

/* ── Stage 3: Value (Immediate Action) ── */
const StageValue: FC<{ onNext: () => void }> = ({ onNext }) => {
    return (
        <motion.div
            className="flex flex-col items-center justify-center flex-1 w-full relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Visual: Action & Alert */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                {/* Red Orbit only */}
                <div className="absolute w-[240px] h-[240px] rounded-full border border-rose-500/30" />

                {/* Hand moving dot simulation */}
                <motion.div
                    className="absolute w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(243,68,68,0.8)]"
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{ x: 85, y: -85, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
                />

                {/* Jarvis Alert Popup */}
                <motion.div
                    className="absolute -bottom-4 bg-slate-900/90 border border-teal-500/30 p-3 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-3 w-60"
                    initial={{ y: 10, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, type: "spring" }}
                >
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="text-right flex-1">
                        <p className="text-[10px] text-teal-500 font-bold uppercase tracking-wider mb-0.5">NUDGE SYSTEM</p>
                        <p className="text-xs text-slate-200 font-medium">تم رصد جبهة مستنزفة.. جاري تجهيز الدروع.</p>
                    </div>
                </motion.div>
            </div>

            {/* Copy */}
            <div className="text-center px-6 max-w-sm z-10">
                <h2 className="text-xl font-bold text-white mb-2">
                    ذكاء تكتيكي.. مش نصايح
                </h2>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    مش بس هترسم.. Jarvis هيديك <span className="text-white font-bold">"خطة عمليات"</span> لكل جبهة عشان تحمي نفسك.
                </p>

                <motion.button
                    onClick={onNext}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-900 font-bold py-3.5 px-8 rounded-full shadow-[0_0_25px_rgba(45,212,191,0.4)] transition-all flex items-center mx-auto gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    ابدأ رسم أول دايرة <ArrowLeft className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
};
