import type { FC } from "react";
import { BreathingCard } from "./BreathingCard";
import { GuiltDetoxCard } from "./GuiltDetoxCard";
import { CustomExerciseCard } from "./CustomExerciseCard";
import type { CustomExerciseSpec } from "./CustomExerciseCard";

export type CardId = "breathing" | "guilt_detox";

interface AgentCardProps {
  cardId: CardId;
  onStartBreathing?: () => void;
}

export const AgentCard: FC<AgentCardProps> = ({ cardId, onStartBreathing }) => {
  if (cardId === "breathing") {
    return <BreathingCard onStart={onStartBreathing ?? (() => {})} />;
  }
  if (cardId === "guilt_detox") {
    return <GuiltDetoxCard />;
  }
  return null;
};

export { BreathingCard, GuiltDetoxCard, CustomExerciseCard };
export type { CustomExerciseSpec };
