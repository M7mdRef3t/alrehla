import type { FC } from "react";
import { ResultVerdict } from "./ResultVerdict";
import { TacticalNarrative } from "./TacticalNarrative";
import { MissionCard } from "./MissionCard";
import { InsightCards } from "./InsightCards";
import { PressureSentenceCard } from "../PressureSentenceCard";
import { CommandSnapshotCard } from "../CommandSnapshotCard";
import { BoundaryEvidenceCard } from "../BoundaryEvidenceCard";
import type { ResultTemplate } from "@/utils/resultScreenTemplates";

interface DiagnosisSectionProps {
  shareCardRef: React.RefObject<HTMLDivElement | null>;
  result: ResultTemplate;
  activeRing: "green" | "yellow" | "red";
  isEmotionalPrisoner: boolean;
  shortPromiseBody: string;
  displayName: string;
  pressureSentence: any;
  commandSnapshot: any;
  boundaryEvidence: any;
  summaryOnly: boolean;
  onShowScripts: () => void;
}

export const DiagnosisSection: FC<DiagnosisSectionProps> = ({
  shareCardRef,
  result,
  activeRing,
  isEmotionalPrisoner,
  shortPromiseBody,
  displayName,
  pressureSentence,
  commandSnapshot,
  boundaryEvidence,
  summaryOnly,
  onShowScripts
}) => {
  return (
    <div className="flex flex-col gap-10 w-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div ref={shareCardRef}>
        <ResultVerdict 
          commandScore={result.commandScore}
          activeRing={activeRing}
          title={result.title}
          stateLabel={result.state_label}
          goalLabel={result.goal_label}
          isEmotionalPrisoner={isEmotionalPrisoner}
        />

        <TacticalNarrative 
          shortPromiseBody={shortPromiseBody}
          isEmotionalPrisoner={isEmotionalPrisoner}
          activeRing={activeRing}
        />

        <MissionCard 
          missionLabel={result.mission_label}
          missionGoal={result.mission_goal}
        />
      </div>

      <div className="space-y-4">
        {pressureSentence && <PressureSentenceCard snapshot={pressureSentence} />}
        {commandSnapshot && <CommandSnapshotCard snapshot={commandSnapshot} />}
        {boundaryEvidence && <BoundaryEvidenceCard evidence={boundaryEvidence} />}
      </div>

      {!summaryOnly && (
        <InsightCards 
          result={result}
          displayName={displayName}
          onShowScripts={onShowScripts}
        />
      )}
    </div>
  );
};
