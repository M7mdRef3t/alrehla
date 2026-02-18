import { FC, useMemo } from "react";
import { motion } from "framer-motion";
import { simulateFutureSelf } from "../services/propheticEngine";
import { TrendingUp, TrendingDown, AlertCircle, Clock } from "lucide-react";

export const OutcomeSimulator: FC = () => {
    const prediction = useMemo(() => simulateFutureSelf(), []);

    return (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 max-w-lg mx-auto overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white tracking-wide">
                    Future Simulator <span className="text-xs opacity-50 font-mono ml-2 border border-white/20 px-1.5 py-0.5 rounded">BETA</span>
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
                    {prediction.predictedState.toUpperCase()}
                </h4>
                <p className="text-sm text-slate-400 font-mono mb-4">Projected State • {prediction.timeline}</p>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left">
                    <p className="text-sm text-slate-200 leading-relaxed">
                        <span className="text-indigo-400 font-bold mr-2">AI PROPHECY:</span>
                        {prediction.description}
                    </p>
                </div>
            </div>

            <div className="text-center">
                <button className="text-xs text-slate-500 hover:text-white transition-colors underline decoration-slate-700">
                    Run Comparison Analysis
                </button>
            </div>
        </div>
    );
};
