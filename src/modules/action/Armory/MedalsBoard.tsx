import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock, CheckCircle2, Star } from 'lucide-react';
import { ACHIEVEMENTS, Achievement } from '@/data/achievements';
import { useAchievementState } from '@/domains/gamification/store/achievement.store';

const GRADIENTS = [
    "from-amber-400 to-yellow-600",
    "from-blue-400 to-cyan-600",
    "from-purple-400 to-[var(--soft-teal)]",
    "from-emerald-400 to-teal-600",
    "from-rose-400 to-red-600",
    "from-slate-300 to-slate-500",
    "from-fuchsia-400 to-pink-600",
    "from-lime-400 to-green-600",
];

export const MedalsBoard: React.FC = () => {
    const [selectedMedal, setSelectedMedal] = useState<Achievement | null>(null);
    const { unlockedIds } = useAchievementState();

    const isEarned = (id: string) => unlockedIds.includes(id);

    // Calculate progress
    const earnedCount = unlockedIds.length;
    const totalCount = ACHIEVEMENTS.length;
    const completionPercentage = Math.round((earnedCount / totalCount) * 100);

    return (
        <div className="p-5 md:p-6 bg-slate-900/60 rounded-3xl border border-slate-800 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg md:text-xl text-slate-200 font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                    خزاة اأسة اداات
                </h3>
                <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-white tracking-widest">{earnedCount} / {totalCount}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold tracking-widest">
                    <span>اتد اعا</span>
                    <span>{completionPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Medals Grid (Scrollable) */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar pb-2">
                {ACHIEVEMENTS.map((medal, index) => {
                    const earned = isEarned(medal.id);
                    const color = GRADIENTS[index % GRADIENTS.length];

                    return (
                        <motion.button
                            key={medal.id}
                            onClick={() => setSelectedMedal(medal)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative aspect-square rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all ${earned
                                ? "border-slate-700 bg-slate-800 shadow-lg"
                                : "border-slate-800/80 bg-slate-900/50 opacity-40 grayscale"
                                }`}
                        >
                            {earned ? (
                                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`} />
                            ) : (
                                <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-slate-500" />
                            )}

                            <div className={`p-2.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-white/10 ${earned ? "shadow-[0_0_15px_rgba(255,255,255,0.1)]" : ""
                                }`}>
                                <span className={`text-2xl leading-none block ${!earned ? 'opacity-50' : ''}`}>
                                    {medal.icon}
                                </span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Medal Detail */}
            <AnimatePresence mode="wait">
                {selectedMedal && (
                    <motion.div
                        key={selectedMedal.id}
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mt-5 p-4 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-inner overflow-hidden relative"
                    >
                        {/* Status watermark */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                            {isEarned(selectedMedal.id) ? (
                                <CheckCircle2 className="w-24 h-24 text-green-500" />
                            ) : (
                                <Lock className="w-24 h-24 text-slate-500" />
                            )}
                        </div>

                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`p-3.5 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${isEarned(selectedMedal.id)
                                ? `bg-gradient-to-br ${GRADIENTS[ACHIEVEMENTS.findIndex(a => a.id === selectedMedal.id) % GRADIENTS.length]} shadow-lg`
                                : 'bg-slate-700/50 grayscale'
                                }`}>
                                <span className="text-3xl leading-none">{selectedMedal.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-lg font-bold text-white">{selectedMedal.title}</h4>
                                    {isEarned(selectedMedal.id) && (
                                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                                            تسب
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed mb-2">
                                    {selectedMedal.description}
                                </p>

                                {isEarned(selectedMedal.id) ? (
                                    <p className="text-xs font-medium text-amber-200/90 border-r-2 border-amber-500/50 pr-3 mt-3">
                                        "{selectedMedal.hint}"
                                    </p>
                                ) : (
                                    <div className="mt-3 text-[11px] font-bold tracking-wide text-slate-400 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-700/80 w-fit flex items-center gap-2">
                                        <Lock className="w-3.5 h-3.5" />
                                        فتح اسا: استر ف اتد اتشاف
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


