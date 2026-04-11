import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, BrainCircuit, X } from "lucide-react";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { TherapistChatModal } from "./TherapistChatModal";

const BASE_ENERGY_CAPACITY = 1000;
const LAST_ALERT_KEY = "dawayir_last_burnout_alert";

export const AggressiveBurnoutModal: React.FC = () => {
    const nodes = useMapState((s) => s.nodes);
    const [isOpen, setIsOpen] = useState(false);
    const [isTherapistOpen, setIsTherapistOpen] = useState(false);

    const burnoutData = useMemo(() => {
        const relationalNetEnergy = nodes.reduce((sum, n) => sum + (n.energyBalance?.netEnergy || 0), 0);
        const currentEnergy = Math.max(0, BASE_ENERGY_CAPACITY + relationalNetEnergy);

        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const sevenDaysAgo = now - SEVEN_DAYS_MS;

        let totalDrainIn7Days = 0;
        nodes.forEach(node => {
            const drain = (node.energyBalance?.transactions || [])
                .filter(t => t.timestamp >= sevenDaysAgo && t.amount < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            totalDrainIn7Days += drain;
        });

        const avgDailyDrain = totalDrainIn7Days / 7;
        if (avgDailyDrain === 0) {
            return { isCritical: false, daysRemaining: null };
        }

        const daysRemaining = Math.floor(currentEnergy / avgDailyDrain);
        const isCritical = daysRemaining <= 14;

        return { isCritical, daysRemaining };
    }, [nodes]);

    useEffect(() => {
        if (burnoutData.isCritical && burnoutData.daysRemaining !== null) {
            const today = new Date().toDateString();
            const lastAlert = localStorage.getItem(LAST_ALERT_KEY);

            if (lastAlert !== today) {
                // Show the alert and record it for today
                setIsOpen(true);
                localStorage.setItem(LAST_ALERT_KEY, today);
            }
        }
    }, [burnoutData]);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-slate-900 border-2 border-orange-500/50 rounded-2xl p-6 overflow-hidden shadow-2xl shadow-orange-900/30"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="burnout-alert-title"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 animate-pulse" />
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                aria-label="إغلاق التنبيه"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-4 pt-4 relative z-10">
                                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 animate-pulse">
                                    <Flame className="w-8 h-8" aria-hidden="true" />
                                </div>

                                <h3 id="burnout-alert-title" className="text-2xl font-black text-orange-500">جرس إنذار الطوارئ!</h3>

                                <p className="text-slate-300 leading-relaxed text-sm">
                                    إللي بيحصل في دوائرك ده <span className="text-rose-400 font-bold">نزيف طاقة حقيقي!</span> استمرارك بلامبالاة مع العلاقات دي معناه إنك هتنطفي بالكامل وتنهار خلال <span className="text-orange-500 font-black text-xl mx-1 tabular-nums">{burnoutData.daysRemaining}</span> يوم بالظبط.
                                </p>

                                <div className="w-full h-px bg-slate-800 my-2" />

                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsTherapistOpen(true);
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:from-orange-500 hover:to-red-500 transition-all shadow-lg shadow-orange-900/20"
                                >
                                    <BrainCircuit className="w-5 h-5" aria-hidden="true" />
                                    استشارة المعالج الآن
                                </button>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    سأتصرف بنفسي لاحقاً
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <TherapistChatModal
                isOpen={isTherapistOpen}
                onClose={() => setIsTherapistOpen(false)}
                burnoutRisk={true}
            />
        </>
    );
};
