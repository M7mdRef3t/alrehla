import React from 'react';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

interface AwarenessHeatmapProps {
    initial?: Partial<Record<'rs' | 'av' | 'bi' | 'se', number>>;
    current?: Partial<Record<'rs' | 'av' | 'bi' | 'se', number>>;
    title?: string;
}

export const AwarenessHeatmap: React.FC<AwarenessHeatmapProps> = ({ initial, current, title = "Awareness Delta" }) => {
    const data = [
        { subject: 'RS', initial: (initial?.rs || 0) * 100, current: (current?.rs || 0) * 100 },
        { subject: 'AV', initial: (initial?.av || 0) * 100, current: (current?.av || 0) * 100 },
        { subject: 'BI', initial: (initial?.bi || 0) * 100, current: (current?.bi || 0) * 100 },
        { subject: 'SE', initial: (initial?.se || 0) * 100, current: (current?.se || 0) * 100 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative p-6 overflow-hidden bg-slate-900/60 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl"
        >
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-cyan-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-[var(--soft-teal)]/10 blur-3xl rounded-full" />

            <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {title}
                </h4>
                <div className="flex space-x-4">
                    <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-[var(--soft-teal)]/50" />
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Baseline</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-[8px] font-bold text-slate-300 uppercase">current</span>
                    </div>
                </div>
            </div>

            <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                        />
                        <Radar
                            name="Baseline"
                            dataKey="initial"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.15}
                            strokeWidth={1}
                            strokeDasharray="4 4"
                        />
                        <Radar
                            name="Current"
                            dataKey="current"
                            stroke="#22d3ee"
                            fill="#22d3ee"
                            fillOpacity={0.4}
                            strokeWidth={2}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {data.map((d) => (
                    <div key={d.subject} className="p-2 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[8px] font-black text-slate-600 uppercase mb-1">{d.subject}</p>
                        <p className="text-xs font-black text-cyan-400">
                            {Math.round(d.current)}%
                        </p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};


