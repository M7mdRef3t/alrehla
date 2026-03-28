import type { FC } from "react";
import { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from "../../state/mapState";
import { type MapNode } from "../../modules/map/mapTypes";
import { Sparkles, Activity, ShieldAlert, Target, Lock, AlertTriangle, Zap } from "lucide-react";
import { DreamNode, AlignmentZone } from "../../types/visualDreams";
import { AlignmentEngine } from "../../services/alignmentEngine";
import { fetchOverviewStats, fetchDreams, type OverviewStats } from "../../services/adminApi";
import { type Dream, type Knot } from "../../types/dreams";
import { usePredictiveState } from "../../state/predictiveState";
import { useGrowthState } from "../../state/growthState";
import { useFlowState } from "../../state/flowState";

/**
 * 🌌 DREAMS MATRIX (THE MATRIX)
 */

const ZONE_CONFIG: Record<AlignmentZone, { radius: number; color: string; label: string; glow: string }> = {
    action: { radius: 15, color: "#2dd4bf", label: "الواحة (Oasis)", glow: "rgba(45, 212, 191, 0.4)" },
    planning: { radius: 28, color: "#fbbf24", label: "الأفق (Horizon)", glow: "rgba(251, 191, 36, 0.3)" },
    dreamland: { radius: 42, color: "#94a3b8", label: "السديم (Nebula)", glow: "rgba(148, 163, 184, 0.2)" }
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
                    background: isLocked ? "rgba(30, 41, 59, 0.8)" : "rgba(15, 23, 42, 0.6)",
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
                    <div className={`admin-glass-card p-3 space-y-2 ${isLocked ? 'border-rose-500/50 bg-rose-950/20' : 'border-teal-500/30'}`}>
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-slate-100">{node.title}</p>
                            {isLocked && <ShieldAlert className="w-3 h-3 text-rose-500" />}
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400">التوافق (S):</span>
                            <span className={`${isLocked ? 'text-rose-400' : 'text-teal-400'} font-mono`}>{(node.alignmentScore * 100).toFixed(0)}%</span>
                        </div>

                        {isLocked && (
                            <div className="text-[9px] text-rose-300 font-bold bg-rose-500/10 p-1 rounded border border-rose-500/20">
                                ⚠️ نظام الحماية مفعل: توافق منخفض أو حالة طوارئ.
                            </div>
                        )}

                        {/* Knots Visualization */}
                        {node.knots && node.knots.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter">العُقد (Knots):</p>
                                {node.knots.map((k: Knot) => (
                                    <div key={k.id} className="flex justify-between items-center text-[9px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                        <span className="text-rose-300 truncate max-w-[80px]">{k.label}</span>
                                        <span className="text-rose-500 font-bold">-{k.severity}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Root Causes (RCA) */}
                        {node.relatedNodeIds && node.relatedNodeIds.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[9px] text-amber-400 font-bold uppercase tracking-tighter">ثقوب الطاقة (RCA):</p>
                                <div className="flex flex-wrap gap-1">
                                    {node.relatedNodeIds.map(nodeId => {
                                        const relatedNode = useMapState.getState().nodes.find((n: MapNode) => n.id === nodeId);
                                        return (
                                            <span key={nodeId} className="text-[8px] bg-amber-500/10 text-amber-300 px-1 rounded border border-amber-500/20">
                                                {relatedNode?.label || 'Unknown'}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Momentum Tasks for Locked Goals */}
                        {isLocked && node.momentumTasks && node.momentumTasks.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[9px] text-teal-400 font-bold uppercase tracking-tighter">مُولد الزخم (مهام سهلة):</p>
                                <div className="space-y-1">
                                    {node.momentumTasks.slice(0, 2).map(task => (
                                        <div key={task.id} className="text-[8px] bg-teal-500/5 text-teal-200 border border-teal-500/10 px-2 py-1 rounded flex justify-between items-center">
                                            <span>{task.label}</span>
                                            <Zap className={`w-2.5 h-2.5 ${task.isCompleted ? 'text-teal-400' : 'text-slate-600'}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                            <div
                                className={`h-full ${isLocked ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]'}`}
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
        <div className={`relative w-full h-[500px] overflow-hidden rounded-3xl bg-slate-950/40 border transition-colors duration-1000 backdrop-blur-xl group ${isCrisis ? 'border-rose-500/30' : 'border-slate-800/50'}`}>
            {/* Background Starfield/Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className={`absolute inset-0 bg-radial-at-c transition-colors duration-1000 ${isCrisis ? 'from-rose-500/10' : 'from-teal-500/5'} to-transparent`} />

            {/* Orbital Rings */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
                {Object.entries(ZONE_CONFIG).map(([key, config]) => (
                    <circle
                        key={key}
                        cx="50"
                        cy="50"
                        r={Number.isFinite(config.radius) ? config.radius : 0}
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
            <div className="absolute bottom-4 right-4 flex gap-4">
                {isCrisis && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-900/60 border border-rose-500/50 backdrop-blur-md animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] text-rose-100 font-bold tracking-widest uppercase">CRISIS VETO ACTIVE</span>
                    </div>
                )}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md ${!isCrisis ? 'opacity-50' : ''}`}>
                    <Activity className={`w-3.5 h-3.5 ${isCrisis ? 'text-rose-500' : 'text-teal-400'}`} />
                    <span className="text-[10px] text-slate-300 font-bold tracking-widest uppercase">SYSTEM LIVE</span>
                </div>
            </div>
        </div>
    );
};
