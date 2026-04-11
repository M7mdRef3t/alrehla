import { gamificationService } from '@/domains/gamification';
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Sparkles, Trophy } from 'lucide-react';
import { getDailyQuests, DailyQuest } from '@/services/gamificationEngine';
import { useGamification } from '@/domains/gamification';
import { useMapState } from '@/domains/dawayir/store/map.store';
import { soundManager } from '@/services/soundManager';

/**
 * Daily Quests Component — رحلات اليوم
 * ==========================================
 * تعرض قائمة المهام اليومية المرتبطة بالحالة الحية للمستخدم.
 */

export const DailyQuests = () => {
    const { dailyCompletedKeys, completeDailyQuest, checkAndResetQuests } = useGamification();

    useEffect(() => {
        checkAndResetQuests();
    }, [checkAndResetQuests]);

    const nodes = useMapState(s => s.nodes);
    const quests = getDailyQuests(nodes, dailyCompletedKeys);
    const completedCount = quests.filter(q => q.isCompleted).length;
    const totalCount = quests.length;

    const handleQuestClick = (quest: DailyQuest) => {
        if (quest.isCompleted) return;
        
        // Very simple logic to allow "Check-in" to be completed instantly on click.
        // For other quests like 'Map Share', they should be completed by the actual action, 
        // but we allow clicking them to get the reward here for demo/simplicity if they aren't bound yet.
        soundManager.playEffect('cosmic_pulse');
        completeDailyQuest(quest.id, quest.actionKey, quest.xpReward);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-400 fill-teal-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">رحلات اليوم</h2>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">تتجدد كل ٢٤ ساعة</span>
            </div>

            <div className="grid gap-2.5">
                {quests.map((quest: DailyQuest, idx: number) => {
                    const bgClass = quest.isCompleted 
                        ? 'bg-slate-800/10 border-teal-900/30' 
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 cursor-pointer';

                    return (
                        <motion.div
                            key={quest.id}
                            onClick={() => handleQuestClick(quest)}
                            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${bgClass}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileTap={!quest.isCompleted ? { scale: 0.98 } : {}}
                            whileHover={!quest.isCompleted ? { borderColor: 'rgba(45,212,191,0.4)', boxShadow: '0 0 15px rgba(45,212,191,0.1)' } : {}}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${quest.isCompleted
                                    ? 'bg-teal-500/20 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]'
                                    : 'bg-slate-700/30 text-slate-400'
                                    }`}>
                                    {quest.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-600" />}
                                </div>

                                <div className="min-w-0">
                                    <h4 className={`text-sm font-bold truncate ${quest.isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                        {quest.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                                        {quest.description}
                                    </p>
                                </div>
                            </div>

                            <div className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg border ${quest.isCompleted ? 'bg-slate-900/50 border-slate-700 opacity-50' : 'bg-teal-500/10 border-teal-500/30'}`}>
                                <span className={`text-xs font-black ${quest.isCompleted ? 'text-slate-500' : 'text-teal-400'}`}>+{quest.xpReward}</span>
                                <Sparkles className={`w-3 h-3 ${quest.isCompleted ? 'text-slate-500' : 'text-teal-400'} opacity-70`} />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Completion Summary */}
            <div className={`p-4 rounded-2xl ${completedCount === totalCount ? 'bg-gradient-to-br from-teal-500/20 to-teal-900/40 border-teal-500/50' : 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700/50'} border flex items-center justify-between overflow-hidden relative transition-all`}>
                <div className="absolute -bottom-2 -right-2 opacity-5">
                    <Trophy className={`w-16 h-16 ${completedCount === totalCount ? 'text-teal-400' : 'text-slate-500'}`} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white mb-0.5">
                        {completedCount === totalCount ? 'أنجزت جميع المهام!' : 'إنجاز المهام'}
                    </h3>
                    <p className={`text-[10px] font-medium tracking-wide ${completedCount === totalCount ? 'text-teal-400' : 'text-slate-400'}`}>
                        {completedCount === totalCount ? 'تم مكافأتك بنقاط إضافية (قريباً)' : 'أكمل المهام للحصول على صندوق عشوائي (قريباً)'}
                    </p>
                </div>
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${completedCount === totalCount ? 'border-teal-400 bg-teal-500/20' : 'border-slate-600 bg-slate-800/50'}`}>
                    <span className={`text-sm font-black ${completedCount === totalCount ? 'text-teal-400' : 'text-slate-300'}`}>
                        {completedCount}/{totalCount}
                    </span>
                </div>
            </div>
        </div>
    );
};



