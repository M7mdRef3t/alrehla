import { FC, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Info } from "lucide-react";
import { useMapState } from "@/state/mapState";
import { calculateEntropy } from "@/services/predictiveEngine";
import { VaultService } from "@/services/truthVault";
import { useGamificationState } from "@/services/gamificationEngine";

/**
 * Sovereignty Oracle — أوراكل السيادة 🛡️✨
 * =====================================
 * المكون المسؤول عن تقييم قوة القائد وسيطرته على مجاله.
 */

export const SovereigntyOracle: FC = () => {
    const nodes = useMapState((s) => s.nodes);
    const xp = useGamificationState((s) => s.xp);

    const metrics = useMemo(() => {
        const entropy = calculateEntropy();
        const vaultRecords = VaultService.getRecords().length;

        // حساب الميزان (Green vs Red/Yellow)
        const greenCount = nodes.filter(n => n.ring === "green").length;

        const balanceFactor = nodes.length === 0 ? 1 : greenCount / nodes.length;
        const entropyFactor = Math.max(0, 1 - entropy.entropyScore / 100);
        const growthFactor = Math.min(1, xp / 5000) + (vaultRecords * 0.05);

        const score = Math.round(((balanceFactor * 0.4) + (entropyFactor * 0.4) + (growthFactor * 0.2)) * 100);

        return {
            score,
            status: score > 80 ? "سيادة مطلقة" : score > 50 ? "تحت السيطرة" : "اختراق أمني",
            color: score > 80 ? "emerald" : score > 50 ? "amber" : "rose",
            chaosScore: entropy.entropyScore,
            level: Math.floor(xp / 100)
        };
    }, [nodes, xp]);

    const suggestedActions = useMemo(() => {
        if (metrics.score <= 50) {
            return [
                "اقفل أي مواجهة جديدة لمدة 24 ساعة واشتغل على التنفس أو التهدئة.",
                "حرّك أعلى علاقة استنزاف للمدار الأحمر فورًا.",
                "اختَر خطوة واحدة فقط النهارده ونفّذها بدون فتح ملفات جديدة."
            ];
        }
        if (metrics.score <= 80) {
            return [
                "حدّد علاقة واحدة محورية وابدأ معاها تدخل تدريجي.",
                "نفّذ دقيقة شحن واحدة قبل أي قرار مهم.",
                "راجع حدودك في موقف واحد وفعّل جملة جاهزة لـ\"لا\"."
            ];
        }
        return [
            "ثبت مكاسبك: استمر على نفس نمط الحدود لمدة 3 أيام.",
            "انقل علاقة واحدة من الأصفر للأخضر بخطوة تواصل واعية.",
            "استثمر الطاقة في مهمة نمو جديدة بدل إطفاء حرائق."
        ];
    }, [metrics.score]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-3xl border backdrop-blur-md relative overflow-hidden group border-${metrics.color}-500/20 bg-${metrics.color}-500/5`}
        >
            {/* Background Decorative Element */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${metrics.color}-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${metrics.color}-500/20 text-${metrics.color}-400`}>
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white tracking-widest">مؤشر السيادة</h3>
                        <p className={`text-[10px] font-bold text-${metrics.color}-400/80`}>{metrics.status}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-white">{metrics.score}%</div>
                    <p className="text-[10px] text-slate-500">معدل التناغم</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.score}%` }}
                    className={`h-full bg-gradient-to-r ${metrics.color === "emerald" ? "from-emerald-600 to-teal-400" :
                            metrics.color === "amber" ? "from-amber-600 to-yellow-400" :
                                "from-rose-600 to-pink-400"
                        }`}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] text-slate-400">مؤشر الفوضى</span>
                    </div>
                    <div className="text-sm font-bold text-slate-200">{metrics.chaosScore}%</div>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Info className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-slate-400">السيادة القتالية</span>
                    </div>
                    <div className="text-sm font-bold text-slate-200">المستوى {metrics.level}</div>
                </div>
            </div>

            <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-300 mb-2">إجراءات مقترحة حسب حالتك</p>
                <ul className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                    {suggestedActions.map((action, idx) => (
                        <li key={idx}>• {action}</li>
                    ))}
                </ul>
            </div>
        </motion.div>
    );
};
