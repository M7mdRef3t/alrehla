
import React, { useEffect, useRef, useState } from 'react';
import { useDigitalTwinState } from '@/state/digitalTwinState';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    type: 'CHAOS' | 'BALANCE';
    radius: number;
    color: string;
}

export const EntropyGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const { graph } = useDigitalTwinState();
    const stability = graph.globalStability ?? 1;

    const particles = useRef<Particle[]>([]);
    const mouse = useRef({ x: 0, y: 0 });

    const initParticles = () => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < 40; i++) {
            const isChaos = Math.random() > 0.4;
            newParticles.push({
                x: Math.random() * 800,
                y: Math.random() * 400,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                type: isChaos ? 'CHAOS' : 'BALANCE',
                radius: isChaos ? 4 : 6,
                color: isChaos ? '#f43f5e' : '#2dd4bf'
            });
        }
        particles.current = newParticles;
        setScore(0);
        setIsGameOver(false);
    };

    useEffect(() => {
        initParticles();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrame: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Friction is inverse to stability: unstable = heavy UI
            const friction = 0.95 + (stability * 0.04);
            const attractionForce = 0.05 + (stability * 0.1);

            particles.current.forEach(p => {
                // Movement
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= friction;
                p.vy *= friction;

                // Wall bounce
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Mouse interaction
                const dx = mouse.current.x - p.x;
                const dy = mouse.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    if (p.type === 'BALANCE') {
                        // Attract balance nodes
                        p.vx += (dx / dist) * attractionForce;
                        p.vy += (dy / dist) * attractionForce;
                    } else {
                        // Repel chaos nodes
                        p.vx -= (dx / dist) * attractionForce * 1.5;
                        p.vy -= (dy / dist) * attractionForce * 1.5;
                    }
                }

                // Collection
                if (dist < 20 && p.type === 'BALANCE') {
                    p.x = Math.random() * canvas.width;
                    p.y = Math.random() * canvas.height;
                    setScore(s => s + 10);
                }

                // Chaos Penalty
                if (dist < 15 && p.type === 'CHAOS') {
                    setScore(s => Math.max(0, s - 5));
                }

                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;

                if (p.type === 'BALANCE') {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = p.color;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
            });

            // HUD Lines
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.moveTo(mouse.current.x - 20, mouse.current.y);
            ctx.lineTo(mouse.current.x + 20, mouse.current.y);
            ctx.moveTo(mouse.current.x, mouse.current.y - 20);
            ctx.lineTo(mouse.current.x, mouse.current.y + 20);
            ctx.stroke();

            animationFrame = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrame);
    }, [stability]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            mouse.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Quantum Balance</span>
                        <span className="text-2xl font-black text-teal-400">{score}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={initParticles}
                        className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="relative glass-card border-white/5 overflow-hidden cursor-none" onMouseMove={handleMouseMove}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="w-full h-[400px]"
                />

                {/* Visual Feedback on Stability */}
                {stability < 0.6 && (
                    <div className="absolute inset-0 pointer-events-none bg-rose-500/5 animate-pulse flex items-center justify-center">
                        <div className="px-4 py-2 bg-rose-600/20 backdrop-blur-md rounded-full border border-rose-500/30 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] text-rose-200 font-bold uppercase tracking-widest">High Entropy - UI Hardening Active</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 flex gap-6 items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Collect Stability</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Avoid Chaos</span>
                </div>
                <p className="text-[9px] text-slate-500 font-medium italic flex-grow text-right">
                    الفيزياء بتتأثر باستقرارك.. لو أنت مشوش، اللعبة هتبقى أصعب.
                </p>
            </div>
        </div>
    );
};
