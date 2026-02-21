/**
 * Sovereign Profile — الهوية السيادية 🛡️
 * ==========================================
 * تعرض رتبة المستخدم (Commander) وتقدمه في نقاط الخبرة (XP).
 */

import React from "react";
import { motion } from "framer-motion";
import { Shield, Star, Zap, Award, Target } from "lucide-react";
import { useGamificationState, type Rank } from "../services/gamificationEngine";

const RANK_DATA: Record<Rank, { label: string; icon: any; color: string; bg: string }> = {
    "مستطلع جَدِيد": { label: "مستطلع جديد", icon: Target, color: "text-slate-400", bg: "bg-slate-500/10" },
    "كشاف ميداني": { label: "كشاف ميداني", icon: Zap, color: "text-teal-400", bg: "bg-teal-500/10" },
    "ملازم تعافي": { label: "ملازم تعافي", icon: Star, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    "نقيب حدود": { label: "نقيب حدود", icon: Shield, color: "text-amber-400", bg: "bg-amber-500/10" },
    "رائد استقرار": { label: "رائد استقرار", icon: Shield, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    "عقيد حكمة": { label: "عقيد حكمة", icon: Award, color: "text-violet-400", bg: "bg-violet-500/10" },
    "عميد سلام": { label: "عميد سلام", icon: Award, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    "مارشال الدواير": { label: "مارشال الدواير", icon: Award, color: "text-rose-500", bg: "bg-rose-500/10" }
};

export const SovereignProfile: React.FC = () => {
    const { xp, rank, level } = useGamificationState();
    if (xp <= 0) return null;

    const currentRank = RANK_DATA[rank];
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
            <div className="flex items-center gap-4 relative z-10">
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
                        <h3 className="text-sm font-black text-white truncate">الملف السيادي</h3>
                        <span className="text-xs font-bold text-indigo-400">{xp} XP</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-teal-400"
                        />
                    </div>
                </div>
            </div>

            {/* Background flourish */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 ${currentRank.bg.replace('bg-', 'bg-')}`} />
        </motion.div>
    );
};
