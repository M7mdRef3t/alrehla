import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { useEventHistoryStore } from '@/state/eventHistoryStore';
import type { GraphEvent } from '@/services/automagicLoop';
import { getPrescription } from '@/services/automagicLoop';

/**
 * Automagic Events Popup (Live Context)  اافذة اتفاعة اذاتة
 * ==========================================
 * تظر فرا عدا تشف اظا حدثا استراتجا ف اخرطة.
 */
export const AutomagicEventPopup: React.FC = () => {
    const { events } = useEventHistoryStore();
    const [latestEvent, setLatestEvent] = useState<GraphEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Watch for new events
    useEffect(() => {
        if (events.length > 0) {
            const firstEvent = events[0];
            // Only show if the event happened in the last 5 seconds (to avoid showing old ones on mount)
            if (Date.now() - firstEvent.timestamp < 5000) {
                setLatestEvent(firstEvent);
                setIsVisible(true);

                // Auto hide after 8 seconds
                const timer = setTimeout(() => {
                    setIsVisible(false);
                }, 8000);
                return () => clearTimeout(timer);
            }
        }
    }, [events]);

    if (!latestEvent) return null;

    const prescription = getPrescription(latestEvent);

    // Determine icon and colors based on event type
    let Icon = Sparkles;
    let colorTheme = "from-[var(--soft-teal)] to-[var(--soft-teal)] border-[var(--soft-teal)] text-[var(--soft-teal)]";
    let iconColor = "text-[var(--soft-teal)] bg-[var(--soft-teal)]/20";

    switch (latestEvent.type) {
        case "VAMPIRE_DETECTED":
            Icon = ShieldAlert;
            colorTheme = "from-rose-500/20 to-rose-900/40 border-rose-500/30 text-rose-100";
            iconColor = "text-rose-400 bg-rose-500/20";
            break;
        case "KEYSTONE_RESOLVED":
            Icon = UserCheck;
            colorTheme = "from-emerald-500/20 to-emerald-900/40 border-emerald-500/30 text-emerald-100";
            iconColor = "text-emerald-400 bg-emerald-500/20";
            break;
        case "MAJOR_DETACHMENT":
            Icon = Zap;
            colorTheme = "from-amber-500/20 to-amber-900/40 border-amber-500/30 text-amber-100";
            iconColor = "text-amber-400 bg-amber-500/20";
            break;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-50 w-80 lg:w-96"
                    dir="rtl"
                >
                    <div className={`relative overflow-hidden glass-heavy border bg-gradient-to-br p-5 shadow-2xl ${colorTheme}`}>
                        {/* Glow effect */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 blur-3xl rounded-full pointer-events-none" />

                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${iconColor}`}>
                                <Icon className="w-6 h-6 animate-pulse" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-[10px] font-black opacity-90 tracking-[0.2em] uppercase font-mono">
                                        RADAR_UPDATE // EVENT_LOG
                                    </h4>
                                    <button
                                        onClick={() => setIsVisible(false)}
                                        className="text-white/50 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm leading-relaxed font-bold text-white mb-2">
                                    {prescription.nudge}
                                </p>

                                {prescription.xpReward > 0 && (
                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg border border-white/5">
                                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                        <span className="text-xs font-bold text-yellow-100">+{prescription.xpReward} XP</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};



