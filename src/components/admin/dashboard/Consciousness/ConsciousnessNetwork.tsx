import type { FC } from "react";
import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SafeCircle } from "@/components/ui/SafeSvg";
import type { OverviewStats } from "@/services/admin/adminTypes";

interface Node {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    type: "core" | "healing" | "friction" | "ai_session" | "pulse";
    label?: string;
    intensity: number;
    verticalResonance: number; // 0.0 = completely disconnected (friction), 1.0 = fully connected (core/healing)
}

interface Flow {
    id: string;
    from: number;
    to: number;
    progress: number;
    speed: number;
}

const NODE_LABELS = [
    "شفاء عميق", "تحدي القلق", "جلسة استكشاف", "احتكاك في المسار",
    "صدمة مستدعاة", "تأمل", "اختراق جذري", "بناء جسور",
    "محادثة ذكاء", "مقاومة مقاومة", "إدراك جديد"
];

interface ConsciousnessNetworkProps {
    activeLayer?: "all" | "core" | "bridge";
    stats?: OverviewStats | null;
}

export function ConsciousnessNetwork({ activeLayer = "all", stats }: ConsciousnessNetworkProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [flows, setFlows] = useState<Flow[]>([]);
    const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize Simulation based on stats
    useEffect(() => {
        // Dynamic scaling based on real stats or fallback
        const baseCount = stats?.globalPulse ? Math.floor(stats.globalPulse.ai_workload_avg / 10) + 12 : 30;
        const healingVel = stats?.globalPulse?.healing_velocity ?? 0;
        const totalNodes = Math.min(Math.max(baseCount, 15), 60);

        const initialNodes: Node[] = Array.from({ length: totalNodes }).map((_, i) => {
            const rand = Math.random();
            let type: Node["type"] = "pulse";
            let verticalResonance = 0.5;

            // Type distribution based on stats
            // If healing velocity is low, more friction. If high, more healing.
            if (rand > 0.85) { type = "core"; verticalResonance = 0.9 + Math.random() * 0.1; }
            else if (rand > (0.65 - (healingVel * 0.5))) { type = "healing"; verticalResonance = 0.7 + Math.random() * 0.3; }
            else if (rand > (0.45 + (healingVel * 0.5))) { type = "friction"; verticalResonance = Math.random() * 0.3; } // Friction = low vertical resonance
            else if (rand > 0.3) { type = "ai_session"; verticalResonance = 0.5 + Math.random() * 0.4; }
            else { type = "pulse"; verticalResonance = 0.3 + Math.random() * 0.4; }

            return {
                id: i,
                x: 10 + Math.random() * 80, 
                y: 10 + Math.random() * 80,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                radius: type === "core" ? 8 : type === "friction" ? 5 : 4,
                type,
                verticalResonance,
                intensity: Math.random(),
                label: type !== "pulse" ? NODE_LABELS[Math.floor(Math.random() * NODE_LABELS.length)] : undefined
            };
        });
        setNodes(initialNodes);

        // Initialize flows
        const initialFlows: Flow[] = Array.from({ length: Math.floor(totalNodes / 3) }).map((_, i) => ({
            id: `flow-${i}`,
            from: Math.floor(Math.random() * totalNodes),
            to: Math.floor(Math.random() * totalNodes),
            progress: Math.random(),
            speed: 0.002 + Math.random() * 0.005
        }));
        setFlows(initialFlows);
    }, [stats]);

    // Animation Loop
    useEffect(() => {
        let animationFrameId: number;

        const animate = () => {
            setNodes((prevNodes) => {
                return prevNodes.map((node) => {
                    let { x, y, vx, vy, intensity } = node;

                    // Update Position
                    x += vx;
                    y += vy;

                    // Soft bounds bounce
                    if (x < 5 || x > 95) vx *= -1;
                    if (y < 5 || y > 95) vy *= -1;
                    
                    // Throbbing intensity effect
                    intensity += (Math.random() - 0.5) * 0.1;
                    if (intensity > 1) intensity = 1;
                    if (intensity < 0.2) intensity = 0.2;

                    return { ...node, x, y, vx, vy, intensity };
                });
            });
            setFlows(prevFlows => {
                return prevFlows.map(flow => {
                    const nextProgress = flow.progress + flow.speed;
                    if (nextProgress > 1) {
                        return {
                            ...flow,
                            progress: 0,
                            from: Math.floor(Math.random() * nodes.length),
                            to: Math.floor(Math.random() * nodes.length)
                        };
                    }
                    return { ...flow, progress: nextProgress };
                });
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [nodes.length]);

    // Derived State for Filtering
    const visibleNodes = useMemo(() => {
        if (activeLayer === "all") return nodes;
        if (activeLayer === "core") return nodes.filter(n => n.type === "core" || n.type === "healing");
        if (activeLayer === "bridge") return nodes.filter(n => n.type === "ai_session" || n.type === "friction" || n.type === "healing");
        return nodes;
    }, [nodes, activeLayer]);

    // Generate Connections Efficiently
    const connections = useMemo(() => {
        const lines: React.JSX.Element[] = [];
        visibleNodes.forEach((node, i) => {
            for (let j = i + 1; j < visibleNodes.length; j++) {
                const other = visibleNodes[j];
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const distSquared = dx * dx + dy * dy;

                let threshold = 300;
                if (activeLayer === "bridge") threshold = 800; // Bridges connect further nodes

                if (distSquared < threshold) {
                    const isFriction = node.type === "friction" || other.type === "friction";
                    const isHealing = node.type === "healing" || other.type === "healing";
                    
                    let strokeColor = "rgba(45,212,191,0.15)"; // default teal
                    if (isFriction) strokeColor = "rgba(225,29,72,0.2)"; // red
                    if (isHealing) strokeColor = "rgba(16,185,129,0.2)"; // emerald
                    if (activeLayer === "bridge" && (node.type === "ai_session" || other.type === "ai_session")) {
                        strokeColor = "rgba(56,189,248,0.3)"; // Highlight AI bridges
                    }

                    const opacity = Math.max(0.05, 1 - Math.sqrt(distSquared) / (activeLayer === "bridge" ? 28 : 17));
                    lines.push(
                        <motion.line
                            key={`${node.id}-${other.id}`}
                            x1={`${node.x}%`} y1={`${node.y}%`}
                            x2={`${other.x}%`} y2={`${other.y}%`}
                            stroke={strokeColor}
                            strokeWidth={opacity * 1.5}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                    );
                }
            }
        });
        return lines;
    }, [visibleNodes, activeLayer]);

    const getNodeColor = (type: Node["type"], intensity: number, verticalResonance: number) => {
        // Visually represent vertical disconnects (frictions) by making them dimmer or starker
        const baseAlpha = type === "friction" ? 0.8 : 0.4 + (verticalResonance * 0.4);
        
        switch (type) {
            case "core": return `rgba(168, 85, 247, ${baseAlpha + intensity * 0.2})`; // Purple
            case "healing": return `rgba(16, 185, 129, ${baseAlpha + intensity * 0.2})`; // Emerald
            case "friction": return `rgba(225, 29, 72, ${0.4 + intensity * 0.6})`; // Rose, throbbing intensely
            case "ai_session": return `rgba(56, 189, 248, ${baseAlpha + intensity * 0.2})`; // Sky
            default: return `rgba(45, 212, 191, ${0.2 + intensity * 0.3})`; // Teal (Pulse)
        }
    };
    
    const getGlowColor = (type: Node["type"], verticalResonance: number) => {
        if (type === "friction") return "rgba(225,29,72,0.4)"; // Weak glow for disconnected pain
        switch (type) {
            case "core": return `rgba(168,85,247,${0.4 + verticalResonance * 0.4})`;
            case "healing": return `rgba(16,185,129,${0.4 + verticalResonance * 0.4})`;
            case "ai_session": return "rgba(56,189,248,0.6)";
            default: return "rgba(45,212,191,0.3)";
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[600px] rounded-3xl overflow-hidden bg-[#02040A] border border-slate-800/80 shadow-2xl group"
        >
            {/* Ambient Deep Space Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.05),transparent_60%)]" />
            <div className="absolute inset-0 opacity-10 bg-[url('https://transparenttextures.com/patterns/stardust.png')]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Radar Scanline Effect */}
            <motion.div 
                className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-teal-400/5 to-transparent pointer-events-none z-0 mix-blend-overlay"
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* SVG Layer for Neural Connections & Flows */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {/* Connections */}
                {connections}
                
                {/* Animated Energy Flows */}
                {flows.map(flow => {
                    const startNode = nodes[flow.from];
                    const endNode = nodes[flow.to];
                    if (!startNode || !endNode) return null;

                    const currentX = startNode.x + (endNode.x - startNode.x) * flow.progress;
                    const currentY = startNode.y + (endNode.y - startNode.y) * flow.progress;

                    if (!Number.isFinite(currentX) || !Number.isFinite(currentY)) return null;

                    return (
                        <SafeCircle
                            key={flow.id}
                            cx={`${currentX}%`}
                            cy={`${currentY}%`}
                            r={1.5}
                            fill="white"
                            className="drop-shadow-[0_0_5px_rgba(255,255,255,1)] opacity-40"
                        />
                    );
                })}
            </svg>

            {/* Density Hotspots (Heat-map Layer) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <AnimatePresence>
                    {visibleNodes.filter(n => n.type === "friction" || n.type === "core").map(node => (
                        <motion.div 
                            key={`hotspot-${node.id}`}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
                            style={{
                                left: `${node.x}%`,
                                top: `${node.y}%`,
                                width: 120,
                                height: 120,
                                backgroundColor: node.type === "friction" ? "rgba(225,29,72,0.1)" : "rgba(168,85,247,0.1)"
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Live Nodes Layer */}
            <AnimatePresence>
                {visibleNodes.map((node) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-crosshair z-10"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                    >
                        {/* Node Visual Engine */}
                        <div className="relative flex items-center justify-center">
                            {/* Outer Glow / Ripple for Active states */}
                            {(node.type !== "pulse" || hoveredNode?.id === node.id) && (
                                <div 
                                    className="absolute rounded-full animate-pulse"
                                    style={{
                                        width: node.radius * 6,
                                        height: node.radius * 6,
                                        backgroundColor: getGlowColor(node.type, node.verticalResonance),
                                        opacity: node.type === "friction" ? 0.1 : 0.15,
                                        filter: "blur(8px)",
                                        animationDuration: node.type === "friction" ? "0.5s" : "3s"
                                    }}
                                />
                            )}
                            
                            {/* Core Dot */}
                            <div
                                className={`relative rounded-full transition-all duration-300 ${hoveredNode?.id === node.id ? 'scale-[2]' : 'scale-100'}`}
                                style={{ 
                                    width: node.radius * 2, 
                                    height: node.radius * 2,
                                    backgroundColor: getNodeColor(node.type, node.intensity, node.verticalResonance),
                                    boxShadow: `0 0 15px ${getGlowColor(node.type, node.verticalResonance)}`
                                }}
                            />
                        </div>

                        {/* Sovereign Label (Visible on Hover or for Core/Friction) */}
                        {node.label && (hoveredNode?.id === node.id || node.type === "friction" || node.type === "core") && (
                            <motion.div
                                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                animate={{ opacity: 1, y: -8, scale: 1 }}
                                className={`absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 text-[10px] text-white rounded-lg border backdrop-blur-md pointer-events-none font-bold z-20 shadow-xl ${
                                    node.type === "friction" ? "bg-rose-950/80 border-rose-500/50 text-rose-100" :
                                    node.type === "healing" ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-100" :
                                    "bg-slate-900/90 border-slate-700 text-slate-100"
                                }`}
                            >
                                {node.label}
                                {node.type === "friction" && <div className="text-[8px] text-rose-300/80 text-center mt-0.5">انقطاع رأسي مرصود</div>}
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Cinematic Overlay Stats */}
            <div className="absolute bottom-6 left-6 pointer-events-none select-none z-20">
                <div className="flex items-center gap-2 mb-2 bg-slate-950/50 p-2 rounded-xl border border-slate-800/50 backdrop-blur-sm w-fit">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
                    <span className="text-[10px] uppercase font-black text-rose-400 tracking-[0.2em]">Live Pulse - 23 Friction Nodes</span>
                </div>
                <h3 className="text-2xl font-black text-white/90 drop-shadow-md">خريطة الإدراك المباشر</h3>
                <p className="text-sm font-medium text-slate-400 max-w-[250px] shadow-sm">
                    رؤية علوية (Sovereign View) لحركة المشاعر، الاختناقات، والانتصارات النفسية اللحظية بالمجتمع.
                </p>
            </div>

            {/* Radar Legend */}
            <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                {[
                    { label: "شفاء متقدم", color: "emerald-500", shadow: "rgba(16,185,129,0.5)" },
                    { label: "احتكاك / بلوك", color: "rose-500", shadow: "rgba(225,29,72,0.5)" },
                    { label: "محادثة AI حية", color: "sky-400", shadow: "rgba(56,189,248,0.5)" },
                    { label: "عقدة أساسية", color: "purple-500", shadow: "rgba(168,85,247,0.5)" }
                ].map((item, idx) => (
                    <div key={idx} className="px-3 py-2 rounded-xl bg-[#0B0F19]/80 border border-slate-800/80 backdrop-blur-md text-[10px] font-bold text-slate-300 flex items-center gap-3 w-36 shadow-lg">
                        <span className={`w-2 h-2 rounded-full bg-${item.color}`} style={{ boxShadow: `0 0 10px ${item.shadow}` }} />
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
};
