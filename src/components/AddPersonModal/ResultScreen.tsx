import type { FC } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutTemplate, Info } from "lucide-react";
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
  const isEmotionalPrisoner = result.scenarioKey === "emotional_prisoner";

  const relationshipToneText = useMemo(() => {
    if (isEmotionalPrisoner) return "في هدوء خارجي، بس لسه محتاجين نقفل الاختراق الداخلي.";
    const label = result.state_label ?? "";
    if (label.includes("حمراء") || label.includes("استنزاف")) return "الجبهة دي ضاغطة، وأولوية المرحلة حماية مواردك.";
    if (label.includes("صفراء")) return "في إشارات استنزاف، ومع ضبط الدرع الوضع يتحسن بسرعة.";
    if (label.includes("خضراء")) return "الجبهة متوازنة، والهدف دلوقتي الحفاظ على استقرارها.";
    return "دي خلاصة واضحة لوضع الجبهة بناءً على إجاباتك.";
  }, [isEmotionalPrisoner, result.state_label]);

  const missionProgress = useMapState((s) =>
    addedNodeId ? s.nodes.find((node) => node.id === addedNodeId)?.missionProgress : undefined
  );
  const detachmentReasons = useMapState((s) =>
    addedNodeId
      ? s.nodes.find((node) => node.id === addedNodeId)?.recoveryProgress?.detachmentReasons
      : undefined
  );
  const startMission = useMapState((s) => s.startMission);
  const [showRealityPopup, setShowRealityPopup] = useState(false);
  const [showDopaminePopup, setShowDopaminePopup] = useState(false);
  const completedSteps = useMemo(() => {
    const checked = new Set(missionProgress?.checkedSteps ?? []);
    return result.steps.reduce((acc, _, index) => acc + (checked.has(index) ? 1 : 0), 0);
  }, [missionProgress?.checkedSteps, result.steps]);
  const totalSteps = result.steps.length;
  const isMissionStarted = Boolean(missionProgress?.startedAt);
  const isMissionCompleted = Boolean(missionProgress?.isCompleted);
  const missionButtonLabel = isMissionCompleted
    ? "المناورة اتقفلت"
    : isMissionStarted
      ? "كمّل المناورة"
      : "ابدأ المناورة";
  const missionButtonTone = isMissionCompleted
    ? "bg-emerald-600 hover:bg-emerald-700"
    : "bg-slate-900 hover:bg-slate-800";
  const shortPromiseBody = useMemo(() => {
    const trimmed = result.promise_body.trim();
    if (trimmed.length <= 120) return trimmed;
    return `${trimmed.slice(0, 120).trim()}...`;
  }, [result.promise_body]);
  const normalizedObstacles = useMemo(
    () =>
      result.obstacles.map((item) => ({
        ...item,
        solution: item.solution.replace("Euphoric Recall", "استدعاء الذكريات الوردية")
      })),
    [result.obstacles]
  );

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <>
        <div className="mb-5 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-center">
          <p className="text-xs font-semibold text-teal-800">قراءة الجبهة الحالية</p>
          <h3 className="mt-1 text-xl font-extrabold leading-tight text-slate-900">
            علاقتك مع{" "}
            <span className="inline-block max-w-[72vw] truncate align-bottom text-teal-700 sm:max-w-full" title={displayName}>
              {displayName}
            </span>
          </h3>
          {isEmotionalPrisoner && (
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {result.title}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-600">
            {relationshipToneText}
          </p>
        </div>

        <div className="p-6 bg-linear-to-b from-slate-50 to-white border border-slate-200 rounded-2xl mb-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
            <span>
              {isEmotionalPrisoner ? `الحالة: ${result.state_label}` : result.title}
            </span>
            <span
              className="inline-flex items-center justify-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
              title="نسخة ثابتة"
              aria-label="نسخة ثابتة"
            >
              <LayoutTemplate className="w-3 h-3" aria-hidden="true" />
            </span>
          </h2>
          {isEmotionalPrisoner && (
            <p className="mb-2 text-sm text-slate-600 leading-relaxed text-center">
              جسمك حر.. بس عقلك لسه هناك، أنت خرجت من المكان بس لسه محبوس في التفكير. بتصحى وتنام وأنت بتكلمهم في خيالك وبتدافع عن نفسك في محاكمات جوه دماغك.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-500 text-center">
            {isEmotionalPrisoner ? (
              <p className="w-full">
                التكتيك: <span className="font-semibold text-slate-700">العزل الصحي</span>
              </p>
            ) : (
              <p>
                الحالة: <span className="font-semibold text-slate-700">{result.state_label}</span>
              </p>
            )}
            <p className="w-full">
              الهدف: <span className="font-semibold text-slate-700">{result.goal_label}</span>
            </p>
            <p className="w-full">
              الوعد: <span className="font-semibold text-slate-800">{result.promise_label}</span>
            </p>
            <p className="w-full text-xs text-slate-500 leading-relaxed">
              {shortPromiseBody}
            </p>
            <div className="w-full mt-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">المناورة:</span>{" "}
              {result.mission_label} —{" "}
              <span className="font-semibold text-slate-700">{result.mission_goal}</span>
            </div>
          </div>
        </div>

        {!summaryOnly && (
          <>
            <div className="p-5 bg-sky-50/60 border border-sky-200 rounded-xl text-right mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span>🔍</span> {result.understanding_title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.understanding_body}
              </p>
            </div>

            <div className="p-5 bg-violet-50/60 border border-violet-200 rounded-xl text-right mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-violet-900 mb-2 flex items-center gap-2">
                {result.explanation_title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{result.explanation_body}</p>
            </div>

            <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-xl text-right mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                <span>🎒</span> العتاد المطلوب
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {result.requirements.map((item, index) => {
                  const isReality = item.title.includes("ملف القضية") || item.title.includes("قائمة الواقع");
                  const isDopamine = item.title.includes("بديل الدوبامين");
                  return (
                    <li key={`${item.title}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-amber-200 flex items-start justify-between gap-2">
                      <span>
                        <span className="font-semibold text-slate-800">{item.title}:</span>{" "}
                        {item.detail}
                      </span>
                      {(isReality || isDopamine) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isReality) setShowRealityPopup((v) => !v);
                            else setShowDopaminePopup((v) => !v);
                          }}
                          className="shrink-0 rounded-full p-1 text-amber-700 hover:bg-amber-200/80 transition-colors"
                          title={isReality ? "قائمة الواقع" : "بديل الدوبامين"}
                          aria-label={isReality ? "شرح قائمة الواقع" : "شرح بديل الدوبامين"}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {showRealityPopup && (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-right text-sm text-slate-800">
                  <p className="font-semibold text-amber-900 mb-2">قائمة الواقع (ملف القضية الحقيقي)</p>
                  {detachmentReasons && detachmentReasons.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {detachmentReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>ورقة مكتوب فيها «ليه بعدت عنهم؟» — تكتبها في خطة التعافي (مرساة الواقع) وتقرأها وقت الضعف.</p>
                  )}
                  <button type="button" onClick={() => setShowRealityPopup(false)} className="mt-2 text-xs text-amber-700 underline">إغلاق</button>
                </div>
              )}
              {showDopaminePopup && (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-right text-sm text-slate-800">
                  <p className="font-semibold text-amber-900 mb-2">بديل الدوبامين</p>
                  <p>نشاط ممتع جاهز فوراً لما الفكرة تهاجمك — مثلاً: مشي، مكالمة صديق، لعبة، أو أي شيء يخلّيك تركز في الحاضر.</p>
                  <button type="button" onClick={() => setShowDopaminePopup(false)} className="mt-2 text-xs text-amber-700 underline">إغلاق</button>
                </div>
              )}
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-800">لو جاهز، ابدأ المناورة</span>
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
                  className={`rounded-full text-white px-4 py-2 text-xs font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed ${missionButtonTone}`}
                >
                  {missionButtonLabel}
                </button>
                {!isMissionCompleted && isMissionStarted ? (
                  <span className="text-xs text-slate-500">
                    التقدم: {completedSteps}/{totalSteps}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-right mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <span>🗺️</span> خطة المناورة
              </h3>
              <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
                {result.steps.map((step, index) => (
                  <li key={`${step}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-emerald-200">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-5 bg-rose-50/55 border border-rose-200 rounded-xl text-right mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
                <span>⚠️</span> الكمائن المتوقعة
              </h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {normalizedObstacles.map((item, index) => {
                  const solutionHasReality = item.solution.includes("ملف القضية الحقيقي") || item.solution.includes("قائمة الواقع");
                  return (
                    <li key={`${item.title}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-rose-200">
                      <span className="font-semibold text-slate-800">{item.title}:</span>{" "}
                      {solutionHasReality ? (
                        <>
                          {item.solution.includes("ملف القضية الحقيقي")
                            ? (() => {
                                const [before, after] = item.solution.split("ملف القضية الحقيقي");
                                return (
                                  <>
                                    {before}
                                    <button
                                      type="button"
                                      onClick={() => setShowRealityPopup((v) => !v)}
                                      className="text-rose-700 font-semibold underline hover:text-rose-800"
                                    >
                                      ملف القضية الحقيقي
                                    </button>
                                    {after}
                                  </>
                                );
                              })()
                            : (() => {
                                const [before, after] = item.solution.split("قائمة الواقع");
                                return (
                                  <>
                                    {before}
                                    <button
                                      type="button"
                                      onClick={() => setShowRealityPopup((v) => !v)}
                                      className="text-rose-700 font-semibold underline hover:text-rose-800"
                                    >
                                      قائمة الواقع
                                    </button>
                                    {after}
                                  </>
                                );
                              })()}
                        </>
                      ) : (
                        item.solution
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-300 rounded-xl text-right mb-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span>🎯</span> {result.suggested_zone_title}
              </h3>
              <p className="font-semibold text-slate-700 mb-2">{result.suggested_zone_label}</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.suggested_zone_body}
              </p>
            </div>
          </>
        )}
      </>

      {summaryOnly && onClose ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onClose(addedNodeId)}
            className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
          >
            أضف الشخص
          </button>
        </div>
      ) : null}
    </motion.div>
  );
};
