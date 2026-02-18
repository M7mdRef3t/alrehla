import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, X, AlertTriangle, ShieldCheck, Clock, Shield } from "lucide-react";
import { useMapState } from "../state/mapState";

// Mock data for contact duration if not in state yet
// In a real app, this would be saved in the node data
interface NodeRadarData {
    nodeId: string;
    contactHoursPerWeek: number;
}

interface RadarShieldProps {
    isOpen: boolean;
    onClose: () => void;
}

export const RadarShield: FC<RadarShieldProps> = ({ isOpen, onClose }) => {
    const nodes = useMapState((s) => s.nodes);
    // Local state to simulate contact duration updates
    const [radarData, setRadarData] = useState<Record<string, number>>({});
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Default contact hours based on ring if not set
    const getContactHours = (nodeId: string, ring: string) => {
        if (radarData[nodeId] !== undefined) return radarData[nodeId];
        // Default assumptions
        return ring === "inner" ? 10 : ring === "middle" ? 5 : 2;
    };

    const selectedNode = useMemo(
        () => nodes.find((n) => n.id === selectedNodeId),
        [nodes, selectedNodeId]
    );

    const handleUpdateDuration = (hours: number) => {
        if (selectedNodeId) {
            setRadarData((prev) => ({ ...prev, [selectedNodeId]: hours }));
        }
    };

    const getDistanceAndColor = (hours: number) => {
        // More hours = Closer (More Dangerous if toxic, but here we visualize "Proximity")
        // Let's assume High Contact with "Draining" people is bad.
        // For now, we visualize purely based on Time.
        // Red Zone (Critical): > 15 hours/week
        // Yellow Zone (Warning): 5-15 hours/week
        // Green Zone (Safe): < 5 hours/week

        if (hours > 15) return { zone: "Critical", color: "text-rose-500", bg: "bg-rose-500", distance: 20 }; // Close
        if (hours > 5) return { zone: "Warning", color: "text-amber-500", bg: "bg-amber-500", distance: 50 }; // Middle
        return { zone: "Safe", color: "text-emerald-500", bg: "bg-emerald-500", distance: 85 }; // Far
    };

    const calculatePosition = (index: number, total: number, distancePercent: number) => {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
        // distancePercent is 0-100, mapping to radius 0-140px
        const radius = (distancePercent / 100) * 140;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        };
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/90 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-2">
                                <Radar className="w-5 h-5 text-teal-500 animate-pulse" />
                                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                                    رادار المسافة (Proximity Radar)
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Radar View */}
                            <div className="relative flex-1 bg-slate-950 min-h-[350px] flex items-center justify-center overflow-hidden">
                                {/* Radar Grids (Concentric Circles) */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Critical Zone (Center) */}
                                    <div className="absolute w-[80px] h-[80px] rounded-full border border-rose-900/30 bg-rose-900/10"></div>
                                    {/* Warning Zone */}
                                    <div className="absolute w-[200px] h-[200px] rounded-full border border-amber-900/30 bg-amber-900/5"></div>
                                    {/* Safe Zone */}
                                    <div className="absolute w-[340px] h-[340px] rounded-full border border-emerald-900/30 bg-emerald-900/5"></div>

                                    {/* Crosshairs */}
                                    <div className="absolute w-full h-[1px] bg-slate-800/50"></div>
                                    <div className="absolute h-full w-[1px] bg-slate-800/50"></div>

                                    {/* Commander (Center) */}
                                    <div className="relative z-10 w-4 h-4 rounded-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]">
                                        <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-75"></div>
                                    </div>
                                </div>

                                {/* Nodes (Blips) */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {nodes.map((node, i) => {
                                        const hours = getContactHours(node.id, node.ring);
                                        const { color, bg, distance } = getDistanceAndColor(hours);
                                        const pos = calculatePosition(i, nodes.length, distance);

                                        return (
                                            <motion.button
                                                key={node.id}
                                                layout
                                                onClick={() => setSelectedNodeId(node.id)}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                                                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center ${bg} shadow-lg cursor-pointer pointer-events-auto transition-transform hover:scale-125 border-2 border-slate-900 z-20`}
                                                title={node.label}
                                            >
                                                <span className="text-[10px] font-bold text-slate-900 truncate max-w-full px-0.5">
                                                    {node.label.charAt(0)}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {/* Scanner Line Animation */}
                                <motion.div
                                    className="absolute w-[50%] h-[50%] bg-gradient-to-l from-teal-500/10 to-transparent top-1/2 left-1/2 origin-top-left"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    style={{ borderRadius: "100% 0 0 0" }} // Quarter circle ish
                                />
                            </div>

                            {/* Sidebar / Controls */}
                            <div className="w-full md:w-80 border-t md:border-t-0 md:border-r border-slate-800 bg-slate-900/80 p-5 flex flex-col gap-4 overflow-y-auto z-30">
                                {selectedNode ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <span className={`w-3 h-3 rounded-full ${getDistanceAndColor(getContactHours(selectedNode.id, selectedNode.ring)).bg}`} />
                                                {selectedNode.label}
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                المنطقة: {getDistanceAndColor(getContactHours(selectedNode.id, selectedNode.ring)).zone}
                                            </p>
                                        </div>

                                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm text-slate-300 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-teal-500" />
                                                    مدة التواصل (أسبوعياً)
                                                </label>
                                                <span className="text-sm font-bold text-white">
                                                    {getContactHours(selectedNode.id, selectedNode.ring)} ساعة
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="40"
                                                step="1"
                                                value={getContactHours(selectedNode.id, selectedNode.ring)}
                                                onChange={(e) => handleUpdateDuration(parseInt(e.target.value))}
                                                className="w-full accent-teal-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                                                <span>Safe (0h)</span>
                                                <span>Warning (5h)</span>
                                                <span>Critical (15h+)</span>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                                            <p className="text-xs text-blue-200 leading-relaxed">
                                                <Shield className="w-3 h-3 inline-block ml-1" />
                                                نصيحة تكتيكية:
                                                {getContactHours(selectedNode.id, selectedNode.ring) > 15
                                                    ? " هذا الهدف يستهلك مواردك. فعّل بروتوكول 'Silence' فوراً لتقليل المدة."
                                                    : " المسافة آمنة. حافظ على هذا التمركز."}
                                            </p>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-2">
                                        <Radar className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">اضغط على أي هدف في الرادار لتحليل المسافة وتعديل التمركز.</p>
                                    </div>
                                )}

                                {selectedNode && (
                                    <button
                                        onClick={() => setSelectedNodeId(null)}
                                        className="mt-auto w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                                    >
                                        إغلاق التحليل
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-center">
                            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-mono">
                                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> CRITICAL (&gt;15h)</div>
                                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> WARNING (5-15h)</div>
                                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> SAFE (&lt;5h)</div>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
