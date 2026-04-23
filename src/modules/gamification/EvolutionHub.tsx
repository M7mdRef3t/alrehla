"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Shield, Zap, 
  ChevronRight, Star, 
  LayoutGrid, ListTodo, 
  Coins, Zap as Sparkles, X,
  ArrowUpCircle, Award, ShoppingBag,
  Snowflake, Swords, Info
} from "lucide-react";
import { useGamification } from "@/domains/gamification";
import { QuestBoard } from "./QuestBoard";
import { SovereigntyStore } from "./SovereigntyStore";
import { FrostBoard } from "./FrostBoard";
import { ChallengeBoard } from "./ChallengeBoard";
import { soundManager } from "@/services/soundManager";
import { triggerConfetti } from "@/utils/confetti";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";

export function TajmeedHub({ onClose }: { onClose: () => void }) {
  const { 
    xp, level, coins, 
    badges,
    levelProgress,
    checkAndResetQuests,
    frostPoints,
    freezeStats,
  } = useGamification();

  useEffect(() => {
    checkAndResetQuests();
  }, [checkAndResetQuests]);

  const { evolutionHubTab } = useAppOverlayState();
  const [activeTab, setActiveTab] = useState<'quests' | 'achievements' | 'frostboard' | 'challenges' | 'store'>(evolutionHubTab === 'guide' ? 'quests' : evolutionHubTab || 'quests');
  
  // Sync tab if store changes (e.g. clicking header while hub is already open)
  useEffect(() => {
    setActiveTab(evolutionHubTab === 'guide' ? 'quests' : evolutionHubTab || 'quests');
  }, [evolutionHubTab]);

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastLevel, setLastLevel] = useState(level);

  const { xpInCurrent: currentLevelXp, nextLevelXP: nextLevelXp, progress } = levelProgress;

  // Watch for Level Up
  useEffect(() => {
    if (level > lastLevel) {
       setShowLevelUp(true);
       setLastLevel(level);
       soundManager.playEffect('celebration');
       triggerConfetti(5);
    }
  }, [level, lastLevel]);

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[85vh] flex flex-col bg-[#020617] rounded-[3.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* Close Button */}
      <button 
        type="button"
        onClick={onClose}
        aria-label="إغلاق"
        className="absolute top-8 right-8 z-50 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
      >
        <X className="w-5 h-5 text-slate-400" />
      </button>

      {/* Main Header / State Summary */}
      <div className="p-10 pb-6 shrink-0 relative z-10 flex flex-wrap items-end justify-between gap-8">
        <div className="flex flex-wrap items-center gap-8">
            {/* Level Orb Area */}
            <div className="flex flex-col items-center gap-3">
                <div 
                    className="relative w-32 h-32 flex items-center justify-center outline-none group"
                >
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                        <motion.circle 
                            cx="64" cy="64" r="58" fill="none" 
                            stroke="url(#xpGrad)" strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 58}
                            initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - progress / 100) }}
                            transition={{ duration: 2, ease: "circOut" }}
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#c084fc" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span 
                            key={level}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl font-black text-white transition-colors"
                        >
                            {level}
                        </motion.span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">المستوى</span>
                    </div>
                    {/* Pulse Glow */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-500 bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/20 group-hover:blur-2xl`} />
                </div>
                
                <div className="text-[10px] font-bold text-slate-400 max-w-[130px] text-center leading-relaxed bg-[#0a0f1e] border border-[#1e293b] p-2 rounded-xl">
                    مستواك بيزيد مع كل خطوة وعي بتاخدها في خريطتك أو مسارك اليومي
                </div>

            </div>

            <div className="space-y-4">
                <div>
                   <h2 className="text-3xl font-black text-white mb-1">تجميد ❄️</h2>
                   <p className="text-sm font-medium text-slate-500 max-w-xs">
                      حياتك لعبة — وأنت اللاعب والمؤلف. كل قرار واعي يُسجّل.
                   </p>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0a0f1e] border border-[#1e293b]">

                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                             <Coins className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-white">{coins}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">عملة سِيادية</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#06202a] border border-[#083344]">

                        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                             <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-cyan-300">{frostPoints}</span>
                            <span className="text-[8px] font-bold text-cyan-700 uppercase tracking-tighter">❄️ نقاط صقيع</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0a0f1e] border border-[#1e293b]">

                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                             <Trophy className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-white">{badges.length}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">أوسمة سِيادية</span>
                        </div>
                    </div>
                    
                    {freezeStats.totalFreezes > 0 && (
                      <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#06132a] border border-[#1e3a8a]">

                          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                               <Shield className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-xs font-black text-blue-300">{freezeStats.totalFreezes}</span>
                              <span className="text-[8px] font-bold text-blue-700 uppercase tracking-tighter">تجميد فعّال</span>
                          </div>
                      </div>
                    )}
                </div>
            </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 rounded-2xl bg-[#0a0f1e] border border-[#1e293b]">
           <button 
             onClick={() => setActiveTab('quests')}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
               activeTab === 'quests' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'
             }`}
           >
             <ListTodo className="w-4 h-4" /> المسار اليومي
           </button>
           <button 
             onClick={() => setActiveTab('achievements')}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
               activeTab === 'achievements' ? 'bg-[#1e293b] text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'
             }`}
           >
             <Award className="w-4 h-4" /> الإنجازات
           </button>
           <button 
             onClick={() => setActiveTab('frostboard')}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
               activeTab === 'frostboard' ? 'bg-cyan-600/80 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'text-slate-500 hover:text-slate-400'
             }`}
           >
             <Snowflake className="w-4 h-4" /> ❄️ الصدارة
           </button>
           <button 
             onClick={() => setActiveTab('challenges')}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
               activeTab === 'challenges' ? 'bg-[#c2410c] text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]' : 'text-slate-500 hover:text-slate-400'
             }`}
           >
             <Swords className="w-4 h-4" /> التحديات
           </button>
           <button 
             onClick={() => setActiveTab('store')}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
               activeTab === 'store' ? 'bg-[#4338ca] text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-slate-400'
             }`}
           >
             <ShoppingBag className="w-4 h-4" /> المتجر
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden px-10 pb-10">
        <AnimatePresence mode="wait">
           {activeTab === 'quests' ? (
             <motion.div 
               key="quests"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="h-full"
             >
               <QuestBoard />
             </motion.div>
           ) : activeTab === 'achievements' ? (
             <motion.div 
               key="achievements"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="h-full overflow-y-auto custom-scrollbar pr-4 grid grid-cols-2 lg:grid-cols-3 gap-4"
             >
               {badges.map((badge: any, idx) => (
                 <div key={idx} className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col items-center text-center group hover:bg-white/[0.04] transition-all">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <Trophy className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h4 className="text-white font-black text-sm mb-1">{typeof badge === 'string' ? badge : badge.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">وسام الاستحقاق</p>
                 </div>
               ))}
               {badges.length === 0 && (
                 <div className="col-span-full h-full flex flex-col items-center justify-center text-center opacity-40 mt-10">
                    <Award className="w-20 h-20 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-white">لم يتم رصد إنجازات استثنائية بعد</p>
                 </div>
               )}
             </motion.div>
           ) : activeTab === 'frostboard' ? (
               <motion.div
                 key="frostboard"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="h-full overflow-y-auto custom-scrollbar pr-2"
               >
                 <FrostBoard />
               </motion.div>
             ) : activeTab === 'challenges' ? (
               <motion.div
                 key="challenges"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="h-full overflow-y-auto custom-scrollbar pr-2"
               >
                 <ChallengeBoard />
               </motion.div>
             ) : (
             <motion.div 
               key="store"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="h-full"
             >
               <SovereigntyStore />
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      {/* Level Up Overlay */}
      <AnimatePresence>
         {showLevelUp && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
               <motion.div 
                 initial={{ scale: 0, rotate: -45 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ type: "spring", damping: 15 }}
                 className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-8 relative"
               >
                  <ArrowUpCircle className="w-24 h-24 text-white animate-bounce" />
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
               </motion.div>

               <h2 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">ارتقاء سِيادي!</h2>
               <p className="text-xl font-medium text-slate-400 mb-12">
                  لقد وصلت لمستوى السيادة <span className="text-indigo-400 font-black">{level}</span>
               </p>

               <div className="flex gap-4">
                  <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10">
                     <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">+500 عملة</div>
                     <div className="text-sm font-black text-emerald-400">مكافأة المستوى</div>
                  </div>
                  <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10">
                     <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">دليل صِيادي جديد</div>
                     <div className="text-sm font-black text-indigo-400">فتح مهارة</div>
                  </div>
               </div>

               <button 
                 onClick={() => setShowLevelUp(false)}
                 className="mt-16 px-12 py-4 rounded-full bg-white text-slate-950 font-black text-lg hover:scale-105 transition-transform"
               >
                  استمرار الرحلة
               </button>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
