"use client";

/**
 * ⚔️ BiasAlertCard — كارد تنبيه الانحياز المعرفي
 * ================================================
 * يعرض انحياز معرفي مكتشف من بيانات المستخدم.
 * يتضمن: الاسم (عربي/إنجليزي) + الشرح + الدليل + سؤال المواجهة + اقتراح عملي.
 */

import { useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, ChevronUp, X } from "lucide-react";
import type { CognitiveBiasAlert } from "@/services/cognitiveBiasEngine";
import { dismissBiasAlert } from "@/services/cognitiveBiasEngine";
import { ScienceInsightCard } from "./ScienceInsightCard";

interface BiasAlertCardProps {
    alert: CognitiveBiasAlert;
    onDismiss: () => void;
}

const SEVERITY_STYLES = {
    low: {
        border: "border-blue-500/20",
        bg: "bg-blue-500/5",
        accent: "text-blue-400",
        glow: "rgba(96,165,250,0.1)",
        badge: "bg-blue-500/20 text-blue-300"
    },
    medium: {
        border: "border-amber-500/25",
        bg: "bg-amber-500/5",
        accent: "text-amber-400",
        glow: "rgba(251,191,36,0.1)",
        badge: "bg-amber-500/20 text-amber-300"
    },
    high: {
        border: "border-rose-500/30",
        bg: "bg-rose-500/5",
        accent: "text-rose-400",
        glow: "rgba(244,63,94,0.1)",
        badge: "bg-rose-500/20 text-rose-300"
    }
};

export const BiasAlertCard: FC<BiasAlertCardProps> = ({ alert, onDismiss }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const style = SEVERITY_STYLES[alert.severity];

    const handleDismiss = () => {
        dismissBiasAlert(alert.id);
        onDismiss();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`relative overflow-hidden rounded-3xl border ${style.border} backdrop-blur-xl`}
            style={{
                background: "rgba(15,20,35,0.85)",
            }}
            dir="rtl"
        >
            {/* Background glow */}
            <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
                style={{ background: style.glow }}
            />

            {/* Main content */}
            <div className="relative z-10 p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${style.accent}`}>
                            <Brain className="w-5 h-5" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-600">
                                    انحياز معرفي
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${style.badge}`}>
                                    {alert.severity === "high" ? "خطير" : alert.severity === "medium" ? "متوسط" : "تنبيه"}
                                </span>
                            </div>
                            <h3 className={`text-base font-black ${style.accent}`}>{alert.titleAr}</h3>
                            <p className="text-[10px] text-zinc-600 font-mono tracking-wide">{alert.titleEn}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 rounded-xl hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Explanation */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-3 font-tajawal">
                    {alert.explanation}
                </p>

                {/* Evidence */}
                <div className="mb-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">الدليل من بياناتك</p>
                    <p className="text-xs text-zinc-300 font-tajawal">{alert.evidence}</p>
                </div>

                {/* Confrontation question */}
                <div className="mb-4 px-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10">
                    <p className="text-sm font-bold text-white leading-relaxed font-alexandria">
                        "{alert.confrontQuestion}"
                    </p>
                </div>

                {/* Expandable suggestion */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <span className="font-bold">💡 اقتراح عملي</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <p className="mt-2 px-3 py-2.5 rounded-xl bg-teal-500/5 border border-teal-500/10 text-xs text-teal-300 font-tajawal leading-relaxed">
                                {alert.suggestion}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 🔬 Science Behind This Bias */}
                <div className="mt-3 pt-3 border-t border-white/5">
                    <ScienceInsightCard biasType={alert.biasType} />
                </div>
            </div>
        </motion.div>
    );
};
