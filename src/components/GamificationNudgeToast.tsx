/* eslint-disable react-refresh/only-export-components */
import React, { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, ShieldAlert, HeartPulse } from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { useAppOverlayState } from '../state/appOverlayState';

export type NudgeType = 'encouragement' | 'points' | 'danger';

interface NudgeData {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  value?: number;
}

// Temporary global event bus for nudges
const nudgeSubscribers: ((nudge: NudgeData) => void)[] = [];
export const triggerGamificationNudge = (nudge: Omit<NudgeData, 'id'>) => {
  const fullNudge = { ...nudge, id: Math.random().toString(36).substring(7) };
  nudgeSubscribers.forEach(sub => sub(fullNudge));
};

export const GamificationNudgeToast: FC = () => {
  const { flags, closeOverlay } = useAppOverlayState();
  const isVisible = flags.nudgeToast;
  const [activeNudge, setActiveNudge] = useState<NudgeData | null>(null);

  // Subscribe to nudge events
  useEffect(() => {
    const handler = (nudge: NudgeData) => {
      setActiveNudge(nudge);
      
      // Play specific sounds based on nudge type
      if (nudge.type === 'points') soundManager.playSuccess();
      else if (nudge.type === 'danger') soundManager.playError();
      else soundManager.playClick();

      // Auto dismiss
      setTimeout(() => setActiveNudge(null), nudge.type === 'danger' ? 8000 : 5000);
    };

    nudgeSubscribers.push(handler);
    return () => {
      const index = nudgeSubscribers.indexOf(handler);
      if (index > -1) nudgeSubscribers.splice(index, 1);
    };
  }, []);

  // For Demo purposes: If overlay "nudgeToast" is triggered via state directly
  useEffect(() => {
    if (isVisible && !activeNudge) {
      // Show a random demo nudge
      const types: NudgeType[] = ['encouragement', 'points', 'danger'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let title = '';
      let message = '';
      
      if (type === 'encouragement') {
        title = 'أنت على الطريق الصحيح!';
        message = 'لقد حافظت على هدوئك في التفاعل الأخير، استمر في هذا التحكم الرائع.';
      } else if (type === 'points') {
        title = 'تم اكتساب نقاط حكمة';
        message = 'إضافة ممتازة لمستودع معرفتك الذاتية.';
      } else {
        title = 'تحذير تدهور';
        message = 'لقد لاحظنا تكرار نمط تفاعل سلبي. خذ لحظة تأمل الآن.';
      }

      triggerGamificationNudge({
        type,
        title,
        message,
        value: type === 'points' ? 150 : undefined
      });
      
      // Close the system overlay so it can be re-triggered
      setTimeout(() => closeOverlay('nudgeToast'), 100);
    }
  }, [isVisible, closeOverlay, activeNudge]);

  return (
    <AnimatePresence>
      {activeNudge && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95, filter: 'blur(4px)' }}
          className="fixed top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4"
          dir="rtl"
        >
          {/* Nudge Content */}
          <div className={`
            relative w-full max-w-sm pointer-events-auto rounded-2xl shadow-xl overflow-hidden
            backdrop-blur-xl border flex items-center p-4 gap-4
            ${activeNudge.type === 'encouragement' 
              ? 'bg-emerald-900/80 border-emerald-500/30' 
              : activeNudge.type === 'points'
                ? 'bg-indigo-900/80 border-indigo-500/30'
                : 'bg-rose-900/80 border-rose-500/30'}
          `}>
            
            {/* Ambient Background Glow based on type */}
            <div className={`absolute top-0 right-10 w-24 h-24 blur-3xl opacity-20 pointer-events-none ${
              activeNudge.type === 'encouragement' ? 'bg-emerald-400' :
              activeNudge.type === 'points' ? 'bg-indigo-400' : 'bg-rose-400'
            }`} />

            {/* Icon Shrine */}
            <div className={`
              shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg
              ${activeNudge.type === 'encouragement'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : activeNudge.type === 'points'
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/50'}
            `}>
              {activeNudge.type === 'encouragement' && <HeartPulse className="w-6 h-6 animate-pulse" />}
              {activeNudge.type === 'points' && <Star className="w-6 h-6 fill-indigo-400" />}
              {activeNudge.type === 'danger' && <ShieldAlert className="w-6 h-6" />}
            </div>

            {/* Text Payload */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
                {activeNudge.title}
                {activeNudge.type === 'points' && activeNudge.value && (
                  <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300">
                    +{activeNudge.value} XP
                  </span>
                )}
              </h4>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed line-clamp-2">
                {activeNudge.message}
              </p>
            </div>

            {/* Close / Action */}
            <button 
              onClick={() => setActiveNudge(null)}
              className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Progress Bar Timer */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: activeNudge.type === 'danger' ? 8 : 5, ease: 'linear' }}
              className={`absolute bottom-0 left-0 right-0 h-1 ${
                activeNudge.type === 'encouragement' ? 'bg-emerald-500' :
                activeNudge.type === 'points' ? 'bg-indigo-500' : 'bg-rose-500'
              }`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
