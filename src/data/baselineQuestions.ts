export interface BaselineQuestion {
  id: string;
  text: string;
  type: "scale" | "choice";
  /** 1-5 scale label (low to high). Used when type === "scale" */
  scaleLabels?: { low: string; high: string };
  /** Used when type === "choice" */
  options?: { value: string; label: string }[];
}

export const BASELINE_QUESTIONS: BaselineQuestion[] = [
  {
    id: "q1",
    text: "إيه درجة وضوح حدودك في علاقاتك دلوقتي؟",
    type: "scale",
    scaleLabels: { low: "مش واضحة", high: "واضحة جداً" }
  },
  {
    id: "q2",
    text: "قد إيه حاسس إن علاقاتك بتاخد من طاقتك؟",
    type: "scale",
    scaleLabels: { low: "مش بتاخد", high: "بتاخد جداً" }
  },
  {
    id: "q3",
    text: "حاسس إنك عارف مين قريب منك بجد ومين لا؟",
    type: "choice",
    options: [
      { value: "no", label: "لأ، مش واضح" },
      { value: "little", label: "شوية" },
      { value: "yes", label: "أيوه، عارف" }
    ]
  },
  {
    id: "q4",
    text: "إيه مستوى رغبتك في تحسين وضعك مع العلاقات؟",
    type: "scale",
    scaleLabels: { low: "ضعيفة", high: "قوية جداً" }
  }
];

export type BaselineAnswers = Record<string, number | string>;

/** Simple baseline score 0–100 for comparison later (higher = better boundaries / clarity). */
export function computeBaselineScore(answers: BaselineAnswers): number {
  let sum = 0;
  const q1 = answers["q1"] as number | undefined;
  const q2 = answers["q2"] as number | undefined;
  const q3 = answers["q3"] as string | undefined;
  const q4 = answers["q4"] as number | undefined;
  if (typeof q1 === "number") sum += (q1 / 5) * 25;
  if (typeof q2 === "number") sum += (1 - q2 / 5) * 25; // inverse: less drain = better
  if (q3 === "yes") sum += 25;
  else if (q3 === "little") sum += 12.5;
  if (typeof q4 === "number") sum += (q4 / 5) * 25;
  return Math.round(Math.min(100, Math.max(0, sum)));
}
