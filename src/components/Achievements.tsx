import type { FC } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Lock } from "lucide-react";
import { ACHIEVEMENTS } from "../data/achievements";
import { useAchievementState } from "../state/achievementState";
import { getAchievementById } from "../data/achievements";

interface AchievementsProps {
  onClose: () => void;
}

export const Achievements: FC<AchievementsProps> = ({ onClose }) => {
  const unlockedIds = useAchievementState((s) => s.unlockedIds);

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-title"
    >
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-600"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-600 shrink-0">
          <h2 id="achievements-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            إنجازاتك
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 text-right">
          {unlockedCount === totalCount
            ? "ماشاء الله! خلصت كل الإنجازات 🎉"
            : `حققتَ ${unlockedCount} من ${totalCount} — كمل الرحلة عشان تفتح الباقي`}
        </p>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedIds.includes(a.id);
            return (
              <motion.div
                key={a.id}
                className={`rounded-xl border-2 p-4 text-right transition-colors ${
                  unlocked
                    ? "bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600 opacity-75"
                }`}
                initial={false}
                animate={{ opacity: unlocked ? 1 : 0.85 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0" aria-hidden>
                    {unlocked ? a.icon : "🔒"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {a.title}
                      {!unlocked && <Lock className="w-4 h-4 text-slate-400" />}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      {a.description}
                    </p>
                    {unlocked && a.hint && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 font-medium">
                        {a.hint}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

/** تهنئة صغيرة تظهر عند فتح إنجاز جديد */
export const AchievementToast: FC = () => {
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const clearLastNew = useAchievementState((s) => s.clearLastNew);
  const achievement = lastNewAchievementId ? getAchievementById(lastNewAchievementId) : null;

  useEffect(() => {
    if (!lastNewAchievementId) return;
    const t = setTimeout(clearLastNew, 4000);
    return () => clearTimeout(t);
  }, [lastNewAchievementId, clearLastNew]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-full mx-4 px-4 py-3 rounded-2xl bg-amber-100 dark:bg-amber-900/80 border-2 border-amber-300 dark:border-amber-700 shadow-lg text-center"
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
