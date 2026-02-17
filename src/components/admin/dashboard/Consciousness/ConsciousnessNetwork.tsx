import type { FC } from "react";
import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Node {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    type: "core" | "pulse" | "bridge";
    label?: string;
}

const NODE_LABELS = [
    "الوعي الذاتي", "المسار الجذري", "بوصلة المشاعر", "تحليل النوايا",
    "الذاكرة الجمعية", "التناغم", "الحدس", "التأمل", "القرار",
    "التواصل", "التعاطف", "الإدراك", "المصفوفة", "الجسر العصبي"
];

export const ConsciousnessNetwork: FC = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize Simulation
    useEffect(() => {
        const nodeCount = 30;
        const initialNodes: Node[] = Array.from({ length: nodeCount }).map((_, i) => ({
            id: i,
            x: 20 + Math.random() * 60, // Center cluster a bit
            y: 20 + Math.random() * 60,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            radius: Math.random() > 0.8 ? 6 : 3,
            type: Math.random() > 0.9 ? "core" : Math.random() > 0.6 ? "bridge" : "pulse",
            label: Math.random() > 0.7 ? NODE_LABELS[Math.floor(Math.random() * NODE_LABELS.length)] : undefined
        }));
        setNodes(initialNodes);
    }, []);

    // Animation Loop
    useEffect(() => {
        let animationFrameId: number;

        const animate = () => {
            setNodes((prevNodes) => {
                return prevNodes.map((node) => {
                    let { x, y, vx, vy } = node;

                    // Update Position
                    x += vx;
                    y += vy;

                    // Bounce off walls with damping
                    if (x < 5 || x > 95) vx *= -1;
                    if (y < 5 || y > 95) vy *= -1;

                    // Mouse Interaction (Magnetic Pull could be added here if ref tracked mouse)

                    return { ...node, x, y, vx, vy };
                });
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Generate Connections efficiently
    const connections = useMemo(() => {
        const lines: JSX.Element[] = [];
        nodes.forEach((node, i) => {
            // Only connect to nearby nodes to simulate neural pathways
            for (let j = i + 1; j < nodes.length; j++) {
                const other = nodes[j];
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const distSquared = dx * dx + dy * dy;

                // Threshold for connection (approx 15% distance)
                if (distSquared < 250) {
                    const opacity = Math.max(0.1, 1 - Math.sqrt(distSquared) / 15);
                    lines.push(
                        <motion.line
                            key={`${node.id}-${other.id}`}
                            x1={`${node.x}%`} y1={`${node.y}%`}
                            x2={`${other.x}%`} y2={`${other.y}%`}
                            stroke={node.type === "core" || other.type === "core" ? "rgba(168,85,247,0.4)" : "rgba(45,212,191,0.2)"}
                            strokeWidth={opacity * 1.5}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    );
                }
            }
        });
        return lines;
    }, [nodes]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[500px] rounded-3xl overflow-hidden bg-[#0a0b14] border border-slate-800 shadow-2xl group"
        >
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.05),transparent_70%)]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections}
            </svg>

            {/* Nodes Layer */}
            {nodes.map((node) => (
                <div
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                >
                    {/* Node Visual */}
                    <div
                        className={`relative rounded-full transition-transform duration-300 hover:scale-150 ${node.type === "core" ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]" :
                                node.type === "bridge" ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" :
                                    "bg-teal-500 shadow-[0_0_8px_rgba(45,212,191,0.4)]"
                            }`}
                        style={{ width: node.radius * 2, height: node.radius * 2 }}
                    >
                        {/* Pulse Ring */}
                        {node.type === "core" && (
                            <div className="absolute inset-0 -m-1 rounded-full border border-purple-500/30 animate-ping" />
                        )}
                    </div>

                    {/* Label (Always visible for cores, on hover for others) */}
                    {(node.label && (node.type === "core" || hoveredNode?.id === node.id)) && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: -5 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-slate-900/90 text-[10px] text-white rounded border border-white/10 backdrop-blur-md pointer-events-none"
                        >
                            {node.label}
                        </motion.div>
                    )}
                </div>
            ))}

            {/* Overlay Info (Bottom Left) */}
            <div className="absolute bottom-6 left-6 pointer-events-none select-none">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-teal-400 tracking-widest">Live Neural Feed</span>
                </div>
                <h3 className="text-xl font-black text-white/90">الشبكة العصبية</h3>
                <p className="text-xs text-slate-500 max-w-[200px]">
                    تمثيل حي لترابط نقاط الوعي وتدفق البيانات بين الجلسات.
                </p>
            </div>

            {/* Stats Badge (Top Right) */}
            <div className="absolute top-6 right-6 flex flex-col gap-2">
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Nodes: {nodes.length}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-bold text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Active: {Math.floor(nodes.length * 0.4)}
                </div>
            </div>
        </div>
    );
};
