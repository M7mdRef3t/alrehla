import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, RefreshCw } from 'lucide-react';
import { generatePredictiveInsight, calculateEntropy } from '../../services/predictiveEngine';

/**
 * AI Oracle Widget  اعراف اذ اشرف ع احاة
 * ==========================================
 * رأ ستات ااستزاف (Pulse) فض اخرطة ث د صحة تتة فرة.
 */
export const AIOracleWidget: React.FC = () => {
    const [insightMessage, setInsightMessage] = useState<string>("جار تح سارات راجعة ارادار...");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [stateType, setStateType] = useState<"CHAOS" | "ORDER" | "FLOW">("ORDER");

    const fetchInsight = async () => {
        setIsLoading(true);
        // Getting state quickly for UI styling
        const currentData = calculateEntropy();
        setStateType(currentData.state);

        // Fetching text from Gemini
        const message = await generatePredictiveInsight();
        setInsightMessage(message);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInsight();
    }, []);

    // Styling based on state (CHAOS gets intense colors/danger vibes)
    const getColors = () => {
        if (stateType === "CHAOS") {
            return {
                border: "border-rose-500/40",
                bg: "bg-rose-950/30",
                iconbg: "bg-rose-500/20 text-rose-400",
                glow: "from-rose-500/10 to-transparent",
                text: "text-rose-200"
            };
        } else if (stateType === "FLOW") {
            return {
                border: "border-emerald-500/30",
                bg: "bg-emerald-950/20",
                iconbg: "bg-emerald-500/20 text-emerald-400",
                glow: "from-emerald-500/10 to-transparent",
                text: "text-emerald-200"
            };
        }
        // ORDER (Neutral)
        return {
            border: "border-[var(--soft-teal)]",
            bg: "bg-[var(--soft-teal)]/20",
            iconbg: "bg-[var(--soft-teal)]/20 text-[var(--soft-teal)]",
            glow: "from-[var(--soft-teal)] to-transparent",
            text: "text-[var(--soft-teal)]"
        };
    };

    const colors = getColors();

    return (
        <motion.div
            className={`relative overflow-hidden w-full p-4 rounded-3xl border backdrop-blur-md transition-colors duration-1000 ${colors.border} ${colors.bg}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
        >
            <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${colors.glow} opacity-50`} />

            <div className="relative flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner ${colors.iconbg}`}>
                    {isLoading ? (
                        <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : stateType === "CHAOS" ? (
                        <Brain className="w-6 h-6 animate-pulse" />
                    ) : (
                        <Sparkles className="w-6 h-6" />
                    )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            اأرا_اذ
                            {stateType === "CHAOS" && (
                                <span className="flex items-center gap-1 text-[9px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    تب استزاف
                                </span>
                            )}
                        </h3>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={insightMessage}
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.4 }}
                            className={`text-sm md:text-base font-medium leading-relaxed ${colors.text}`}
                        >
                            {insightMessage}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};



