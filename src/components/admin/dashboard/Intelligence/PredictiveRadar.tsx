
import React, { useEffect } from 'react';
import { usePredictiveState } from '../../../../state/predictiveState';
import { calculateEntropy } from '../../../../services/predictiveEngine';
import { Shield, Zap, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const PredictiveRadar: React.FC = () => {
    const { crashProbability, forecast, recommendations, lastCheckAt } = usePredictiveState();
    const entropy = calculateEntropy();

    return (
        <div className="flex flex-col gap-4">
            {/* Entropy HUD */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-6 flex flex-col items-center justify-center gap-2 border-indigo-500/20 bg-indigo-500/5">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Zap className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Entropy Score</span>
                    </div>
                    <span className="text-4xl font-black text-white">{entropy.entropyScore}%</span>
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
                        Factor: {entropy.primaryFactor.replace('_', ' ')}
                    </div>
                </div>

                <div className={`glass-card p-6 flex flex-col items-center justify-center gap-2 border-rose-500/20 ${crashProbability > 0.7 ? 'bg-rose-500/10' : 'bg-slate-900/40'}`}>
                    <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Crash Prob.</span>
                    </div>
                    <span className="text-4xl font-black text-white">{Math.round(crashProbability * 100)}%</span>
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter uppercase">
                        {crashProbability > 0.8 ? 'Critical Hazard' : 'Stable Orbit'}
                    </div>
                </div>
            </div>

            {/* Slang Forecast */}
            <div className="glass-card p-6 border-white/5 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-teal-400 mb-2">
                        <Shield className="w-4 h-4" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Radar Insight</h4>
                    </div>
                    <p className="text-sm font-bold text-white leading-relaxed" dir="rtl">
                        {forecast}
                    </p>
                </div>
                {/* Background Decoration */}
                <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                    <Shield className="w-24 h-24 text-white" />
                </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
                <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 px-1">Tactical Maneuvers</h5>
                {recommendations.map((rec, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3"
                    >
                        <div className="w-1 h-1 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                        <span className="text-[11px] text-slate-300 font-medium leading-tight" dir="rtl">
                            {rec}
                        </span>
                    </motion.div>
                ))}
            </div>

            <div className="text-[8px] text-slate-600 font-mono text-center uppercase tracking-widest mt-2">
                Last Trajectory Sync: {new Date(lastCheckAt).toLocaleTimeString()}
            </div>
        </div>
    );
};
