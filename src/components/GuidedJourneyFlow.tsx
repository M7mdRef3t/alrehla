import type { FC } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useJourneyState } from "../state/journeyState";
import { BaselineAssessment } from "./BaselineAssessment";
import { GoalPicker } from "./GoalPicker";
import { CoreMapScreen } from "./CoreMapScreen";
import { PostStepMeasurement } from "./PostStepMeasurement";
import { JourneyCelebration } from "./JourneyCelebration";
import { ProgressIndicator } from "./ProgressIndicator";
import type { AdviceCategory } from "../data/adviceScripts";

const STEP_LABELS: Record<string, string> = {
  baseline: "القياس الأولي",
  goal: "اختيار الهدف",
  map: "العلاقة الأولى",
  measurement: "قياس التقدم",
  celebration: "الاحتفال"
};

interface GuidedJourneyFlowProps {
  onBackToLanding: () => void;
  onFinishJourney: () => void;
}

export const GuidedJourneyFlow: FC<GuidedJourneyFlowProps> = ({
  onBackToLanding,
  onFinishJourney
}) => {
  const {
    currentStepId,
    getStepIds,
    getCurrentStepIndex,
    goBack,
    goToStep,
    canGoBack,
    completeGoal,
    goalId,
    category,
    baselineCompletedAt
  } = useJourneyState();

  const stepIds = getStepIds();
  const currentIndex = getCurrentStepIndex();
  const labels = stepIds.map((id) => STEP_LABELS[id] ?? id);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ProgressIndicator
        currentStep={currentIndex + 1}
        totalSteps={stepIds.length}
        labels={labels}
      />
      {/* Progress: خطوات الرحلة — رقم ١ (القياس) مقفول بعد ما نكون دخلنا على الأهداف */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {stepIds.map((id, i) => {
          const isActive = id === currentStepId;
          const isDone = i < currentIndex;
          const isBaselineLocked = i === 0 && baselineCompletedAt != null;
          const isDisabled = i > currentIndex || isBaselineLocked;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (isBaselineLocked) return;
                if (i <= currentIndex) goToStep(id);
              }}
              disabled={isDisabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isBaselineLocked
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                  : isActive
                    ? "bg-teal-600 text-white"
                    : isDone
                      ? "bg-teal-100 text-teal-800 hover:bg-teal-200"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title={isBaselineLocked ? "القياس خلص — مش متاح الرجوع ليه" : (STEP_LABELS[id] ?? id)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Back to landing - فوق يمين أو فوق الشاشة */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={onBackToLanding}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          رجوع للرئيسية
        </button>
      </div>

      {/* محتوى الخطوة الحالية */}
      <motion.div
        key={currentStepId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {currentStepId === "baseline" && (
          <div className="py-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
              القياس الأولي
            </h1>
            <p className="text-slate-600 mb-8 text-center max-w-md mx-auto">
              إجابات سريعة عشان نعرف نقطة البداية، ونقارن بعدين.
            </p>
            <BaselineAssessment
              onComplete={() => {
                /* state already moved to goal in completeBaseline */
              }}
            />
          </div>
        )}

        {currentStepId === "goal" && (
          <GoalPicker
            initialGoalId={goalId ?? undefined}
            onBack={baselineCompletedAt != null ? onBackToLanding : goBack}
            onContinue={(nextCategory, nextGoalId) => {
              completeGoal(nextGoalId, nextCategory);
            }}
          />
        )}

        {currentStepId === "map" && (
          category && goalId ? (
            <CoreMapScreen
              category={category as AdviceCategory}
              goalId={goalId}
              journeyMode
              onJourneyComplete={() => goToStep("measurement")}
            />
          ) : (
            <div className="text-center py-8 text-slate-600">
              <p>اختر الهدف أولاً.</p>
              <button
                type="button"
                onClick={() => goToStep("goal")}
                className="mt-4 px-6 py-2 rounded-full bg-teal-600 text-white"
              >
                اختيار الهدف
              </button>
            </div>
          )
        )}

        {currentStepId === "measurement" && (
          <div className="py-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
              قياس التقدم
            </h1>
            <PostStepMeasurement
              onComplete={() => {
                /* state already moved to celebration in completePostStep */
              }}
            />
          </div>
        )}

        {currentStepId === "celebration" && (
          <div className="py-6">
            <JourneyCelebration onFinish={onFinishJourney} />
          </div>
        )}
      </motion.div>

      {/* زر رجوع (مرونة) - يظهر في كل خطوة ما عدا الأولى */}
      {canGoBack() && currentStepId !== "celebration" && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-100"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            الخطوة اللي قبلها
          </button>
        </div>
      )}
    </div>
  );
};
