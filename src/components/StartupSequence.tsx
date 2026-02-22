import { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cpu, Zap, Radio, Globe } from "lucide-react";

const STARTUP_STEPS = [
    { text: "INITIALIZING COSMIC KERNEL...", icon: Globe, color: "text-blue-400" },
    { text: "LOADING PHYSICS ENGINE...", icon: Zap, color: "text-yellow-400" },
    { text: "CALIBRATING SENSORS...", icon: Radio, color: "text-purple-400" },
    { text: "NEURAL LINK ESTABLISHED.", icon: Cpu, color: "text-emerald-400" },
    { text: "SYSTEM ONLINE.", icon: ShieldCheck, color: "text-white" },
] as const;

export const StartupSequence: FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timeouts: Array<ReturnType<typeof setTimeout>> = [];
        let delay = 0;
        STARTUP_STEPS.forEach((_, index) => {
            delay += (index === 0 ? 500 : 800);
            timeouts.push(setTimeout(() => setStep(index + 1), delay));
        });

        const totalTime = delay + 1000;
        timeouts.push(setTimeout(() => onComplete(), totalTime));

        return () => {
            timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono overflow-hidden">
            {/* Background Matrix Effect (Simplified) */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="z-10 w-full max-w-md px-6">
                <AnimatePresence mode="popLayout">
                    {STARTUP_STEPS.map((s, i) => (
                        i < step && (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex items-center gap-3 mb-3 ${s.color}`}
                            >
                                <s.icon className="w-4 h-4" />
                                <span className="text-sm tracking-wider">{s.text}</span>
                            </motion.div>
                        )
                    ))}
                </AnimatePresence>

                {step === STARTUP_STEPS.length && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-8 text-center"
                    >
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 animate-pulse">
                            DAWAYIR OS
                        </div>
                        <div className="text-xs text-slate-500 mt-2 tracking-[0.5em] uppercase">
                            Transhumanism v2.0
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Loading Bar */}
            <div className="absolute bottom-10 w-64 h-1 bg-slate-900 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.5, ease: "linear" }}
                />
            </div>
        </div>
    );
};
