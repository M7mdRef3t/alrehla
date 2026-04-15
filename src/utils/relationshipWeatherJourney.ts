import type { JourneyPath, JourneyPathStepKind } from "@/domains/admin/store/admin.store";
import {
  getEnabledJourneySteps,
  getFirstJourneyStepByKind,
  getJourneyPathBySlug
} from "@/utils/journeyPaths";

export const RELATIONSHIP_WEATHER_PATH_SLUG = "relationship-weather";
export const WEATHER_FUNNEL_SURFACE = "weather-funnel";
export const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";

export type RelationshipWeatherRuntimeStage = "questions" | "analyzing" | "result" | "complete";

const WEATHER_STAGE_KIND_MAP: Record<RelationshipWeatherRuntimeStage, JourneyPathStepKind | "outcome"> = {
  questions: "check",
  analyzing: "decision",
  result: "screen",
  complete: "outcome"
};

export function getRelationshipWeatherPath(paths: JourneyPath[]): JourneyPath | null {
  return getJourneyPathBySlug(paths, RELATIONSHIP_WEATHER_PATH_SLUG);
}

export function getRelationshipWeatherEntryHref(path: JourneyPath | null): string {
  const configuredEntry = path?.entryScreen?.trim();
  if (configuredEntry?.startsWith("/")) return configuredEntry;

  const entryStep = getFirstJourneyStepByKind(path, "entry")?.screen?.trim();
  if (entryStep?.startsWith("/")) return entryStep;

  return "/weather";
}

export function getRelationshipWeatherPrimaryLabel(path: JourneyPath | null): string {
  const configuredLabel = path?.primaryActionLabel?.trim();
  return configuredLabel || "ابدأ دواير وارسم خريطتك";
}

export function getRelationshipWeatherTargetLabel(path: JourneyPath | null, weatherLevel?: string): string {
  const target = path?.targetScreen?.trim();

  if (!target) {
    if (weatherLevel === "hurricane" || weatherLevel === "storm") return "وحدة نذير";
    if (weatherLevel === "wind" || weatherLevel === "sun") return "وحدة ميزان";
    return "الخريطة";
  }
  if (target.startsWith("/weather")) return "طقس العلاقات";
  if (target.startsWith("/")) return "الوجهة التالية";

  const targetLabelMap: Record<string, string> = {
    map: "الخريطة",
    sanctuary: "مساحتك الخاصة",
    tools: "الأدوات",
    insights: "الرؤى",
    armory: "الترسانة",
    nadhir: "وحدة نذير",
    mizan: "وحدة ميزان"
  };

  return targetLabelMap[target] ?? target;
}

export function getRelationshipWeatherTargetDescription(path: JourneyPath | null, weatherLevel?: string): string {
  const target = path?.targetScreen?.trim();

  if (target === "map" || !target) {
    if (weatherLevel === "hurricane" || weatherLevel === "storm") {
      return "نذير: وحدة المواجهة ووضع الحدود الصارمة لاستعادة سيادتك على طاقتك المسلوبة.";
    }
    if (weatherLevel === "wind" || weatherLevel === "sun") {
      return "ميزان: وحدة الاتزان الصحي وقياس جودة العلاقات لضمان استقرار طاقتك الذهنية.";
    }
    return "دواير بتخليك تشوف كل دوائر حياتك على خريطة تفاعلية وتعرف مين بياخد وإيه نمط العلاقة.";
  }

  if (target === "sanctuary") {
    return "مساحتك الخاصة تستقبلك أولاً لو كنت محتاج تهدئة قبل ما تدخل على أي تشخيص أو خريطة أعمق.";
  }

  if (target === "tools") {
    return "الأدوات تأخذك مباشرة إلى مساحة تنفيذ وعمل بدل الاكتفاء بقراءة التشخيص فقط.";
  }

  if (target === "insights") {
    return "قسم الرؤى يجمع لك القراءة التشخيصية في صورة أنماط ومعانٍ قابلة للفهم والتأمل.";
  }

  return "الوجهة التالية في هذا المسار تُحدد من لوحة التحكم حسب شكل الرحلة التي تريدها.";
}

function getRelationshipWeatherAppTarget(path: JourneyPath | null, weatherContext?: Record<string, unknown>): string {
  const outcomeScreen = getFirstJourneyStepByKind(path, "outcome")?.screen?.trim();
  if (outcomeScreen && !outcomeScreen.startsWith("/")) return outcomeScreen;

  const configuredTarget = path?.targetScreen?.trim();
  if (configuredTarget && !configuredTarget.startsWith("/")) return configuredTarget;

  const level = weatherContext?.weatherLevel as string;
  if (level === "hurricane" || level === "storm") return "nadhir";
  if (level === "wind" || level === "sun") return "mizan";

  return "map";
}

function getRelationshipWeatherRouteTarget(path: JourneyPath | null, source: string): string {
  const configuredTarget = path?.targetScreen?.trim();
  if (configuredTarget?.startsWith("/")) return configuredTarget;
  return `/dawayir?surface=${WEATHER_FUNNEL_SURFACE}&utm_source=${encodeURIComponent(source)}`;
}

function mapJourneyKindToRuntimeStage(kind: JourneyPathStepKind | undefined): RelationshipWeatherRuntimeStage {
  if (kind === "check") return "questions";
  if (kind === "decision") return "analyzing";
  if (kind === "screen") return "result";
  return "complete";
}

export function getRelationshipWeatherInitialStage(path: JourneyPath | null): RelationshipWeatherRuntimeStage {
  const steps = getEnabledJourneySteps(path);
  const entryIndex = steps.findIndex((step) => step.kind === "entry");
  const firstPlayableStep = steps
    .slice(entryIndex >= 0 ? entryIndex + 1 : 0)
    .find((step) => step.kind === "check" || step.kind === "decision" || step.kind === "screen" || step.kind === "outcome");

  return mapJourneyKindToRuntimeStage(firstPlayableStep?.kind);
}

export function getRelationshipWeatherNextStage(
  path: JourneyPath | null,
  currentStage: RelationshipWeatherRuntimeStage
): RelationshipWeatherRuntimeStage {
  if (currentStage === "complete") return "complete";

  const currentKind = WEATHER_STAGE_KIND_MAP[currentStage];
  const steps = getEnabledJourneySteps(path);
  const currentIndex = steps.findIndex((step) => step.kind === currentKind);

  if (currentIndex === -1) return "complete";

  const nextPlayableStep = steps
    .slice(currentIndex + 1)
    .find((step) => step.kind === "check" || step.kind === "decision" || step.kind === "screen" || step.kind === "outcome");

  return mapJourneyKindToRuntimeStage(nextPlayableStep?.kind);
}

export function launchRelationshipWeatherFlow(
  path: JourneyPath | null,
  weatherContext: Record<string, unknown>,
  source = "weather_v3",
  clientEventId?: string
) {
  if (typeof window === "undefined") return;

  // Enhance context with client event ID for bridge tracking
  const enhancedContext = {
    ...weatherContext,
    client_event_id: clientEventId
  };

  window.sessionStorage.setItem("weather_context", JSON.stringify(enhancedContext));

  const appTarget = getRelationshipWeatherAppTarget(path, enhancedContext);
  if (appTarget) {
    window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, `navigate:${appTarget}`);
  }

  window.location.assign(getRelationshipWeatherRouteTarget(path, source));
}
