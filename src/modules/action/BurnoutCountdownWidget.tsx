import type { FC } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Hourglass, BatteryWarning, BrainCircuit } from "lucide-react";
import { useMapState } from "@/state/mapState";
import { useAuthState } from "@/state/authState";
import { TherapistChatModal } from "./TherapistChatModal";
import { UpgradeScreen } from '@/modules/exploration/UpgradeScreen';

// Base synthetic energy capacity if net relations are 0.
const BASE_ENERGY_CAPACITY = 1000;

export const BurnoutCountdownWidget: FC = () => {
    const nodes = useMapState((s) => s.nodes);
    const { tier } = useAuthState();
    const [isTherapistOpen, setIsTherapistOpen] = useState(false);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

    const burnoutData = useMemo(() => {
        // 1. Calculate Current Energy Capacity
        const relationalNetEnergy = nodes.reduce((sum, n) => sum + (n.energyBalance?.netEnergy || 0), 0);
        const currentEnergy = Math.max(0, BASE_ENERGY_CAPACITY + relationalNetEnergy);

        // 2. Calculate Total Drain in the last 7 days
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

        // 3. Calculate Days Remaining
        if (avgDailyDrain === 0) {
            return { daysRemaining: null, currentEnergy, avgDailyDrain: 0, isCritical: false };
        }

        const daysRemaining = Math.floor(currentEnergy / avgDailyDrain);
        const isCritical = daysRemaining <= 14; // Alert if less than 2 weeks

        return { daysRemaining, currentEnergy, avgDailyDrain, isCritical };
    }, [nodes]);

    if (burnoutData.daysRemaining === null || !burnoutData.isCritical) {
        // Safe state, don't show the panicked countdown, or show a calm state
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Flame className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-slate-200">الاحتراق النفسي</h4>
                        <p className="text-xs text-slate-400">معدل الاستنزاف آمن حالياً</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-xl font-black text-emerald-400">آمن</span>
                </div>
                <TherapistChatModal isOpen={isTherapistOpen} onClose={() => setIsTherapistOpen(false)} burnoutRisk={false} />
                <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4 relative overflow-hidden">
            <TherapistChatModal isOpen={isTherapistOpen} onClose={() => setIsTherapistOpen(false)} burnoutRisk={true} />
            <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />

            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center animate-pulse">
                        <BatteryWarning className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-rose-300">عداد الانطفاء (Burnout)</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed max-w-[200px]">
                            بناءً على النزيف الحالي، طاقتك تنفد بسرعة.
                        </p>
                    </div>
                </div>

                <div className="text-center bg-rose-950/50 p-3 rounded-lg border border-rose-500/20 shadow-inner">
                    <span className="block text-3xl font-black text-rose-400 tabular-nums">
                        {burnoutData.daysRemaining}
                    </span>
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">يوم متبقي</span>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between bg-slate-950/40 rounded-lg p-2.5 border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Hourglass className="w-3.5 h-3.5 text-orange-400" />
                    <span>متوسط النزيف اليومي:</span>
                </div>
                <span className="font-bold text-orange-400 text-sm">-{burnoutData.avgDailyDrain.toFixed(1)} طاقة/يوم</span>
            </div>

            {/* Therapist Trigger Button */}
            <button
                onClick={() => tier === "pro" ? setIsTherapistOpen(true) : setIsUpgradeOpen(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-900/50"
            >
                <BrainCircuit className="w-5 h-5" />
                تحدث مع المعالج الذكي للإنقاذ
            </button>

            <UpgradeScreen isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
        </div>
    );
};
