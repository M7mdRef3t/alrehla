import type { FC } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import {
    loadStreak,
    getStreakMessage,
    getStreakEmoji,
    isStreakAtRisk,
} from "../services/streakSystem";

/* ══════════════════════════════════════════
   STREAK WIDGET — عدّاد الـ Streak اليومي
   يظهر في الـ Dashboard
   ══════════════════════════════════════════ */

interface StreakWidgetProps {
    compact?: boolean;
}

export const StreakWidget: FC<StreakWidgetProps> = ({ compact = false }) => {
    const streak = loadStreak();
    const atRisk = isStreakAtRisk();
    const emoji = getStreakEmoji(streak.currentStreak);
    const message = getStreakMessage(streak.currentStreak);

    if (compact) {
        return (
            <motion.div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                    background: atRisk
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(245,158,11,0.12)",
                    border: `1px solid ${atRisk ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.25)"}`,
                }}
                animate={atRisk ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <span className="text-sm">{emoji}</span>
                <span className="text-xs font-bold"
                    style={{ color: atRisk ? "#f87171" : "#fbbf24" }}>
                    {streak.currentStreak}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="rounded-2xl p-4"
            style={{
                background: atRisk
                    ? "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))"
                    : "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))",
                border: `1px solid ${atRisk ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.2)"}`,
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Flame icon with pulse if at risk */}
                    <motion.div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{
                            background: atRisk ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                        }}
                        animate={atRisk ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    >
                        {emoji}
                    </motion.div>

                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-black"
                                style={{ color: atRisk ? "#f87171" : "#fbbf24" }}>
                                {streak.currentStreak}
                            </span>
                            <span className="text-sm text-slate-400 font-medium">يوم</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{message}</p>
                    </div>
                </div>

                {/* Longest streak badge */}
                {streak.longestStreak > 0 && (
                    <div className="text-center">
                        <p className="text-xs text-slate-500">الأعلى</p>
                        <p className="text-sm font-bold text-slate-300">{streak.longestStreak}</p>
                    </div>
                )}
            </div>

            {/* At-risk warning */}
            {atRisk && streak.currentStreak > 0 && (
                <motion.div
                    className="mt-3 p-2.5 rounded-xl text-center"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-xs text-red-400 font-semibold">
                        ⚠️ الـ Streak في خطر! سجّل دخولك اليوم عشان ما تخسرش {streak.currentStreak} يوم
                    </p>
                </motion.div>
            )}

            {/* Progress dots for week */}
            <div className="flex gap-1.5 mt-3 justify-center">
                {Array.from({ length: 7 }, (_, i) => {
                    const isActive = i < Math.min(streak.currentStreak % 7 || (streak.currentStreak > 0 ? 7 : 0), 7);
                    return (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{
                                background: isActive
                                    ? (atRisk ? "#f87171" : "#fbbf24")
                                    : "rgba(255,255,255,0.1)",
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        />
                    );
                })}
            </div>
        </motion.div>
    );
};
