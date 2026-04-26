import type { FC } from "react";
import { Target, Zap as Sparkles } from "lucide-react";
import { RecoveryRoadmap } from "../../action/RecoveryRoadmap";
import { SuggestedPlacement } from "../SuggestedPlacement";
import type { ResultTemplate } from "@/utils/resultScreenTemplates";

interface RoadmapSectionProps {
  addedNode: any;
  displayName: string;
  score: number;
  feelingAnswers: any;
  totalSteps: number;
  activeRing: "green" | "yellow" | "red";
  category: any;
  summaryOnly: boolean;
  isMissionStarted: boolean;
  isMissionCompleted: boolean;
  missionButtonLabel: string;
  completedSteps: number;
  result: ResultTemplate;
  onStartMission: (nodeId: string) => void;
  onOpenMission: (nodeId: string) => void;
  onShowTraining: () => void;
}

export const RoadmapSection: FC<RoadmapSectionProps> = ({
  addedNode,
  displayName,
  score,
  feelingAnswers,
  totalSteps,
  activeRing,
  category,
  summaryOnly,
  isMissionStarted,
  isMissionCompleted,
  missionButtonLabel,
  completedSteps,
  result,
  onStartMission,
  onOpenMission,
  onShowTraining
}) => {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {addedNode && (
        <RecoveryRoadmap
          personLabel={displayName}
          hasAnalysis={Boolean(score > 0 || feelingAnswers || addedNode.analysis)}
          hasSelectedSymptoms={Boolean(addedNode.analysis?.selectedSymptoms && addedNode.analysis.selectedSymptoms.length > 0)}
          hasWrittenSituations={Boolean(addedNode.recoveryProgress?.situationLogs && addedNode.recoveryProgress.situationLogs.length > 0)}
          hasCompletedTraining={addedNode.hasCompletedTraining}
          completedRecoverySteps={addedNode.recoveryProgress?.completedSteps?.length ?? 0}
          totalRecoverySteps={totalSteps}
          journeyStartDate={addedNode.journeyStartDate}
        />
      )}
      {addedNode && (
        <SuggestedPlacement currentRing={activeRing} personLabel={displayName} category={category} selectedSymptoms={addedNode.analysis?.selectedSymptoms} />
      )}
      {addedNode && (addedNode.analysis?.selectedSymptoms?.length ?? 0) > 0 && (
        <div className="px-6 py-6 rounded-[2rem] bg-[var(--ds-color-primary-soft)] border border-[var(--ds-color-primary-glow)] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-6">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-[var(--ds-color-primary-glow)] flex items-center justify-center border border-[var(--ds-color-primary-glow)]">
            <Target className="w-7 h-7 text-[var(--consciousness-primary)]" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-[var(--consciousness-text)] mb-2">تدريب المواجهة المخصص</h4>
            <p className="text-sm text-[var(--consciousness-text-muted)] leading-relaxed font-medium mb-4">
              هنحطك في مواقف حقيقية ونشوف هتتعامل إزاي. التدريب ده هو اللي هيبني "عضلة الحدود" عشان تقدر تحمي نفسك في الواقع.
            </p>
            <button onClick={onShowTraining} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--consciousness-primary)] text-[var(--ds-color-space-deep)] font-black text-sm hover:opacity-90 transition-opacity flex items-center justify-center sm:justify-start gap-2">
              ابدأ التدريب الآن <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!summaryOnly && (
        <>
          <div className="px-6 py-6 rounded-[2rem] bg-[var(--page-surface-2)] border border-[var(--page-border-soft)] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
            <div>
              <h4 className="text-base font-black text-[var(--consciousness-text)] mb-1">لو جاهز، ابدأ خطوتك</h4>
              <p className="text-xs text-[var(--consciousness-text-muted)] font-medium">تقدر تتابع التنفيذ والخطوات في شاشة الخريطة المستقلة.</p>
            </div>
            <div className="flex flex-col w-full sm:w-auto gap-3">
              <button
                type="button"
                disabled={!addedNode?.id}
                onClick={() => {
                  if (!addedNode?.id) return;
                  if (!isMissionStarted) onStartMission(addedNode.id);
                  onOpenMission(addedNode.id);
                }}
                className={`px-8 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-colors ${isMissionCompleted ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-[var(--consciousness-primary)] text-[var(--ds-color-space-deep)] hover:opacity-90"}`}
              >
                {missionButtonLabel}
              </button>
              {!isMissionCompleted && isMissionStarted && (
                <div className="flex justify-center sm:justify-start items-center gap-2">
                  <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">التقدم: {completedSteps}/{totalSteps}</span>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-6 rounded-[2rem] bg-[var(--page-surface-2)] border border-[var(--page-border-soft)] text-right">
            <h3 className="text-sm font-black text-emerald-500 dark:text-emerald-400 mb-5 flex items-center gap-2">
              <span className="opacity-80">🗺️</span> خطة الخطوة الأولى
            </h3>
            <ol className="space-y-3">
              {result.steps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <span className="shrink-0 w-6 h-6 mt-0.5 rounded-full bg-[var(--ds-color-primary-soft)] text-[10px] font-black text-[var(--consciousness-primary)] flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm text-[var(--consciousness-text)] font-medium leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
};
