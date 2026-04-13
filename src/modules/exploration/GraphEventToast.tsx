import { FC, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapState } from '@/modules/map/dawayirIndex';
import { runAutomagicLoop, type GraphEvent, type Prescription } from "@/services/automagicLoop";
import { type MapNode } from "../map/mapTypes";
import { Zap, X } from "lucide-react";

interface ActivePrescription {
    event: GraphEvent;
    prescription: Prescription;
}

export const GraphEventToast: FC = () => {
    const nodes = useMapState((s) => s.nodes);
    const prevNodesRef = useRef<MapNode[]>([]);
    const [active, setActive] = useState<ActivePrescription | null>(null);

    useEffect(() => {
        const prevNodes = prevNodesRef.current;

        // Only run if we have previous state to compare against
        if (prevNodes.length > 0 && nodes.length > 0) {
            const { events, prescriptions } = runAutomagicLoop(prevNodes, nodes);

            if (events.length > 0) {
                // Show the most impactful event (first one)
                setActive({ event: events[0], prescription: prescriptions[0] });

                // Auto-dismiss after 6 seconds
                const timer = setTimeout(() => setActive(null), 6000);
                return () => clearTimeout(timer);
            }
        }

        // Update ref AFTER comparison
        prevNodesRef.current = nodes;
    }, [nodes]);

    const getEventColor = (type: GraphEvent["type"]) => {
        switch (type) {
            case "MAJOR_DETACHMENT": return "from-rose-500/20 to-rose-900/10 border-rose-500/30";
            case "ORBIT_SHIFT_OUTWARD": return "from-amber-500/20 to-amber-900/10 border-amber-500/30";
            case "RECONCILIATION": return "from-emerald-500/20 to-emerald-900/10 border-emerald-500/30";
            case "ORBIT_SHIFT_INWARD": return "from-blue-500/20 to-blue-900/10 border-blue-500/30";
            case "VAMPIRE_DETECTED": return "from-purple-500/20 to-purple-900/10 border-purple-500/30";
            default: return "from-slate-500/20 to-slate-900/10 border-slate-500/30";
        }
    };

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    key={active.event.timestamp}
                    initial={{ opacity: 0, y: 80, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[90vw] max-w-sm
            bg-gradient-to-br ${getEventColor(active.event.type)}
            border backdrop-blur-xl rounded-2xl p-4 shadow-2xl`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                                Automagic Response
                            </span>
                        </div>
                        <button
                            onClick={() => setActive(null)}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Event Label */}
                    <div className="text-xs text-slate-400 mb-2 font-mono">
                        {active.event.nodeLabel}: {active.event.fromRing} → {active.event.toRing}
                    </div>

                    {/* Prescription Nudge */}
                    <p className="text-base font-bold text-white leading-relaxed mb-3">
                        {active.prescription.nudge}
                    </p>

                    {/* Theme Tag */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/10 border border-white/20 text-slate-300 px-2 py-0.5 rounded-full">
                            {active.prescription.contentTheme}
                        </span>
                        {active.prescription.xpReward > 0 && (
                            <span className="text-xs bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full font-bold">
                                +{active.prescription.xpReward} XP
                            </span>
                        )}
                    </div>

                    {/* Progress Bar (auto-dismiss indicator) */}
                    <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-white/30 rounded-b-2xl"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 6, ease: "linear" }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
