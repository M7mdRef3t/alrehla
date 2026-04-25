import type { FC } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronUp } from "lucide-react";
import { useGamification } from "@/domains/gamification";
import { useMapState } from '@/modules/map/dawayirIndex';

const XP_PER_LEVEL = 1000;

export const LevelWidget: FC = () => {
    const { xp, level, badges, recentLevelUp, clearLevelUpState, awardBadge } = useGamification();
    const nodes = useMapState(s => s.nodes);

    // Check and award badges automatically
    useEffect(() => {
        // Protector Badge: Has detached at least 1 person
        const hasDetached = nodes.some(n => n.isDetached);
        if (hasDetached) {
            awardBadge("protector_1", "حامي الحدود", "قمت بتجميد وعزل أول شخص مستنزف لحماية طاقتك.", "🛡️");
        }

        // Zero Circle Badge: Has archived at least 1 person
        const hasArchived = nodes.some(n => n.isNodeArchived);
        if (hasArchived) {
            awardBadge("zero_circle_1", "رائد المدار الصفري", "قمت بنقل أول علاقة إلى الأرشيف الحي (المدار الصفري).", "🧊");
        }

        // Power Bank Badge: Has assigned at least 1 power bank
        const hasPowerBank = nodes.some(n => n.isPowerBank);
        if (hasPowerBank) {
            awardBadge("power_bank_1", "مولد الطوارئ", "قمت بتحديد أول بطارية طوارئ بشرية للجوء إليها وقت النزيف.", "🔋");
        }
    }, [nodes, awardBadge]);

    // Handle level up animation
    useEffect(() => {
        if (recentLevelUp) {
            const t = setTimeout(() => {
                clearLevelUpState();
            }, 5000);
            return () => clearTimeout(t);
        }
    }, [recentLevelUp, clearLevelUpState]);

    const progressPct = Math.min(100, ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

    return (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            {/* Level Up Overlay */}
            <AnimatePresence>
                {recentLevelUp && (
                    <motion.div
                        className="absolute inset-0 bg-indigo-500/20 backdrop-blur-sm z-20 flex flex-col items-center justify-center border border-indigo-500/50 rounded-2xl"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-white text-center"
                        >
                            <ChevronUp className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                            <h3 className="text-2xl font-black text-indigo-300">ارتقاء مستوى!</h3>
                            <p className="text-sm font-bold text-slate-200">أنت الآن في المستوى {level}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row gap-6 relative z-10">

                {/* Level Stats */}
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                <span className="text-2xl font-black text-indigo-400">{level}</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-200">مركز الوعي الطاقي</h3>
                                <p className="text-xs text-slate-400 mt-1">المستوى الحالي</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-slate-100">{xp}</span>
                            <span className="text-xs text-indigo-400 ml-1">نقطة</span>
                        </div>
                    </div>

                    <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 1, type: "spring" }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>{Math.floor(xp / XP_PER_LEVEL) * XP_PER_LEVEL}</span>
                        <span>{(Math.floor(xp / XP_PER_LEVEL) + 1) * XP_PER_LEVEL}</span>
                    </div>
                </div>

                {/* Badges Display */}
                {badges.length > 0 && (
                    <div className="md:w-1/3 flex flex-col justify-center border-t md:border-t-0 md:border-l md:border-slate-800 pt-4 md:pt-0 pl-0 md:pl-4">
                        <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            أوسمة الاستحقاق
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {badges.slice(0, 3).map(badge => (
                                <div
                                    key={badge.id}
                                    className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shadow-inner"
                                    title={`${badge.name}\n${badge.description}`}
                                >
                                    {badge.icon}
                                </div>
                            ))}
                            {badges.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-slate-800/50 border border-slate-700/50 border-dashed flex items-center justify-center text-[10px] font-bold text-slate-400">
                                    +{badges.length - 3}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
