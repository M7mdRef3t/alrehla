import { FC, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { analyzeEnergyDrain, simulateFutureSelf, simulateHypotheticalState } from "@/services/propheticEngine";
import { Clock } from "lucide-react";
import { useMapState } from "@/domains/dawayir/store/map.store";

function stateLabel(value: "Burnout" | "Stagnation" | "Thriving"): string {
    if (value === "Burnout") return "إا";
    if (value === "Stagnation") return "رد";
    return "ازدار";
}

export const OutcomeSimulator: FC = () => {
    const nodes = useMapState((s) => s.nodes);
    const prediction = useMemo(() => simulateFutureSelf(), []);
    const [comparison, setComparison] = useState<null | {
        projectedState: string;
        projectedScore: number;
        delta: number;
        removedLabel: string;
    }>(null);

    const runComparison = () => {
        if (nodes.length === 0) {
            setComparison(null);
            return;
        }

        const ranked = nodes
            .map((node) => ({ node, drain: analyzeEnergyDrain(node) }))
            .sort((a, b) => b.drain.drainScore - a.drain.drainScore);

        const topThreat = ranked[0];
        if (!topThreat) {
            setComparison(null);
            return;
        }

        const hypotheticalNodes = nodes.filter((n) => n.id !== topThreat.node.id);
        const hypothetical = simulateHypotheticalState(hypotheticalNodes);

        setComparison({
            projectedState: stateLabel(hypothetical.predictedState),
            projectedScore: hypothetical.healthScore,
            delta: hypothetical.healthScore - prediction.healthScore,
            removedLabel: topThreat.node.label || "اعاة اأثر استزافا"
        });
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-lg mx-auto overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--soft-teal)]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-[var(--soft-teal)]" />
                <h3 className="text-lg font-bold text-white tracking-wide">
                    حا استب <span className="text-xs opacity-50 font-mono ml-2 border border-white/20 px-1.5 py-0.5 rounded">تجرب</span>
                </h3>
            </div>

            <div className="flex flex-col items-center text-center mb-8">
                <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                        <circle
                            cx="48" cy="48" r="40"
                            stroke={prediction.predictedState === "Burnout" ? "#f43f5e" : prediction.predictedState === "Stagnation" ? "#fbbf24" : "#34d399"}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * prediction.healthScore / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="text-2xl font-black text-white">{prediction.healthScore}%</div>
                </div>

                <h4 className={`text-xl font-bold mb-2 ${prediction.predictedState === "Burnout" ? "text-rose-400" :
                        prediction.predictedState === "Stagnation" ? "text-amber-400" : "text-emerald-400"
                    }`}>
                    {stateLabel(prediction.predictedState)}
                </h4>
                <p className="text-sm text-slate-400 font-mono mb-4">احاة اتعة  {prediction.timeline}</p>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-right">
                    <p className="text-sm text-slate-200 leading-relaxed">
                        <span className="text-[var(--soft-teal)] font-bold ml-2">تع اتح:</span>
                        {prediction.description}
                    </p>
                </div>
            </div>

            <div className="text-center">
                <button
                    type="button"
                    onClick={runComparison}
                    className="text-xs text-slate-500 hover:text-white transition-colors underline decoration-slate-700"
                >
                    تشغ تح اارة
                </button>
            </div>

            {comparison && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-right"
                >
                    <p className="text-xs text-emerald-300 mb-2">سار بعد ت تأثر: {comparison.removedLabel}</p>
                    <p className="text-sm text-slate-100">
                        احاة اتعة: <span className="font-bold text-emerald-300">{comparison.projectedState}</span>
                    </p>
                    <p className="text-sm text-slate-100">
                        ادرجة اتعة: <span className="font-bold text-emerald-300">{comparison.projectedScore}%</span>
                    </p>
                    <p className="text-sm text-slate-200">
                        فر اتحس: <span className="font-bold text-emerald-300">{comparison.delta > 0 ? `+${comparison.delta}` : comparison.delta}%</span>
                    </p>
                </motion.div>
            )}
        </div>
    );
};



