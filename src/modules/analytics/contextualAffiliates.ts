import { videos, type ContentCategory } from "../../data/educationalContent";

export interface ContextualAffiliateRecommendation {
  id: string;
  title: string;
  description: string;
  url: string;
  placement: "mission_contextual_affiliate";
  category: ContentCategory;
  reason: string;
}

interface ResolveContextInput {
  ring?: string;
  scenarioKey?: string;
  isEmergency?: boolean;
}

function resolveCategory(input: ResolveContextInput): ContentCategory {
  if (input.isEmergency || input.ring === "red") return "recovery";
  switch (input.scenarioKey) {
    case "active_battlefield":
      return "boundaries";
    case "eggshells":
      return "communication";
    case "fading_echo":
      return "recovery";
    case "emotional_prisoner":
      return "symptoms";
    case "safe_harbor":
      return "relationships";
    default:
      return "boundaries";
  }
}

function toWatchUrl(rawUrl: string): string {
  const safe = String(rawUrl ?? "").trim();
  if (!safe) return safe;
  if (!safe.includes("/embed/")) return safe;
  const videoId = safe.split("/embed/")[1]?.split(/[?&#]/)[0];
  if (!videoId) return safe;
  return `https://www.youtube.com/watch?v=${videoId}&utm_source=dawayir&utm_medium=mission&utm_campaign=contextual_affiliate`;
}

export function resolveMissionContextualAffiliate(
  input: ResolveContextInput
): ContextualAffiliateRecommendation | null {
  const category = resolveCategory(input);
  const candidate = videos.find((video) => video.category === category && video.videoUrl) ?? videos.find((video) => Boolean(video.videoUrl));
  if (!candidate?.videoUrl) return null;

  const reasonByCategory: Record<ContentCategory, string> = {
    boundaries: "خطوتك الآن تحتاج حدود أوضح تقلل الاستنزاف.",
    communication: "المرحلة الحالية تحتاج تواصل مباشر بهدوء.",
    recovery: "الأولوية الآن هي استعادة الاتزان قبل أي تصعيد.",
    relationships: "مناسب للحفاظ على الاستقرار في العلاقات الآمنة.",
    symptoms: "يعالج الإشارات النفسية المتكررة أثناء التنفيذ."
  };

  return {
    id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    url: toWatchUrl(candidate.videoUrl),
    placement: "mission_contextual_affiliate",
    category,
    reason: reasonByCategory[category]
  };
}

