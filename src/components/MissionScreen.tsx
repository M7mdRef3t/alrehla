import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { useMapState } from "../state/mapState";
import { buildResultTemplateFromAnswers } from "../utils/resultScreenTemplates";
import type { FeelingAnswers } from "./FeelingCheck";
import type { RealityAnswers } from "./RealityCheck";
import { useAchievementState } from "../state/achievementState";
import type { ResultScenarioKey } from "../data/resultScreenTemplates";
import { getAudioContextConstructor } from "../services/clientDom";
import { trackAffiliateLinkClicked, trackAffiliateLinkExposed } from "../modules/analytics/affiliateTracking";
import { resolveMissionContextualAffiliate } from "../modules/analytics/contextualAffiliates";

interface MissionScreenProps {
  nodeId: string;
  onBack: () => void;
}

export const MissionScreen: FC<MissionScreenProps> = ({ nodeId, onBack }) => {
  const node = useMapState((s) => s.nodes.find((n) => n.id === nodeId));
  const startMission = useMapState((s) => s.startMission);
  const toggleMissionStep = useMapState((s) => s.toggleMissionStep);
  const completeMission = useMapState((s) => s.completeMission);
  const resetMission = useMapState((s) => s.resetMission);
  const unlockAchievement = useAchievementState((s) => s.unlock);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRealityPopup, setShowRealityPopup] = useState(false);
  const [showDopaminePopup, setShowDopaminePopup] = useState(false);
  const [showFallbackAfterTimeout, setShowFallbackAfterTimeout] = useState(false);
  const [fallbackAttempt] = useState(0);
  const lastCelebratedAtRef = useRef<number | null>(null);
  const detachmentReasons = node?.recoveryProgress?.detachmentReasons;

  const result = useMemo(() => {
    if (!node) return null;
    const feelingAnswers = node.analysis?.answers as FeelingAnswers | undefined;
    const realityAnswers = node.realityAnswers as RealityAnswers | undefined;
    return buildResultTemplateFromAnswers({
      score: node.analysis?.score ?? 0,
      feelingAnswers,
      realityAnswers,
      isEmergency: node.isEmergency,
      safetyAnswer: node.safetyAnswer,
      personGender: "unknown"
    });
  }, [node]);

  const progress = node?.missionProgress ?? { checkedSteps: [] };
  const checkedSet = new Set(progress.checkedSteps ?? []);
  const checkedSteps = result ? result.steps.map((_, index) => checkedSet.has(index)) : [];
  const completedSteps = checkedSteps.filter(Boolean).length;
  const totalSteps = result?.steps.length ?? 0;
  const missionStarted = Boolean(progress.startedAt);
  const missionCompleted = Boolean(progress.isCompleted);
  const canComplete = missionStarted && !missionCompleted && completedSteps === totalSteps && totalSteps > 0;
  const completionDate = missionCompleted && progress.completedAt
    ? new Date(progress.completedAt).toLocaleDateString("ar-EG")
    : null;

  const scenarioTheme: Record<ResultScenarioKey, { title: string; description: string; tone: string; border: string; accent: string }> = {
    emergency: {
      title: "رسالة طوارئ",
      description: "أولوية قصوى: أمّن مكانك أولًا، وبعدها نفّذ بهدوء ومن غير استعجال.",
      tone: "from-rose-50 to-rose-100",
      border: "border-rose-200",
      accent: "text-rose-800"
    },
    emotional_prisoner: {
      title: "رسالة استرداد",
      description: "هدفك النهاردة إسكات الضجيج الداخلي واسترداد مساحتك العقلية.",
      tone: "from-slate-50 to-slate-100",
      border: "border-slate-200",
      accent: "text-slate-800"
    },
    active_battlefield: {
      title: "رسالة درع",
      description: "ثباتك هو القوة. نفّذ الخطة بوضوح ومن غير تبرير.",
      tone: "from-orange-50 to-amber-100",
      border: "border-amber-200",
      accent: "text-amber-800"
    },
    eggshells: {
      title: "رسالة توازن",
      description: "التواصل الرسمي يقلّل الاحتكاك. ثبّت نفسك على المسافة الآمنة.",
      tone: "from-yellow-50 to-amber-50",
      border: "border-amber-200",
      accent: "text-amber-800"
    },
    fading_echo: {
      title: "رسالة قبول",
      description: "تقليل التوقعات بداية الاتزان. ركّز على استثمارك الجديد.",
      tone: "from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      accent: "text-emerald-800"
    },
    safe_harbor: {
      title: "رسالة امتنان",
      description: "المدارات الآمنة محتاجة رعاية مستمرة. خطوتك اليوم استثمار ذكي.",
      tone: "from-teal-50 to-emerald-50",
      border: "border-teal-200",
      accent: "text-teal-800"
    }
  };
  const theme = scenarioTheme[(result?.scenarioKey ?? "safe_harbor") as ResultScenarioKey] ?? scenarioTheme.safe_harbor;
  const contextualAffiliate = useMemo(
    () =>
      resolveMissionContextualAffiliate({
        ring: node?.ring,
        scenarioKey: result?.scenarioKey,
        isEmergency: node?.isEmergency
      }),
    [node?.isEmergency, node?.ring, result?.scenarioKey]
  );
  const contextualAffiliateVariant = useMemo<"A" | "B">(() => {
    const safeId = String(nodeId ?? "");
    let hash = 0;
    for (let i = 0; i < safeId.length; i += 1) {
      hash = (hash * 31 + safeId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 2 === 0 ? "A" : "B";
  }, [nodeId]);

  useEffect(() => {
    if (!missionCompleted) {
      lastCelebratedAtRef.current = null;
      return;
    }
    if (!progress.completedAt || progress.completedAt === lastCelebratedAtRef.current) return;
    lastCelebratedAtRef.current = progress.completedAt;

    setShowCelebration(true);
    const timeoutId = setTimeout(() => setShowCelebration(false), 2200);

    try {
      const AudioContextCtor = getAudioContextConstructor();
      if (AudioContextCtor) {
        const context = new AudioContextCtor();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gain.gain.value = 0.06;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
        oscillator.stop(context.currentTime + 0.25);
        oscillator.onended = () => {
          void context.close();
        };
      }
    } catch {
      // تجاهل أي أخطاء في تشغيل الصوت
    }

    return () => clearTimeout(timeoutId);
  }, [missionCompleted, progress.completedAt]);

  useEffect(() => {
    if (!contextualAffiliate) return;
    trackAffiliateLinkExposed(contextualAffiliate.url, {
      placement: contextualAffiliate.placement,
      contentId: contextualAffiliate.id,
      title: contextualAffiliate.title,
      linkId: `variant_${contextualAffiliateVariant}`,
      missionKey: result?.scenarioKey ?? "unknown",
      missionLabel: result?.mission_label ?? "unknown",
      ring: node?.ring ?? "unknown",
      scenarioKey: result?.scenarioKey ?? "unknown"
    });
  }, [contextualAffiliate, contextualAffiliateVariant, node?.ring, result?.mission_label, result?.scenarioKey]);

  useEffect(() => {
    if (node && node.analysis && result) {
      setShowFallbackAfterTimeout(false);
      return;
    }
    setShowFallbackAfterTimeout(false);
    const timeoutId = setTimeout(() => setShowFallbackAfterTimeout(true), 2500);
    return () => clearTimeout(timeoutId);
  }, [node, result, fallbackAttempt]);

  if (!node || !node.analysis || !result) {
    if (!showFallbackAfterTimeout) {
      return (
        <div className="w-full max-w-2xl py-10 text-center">
          <div className="card-unified bg-white/90 p-6 text-left animate-pulse">
            <h2 className="text-lg font-bold text-slate-900 mb-2">جاري تجهيز المسار...</h2>
            <p className="text-sm text-slate-600">لحظات ونحضر تفاصيل المهمة لك.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full max-w-2xl py-10 text-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-6"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع للخريطة
        </button>
        <div className="card-unified bg-white/90 p-6 text-left">
          <h2 className="text-lg font-bold text-slate-900 mb-2">المهمة لسه متكونتش</h2>
          <p className="text-sm text-slate-600">عشان السيستم يجهزلك المهمة الصح، محتاجين نعمل "تحليل العلاقة" للشخص ده على الخريطة الأول.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800"
          >
            ارجع للخريطة للتحليل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl py-10 text-center relative">
      {showCelebration && (
        <>
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 flex items-center justify-center">
            <div className="text-5xl animate-bounce">🎉</div>
            <div className="absolute inset-0 flex justify-around items-start pt-8 opacity-70">
              {["🎊", "✨", "🌟", "💚", "🎉"].map((e, i) => (
                <span
                  key={i}
                  className="animate-[fall_1.5s_ease-in_forwards] opacity-80"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    position: "absolute",
                    left: `${15 + i * 18}%`,
                    top: -20,
                    fontSize: "1.25rem"
                  }}
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes fall {
              to { transform: translateY(120px) rotate(10deg); opacity: 0.3; }
            }
          `}</style>
          <div className="absolute inset-x-0 -top-6 flex justify-center pointer-events-none z-20">
            <div className="rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold animate-bounce">
              إنجاز جديد: الخطوة اتنفذت 🎉
            </div>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع للخريطة
      </button>

      <div className="mb-6 card-unified bg-white/90 p-6 text-left">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          خطوة مدار {node.label}
        </h1>
        <p className="text-sm text-slate-600">
          الهدف المباشر: <span className="font-semibold text-slate-800">{result.mission_label} — {result.mission_goal}</span>
        </p>
        <div className={`mt-4 rounded-xl border px-4 py-3 text-right bg-linear-to-l ${theme.tone} ${theme.border}`}>
          <p className={`text-sm font-semibold ${theme.accent}`}>{theme.title}</p>
          <p className="text-xs text-slate-600">{theme.description}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            التقدم: {completedSteps}/{totalSteps}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => startMission(node.id)}
              disabled={missionStarted}
              className={`rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${missionStarted && !missionCompleted ? "animate-pulse ring-2 ring-emerald-400/60 ring-offset-2" : ""}`}
            >
              {missionStarted ? "الخطوة شغالة" : "ابدأ الخطوة"}
            </button>
            {missionStarted && !missionCompleted && (
              <span className="text-xs text-emerald-600 font-medium">نشط الآن</span>
            )}
            {missionCompleted ? (
              <button
                type="button"
                onClick={() => resetMission(node.id)}
                className="rounded-full bg-white text-slate-700 px-4 py-2 text-xs font-semibold border border-slate-200 hover:border-slate-300"
              >
                إعادة ضبط الخطوة
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {contextualAffiliate && (
        <div className="mb-6 card-unified bg-[var(--soft-teal)]/80 border border-[var(--soft-teal)] p-5 text-right">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--soft-teal)]">ترشيح مناسب لحالتك الآن</p>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{contextualAffiliate.title}</h3>
              <p className="text-xs text-slate-600 mt-1">
                {contextualAffiliateVariant === "A"
                  ? contextualAffiliate.reason
                  : "لو نفذته الآن هتثبت المسار أسرع وتقلل الرجوع لنفس الدوامة."}
              </p>
            </div>
            <a
              href={contextualAffiliate.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackAffiliateLinkClicked(contextualAffiliate.url, {
                  placement: contextualAffiliate.placement,
                  contentId: contextualAffiliate.id,
                  title: contextualAffiliate.title,
                  linkId: `variant_${contextualAffiliateVariant}`,
                  missionKey: result?.scenarioKey ?? "unknown",
                  missionLabel: result?.mission_label ?? "unknown",
                  ring: node?.ring ?? "unknown",
                  scenarioKey: result?.scenarioKey ?? "unknown"
                });
              }}
              className="rounded-full bg-[var(--soft-teal)] text-white px-4 py-2 text-xs font-semibold hover:bg-[var(--soft-teal)] shrink-0"
            >
              {contextualAffiliateVariant === "A" ? "شاهد الآن" : "ابدأ التطبيق الآن"}
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-3 line-clamp-2">{contextualAffiliate.description}</p>
        </div>
      )}

      {missionCompleted && (
        <div className="mb-6 card-unified bg-emerald-50/90 border border-emerald-200 p-5 text-right">
          <h2 className="text-sm font-bold text-emerald-900 mb-2">تثبيت المكسب</h2>
          <p className="text-sm text-emerald-800 leading-relaxed">
            نفّذت الخطوة بنجاح. الاستمرارية هي اللي بتحوّل المكسب لاستقرار ثابت.
          </p>
          {completionDate && (
            <p className="mt-2 text-xs text-emerald-700">
              تاريخ إتمام الخطوة: {completionDate}
            </p>
          )}
        </div>
      )}

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
                    onClick={() => { if (isReality) setShowRealityPopup((v) => !v); else setShowDopaminePopup((v) => !v); }}
                    className="shrink-0 rounded-full p-1 text-amber-700 hover:bg-amber-200/80"
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
            <p>نشاط ممتع جاهز فوراً لما الفكرة تهاجمك — مثلاً: مشي، مكالمة صديق، لعبة.</p>
            <button type="button" onClick={() => setShowDopaminePopup(false)} className="mt-2 text-xs text-amber-700 underline">إغلاق</button>
          </div>
        )}
      </div>

      <div className="p-5 card-unified bg-emerald-50/80 border border-emerald-200 text-right mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            <span>🗺️</span> خطة الخطوة
          </h3>
          <span className="text-xs text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-1">
            التقدم: {completedSteps}/{totalSteps}
          </span>
        </div>
        <ol className="space-y-2 text-sm text-slate-700">
          {result.steps.map((step, index) => {
            const isChecked = checkedSteps[index] ?? false;
            const stepHasDays = /(\d+)\s*أيام?/.test(step);
            const startTs = progress.startedAt ?? 0;
            const dayCount = startTs
              ? Math.min(7, Math.max(1, Math.floor((Date.now() - startTs) / 86400000) + 1))
              : 1;
            return (
              <li key={`${step}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-emerald-200">
                <label className="flex items-start gap-2 cursor-pointer">
                      <input
                          id={`mission-step-${index}`}
                          name={`missionStep${index}`}
                          type="checkbox"
                    checked={isChecked}
                    disabled={!missionStarted || missionCompleted}
                    onChange={() => toggleMissionStep(node.id, index)}
                    className="mt-1 h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                  />
                  <span className={isChecked ? "line-through text-emerald-700" : ""}>{step}</span>
                </label>
                {index === 0 && stepHasDays && missionStarted && !missionCompleted && (
                  <div className="mt-2 mr-6 text-xs text-emerald-700 bg-emerald-100 rounded-full px-3 py-1 inline-block">
                    اليوم {dayCount} من 7
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {canComplete && (
        <div className="mb-6 card-unified bg-white/80 px-4 py-3 text-sm text-slate-700 flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-slate-800">كل الخطوات اتنفذت ✔️</span>
          <button
            type="button"
            onClick={() => {
              completeMission(node.id);
              unlockAchievement("mission_complete");
            }}
            className="rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold hover:bg-emerald-700"
          >
            تثبيت الإغلاق
          </button>
        </div>
      )}

      <div className="p-5 card-unified bg-rose-50/80 border border-rose-200 text-right mb-6">
        <h3 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
          <span>⚠️</span> التحديات المتوقعة
        </h3>
        <ul className="space-y-2 text-sm text-slate-700">
          {result.obstacles.map((item, index) => {
            const solutionHasReality = item.solution.includes("ملف القضية الحقيقي") || item.solution.includes("قائمة الواقع");
            return (
              <li key={`${item.title}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-rose-200">
                <span className="font-semibold text-slate-800">{item.title}:</span>{" "}
                {solutionHasReality && item.solution.includes("ملف القضية الحقيقي") ? (
                  <>
                    {item.solution.split("ملف القضية الحقيقي")[0]}
                    <button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-700 font-semibold underline hover:text-rose-800">ملف القضية الحقيقي</button>
                    {item.solution.split("ملف القضية الحقيقي")[1]}
                  </>
                ) : solutionHasReality && item.solution.includes("قائمة الواقع") ? (
                  <>
                    {item.solution.split("قائمة الواقع")[0]}
                    <button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-700 font-semibold underline hover:text-rose-800">قائمة الواقع</button>
                    {item.solution.split("قائمة الواقع")[1]}
                  </>
                ) : (
                  item.solution
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};


