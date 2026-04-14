/* eslint-disable react-refresh/only-export-components */
import type { FC, ReactNode } from "react";
import { AdminTooltip } from "../../Overview/components/AdminTooltip";

export const StatCard: FC<{
    title: string;
    value: string | number;
    hint?: string;
    glowColor?: string;
    tooltip?: string;
    icon?: ReactNode;
    onClick?: () => void;
}> = ({ title, value, hint, glowColor = "teal", tooltip, icon, onClick }) => {
    const glowVariants = {
        teal: "from-teal-500/5 via-teal-500/10 to-teal-500/5 hover:bg-teal-900/40 border-teal-500/20 hover:border-teal-400/50 shadow-[0_0_15px_rgba(20,184,166,0.05)] hover:shadow-[0_0_25px_rgba(20,184,166,0.2)] text-teal-400",
        indigo: "from-indigo-500/5 via-indigo-500/10 to-indigo-500/5 hover:bg-indigo-900/40 border-indigo-500/20 hover:border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:shadow-[0_0_25px_rgba(99,102,241,0.2)] text-indigo-400",
        amber: "from-amber-500/5 via-amber-500/10 to-amber-500/5 hover:bg-amber-900/40 border-amber-500/20 hover:border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] text-amber-400",
        rose: "from-rose-500/5 via-rose-500/10 to-rose-500/5 hover:bg-rose-900/40 border-rose-500/20 hover:border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.05)] hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] text-rose-400"
    };

    const selectedGlow = glowVariants[glowColor as keyof typeof glowVariants] || glowVariants.teal;
    const blurColor = glowColor === "teal" ? "bg-teal-400" : glowColor === "indigo" ? "bg-indigo-400" : glowColor === "amber" ? "bg-amber-400" : "bg-rose-400";

    return (
        <div
<<<<<<< HEAD
            className={`relative group perspective-1000 h-full ${onClick ? "cursor-pointer" : ""}`}
=======
            className={`relative group perspective-1000 h-full ${onClick ?"" : ""}`}
>>>>>>> feat/sovereign-final-stabilization
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="absolute inset-0 bg-slate-950/60 rounded-3xl shadow-inner border border-white/5 opacity-80" />

            <div className={`relative h-full flex flex-col justify-between p-6 rounded-3xl border transition-all duration-500 ease-out bg-gradient-to-br backdrop-blur-xl overflow-hidden ${selectedGlow} ${onClick ? "group-active:scale-95" : ""}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none" />
                <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none ${blurColor}`} />
                <div className={`absolute -bottom-16 -left-16 w-32 h-32 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none ${blurColor}`} />

                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            {icon && <div className="opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>}
                            <h3 className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-black group-hover:text-white transition-colors duration-300">
                                {title}
                            </h3>
                            {tooltip && <AdminTooltip content={tooltip} position="bottom" />}
                        </div>
                        <div className={`w-2 h-2 rounded-full animate-pulse opacity-50 group-hover:opacity-100 transition-opacity ${blurColor}`} />
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tabular-nums group-hover:scale-105 group-hover:origin-right transition-transform duration-500 ease-out drop-shadow-md">
                            {value}
                        </p>
                    </div>

                    {hint && (
                        <p className="text-[10px] text-slate-500 mt-2 font-black tracking-widest uppercase flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <span className={`w-1 h-1 rounded-full ${blurColor} opacity-50`} />
                            {hint}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const formatNumber = (value: number | null | undefined, fallback = "—") =>
    value == null || Number.isNaN(value) ? fallback : value.toLocaleString("en-US");
