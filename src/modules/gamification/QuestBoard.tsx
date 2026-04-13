"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Zap, CheckCircle2, 
  ChevronRight, Star,
  Calendar, Award, Flame,
  Library, BookOpen, PenTool, ExternalLink
} from "lucide-react";
import { useGamification } from "@/domains/gamification";
import { getDailyQuests, DailyQuest } from "@/services/gamificationEngine";
import { useMapState } from '@/modules/map/dawayirIndex';
import { soundManager } from "@/services/soundManager";
import { triggerConfetti } from "@/utils/confetti";

const CATEGORY_META = {
    relational: { icon: Target, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    wisdom: { icon: Library, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    discipline: { icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    growth: { icon: Flower2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

// Fallback if Lucide doesn't have Flower2 or if we want something specific
function Flower2(props: any) {
    return <PenTool {...props} />;
}

export function QuestBoard() {
  const { dailyCompletedKeys, completeDailyQuest, streak } = useGamification();
  const nodes = useMapState((s) => s.nodes);

  const quests = useMemo(() => {
    return getDailyQuests(nodes, dailyCompletedKeys);
  }, [nodes, dailyCompletedKeys]);

  const completedCount = quests.filter(q => q.isCompleted).length;
  const totalCount = quests.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const handleManualClaim = (quest: DailyQuest) => {
    if (quest.isCompleted) return;
    
    // Some quests might still be clickable for manual completion if needed (like check-in)
    if (quest.actionKey === 'daily_visit' || quest.actionKey === 'wisdom_shared') {
        soundManager.playEffect('cosmic_pulse');
        completeDailyQuest(quest.id, quest.actionKey, quest.xpReward);
        
        if (completedCount + 1 === totalCount) {
            setTimeout(() => triggerConfetti(3), 300);
        }
    }
  };

  return (
    <div className="flex flex-col h-full custom-scrollbar">
      {/* Sovereignty Status Header */}
      <div className="mb-8 p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50 group-hover:opacity-80 transition-opacity" />
        
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">المركز السِيادي</span>
              {streak > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black">
                  <Flame className="w-3 h-3" /> {streak} يوم
                </div>
              )}
            </div>
            <h3 className="text-2xl font-black text-white mb-4">مسارك اليومي للتمكين</h3>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-white/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white/60">{completedCount} مُكتمل</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5 text-white/40">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-white/60">{totalCount - completedCount} متبقي</span>
              </div>
            </div>
          </div>

          <div className="relative shrink-0 flex items-center justify-center">
             <svg className="w-24 h-24 -rotate-90">
                <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                <motion.circle 
                  cx="48" cy="48" r="42" fill="none" 
                  stroke="url(#headerGrad)" strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progressPercent / 100) }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-white">{Math.round(progressPercent)}%</span>
             </div>
          </div>
        </div>
      </div>

      {/* Quests List */}
      <div className="flex-1 space-y-3 pb-8">
        <AnimatePresence mode="popLayout">
          {quests.map((quest, index) => {
            const meta = CATEGORY_META[quest.category || 'discipline'];
            const CategoryIcon = meta.icon;

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => handleManualClaim(quest)}
                className={`group relative p-4 rounded-[2rem] border transition-all overflow-hidden ${
                  quest.isCompleted 
                  ? "bg-emerald-500/[0.02] border-emerald-500/20 opacity-80" 
                  : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  {/* Category Indicator */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    quest.isCompleted 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : `${meta.bg} ${meta.color} group-hover:scale-105`
                  }`}>
                    {quest.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <CategoryIcon className="w-6 h-6 shrink-0" />}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`text-sm font-black truncate uppercase tracking-tight ${quest.isCompleted ? 'text-white/40 line-through' : 'text-white'}`}>
                        {quest.title}
                      </h4>
                      {quest.isCompleted && (
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <p className={`text-[11px] font-medium leading-tight line-clamp-1 group-hover:line-clamp-none transition-all ${quest.isCompleted ? 'text-white/20' : 'text-white/40'}`}>
                      {quest.description}
                    </p>
                  </div>

                  {/* Reward Badge */}
                  <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-colors ${
                      quest.isCompleted 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/50" 
                      : "bg-indigo-500/5 border-indigo-500/10 text-indigo-400 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10"
                    }`}>
                      <span className="text-[10px] font-black">{quest.xpReward} XP</span>
                    </div>
                    
                    {!quest.isCompleted && (
                       <div className="flex items-center gap-1 text-[9px] font-black text-white/10 uppercase tracking-widest group-hover:text-indigo-400/40 transition-colors">
                          بسط السيادة <ChevronRight className="w-3 h-3" />
                       </div>
                    )}
                  </div>
                </div>

                {/* Status-specific background details */}
                {quest.isCompleted && (
                   <div className="absolute inset-0 bg-emerald-500/[0.01] pointer-events-none" />
                )}
                {!quest.isCompleted && (
                   <div className="absolute bottom-0 right-0 p-1 opacity-0 group-hover:opacity-10 transition-opacity">
                      <CategoryIcon className="w-12 h-12 -mb-4 -mr-4 rotate-12" />
                   </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Tactical Footer */}
      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20">
                <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-[10px] font-bold text-white/50 leading-relaxed uppercase tracking-wider">
               نظام التتبع السِيادي نشط. سيتم تسجيل إنجازاتك تلقائياً فور تنفيذ المهام في الميدان.
            </p>
        </div>
      </div>
    </div>
  );
}
