export interface JourneyToolBase {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
}

export interface JourneyToolView extends JourneyToolBase {
  status: string;
  locked: boolean;
}

export interface JourneyToolContext {
  nodesCount: number;
  baselineCompletedAt: number | null;
  unlockedIds: string[];
  hasMissionCompleted: boolean;
}

export const journeyToolsBase: JourneyToolBase[] = [
  {
    id: "dawayir",
    name: "دواير",
    tagline: "البوصلة",
    description: "خريطة العلاقات وتحديد الاتجاه: مين معاك ومين بيستنزفك.",
    icon: "🧭"
  },
  {
    id: "mirror",
    name: "المراية",
    tagline: "أنا",
    description: "وعي ذاتي وتنظيف الضجيج الداخلي: الطاقة، الذنب، والصوت الداخلي.",
    icon: "🪞"
  },
  {
    id: "journal",
    name: "السجل",
    tagline: "المذكرات الذكية",
    description: "توثيق الرحلة وتحويل خبراتك لقصة قابلة للمراجعة.",
    icon: "📖"
  }
];

export function getJourneyToolsView(context: JourneyToolContext): JourneyToolView[] {
  const hasFirstStep = context.unlockedIds.includes("first_step") || context.nodesCount > 0;
  const hasBaseline = context.baselineCompletedAt != null;
  const mirrorUnlocked = hasFirstStep || hasBaseline;
  const journalUnlocked = context.unlockedIds.includes("mission_complete") || context.hasMissionCompleted;

  return journeyToolsBase.map((tool) => {
    if (tool.id === "dawayir") {
      return { ...tool, locked: false, status: "متاحة الآن" };
    }
    if (tool.id === "mirror") {
      return {
        ...tool,
        locked: !mirrorUnlocked,
        status: mirrorUnlocked ? "متاحة الآن" : "🔒 تفتح بعد أول خطوة"
      };
    }
    if (tool.id === "journal") {
      return {
        ...tool,
        locked: !journalUnlocked,
        status: journalUnlocked ? "متاحة الآن" : "🔒 تفتح بعد أول مهمة مكتملة"
      };
    }
    return { ...tool, locked: true, status: "🔒 قريباً في رحلتك" };
  });
}
