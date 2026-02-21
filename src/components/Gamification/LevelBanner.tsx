"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, ChevronRight, Zap } from 'lucide-react';
import { useGamificationState } from '../../services/gamificationEngine';

/**
 * Level Banner — بانر المستوى والرتبة
 * ==========================================
 * يعرض شريط التقدم والمستوى الحالي للمستخدم بشكل جذاب.
 */

export const LevelBanner = () => {
    const { level, rank, xp, getLevelProgress } = useGamificationState();
    const { progress, nextLevelXP } = getLevelProgress();

    return (
        <motion.div
            className="w-full p-4 rounded-3xl relative overflow-hidden bg-slate-800/40 border border-slate-700/50 backdrop-blur-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

            <div className="relative flex items-center justify-between gap-4">
                {/* Level Circle */}
                <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
                        <span className="text-[10px] text-white/60 font-bold uppercase leading-tight">LVL</span>
                        <span className="text-xl font-black text-white leading-tight">{level}</span>
                    </div>
                </div>

                {/* Info & Progress */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-bold text-white truncate pr-2">
                            رتبة: <span className="text-indigo-400">{rank}</span>
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            {xp} XP
                        </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-2 bg-slate-900/50 rounded-full border border-white/5 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-500 font-medium">
                            باقي <span className="text-indigo-300">{nextLevelXP} XP</span> للترقية التالية
                        </span>
                        <div className="flex -space-x-1">
                            {[1, 2, 3].map(i => (
                                <Star key={i} className={`w-2.5 h-2.5 ${i <= (level % 3 || 3) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-700/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer group">
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-[-2px] transition-transform" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
