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
        <div className="group relative px-8 py-8 rounded-[2.5rem] bg-gradient-to-br from-teal-500/[0.05] to-transparent border border-teal-500/20 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-6 overflow-hidden backdrop-blur-xl">
          {/* HUD Corners */}
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-teal-500/30 rounded-tr-xl transition-all group-hover:w-6 group-hover:h-6" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-teal-500/30 rounded-bl-xl transition-all group-hover:w-6 group-hover:h-6" />
          
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_20px_rgba(45,212,191,0.1)]">
            <Target className="w-8 h-8 text-teal-400" />
          </div>
          <div className="flex-1 z-10">
            <h4 className="text-xl font-black text-white mb-2 tracking-tight">تدريب المواجهة المخصص</h4>
            <p className="text-sm text-slate-300 leading-relaxed font-medium mb-6">
              هنحطك في مواقف حقيقية ونشوف هتتعامل إزاي. التدريب ده هو اللي هيبني "عضلة الحدود" عشان تقدر تحمي نفسك في الواقع.
            </p>
            <button onClick={onShowTraining} className="group/btn relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-500 text-slate-950 font-black text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_40px_rgba(45,212,191,0.5)]">
              <span>ابدأ التدريب الآن</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!summaryOnly && (
        <>
          <div className="group relative px-8 py-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right transition-all hover:bg-white/[0.04]">
            {/* HUD Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/10 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/10 rounded-br-xl" />
            
            <div className="z-10">
              <h4 className="text-lg font-black text-white mb-1">لو جاهز، ابدأ خطوتك</h4>
              <p className="text-sm text-slate-400 font-medium">تقدر تتابع التنفيذ والخطوات في شاشة الخريطة المستقلة.</p>
            </div>
            <div className="flex flex-col w-full sm:w-auto gap-3 z-10">
              <button
                type="button"
                disabled={!addedNode?.id}
                onClick={() => {
                  if (!addedNode?.id) return;
                  if (!isMissionStarted) onStartMission(addedNode.id);
                  onOpenMission(addedNode.id);
                }}
                className={`px-10 py-4 rounded-2xl font-black text-sm whitespace-nowrap transition-all duration-500 ${isMissionCompleted ? "bg-white/5 text-slate-400 border border-white/5" : "bg-teal-500 text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(45,212,191,0.4)]"}`}
              >
                {missionButtonLabel}
              </button>
              {!isMissionCompleted && isMissionStarted && (
                <div className="flex justify-center sm:justify-start items-center gap-3 mt-1">
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden flex-1">
                      <div className="h-full bg-teal-500" style={{ width: `${(completedSteps / totalSteps) * 100}%` }} />
                   </div>
                  <span className="text-[10px] font-black text-teal-400 tracking-widest uppercase shrink-0">{completedSteps}/{totalSteps}</span>
                </div>
              )}
            </div>
          </div>

          <div className="group relative px-10 py-10 rounded-[3rem] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 text-right backdrop-blur-3xl">
            {/* HUD Corners */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-teal-500/20 rounded-tr-3xl" />
            
            <h3 className="text-[10px] font-black text-teal-500/60 mb-8 flex items-center gap-3 uppercase tracking-[0.4em]">
              <span className="w-2 h-2 rounded-full bg-teal-500" /> خطة الخطوة الأولى
            </h3>
            <ol className="space-y-4 relative">
              {/* Vertical line connector */}
              <div className="absolute right-5 top-4 bottom-4 w-[1px] bg-white/5" />
              
              {result.steps.map((step, index) => (
                <li key={`${step}-${index}`} className="group/item flex items-start gap-6 p-4 rounded-2xl hover:bg-white/[0.03] transition-all relative">
                  <span className="shrink-0 w-10 h-10 rounded-2xl bg-white/5 text-sm font-black text-teal-400 flex items-center justify-center border border-white/10 group-hover/item:border-teal-500/50 transition-all z-10">
                    {index + 1}
                  </span>
                  <span className="text-lg text-slate-300 font-medium leading-relaxed tracking-tight group-hover/item:text-white transition-colors">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
};
