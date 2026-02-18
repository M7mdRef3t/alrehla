import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Lock, Shield, Zap, Archive, Target } from 'lucide-react';
import { Medal } from '../../types/tactical';

const medalsData = [
    {
        type: "First Strike",
        title: "خطوة القائد الأولى",
        description: "مُنح للقائد تقديراً لشجاعته في مواجهة حقل الألغام الأول.",
        icon: Target,
        color: "from-amber-400 to-yellow-600",
        requirement: "أتمم مهمة الاستطلاع الأولى"
    },
    {
        type: "Steel Shield",
        title: "الدرع الفولاذي",
        description: "قدرت ترفض بوضوح وتحمي حدودك من غير ما تفتح ثغرة أمنية.",
        icon: Shield,
        color: "from-slate-300 to-slate-500",
        requirement: "استخدم 'درع لا' 10 مرات"
    },
    {
        type: "Noise Sniper",
        title: "قناص الضجيج",
        description: "رادارك نجح في رصد المشتتات وعملت لها 'تشويش إشارة' بنجاح.",
        icon: Zap,
        color: "from-blue-400 to-cyan-600",
        requirement: "تفعيل 'كاتم الصوت' 5 مرات"
    },
    {
        type: "Safe Withdrawal",
        title: "الانسحاب الآمن",
        description: "قدرت تنهي اشتباك مستنزف وتوفر مواردك النفسية للي يستحق.",
        icon: Archive,
        color: "from-purple-400 to-indigo-600",
        requirement: "نقل جبهة واحدة للأرشيف"
    },
];

export const MedalsBoard: React.FC<{ earnedMedals: Medal[] }> = ({ earnedMedals }) => {
    const [selectedMedal, setSelectedMedal] = useState<typeof medalsData[0] | null>(null);

    const isEarned = (type: string) => earnedMedals.some(m => m.type === type);

    return (
        <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800">
            <h3 className="text-xl text-slate-200 font-bold mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                خزانة الأوسمة
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {medalsData.map((medal) => {
                    const earned = isEarned(medal.type);
                    const Icon = medal.icon;

                    return (
                        <motion.button
                            key={medal.type}
                            onClick={() => setSelectedMedal(medal)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative aspect-square rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all ${earned
                                    ? "border-slate-700 bg-slate-800 shadow-lg"
                                    : "border-slate-800 bg-slate-900/50 opacity-50 grayscale"
                                }`}
                        >
                            {earned ? (
                                <div className={`absolute inset-0 bg-gradient-to-br ${medal.color} opacity-20`} />
                            ) : (
                                <Lock className="absolute top-2 right-2 w-4 h-4 text-slate-600" />
                            )}

                            <div className={`p-4 rounded-full bg-slate-900/80 backdrop-blur-sm border border-white/10 ${earned ? "shadow-[0_0_20px_rgba(255,255,255,0.1)]" : ""
                                }`}>
                                <Icon className={`w-8 h-8 ${earned ? "text-white" : "text-slate-600"}`} />
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Medal Detail */}
            {selectedMedal && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700"
                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${selectedMedal.color}`}>
                            <selectedMedal.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">{selectedMedal.title}</h4>
                            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                                {selectedMedal.description}
                            </p>
                            {!isEarned(selectedMedal.type) && (
                                <div className="mt-3 text-xs font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded w-fit">
                                    🔒 {selectedMedal.requirement}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
