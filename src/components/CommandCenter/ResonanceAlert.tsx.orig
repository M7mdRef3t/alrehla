import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldAlert, Cpu, Activity } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface ActiveEvent {
    event_name: string;
    event_type: string;
    dda_override: number;
    end_time: string;
}

export const ResonanceAlert: React.FC = () => {
    const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('active_resonance_event')
                .select('*')
                .single();

            if (!error && data) {
                setActiveEvent(data);
            } else {
                setActiveEvent(null);
            }
        };

        fetchEvent();
        const interval = setInterval(fetchEvent, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    if (!activeEvent) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4"
            >
                <div className="relative group overflow-hidden">
                    {/* Industrial Backdrop */}
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.2)]" />

                    {/* Animated Glitch Border */}
                    <motion.div
                        animate={{
                            opacity: [0.2, 0.5, 0.2],
                            x: activeEvent.dda_override >= 5 ? [-1, 1, -1] : 0,
                            y: activeEvent.dda_override >= 5 ? [1, -1, 1] : 0
                        }}
                        transition={{
                            opacity: { duration: 1, repeat: Infinity },
                            x: { duration: 0.1, repeat: Infinity },
                            y: { duration: 0.08, repeat: Infinity }
                        }}
                        className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"
                    />

                    <motion.div
                        animate={activeEvent.dda_override >= 5 ? {
                            x: [0.5, -0.5, 0.5],
                            y: [-0.3, 0.3, -0.3],
                            filter: ["hue-rotate(0deg)", "hue-rotate(10deg)", "hue-rotate(0deg)"]
                        } : {}}
                        transition={{ duration: 0.2, repeat: Infinity }}
                        className="relative p-6 flex items-start gap-4"
                    >
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
                        </div>

                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> MAGNETIC SHIFT DETECTED
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded">AUTO_DDA: LVL_{activeEvent.dda_override}</span>
                            </div>

                            <h2 className="text-lg font-black text-white leading-tight">
                                {activeEvent.event_name}
                            </h2>

                            <p className="text-xs text-slate-400 font-medium italic">
                                "السرب تحت ضغط عالي.. موجة مغناطيسية هترفع صعوبة المهام لأقصى درجة. السيادة مش بس في الراحة، السيادة في العاصفة."
                            </p>

                            <div className="pt-3 flex items-center justify-between border-t border-white/5 mt-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-3 h-3 text-slate-600" />
                                    <span className="text-[9px] font-black text-slate-600 uppercase">Synchronized Swarm Event</span>
                                </div>
                                <span className="text-[9px] font-bold text-amber-500/70 uppercase">
                                    Ends: {new Date(activeEvent.end_time).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
