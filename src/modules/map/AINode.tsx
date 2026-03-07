import type { FC } from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic, MicOff } from "lucide-react";

interface AINodeProps {
    isConnected: boolean;
    isListening: boolean;
    isSpeaking?: boolean;
    onToggle: () => void;
}

/**
 * ️ AINode  بؤرة اع (The Organic AI Agent)
 * 
 * دائرة تفاعة داخ اخرطة تع ستب  Drag & Drop
 * تتح جة صتة عد احدث.
 */
export const AINode: FC<AINodeProps> = ({
    isConnected,
    isListening,
    isSpeaking,
    onToggle
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: "ai-node",
    });

    return (
        <div
            ref={setNodeRef}
            className="absolute left-1/2 bottom-[15%] -translate-x-1/2 flex flex-col items-center gap-2 z-40"
        >
            <motion.button
                onClick={onToggle}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${isConnected
                    ? "bg-[var(--soft-teal)]/10 border-2 border-[var(--soft-teal)]"
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                    }`}
                style={{
                    boxShadow: isOver
                        ? "0 0 40px rgba(129, 140, 248, 0.5)"
                        : isConnected
                            ? "0 0 20px rgba(129, 140, 248, 0.2)"
                            : "none",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/*  Network Resonance Ripples (ار اشب)  */}
                <AnimatePresence>
                    {isConnected && isSpeaking && (
                        <>
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={`ripple-${i}`}
                                    className="absolute inset-0 rounded-full border border-[var(--soft-teal)]"
                                    initial={{ scale: 1, opacity: 0.6 }}
                                    animate={{
                                        scale: [1, 2.5],
                                        opacity: [0.6, 0],
                                        borderWidth: ["1px", "0px"]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.6,
                                        ease: "easeOut"
                                    }}
                                />
                            ))}
                        </>
                    )}
                </AnimatePresence>

                {/* Breathing background when over */}
                <AnimatePresence>
                    {isOver && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.3, opacity: 0.3 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="absolute inset-0 rounded-full bg-[var(--soft-teal)]/20"
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </AnimatePresence>

                {/* Visualizer Waves when connected */}
                {isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 bg-[var(--soft-teal)]/30 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                                animate={{
                                    height: isSpeaking ? [12, 32, 12] : [6, 12, 6],
                                    opacity: isSpeaking ? [0.8, 1, 0.8] : [0.4, 0.6, 0.4]
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.08,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Icon */}
                <div className={`relative z-10 ${isConnected ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}>
                    {isConnected ? (
                        isListening ? <Mic className="w-7 h-7 text-[var(--soft-teal)]" /> : <MicOff className="w-7 h-7 text-slate-500" />
                    ) : (
                        <Sparkles className="w-7 h-7 text-[var(--soft-teal)]" />
                    )}
                </div>

                {/* Constant Synaptic Glow if connected */}
                {isConnected && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[var(--soft-teal)]"
                        animate={{
                            scale: isSpeaking ? [1, 1.15, 1] : [1, 1.05, 1],
                            opacity: isSpeaking ? [0.6, 0.3, 0.6] : [0.3, 0.1, 0.3]
                        }}
                        transition={{
                            duration: isSpeaking ? 1.5 : 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                )}
            </motion.button>

            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--soft-teal)]">
                {isOver ? "اسحب ا بدء" : isConnected ? "دس اع" : "بؤرة اع"}
            </span>
        </div>
    );
};





