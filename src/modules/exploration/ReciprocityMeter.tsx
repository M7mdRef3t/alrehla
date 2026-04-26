"use client";

/**
 * ⚔️ ReciprocityMeter — ميزان الحقيقة
 * ====================================
 * شريط بصري يظهر في ViewPersonModal يعرض توازن العطاء والأخذ.
 * يتضمن أزرار سريعة لتسجيل: عطاء، أخذ، وعد مكسور، لقاء ملغي.
 */

import { useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ChevronDown, ChevronUp } from "lucide-react";
import { useMapState } from "@/modules/map/dawayirIndex";
import { calculateReciprocityIndex, generateReciprocityInsight } from "@/services/reciprocityEngine";
import { recordTruthEvent } from "@/services/truthScoreEngine";
import type { MapNode } from "@/modules/map/mapTypes";

interface ReciprocityMeterProps {
    node: MapNode;
}

export const ReciprocityMeter: FC<ReciprocityMeterProps> = ({ node }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const updateNode = useMapState((s) => s.updateNode);
    const score = calculateReciprocityIndex(node);
    const insight = generateReciprocityInsight(node);
    const reciprocity = node.reciprocity ?? {
        givenCount: 0,
        receivedCount: 0,
        brokenPromises: 0,
        cancelledMeets: 0
    };

    const handleRecord = (type: "given" | "received" | "broken_promise" | "cancelled_meet") => {
        const updated = { ...reciprocity };
        const now = Date.now();

        switch (type) {
            case "given":
                updated.givenCount += 1;
                updated.lastGivenAt = now;
                break;
            case "received":
                updated.receivedCount += 1;
                updated.lastReceivedAt = now;
                break;
            case "broken_promise":
                updated.brokenPromises += 1;
                break;
            case "cancelled_meet":
                updated.cancelledMeets += 1;
                break;
        }

        updateNode(node.id, { reciprocity: updated });
        // ⚔️ Record in Truth Score: +5 for honest tracking
        recordTruthEvent("reciprocity_recorded", `سجل تفاعل مع "${node.label}"`);
    };

    // Visual calculations
    const total = reciprocity.givenCount + reciprocity.receivedCount;
    const givePercent = total > 0 ? (reciprocity.givenCount / total) * 100 : 50;
    const takePercent = total > 0 ? (reciprocity.receivedCount / total) * 100 : 50;

    const meterColor = score.hasImbalance
        ? "from-rose-500 to-amber-500"
        : "from-emerald-500 to-teal-500";

    const borderColor = score.hasImbalance
        ? "border-rose-500/20"
        : "border-teal-500/20";

    return (
        <div
            className={`relative overflow-hidden rounded-3xl border ${borderColor} backdrop-blur-xl p-5`}
            style={{ background: "rgba(255,255,255,0.03)" }}
            dir="rtl"
        >
            {/* Background glow */}
            <div
                className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-30"
                style={{
                    background: score.hasImbalance
                        ? "radial-gradient(circle, rgba(244,63,94,0.3), transparent)"
                        : "radial-gradient(circle, rgba(45,212,191,0.3), transparent)"
                }}
            />

            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="relative z-10 w-full flex items-center justify-between mb-4"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${score.hasImbalance ? "bg-rose-500/10 text-rose-400" : "bg-teal-500/10 text-teal-400"}`}>
                        <Scale className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div className="text-right">
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">ميزان الحقيقة</h4>
                        <p className={`text-sm font-bold ${score.hasImbalance ? "text-rose-300" : "text-teal-300"}`}>
                            {score.label === "balanced" ? "متوازن" :
                             score.label === "over_giving" ? "عطاء زائد" :
                             score.label === "one_sided" ? "من طرف واحد" :
                             score.label === "over_taking" ? "أخذ زائد" : "في انتظار البيانات"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black tabular-nums ${score.hasImbalance ? "text-rose-400" : "text-teal-400"}`}>
                        {score.index}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </div>
            </button>

            {/* Balance Bar */}
            <div className="relative z-10 mb-3">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
                    <motion.div
                        className="h-full bg-gradient-to-l from-teal-500 to-emerald-500 rounded-r-full"
                        initial={{ width: "50%" }}
                        animate={{ width: `${givePercent}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    <motion.div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-l-full"
                        initial={{ width: "50%" }}
                        animate={{ width: `${takePercent}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-teal-400 font-bold">عطاء: {reciprocity.givenCount}</span>
                    <span className="text-[10px] text-amber-400 font-bold">أخذ: {reciprocity.receivedCount}</span>
                </div>
            </div>

            {/* Message */}
            <p className="relative z-10 text-xs text-zinc-400 leading-relaxed mb-3 font-tajawal">
                {score.message}
            </p>

            {/* Insight */}
            {insight && (
                <div className="relative z-10 mb-3 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <p className="text-xs text-amber-300 font-bold font-tajawal">💡 {insight}</p>
                </div>
            )}

            {/* Expanded: Quick record buttons */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10 overflow-hidden"
                    >
                        <div className="pt-3 border-t border-white/5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">سجل تفاعل</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleRecord("given")}
                                    className="py-3 rounded-2xl text-xs font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition-all active:scale-95"
                                >
                                    🤲 أديت حاجة
                                </button>
                                <button
                                    onClick={() => handleRecord("received")}
                                    className="py-3 rounded-2xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95"
                                >
                                    🎁 أخدت حاجة
                                </button>
                                <button
                                    onClick={() => handleRecord("broken_promise")}
                                    className="py-3 rounded-2xl text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95"
                                >
                                    💔 وعد مكسور
                                </button>
                                <button
                                    onClick={() => handleRecord("cancelled_meet")}
                                    className="py-3 rounded-2xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all active:scale-95"
                                >
                                    ❌ لقاء ملغي
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
