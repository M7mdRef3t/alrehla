import type { FC } from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass } from "lucide-react";
import { useJourneyProgress } from "@/domains/journey";
import type { JourneyStepId } from "@/domains/journey/store/journey.store";
import { BaselineAssessment } from '@/modules/exploration/BaselineAssessment';
import { GoalPicker } from '@/modules/meta/GoalPicker';
import { CoreMapScreen } from '@/modules/exploration/CoreMapScreen';
import { PostStepMeasurement } from "./PostStepMeasurement";
import { JourneyCelebration } from "./JourneyCelebration";
import { ProgressIndicator } from '@/modules/meta/ProgressIndicator';
import { JourneyProgressSidebar, type JourneyStage } from '@/modules/meta/JourneyProgressSidebar';
import { useToastState } from "@/domains/dawayir/store/toast.store";
import type { AdviceCategory } from "@/data/adviceScripts";

const STEP_LABELS: Record<string, string> = {
  baseline: "ضبط البوصلة",
  goal: "اختيار الهدف",
  map: "العلاقة الأولى",
  measurement: "قياس التقدم",
  celebration: "الاحتفال"
};

const STEP_ICONS: Record<string, string> = {
  baseline: "🧭",
  goal: "🎯",
  map: "🗺️",
  measurement: "📊",
  celebration: "🎉",
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  baseline: "ضبط النقطة الأولى في طريقك",
  goal: "وضوح الاتجاه اللي تسير فيه",
  map: "اكتشاف أول علاقة مؤثرة",
  measurement: "قياس ما تغيّر فيك",
  celebration: "الاعتراف بما حققته",
};

const STEP_MINUTES: Record<string, number> = {
  baseline: 3,
  goal: 2,
  map: 10,
  measurement: 3,
  celebration: 1,
};

const STEP_COMPLETE_TOASTS: Record<string, string> = {
  baseline: "✅ البوصلة اتضبطت — عارف وين تبدأ!",
  goal: "🎯 الهدف اتحدد — المسار واضح!",
  map: "🗺️ العلاقة الأولى اتكشفت!",
  measurement: "📊 قست تقدّمك — شايف الفرق؟",
};

interface GuidedJourneyFlowProps {
  onBackToLanding: () => void;
  onFinishJourney: () => void;
}

export const GuidedJourneyFlow: FC<GuidedJourneyFlowProps> = ({
  onBackToLanding,
  onFinishJourney
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showToast = useToastState((s) => s.showToast);
  const prevIndexRef = useRef<number>(-1);
  const {
    currentStepId,
        getCurrentStepIndex,
    goBack,
    goToStep,
    canGoBack,
    completeGoal,
    goalId,
    category,
    baselineCompletedAt
  } = useJourneyProgress();

  const stepIds = useJourneyProgress().steps.map(s => s.id);
  const currentIndex = getCurrentStepIndex();
  const labels = stepIds.map((id) => STEP_LABELS[id] ?? id);
  const isBaselineStep = currentStepId === "baseline";

  // Toast when a stage becomes "done" (index advances forward)
  useEffect(() => {
    if (prevIndexRef.current >= 0 && currentIndex > prevIndexRef.current) {
      const completedId = stepIds[prevIndexRef.current];
      const msg = completedId ? STEP_COMPLETE_TOASTS[completedId] : undefined;
      if (msg) showToast(msg, "success");
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex, stepIds, showToast]);

  const sidebarStages = useMemo<JourneyStage[]>(() =>
    stepIds.map((id, i) => ({
      id,
      label: STEP_LABELS[id] ?? id,
      description: STEP_DESCRIPTIONS[id] ?? "",
      icon: STEP_ICONS[id] ?? "◦",
      estimatedMinutes: STEP_MINUTES[id],
      status:
        i < currentIndex ? "done"
        : i === currentIndex ? "active"
        : "locked",
    })),
    [stepIds, currentIndex]
  );

  return (
    <div className="relative">
      {/* Journey Progress Sidebar */}
      <JourneyProgressSidebar
        stages={sidebarStages}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNavigate={(id) => {
          const stage = sidebarStages.find((s) => s.id === id);
          if (stage && stage.status !== "locked" && id !== "baseline") goToStep(id as JourneyStepId);
        }}
      />

      <div className={`w-full max-w-2xl mx-auto ${isBaselineStep ? "min-h-[100dvh] flex flex-col" : ""}`}>
      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={currentIndex + 1}
        totalSteps={stepIds.length}
        labels={labels}
      />

      {/* Step Pills */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isBaselineLocked
                  ? "bg-white/5 text-slate-500 cursor-not-allowed opacity-60"
                  : isActive
                    ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/20"
                    : isDone
                      ? "bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 border border-teal-500/20"
                      : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                }`}
              title={isBaselineLocked ? "القياس خلص — مش متاح الرجوع ليه" : (STEP_LABELS[id] ?? id)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Back to landing */}
      <div className="flex justify-end mb-4 px-2">
        <button
          type="button"
          onClick={onBackToLanding}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          رجوع للرئيسية
        </button>
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStepId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={isBaselineStep ? "flex-1 flex flex-col items-center justify-center" : ""}
      >
        {currentStepId === "baseline" && (
          <div className="w-full py-6 px-2">
            {/* Soul Compass Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4"
              >
                <Compass className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-semibold text-teal-300">ضبط بوصلة الروح</span>
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text text-transparent mb-2">
                معايرة البوصلة الداخلية
              </h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                إجابات سريعة عشان نعرف نقطة البداية، ونقارن بعدين
              </p>
            </div>

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
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              journeyMode
              onJourneyComplete={() => goToStep("measurement")}
            />
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>اختر الهدف أولاً.</p>
              <button
                type="button"
                onClick={() => goToStep("goal")}
                className="mt-4 px-6 py-2 rounded-full bg-gradient-to-r from-teal-500 to-blue-600 text-white"
              >
                اختيار الهدف
              </button>
            </div>
          )
        )}

        {currentStepId === "measurement" && (
          <div className="py-6">
            <h1 className="text-2xl font-bold text-white mb-2 text-center">
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

      {/* Back Button */}
      {canGoBack && currentStepId !== "celebration" && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            الخطوة اللي قبلها
          </button>
        </div>
      )}
      </div>
    </div>
  );
};
