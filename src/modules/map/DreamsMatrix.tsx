import type { FC } from "react";
import { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from '@/modules/map/dawayirIndex';
import { type MapNode } from "@/modules/map/mapTypes";
import { Sparkles, Activity, ShieldAlert, Target, Lock, AlertTriangle, Zap } from "lucide-react";
import { DreamNode, AlignmentZone } from "@/types/visualDreams";
import { AlignmentEngine } from "@/services/alignmentEngine";
import { fetchOverviewStats } from "@/services/admin/adminAnalytics";
import { fetchDreams } from "@/services/admin/adminDreams";
import { type OverviewStats } from "@/services/admin/adminTypes";
import { type Dream, type Knot } from "@/types/dreams";
import { usePredictiveState } from "@/domains/consciousness/store/predictive.store";
import { useGrowthState } from "@/domains/gamification/store/growth.store";
import { useFlowState } from "@/domains/journey/store/flow.store";

/**
 * 🌌 DREAMS MATRIX (THE MATRIX)
 */

const ZONE_CONFIG: Record<AlignmentZone, { radius: number; color: string; label: string; glow: string }> = {
    action: { radius: 15, color: "#0d9488", label: "الواحة (Oasis)", glow: "rgba(13, 148, 136, 0.4)" },
    planning: { radius: 28, color: "#d97706", label: "الأفق (Horizon)", glow: "rgba(217, 119, 6, 0.3)" },
    dreamland: { radius: 42, color: "#64748b", label: "السديم (Nebula)", glow: "rgba(100, 116, 139, 0.2)" }
};

interface MatrixNodeProps {
    node: DreamNode;
    index: number;
    total: number;
    isLocked?: boolean;
}

const MatrixNode: FC<MatrixNodeProps> = memo(({ node, index, total, isLocked }) => {
    const config = ZONE_CONFIG[node.zone];
    const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;

    const x = 50 + config.radius * Math.cos(angle);
    const y = 50 + config.radius * Math.sin(angle);

    const { isOverclocking, heatLevel } = useGrowthState();

    return (
        <motion.div
            className="absolute z-20"
            style={{
                top: `${y}%`,
                left: `${x}%`,
                transform: "translate(-50%, -50%)",
                filter: node.metadata?.isBlurred ? 'blur(4px) grayscale(1)' : 'none',
                opacity: node.metadata?.isBlurred ? 0.4 : 1,
                pointerEvents: node.metadata?.isBlurred ? 'none' : 'auto',
                boxShadow: isOverclocking ? `0 0 ${20 * heatLevel}px rgba(249, 115, 22, ${0.5 * heatLevel})` : 'none'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1, zIndex: 50 }}
        >
            <div
                className={`dream-orb relative flex items-center justify-center cursor-pointer group ${isLocked ? 'grayscale-[0.5]' : ''}`}
                style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--glass-bg)",
                    border: `1.5px solid ${isLocked ? '#ef4444' : config.color}40`,
                    boxShadow: isLocked ? `0 0 15px rgba(239, 68, 68, 0.3)` : `0 0 15px ${config.glow}`,
                    backdropFilter: "blur(8px)"
                }}
            >
                {isLocked ? (
                    <Lock className="w-4 h-4 text-rose-500 animate-pulse" />
                ) : (
                    <Sparkles className="w-5 h-5" style={{ color: config.color }} />
                )}

                {/* Hover Simulation Overlay */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
                    <div className={`p-4 rounded-2xl border backdrop-blur-xl space-y-3 shadow-2xl transition-all duration-300 ${isLocked ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-white/10'}`}>
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{node.title}</p>
                            {isLocked && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                        </div>

                        <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-500 dark:text-slate-400">التوافق (S):</span>
                            <span className={`${isLocked ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400'} font-mono`}>{(node.alignmentScore * 100).toFixed(0)}%</span>
                        </div>

                        {isLocked && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-300 font-bold bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 leading-relaxed">
                                ⚠️ نظام الحماية مفعل: توافق منخفض أو حالة طوارئ.
                            </div>
                        )}

                        {/* Knots Visualization */}
                        {node.knots && node.knots.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">العُقد (Knots):</p>
                                {node.knots.map((k: Knot) => (
                                    <div key={k.id} className="flex justify-between items-center text-[10px] font-bold bg-rose-500/5 px-2 py-1 rounded-lg border border-rose-500/15">
                                        <span className="text-rose-700 dark:text-rose-300 truncate max-w-[80px]">{k.label}</span>
                                        <span className="text-rose-600 font-black">-{k.severity}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
                            <div
                                className={`h-full ${isLocked ? 'bg-rose-500' : 'bg-teal-500'}`}
                                style={{ width: `${node.alignmentScore * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

export const DreamsMatrix: FC<{ dreams: Dream[]; stats: Partial<OverviewStats> }> = ({ dreams, stats }) => {
    // Determine Crisis Mode (Mood < 4 or high system stress)
    const isCrisis = useMemo(() => {
        const mood = stats.avgMood ?? 10;
        const capacity = stats.routingTelemetry?.cognitiveEffectiveness?.byCapacityBand?.[0]?.capacityBand;
        return mood < 4 || capacity === 'low_capacity';
    }, [stats]);

    const { isSurvivalMode } = usePredictiveState();

    const processedNodes = useMemo(() => {
        let filteredDreams = dreams;

        // 1. Resource Diversion: Hide complex goals in Survival Mode
        if (isSurvivalMode) {
            filteredDreams = dreams.filter(d =>
                (AlignmentEngine.calculateScore(d, stats) > 0.85) ||
                (d.momentumTasks && d.momentumTasks.some(t => !t.isCompleted))
            );
        }

        // 🚀 PROGRESSIVE DISCLOSURE: In Clean Room, only show the active Overclock Payload
        const { isCleanRoomActive } = useFlowState.getState();
        const { activePayloadIds } = useGrowthState.getState();
        if (isCleanRoomActive && activePayloadIds.length > 0) {
            filteredDreams = dreams.filter(d => activePayloadIds.includes(d.id));
        }

        return filteredDreams.map((d) => {
            const score = AlignmentEngine.calculateScore(d, stats);
            let zone: AlignmentZone = "dreamland";
            if (score > 0.85) zone = "action";
            else if (score > 0.65) zone = "planning";

            return {
                ...d,
                alignmentScore: score,
                zone,
                // 2. Visual Blur: Apply blur metadata if in Survival Mode
                metadata: {
                    ...d.metadata,
                    isBlurred: isSurvivalMode && zone === "dreamland"
                }
            } as unknown as DreamNode;
        });
    }, [dreams, stats, isSurvivalMode]);

    return (
        <div className={`relative w-full h-[500px] overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 border transition-all duration-1000 backdrop-blur-xl group ${isCrisis ? 'border-rose-500/30' : 'border-slate-200 dark:border-white/10'}`}>
            {/* Background Starfield/Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 dark:opacity-10" />
            <div className={`absolute inset-0 bg-radial-at-c transition-colors duration-1000 ${isCrisis ? 'from-rose-500/10' : 'from-teal-500/5'} to-transparent`} />

            {/* Orbital Rings */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
                {Object.entries(ZONE_CONFIG).map(([key, config]) => (
                    <circle
                        key={key}
                        cx="50"
                        cy="50"
                        r={config.radius}
                        fill="none"
                        stroke={isCrisis ? (key === 'action' ? '#ef4444' : '#f43f5e') : config.color}
                        strokeWidth="0.2"
                        strokeDasharray={isCrisis ? "2 1" : "1 2"}
                        className={`opacity-20 animate-[spin_60s_linear_infinite] transition-colors duration-1000 ${isCrisis ? 'opacity-40 animate-[spin_10s_linear_infinite]' : ''}`}
                        style={{ animationDirection: key === 'planning' ? 'reverse' : 'normal' }}
                    />
                ))}
            </svg>

            {/* Nodes */}
            <div className="absolute inset-0">
                {processedNodes.map((node, i) => (
                    <MatrixNode
                        key={node.id}
                        node={node}
                        index={i}
                        total={processedNodes.filter(n => n.zone === node.zone).length}
                        isLocked={AlignmentEngine.isLocked(node.alignmentScore, isCrisis)}
                    />
                ))}
            </div>

            {/* Matrix Metadata Overlay */}
            <div className="absolute bottom-6 right-6 flex gap-4">
                {isCrisis && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 backdrop-blur-md animate-pulse">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span className="text-[11px] text-rose-700 dark:text-rose-100 font-black tracking-widest uppercase">CRISIS VETO ACTIVE</span>
                    </div>
                )}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 backdrop-blur-md ${!isCrisis ? 'opacity-70' : ''}`}>
                    <Activity className={`w-4 h-4 ${isCrisis ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400'}`} />
                    <span className="text-[11px] text-slate-900 dark:text-white font-black tracking-widest uppercase">SYSTEM LIVE</span>
                </div>
            </div>
        </div>
    );
};
