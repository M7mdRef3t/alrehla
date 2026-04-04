import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Target, X, Zap, Skull } from "lucide-react";
import { soundManager } from "../services/soundManager";

interface Thought {
    id: string;
    text: string;
    type: "intrusive" | "doubt" | "guilt";
    status: "active" | "locked" | "eliminated";
    x: number; // Random position X %
    y: number; // Random position Y %
}

interface ThoughtSniperProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ThoughtSniper: FC<ThoughtSniperProps> = ({ isOpen, onClose }) => {
    const [thoughts, setThoughts] = useState<Thought[]>([]);
    const [inputText, setInputText] = useState("");
    const [score, setScore] = useState(0);
    const [ammo, setAmmo] = useState(5);
    const [isReloading, setIsReloading] = useState(false);

    // Spawn a thought based on input
    const spawnThought = () => {
        if (!inputText.trim()) return;
        const newThought: Thought = {
            id: Date.now().toString(),
            text: inputText,
            type: "intrusive",
            status: "active",
            x: Math.random() * 60 + 20, // Keep away from edges
            y: Math.random() * 60 + 20,
        };
        setThoughts((prev) => [...prev, newThought]);
        setInputText("");
    };

    const hasActiveThoughts = thoughts.some(t => t.status !== "eliminated");

    const handleShoot = (id: string) => {
        if (ammo <= 0 || isReloading) return;

        setAmmo(prev => prev - 1);
        soundManager.playSniperShot();

        // Hit logic
        setThoughts(prev => prev.map(t => {
            if (t.id === id) return { ...t, status: "eliminated" };
            return t;
        }));

        setScore(prev => prev + 100);

        // Vibration effect
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const handleReload = () => {
        setIsReloading(true);
        setTimeout(() => {
            setAmmo(5);
            setIsReloading(false);
        }, 1500);
    };

    // Keyboard shortcut for reload
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "r" || e.key === "R") handleReload();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black cursor-crosshair overflow-hidden">
                    {/* HUD Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                        {/* Reticle / Scope Effect */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.8)_80%)]"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] border border-teal-500/30 rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-teal-500">
                            <Crosshair className="w-full h-full" />
                        </div>

                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
                            <div className="bg-slate-900/80 border border-teal-500/50 p-3 rounded-lg backdrop-blur-sm">
                                <h2 className="text-teal-400 font-mono text-xs mb-1 tracking-widest">MISSION: THOUGHT SNIPER</h2>
                                <div className="flex items-center gap-2 text-white font-bold text-xl">
                                    <Target className="w-5 h-5 text-rose-500" />
                                    {score} PTS
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="pointer-events-auto bg-slate-900/80 p-2 rounded-full hover:bg-rose-900/50 text-white border border-slate-700 hover:border-rose-500 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Bottom Bar (Ammo & Controls) */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center gap-4">

                            {/* Input Area (Spawn Mechanism) */}
                            <div className="pointer-events-auto w-full max-w-md flex gap-2">
                                <input
                                    id="thought-sniper-input"
                                    name="thoughtSniperInput"
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && spawnThought()}
                                    placeholder="اكتب الفكرة السلبية هنا لتحديد موقعها..."
                                    className="flex-1 bg-slate-900/90 border border-teal-900/50 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-right backdrop-blur-md"
                                    dir="rtl"
                                />
                                <button
                                    onClick={spawnThought}
                                    disabled={!inputText.trim()}
                                    className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg font-bold pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    رصد
                                </button>
                            </div>

                            <div className="flex items-center gap-8 pointer-events-auto">
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-3 h-8 rounded-sm border ${i < ammo ? "bg-amber-400 border-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "bg-slate-800 border-slate-700"}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    onClick={handleReload}
                                    disabled={isReloading || ammo === 5}
                                    className="text-xs font-mono text-amber-500 border border-amber-500/50 px-3 py-1 rounded hover:bg-amber-900/20 disabled:opacity-30"
                                >
                                    {isReloading ? "RELOADING..." : "RELOAD (R)"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Battlefield (Thoughts) */}
                    <div className="absolute inset-0 z-10">
                        {thoughts.map((thought) => (
                            <AnimatePresence key={thought.id}>
                                {thought.status !== "eliminated" && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                            x: [0, Math.random() * 20 - 10, 0],
                                            y: [0, Math.random() * 20 - 10, 0]
                                        }}
                                        exit={{ scale: 2, opacity: 0, filter: "blur(20px)" }}
                                        transition={{
                                            x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                                            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                        style={{
                                            left: `${thought.x}%`,
                                            top: `${thought.y}%`,
                                        }}
                                        className="absolute cursor-pointer group"
                                        onClick={() => handleShoot(thought.id)}
                                    >
                                        <div className="relative">
                                            {/* Hitbox */}
                                            <div className="absolute -inset-4 border border-rose-500/0 group-hover:border-rose-500/50 rounded-full transition-all duration-300 animate-ping"></div>

                                            {/* Target Content */}
                                            <div className="bg-slate-800/90 border border-rose-500 text-rose-200 px-4 py-2 rounded-lg backdrop-blur-sm shadow-[0_0_20px_rgba(244,63,94,0.3)] max-w-[200px] text-center text-sm font-bold select-none">
                                                <div className="absolute -top-3 -left-3 bg-rose-600 text-white p-1 rounded-full">
                                                    <Skull className="w-3 h-3" />
                                                </div>
                                                {thought.text}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        ))}

                        {/* Impact Effects (render when eliminated) */}
                        {thoughts.filter(t => t.status === "eliminated").map(t => (
                            <div
                                key={`impact-${t.id}`}
                                className="absolute pointer-events-none"
                                style={{ left: `${t.x}%`, top: `${t.y}%` }}
                            >
                                <div className="absolute -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
                                <Zap className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-rose-400 animate-ping" />
                            </div>
                        ))}

                        {!hasActiveThoughts && thoughts.length > 0 && ammo > 0 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <h3 className="text-emerald-400 font-bold text-2xl tracking-widest animate-bounce">AREA CLEAR</h3>
                            </div>
                        )}
                    </div>

                    {/* Background Grid */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: "linear-gradient(#0f766e 1px, transparent 1px), linear-gradient(90deg, #0f766e 1px, transparent 1px)",
                            backgroundSize: "40px 40px"
                        }}
                    ></div>
                </div>
            )}
        </AnimatePresence>
    );
};
