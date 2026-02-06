import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { FeelingAnswers } from "../FeelingCheck";
import type { RealityAnswers } from "../RealityCheck";
import type { QuickAnswer2 } from "../../utils/suggestInitialRing";
import type { PersonGender } from "../../utils/resultScreenAI";
import { buildResultTemplateFromAnswers } from "../../utils/resultScreenTemplates";
import { useMapState } from "../../state/mapState";

interface ResultScreenProps {
  personLabel: string;
  personTitle?: string;
  personName?: string;
  personGender?: PersonGender;
  score: number;
  summaryOnly?: boolean;
  addedNodeId?: string;
  onClose?: (openNodeId?: string) => void;
  onOpenMission?: (nodeId: string) => void;
  realityAnswers?: RealityAnswers;
  feelingAnswers?: FeelingAnswers;
  isEmergency?: boolean;
  safetyAnswer?: QuickAnswer2;
}


export const ResultScreen: FC<ResultScreenProps> = ({
  personLabel,
  personTitle,
  personName,
  personGender,
  score,
  summaryOnly = false,
  addedNodeId,
  onClose,
  onOpenMission,
  realityAnswers,
  feelingAnswers,
  isEmergency,
  safetyAnswer
}) => {
  const displayName = useMemo(() => {
    const name = personName?.trim();
    const title = personTitle?.trim();
    if (name) return name;
    if (title) return title;
    return personLabel;
  }, [personTitle, personName, personLabel]);

  const result = useMemo(() => buildResultTemplateFromAnswers({
    score,
    feelingAnswers,
    realityAnswers,
    isEmergency,
    safetyAnswer,
    personGender
  }), [score, feelingAnswers, realityAnswers, isEmergency, safetyAnswer, personGender]);

  const missionProgress = useMapState((s) =>
    addedNodeId ? s.nodes.find((node) => node.id === addedNodeId)?.missionProgress : undefined
  );
  const startMission = useMapState((s) => s.startMission);
  const completedSteps = useMemo(() => {
    const checked = new Set(missionProgress?.checkedSteps ?? []);
    return result.steps.reduce((acc, _, index) => acc + (checked.has(index) ? 1 : 0), 0);
  }, [missionProgress?.checkedSteps, result.steps]);
  const totalSteps = result.steps.length;
  const isMissionStarted = Boolean(missionProgress?.startedAt);
  const isMissionCompleted = Boolean(missionProgress?.isCompleted);

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <>
        <div className="mb-3 text-sm font-semibold text-slate-700 text-center">
          {displayName}
        </div>

        <div className="p-6 bg-linear-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
            <span>{result.title}</span>
            <span
              className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title="نتيجة محسوبة من القالب"
            >
              قالب
            </span>
          </h2>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-500 text-center">
            <p>
              الحالة: <span className="font-semibold text-slate-700">{result.state_label}</span>
            </p>
            <p className="w-full">
              الهدف: <span className="font-semibold text-slate-700">{result.goal_label}</span>
            </p>
            <p className="w-full">
              الوعد: <span className="font-semibold text-slate-800">{result.promise_label}</span>
            </p>
            <p className="w-full text-xs text-slate-500 leading-relaxed">
              {result.promise_body}
            </p>
            <div className="w-full mt-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">المهمة:</span>{" "}
              {result.mission_label} —{" "}
              <span className="font-semibold text-slate-700">{result.mission_goal}</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl text-right mb-6">
          <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span>🔍</span> {result.understanding_title}
            <span
              className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title="نتيجة محسوبة من القالب"
            >
              قالب
            </span>
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {result.understanding_body}
          </p>
        </div>

        <div className="p-5 bg-violet-50 border-2 border-violet-200 rounded-xl text-right mb-6">
          <h3 className="text-sm font-bold text-violet-900 mb-2 flex items-center gap-2">
            {result.explanation_title}
            <span
              className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title="نتيجة محسوبة من القالب"
            >
              قالب
            </span>
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">{result.explanation_body}</p>
        </div>

        <div className="p-5 bg-amber-50 border-2 border-amber-200 rounded-xl text-right mb-6">
          <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
            <span>🎒</span> العتاد المطلوب
            <span
              className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title="نتيجة محسوبة من القالب"
            >
              قالب
            </span>
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {result.requirements.map((item, index) => (
              <li key={`${item.title}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-amber-200">
                <span className="font-semibold text-slate-800">{item.title}:</span>{" "}
                {item.detail}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-800">لو جاهز، ابدأ المهمة</span>
            <span className="text-xs text-slate-500">تقدر تتابع التنفيذ في شاشة مستقلة.</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              disabled={!addedNodeId}
              onClick={() => {
                if (!addedNodeId) return;
                if (!isMissionStarted) startMission(addedNodeId);
                onOpenMission?.(addedNodeId);
              }}
              className="rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold shadow hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMissionStarted ? "متابعة المهمة" : "ابدأ المهمة"}
            </button>
            {isMissionCompleted ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                مهمة مكتملة
              </span>
            ) : isMissionStarted ? (
              <span className="text-xs text-slate-500">
                التقدم: {completedSteps}/{totalSteps}
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-right mb-6">
          <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
            <span>🗺️</span> خطة التنفيذ
            <span
              className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title="نتيجة محسوبة من القالب"
            >
              قالب
            </span>
          </h3>
          <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
            {result.steps.map((step, index) => (
              <li key={`${step}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-emerald-200">
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="p-5 bg-rose-50 border-2 border-rose-200 rounded-xl text-right mb-6">
          <h3 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
            <span>⚠️</span> الكمائن المتوقعة
            <span
              className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title="نتيجة محسوبة من القالب"
            >
              قالب
            </span>
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {result.obstacles.map((item, index) => (
              <li key={`${item.title}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-rose-200">
                <span className="font-semibold text-slate-800">{item.title}:</span>{" "}
                {item.solution}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5 bg-slate-100 border-2 border-slate-300 rounded-xl text-right mb-6">
          <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <span>🎯</span> {result.suggested_zone_title}
            <span
              className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title="نتيجة محسوبة من القالب"
            >
              قالب
            </span>
          </h3>
          <p className="font-semibold text-slate-700 mb-2">{result.suggested_zone_label}</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {result.suggested_zone_body}
          </p>
        </div>
      </>

      {summaryOnly && onClose ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onClose(addedNodeId)}
            className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
          >
            تم
          </button>
        </div>
      ) : null}
    </motion.div>
  );
};
