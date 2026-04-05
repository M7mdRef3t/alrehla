import React, { type FC, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, AlertTriangle, Sparkles, HelpCircle, LayoutTemplate, Terminal } from "lucide-react";
import type { Ring, DailyPathProgress } from "../modules/map/mapTypes";
import { analyzeWithAI } from "../utils/aiPatternAnalyzer";
import { generateAIPlan } from "../utils/aiPlanGenerator";
import { geminiClient } from "../services/geminiClient";
import { getExercisesForSymptoms } from "../data/symptomExercises";
import { getSymptomLabel } from "../data/symptoms";
import { mapCopy } from "../copy/map";
import { generateDetachmentCurriculum, reframeGuiltThought, type DetachmentCurriculumResult } from "../utils/detachmentCurriculumGenerator";
import type { DynamicRecoveryPlan as Plan, DynamicStep } from "../utils/dynamicPlanGenerator";
import { generateRecoveryPathFromAI, type RelationshipRole } from "../utils/pathGenerator";
import { symptomIdsToSymptomType } from "../modules/pathEngine/pathResolver";
import { recordJourneyEvent } from "../services/journeyTracking";
import type { PathId } from "../modules/pathEngine/pathTypes";
import type { RecoveryPath } from "../modules/pathEngine/pathTypes";
import { LiveStatusBar } from "./shared/LiveStatusBar";
import { SymptomSimulation } from "./Chat/SymptomSimulation";


function isRecoveryPath(x: unknown): x is RecoveryPath {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const phases = o.phases as { week1?: { tasks?: unknown } } | undefined;
  return Array.isArray(phases?.week1?.tasks);
}

interface DynamicRecoveryPlanProps {
  personLabel: string;
  ring: Ring;
  situations: string[];
  selectedSymptoms?: string[];
  completedSteps: string[];
  onToggleStep: (stepId: string) => void;
  onUpdateStepInput: (stepId: string, value: string) => void;
  stepInputs: Record<string, string>;
  stepFeedback?: Record<string, "hard" | "easy" | "unrealistic">;
  onStepFeedback?: (stepId: string, value: "hard" | "easy" | "unrealistic") => void;
  focusTraumaInheritance?: boolean;
  detachmentMode?: boolean;
  detachmentReasons?: string[];
  onUpdateDetachmentReasons?: (reasons: string[]) => void;
  ruminationCount?: number;
  onIncrementRumination?: () => void;
  nodeId?: string;
  pathId?: PathId;
  recoveryPathSnapshot?: unknown;
  onUpdateRecoveryPathSnapshot?: (snapshot: RecoveryPath) => void;
  onAddDailyPathProgress?: (nodeId: string, entry: DailyPathProgress) => void;
  dailyPathProgress?: DailyPathProgress[];
  lastPathGeneratedAt?: number;
  /** نوع العلاقة/الدور — عشان الـ AI يخصص (سلطة روحية vs مادية) */
  goalId?: string;
  /** مؤشر شرعية الحدود (0–100) — لمسار الصيام الشعوري */
  boundaryLegitimacyScore?: number;
  onUpdateBoundaryLegitimacyScore?: (score: number) => void;
}

function getPlanTitle(personLabel: string, ring: Ring): string {
  if (ring === "red") return `مسار حماية مدار (${personLabel})`;
  if (ring === "yellow") return `مسار توازن مدار (${personLabel})`;
  return `مسار تعزيز مدار (${personLabel})`;
}

function buildInsightFromSymptoms(selectedSymptoms: string[]): string {
  if (selectedSymptoms.length === 0) return "";
  const labels = selectedSymptoms.map(getSymptomLabel).join(" و ");
  return `بناءً على إشارات (${labels})، ركزنا في الأسبوع الأول على حماية مساحتك الداخلية وحدودك بدون قسوة.`;
}

const LAST_N_DAYS = 14;

const MOOD_LABELS: Record<number, string> = {
  1: "سيّء",
  2: "ضعيف",
  3: "عادي",
  4: "كويس",
  5: "ممتاز"
};

function formatPathGeneratedAt(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? "منذ لحظات" : `منذ ${mins} دقيقة`;
  if (hours < 24) return hours === 1 ? "منذ ساعة" : `منذ ${hours} ساعة`;
  if (days < 7) return days === 1 ? "منذ يوم" : `منذ ${days} أيام`;
  return new Date(ts).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
}

/** لوحة قياس: 3 مقاييس + مؤشر شرعية الحدود (للصيام الشعوري) + رسم آخر 14 يوم */
const PathProgressPanel: FC<{
  dailyPathProgress: DailyPathProgress[];
  lastPathGeneratedAt?: number;
  completedStepsCount?: number;
  ruminationCount?: number;
  /** مسار الصيام الشعوري فقط: مؤشر شرعية الحدود */
  pathId?: string;
  boundaryLegitimacyScore?: number;
  onUpdateBoundaryLegitimacyScore?: (score: number) => void;
}> = ({ dailyPathProgress, lastPathGeneratedAt, completedStepsCount = 0, ruminationCount = 0, pathId, boundaryLegitimacyScore, onUpdateBoundaryLegitimacyScore }) => {
  const completedDaysCount = dailyPathProgress.filter((e) => e.didComplete).length;
  const today = new Date().toISOString().slice(0, 10);
  const dates = Array.from({ length: LAST_N_DAYS }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (LAST_N_DAYS - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const completedByDate = new Set(
    dailyPathProgress.filter((e) => e.didComplete).map((e) => e.date)
  );
  const entriesWithMood = dailyPathProgress.filter((e) => e.didComplete && e.moodScore != null && e.moodScore >= 1 && e.moodScore <= 5);
  const lastSevenWithMood = entriesWithMood.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const avgMood = lastSevenWithMood.length > 0
    ? (lastSevenWithMood.reduce((s, e) => s + (e.moodScore ?? 0), 0) / lastSevenWithMood.length).toFixed(1)
    : null;
  const moodByDate = new Map(entriesWithMood.map((e) => [e.date, e.moodScore!]));

  return (
    <div className="p-6 bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-2xl text-right">
      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <span className="text-2xl">📊</span> لوحة المتابعة — أنت واقف فين؟
      </h3>
      <div className="mb-4 opacity-80 scale-95 origin-right">
        <LiveStatusBar
          title="حالة بيانات المتابعة"
          mode={lastPathGeneratedAt != null ? "live" : "fallback"}
          isLoading={false}
          lastUpdatedAt={lastPathGeneratedAt ?? null}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">قوة المدار</p>
          <p className="text-xl font-bold text-teal-400">خطوات مُنجزة: {completedStepsCount}</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">كل خطوة حماية بتزوّد قوة المدار</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">هدوء الرادار</p>
          <p className="text-xl font-bold text-amber-400">
            {avgMood != null ? `مزاج ${avgMood}/5` : ruminationCount === 0 ? "هدوء تام" : `ضجيج: ${ruminationCount}`}
          </p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{avgMood != null ? "متوسط آخر 7 أيام" : "كل ما قل الضجيج، المؤشر يزيد"}</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">تقدم عملي</p>
          <p className="text-xl font-bold text-violet-400">أيام إنجاز: {completedDaysCount}</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">كل يوم إنجاز بيثبّت استقرارك</p>
        </div>
      </div>
      {pathId === "path_detox" && onUpdateBoundaryLegitimacyScore && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-3 text-right">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">كيفك مع الحدود؟</p>
          <p className="text-xs text-amber-800 dark:text-amber-300 mb-2">ركز على إحساسك الآن مع تفعيل الحدود</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 0, label: "أشعر بالذنب لما أقول لا" },
              { value: 50, label: "عارف حقي لكن لسه فيه شعور بالذنب" },
              { value: 100, label: "أنا واثق من حقي والحدود طبيعية" }
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onUpdateBoundaryLegitimacyScore(value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  boundaryLegitimacyScore === value
                    ? "bg-amber-600 text-white ring-2 ring-amber-400"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800/60"
                }`}
              >
                {value}% — {label}
              </button>
            ))}
          </div>
          {boundaryLegitimacyScore != null && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">القراءة الحالية: {boundaryLegitimacyScore}%</p>
          )}
        </div>
      )}
      {lastPathGeneratedAt != null && (
        <p className="text-[10px] text-slate-500 mb-3 font-medium px-1">تحديث وصفي: {formatPathGeneratedAt(lastPathGeneratedAt)}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-400 ml-2 font-medium opacity-60">آخر {LAST_N_DAYS} يوم:</span>
        {dates.map((date) => {
          const done = completedByDate.has(date);
          const isToday = date === today;
          return (
            <span
              key={date}
              title={
                isToday
                  ? `اليوم — ${done ? (moodByDate.has(date) ? `مُنجَز، مزاج ${moodByDate.get(date)}/5` : "مُنجَز") : ""}`
                  : `${date}${done ? (moodByDate.has(date) ? ` — مُنجَز، مزاج ${moodByDate.get(date)}/5` : " — مُنجَز") : ""}`
              }
              className={`inline-flex w-7 h-7 rounded-lg items-center justify-center text-[10px] font-bold transition-all ${
                done
                  ? "bg-teal-500/80 text-white shadow-lg shadow-teal-500/20"
                  : isToday
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 ring-1 ring-amber-500/20"
                    : "bg-white/5 text-slate-500 border border-white/5 opacity-40"
              }`}
            >
              {new Date(date + "T12:00:00").getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** مسار التعافي الديناميكي — أسابيع 1، 2، 3 + تسجيل التقدّم اليومي */
const PathEngineBlock: FC<{
  pathSnapshot: RecoveryPath;
  pathNameAr: string;
  completedSteps: string[];
  onToggleStep: (stepId: string) => void;
  stepInputs: Record<string, string>;
  onUpdateStepInput: (stepId: string, value: string) => void;
  nodeId?: string;
  onAddDailyPathProgress?: (nodeId: string, entry: DailyPathProgress) => void;
  personLabel?: string;
}> = ({ pathSnapshot, pathNameAr, completedSteps, onToggleStep, stepInputs, onUpdateStepInput, nodeId, onAddDailyPathProgress, personLabel }) => {
  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3>(1);
  const [selectedDay, setSelectedDay] = useState(0);
  const [moodPromptForTaskId, setMoodPromptForTaskId] = useState<string | null>(null);

  const phase = pathSnapshot.phases[`week${selectedWeek}` as "week1" | "week2" | "week3"];
  const tasks = phase?.tasks ?? [];
  const currentTask = tasks[selectedDay];
  const isCurrentDone = currentTask ? completedSteps.includes(currentTask.id) : false;

  const getTaskIcon = (type: string) => {
    const icons: Record<string, string> = {
      reflection: "🤔",
      writing: "✍️",
      practice: "🎯",
      observation: "👀",
      challenge: "⚡",
      breathing: "🌬️"
    };
    return icons[type] || "📝";
  };

  const handleMarkDone = (taskId: string, moodScore?: number) => {
    const date = new Date().toISOString().slice(0, 10);
    const task = [...(pathSnapshot.phases.week1?.tasks ?? []), ...(pathSnapshot.phases.week2?.tasks ?? []), ...(pathSnapshot.phases.week3?.tasks ?? [])].find((t) => t.id === taskId);
    const taskLabel = task?.title;
    onToggleStep(taskId);
    if (nodeId && onAddDailyPathProgress) {
      onAddDailyPathProgress(nodeId, {
        date,
        didComplete: true,
        taskId,
        ...(moodScore != null && moodScore >= 1 && moodScore <= 5 && { moodScore })
      });
    }
    recordJourneyEvent("task_completed", {
      pathId: pathSnapshot.id,
      taskId,
      date,
      moodScore: moodScore ?? undefined,
      taskLabel,
      personLabel,
      nodeId
    });
    setMoodPromptForTaskId(null);
  };

  const startedTasksRef = useRef<Set<string>>(new Set());
  const handleClickDone = (taskId: string) => {
    if (!startedTasksRef.current.has(taskId)) {
      startedTasksRef.current.add(taskId);
      const task = [...(pathSnapshot.phases.week1?.tasks ?? []), ...(pathSnapshot.phases.week2?.tasks ?? []), ...(pathSnapshot.phases.week3?.tasks ?? [])].find((t) => t.id === taskId);
      recordJourneyEvent("task_started", {
        pathId: pathSnapshot.id,
        taskId,
        taskLabel: task?.title,
        personLabel,
        nodeId
      });
    }
    setMoodPromptForTaskId(taskId);
  };

  const handleMoodSelect = (taskId: string, moodScore: number) => {
    handleMarkDone(taskId, moodScore);
  };

  const handleMoodSkip = (taskId: string) => {
    handleMarkDone(taskId);
  };

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-900/40 backdrop-blur-xl text-right">
      <div className="p-6 bg-white/5 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🛤️</span> مسار الاستعادة
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter ${
              pathSnapshot.aiGenerated ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-400"
            }`}>
              {pathSnapshot.aiGenerated ? "AI Optimized" : "Standard"}
            </span>
          </h3>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-4">{pathNameAr}</p>
        <div className="flex gap-2 flex-wrap">
          {([1, 2, 3] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => { setSelectedWeek(w); setSelectedDay(0); }}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                selectedWeek === w
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
              }`}
            >
              الأسبوع {w}
            </button>
          ))}
        </div>
        {phase && (
          <div className="mt-4 p-4 bg-amber-500/5 border-r-2 border-amber-500/30 rounded-l-md">
            <p className="text-sm font-bold text-amber-200">{phase.focus}</p>
            {phase.description && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{phase.description}</p>
            )}
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        {tasks.length > 0 && (
          <>
            <div className="flex gap-1 flex-wrap justify-center">
              {tasks.map((t, i) => {
                const done = completedSteps.includes(t.id);
                const active = selectedDay === i;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedDay(i)}
                    className={`min-w-9 py-1.5 px-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-teal-600 text-white ring-2 ring-teal-400"
                        : done
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {done ? "✓ " : ""}اليوم {i + 1}
                  </button>
                );
              })}
            </div>
            {currentTask && (
              <div
                className={`p-6 rounded-2xl border transition-all duration-500 ${
                  isCurrentDone 
                    ? "bg-teal-500/10 border-teal-500/30" 
                    : "bg-white/5 border-white/10 shadow-xl shadow-black/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${isCurrentDone ? 'bg-teal-500/20' : 'bg-white/5 border border-white/5'}`}>
                    <span className="text-2xl shrink-0">{getTaskIcon(currentTask.type)}</span>
                  </div>
                  <div className="flex-1">
                    {currentTask.title && (
                      <p className="text-md font-bold text-white mb-2 tracking-tight">{currentTask.title}</p>
                    )}
                    <p
                      className={`text-sm leading-relaxed ${isCurrentDone ? "text-teal-200/50 line-through" : "text-slate-200"}`}
                    >
                      {currentTask.text}
                    </p>
                    {currentTask.helpText && (
                      <p className="text-xs text-slate-400 mt-3 p-3 bg-white/5 rounded-xl border-r-2 border-amber-500/50">
                        💡 {currentTask.helpText}
                      </p>
                    )}
                    {currentTask.requiresInput && (
                      <textarea
                        value={stepInputs[currentTask.id] ?? ""}
                        onChange={(e) => onUpdateStepInput(currentTask.id, e.target.value)}
                        placeholder={currentTask.placeholder}
                        rows={3}
                        className="w-full mt-4 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none transition-all"
                      />
                    )}
                    {!isCurrentDone && moodPromptForTaskId !== currentTask.id && (
                      <button
                        type="button"
                        onClick={() => handleClickDone(currentTask.id)}
                        disabled={currentTask.requiresInput && !(stepInputs[currentTask.id] ?? "").trim()}
                        className="mt-6 w-full py-4 px-6 rounded-2xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        الخطوة اتنفذت ✅
                      </button>
                    )}
                    {!isCurrentDone && moodPromptForTaskId === currentTask.id && (
                      <div className="mt-6 p-5 bg-slate-950/40 border border-amber-500/30 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-sm font-bold text-amber-200 mb-4">الرادار بيقول إيه بعد التنفيذ؟</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {( [1, 2, 3, 4, 5] as const ).map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleMoodSelect(currentTask.id, score)}
                              className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-all"
                            >
                              {MOOD_LABELS[score]}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleMoodSkip(currentTask.id)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold tracking-widest px-1"
                        >
                          تجاوز القياس مؤقتًا
                        </button>
                      </div>
                    )}
                    {isCurrentDone && (
                      <div className="mt-4 p-3 bg-teal-500/10 rounded-xl flex items-center gap-2 border border-teal-500/20">
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        <p className="text-xs text-teal-400 font-bold">برافو! المهمة دي خلصت</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {phase?.successCriteria && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 mt-4">
                <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider font-bold mb-1 opacity-60">علامة الحسم</p>
                <p className="text-xs text-slate-300 font-medium italic">"{phase.successCriteria}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/** مسار فك الارتباط: مرساة الواقع + وحشني + سجل الاجترار */
const DetachmentSection: FC<{
  personLabel: string;
  detachmentReasons: string[];
  realityAnchorDraft: string[];
  setRealityAnchorDraft: (v: string[]) => void;
  saveRealityAnchor: () => void;
  onUpdateDetachmentReasons?: (r: string[]) => void;
  showRealityAnchor: boolean;
  setShowRealityAnchor: (v: boolean) => void;
  ruminationCount: number;
  showRuminationPrompt: boolean;
  setShowRuminationPrompt: (v: boolean) => void;
  showRuminationResponse: boolean;
  onRuminationChoice: () => void;
}> = ({
  personLabel,
  detachmentReasons,
  realityAnchorDraft,
  setRealityAnchorDraft,
  saveRealityAnchor,
  showRealityAnchor,
  setShowRealityAnchor,
  ruminationCount,
  showRuminationPrompt,
  setShowRuminationPrompt,
  showRuminationResponse,
  onRuminationChoice
}) => {
  const [guiltInput, setGuiltInput] = useState("");
  const [guiltResponse, setGuiltResponse] = useState<string | null>(null);
  const [guiltLoading, setGuiltLoading] = useState(false);

  const handleGuiltCourt = async () => {
    if (!guiltInput.trim()) return;
    setGuiltLoading(true);
    setGuiltResponse(null);
    try {
      const reframe = await reframeGuiltThought(guiltInput.trim(), personLabel);
      setGuiltResponse(reframe ?? mapCopy.detachmentGuiltCourtStaticResponse);
    } catch {
      setGuiltResponse(mapCopy.detachmentGuiltCourtStaticResponse);
    } finally {
      setGuiltLoading(false);
    }
  };

  return (
  <div className="space-y-6 p-6 bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-2xl text-right">
    <h3 className="text-xl font-bold text-white flex items-center gap-3">
      <span className="text-2xl">⚓</span>
      {mapCopy.detachmentTitle}
    </h3>
    
    {/* محكمة الضمير */}
    <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
      <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">⚖️ {mapCopy.detachmentGuiltCourtTitle}</h4>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">{mapCopy.detachmentGuiltCourtHint}</p>
      <input
        type="text"
        value={guiltInput}
        onChange={(e) => setGuiltInput(e.target.value)}
        placeholder={mapCopy.detachmentGuiltCourtPlaceholder}
        className="w-full bg-slate-950/50 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-violet-500/50 mb-3"
      />
      <button
        type="button"
        onClick={handleGuiltCourt}
        disabled={guiltLoading || !guiltInput.trim()}
        className="w-full sm:w-auto rounded-xl bg-violet-600 text-white px-6 py-3 text-sm font-bold hover:bg-violet-500 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
      >
        {guiltLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
        {guiltLoading ? "جاري الرد…" : mapCopy.detachmentGuiltCourtButton}
      </button>
      {guiltResponse && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-violet-200 font-medium leading-relaxed"
        >
          {guiltResponse}
        </motion.div>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* مرساة الواقع */}
      <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
        <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">📍 {mapCopy.detachmentRealityAnchor}</h4>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">{mapCopy.detachmentRealityAnchorHint}</p>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              value={realityAnchorDraft[i] ?? ""}
              onChange={(e) => {
                const next = [...realityAnchorDraft];
                next[i] = e.target.value;
                setRealityAnchorDraft(next);
              }}
              placeholder={mapCopy.detachmentRealityAnchorPlaceholder}
              className="w-full bg-slate-950/50 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-teal-500/50"
            />
          ))}
        </div>
        <button type="button" onClick={saveRealityAnchor} className="mt-4 w-full rounded-xl bg-teal-600 text-white px-6 py-3 text-sm font-bold hover:bg-teal-500 transition-all">
          حفظ المراسـي
        </button>
      </div>

      <div className="space-y-4">
        {/* وحشني / حاسس بضعف */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/5 h-full flex flex-col justify-center">
          <button
            type="button"
            onClick={() => setShowRealityAnchor(!showRealityAnchor)}
            className="w-full rounded-2xl border-2 border-rose-500/20 bg-rose-500/10 text-rose-200 px-6 py-6 text-md font-extrabold hover:bg-rose-500/20 transition-all"
          >
            {mapCopy.detachmentWeakButton}
          </button>
          <AnimatePresence>
            {showRealityAnchor && (realityAnchorDraft.some((s) => s.trim()) || detachmentReasons.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-slate-950/50 border border-rose-500/20 rounded-xl text-sm text-slate-300">
                  <p className="font-bold text-rose-300 mb-3 flex items-center gap-2">⚠️ اقرأ ده قبل ما تضعف:</p>
                  <ul className="space-y-2">
                    {(detachmentReasons.length >= 3 ? detachmentReasons : realityAnchorDraft).filter(Boolean).map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-rose-500 mt-1.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

    {/* سجل الاجترار + إشارة قف (Bento Row) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
        <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">🧠 {mapCopy.detachmentRumination}</h4>
        {!showRuminationPrompt && !showRuminationResponse && (
          <button
            type="button"
            onClick={() => setShowRuminationPrompt(true)}
            className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 text-sm font-bold hover:bg-amber-500/20 transition-all"
          >
            {mapCopy.detachmentRuminationButton}
          </button>
        )}
        {showRuminationPrompt && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-amber-200 px-1">{mapCopy.detachmentRuminationPrompt}</p>
            <div className="flex flex-wrap gap-2">
              {(["guilt", "nostalgia", "fear"] as const).map((key) => (
                <button 
                  key={key} 
                  type="button" 
                  onClick={onRuminationChoice} 
                  className="flex-1 min-w-[80px] rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-100 px-3 py-2 text-[10px] font-bold hover:bg-amber-500/40 transition-all"
                >
                  {mapCopy.detachmentRuminationOptions[key]}
                </button>
              ))}
            </div>
          </div>
        )}
        {showRuminationResponse && (
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs font-bold text-teal-300 leading-relaxed">
            {mapCopy.detachmentRuminationResponse}
          </div>
        )}
        {ruminationCount > 0 && (
          <p className="text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-widest opacity-50">عدد التسجيلات: {ruminationCount}</p>
        )}
      </div>

      <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
        <p className="text-xs text-slate-400 mb-4 leading-relaxed font-medium">{mapCopy.detachmentStopSignHint}</p>
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([150, 80, 150]);
            }
          }}
          className="w-full rounded-2xl bg-slate-800 border border-white/10 text-white px-6 py-6 text-lg font-black hover:bg-slate-700 transition-all shadow-xl active:scale-95"
        >
          🛑 {mapCopy.detachmentStopSignButton}
        </button>
      </div>
    </div>
  </div>
  );
};

/** مناهج التعافي (الحدود الداخلية: تحرر من الذنب، صيام شعوري، إيقاف استحضار، حدود مع الأفكار) */
const DetachmentCurriculaBlock: FC<{ personLabel: string }> = ({ personLabel }) => {
  const [result, setResult] = useState<DetachmentCurriculumResult | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    generateDetachmentCurriculum(personLabel).then((r) => {
      if (!cancelled) {
        setResult(r);
        setLoading(false);
      }
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [personLabel]);
  if (loading) {
    return (
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-right">
        <p className="text-sm text-slate-600">جاري تجهيز مسارات الحماية...</p>
      </div>
    );
  }
  if (!result) return null;
  return (
    <div className="space-y-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-right">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <span>📚</span> مسارات الحماية
      </h3>
      <p className="text-sm font-semibold text-slate-700">{result.status_title}</p>
      <p className="text-sm text-slate-600 leading-relaxed">{result.deep_explanation}</p>
      <p className="text-sm text-teal-800 font-medium">{result.goal_reframed}</p>
      <p className="text-xs text-slate-500">{result.suggested_zone}</p>
      <div className="space-y-4 pt-2">
        {result.custom_curriculum.map((cur) => (
          <div key={cur.id} className="p-3 bg-white border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-800 mb-1">{cur.nameAr}</h4>
            <p className="text-xs text-slate-600 mb-2">{cur.description}</p>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              {cur.exercises.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DynamicRecoveryPlan: FC<DynamicRecoveryPlanProps> = ({
  personLabel,
  ring,
  situations,
  selectedSymptoms = [],
  completedSteps,
  onToggleStep,
  onUpdateStepInput,
  stepInputs,
  stepFeedback = {},
  onStepFeedback,
  focusTraumaInheritance,
  detachmentMode,
  detachmentReasons = [],
  onUpdateDetachmentReasons,
  ruminationCount = 0,
  onIncrementRumination,
  nodeId,
  pathId,
  recoveryPathSnapshot,
  onUpdateRecoveryPathSnapshot,
  onAddDailyPathProgress,
  dailyPathProgress = [],
  lastPathGeneratedAt,
  goalId,
  boundaryLegitimacyScore,
  onUpdateBoundaryLegitimacyScore
}) => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [showInsights, setShowInsights] = useState(true);
  const [showRealityAnchor, setShowRealityAnchor] = useState(false);
  const [realityAnchorDraft, setRealityAnchorDraft] = useState<string[]>(() =>
    detachmentReasons.length >= 3 ? detachmentReasons : ["", "", ""]
  );
  const [showRuminationPrompt, setShowRuminationPrompt] = useState(false);
  const [showRuminationResponse, setShowRuminationResponse] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);


  const [isGenerating, setIsGenerating] = useState(false);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [pathGenerating, setPathGenerating] = useState(false);
  const [isRegeneratingPath, setIsRegeneratingPath] = useState(false);

  const pathSnapshot = isRecoveryPath(recoveryPathSnapshot) ? recoveryPathSnapshot : null;
  const hasHardFeedback = Object.values(stepFeedback).some((v) => v === "hard" || v === "unrealistic");
  const detachmentKey = detachmentReasons.join(",");

  useEffect(() => {
    if (!nodeId || !pathId || pathSnapshot || !onUpdateRecoveryPathSnapshot) return;
    let cancelled = false;
    setPathGenerating(true);
    const symptomType = selectedSymptoms?.length ? symptomIdsToSymptomType(selectedSymptoms) : undefined;
    const relationshipRole = goalId && ["family", "work", "love", "money", "general"].includes(goalId) ? (goalId as RelationshipRole) : undefined;
    generateRecoveryPathFromAI({ personLabel, pathId, symptomType, relationshipRole })
      .then((result) => {
        if (!cancelled && result && onUpdateRecoveryPathSnapshot) {
          onUpdateRecoveryPathSnapshot(result);
          recordJourneyEvent("path_started", {
            pathId: result.id,
            zone: ring,
            symptomType: symptomType ?? undefined,
            relationshipRole: goalId ?? undefined
          });
        }
      })
      .finally(() => {
        if (!cancelled) setPathGenerating(false);
      });
    return () => { cancelled = true; };
  }, [nodeId, pathId, personLabel, pathSnapshot, onUpdateRecoveryPathSnapshot, selectedSymptoms, goalId, ring]);

  // Generate plan when component mounts or situations change
  useEffect(() => {
    async function generatePlan() {
      if (situations.length < 2) return;

      setIsGenerating(true);
      try {
        // Try AI-powered analysis first
        const analysis = await analyzeWithAI(situations);
        setIsAIPowered(analysis.aiGenerated || false);

        // Get symptom-specific exercises
        const symptomExercises = selectedSymptoms.length > 0 
          ? getExercisesForSymptoms(selectedSymptoms)
          : [];

        // Generate AI-powered plan with symptom exercises integrated
        const generatedPlan = await generateAIPlan(
          personLabel,
          ring,
          analysis.patterns,
          situations,
          analysis.insights,
          symptomExercises, // Pass symptom exercises to be integrated
          focusTraumaInheritance
        );
        setPlan(generatedPlan);
      } catch (error) {
        console.error('Error generating plan:', error);
      } finally {
        setIsGenerating(false);
      }
    }

    generatePlan();
  }, [situations, personLabel, ring, selectedSymptoms, focusTraumaInheritance]);

  useEffect(() => {
    if (detachmentReasons.length >= 3) setRealityAnchorDraft([...detachmentReasons]);
    else if (detachmentReasons.length === 0) setRealityAnchorDraft(["", "", ""]);
  }, [detachmentKey, detachmentReasons]);

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) {
        next.delete(week);
      } else {
        next.add(week);
      }
      return next;
    });
  };

  if (pathGenerating && pathId && !pathSnapshot) {
    return (
      <div className="p-6 bg-teal-50 border-2 border-teal-300 rounded-xl text-center">
        <Sparkles className="w-8 h-8 text-teal-600 mx-auto mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-teal-900 mb-2">جاري تجهيز مسار الاستعادة...</p>
        <p className="text-xs text-teal-800">بنصمّم خطوات الأسبوع الأول مخصوص ليك.</p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="p-6 bg-purple-50 border-2 border-purple-300 rounded-xl text-center">
        <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-purple-900 mb-2">
          🧠 بنقرأ المشهد...
        </p>
        <p className="text-xs text-purple-800">
          {geminiClient.isAvailable() 
            ? 'الذكاء الاصطناعي بيحلل تقاريرك ويبني مسار مخصص ليك...'
            : 'بنحلل تقاريرك وبنبني مسار مخصص ليك...'}
        </p>
      </div>
    );
  }

  const saveRealityAnchor = () => {
    const trimmed = realityAnchorDraft.map((s) => s.trim()).filter(Boolean);
    if (trimmed.length >= 1 && onUpdateDetachmentReasons)
      onUpdateDetachmentReasons([trimmed[0] ?? "", trimmed[1] ?? "", trimmed[2] ?? ""].slice(0, 3));
  };

  const handleRuminationChoice = () => {
    setShowRuminationPrompt(false);
    setShowRuminationResponse(true);
    onIncrementRumination?.();
    setTimeout(() => setShowRuminationResponse(false), 4000);
  };

  if (!plan || situations.length < 2) {
    const planRuleBlock = (
      <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-xl text-right">
        <p className="text-base font-bold text-amber-900 mb-2">❓ {mapCopy.planRuleTitle}</p>
        <p className="text-sm text-amber-800 leading-relaxed">{mapCopy.planRuleBody}</p>
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-black text-amber-900">
             <span>{mapCopy.planRuleCounter(situations.length)}</span>
             <span>{Math.min(100, (situations.length / 2) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-amber-200/50 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${(situations.length / 2) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    );
    if (detachmentMode || pathSnapshot) {
      return (
        <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {detachmentMode && (
            <>
              <DetachmentSection
                personLabel={personLabel}
                detachmentReasons={detachmentReasons}
                realityAnchorDraft={realityAnchorDraft}
                setRealityAnchorDraft={setRealityAnchorDraft}
                saveRealityAnchor={saveRealityAnchor}
                onUpdateDetachmentReasons={onUpdateDetachmentReasons}
                showRealityAnchor={showRealityAnchor}
                setShowRealityAnchor={setShowRealityAnchor}
                ruminationCount={ruminationCount}
                showRuminationPrompt={showRuminationPrompt}
                setShowRuminationPrompt={setShowRuminationPrompt}
                showRuminationResponse={showRuminationResponse}
                onRuminationChoice={handleRuminationChoice}
              />
              <DetachmentCurriculaBlock personLabel={personLabel} />
            </>
          )}
          {pathSnapshot && (
            <>
              {hasHardFeedback && pathId && onUpdateRecoveryPathSnapshot && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-right">
                  <p className="text-xs text-amber-800 mb-2">سجّلت إن تمرين كان قاسي أو مش واقعي. نقدر نعدّل المسار عشان التمارين الجاية تكون أخف.</p>
                  <button
                    type="button"
                    disabled={isRegeneratingPath}
                    onClick={async () => {
                      if (!pathId || !onUpdateRecoveryPathSnapshot) return;
                      setIsRegeneratingPath(true);
                      try {
                        const symptomType = selectedSymptoms?.length ? symptomIdsToSymptomType(selectedSymptoms) : undefined;
                        const relationshipRole = goalId && ["family", "work", "love", "money", "general"].includes(goalId) ? (goalId as RelationshipRole) : undefined;
                    const result = await generateRecoveryPathFromAI({
                      personLabel,
                      pathId,
                      lastDifficulty: "المستخدم واجه التمرين قاسي أو مش واقعي",
                      symptomType,
                      relationshipRole
                    });
                    if (result) {
                      onUpdateRecoveryPathSnapshot(result);
                      recordJourneyEvent("path_regenerated", { pathId, reason: "difficulty" });
                    }
                      } finally {
                        setIsRegeneratingPath(false);
                      }
                    }}
                    className="rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isRegeneratingPath ? "جاري التعديل…" : "أعد تحضير المسار"}
                  </button>
                </div>
              )}
              <PathProgressPanel
            dailyPathProgress={dailyPathProgress}
            lastPathGeneratedAt={lastPathGeneratedAt}
            completedStepsCount={completedSteps.length}
            ruminationCount={ruminationCount}
            pathId={pathId}
            boundaryLegitimacyScore={boundaryLegitimacyScore}
            onUpdateBoundaryLegitimacyScore={onUpdateBoundaryLegitimacyScore}
          />
              <PathEngineBlock
                pathSnapshot={pathSnapshot}
                pathNameAr={pathSnapshot.nameAr}
                completedSteps={completedSteps}
                onToggleStep={onToggleStep}
                stepInputs={stepInputs}
                onUpdateStepInput={onUpdateStepInput}
                nodeId={nodeId}
                onAddDailyPathProgress={onAddDailyPathProgress}
                personLabel={personLabel}
              />
            </>
          )}
          {planRuleBlock}
        </motion.div>
      );
    }
    return planRuleBlock;
  }

  const completedWeeks = plan.steps.filter(step => 
    step.actions.every(action => 
      !action.requiresInput || completedSteps.includes(action.id)
    )
  ).length;

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {detachmentMode && (
        <>
          <DetachmentSection
            personLabel={personLabel}
            detachmentReasons={detachmentReasons}
            realityAnchorDraft={realityAnchorDraft}
            setRealityAnchorDraft={setRealityAnchorDraft}
            saveRealityAnchor={saveRealityAnchor}
            onUpdateDetachmentReasons={onUpdateDetachmentReasons}
            showRealityAnchor={showRealityAnchor}
            setShowRealityAnchor={setShowRealityAnchor}
            ruminationCount={ruminationCount}
            showRuminationPrompt={showRuminationPrompt}
            setShowRuminationPrompt={setShowRuminationPrompt}
            showRuminationResponse={showRuminationResponse}
            onRuminationChoice={handleRuminationChoice}
          />
          <DetachmentCurriculaBlock personLabel={personLabel} />
        </>
      )}
      {pathSnapshot && (
        <>
          {hasHardFeedback && pathId && onUpdateRecoveryPathSnapshot && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-right">
              <p className="text-xs text-amber-800 mb-2">سجّلت إن تمرين كان قاسي أو مش واقعي. نقدر نعدّل المسار عشان التمارين الجاية تكون أخف.</p>
              <button
                type="button"
                disabled={isRegeneratingPath}
                onClick={async () => {
                  if (!pathId || !onUpdateRecoveryPathSnapshot) return;
                  setIsRegeneratingPath(true);
                  try {
                    const symptomType = selectedSymptoms?.length ? symptomIdsToSymptomType(selectedSymptoms) : undefined;
                    const relationshipRole = goalId && ["family", "work", "love", "money", "general"].includes(goalId) ? (goalId as RelationshipRole) : undefined;
                    const result = await generateRecoveryPathFromAI({
                      personLabel,
                      pathId,
                      lastDifficulty: "المستخدم واجه التمرين قاسي أو مش واقعي",
                      symptomType,
                      relationshipRole
                    });
                    if (result) {
                      onUpdateRecoveryPathSnapshot(result);
                      recordJourneyEvent("path_regenerated", { pathId, reason: "difficulty" });
                    }
                  } finally {
                    setIsRegeneratingPath(false);
                  }
                }}
                className="rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-700 disabled:opacity-50"
              >
                {isRegeneratingPath ? "جاري التعديل…" : "أعد تحضير المسار"}
              </button>
            </div>
          )}
          <PathProgressPanel
            dailyPathProgress={dailyPathProgress}
            lastPathGeneratedAt={lastPathGeneratedAt}
            completedStepsCount={completedSteps.length}
            ruminationCount={ruminationCount}
            pathId={pathId}
            boundaryLegitimacyScore={boundaryLegitimacyScore}
            onUpdateBoundaryLegitimacyScore={onUpdateBoundaryLegitimacyScore}
          />
          <PathEngineBlock
            pathSnapshot={pathSnapshot}
            pathNameAr={pathSnapshot.nameAr}
            completedSteps={completedSteps}
            onToggleStep={onToggleStep}
            stepInputs={stepInputs}
            onUpdateStepInput={onUpdateStepInput}
            nodeId={nodeId}
            onAddDailyPathProgress={onAddDailyPathProgress}
            personLabel={personLabel}
          />
        </>
      )}
      {/* Header - عنوان ديناميكي */}
      <div className="p-5 bg-linear-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">🚀</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-bold text-purple-900">
                {getPlanTitle(personLabel, ring)}
              </h3>
              {isAIPowered ? (
                <span className="flex items-center gap-1 px-2 py-1 bg-purple-200 text-purple-900 rounded-full text-xs font-semibold">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-semibold">
                  <span title="نسخة ثابتة" aria-label="نسخة ثابتة">
                    <LayoutTemplate className="w-3 h-3" aria-hidden="true" />
                  </span>
                </span>
              )}
              {focusTraumaInheritance && (
                <span className="flex items-center gap-1 px-2 py-1 bg-rose-200 text-rose-900 rounded-full text-xs font-semibold">
                  {mapCopy.focusTraumaBadge}
                </span>
              )}
            </div>
            <p className="text-sm text-purple-800">
              من واقع المواقف اللي سجلتها، جهزنا مسار حماية مخصص ليك على مدار {plan.totalWeeks} أسابيع
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1 bg-purple-200 text-purple-900 rounded-full font-semibold">
            {completedWeeks} / {plan.totalWeeks} أسابيع
          </span>
          {plan.primaryPattern && (
            <span className="px-3 py-1 bg-pink-200 text-pink-900 rounded-full font-semibold">
              النمط الرئيسي: {getPatternEmoji(plan.primaryPattern)} {getPatternName(plan.primaryPattern)}
            </span>
          )}
        </div>
      </div>

      {/* قراءة المشهد - مربوطة بالـ Tags */}
      {(plan.insights.length > 0 || selectedSymptoms.length > 0) && (
        <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="w-full p-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="font-bold text-blue-900">قراءة المشهد</span>
            </div>
            {showInsights ? (
              <ChevronUp className="w-5 h-5 text-blue-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-blue-700" />
            )}
          </button>
          {showInsights && (
            <div className="p-4 space-y-2 text-right">
              {selectedSymptoms.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-800">
                  • {buildInsightFromSymptoms(selectedSymptoms)}
                </div>
              )}
              {plan.insights
                .filter((i) => !/محتاجين مواقف|مواقف أكثر/i.test(i))
                .map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-800"
                  >
                    • {insight}
                  </div>
                ))}

              {/* Simulation Trigger */}
              <div className="mt-4 pt-4 border-t border-blue-100 flex justify-center">
                <button
                  onClick={() => setShowSimulation(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                >
                  <Terminal className="w-4 h-4" />
                  بدء محاكاة التدريب الميداني
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulation Modal */}
      <AnimatePresence>
        {showSimulation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSimulation(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <SymptomSimulation
                detectedSymptoms={selectedSymptoms}
                onClose={() => setShowSimulation(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Weekly Steps - يوم بيوم + Why Box */}
      <div className="space-y-3">
        {plan.steps.map((step) => (
          <WeekCard
            key={step.id}
            step={step}
            personLabel={personLabel}
            selectedSymptoms={selectedSymptoms}
            isExpanded={expandedWeeks.has(step.week)}
            onToggle={() => toggleWeek(step.week)}
            completedSteps={completedSteps}
            onToggleStep={onToggleStep}
            onUpdateInput={onUpdateStepInput}
            stepInputs={stepInputs}
            stepFeedback={stepFeedback}
            onStepFeedback={onStepFeedback}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Week Card - يوم بيوم + Why Box
interface WeekCardProps {
  step: DynamicStep;
  personLabel: string;
  selectedSymptoms: string[];
  isExpanded: boolean;
  onToggle: () => void;
  completedSteps: string[];
  onToggleStep: (stepId: string) => void;
  onUpdateInput: (stepId: string, value: string) => void;
  stepInputs: Record<string, string>;
  stepFeedback: Record<string, "hard" | "easy" | "unrealistic">;
  onStepFeedback?: (stepId: string, value: "hard" | "easy" | "unrealistic") => void;
}

const WeekCard: FC<WeekCardProps> = ({
  step,
  personLabel,
  selectedSymptoms,
  isExpanded,
  onToggle,
  completedSteps,
  onToggleStep,
  onUpdateInput,
  stepInputs,
  stepFeedback,
  onStepFeedback
}) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);

  const totalActions = step.actions.length;
  const completedCount = step.actions.filter((a) => completedSteps.includes(a.id)).length;
  const progressPct = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;
  const isComplete = completedCount === totalActions;

  const currentAction = step.actions[selectedDay - 1];
  const isCurrentCompleted = currentAction ? completedSteps.includes(currentAction.id) : false;

  const handleMarkDone = () => {
    if (!currentAction) return;
    if (currentAction.requiresInput && !(stepInputs[currentAction.id] || "").trim()) return;
    onToggleStep(currentAction.id);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1800);
  };

  const whyBoxText =
    selectedSymptoms.length > 0
      ? `لأن مدارك مع (${personLabel}) فيه ${selectedSymptoms.map(getSymptomLabel).join(" + ")}، فالتركيز هنا على حماية مساحتك وحدودك بدون قسوة.`
      : `التركيز هنا على حماية مساحتك ووضوح احتياجاتك مع (${personLabel}).`;

  return (
    <div className="border-2 border-purple-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between transition-colors ${
          isComplete ? "bg-green-50 hover:bg-green-100" : "bg-purple-50 hover:bg-purple-100"
        }`}
      >
        <div className="flex items-center gap-3 flex-1 text-right">
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          ) : (
            <Circle className="w-6 h-6 text-purple-400 shrink-0" />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-purple-900">
              الأسبوع {step.week}: {step.title}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">{step.goal}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${isComplete ? "bg-green-500" : "bg-purple-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {completedCount}/{totalActions}
              </span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-purple-700 shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-700 shrink-0" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-5 space-y-4 text-right border-t-2 border-purple-200">
          {/* Why Box */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-900 mb-1">💡 ليه الخطوات دي؟</p>
            <p className="text-sm text-amber-800">{whyBoxText}</p>
          </div>

          {step.warningMessage && (
            <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">{step.warningMessage}</p>
            </div>
          )}

          <p className="text-sm text-gray-700 leading-relaxed">{step.description}</p>

          {/* Stepper يوم بيوم */}
          <div className="flex gap-1 flex-wrap justify-center">
            {step.actions.map((_, i) => {
              const dayNum = i + 1;
              const done = completedSteps.includes(step.actions[i].id);
              const active = selectedDay === dayNum;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDay(dayNum)}
                  className={`min-w-9 py-1.5 px-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-purple-600 text-white ring-2 ring-purple-400"
                      : done
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {done ? "✓ " : ""}اليوم {dayNum}
                </button>
              );
            })}
          </div>

          {/* مهمة اليوم فقط */}
          {currentAction && (
            <div className="relative">
              <AnimatePresence mode="wait">
                {showCelebration && (
                  <motion.div
                    key="celebration"
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2 }}
                    className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                  >
                    <span className="text-4xl">🎉</span>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute text-xl font-bold text-green-600"
                    >
                      تم الحسم!
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
              <ActionItem
                key={currentAction.id}
                action={currentAction}
                index={selectedDay - 1}
                isCompleted={isCurrentCompleted}
                onMarkDone={handleMarkDone}
                value={stepInputs[currentAction.id] || ""}
                onUpdateInput={(v) => onUpdateInput(currentAction.id, v)}
                stepFeedbackValue={stepFeedback[currentAction.id]}
                onStepFeedback={
                  onStepFeedback
                    ? (value) => onStepFeedback(currentAction.id, value)
                    : undefined
                }
              />
            </div>
          )}

          <div className="pt-4 border-t border-purple-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">علامة الحسم:</span> {step.successCriteria}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Action Item - مهمة اليوم + تم الإنجاز + مش حاسس ده مناسب
interface ActionItemProps {
  action: DynamicStep["actions"][0];
  index: number;
  isCompleted: boolean;
  onMarkDone: () => void;
  value: string;
  onUpdateInput: (value: string) => void;
  stepFeedbackValue?: "hard" | "easy" | "unrealistic";
  onStepFeedback?: (value: "hard" | "easy" | "unrealistic") => void;
}

const ActionItem: FC<ActionItemProps> = ({
  action,
  isCompleted,
  onMarkDone,
  value,
  onUpdateInput,
  stepFeedbackValue,
  onStepFeedback
}) => {
  const [showFeedbackOptions, setShowFeedbackOptions] = useState(false);

  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      reflection: "🤔",
      writing: "✍️",
      practice: "🎯",
      observation: "👀",
      challenge: "⚡"
    };
    return icons[type] || "📝";
  };

  const canMarkDone = !action.requiresInput || value.trim().length > 0;

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isCompleted ? "bg-green-50 border-green-300" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{getActionIcon(action.type)}</span>
        <div className="flex-1">
          <p
            className={`text-sm font-medium ${
              isCompleted ? "text-green-800 line-through" : "text-gray-900"
            }`}
          >
            {action.text}
          </p>
          {action.helpText && (
            <p className="text-xs text-gray-600 mt-1">💡 {action.helpText}</p>
          )}

          {action.requiresInput && (
            <textarea
              value={value}
              onChange={(e) => onUpdateInput(e.target.value)}
              placeholder={action.placeholder}
              rows={3}
              className="w-full mt-2 border-2 border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          )}

          {/* زر تم الإنجاز */}
          {!isCompleted && (
            <button
              type="button"
              onClick={onMarkDone}
              disabled={!canMarkDone}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              الخطوة اتنفذت ✅
            </button>
          )}
          {isCompleted && (
            <p className="mt-2 text-sm text-green-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              المهمة اتنفذت
            </p>
          )}

          {/* مش حاسس التمرين ده مناسب */}
          {onStepFeedback && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowFeedbackOptions(!showFeedbackOptions)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                حاسس إن الخطوة دي مش مناسبة؟
              </button>
              {showFeedbackOptions && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(
                    [
                      { value: "hard" as const, label: "قاسي" },
                      { value: "easy" as const, label: "سهل" },
                      { value: "unrealistic" as const, label: "مش واقعي" }
                    ] as const
                  ).map(({ value: v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        onStepFeedback(v);
                        setShowFeedbackOptions(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        stepFeedbackValue === v
                          ? "bg-purple-100 text-purple-800 border border-purple-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {stepFeedbackValue && (
                <p className="mt-1 text-xs text-purple-600">
                  ملاحظتك اتسجلت — هنظبط الخطوات الجاية عليها
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getPatternEmoji(pattern: string): string {
  const emojis: Record<string, string> = {
    timing: "🕐",
    financial: "💰",
    emotional: "💔",
    behavioral: "🎭",
    boundary: "🚫"
  };
  return emojis[pattern] || "📊";
}

function getPatternName(pattern: string): string {
  const names: Record<string, string> = {
    timing: "انتهاك الحدود الزمنية",
    financial: "الضغط المالي",
    emotional: "الذنب المفتعل",
    behavioral: "السلوك المتكرر",
    boundary: "تجاهل الحدود"
  };
  return names[pattern] || pattern;
}
