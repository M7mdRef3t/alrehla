/**
 * Group Pulse Room — غرفة النبض الجماعي 🫀
 * ==========================================
 * واجهة عرض "المزاج الجماعي" لمؤسسة أو العائلة بشكل مجمع.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Activity, ShieldCheck, Zap } from "lucide-react";
import { soundManager } from "@/services/soundManager";

interface MoodData {
    mood: string;
    count: number;
    color: string;
}

const MOCK_GROUP_MOODS: MoodData[] = [
    { mood: "Energetic / متدفق", count: 12, color: "bg-emerald-500" },
    { mood: "Stressed / ضغط", count: 8, color: "bg-amber-500" },
    { mood: "Exhausted / استنزاف", count: 4, color: "bg-rose-500" },
    { mood: "Calm / هدوء", count: 15, color: "bg-teal-500" },
];

export const GroupPulseRoom: React.FC = () => {
    const total = useMemo(() => MOCK_GROUP_MOODS.reduce((acc, m) => acc + m.count, 0), []);
    const [isResonating, setIsResonating] = React.useState(false);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIsResonating(true);
            setTimeout(() => setIsResonating(false), 5000);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        soundManager.startAmbientCommunity();
        return () => {
            soundManager.stopAmbientCommunity();
        };
    }, []);

    return (
        <div className="p-6 space-y-8 max-w-4xl mx-auto relative overflow-hidden">
            {/* ── Pulse Echo: Collective Heartbeat ── */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isResonating ? 'opacity-40' : 'opacity-20'}`}>
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {[1, 2, 3].map((i) => (
                        <motion.circle
                            key={i}
                            cx="50"
                            cy="50"
                            r="10"
                            fill="none"
                            stroke={isResonating ? "rgba(45,212,191,0.5)" : (i === 1 ? "rgba(45,212,191,0.3)" : "rgba(129,140,248,0.2)")}
                            strokeWidth={isResonating ? "1" : "0.5"}
                            animate={{
                                r: [10, 80],
                                opacity: [0.6, 0],
                                strokeWidth: [1.5, 0]
                            }}
                            transition={{
                                duration: isResonating ? 4 : 8,
                                repeat: Infinity,
                                delay: isResonating ? 0 : i * 2.5,
                                ease: "easeOut"
                            }}
                        />
                    ))}
                </svg>
                {isResonating && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--soft-teal)] animate-pulse">
                            Resonance Active // رنين متزامن
                        </p>
                    </motion.div>
                )}
            </div>

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-[var(--soft-teal)]" />
                        رادار نبض المجموعة
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">ملخص لحظي لمزاج الفريق (بيانات مجمعة للواجهة التجريبية)</p>
                </div>
                <div className="flex gap-4">
                    <div className="glass-card px-4 py-2 border-white/5 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">{total} عُضو نشطة</span>
                    </div>
                </div>
            </header>

            {/* Heatmap Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-white/5 bg-slate-900/40">
                    <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[var(--soft-teal)]" />
                        توزيع المزاج اللحظي
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
                    <h3 className="font-bold text-white mb-2">توصية جارفيس الجماعية</h3>
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                        "في ضغط متراكم في DEPARTMENT-X. نوصي بتفعيل جلسة 'صمت وضوضاء' جماعية لمدة 10 دقايق لرفع مستوى الهدوء العام."
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



