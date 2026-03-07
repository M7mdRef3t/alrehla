/**
 * Group Pulse Room  غرفة ابض اجاع ️
 * ==========================================
 * اجة عرض "ازاج اجاع" ؤسسة أ اعائة بش ج.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Activity, ShieldCheck, Zap } from "lucide-react";

interface MoodData {
    mood: string;
    count: number;
    color: string;
}

const MOCK_GROUP_MOODS: MoodData[] = [
    { mood: "Energetic / تدف", count: 12, color: "bg-emerald-500" },
    { mood: "Stressed / ضغط", count: 8, color: "bg-amber-500" },
    { mood: "Exhausted / استزاف", count: 4, color: "bg-rose-500" },
    { mood: "Calm / دء", count: 15, color: "bg-teal-500" },
];

export const GroupPulseRoom: React.FC = () => {
    const total = useMemo(() => MOCK_GROUP_MOODS.reduce((acc, m) => acc + m.count, 0), []);

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-[var(--soft-teal)]" />
                        رادار بض اجعة
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">تزا ح زاج افر (باات جعة جة اة)</p>
                </div>
                <div className="flex gap-4">
                    <div className="glass-card px-4 py-2 border-white/5 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">{total} عُد شطة</span>
                    </div>
                </div>
            </header>

            {/* Heatmap Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-white/5 bg-slate-900/40">
                    <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--soft-teal)]" />
                        تزع اع احظ
                    </h3>

                    <div className="space-y-6">
                        {MOCK_GROUP_MOODS.map((m) => (
                            <div key={m.mood} className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-300">{m.mood}</span>
                                    <span className="text-slate-500">{Math.round((m.count / total) * 100)}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(m.count / total) * 100}%` }}
                                        className={`h-full ${m.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6 border-white/5 bg-slate-900/40 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[var(--soft-teal)]/10 flex items-center justify-center mb-4 animate-pulse">
                        <Zap className="w-10 h-10 text-[var(--soft-teal)]" />
                    </div>
                    <h3 className="font-bold text-white mb-2">تصة جارفس جعة</h3>
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                        "ا ضغط ترا فDEPARTMENT-X. ص بتفع جسة 'صت ضضاء' جاعة دة 10 دائ رفع ست ادء اعا."
                    </p>
                </div>
            </section>

            {/* Safety Protocol Info */}
            <footer className="p-4 rounded-xl bg-[var(--soft-teal)]/5 border border-[var(--soft-teal)] text-center">
                <p className="text-[10px] text-[var(--soft-teal)] uppercase font-black tracking-widest">
                    Privacy Protocol: Data is end-to-end encrypted and aggregated. No individual identities are exposed.
                </p>
            </footer>
        </div>
    );
};



