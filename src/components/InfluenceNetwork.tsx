import { FC, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Network, Info, Activity, Zap } from "lucide-react";
import { supabase } from "../services/supabaseClient";

interface Node {
    id: string;
    label: string;
    type: 'circle' | 'state';
    x?: number;
    y?: number;
}

interface Edge {
    source: string;
    target: string;
    strength: number;
    confidence: number;
    currentStrength?: number;
    drift?: number;
}

export const InfluenceNetwork: FC = () => {
    const [data, setData] = useState<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });
    const [isDriftMode, setIsDriftMode] = useState(false);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const fetchMap = async (compare = false) => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch(`/api/influence-network?compare=${compare}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const map = await res.json();

                // Position logic (Center nodes around states)
                const centerX = 160;
                const centerY = 160;
                const radius = 120;

                const positionedNodes = map.nodes.map((n: Node, i: number) => {
                    const angle = (i / map.nodes.length) * 2 * Math.PI;
                    return {
                        ...n,
                        x: centerX + radius * Math.cos(angle),
                        y: centerY + radius * Math.sin(angle)
                    };
                });

                setData({ nodes: positionedNodes, edges: map.edges });
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMap(isDriftMode);
    }, [isDriftMode]);

    if (data.nodes.length === 0) {
        return (
            <div className="w-full max-w-[38rem] mx-auto mt-6 p-12 rounded-[2.5rem] bg-slate-900/30 border border-white/5 text-center">
                <div className="p-4 rounded-full bg-white/5 w-fit mx-auto mb-4">
                    <Activity className="w-6 h-6 text-slate-500 animate-pulse" />
                </div>
                <h3 className="text-white font-black text-sm mb-2">جار استشاف اأاط</h3>
                <p className="text-slate-500 text-[11px] font-bold">اسست ف حاة صت تح حاا. أ ا اداتا تت (٧ أا بض) خرطة اتأثر تظر ا.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[38rem] mx-auto mt-6 p-6 rounded-[2.5rem] bg-slate-900/30 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Network className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-black text-white leading-tight">
                            {isDriftMode ? 'حر ااحراف از' : 'خرطة اتأثر اإدرا'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {isDriftMode ? 'Temporal Pattern Drift' : 'Cognitive Influence Map'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsDriftMode(!isDriftMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isDriftMode
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/5'
                        }`}
                >
                    <Activity className={`w-3.5 h-3.5 ${isDriftMode ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-black uppercase tracking-tight">رادار اتطر</span>
                </button>
            </div>

            <div className="relative aspect-square flex items-center justify-center bg-black/20 rounded-[2rem] border border-white/5 shadow-inner" ref={containerRef}>
                <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    {/* Edges */}
                    {data.edges.map((edge: Edge, i) => {
                        const sourceNode = data.nodes.find(n => n.id === edge.source);
                        const targetNode = data.nodes.find(n => n.id === edge.target);
                        if (!sourceNode || !targetNode) return null;

                        const strength = isDriftMode ? (edge.currentStrength ?? edge.strength) : edge.strength;
                        const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
                        const color = strength > 0 ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)";
                        const highlightColor = strength > 0 ? "#10b981" : "#ef4444";

                        return (
                            <motion.g key={`edge-group-${i}`}>
                                <motion.line
                                    x1={sourceNode.x}
                                    y1={sourceNode.y}
                                    x2={targetNode.x}
                                    y2={targetNode.y}
                                    stroke={isHighlighted ? highlightColor : color}
                                    strokeWidth={Math.abs(strength) * 8}
                                    strokeDasharray="4 4"
                                    animate={{
                                        strokeDashoffset: [0, strength > 0 ? -20 : 20],
                                        opacity: isHighlighted ? 1 : 0.3
                                    }}
                                    transition={{
                                        strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" },
                                        opacity: { duration: 0.3 }
                                    }}
                                />
                                {isDriftMode && Math.abs(edge.drift ?? 0) > 0.05 && (
                                    <motion.text
                                        x={(sourceNode.x! + targetNode.x!) / 2}
                                        y={(sourceNode.y! + targetNode.y!) / 2 - 10}
                                        textAnchor="middle"
                                        fill={(edge.drift ?? 0) > 0 ? '#10b981' : '#ef4444'}
                                        fontSize="10"
                                        fontWeight="bold"
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        {(edge.drift ?? 0) > 0 ? '' : ''}
                                    </motion.text>
                                )}
                            </motion.g>
                        );
                    })}

                    {/* Nodes - Same as before but with morphing positioning if needed */}
                    {data.nodes.map((node) => (
                        <motion.g
                            key={node.id}
                            layout
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onHoverStart={() => setHoveredNode(node.id)}
                            onHoverEnd={() => setHoveredNode(null)}
                            className="cursor-pointer"
                        >
                            <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r={22}
                                fill="transparent"
                                stroke={node.type === 'state' ? '#818cf8' : '#334155'}
                                strokeWidth="2"
                                strokeDasharray="100"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                style={{ opacity: 0.2 }}
                            />

                            <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r={18}
                                fill={node.type === 'state' ? '#4f46e5' : '#1e293b'}
                                stroke={hoveredNode === node.id ? '#fff' : 'rgba(255,255,255,0.1)'}
                                strokeWidth="2"
                                className="transition-all duration-300"
                            />

                            <text
                                x={node.x}
                                y={node.y}
                                textAnchor="middle"
                                dy=".3em"
                                fill="#fff"
                                fontSize="8"
                                fontWeight="900"
                                pointerEvents="none"
                            >
                                {node.label}
                            </text>
                        </motion.g>
                    ))}
                </svg>

                {/* Legend / Overlay */}
                <div className="absolute bottom-4 right-4 text-right">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <span className="text-[8px] font-black text-slate-400">تأثر إجاب</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                        <span className="text-[8px] font-black text-slate-400">تأثر سب</span>
                    </div>
                </div>
            </div>

            {/* Insight Snippet */}
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${isDriftMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {isDriftMode ? < Zap className="w-4 h-4 animate-bounce" /> : <Info className="w-4 h-4" />}
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] font-black text-white mb-1">
                            {isDriftMode ? 'تح سار اتح' : 'ارؤة احاة '}
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            {data.edges.length === 0
                                ? "اأاط احاة  تص ست داة إحصائة اف (Confidence < 0.3). استر ف تسج ابض تفع حر اربط."
                                : isDriftMode
                                    ? "اأس بتضح اعاات ا اتحست () أ ساءت () ارة بآخر طة. د ف تطر اح ش جرد صرة حظة."
                                    : `اشبة بتضح إ ${data.edges[0]?.source} ا أ تأثر ${data.edges[0]?.strength > 0 ? 'إجاب' : 'سب'} حاا. ااة حا ادار بتث ثة اسست ف اتح د.`
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Noise effect */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
        </div>
    );
};
