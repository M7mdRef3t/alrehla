/**
 * Playbook Viewer — مستعرض كتيبات المناورة 📖
 * ==========================================
 * يسمح للمستخدم بتصفح وتنفيذ الخطط الاستراتيجية.
 */

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TACTICAL_PLAYBOOKS, type Playbook } from "../data/tacticalPlaybooks";
import { BookOpen, AlertTriangle, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { useGamificationState, XP_ACTIONS } from "../services/gamificationEngine";
import { trackEvent } from "../services/analytics";
import { recordFlowEvent } from "../services/journeyTracking";
import { calculateEntropy } from "../services/predictiveEngine";
import { usePulseState } from "../state/pulseState";

interface PlaybookExecution {
    count: number;
    lastExecutedAt: number;
    lastXpAwardedAt?: number;
    snapshots: PlaybookSnapshot[];
    evaluations: PlaybookEvaluation[];
}

type PlaybookExecutionMap = Record<string, PlaybookExecution>;

const PLAYBOOK_EXECUTIONS_STORAGE_KEY = "dawayir-playbook-executions";
const XP_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const EVALUATION_MIN_MS = 24 * 60 * 60 * 1000; // +24h
const EVALUATION_MAX_MS = 72 * 60 * 60 * 1000; // +72h

interface PlaybookSnapshot {
    id: string;
    executedAt: number;
    entropyScore: number;
    avgEnergy7d: number | null;
}

interface PlaybookEvaluation {
    snapshotId: string;
    rating: number;
    createdAt: number;
    entropyDelta: number | null;
    energyDelta: number | null;
}

const INTENSITY_LABELS: Record<Playbook["intensity"], string> = {
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية"
};

const readExecutionMap = (): PlaybookExecutionMap => {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(PLAYBOOK_EXECUTIONS_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as PlaybookExecutionMap;
        return typeof parsed === "object" && parsed != null ? parsed : {};
    } catch {
        return {};
    }
};

const writeExecutionMap = (value: PlaybookExecutionMap): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PLAYBOOK_EXECUTIONS_STORAGE_KEY, JSON.stringify(value));
};

const formatLastExecution = (timestamp?: number): string => {
    if (!timestamp) return "لم يُنفذ بعد";
    const now = Date.now();
    const diffMs = Math.max(0, now - timestamp);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "منذ أقل من ساعة";
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "منذ يوم";
    return `منذ ${diffDays} أيام`;
};

const toOneDecimal = (value: number): number => Math.round(value * 10) / 10;

const getAverageRecentEnergy = (limit = 7): number | null => {
    const logs = usePulseState.getState().logs.slice(0, limit);
    if (logs.length === 0) return null;
    const avg = logs.reduce((sum, item) => sum + item.energy, 0) / logs.length;
    return toOneDecimal(avg);
};

const getEvaluationWindowState = (execution?: PlaybookExecution): {
    canEvaluate: boolean;
    pendingSnapshot?: PlaybookSnapshot;
    waitLabel?: string;
    expiredLabel?: string;
} => {
    if (!execution?.snapshots?.length) return { canEvaluate: false };
    const evaluatedSnapshotIds = new Set((execution.evaluations ?? []).map((item) => item.snapshotId));
    const now = Date.now();

    for (const snapshot of [...execution.snapshots].sort((a, b) => b.executedAt - a.executedAt)) {
        if (evaluatedSnapshotIds.has(snapshot.id)) continue;
        const age = now - snapshot.executedAt;

        if (age < EVALUATION_MIN_MS) {
            const remainingHours = Math.max(1, Math.ceil((EVALUATION_MIN_MS - age) / (60 * 60 * 1000)));
            return {
                canEvaluate: false,
                waitLabel: `التقييم يفتح بعد ${remainingHours} ساعة`
            };
        }

        if (age <= EVALUATION_MAX_MS) {
            return { canEvaluate: true, pendingSnapshot: snapshot };
        }

        return {
            canEvaluate: false,
            expiredLabel: "انتهت نافذة التقييم لهذه الجولة"
        };
    }

    return { canEvaluate: false };
};

const getEvaluationInsights = (snapshot: PlaybookSnapshot): {
    entropyDelta: number | null;
    energyDelta: number | null;
} => {
    const currentEntropy = calculateEntropy().entropyScore;
    const currentEnergy = getAverageRecentEnergy(7);

    return {
        // قيمة سالبة أفضل: الفوضى قلت
        entropyDelta: toOneDecimal(currentEntropy - snapshot.entropyScore),
        // قيمة موجبة أفضل: الطاقة زادت
        energyDelta: snapshot.avgEnergy7d != null && currentEnergy != null
            ? toOneDecimal(currentEnergy - snapshot.avgEnergy7d)
            : null
    };
};

export const PlaybookViewer: React.FC = () => {
    const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("تم تفعيل البروتوكول");
    const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
    const [ratingValue, setRatingValue] = useState(0);
    const [executionMap, setExecutionMap] = useState<PlaybookExecutionMap>(() => readExecutionMap());
    const addXP = useGamificationState(s => s.addXP);
    const allStepsCompleted = useMemo(() => {
        if (!selectedPlaybook) return false;
        return selectedPlaybook.steps.every((step) => completedSteps[step.id]);
    }, [completedSteps, selectedPlaybook]);

    const openPlaybook = (pb: Playbook) => {
        const initialSteps = pb.steps.reduce<Record<string, boolean>>((acc, step) => {
            acc[step.id] = false;
            return acc;
        }, {});
        setCompletedSteps(initialSteps);
        setShowSuccess(false);
        setIsExecuting(false);
        setSuccessMessage("تم تفعيل البروتوكول");
        setRatingValue(0);
        setSelectedPlaybook(pb);
    };

    const closePlaybook = () => {
        setSelectedPlaybook(null);
        setShowSuccess(false);
        setIsExecuting(false);
        setSuccessMessage("تم تفعيل البروتوكول");
        setRatingValue(0);
        setCompletedSteps({});
    };

    const toggleStep = (stepId: string) => {
        if (showSuccess) return;
        setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
    };

    const executePlaybook = () => {
        if (!selectedPlaybook || isExecuting || showSuccess || !allStepsCompleted) return;
        setIsExecuting(true);

        const now = Date.now();
        const snapshot: PlaybookSnapshot = {
            id: `snapshot_${selectedPlaybook.id}_${now}`,
            executedAt: now,
            entropyScore: calculateEntropy().entropyScore,
            avgEnergy7d: getAverageRecentEnergy(7)
        };
        let awardedXp = false;

        setExecutionMap((prev) => {
            const existing = prev[selectedPlaybook.id];
            const lastXpAwardedAt = existing?.lastXpAwardedAt ?? 0;
            const inCooldown = now - lastXpAwardedAt < XP_COOLDOWN_MS;
            awardedXp = !inCooldown;

            const next: PlaybookExecutionMap = {
                ...prev,
                [selectedPlaybook.id]: {
                    count: (existing?.count ?? 0) + 1,
                    lastExecutedAt: now,
                    lastXpAwardedAt: !inCooldown ? now : existing?.lastXpAwardedAt,
                    snapshots: [snapshot, ...(existing?.snapshots ?? [])].slice(0, 20),
                    evaluations: existing?.evaluations ?? []
                }
            };
            writeExecutionMap(next);
            return next;
        });

        trackEvent("playbook_executed", {
            playbookId: selectedPlaybook.id,
            category: selectedPlaybook.category,
            intensity: selectedPlaybook.intensity
        });
        recordFlowEvent("playbook_executed", {
            meta: {
                playbookId: selectedPlaybook.id,
                category: selectedPlaybook.category,
                intensity: selectedPlaybook.intensity,
                stepsCount: selectedPlaybook.steps.length,
                entropyAtExecution: snapshot.entropyScore,
                avgEnergy7dAtExecution: snapshot.avgEnergy7d
            }
        });
        if (awardedXp) {
            addXP(XP_ACTIONS.MIRROR_CONFRONT, `تنفيذ كتيب: ${selectedPlaybook.title}`);
        }

        setIsExecuting(false);
        setSuccessMessage(awardedXp ? "تم تنفيذ البروتوكول +50 نقطة" : "تم التنفيذ بنجاح (النقاط متاحة بعد 24 ساعة)");
        setShowSuccess(true);
        window.setTimeout(() => {
            closePlaybook();
        }, 1200);
    };

    const submitEvaluation = () => {
        if (!selectedPlaybook || ratingValue < 1 || ratingValue > 5) return;
        const execution = executionMap[selectedPlaybook.id];
        const evaluationWindow = getEvaluationWindowState(execution);
        const snapshot = evaluationWindow.pendingSnapshot;
        if (!evaluationWindow.canEvaluate || !snapshot) return;

        const insights = getEvaluationInsights(snapshot);
        const now = Date.now();

        setExecutionMap((prev) => {
            const existing = prev[selectedPlaybook.id];
            if (!existing) return prev;

            const next: PlaybookExecutionMap = {
                ...prev,
                [selectedPlaybook.id]: {
                    ...existing,
                    evaluations: [
                        {
                            snapshotId: snapshot.id,
                            rating: ratingValue,
                            createdAt: now,
                            entropyDelta: insights.entropyDelta,
                            energyDelta: insights.energyDelta
                        },
                        ...(existing.evaluations ?? [])
                    ].slice(0, 20)
                }
            };

            writeExecutionMap(next);
            return next;
        });

        trackEvent("playbook_effectiveness_rated", {
            playbookId: selectedPlaybook.id,
            rating: ratingValue,
            ...(insights.entropyDelta != null ? { entropyDelta: insights.entropyDelta } : {}),
            ...(insights.energyDelta != null ? { energyDelta: insights.energyDelta } : {})
        });
        recordFlowEvent("next_step_action_taken", {
            meta: {
                action: "playbook_effectiveness_rated",
                playbookId: selectedPlaybook.id,
                rating: ratingValue,
                ...(insights.entropyDelta != null ? { entropyDelta: insights.entropyDelta } : {}),
                ...(insights.energyDelta != null ? { energyDelta: insights.energyDelta } : {})
            }
        });

        setRatingValue(0);
    };

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-6">
            <header className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                    <BookOpen className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white">كتيبات المناورة</h2>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest">بروتوكولات عملية قابلة للتنفيذ</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {TACTICAL_PLAYBOOKS.map(pb => (
                    (() => {
                        const execution = executionMap[pb.id];
                        const evaluationWindow = getEvaluationWindowState(execution);
                        const lastEvaluation = execution?.evaluations?.[0];
                        return (
                    <motion.button
                        key={pb.id}
                        onClick={() => openPlaybook(pb)}
                        className="text-right p-5 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-teal-500/30 transition-all group flex flex-col gap-3"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${pb.intensity === "high" ? "bg-rose-500/20 text-rose-400" : "bg-teal-500/20 text-teal-400"
                                }`}>
                                الشدة: {INTENSITY_LABELS[pb.intensity]}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-teal-400/20 transition-colors">
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">{pb.title}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{pb.description}</p>
                            <p className="text-[10px] text-slate-500 mt-2">
                                {`آخر تنفيذ: ${formatLastExecution(executionMap[pb.id]?.lastExecutedAt)}`}
                                {executionMap[pb.id]?.count ? ` • مرات التنفيذ: ${executionMap[pb.id].count}` : ""}
                            </p>
                            {evaluationWindow.canEvaluate && (
                                <p className="text-[10px] text-emerald-400 mt-1">جاهز لتقييم نتيجة آخر تنفيذ</p>
                            )}
                            {!evaluationWindow.canEvaluate && evaluationWindow.waitLabel && (
                                <p className="text-[10px] text-amber-400 mt-1">{evaluationWindow.waitLabel}</p>
                            )}
                            {!evaluationWindow.canEvaluate && evaluationWindow.expiredLabel && (
                                <p className="text-[10px] text-slate-500 mt-1">{evaluationWindow.expiredLabel}</p>
                            )}
                            {lastEvaluation && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {`آخر تقييم: ${lastEvaluation.rating}/5`}
                                </p>
                            )}
                        </div>
                    </motion.button>
                        );
                    })()
                ))}
            </div>

            {/* Playbook Detail Modal */}
            <AnimatePresence>
                {selectedPlaybook && (
                    <motion.div
                        className="fixed inset-0 z-[110] bg-slate-950 px-6 py-12 overflow-y-auto"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                    >
                        <div className="max-w-md mx-auto h-full flex flex-col">
                            <button
                                onClick={closePlaybook}
                                className="self-end p-2 mb-8 rounded-xl bg-white/5"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>

                            <div className="mb-8">
                                <h1 className="text-3xl font-black text-white mb-2">{selectedPlaybook.title}</h1>
                                <p className="text-slate-400 text-sm leading-relaxed">{selectedPlaybook.description}</p>
                            </div>

                            <div className="space-y-6 mb-12">
                                {selectedPlaybook.steps.map((step, idx) => (
                                    <button
                                        type="button"
                                        key={step.id}
                                        onClick={() => toggleStep(step.id)}
                                        className={`relative w-full text-right flex gap-4 rounded-2xl p-3 transition-colors ${completedSteps[step.id] ? "bg-emerald-500/10 border border-emerald-500/25" : "bg-slate-900/30 border border-white/5"}`}
                                    >
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${completedSteps[step.id] ? "bg-emerald-500 text-white" : step.isCritical ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            {idx < selectedPlaybook.steps.length - 1 && (
                                                <div className="w-px flex-1 bg-slate-800" />
                                            )}
                                        </div>
                                        <div className="pb-8">
                                            <h3 className={`font-bold mb-1 ${step.isCritical ? "text-rose-400" : "text-white"}`}>
                                                {step.title}
                                                {step.isCritical && <AlertTriangle className="inline-block w-3 h-3 ml-2" />}
                                            </h3>
                                            <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                                            <p className={`text-[10px] mt-2 font-bold ${completedSteps[step.id] ? "text-emerald-400" : "text-slate-500"}`}>
                                                {completedSteps[step.id] ? "تم تنفيذ الخطوة" : "اضغط لتأكيد تنفيذ الخطوة"}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={executePlaybook}
                                disabled={!allStepsCompleted || isExecuting || showSuccess}
                                className={`mt-auto w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${showSuccess ? "bg-emerald-500 text-white" : "bg-teal-500 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
                                    }`}
                            >
                                {isExecuting ? (
                                    <div className="w-5 h-5 border-2 border-slate-950 border-t-white rounded-full animate-spin" />
                                ) : showSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        {successMessage}
                                    </>
                                ) : (
                                    allStepsCompleted ? "تنفيذ البروتوكول الآن" : "كمّل الخطوات أولاً"
                                )}
                            </button>

                            {(() => {
                                const execution = executionMap[selectedPlaybook.id];
                                const evaluationWindow = getEvaluationWindowState(execution);
                                if (!execution) return null;
                                const pendingSnapshot = evaluationWindow.pendingSnapshot;
                                const previewInsights = pendingSnapshot ? getEvaluationInsights(pendingSnapshot) : null;

                                return (
                                    <div className="mt-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                                        <h4 className="text-sm font-black text-white mb-2">تقييم فاعلية التنفيذ</h4>
                                        {evaluationWindow.canEvaluate && pendingSnapshot ? (
                                            <>
                                                <p className="text-xs text-slate-400 mb-3">
                                                    قيّم آخر تنفيذ على مقياس من 1 إلى 5، والنظام هيقارن حالتك دلوقتي بحالة وقت التنفيذ.
                                                </p>
                                                <div className="flex items-center gap-2 mb-3">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setRatingValue(star)}
                                                            className={`w-8 h-8 rounded-lg text-xs font-black border ${ratingValue >= star ? "bg-amber-400/20 text-amber-300 border-amber-400/40" : "bg-white/5 text-slate-500 border-white/10"}`}
                                                        >
                                                            {star}
                                                        </button>
                                                    ))}
                                                </div>
                                                {previewInsights && (
                                                    <div className="text-[11px] text-slate-400 mb-3 space-y-1">
                                                        <p>
                                                            {`دلوقتي الفوضى ${previewInsights.entropyDelta == null ? "غير متاح" : previewInsights.entropyDelta > 0 ? `زادت +${previewInsights.entropyDelta}` : `قلت ${previewInsights.entropyDelta}`}`}
                                                        </p>
                                                        <p>
                                                            {`متوسط الطاقة ${previewInsights.energyDelta == null ? "غير متاح" : previewInsights.energyDelta >= 0 ? `زاد +${previewInsights.energyDelta}` : `انخفض ${previewInsights.energyDelta}`}`}
                                                        </p>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={submitEvaluation}
                                                    disabled={ratingValue < 1}
                                                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    حفظ تقييم الفاعلية
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-500">
                                                {evaluationWindow.waitLabel ?? evaluationWindow.expiredLabel ?? "نفّذ البروتوكول أولاً ثم ارجع للتقييم بعد 24 ساعة."}
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
