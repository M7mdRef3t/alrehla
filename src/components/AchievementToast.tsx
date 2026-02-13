import type { FC } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAchievementById } from "../data/achievements";
import { useAchievementState } from "../state/achievementState";

function playAchievementSuccessSound(): void {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  try {
    const context = new AudioContextCtor();
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    gain.connect(context.destination);

    const first = context.createOscillator();
    first.type = "sine";
    first.frequency.setValueAtTime(740, now);
    first.connect(gain);
    first.start(now);
    first.stop(now + 0.11);

    const second = context.createOscillator();
    second.type = "sine";
    second.frequency.setValueAtTime(988, now + 0.12);
    second.connect(gain);
    second.start(now + 0.12);
    second.stop(now + 0.25);

    window.setTimeout(() => {
      void context.close();
    }, 420);
  } catch {
    // تجاهل أي خطأ تشغيل صوتي (مثل سياسات المتصفح)
  }
}

/** تهنئة صغيرة تظهر عند فتح إنجاز جديد */
export const AchievementToast: FC = () => {
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const clearLastNew = useAchievementState((s) => s.clearLastNew);
  const achievement = lastNewAchievementId ? getAchievementById(lastNewAchievementId) : null;

  useEffect(() => {
    if (!lastNewAchievementId) return;
    playAchievementSuccessSound();
    const t = setTimeout(clearLastNew, 4000);
    return () => clearTimeout(t);
  }, [lastNewAchievementId, clearLastNew]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-full mx-4 px-4 py-3 rounded-2xl bg-amber-100 dark:bg-amber-900/80 border-2 border-amber-300 dark:border-amber-700 text-center"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
        >
          <p className="text-2xl mb-1" aria-hidden>{achievement.icon}</p>
          <p className="font-bold text-amber-900 dark:text-amber-100">إنجاز جديد!</p>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{achievement.title}</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{achievement.hint}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
