export interface PostStepQuestion {
  id: string;
  text: string;
  type: "scale" | "choice";
  scaleLabels?: { low: string; high: string };
  options?: { value: string; label: string }[];
}

export const POST_STEP_QUESTIONS: PostStepQuestion[] = [
  {
    id: "ps1",
    text: "دلوقتي إيه درجة وضوح صورة العلاقة دي عندك؟",
    type: "scale",
    scaleLabels: { low: "لسه مش واضحة", high: "واضحة جداً" }
  },
  {
    id: "ps2",
    text: "حاسس إنك أخذت خطوة عملية؟",
    type: "choice",
    options: [
      { value: "no", label: "لأ" },
      { value: "little", label: "شوية" },
      { value: "yes", label: "أيوه" }
    ]
  }
];

export type PostStepAnswers = Record<string, number | string>;

export function computePostStepScore(answers: PostStepAnswers): number {
  let sum = 0;
  const ps1 = answers["ps1"] as number | undefined;
  const ps2 = answers["ps2"] as string | undefined;
  if (typeof ps1 === "number") sum += (ps1 / 5) * 50;
  if (ps2 === "yes") sum += 50;
  else if (ps2 === "little") sum += 25;
  return Math.round(Math.min(100, Math.max(0, sum)));
}
