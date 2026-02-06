import type { FC } from "react";
import { RealityCheck, type RealityAnswers } from "../RealityCheck";

interface PositionStepProps {
  personLabel: string;
  onDone: (answers: RealityAnswers) => void;
  onBack: () => void;
}

export const PositionStep: FC<PositionStepProps> = ({ personLabel, onDone, onBack }) => {
  return (
    <RealityCheck
      personLabel={personLabel}
      onDone={onDone}
      onBack={onBack}
    />
  );
};
