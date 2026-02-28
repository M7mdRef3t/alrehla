import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

interface SwarmStatusBadgeProps {
    tension: number; // 0.0 - 1.0
    momentum: number;
    label?: string;
    isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({
    tension,
    momentum,
    label = "مجال مستقر",
    isInsulated = false
}) => {
    const statusConfig = useMemo(() => {
        if (tension > 0.8) return {
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
            icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
            text: "تأين حرج", // Critical Ionization
            caption: "ضغط جوي مرتفع.. التدخل السريع مطلوب"
        };
        if (tension > 0.5) return {
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
            icon: <Zap className="w-3 h-3 text-amber-400" />,
            text: "ضغط متزايد", // Rising Pressure
            caption: "المجال يضطرب.. حافظ على توازنك"
        };
        return {
            color: 'text-teal-400',
            bg: 'bg-teal-500/10',
            border: 'border-teal-500/20',
            glow: 'shadow-[0_0_15px_rgba(20,184,166,0.2)]',
            icon: <Activity className="w-3 h-3 text-teal-400" />,
            text: "مجال مستقر", // Stable Field
            caption: "الوعي الجمعي في حالة تناغم"
        };
    }, [tension]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${statusConfig.border} ${statusConfig.bg} ${statusConfig.glow} backdrop-blur-md`}
        >
            <div className="relative">
                {statusConfig.icon}
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute inset-0 rounded-full ${statusConfig.color.replace('text', 'bg')} opacity-20`}
                />
            </div>

            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${statusConfig.color}`}>
                        {statusConfig.text}
                    </span>
                    {isInsulated && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                            <ShieldCheck className="w-2 h-2 text-amber-400" />
                            <span className="text-[7px] font-bold text-amber-400 uppercase">Insulated</span>
                        </div>
                    )}
                </div>
                <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                    {statusConfig.caption}
                </span>
            </div>

            <div className="ml-auto pl-3 border-l border-white/5 flex flex-col items-end">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Resonance</span>
                <span className="text-xs font-black text-white leading-none">
                    {momentum.toFixed(2)}x
                </span>
            </div>
        </motion.div>
    );
};
