import { FC } from "react";
import { motion } from "framer-motion";
import { Cpu, Zap, Shield, Waves, Check } from "lucide-react";
import { useSwarmState } from "@/domains/admin/store/swarm.store";
import { SWARM_PERSONAE } from '@/agent/personae';

/**
 * Swarm Persona Selector — محول سرب الشخصيات 🤖
 * =========================================
 * المكون المسؤول عن اختيار من يخاطب المستخدم حالياً.
 */

export const SwarmPersonaSelector: FC = () => {
    const { activePersona, setActivePersona, resetToAuto } = useSwarmState();

    const options = [
        { id: "AUTO" as const, name: "تبديل تلقائي", icon: Cpu, color: "teal" },
        ...Object.values(SWARM_PERSONAE).map(p => ({
            id: p.id,
            name: p.nameAr,
            icon: p.id === "STOIC" ? Shield : p.id === "TACTICIAN" ? Zap : Waves,
            color: p.id === "STOIC" ? "emerald" : p.id === "TACTICIAN" ? "amber" : "blue"
        }))
    ];

    return (
        <div className="w-full flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
            {options.map((opt) => {
                const isActive = activePersona === opt.id;
                const Icon = opt.icon;

                return (
                    <motion.button
                        key={opt.id}
                        onClick={() => opt.id === "AUTO" ? resetToAuto() : setActivePersona(opt.id)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${isActive
                                ? `bg-${opt.color}-500/20 border-${opt.color}-500/40 text-${opt.color}-300 ring-2 ring-${opt.color}-500/10`
                                : "bg-black/20 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-400"
                            }`}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "" : "opacity-60"}`} />
                        <span className="text-[11px] font-bold whitespace-nowrap">{opt.name}</span>
                        {isActive && <Check className="w-3 h-3 ml-1" />}
                    </motion.button>
                );
            })}
        </div>
    );
};
