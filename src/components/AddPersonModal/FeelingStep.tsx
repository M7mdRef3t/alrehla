import type { FC } from "react";
import { FeelingCheck, type FeelingAnswers } from "../FeelingCheck";

interface FeelingStepProps {
  personLabel: string;
  onDone: (answers: FeelingAnswers) => void;
}

export const FeelingStep: FC<FeelingStepProps> = ({ personLabel, onDone }) => {
  return (
    <div>
      <FeelingCheck personLabel={personLabel} onDone={onDone} />
    </div>
  );
};
