import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { useMapState } from '@/modules/map/dawayirIndex';
import { buildResultTemplateFromAnswers } from "@/utils/resultScreenTemplates";
import type { FeelingAnswers } from "../exploration/FeelingCheck";
import type { RealityAnswers } from "../exploration/RealityCheck";
import { BeforeMissionPulse } from "@/modules/exploration/BeforeMissionPulse";
import { getLatestFeedbackForNode } from "@/services/realityFeedbackEngine";

import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import type { ResultScenarioKey } from "@/data/resultScreenTemplates";
import { getAudioContextConstructor } from "@/services/clientDom";

import { trackAffiliateLinkClicked, trackAffiliateLinkExposed } from "../analytics/affiliateTracking";
import { resolveMissionContextualAffiliate } from "../analytics/contextualAffiliates";

import { MissionAIGuide } from "./MissionAIGuide";

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
  const [showBeforePulse, setShowBeforePulse] = useState(false);
  const [feedbackRecordId, setFeedbackRecordId] = useState<string | null>(null);
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
      tone: "from-rose-500/10 to-rose-500/5",
      border: "border-rose-500/20",
      accent: "text-rose-400"
    },
    emotional_prisoner: {
      title: "رسالة استرداد",
      description: "هدفك النهاردة إسكات الضجيج الداخلي واسترداد مساحتك العقلية.",
      tone: "from-slate-500/10 to-slate-500/5",
      border: "border-slate-500/20",
      accent: "text-slate-300"
    },
    active_battlefield: {
      title: "رسالة درع",
      description: "ثباتك هو القوة. نفّذ الخطة بوضوح ومن غير تبرير.",
      tone: "from-amber-500/10 to-amber-500/5",
      border: "border-amber-500/20",
      accent: "text-amber-400"
    },
    eggshells: {
      title: "رسالة توازن",
      description: "التواصل الرسمي يقلّل الاحتكاك. ثبّت نفسك على المسافة الآمنة.",
      tone: "from-yellow-500/10 to-yellow-500/5",
      border: "border-yellow-500/20",
      accent: "text-yellow-400"
    },
    fading_echo: {
      title: "رسالة قبول",
      description: "تقليل التوقعات بداية الاتزان. ركّز على استثمارك الجديد.",
      tone: "from-teal-500/10 to-teal-500/5",
      border: "border-teal-500/20",
      accent: "text-teal-400"
    },
    safe_harbor: {
      title: "رسالة امتنان",
      description: "المدارات الآمنة محتاجة رعاية مستمرة. خطوتك اليوم استثمار ذكي.",
      tone: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/20",
      accent: "text-emerald-400"
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
        <div className="w-full max-w-2xl py-10 text-center" dir="rtl">
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-right animate-pulse">
            <h2 className="text-lg font-bold text-white mb-2">جاري تجهيز المسار...</h2>
            <p className="text-sm text-slate-400">لحظات ونحضر تفاصيل المهمة لك.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full max-w-2xl py-10 text-center" dir="rtl">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع للخريطة
        </button>
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-right">
          <h2 className="text-lg font-bold text-white mb-2">المهمة لسه متكونتش</h2>
          <p className="text-sm text-slate-400">عشان السيستم يجهزلك المهمة الصح، محتاجين نعمل "تحليل العلاقة" للشخص ده على الخريطة الأول.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 rounded-full bg-white/10 border border-white/20 text-white px-6 py-2 text-xs font-semibold hover:bg-white/20 transition-all"
          >
            ارجع للخريطة للتحليل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" dir="rtl">


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
            <div className="rounded-full bg-teal-500 text-[var(--ds-color-space-deep)] px-4 py-2 text-xs font-black animate-bounce shadow-[0_0_15px_rgba(45,212,191,0.5)]">
              إنجاز جديد: الخطوة اتنفذت 🎉
            </div>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع للخريطة
      </button>

      {/* Header section */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-right backdrop-blur-md">
        <h1 className="text-2xl font-black text-white mb-2 font-tajawal">
          خطوة مدار {node.label}
        </h1>
        <p className="text-sm text-slate-400">
          الهدف المباشر: <span className="font-bold text-teal-400">{result.mission_label} — {result.mission_goal}</span>
        </p>
        <div className={`mt-5 rounded-xl border px-4 py-4 text-right bg-gradient-to-l ${theme.tone} ${theme.border}`}>
          <p className={`text-sm font-bold ${theme.accent} mb-1`}>{theme.title}</p>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">{theme.description}</p>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-bold">
            التقدم: <span className="text-white">{completedSteps}/{totalSteps}</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => {
                if (!missionStarted) {
                  // Show BeforeMissionPulse first before starting
                  setShowBeforePulse(true);
                  return;
                }
              }}
              disabled={missionStarted}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                missionStarted 
                  ? "bg-white/5 text-slate-400 border border-white/5" 
                  : "bg-teal-500 text-[var(--ds-color-space-deep)] hover:bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
              }`}
            >
              {missionStarted ? "الخطوة شغالة" : "ابدأ الخطوة"}
            </button>
            {missionStarted && !missionCompleted && (
              <span className="text-xs text-teal-400 font-bold bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">نشط الآن</span>
            )}
            {missionCompleted ? (
              <button
                type="button"
                onClick={() => resetMission(node.id)}
                className="rounded-full bg-white/5 text-slate-300 px-4 py-2 text-xs font-bold border border-white/10 hover:bg-white/10 transition-colors"
              >
                إعادة ضبط الخطوة
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 🔬 Before Mission Pulse — قِس نفسك قبل ما تبدأ */}
      {showBeforePulse && !missionStarted && (
        <div className="mb-6">
          <BeforeMissionPulse
            nodeId={node.id}
            nodeLabel={node.label}
            currentRing={node.ring}
            onComplete={(recordId) => {
              setFeedbackRecordId(recordId);
              setShowBeforePulse(false);
              startMission(node.id);
            }}
            onSkip={() => {
              setShowBeforePulse(false);
              startMission(node.id);
            }}
          />
        </div>
      )}


      {/* 🧠 AI Video Guide */}
      <MissionAIGuide
        missionTitle={result.mission_label}
        missionGoal={result.mission_goal}
        personLabel={node.label}
      />

      {missionCompleted && (
        <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5 text-right backdrop-blur-md">
          <h2 className="text-sm font-bold text-emerald-400 mb-2">تثبيت المكسب</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            نفّذت الخطوة بنجاح. الاستمرارية هي اللي بتحوّل المكسب لاستقرار ثابت.
          </p>
          {completionDate && (
            <p className="mt-3 text-xs text-emerald-500/70 font-medium">
              تاريخ إتمام الخطوة: {completionDate}
            </p>
          )}
        </div>
      )}

      {/* Requirements Section */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10 text-right mb-6 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <span>🎒</span> أدواتك المطلوبة
        </h3>
        <ul className="space-y-3 text-sm text-slate-300">
          {result.requirements.map((item, index) => {
            const isReality = item.title.includes("ملف القضية") || item.title.includes("قائمة الواقع");
            const isDopamine = item.title.includes("بديل الدوبامين");
            return (
              <li key={`${item.title}-${index}`} className="rounded-xl bg-white/5 px-4 py-3 border border-white/5 flex items-start justify-between gap-2">
                <span className="leading-relaxed">
                  <span className="font-bold text-teal-400">{item.title}:</span>{" "}
                  {item.detail}
                </span>
                {(isReality || isDopamine) && (
                  <button
                    type="button"
                    onClick={() => { if (isReality) setShowRealityPopup((v) => !v); else setShowDopaminePopup((v) => !v); }}
                    className="shrink-0 rounded-full p-1.5 text-teal-500 bg-teal-500/10 hover:bg-teal-500/20 transition-colors"
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
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-right text-sm text-slate-200">
            <p className="font-bold text-amber-400 mb-2">قائمة الواقع (ملف القضية الحقيقي)</p>
            {detachmentReasons && detachmentReasons.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-slate-300">
                {detachmentReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-300 leading-relaxed">ورقة مكتوب فيها «ليه بعدت عنهم؟» — تكتبها في خطة التعافي (مرساة الواقع) وتقرأها وقت الضعف.</p>
            )}
            <button type="button" onClick={() => setShowRealityPopup(false)} className="mt-3 text-xs text-amber-500 hover:text-amber-400 underline transition-colors">إغلاق</button>
          </div>
        )}
        {showDopaminePopup && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-right text-sm text-slate-200">
            <p className="font-bold text-amber-400 mb-2">بديل الدوبامين</p>
            <p className="text-slate-300 leading-relaxed">نشاط ممتع جاهز فوراً لما الفكرة تهاجمك — مثلاً: مشي، مكالمة صديق، لعبة.</p>
            <button type="button" onClick={() => setShowDopaminePopup(false)} className="mt-3 text-xs text-amber-500 hover:text-amber-400 underline transition-colors">إغلاق</button>
          </div>
        )}
      </div>

      {/* Steps Section */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10 text-right mb-6 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🗺️</span> خطة الخطوة
          </h3>
          <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 font-bold">
            التقدم: {completedSteps}/{totalSteps}
          </span>
        </div>
        <ol className="space-y-3 text-sm text-slate-300">
          {result.steps.map((step, index) => {
            const isChecked = checkedSteps[index] ?? false;
            const stepHasDays = /(\d+)\s*أيام?/.test(step);
            const startTs = progress.startedAt ?? 0;
            const dayCount = startTs
              ? Math.min(7, Math.max(1, Math.floor((Date.now() - startTs) / 86400000) + 1))
              : 1;
            return (
              <li key={`${step}-${index}`} className={`rounded-xl px-4 py-3 border transition-colors ${isChecked ? "bg-teal-500/5 border-teal-500/20" : "bg-white/5 border-white/5 hover:border-white/10"}`}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                      <input
                          id={`mission-step-${index}`}
                          name={`missionStep${index}`}
                          type="checkbox"
                    checked={isChecked}
                    disabled={!missionStarted || missionCompleted}
                    onChange={() => toggleMissionStep(node.id, index)}
                    className="peer sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-all ${isChecked ? "bg-teal-500 border-teal-500" : "border-white/20 group-hover:border-white/40"} ${!missionStarted || missionCompleted ? "opacity-50" : ""}`}>
                     {isChecked && <svg className="w-full h-full text-[var(--ds-color-space-deep)] p-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  </div>
                  <span className={`leading-relaxed transition-colors ${isChecked ? "line-through text-teal-500/70" : "text-slate-200 group-hover:text-white"}`}>{step}</span>
                </label>
                {index === 0 && stepHasDays && missionStarted && !missionCompleted && (
                  <div className="mt-3 mr-8 text-[11px] font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 inline-block">
                    اليوم {dayCount} من 7
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {canComplete && (
        <div className="mb-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 px-5 py-4 text-sm text-slate-200 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
          <span className="font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            كل الخطوات اتنفذت بنجاح
          </span>
          <button
            type="button"
            onClick={() => {
              completeMission(node.id);
              unlockAchievement("mission_complete");
            }}
            className="rounded-full bg-teal-500 text-[var(--ds-color-space-deep)] px-6 py-2.5 text-xs font-black hover:bg-teal-400 transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)]"
          >
            تثبيت الإغلاق
          </button>
        </div>
      )}

      {/* Obstacles Section */}
      <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-right mb-6 backdrop-blur-md">
        <h3 className="text-sm font-bold text-rose-400 mb-4 flex items-center gap-2">
          <span>⚠️</span> التحديات المتوقعة
        </h3>
        <ul className="space-y-3 text-sm text-slate-300">
          {result.obstacles.map((item, index) => {
            const solutionHasReality = item.solution.includes("ملف القضية الحقيقي") || item.solution.includes("قائمة الواقع");
            return (
              <li key={`${item.title}-${index}`} className="rounded-xl bg-white/5 px-4 py-3 border border-white/5">
                <span className="font-bold text-rose-400">{item.title}:</span>{" "}
                <span className="leading-relaxed">
                  {solutionHasReality && item.solution.includes("ملف القضية الحقيقي") ? (
                    <>
                      {item.solution.split("ملف القضية الحقيقي")[0]}
                      <button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-400 font-bold underline hover:text-rose-300 transition-colors mx-1">ملف القضية الحقيقي</button>
                      {item.solution.split("ملف القضية الحقيقي")[1]}
                    </>
                  ) : solutionHasReality && item.solution.includes("قائمة الواقع") ? (
                    <>
                      {item.solution.split("قائمة الواقع")[0]}
                      <button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-400 font-bold underline hover:text-rose-300 transition-colors mx-1">قائمة الواقع</button>
                      {item.solution.split("قائمة الواقع")[1]}
                    </>
                  ) : (
                    item.solution
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 🚀 What's Next CTA Footer */}
      <div className="p-6 rounded-2xl border border-white/10 bg-black/50 text-center backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <h3 className="text-base font-black text-white mb-2">وماذا بعد؟</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-5 max-w-sm mx-auto">
          {missionCompleted
            ? "تم إنجاز المهمة بنجاح. ارجع للخريطة، وبعد ٧ أيام السيستم هيطلب منك تقييم الأثر الحقيقي."
            : "نفّذ الخطوات المكتوبة فوق في الواقع، ولما تخلص ارجع علم عليها أو دوس تثبيت."}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 mx-auto shadow-[0_0_20px_rgba(45,212,191,0.15)] hover:shadow-[0_0_30px_rgba(45,212,191,0.3)]"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(45,212,191,0.05))",
            border: "1px solid rgba(45,212,191,0.3)",
            color: "#5eead4",
          }}
        >
          {missionCompleted ? "عودة للخريطة وتوثيق الأثر" : "عودة للخريطة ومتابعة التقدم"}
          <ArrowRight className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
};
