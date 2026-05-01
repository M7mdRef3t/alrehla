"use client";

/**
 * ⚔️ ContradictionMirrorCard — كارد مرآة التناقض
 * ===============================================
 * يظهر عندما يكتشف mirrorLogic تناقضاً بين نوايا المستخدم وسلوكه.
 * يعرض: العنوان + الرسالة + السؤال السقراطي + الدليل
 * عند "واجه الحقيقة" → يُسجَّل في TruthVault كـ breakthrough
 */

import { useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertTriangle, Zap, Heart, Shield, Activity } from "lucide-react";
import type { MirrorInsight } from "@/services/mirrorLogic";
import { dismissMirrorInsight } from "@/services/mirrorLogic";
import { ScienceInsightCard } from "./ScienceInsightCard";
import type { MirrorInsightType } from "@/data/scienceBehindBias";

interface ContradictionMirrorCardProps {
    insight: MirrorInsight;
    onDismiss: () => void;
    onConfront: () => void;
}

const TYPE_CONFIG: Record<MirrorInsight["type"], { icon: typeof Eye; color: string; bgGlow: string }> = {
    emotional_denial: { icon: EyeOff, color: "text-amber-400", bgGlow: "rgba(251,191,36,0.08)" },
    reality_detachment: { icon: Eye, color: "text-blue-400", bgGlow: "rgba(96,165,250,0.08)" },
    placement_anxiety: { icon: AlertTriangle, color: "text-orange-400", bgGlow: "rgba(251,146,60,0.08)" },
    false_support: { icon: Zap, color: "text-emerald-400", bgGlow: "rgba(52,211,153,0.08)" },
    love_drain: { icon: Heart, color: "text-rose-400", bgGlow: "rgba(251,113,133,0.08)" },
    paper_boundaries: { icon: Shield, color: "text-purple-400", bgGlow: "rgba(192,132,252,0.08)" },
    false_recovery: { icon: Activity, color: "text-teal-400", bgGlow: "rgba(45,212,191,0.08)" },
    connection_illusion: { icon: Zap, color: "text-indigo-400", bgGlow: "rgba(99,102,241,0.08)" },
};

const SEVERITY_BORDER: Record<MirrorInsight["severity"], string> = {
    gentle: "border-blue-500/20",
    firm: "border-amber-500/30",
    shock: "border-rose-500/40",
};

export const ContradictionMirrorCard: FC<ContradictionMirrorCardProps> = ({
    insight,
    onDismiss,
    onConfront
}) => {
    const [isConfronted, setIsConfronted] = useState(false);
    const config = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.emotional_denial;
    const Icon = config.icon;
    const borderClass = SEVERITY_BORDER[insight.severity];

    const handleConfront = () => {
        setIsConfronted(true);
        onConfront();
        // Auto-dismiss after animation
        setTimeout(() => {
            dismissMirrorInsight(insight.id);
            onDismiss();
        }, 2000);
    };

    const handleSkip = () => {
        dismissMirrorInsight(insight.id);
        onDismiss();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`relative overflow-hidden rounded-3xl border ${borderClass} backdrop-blur-xl p-6`}
                style={{
                    background: `linear-gradient(135deg, rgba(15,20,35,0.9) 0%, rgba(15,20,35,0.95) 100%)`,
                }}
                dir="rtl"
            >
                {/* Background glow */}
                <div
                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[80px] pointer-events-none"
                    style={{ background: config.bgGlow }}
                />

                {/* Confronted overlay */}
                <AnimatePresence>
                    {isConfronted && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="text-center"
                            >
                                <div className="text-4xl mb-2">⚔️</div>
                                <p className="text-lg font-black text-teal-400">واجهت الحقيقة</p>
                                <p className="text-xs text-zinc-400 mt-1">تم التسجيل في خزنة الحقائق</p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <div className="relative z-10 flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${config.color}`}>
                        <Icon className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                مرآة التناقض
                            </span>
                            {insight.severity === "shock" && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                                    صدمة
                                </span>
                            )}
                        </div>
                        <h3 className={`text-lg font-black ${config.color}`}>{insight.title}</h3>
                    </div>
                </div>

                {/* Message */}
                <p className="relative z-10 text-sm text-zinc-300 leading-relaxed mb-4 font-tajawal">
                    {insight.message}
                </p>

                {/* Evidence */}
                {insight.evidence && (
                    <div className="relative z-10 mb-4 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">الدليل</p>
                        <p className="text-xs text-zinc-400 font-mono">{insight.evidence}</p>
                    </div>
                )}

                {/* Socratic Question */}
                <div className="relative z-10 mb-5 px-4 py-4 rounded-2xl bg-white/[0.05] border border-white/10">
                    <p className="text-sm font-bold text-white leading-relaxed font-alexandria">
                        "{insight.question}"
                    </p>
                </div>

                {/* Actions */}

                {/* 🔬 Science Behind This Mirror Insight */}
                <div className="relative z-10 mb-4">
                    <ScienceInsightCard mirrorType={insight.type as MirrorInsightType} />
                </div>

                {/* Action Buttons */}
                <div className="relative z-10 flex gap-3">
                    <button
                        onClick={handleConfront}
                        className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 ${
                            insight.severity === "shock"
                                ? "bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30"
                                : "bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:bg-teal-500/30"
                        }`}
                    >
                        ⚔️ واجه الحقيقة
                    </button>
                    <button
                        onClick={handleSkip}
                        className="px-5 py-3.5 rounded-2xl font-bold text-xs bg-white/[0.03] border border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-all duration-300"
                    >
                        مش دلوقتي
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
