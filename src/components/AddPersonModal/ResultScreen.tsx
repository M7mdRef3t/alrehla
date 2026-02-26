import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LayoutTemplate, Info } from "lucide-react";
import type { FeelingAnswers } from "../FeelingCheck";
import type { RealityAnswers } from "../RealityCheck";
import type { QuickAnswer2 } from "../../utils/suggestInitialRing";
import type { PersonGender } from "../../utils/resultScreenAI";
import { buildResultTemplateFromAnswers } from "../../utils/resultScreenTemplates";
import { realityScoreToRing } from "../../utils/realityScore";
import { useMapState } from "../../state/mapState";
import { emergencyCopy } from "../../copy/emergency";
import { recordFlowEvent, recordPathStartedOnce } from "../../services/journeyTracking";
import { getMapSyncSnapshot, subscribeMapSyncStatus } from "../../services/mapSync";
import { isUserMode } from "../../config/appEnv";

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
  /** عند الطوارئ — فتح غرفة الطوارئ (تمرين تنفس، أرقام نجدة) */
  onOpenEmergency?: () => void;
  realityAnswers?: RealityAnswers;
  feelingAnswers?: FeelingAnswers;
  isEmergency?: boolean;
  safetyAnswer?: QuickAnswer2;
  forcedGate?: boolean;
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
  onOpenEmergency,
  realityAnswers,
  feelingAnswers,
  isEmergency,
  safetyAnswer,
  forcedGate = false
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

  const ring = useMemo(() => (realityAnswers ? realityScoreToRing(realityAnswers) : "green"), [realityAnswers]);
  const ringInsight = useMemo(() => {
    const presence = personGender === "female" ? "وجودها" : personGender === "male" ? "وجوده" : "وجود الشخص ده";
    if (ring === "red") return `علاقتك بـ ${displayName} بتسحب طاقتك. ${presence} في المدار الأحمر حماية ليك.`;
    if (ring === "yellow") return `علاقتك بـ ${displayName} بتتبدل. ضبط المسافة هيساعدك.`;
    return `علاقتك بـ ${displayName} مصدر أمان. حافظ عليها.`;
  }, [ring, displayName, personGender]);
  const relationshipToneText = useMemo(() => {
    if (isEmotionalPrisoner) return "في هدوء خارجي، بس لسه محتاجين نقفل الضغط الداخلي.";
    if (summaryOnly) return ringInsight;
    const label = result.state_label ?? "";
    if (label.includes("حمراء") || label.includes("استنزاف")) return "المدار ده ضاغط، وأولوية المرحلة حماية طاقتك.";
    if (label.includes("صفراء")) return "في إشارات ضغط، ومع ضبط المساحة الوضع يتحسن بسرعة.";
    if (label.includes("خضراء")) return "المدار متوازن، والهدف دلوقتي الحفاظ على استقراره.";
    return "دي خلاصة واضحة لوضع المدار بناءً على إجاباتك.";
  }, [isEmotionalPrisoner, summaryOnly, ringInsight, result.state_label]);
  const singularReferenceText = useMemo(() => {
    if (personGender === "female") return "بتكلميها";
    if (personGender === "male") return "بتكلمه";
    return "بتكلمي الشخص ده";
  }, [personGender]);

  const missionProgress = useMapState((s) =>
    addedNodeId ? s.nodes.find((node) => node.id === addedNodeId)?.missionProgress : undefined
  );
  const detachmentReasons = useMapState((s) =>
    addedNodeId
      ? s.nodes.find((node) => node.id === addedNodeId)?.recoveryProgress?.detachmentReasons
      : undefined
  );
  const startMission = useMapState((s) => s.startMission);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [showRealityPopup, setShowRealityPopup] = useState(false);
  const [showDopaminePopup, setShowDopaminePopup] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [ctaStatus, setCtaStatus] = useState<string | null>(null);
  const [mapSyncSnapshot, setMapSyncSnapshot] = useState(() => getMapSyncSnapshot());
  const completedSteps = useMemo(() => {
    const checked = new Set(missionProgress?.checkedSteps ?? []);
    return result.steps.reduce((acc, _, index) => acc + (checked.has(index) ? 1 : 0), 0);
  }, [missionProgress?.checkedSteps, result.steps]);
  const totalSteps = result.steps.length;
  const isMissionStarted = Boolean(missionProgress?.startedAt);
  const isMissionCompleted = Boolean(missionProgress?.isCompleted);
  const missionButtonLabel = isMissionCompleted
    ? "الخطوة اتقفلت"
    : isMissionStarted
      ? "كمّل الخطوة"
      : "ابدأ الخطوة";
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
  const shareText = useMemo(() => {
    const lines = [
      `نتيجتي مع ${displayName}: ${isEmotionalPrisoner ? result.state_label : result.title}`,
      `الهدف: ${result.goal_label}`,
      `الخطوة الحالية: ${result.mission_label} — ${result.mission_goal}`
    ];
    return lines.join("\n");
  }, [displayName, isEmotionalPrisoner, result.goal_label, result.mission_goal, result.mission_label, result.state_label, result.title]);

  useEffect(() => {
    return subscribeMapSyncStatus((snapshot) => {
      setMapSyncSnapshot(snapshot);
    });
  }, []);

  const shouldShowMapSyncBanner = mapSyncSnapshot.status === "retrying" || mapSyncSnapshot.status === "failed";
  const mapSyncBannerText = mapSyncSnapshot.status === "retrying"
    ? "عطل فني.. جاري إعادة الحفظ"
    : "تعذر الحفظ السحابي مؤقتًا. هنحاول تلقائيًا عند فتح التطبيق.";
  const isForcedCtaMode = isUserMode && forcedGate;

  const startMissionAndTrack = (nodeId: string) => {
    const node = useMapState.getState().nodes.find((item) => item.id === nodeId);
    if (!node) return;

    if (!node.missionProgress?.startedAt) {
      startMission(nodeId);
    }

    const pathId =
      node.recoveryProgress?.pathId ??
      (node.ring === "red" ? "path_protection" : node.ring === "green" ? "path_deepening" : "path_negotiation");

    recordPathStartedOnce({
      nodeId,
      pathId,
      zone: node.ring,
      relationshipRole: personTitle?.trim() || undefined
    });
  };

  const handleShareResult = async () => {
    setShareStatus(null);
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const shareData = {
      title: `نتيجة ${displayName}`,
      text: shareText,
      url: typeof window !== "undefined" ? window.location.origin : undefined
    };
    try {
      if (nav && typeof nav.share === "function") {
        await nav.share(shareData);
        setShareStatus("تمت المشاركة بنجاح.");
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(shareText);
        setShareStatus("تم نسخ النتيجة. الصقها في أي تطبيق.");
        return;
      }
      setShareStatus("المشاركة غير متاحة على جهازك الآن.");
    } catch {
      setShareStatus("تعذر تنفيذ المشاركة الآن. جرّب مرة أخرى.");
    }
  };

  const handleDownloadShareImage = async () => {
    if (!shareCardRef.current) return;
    setShareBusy(true);
    setShareStatus(null);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `alrehla-result-${Date.now()}.png`;
      link.click();
      setShareStatus("تم تحميل صورة النتيجة.");
    } catch {
      setShareStatus("تعذر تحميل صورة النتيجة الآن.");
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      <>
        <motion.div
          className={`mb-5 card-unified border px-4 py-3 text-center ${
            ring === "red"
              ? "bg-rose-50/80 border-rose-200"
              : ring === "yellow"
                ? "bg-amber-50/80 border-amber-200"
                : "bg-teal-50/80 border-teal-100"
          }`}
          animate={summaryOnly ? { scale: [1, 1.015, 1] } : {}}
          transition={{ duration: 1.5, repeat: summaryOnly ? Infinity : 0, repeatDelay: 2.5 }}
        >
          <p className={`text-xs font-semibold ${ring === "red" ? "text-rose-800" : ring === "yellow" ? "text-amber-800" : "text-teal-800"}`}>
            قراءة المدار الحالي
          </p>
          <h3 className="mt-1 text-xl font-extrabold leading-tight text-slate-900">
            علاقتك مع{" "}
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 font-bold text-white max-w-[72vw] truncate sm:max-w-full ${
                ring === "red" ? "bg-rose-500" : ring === "yellow" ? "bg-amber-500" : "bg-teal-500"
              }`}
              title={displayName}
            >
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
        </motion.div>

        <div ref={shareCardRef} className="p-6 card-unified bg-linear-to-b from-slate-50 to-white border border-slate-200 mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
            <span>
              {isEmotionalPrisoner ? `تشخيص المدار: ${result.state_label}` : result.title}
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
              جسمك حر.. بس عقلك لسه متعلق. أنت دلوقتي مش في نفس المكان، لكن التفكير لسه ماسكك. بتصحى وتنام وأنت {singularReferenceText} في خيالك وبتدافع عن نفسك في محاكمات جوه دماغك.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-500 text-center">
            {isEmotionalPrisoner ? (
              <p className="w-full">
                التركيز الآن: <span className="font-semibold text-slate-700">{result.goal_label}</span>
              </p>
            ) : (
              <p>
                الحالة: <span className="font-semibold text-slate-700">{result.state_label}</span>
              </p>
            )}
            <p className="w-full text-xs text-slate-500 leading-relaxed">
              {shortPromiseBody}
            </p>
            <div className="w-full mt-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600">
              {result.mission_label} —{" "}
              <span className="font-semibold text-slate-700">{result.mission_goal}</span>
            </div>
          </div>
        </div>

        {!summaryOnly && (
          <>
            <div className="p-5 card-unified bg-sky-50/70 border border-sky-200 text-right mb-6">
              <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span>🔍</span> {result.understanding_title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {result.understanding_body}
              </p>
            </div>

            <div className="p-5 card-unified bg-violet-50/70 border border-violet-200 text-right mb-6">
              <h3 className="text-sm font-bold text-violet-900 mb-2 flex items-center gap-2">
                {result.explanation_title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{result.explanation_body}</p>
            </div>

            <div className="p-5 card-unified bg-amber-50/80 border border-amber-200 text-right mb-6">
              <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                <span>🎒</span> أدواتك المطلوبة
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
                <span className="font-semibold text-slate-800">لو جاهز، ابدأ خطوتك</span>
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
                  className={`rounded-full text-white px-4 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${missionButtonTone}`}
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

            <div className="p-5 card-unified bg-emerald-50/70 border border-emerald-200 text-right mb-6">
              <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <span>🗺️</span> خطة الخطوة
              </h3>
              <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
                {result.steps.map((step, index) => (
                  <li key={`${step}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-emerald-200">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-5 card-unified bg-rose-50/70 border border-rose-200 text-right mb-6">
              <h3 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
                <span>⚠️</span> التحديات المتوقعة
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

            <div className="p-5 card-unified bg-slate-50/90 border border-slate-300 text-right mb-6">
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
          {!isForcedCtaMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleShareResult()}
                className="w-full rounded-full bg-[var(--color-primary)] text-white px-6 py-3 text-sm font-semibold hover:bg-[var(--color-primary)] active:scale-[0.98] transition-all duration-200"
              >
                مشاركة النتيجة
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadShareImage()}
                disabled={shareBusy}
                className="w-full rounded-full bg-slate-700 text-white px-6 py-3 text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
              >
                {shareBusy ? "جارٍ تجهيز الصورة..." : "تحميل صورة النتيجة"}
              </button>
            </div>
          ) : null}
          {shareStatus ? (
            <p className="text-xs text-slate-600 text-center">{shareStatus}</p>
          ) : null}
          {ctaStatus ? (
            <p className="text-xs text-amber-700 text-center">{ctaStatus}</p>
          ) : null}
          {shouldShowMapSyncBanner ? (
            <p className="text-xs text-amber-700 text-center">{mapSyncBannerText}</p>
          ) : null}
          {isEmergency && (
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50/90 p-4 text-right mb-2">
              <p className="text-sm font-semibold text-rose-900 mb-2">سلامتك أولاً</p>
              <p className="text-xs text-rose-800 leading-relaxed mb-3">
                الشخص اتضاف في المدار الأحمر. لو محتاج تتكلم مع حد الآن:
              </p>
              {emergencyCopy.supportLines.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {emergencyCopy.supportLines.map((line) => (
                    <li key={line.phone} className="flex items-center justify-end gap-2">
                      <a
                        href={`tel:${line.phone}`}
                        className="text-rose-700 font-bold hover:text-rose-900 underline"
                      >
                        {line.phone}
                      </a>
                      <span className="text-rose-800 text-xs">{line.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              {onOpenEmergency && (
                <button
                  type="button"
                  onClick={onOpenEmergency}
                  className="w-full rounded-full bg-rose-600 text-white px-6 py-3 text-sm font-semibold hover:bg-rose-700 active:scale-[0.98] transition-all"
                >
                  غرفة الطوارئ — تنفس ودعم
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (!addedNodeId) {
                recordFlowEvent("add_person_start_path_blocked_missing_node", {
                  meta: { reason: "missing_added_node_id" }
                });
                setCtaStatus("جاري تحضير البيانات...");
                return;
              }
              setCtaStatus(null);
              recordFlowEvent("add_person_start_path_clicked", { meta: { nodeId: addedNodeId } });
              startMissionAndTrack(addedNodeId);
              onOpenMission?.(addedNodeId);
              onClose();
            }}
            className="w-full rounded-full bg-slate-900 text-white px-8 py-4 text-base font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all duration-200"
          >
            ابدأ المسار الآن
          </button>
          {isForcedCtaMode ? (
            <p className="text-xs text-slate-500 text-center">الخطوة التالية المطلوبة: ابدأ المسار الآن.</p>
          ) : (
            <button
              type="button"
              onClick={() => onClose(addedNodeId)}
              className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
            >
              ضيف على الخريطة
            </button>
          )}
        </div>
      ) : null}
    </motion.div>
  );
};

