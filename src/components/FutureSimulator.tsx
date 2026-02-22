/**
 * Future Simulator — محاكي المستقبل 🔮
 * ==========================================
 * يسمح للمستخدم برؤية "خيال" لمستقبله بناءً على التغييرات المقترحة.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Telescope, Sparkles, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { simulateHypotheticalState } from "../services/propheticEngine";
import type { MapNode } from "../modules/map/mapTypes";

interface FutureSimulatorProps {
    nodes: MapNode[];
    onExitSimulation: () => void;
}

export const FutureSimulator: React.FC<FutureSimulatorProps> = ({ nodes, onExitSimulation }) => {
    const projection = useMemo(() => simulateHypotheticalState(nodes), [nodes]);

    const getStatusColor = (state: string) => {
        switch (state) {
            case "Burnout": return "text-rose-400";
            case "Stagnation": return "text-amber-400";
            case "Thriving": return "text-emerald-400";
            default: return "text-teal-400";
        }
    };

    const getStatusBg = (state: string) => {
        switch (state) {
            case "Burnout": return "from-rose-500/20 to-slate-900/40";
            case "Stagnation": return "from-amber-500/20 to-slate-900/40";
            case "Thriving": return "from-emerald-500/20 to-slate-900/40";
            default: return "from-teal-500/20 to-slate-900/40";
        }
    };

    return (
        <motion.div
            className="absolute inset-x-4 top-20 bottom-24 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Simulation Banner */}
            <div className="flex flex-col items-center gap-4 pointer-events-auto">
                <motion.div
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl bg-gradient-to-br ${getStatusBg(projection.predictedState)}`}
                    layout
                >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Telescope className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">محاكاة المستقبل (بعد سنة)</span>
                            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                                <Sparkles className="w-2.5 h-2.5" />
                                DREAM_STATE
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <h2 className={`text-xl font-bold ${getStatusColor(projection.predictedState)}`}>
                                {projection.predictedState === "Burnout" ? "تحذير: احتراق نفسي" :
                                    projection.predictedState === "Stagnation" ? "حالة: ركود طاقة" : "حالة: ازدهار عصبي"}
                            </h2>
                            <div className="w-px h-4 bg-white/10" />
                            <div className="flex items-center gap-1.5">
                                <span className="text-white/70 text-sm font-bold">{projection.healthScore}%</span>
                                {projection.healthScore < 50 ? <TrendingDown className="w-4 h-4 text-rose-400" /> : <TrendingUp className="w-4 h-4 text-emerald-400" />}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onExitSimulation}
                        className="ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors"
                    >
                        إغلاق المحاكي
                    </button>
                </motion.div>

                {/* Predictive Message */}
                <motion.div
                    className="max-w-md w-full p-4 rounded-xl bg-slate-900/80 border border-white/5 backdrop-blur-md shadow-lg text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="text-sm text-slate-200 leading-relaxed font-medium rtl">
                        {projection.description}
                    </p>
                </motion.div>

                {/* Intervention Protocol (Phase 22) */}
                {projection.predictedState === "Burnout" && (
                    <motion.div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[10px] font-bold text-rose-300 animate-pulse"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        بروتوكول الطوارئ مُقترح: "مهمة انتحارية" لقطع الاستنزاف فوراً
                    </motion.div>
                )}
            </div>

            {/* Ghost Grid Overlay (Optional Visual) */}
            <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
                <svg width="100%" height="100%" className="text-white">
                    <defs>
                        <pattern id="ghost-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="1.5" fill="currentColor" fillOpacity="0.2" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#ghost-grid)" />
                </svg>
            </div>
        </motion.div>
    );
};
