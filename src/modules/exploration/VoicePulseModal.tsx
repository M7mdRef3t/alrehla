import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Check, Orbit, Zap } from 'lucide-react';
import { useMapState } from '@/modules/map/dawayirIndex';

interface VoicePulseModalProps {
    onClose: () => void;
}

export const VoicePulseModal: React.FC<VoicePulseModalProps> = ({ onClose }) => {
    const [phase, setPhase] = useState<"idle" | "listening" | "processing" | "result">("idle");
    const [transcript, setTranscript] = useState("");
    const [timer, setTimer] = useState(0);
    const nodes = useMapState((s) => s.nodes);
    const addEnergyTransaction = useMapState((s) => s.addEnergyTransaction);

    // Simulated extraction results
    const [extractedTarget, setExtractedTarget] = useState<string | null>(null);
    const [extractedImpact, setExtractedImpact] = useState<number>(0);

    // Canvas ref for visualizer
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        let interval: number;
        if (phase === "listening") {
            interval = window.setInterval(() => {
                setTimer((t) => t + 1);
            }, 1000);

            // Simulate transcription progress
            const script = "أنا مخنوق أوي من كلام محمود في الاجتماع، شفط كل تفكيري وطاقتي...";
            let chars = 0;
            const tInterval = window.setInterval(() => {
                chars += 2;
                if (chars <= script.length) {
                    setTranscript(script.substring(0, chars));
                } else {
                    clearInterval(tInterval);
                }
            }, 100);

            // Start visualizer
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    const drawVisualizer = () => {
                        const width = canvasRef.current!.width;
                        const height = canvasRef.current!.height;
                        ctx.clearRect(0, 0, width, height);

                        ctx.beginPath();
                        ctx.moveTo(0, height / 2);
                        for (let i = 0; i < width; i++) {
                            const y = (height / 2) + Math.sin(i * 0.05 + performance.now() * 0.01) * 20 * Math.random();
                            ctx.lineTo(i, y);
                        }
                        ctx.strokeStyle = "rgba(99, 102, 241, 0.8)"; // Warm Indigo
                        ctx.lineWidth = 3;
                        ctx.stroke();

                        animationRef.current = requestAnimationFrame(drawVisualizer);
                    };
                    drawVisualizer();
                }
            }

        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = undefined;
            }
        }
        return () => {
            clearInterval(interval);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = undefined;
            }
        };
    }, [phase]);

    const startListening = () => {
        setPhase("listening");
        setTranscript("");
        setTimer(0);
    };

    const stopListening = () => {
        setPhase("processing");
        // Simulate AI processing delay
        setTimeout(() => {
            const targetNode = nodes.find(n => n.label.includes("محمود") || n.id === "mahmoud") || nodes[0];
            setExtractedTarget(targetNode ? targetNode.label : "مجهول");
            setExtractedImpact(-5);
            setPhase("result");
        }, 2000);
    };

    const confirmPulse = () => {
        const targetNode = nodes.find(n => n.label === extractedTarget);
        if (targetNode) {
            addEnergyTransaction(targetNode.id, extractedImpact, transcript);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0"
            style={{ background: "rgba(10, 15, 30, 0.85)", backdropFilter: "blur(12px)" }}>
            <button
                className="absolute inset-0 w-full h-full cursor-default"
                onClick={onClose}
                aria-label="إغلاق مسجل الصوت"
            />

            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="relative w-full max-w-md rounded-3xl p-6 overflow-hidden"
                style={{
                    background: "linear-gradient(145deg, rgba(31, 41, 55, 0.85), rgba(17, 24, 39, 0.95))",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.15)"
                }}
                dir="rtl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="voice-pulse-title"
            >
                <div className="text-center space-y-2 mb-6">
                    <h2 id="voice-pulse-title" className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                        التفريغ الصوتي الفوري
                    </h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        الذكاء الاصطناعي بيسمعك ويستخرج النبضة تلقائياً
                    </p>
                </div>

                <div className="min-h-[120px] mb-6 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {phase === "idle" && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center"
                            >
                                <button
                                    onClick={startListening}
                                    className="w-20 h-20 rounded-full flex items-center justify-center pulse-glow bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                                    aria-label="ابدأ التسجيل الصوتي"
                                >
                                    <Mic size={32} aria-hidden="true" />
                                </button>
                                <p className="mt-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                    اضغط للتحدث
                                </p>
                            </motion.div>
                        )}

                        {phase === "listening" && (
                            <motion.div
                                key="listening"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full flex flex-col items-center"
                            >
                                <canvas ref={canvasRef} width={300} height={60} className="w-full h-16 mb-4" />
                                <p className="text-sm font-medium min-h-[40px] text-center px-4" style={{ color: "var(--text-primary)" }} aria-live="polite" aria-atomic="true">
                                    {transcript || "جاري الاستماع..."}
                                </p>
                                <div className="flex items-center justify-between w-full mt-4 px-6">
                                    <span className="text-xs font-mono text-indigo-400">
                                        00:{timer.toString().padStart(2, '0')}
                                    </span>
                                    <button
                                        onClick={stopListening}
                                        className="w-12 h-12 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors border border-rose-500/50"
                                        aria-label="إيقاف التسجيل الصوتي"
                                    >
                                        <Square size={20} fill="currentColor" aria-hidden="true" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {phase === "processing" && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <Orbit className="w-12 h-12 animate-spin mb-4 text-indigo-400" aria-hidden="true" />
                                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }} aria-live="polite" aria-atomic="true">
                                    جاري تحليل المشاعر والمستنزفين...
                                </p>
                                <div className="w-48 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-indigo-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 2, ease: "linear" }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {phase === "result" && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full flex flex-col items-center gap-4"
                            >
                                <div className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                                            <span className="text-lg">👤</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">الهدف المكتشف</p>
                                            <p className="text-sm font-bold text-slate-100">{extractedTarget}</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-slate-400">الأثر الطاقي</p>
                                        <p className="text-lg font-black text-rose-400 flex items-center gap-1">
                                            {extractedImpact} <Zap size={16} aria-hidden="true" />
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 text-sm font-semibold rounded-xl border border-slate-600 hover:bg-slate-800 transition-colors text-slate-300"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        onClick={confirmPulse}
                                        className="flex-[2] py-3 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} aria-hidden="true" />
                                        اعتماد النبضة
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </motion.div>
        </div>
    );
};


