import type { FC } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAchievementById } from "@/data/achievements";
import { useAchievementState } from "@/state/achievementState";
import { soundManager } from "@/services/soundManager";

/** تهنئة سيادية تظهر عند فتح إنجاز جديد — احتفال كوني كامل */
export const AchievementToast: FC = () => {
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const clearLastNew = useAchievementState((s) => s.clearLastNew);
  const requestOpenAchievements = useAchievementState((s) => s.requestOpenAchievements);
  const achievement = lastNewAchievementId ? getAchievementById(lastNewAchievementId) : null;

  useEffect(() => {
    if (!lastNewAchievementId) return;
    soundManager.playEffect('celebration');
    const t = setTimeout(clearLastNew, 5000);
    return () => clearTimeout(t);
  }, [lastNewAchievementId, clearLastNew]);

  return (
    <AnimatePresence>
      {achievement && (
        <>
          {/* Sovereign Celebration: Cosmic Burst Overlay */}
          <motion.div
            className="fixed inset-0 z-[58] pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Primary Burst */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 2],
                opacity: [0, 0.8, 0],
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div 
                className="w-[100vmax] h-[100vmax] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 60%)" }}
              />
            </motion.div>

            {/* Expansive Rays */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.div
                key={i}
                initial={{ width: 0, opacity: 0 }}
                animate={{ 
                  width: ["0%", "150%"],
                  opacity: [0, 0.5, 0]
                }}
                transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 h-1 origin-left"
                style={{ 
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  background: "linear-gradient(90deg, rgba(255,215,0,0.8), transparent)" 
                }}
              />
            ))}
          </motion.div>

          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.88))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,215,0,0.25)",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,215,0,0.1), inset 0 1px 0 rgba(255,255,255,0.06)"
            }}
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            role="button"
            aria-label="افتح كل إنجازاتك"
            onClick={requestOpenAchievements}
          >
            {/* Golden glow bar */}
            <div
              className="h-1 rounded-t-[20px]"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.8), transparent)" }}
            />

            <div className="px-4 py-4 text-center">
              <p className="text-4xl mb-2" aria-hidden>{achievement.icon}</p>
              <p
                className="text-xs font-black uppercase tracking-widest mb-1"
                style={{ color: "rgba(255,215,0,1)", letterSpacing: "0.2em" }}
              >
                إنجاز سيادي جديد!
              </p>
              <h3 className="font-black text-white text-xl">{achievement.title}</h3>
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                {achievement.description}
              </p>
              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[10px] font-bold" style={{ color: "rgba(255,215,0,0.5)" }}>
                  اضغط لتوثيق هذا الأثر في سجلّ رحلتك ←
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
