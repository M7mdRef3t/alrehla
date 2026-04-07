import type { FeatureFlagKey } from "@/config/features";

export interface JourneyToolBase {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  featureKey: FeatureFlagKey;
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
  availableFeatures?: Partial<Record<FeatureFlagKey, boolean>>;
}

export const journeyToolsBase: JourneyToolBase[] = [
  {
    id: "dawayir",
    name: "دواير",
    tagline: "البوصلة التكتيكية",
    description: "خريطة الجبهات وتحديد الاتجاه: مين بيدعمك ومين بيستنزف مواردك.",
    icon: "🧭",
    featureKey: "dawayir_map"
  },
  {
    id: "mirror",
    name: "المراية",
    tagline: "غرفة أنا",
    description: "ضبط داخلي وتنظيف الضجيج: طاقة، اختراق داخلي، وصوتك الحقيقي.",
    icon: "🪞",
    featureKey: "mirror_tool"
  },
  {
    id: "journal",
    name: "السجل",
    tagline: "الأرشيف الذكي",
    description: "توثيق المناورات وتحويل الخبرات لمرجع قرار قابل للمراجعة.",
    icon: "📖",
    featureKey: "internal_boundaries"
  }
];

export function getJourneyToolsView(context: JourneyToolContext): JourneyToolView[] {
  const hasFirstStep = context.unlockedIds.includes("first_step") || context.nodesCount > 0;
  const hasBaseline = context.baselineCompletedAt != null;
  const mirrorUnlocked = hasFirstStep || hasBaseline;
  const journalUnlocked = context.unlockedIds.includes("mission_complete") || context.hasMissionCompleted;

  return journeyToolsBase.map((tool) => {
    if (context.availableFeatures && context.availableFeatures[tool.featureKey] === false) {
      return {
        ...tool,
        locked: true,
        status: "قيد التجهيز"
      };
    }
    if (tool.id === "dawayir") {
      return { ...tool, locked: false, status: "جاهزة الآن" };
    }
    if (tool.id === "mirror") {
      return {
        ...tool,
        locked: !mirrorUnlocked,
        status: mirrorUnlocked ? "جاهزة الآن" : "🔒 تفتح بعد أول خطوة"
      };
    }
    if (tool.id === "journal") {
      return {
        ...tool,
        locked: !journalUnlocked,
        status: journalUnlocked ? "جاهزة الآن" : "🔒 تفتح بعد أول مهمة مكتملة"
      };
    }
    return { ...tool, locked: true, status: "🔒 قيد التجهيز" };
  });
}
