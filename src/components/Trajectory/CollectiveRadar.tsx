/* eslint-disable */
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { AwarenessVector } from '../../services/trajectoryEngine';
import { SwarmMetrics } from '../../services/hiveEngine';
import { motion } from 'framer-motion';

interface CollectiveRadarProps {
    userVector: AwarenessVector;
    swarmMetrics: SwarmMetrics;
    title?: string;
}

export const CollectiveRadar: React.FC<CollectiveRadarProps> = ({ userVector, swarmMetrics, title = "Collective Growth" }) => {
    const { mean_vector: mv, outlier_vector: ov } = swarmMetrics;

    const data = [
        { subject: 'Symmetry (RS)', A: userVector.rs, B: mv.rs, C: ov.rs, fullMark: 1 },
        { subject: 'Velocity (AV)', A: userVector.av, B: mv.av, C: ov.av, fullMark: 1 },
        { subject: 'Integrity (BI)', A: userVector.bi, B: mv.bi, C: ov.bi, fullMark: 1 },
        { subject: 'Entropy (SE)', A: userVector.se, B: mv.se, C: ov.se, fullMark: 1 },
        { subject: 'Bandwidth (CB)', A: userVector.cb, B: mv.cb, C: ov.cb, fullMark: 1 },
    ];

    return (
        <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-6">
                <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{title}</h5>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold">You</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[10px] text-slate-400 uppercase">Swarm Avg</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] text-slate-400 uppercase text-amber-500 font-bold">The Elite</span>
                    </div>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 1]}
                            tick={false}
                            axisLine={false}
                        />

                        {/* Swarm Mean Area */}
                        <Radar
                            name="Swarm Avg"
                            dataKey="B"
                            stroke="#6366f1"
                            fill="#6366f1"
                            fillOpacity={0.1}
                        />

                        {/* Top Performers Area */}
                        <Radar
                            name="The Elite"
                            dataKey="C"
                            stroke="#fbbf24"
                            fill="#fbbf24"
                            fillOpacity={0.2}
                        />

                        {/* User Vector Area */}
                        <Radar
                            name="Your Vector"
                            dataKey="A"
                            stroke="#22d3ee"
                            fill="#22d3ee"
                            fillOpacity={0.5}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <div>
                    <span className="block text-[8px] text-slate-500 uppercase tracking-tighter">Swarm Momentum</span>
                    <span className="text-sm font-black text-emerald-400">{swarmMetrics.swarm_momentum.toFixed(2)}x</span>
                </div>
                <div>
                    <span className="block text-[8px] text-slate-500 uppercase tracking-tighter">Active Sovereigns</span>
                    <span className="text-sm font-black text-white">{swarmMetrics.active_sovereigns}</span>
                </div>
            </div>
        </div>
    );
};
