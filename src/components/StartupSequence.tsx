import { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlrehlaLogo } from "./logo";

const STARTUP_MESSAGES = [
    { text: "جاري فك تشفير الواقع...", delay: 0 },
    { text: "بنربط الوعي بالمبادئ الأولى...", delay: 1200 },
    { text: "تجهيز أدوات قتل الدجل بالعلم...", delay: 2400 },
    { text: "الرحلة بتبدأ دلوقتي.", delay: 3600 },
] as const;

export const StartupSequence: FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [index, setIndex] = useState(0);
    const [showLogo, setShowLogo] = useState(false);

    useEffect(() => {
        // Timeline animations
        const timer1 = setTimeout(() => setShowLogo(true), 400);
        
        const messageTimers = STARTUP_MESSAGES.map((msg, i) => 
            setTimeout(() => setIndex(i + 1), msg.delay + 800)
        );

        const finalTimer = setTimeout(() => onComplete(), 5500);

        return () => {
            clearTimeout(timer1);
            messageTimers.forEach(clearTimeout);
            clearTimeout(finalTimer);
        };
    }, [onComplete]);

    return (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-[#05050a] flex flex-col items-center justify-center overflow-hidden select-none touch-none"
            dir="rtl"
        >
            {/* Cinematic Background Layer */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Central Pulse */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
                    style={{ 
                        background: "radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%)",
                        filter: "blur(60px)"
                    }}
                />
                
                {/* Secondary Orbit Light */}
                <motion.div 
                    animate={{ 
                        rotate: 360,
                    }}
                    transition={{ 
                        duration: 20, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-500/10 rounded-full blur-[100px]" />
                </motion.div>

                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] contrast-150 brightness-100" />
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 flex flex-col items-center text-center px-8">
                {/* Logo Section */}
                <div className="mb-12 h-24 flex items-center justify-center">
                    <AnimatePresence>
                        {showLogo && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                transition={{ 
                                    duration: 1.5, 
                                    ease: [0.16, 1, 0.3, 1] 
                                }}
                                className="relative"
                            >
                                <AlrehlaLogo height={64} showTagline={false} className="drop-shadow-[0_0_30px_rgba(20,184,166,0.3)]" />
                                
                                {/* Shimmer Effect Over Logo */}
                                <motion.div 
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "200%" }}
                                    transition={{ 
                                        delay: 2, 
                                        duration: 2, 
                                        repeat: Infinity, 
                                        repeatDelay: 3, 
                                        ease: "easeInOut" 
                                    }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Narrative Steps */}
                <div className="h-8 flex items-center justify-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        {index > 0 && index <= STARTUP_MESSAGES.length && (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="flex flex-col items-center gap-2"
                            >
                                <span className="text-white/90 text-lg font-medium tracking-wide">
                                    {STARTUP_MESSAGES[index - 1].text}
                                </span>
                                
                                {/* Micro-progress Bar */}
                                <motion.div 
                                    className="w-12 h-[2px] bg-teal-500/30 rounded-full overflow-hidden"
                                >
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 1.2, ease: "linear" }}
                                        className="h-full bg-teal-400"
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Branding / Skip (Optional but here for UX) */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 1 }}
                className="absolute bottom-12 text-[10px] uppercase tracking-[0.4em] text-white/20 font-black"
            >
                First Principles Only
            </motion.div>

            {/* Cinematic Border Overlays */}
            <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
        </motion.div>
    );
};
