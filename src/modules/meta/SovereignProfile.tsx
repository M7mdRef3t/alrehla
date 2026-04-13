/**
 * Sovereign Profile — ملف الرحلة الخاص 🛡️
 * ==========================================
 * تعرض رتبة المستخدم (Commander) وتقدمه في نقاط الخبرة (XP).
 */

import React from "react";
import { motion } from "framer-motion";
import { Shield, Star, Zap, Award, Target } from "lucide-react";
import { useGamificationState } from "@/services/gamificationEngine";
import { useMapState } from "@/modules/map/store/map.store";

const RANK_DATA: Record<string, { label: string; icon: any; color: string; bg: string }> = {
// ... existing rank data ...
};

const DEFAULT_RANK = { label: " ", icon: Shield, color: "text-slate-400", bg: "bg-slate-500/10" };

export const SovereignProfile: React.FC = () => {
    const { xp, rank, level } = useGamificationState();
    const { transformationDiagnosis } = useMapState();
    if (xp <= 0) return null;

    const currentRank = RANK_DATA[rank] ?? DEFAULT_RANK;
    const Icon = currentRank.icon;

    // Calculate progress to next level
    const nextXP = level * 100;
    const prevXP = (level - 1) * 100;
    const progress = Math.min(100, Math.max(0, ((xp - prevXP) / (nextXP - prevXP)) * 100));

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 border border-white/5 bg-white/5 backdrop-blur-md relative overflow-hidden"
        >
            <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${currentRank.bg}`}>
                        <Icon className={`w-6 h-6 ${currentRank.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] uppercase font-black tracking-widest ${currentRank.color}`}>
                                {currentRank.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">LVL {level}</span>
                        </div>

                        <div className="flex items-end justify-between mb-1.5">
                            <h3 className="text-sm font-black text-white truncate">ملف الرحلة</h3>
                            <span className="text-xs font-bold text-[var(--soft-teal)]">{xp} XP</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-[var(--soft-teal)] to-teal-400"
                            />
                        </div>
                    </div>
                </div>

                {transformationDiagnosis?.state && (
                    <div className="pt-2 border-t border-white/5">
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Current State | الحالة</span>
                            <span className="text-[10px] font-black text-amber-400/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                                {transformationDiagnosis.state}
                            </span>
                         </div>
                    </div>
                )}
            </div>

            {/* Background flourish */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 ${currentRank.bg.replace('bg-', 'bg-')}`} />
        </motion.div>
    );
};



