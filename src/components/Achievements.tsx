import type { FC } from "react";
import { motion } from "framer-motion";
import { X, Trophy, Lock } from "lucide-react";
import { ACHIEVEMENTS } from "../data/achievements";
import { useAchievementState } from "../state/achievementState";

interface AchievementsProps {
  onClose: () => void;
}

export const Achievements: FC<AchievementsProps> = ({ onClose }) => {
  const unlockedIds = useAchievementState((s) => s.unlockedIds);
  const totalPoints = useAchievementState((s) => s.totalPoints);

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
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-600"
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
        <p className="px-4 pb-2 text-sm font-semibold text-amber-700 dark:text-amber-300 text-right">
          نقاطك: {totalPoints.toLocaleString("ar-EG")}
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
