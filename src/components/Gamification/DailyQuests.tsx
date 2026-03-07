"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Sparkles, Trophy } from 'lucide-react';
import { getDailyQuests, DailyQuest } from '../../services/gamificationEngine';

/**
 * Daily Quests Component  اات اة
 * ==========================================
 * عرض ائة  اا ابسطة ات تعط استخد افآت فرة.
 */

export const DailyQuests = () => {
    // In a real app, this would be fetched and stored in a state/db
    const quests = getDailyQuests(["dq_checkin"]); // Mocking one completed

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">ات ااستطاع</h2>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">تحتاج 24 ساعة تجدد</span>
            </div>

            <div className="grid gap-2.5">
                {quests.map((quest: DailyQuest, idx: number) => (
                    <motion.div
                        key={quest.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${quest.isCompleted
                            ? 'bg-slate-800/20 border-slate-700/30'
                            : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                            }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${quest.isCompleted
                                ? 'bg-teal-500/10 text-teal-400'
                                : 'bg-slate-700/30 text-slate-400'
                                }`}>
                                {quest.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />}
                            </div>

                            <div className="min-w-0">
                                <h4 className={`text-sm font-bold truncate ${quest.isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                                    {quest.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                                    {quest.description}
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--soft-teal)]/10 border border-[var(--soft-teal)]">
                            <span className="text-xs font-black text-[var(--soft-teal)]">+{quest.xpReward}</span>
                            <Sparkles className="w-3 h-3 text-[var(--soft-teal)] opacity-70" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Completion Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--soft-teal)] to-purple-500/10 border border-[var(--soft-teal)] flex items-center justify-between overflow-hidden relative">
                <div className="absolute -bottom-2 -right-2 opacity-5">
                    <Trophy className="w-16 h-16 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white mb-0.5">أجز  اات</h3>
                    <p className="text-[10px] text-[var(--soft-teal)] font-medium tracking-wide">احص ع صد عشائ (ربا)</p>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-[var(--soft-teal)] flex items-center justify-center">
                    <span className="text-sm font-black text-white">1/3</span>
                </div>
            </div>
        </div>
    );
};



