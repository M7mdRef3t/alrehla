import React, { useEffect, useRef } from 'react';
import { useDigitalTwinState } from '@/domains/maraya/store/digitalTwin.store';
import { Activity, Zap, Brain, Target, ShieldAlert, Wifi, ZapOff, Activity as PulseIcon } from 'lucide-react';
import { InterventionEngine } from '@/services/telemetry/InterventionEngine';
import { PredictiveEngine } from '@/services/predictiveEngine';
import { PredictiveRadar } from './PredictiveRadar';

export const ConsciousnessGraph: React.FC = () => {
    const { graph, isMirroring, setMirroring, seedGraph, interventionMode } = useDigitalTwinState();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initial Seed & Analysis Loop
    useEffect(() => {
        if (graph.nodes.length === 0) seedGraph();

        // Only run AI analysis when mirroring is explicitly active
        if (!isMirroring) return;

        // Delay initial call to allow server compilation on first load
        const initialDelay = setTimeout(() => {
            PredictiveEngine.analyzeTrajectory();
        }, 2000);

        // Run deep analysis every 30 seconds if still active
        const interval = setInterval(() => {
            PredictiveEngine.analyzeTrajectory();
        }, 30000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [isMirroring]);

    useEffect(() => {
        if (!isMirroring || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle Resizing
        const handleResize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * devicePixelRatio;
            canvas.height = rect.height * devicePixelRatio;
            ctx.scale(devicePixelRatio, devicePixelRatio);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        let animationFrame: number;

        const render = () => {
            const { interventionMode } = useDigitalTwinState.getState();
            const pulse = InterventionEngine.getPulseTiming();

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Simulation logic: subtle node movement
            graph.nodes.forEach((node, i) => {
                const isRecovery = interventionMode === 'RECOVERY';

                if (isRecovery) {
                    // Entrain movement to 4-7-8 rhythm
                    node.position.y += Math.sin(Date.now() / 2000 + i) * 0.02; // Very slow drift
                } else {
                    node.position.y += Math.sin(Date.now() / 2000 + i) * 0.1;
                }
            });

            // Draw Edges
            graph.edges.forEach(edge => {
                const source = graph.nodes.find(n => n.id === edge.source);
                const target = graph.nodes.find(n => n.id === edge.target);
                if (source && target) {
                    ctx.beginPath();
                    ctx.moveTo(source.position.x, source.position.y);
                    ctx.lineTo(target.position.x, target.position.y);

                    const isRecovery = interventionMode === 'RECOVERY';
                    const pulseAlpha = isRecovery ? (0.05 + pulse.alpha * 0.1) : 0.08;

                    ctx.strokeStyle = edge.type === 'BLOCK' ? `rgba(244, 63, 94, ${pulseAlpha * 2})` : `rgba(45, 212, 191, ${pulseAlpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });

            // Draw Nodes
            graph.nodes.forEach(node => {
                const heat = node.energyLevel;
                const isRecovery = interventionMode === 'RECOVERY';

                // Pulse multiplier
                const radius = (3 + (heat * 5)) * (isRecovery ? (0.9 + pulse.alpha * 0.2) : 1);

                // Outer Glow
                if (heat > 0.5 || isRecovery) {
                    ctx.shadowBlur = isRecovery ? (10 + pulse.alpha * 15) : 15;
                    ctx.shadowColor = node.type === 'STATE' || isRecovery ? 'rgba(244, 63, 94, 0.4)' : 'rgba(45, 212, 191, 0.3)';
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.beginPath();
                ctx.arc(node.position.x, node.position.y, radius, 0, Math.PI * 2);

                let color = 'rgba(148, 163, 184, 0.4)';
                if (isRecovery) {
                    color = `rgba(244, 63, 94, ${0.4 + (pulse.alpha * 0.4)})`;
                } else {
                    if (node.type === 'PERSON') color = `rgba(45, 212, 191, ${0.4 + (heat * 0.6)})`;
                    if (node.type === 'DREAM') color = `rgba(99, 102, 241, ${0.4 + (heat * 0.6)})`;
                    if (node.type === 'STATE') color = `rgba(244, 63, 94, ${0.4 + (heat * 0.6)})`;
                    if (node.type === 'MODULE') color = `rgba(168, 85, 247, ${0.4 + (heat * 0.6)})`;
                }

                ctx.fillStyle = color;
                ctx.fill();

                // Simple Label
                ctx.shadowBlur = 0;
                ctx.fillStyle = isRecovery ? 'rgba(244, 63, 94, 0.8)' : 'rgba(255, 255, 255, 0.5)';
                ctx.font = '700 8px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(node.label.toUpperCase(), node.position.x, node.position.y + radius + 12);
            });

            animationFrame = requestAnimationFrame(render);
        };

        render();
        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', handleResize);
        };
    }, [graph, isMirroring]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto items-start">
            {/* Left: Main Mirror */}
            <div className="lg:col-span-2 space-y-6">
                <div className="relative w-full h-[550px] bg-slate-950/50 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-xl">
                    {/* Header / HUD */}
                    <div className="absolute top-8 left-8 z-10 space-y-1">
                        <div className="flex items-center gap-3">
                            {interventionMode === 'RECOVERY' ? (
                                <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                            ) : (
                                <Brain className={`w-5 h-5 ${isMirroring ? 'text-teal-400' : 'text-slate-500'}`} />
                            )}
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">
                                {interventionMode === 'RECOVERY' ? 'Immune Lockdown' : 'Semantic Mirror'}
                            </h3>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.25em] leading-none font-medium">
                            {isMirroring ? 'Subconscious Stream Active' : 'Neural Link Standby'}
                        </p>
                    </div>

                    <div className="absolute top-8 right-8 z-10 flex gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">System Stability</span>
                            <span className={`text-sm font-black ${(graph.globalStability ?? 1) < 0.5 ? 'text-rose-400' : 'text-teal-400'}`}>
                                {Math.round((graph.globalStability ?? 1) * 100)}%
                            </span>
                        </div>
                        <button
                            onClick={() => setMirroring(!isMirroring)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isMirroring ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-white/5 text-slate-400 border border-white/10'
                                }`}
                        >
                            {isMirroring ? 'Active' : 'Initialize'}
                        </button>
                    </div>

                    <canvas
                        ref={canvasRef}
                        className="w-full h-full opacity-70"
                    />

                    {/* Background Grid/Effect */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.03),transparent)]" />
                </div>
            </div>

            {/* Right: Predictive HUD */}
            <div className="space-y-6 lg:sticky lg:top-8">
                <PredictiveRadar />
            </div>
        </div>
    );
};
