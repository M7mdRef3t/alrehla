"use client";

/**
 * ⚔️ PredictionJournalCard — كارد سجل التوقعات
 * ==============================================
 * يسمح للمستخدم بتسجيل توقع + يعرض التوقعات المعلقة للتقييم.
 * "إيه اللي تتوقعه يحصل؟" → بعد أسبوع → "إيه اللي حصل فعلاً؟"
 */

import { useState, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Check, X, Plus, Target } from "lucide-react";
import {
    createPrediction,
    resolvePrediction,
    getPendingEvaluations,
    getPredictionStats,
    type Prediction,
    type PredictionStats
} from "@/services/predictionJournal";
import { recordTruthEvent } from "@/services/truthScoreEngine";

interface PredictionJournalCardProps {
    /** سياق اختياري — مثلاً عند إضافة شخص */
    contextQuestion?: string;
    relatedNodeId?: string;
    relatedNodeLabel?: string;
}

export const PredictionJournalCard: FC<PredictionJournalCardProps> = ({
    contextQuestion,
    relatedNodeId,
    relatedNodeLabel
}) => {
    const [mode, setMode] = useState<"overview" | "create" | "evaluate">("overview");
    const [pending, setPending] = useState<Prediction[]>([]);
    const [stats, setStats] = useState<PredictionStats | null>(null);
    const [newPrediction, setNewPrediction] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState(contextQuestion ?? "");
    const [evaluatingPred, setEvaluatingPred] = useState<Prediction | null>(null);
    const [outcome, setOutcome] = useState("");

    useEffect(() => {
        setPending(getPendingEvaluations());
        setStats(getPredictionStats());
    }, []);

    const handleCreate = () => {
        if (!newPrediction.trim()) return;
        createPrediction({
            question: currentQuestion || "توقع عام",
            prediction: newPrediction.trim(),
            relatedNodeId,
            relatedNodeLabel,
        });
        setNewPrediction("");
        setCurrentQuestion("");
        setMode("overview");
        setStats(getPredictionStats());
    };

    const handleResolve = (wasAccurate: boolean) => {
        if (!evaluatingPred) return;
        resolvePrediction(evaluatingPred.id, outcome, wasAccurate);
        // Record in truth score
        if (wasAccurate) {
            recordTruthEvent("confronted_truth", "توقع دقيق — رؤية صادقة");
        }
        setEvaluatingPred(null);
        setOutcome("");
        setPending(getPendingEvaluations());
        setStats(getPredictionStats());
        setMode("overview");
    };

    return (
        <div
            className="relative overflow-hidden rounded-3xl border border-white/5 backdrop-blur-xl p-5"
            style={{ background: "rgba(15,20,35,0.85)" }}
            dir="rtl"
        >
            {/* Background glow */}
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-15 bg-purple-500" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <BookOpen className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">سجل التوقعات</p>
                        <p className="text-xs text-zinc-500">اللي قلته vs اللي حصل</p>
                    </div>
                </div>

                {pending.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        {pending.length} في انتظار التقييم
                    </span>
                )}
            </div>

            {/* Overview mode */}
            <AnimatePresence mode="wait">
                {mode === "overview" && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="relative z-10 space-y-3"
                    >
                        {/* Stats */}
                        {stats && stats.totalPredictions > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-center px-3 py-2.5 rounded-xl bg-white/[0.03]">
                                    <p className="text-lg font-black text-purple-400 tabular-nums">{stats.totalPredictions}</p>
                                    <p className="text-[9px] text-zinc-600 font-bold">إجمالي</p>
                                </div>
                                <div className="text-center px-3 py-2.5 rounded-xl bg-white/[0.03]">
                                    <p className="text-lg font-black tabular-nums" style={{
                                        color: stats.accuracyScore > 60 ? "#10b981" : stats.accuracyScore > 30 ? "#f59e0b" : "#ef4444"
                                    }}>
                                        {stats.accuracyScore}%
                                    </p>
                                    <p className="text-[9px] text-zinc-600 font-bold">دقة</p>
                                </div>
                                <div className="text-center px-3 py-2.5 rounded-xl bg-white/[0.03]">
                                    <p className="text-lg font-black text-amber-400 tabular-nums">{stats.optimismRate}%</p>
                                    <p className="text-[9px] text-zinc-600 font-bold">تفاؤل زائد</p>
                                </div>
                            </div>
                        )}

                        {/* Insight */}
                        {stats && stats.resolvedPredictions >= 3 && (
                            <div className="px-3 py-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                <p className="text-xs text-purple-300 font-tajawal">💡 {stats.insight}</p>
                            </div>
                        )}

                        {/* Pending evaluations */}
                        {pending.length > 0 && (
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">حان وقت التقييم</p>
                                {pending.slice(0, 3).map(pred => (
                                    <button
                                        key={pred.id}
                                        onClick={() => { setEvaluatingPred(pred); setMode("evaluate"); }}
                                        className="w-full text-right px-3 py-2.5 mb-2 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors"
                                    >
                                        <p className="text-xs text-zinc-300 font-tajawal truncate">"{pred.prediction}"</p>
                                        <p className="text-[10px] text-zinc-600 mt-0.5">
                                            {pred.relatedNodeLabel ? `عن: ${pred.relatedNodeLabel}` : pred.question}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Create button */}
                        <button
                            onClick={() => setMode("create")}
                            className="w-full py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-sm hover:bg-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            سجل توقع جديد
                        </button>
                    </motion.div>
                )}

                {/* Create mode */}
                {mode === "create" && (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="relative z-10 space-y-3"
                    >
                        <input
                            type="text"
                            value={currentQuestion}
                            onChange={e => setCurrentQuestion(e.target.value)}
                            placeholder="السؤال أو السياق (مثلاً: هل هيتغير؟)"
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-purple-500/40"
                            dir="rtl"
                        />
                        <textarea
                            value={newPrediction}
                            onChange={e => setNewPrediction(e.target.value)}
                            placeholder="إيه اللي تتوقعه يحصل؟"
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-purple-500/40 resize-none"
                            dir="rtl"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreate}
                                disabled={!newPrediction.trim()}
                                className="flex-1 py-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold text-sm disabled:opacity-30 hover:bg-purple-500/30 transition-all"
                            >
                                <Target className="w-4 h-4 inline ml-1" />
                                سجل التوقع
                            </button>
                            <button
                                onClick={() => setMode("overview")}
                                className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 font-bold text-sm"
                            >
                                رجوع
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Evaluate mode */}
                {mode === "evaluate" && evaluatingPred && (
                    <motion.div
                        key="evaluate"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="relative z-10 space-y-3"
                    >
                        <div className="px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">توقعك كان</p>
                            <p className="text-sm text-white font-bold font-alexandria">"{evaluatingPred.prediction}"</p>
                            <p className="text-[10px] text-zinc-600 mt-1">
                                {new Date(evaluatingPred.createdAt).toLocaleDateString("ar-EG")}
                                {evaluatingPred.relatedNodeLabel ? ` — عن: ${evaluatingPred.relatedNodeLabel}` : ""}
                            </p>
                        </div>

                        <textarea
                            value={outcome}
                            onChange={e => setOutcome(e.target.value)}
                            placeholder="إيه اللي حصل فعلاً؟"
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-amber-500/40 resize-none"
                            dir="rtl"
                        />

                        <p className="text-xs text-zinc-500 font-bold">هل التوقع كان صح؟</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleResolve(true)}
                                className="flex-1 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                            >
                                <Check className="w-4 h-4" /> أيوا — توقعي كان صح
                            </button>
                            <button
                                onClick={() => handleResolve(false)}
                                className="flex-1 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-sm hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                            >
                                <X className="w-4 h-4" /> لأ — الواقع كان مختلف
                            </button>
                        </div>
                        <button
                            onClick={() => { setEvaluatingPred(null); setMode("overview"); }}
                            className="w-full py-2 text-xs text-zinc-600 hover:text-zinc-400"
                        >
                            رجوع
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
