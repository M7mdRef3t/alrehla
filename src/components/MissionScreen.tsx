import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useMapState } from "../state/mapState";
import { buildResultTemplateFromAnswers } from "../utils/resultScreenTemplates";
import type { FeelingAnswers } from "./FeelingCheck";
import type { RealityAnswers } from "./RealityCheck";
import { useAchievementState } from "../state/achievementState";
import type { ResultScenarioKey } from "../data/resultScreenTemplates";

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
  const lastCelebratedAtRef = useRef<number | null>(null);

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
      description: "الأولوية القصوى للسلامة. نفّذ الخطوات بهدوء وبشكل متدرج.",
      tone: "from-rose-50 to-rose-100",
      border: "border-rose-200",
      accent: "text-rose-800"
    },
    emotional_prisoner: {
      title: "رسالة استرداد",
      description: "هدفك اليوم تقليل الضجيج الداخلي واستعادة المساحة العقلية.",
      tone: "from-slate-50 to-slate-100",
      border: "border-slate-200",
      accent: "text-slate-800"
    },
    active_battlefield: {
      title: "رسالة درع",
      description: "ثباتك هو القوة. نفّذ الخطوات بوضوح ومن غير تبرير.",
      tone: "from-orange-50 to-amber-100",
      border: "border-amber-200",
      accent: "text-amber-800"
    },
    eggshells: {
      title: "رسالة توازن",
      description: "التعامل الرسمي يقلل الاحتكاك. خليك ثابت على المسافة الآمنة.",
      tone: "from-yellow-50 to-amber-50",
      border: "border-amber-200",
      accent: "text-amber-800"
    },
    fading_echo: {
      title: "رسالة قبول",
      description: "التخفف من التوقعات هو بداية الراحة. ركّز على استثمارك الجديد.",
      tone: "from-emerald-50 to-teal-50",
      border: "border-emerald-200",
      accent: "text-emerald-800"
    },
    safe_harbor: {
      title: "رسالة امتنان",
      description: "العلاقات الآمنة محتاجة رعاية مستمرة. خطوتك اليوم استثمار ذكي.",
      tone: "from-teal-50 to-emerald-50",
      border: "border-teal-200",
      accent: "text-teal-800"
    }
  };
  const theme = scenarioTheme[result.scenarioKey] ?? scenarioTheme.safe_harbor;

  useEffect(() => {
    if (!missionCompleted) {
      lastCelebratedAtRef.current = null;
      return;
    }
    if (!progress.completedAt || progress.completedAt === lastCelebratedAtRef.current) return;
    lastCelebratedAtRef.current = progress.completedAt;

    setShowCelebration(true);
    const timeoutId = window.setTimeout(() => setShowCelebration(false), 2200);

    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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

    return () => window.clearTimeout(timeoutId);
  }, [missionCompleted, progress.completedAt]);

  if (!node || !node.analysis || !result) {
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">المهمة غير متاحة حالياً</h2>
          <p className="text-sm text-slate-600">لازم يكون الشخص عنده تحليل محفوظ عشان تظهر المهمة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl py-10 text-center relative">
      {showCelebration && (
        <div className="absolute inset-x-0 -top-6 flex justify-center pointer-events-none">
          <div className="rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-lg animate-bounce">
            إنجاز جديد: المهمة اكتملت
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowRight className="w-4 h-4" />
        رجوع للخريطة
      </button>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          مهمة {node.label}
        </h1>
        <p className="text-sm text-slate-600">
          {result.mission_label} — <span className="font-semibold text-slate-800">{result.mission_goal}</span>
        </p>
        <div className={`mt-4 rounded-xl border px-4 py-3 text-right bg-gradient-to-l ${theme.tone} ${theme.border}`}>
          <p className={`text-sm font-semibold ${theme.accent}`}>{theme.title}</p>
          <p className="text-xs text-slate-600">{theme.description}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            التقدم: {completedSteps}/{totalSteps}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => startMission(node.id)}
              disabled={missionStarted}
              className="rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold shadow hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {missionStarted ? "المهمة بدأت" : "ابدأ المهمة"}
            </button>
            {missionCompleted ? (
              <button
                type="button"
                onClick={() => resetMission(node.id)}
                className="rounded-full bg-white text-slate-700 px-4 py-2 text-xs font-semibold border border-slate-200 hover:border-slate-300"
              >
                ابدأ من جديد
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {missionCompleted && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-right">
          <h2 className="text-sm font-bold text-emerald-900 mb-2">إنجاز المهمة</h2>
          <p className="text-sm text-emerald-800 leading-relaxed">
            أحسنت! خلّصت المهمة بنجاح. خليك فاكر إن الاستمرارية هي اللي بتحول الانتصار ده لعادة دائمة.
          </p>
          {completionDate && (
            <p className="mt-2 text-xs text-emerald-700">
              تمت المهمة بتاريخ: {completionDate}
            </p>
          )}
        </div>
      )}

      <div className="p-5 bg-amber-50 border-2 border-amber-200 rounded-xl text-right mb-6">
        <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
          <span>🎒</span> العتاد المطلوب
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

      <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-right mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            <span>🗺️</span> خطة التنفيذ
          </h3>
          <span className="text-xs text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-1">
            التقدم: {completedSteps}/{totalSteps}
          </span>
        </div>
        <ol className="space-y-2 text-sm text-slate-700">
          {result.steps.map((step, index) => {
            const isChecked = checkedSteps[index] ?? false;
            return (
              <li key={`${step}-${index}`} className="rounded-lg bg-white/70 px-3 py-2 border border-emerald-200">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={!missionStarted || missionCompleted}
                    onChange={() => toggleMissionStep(node.id, index)}
                    className="mt-1 h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                  />
                  <span className={isChecked ? "line-through text-emerald-700" : ""}>{step}</span>
                </label>
              </li>
            );
          })}
        </ol>
      </div>

      {canComplete && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-slate-800">كل الخطوات اتعلمت ✔️</span>
          <button
            type="button"
            onClick={() => {
              completeMission(node.id);
              unlockAchievement("mission_complete");
            }}
            className="rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow hover:bg-emerald-700"
          >
            إنهاء المهمة
          </button>
        </div>
      )}

      <div className="p-5 bg-rose-50 border-2 border-rose-200 rounded-xl text-right mb-6">
        <h3 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
          <span>⚠️</span> الكمائن المتوقعة
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
    </div>
  );
};
