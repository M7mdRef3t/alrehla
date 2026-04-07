import { logger } from "../services/logger";
import { FC, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X, Brain } from "lucide-react";
import { supabase } from "../services/supabaseClient";

interface ShadowSignal {
    id: string;
    insight_text: string;
    target_type: string;
    target_id: string;
}

export const ShadowInsightPanel: FC<{ onSurface?: (context: Record<string, unknown>) => void }> = ({ onSurface }) => {
    const [signal, setSignal] = useState<ShadowSignal | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [lastTriggeredId, setLastTriggeredId] = useState<string | null>(null);

    const fetchShadow = useCallback(async () => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch('/api/shadow-signals', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.id) {
                    setSignal(data);
                    setIsVisible(true);
                    if (onSurface && data.id !== lastTriggeredId) {
                        onSurface(data);
                        setLastTriggeredId(data.id);
                    }
                }
            }
        } catch (err) {
            logger.error("Shadow UI Fetch Error:", err);
        }
    }, [lastTriggeredId, onSurface]);

    useEffect(() => {
        fetchShadow();
        // Check periodically
        const interval = setInterval(fetchShadow, 60000);
        return () => clearInterval(interval);
    }, [fetchShadow]);

    const acknowledge = async (action: 'explore' | 'ignore') => {
        if (!signal) return;
        setIsVisible(false);
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            await fetch('/api/shadow-signals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id: signal.id, action })
            });

            if (action === 'explore') {
                // UI feedback: Open appropriate map section
                console.warn("Exploring Shadow:", signal.target_id);
            }
        } catch (err) {
            logger.error("Shadow Ack Error:", err);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && signal && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-24 left-4 right-4 z-50 max-w-[32rem] mx-auto p-6 rounded-3xl bg-slate-950/90 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-xl overflow-hidden group"
                >
                    {/* Shadow Texture Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.1),transparent)] pointer-events-none" />

                    <div className="relative flex gap-5">
                        {/* Shadow Icon Container */}
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                            <Eye className="w-5 h-5 text-purple-400" />
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
                                    بصرة اظ (Shadow Insight)
                                </span>
                                <button onClick={() => acknowledge('ignore')} className="p-1 hover:bg-white/5 rounded-full opacity-40 hover:opacity-100 transition-all">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>

                            <p className="text-[14px] text-slate-100 font-bold leading-relaxed text-right pr-1">
                                {signal.insight_text}
                            </p>

                            <div className="flex items-center gap-3 justify-end pt-2">
                                <button
                                    onClick={() => acknowledge('explore')}
                                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-[11px] font-black flex items-center gap-2 hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition-all"
                                >
                                    استشف اسبب
                                    <Brain className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => acknowledge('ignore')}
                                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-black hover:bg-white/10 transition-all"
                                >
                                    سجا ذر
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Animated Eye Pupil Effect */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 blur-[40px] rounded-full group-hover:bg-purple-500/10 transition-all duration-700" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
