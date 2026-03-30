import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Sparkles } from "lucide-react";
import { useMapState } from "../state/mapState";

interface SoulGeometryOverlayProps {
    onClose: () => void;
}

export const SoulGeometryOverlay: React.FC<SoulGeometryOverlayProps> = ({ onClose }) => {
    const nodes = useMapState((s) => s.nodes);
    const activeNodes = useMemo(
        () => nodes.filter((node) => !node.isNodeArchived),
        [nodes]
    );

    const geometry = useMemo(() => {
        // Generate abstract paths and shapes based on nodes' rings and positions
        const paths: any[] = [];
        const circles: any[] = [];

        activeNodes.forEach((node, i) => {
            const seed = node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const radius = node.ring === 'green' ? 40 : node.ring === 'yellow' ? 80 : 120;
            const angle = (i / activeNodes.length) * Math.PI * 2;
            const x = 200 + radius * Math.cos(angle);
            const y = 200 + radius * Math.sin(angle);

            // Lines connecting to center
            const opacity = 0.1 + (seed % 10) / 100;
            paths.push({
                d: `M 200 200 Q ${x - 20} ${y + 20} ${x} ${y}`,
                stroke: node.ring === 'green' ? '#34d399' : node.ring === 'yellow' ? '#fbbf24' : '#f87171',
                opacity: opacity
            });

            // Orbs
            circles.push({
                cx: x,
                cy: y,
                r: 4 + (seed % 8),
                fill: node.ring === 'green' ? '#34d399' : node.ring === 'yellow' ? '#fbbf24' : '#f87171',
                opacity: 0.2 + (seed % 10) / 20
            });
        });

        return { paths, circles };
    }, [activeNodes]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6"
        >
            <div className="absolute top-6 right-6 flex gap-4">
                <button 
                  onClick={onClose}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                    <X className="text-white w-6 h-6" />
                </button>
            </div>

            <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black text-white flex items-center justify-center gap-3">
                    <Sparkles className="text-amber-400 w-6 h-6" />
                    هندسة الرّوح // Soul Geometry
                </h2>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    بصمة بصرية فريدة تعبر عن توازن دوايرك وطاقتك في هذه اللحظة.
                </p>
            </div>

            {/* The Generative Art Piece */}
            <div className="relative aspect-square w-full max-w-md bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                    <defs>
                        <filter id="beautyGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Ambient Center Glow */}
                    <circle cx="200" cy="200" r="100" fill="url(#centerArtGlow)" opacity="0.1" />
                    <radialGradient id="centerArtGlow">
                        <stop offset="0%" stopColor="#2dd4bf" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>

                    <g filter="url(#beautyGlow)">
                        {geometry.paths.map((p, i) => (
                            <motion.path
                                key={i}
                                d={p.d}
                                fill="none"
                                stroke={p.stroke}
                                strokeWidth="0.5"
                                opacity={p.opacity}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, delay: i * 0.05 }}
                            />
                        ))}
                        {geometry.circles.map((c, i) => (
                            <motion.circle
                                key={i}
                                cx={c.cx}
                                cy={c.cy}
                                r={c.r}
                                fill={c.fill}
                                opacity={c.opacity}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12, delay: i * 0.05 }}
                            />
                        ))}
                    </g>
                </svg>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                <button className="flex-1 cta-primary flex items-center justify-center gap-2 py-4">
                    <Download className="w-5 h-5" />
                    تحميل اللوحة
                </button>
                <button className="flex-1 cta-muted flex items-center justify-center gap-2 py-4">
                    <Share2 className="w-5 h-5" />
                    مشاركة الأثر
                </button>
            </div>
            
            <p className="mt-8 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                Personalized Resonance // Alrehla Sanctuary Artifact
            </p>
        </motion.div>
    );
};
