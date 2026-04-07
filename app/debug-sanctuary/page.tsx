"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CocoonModeModal } from "@/modules/action/CocoonModeModal";
import { BreathingOverlay } from "@/modules/exploration/BreathingOverlay";

type View = "landing" | "cocoon" | "breathing";

export default function DebugSanctuaryPage() {
    const [view, setView] = useState<View>("landing");

    return (
        <div
            className="min-h-screen flex items-center justify-center"
            style={{ background: "#030409", colorScheme: "dark" }}
            dir="rtl"
        >
            {/* Ambient orbs */}
            <div aria-hidden className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div style={{ position: "absolute", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)", top: "10%", right: "-8%", animation: "av-orb-drift 40s ease-in-out infinite alternate" }} />
                <div style={{ position: "absolute", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)", bottom: "5%", left: "-6%", animation: "av-orb-drift 52s ease-in-out infinite alternate-reverse" }} />
            </div>

            <AnimatePresence mode="wait">
                {view === "landing" && (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 text-center space-y-8 px-6 max-w-sm w-full"
                    >
                        {/* Orb */}
                        <div className="relative flex items-center justify-center mx-auto" style={{ width: 80, height: 80 }}>
                            <motion.div
                                className="absolute rounded-full"
                                style={{ width: 80, height: 80, border: "1px solid rgba(45,212,191,0.15)" }}
                                animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.12, 0.4] }}
                                transition={{ duration: 3.5, repeat: Infinity }}
                            />
                            <div
                                className="rounded-full flex items-center justify-center"
                                style={{ width: 48, height: 48, background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.25)", boxShadow: "0 0 20px rgba(45,212,191,0.15)" }}
                            >
                                <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#2dd4bf", boxShadow: "0 0 12px rgba(45,212,191,0.9)" }} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "rgba(45,212,191,0.6)" }}>Debug — Sanctuary</p>
                            <h1 className="text-2xl font-black text-white tracking-tight">الملاذ الآمن</h1>
                            <p className="text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.55)" }}>
                                اختبر التجربة مباشرةً بدون خطوات
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={() => setView("cocoon")}
                                className="w-full py-4 rounded-2xl font-extrabold text-sm transition-all"
                                style={{
                                    background: "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(20,184,166,0.08) 100%)",
                                    border: "1px solid rgba(45,212,191,0.35)",
                                    color: "#5eead4",
                                    boxShadow: "0 0 20px rgba(45,212,191,0.1)"
                                }}
                            >
                                🌙 بوابة الملاذ (Cocoon Modal)
                            </button>
                            <button
                                onClick={() => setView("breathing")}
                                className="w-full py-4 rounded-2xl font-extrabold text-sm transition-all"
                                style={{
                                    background: "rgba(99,102,241,0.08)",
                                    border: "1px solid rgba(99,102,241,0.3)",
                                    color: "#a5b4fc"
                                }}
                            >
                                🌬️ تجربة التنفس (4-2-6)
                            </button>
                        </div>

                        <p className="text-[10px]" style={{ color: "rgba(148,163,184,0.25)" }}>
                            localhost:3030/debug-sanctuary
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cocoon Modal */}
            <AnimatePresence>
                {view === "cocoon" && (
                    <CocoonModeModal
                        isOpen={true}
                        onStart={() => setView("breathing")}
                        onClose={() => setView("landing")}
                    />
                )}
            </AnimatePresence>

            {/* Breathing Overlay */}
            <AnimatePresence>
                {view === "breathing" && (
                    <BreathingOverlay onClose={() => setView("landing")} />
                )}
            </AnimatePresence>
        </div>
    );
}
