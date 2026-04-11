"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Shield, Star, Zap, 
  ChevronRight, ShoppingCart, Award,
  Target, Flame, TrendingUp, Lock
} from "lucide-react";
import { useGamification } from "@/domains/gamification";
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { ACHIEVEMENTS } from "@/data/achievements";
import { SovereigntyStore } from "./SovereigntyStore";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";

export function EvolutionHub({ onClose }: { onClose: () => void }) {
  const { xp, level, rank, coins, levelProgress } = useGamification();
  const { unlockedIds } = useAchievementState();
  const [showStore, setShowStore] = useState(false);

  // New: use discovery tracking for the 'discipline_master' hidden achievement
  // This is a dev-only simulation logic or real behavior tracking
  // In a real app, this would be handled in an effect, but we can do it locally for now.

  const { progress, nextLevelXP, xpInCurrent, requiredForLevel } = levelProgress;
  
  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  // Filter out hidden achievements unless they are unlocked
  const visibleAchievements = ACHIEVEMENTS.filter(a => !a.hidden || unlockedIds.includes(a.id));

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div 
        className="relative w-full max-w-4xl h-[85vh] bg-[#080a16] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Left Side: Stats & Level */}
        <div className="w-full md:w-80 border-r border-white/5 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent p-8 flex flex-col items-center text-center">
          <div className="relative w-48 h-48 mb-6">
            {/* XP Ring */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="10"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="url(#levelGradient)"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 88}
                initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 88 * (1 - progress / 100),
                  opacity: [0.8, 1, 0.8],
                  scale: [1, 1.02, 1] 
                }}
                transition={{ 
                  strokeDashoffset: { duration: 1.5, ease: "easeOut" },
                  opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
                strokeLinecap="round"
                style={{ transformOrigin: 'center' }}
              />
              <defs>
                <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>

            {/* Level Avatar */}
            <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] mb-1">Rank</span>
              <span className="text-6xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">{level}</span>
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">{rank}</h2>
            <p className="text-xs text-white/40 font-medium">
              <span className="text-indigo-400">{xpInCurrent}</span> / {requiredForLevel} XP للمستوى القادم
            </p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => setShowStore(true)}
              className="w-full py-4 bg-amber-500 text-black rounded-3xl font-black text-sm flex items-center justify-center gap-3 hover:bg-amber-400 active:scale-95 transition-all shadow-[0_12px_24px_rgba(245,158,11,0.2)]"
            >
              <ShoppingCart className="w-5 h-5" />
              متجر السيادة
              <span className="px-2.5 py-0.5 bg-black/10 rounded-lg text-[11px] border border-black/5">{coins}</span>
            </button>
            <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5">
               <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">أنفق عملاتك لتطوير هويتك السيادية</p>
            </div>
          </div>
        </div>

        {/* Right Side: Badges & Exploration */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white/[0.01]">
          {/* Tabs/Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white">صالة المهام والأوسمة</h3>
            </div>
            <div className="text-xs font-bold text-white/30 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              تحقّق: <span className="text-emerald-400">{unlockedCount}</span> من <span className="text-white">{totalCount}</span>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="flex-1 overflow-y-auto p-8 pt-2 no-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleAchievements.map((badge) => {
                const isUnlocked = unlockedIds.includes(badge.id);
                return (
                  <motion.div 
                    key={badge.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className={`relative p-5 rounded-[2.5rem] border transition-all flex flex-col items-center text-center group ${
                      isUnlocked 
                      ? "bg-white/[0.03] border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.2)]" 
                      : "bg-black/20 border-white/5 opacity-40 grayscale"
                    }`}
                  >
                    <div className={`text-4xl mb-3 transition-transform group-hover:scale-110 duration-500 ${isUnlocked ? 'drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]' : ''}`}>
                      {badge.icon}
                    </div>
                    <span className={`text-[11px] font-black tracking-tight ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                      {badge.title}
                    </span>
                    
                    {!isUnlocked && badge.hidden && (
                      <div className="mt-2">
                        <Lock className="w-3 h-3 text-white/20" />
                      </div>
                    )}

                    {/* Tooltip on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#080a16]/95 flex flex-col items-center justify-center p-5 text-center rounded-[2.5rem] border border-white/20 z-20">
                      <h4 className="text-xs font-black text-white mb-2">{badge.title}</h4>
                      <p className="text-[10px] text-white/60 leading-relaxed font-medium">{badge.description}</p>
                      {isUnlocked && (
                        <div className="mt-3 text-[9px] text-emerald-400/60 font-black uppercase tracking-widest bg-emerald-400/5 px-2 py-1 rounded-lg">
                           تم الفتح
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Mystery Placeholder for hidden ones */}
              { ACHIEVEMENTS.length > visibleAchievements.length && (
                 <div className="p-5 rounded-[2.5rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center opacity-20">
                    <span className="text-2xl mb-2">❓</span>
                    <span className="text-[10px] font-black text-white/40">وسام سرّي</span>
                 </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Store Modal */}
      <AnimatePresence>
        {showStore && (
          <SovereigntyStore onClose={() => setShowStore(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
