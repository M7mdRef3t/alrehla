import { useEffect, useRef } from "react";
import type { AppScreen } from "@/navigation/navigationMachine";
import { trackPageView } from "@/services/analytics";
import { trackingService } from "@/domains/journey";
import { getDocumentOrNull } from "@/services/clientRuntime";
import { getOrigin, getPathname } from "@/services/navigation";

const PAGE_NAMES: Record<AppScreen, string> = {
  landing: "Landing",
  goal: "Choose Goal",
  map: "Relationship Map",
  guided: "Guided Journey",
  mission: "Mission Screen",
  tools: "Journey Tools",
  settings: "Settings",
  enterprise: "Enterprise Portal",
  "guilt-court": "Guilt Court",
  diplomacy: "Diplomatic Cables",
  "oracle-dashboard": "Oracle Council",
  armory: "Armory",
  survey: "Research Survey",
  "exit-scripts": "Exit Scripts",
  grounding: "Grounding Toolkit",
  stories: "Success Stories",
  about: "About",
  insights: "Insights",
  quizzes: "Quizzes",
  "behavioral-analysis": "Behavioral Analysis",
  resources: "Resources",
  profile: "Profile",
  sanctuary: "Sanctuary",
  "life-os": "Life OS",
  dawayir: "Dawayir Map",
  maraya: "Maraya Digital Twin",
  "session-intake": "Session Intake",
  "session-console": "SessionOS Console",
  atmosfera: "Atmosfera Experience",
  masarat: "Masarat Paths",
  baseera: "Baseera Dashboard",
  watheeqa: "Watheeqa Journal",
  mizan: "Mizan Progress",
  rifaq: "Rifaq Buddies",
  murshid: "Murshid Guide",
  taqrir: "Taqrir Report",
  bawsala: "Bawsala Compass",
  riwaya: "Riwaya Timeline",
  protocol: "Action Protocol",
  diagnosis: "Diagnosis OS",
};

const SEO_BY_SCREEN: Record<AppScreen, { title: string; description: string }> = {
  landing: { title: "Alrehla", description: "Understand your relationships and boundaries." },
  goal: { title: "Choose Your Goal | Alrehla", description: "Choose the relationship goal you want to work on." },
  map: { title: "Relationship Map | Alrehla", description: "Visualize your relationship circles and boundaries." },
  guided: { title: "Guided Journey | Alrehla", description: "Follow a structured journey with practical steps." },
  mission: { title: "Mission Screen | Alrehla", description: "Complete mission steps and track progress." },
  tools: { title: "Journey Tools | Alrehla", description: "Access focused tools that help you take action." },
  settings: { title: "Settings | Alrehla", description: "Manage app settings and account-related options." },
  enterprise: { title: "Enterprise Portal | Alrehla", description: "B2B dashboard and organizational analytics." },
  "guilt-court": { title: "Guilt Court | Alrehla", description: "Dismantle irrational guilt through analysis." },
  diplomacy: { title: "Diplomatic Cables | Alrehla", description: "Message templates for strategic communication." },
  "oracle-dashboard": { title: "Oracle Council | Alrehla", description: "Review system anomalies and admin configs." },
  armory: { title: "Armory | Alrehla", description: "Advanced cognitive and psychological protocols." },
  survey: { title: "Research Survey | Alrehla", description: "Help us understand your needs through a quick survey." },
  "exit-scripts": { title: "Exit Scripts | Alrehla", description: "Ready-made exit phrases for hard situations." },
  grounding: { title: "Grounding Toolkit | Alrehla", description: "Body-first calming techniques to regulate." },
  stories: { title: "Stories | Alrehla", description: "Real stories of change and growth." },
  about: { title: "About | Alrehla", description: "Learn about the platform and its approach." },
  insights: { title: "Insights | Alrehla", description: "A holistic view of your relationship health." },
  quizzes: { title: "Quizzes | Alrehla", description: "Discover your patterns through interactive quizzes." },
  "behavioral-analysis": { title: "Behavioral Analysis | Alrehla", description: "Detect recurring behavioral patterns." },
  resources: { title: "Resources | Alrehla", description: "Videos, stories, and exercises to learn and practice." },
  profile: { title: "Profile | Alrehla", description: "Review your progress, achievements, and personal bio." },
  sanctuary: { title: "Sanctuary | Alrehla", description: "A private space for reflection and restoration." },
  "life-os": { title: "Life OS | Alrehla", description: "Your unified operating system for self-growth and decisions." },
  dawayir: { title: "خريطة الدوائر | Alrehla", description: "Visualize your relationship circles and social intelligence." },
  maraya: { title: "مرايا — التوأم الرقمي | Alrehla", description: "Explore your digital twin and uncover hidden patterns." },
  "session-intake": { title: "جلسة خاصة | Alrehla", description: "Request a private coaching or therapy session." },
  "session-console": { title: "لوحة تحكم الكوتش | Alrehla", description: "SessionOS Coach Console — manage intake, AI Pre-Brief, and sessions." },
  atmosfera: { title: "أجواء الرحلة | Alrehla", description: "Experience your emotional atmosphere — live, reactive, and personal." },
  masarat: { title: "مسارات | Alrehla", description: "اكتشف مسارك في علاقاتك — حدود، تعافٍ، ونمو." },
  baseera: { title: "بصيرة — الوعي الذاتي | Alrehla", description: "لوحة بصيرة — اعرف نفسك من خلال بياناتك الحقيقية." },
  watheeqa: { title: "وثيقة — سجّل رحلتك | Alrehla", description: "وثّق رحلتك يومياً — كلمة كلمة — واكتشف أنماطك." },
  mizan: { title: "ميزان — قياس التقدم | Alrehla", description: "شوف تقدمك الحقيقي — طاقة، علاقات، واستمرارية في رحلة واحدة." },
  rifaq: { title: "رفاق — رفاق الطريق | Alrehla", description: "لست وحدك في الرحلة — اكتشف رفاق بنفس الهدف وتحدّوا معاً." },
  murshid: { title: "مرشد — الذكاء الموجّه | Alrehla", description: "ذكاء يقرأ رحلتك — ينبّهك، يوجّهك، يحتفل معاك." },
  taqrir: { title: "تقرير — بياناتك في صفحة | Alrehla", description: "تقرير ذكي يجمع كل بياناتك — شاركه مع الكوتش أو احتفظ به." },
  bawsala: { title: "بوصلة — بوصلة القرارات | Alrehla", description: "كل قرار صعب عنده بوصلة — حلّل، قيّم، واختار." },
  riwaya: { title: "رواية — قصة رحلتك | Alrehla", description: "رحلتك كقصة — من البداية لهنا — بكل قمة ووادي." },
  protocol: { title: "Action Protocol | Alrehla", description: "Your active transformation protocol." },
  diagnosis: { title: "Diagnosis | Alrehla", description: "Understand your relationship diagnosis." },
};

export function useAppPageMetadata(screen: AppScreen) {
  const screenFlowTrackInitializedRef = useRef(false);

  useEffect(() => {
    if (!screenFlowTrackInitializedRef.current) {
      screenFlowTrackInitializedRef.current = true;
      return;
    }

    if (screen === "goal") trackingService.recordFlow("screen_goal_viewed");
    if (screen === "map") trackingService.recordFlow("screen_map_viewed");
    if (screen === "guided") trackingService.recordFlow("screen_guided_viewed");
    if (screen === "mission") trackingService.recordFlow("screen_mission_viewed");
    if (screen === "tools") trackingService.recordFlow("screen_tools_viewed");
    if (screen === "diplomacy") trackingService.recordFlow("screen_diplomacy_viewed");
    if (screen === "guilt-court") trackingService.recordFlow("screen_guilt_court_viewed");
    if (screen === "enterprise") trackingService.recordFlow("screen_enterprise_viewed");
    if (screen === "settings") trackingService.recordFlow("screen_settings_viewed");
    if (screen === "oracle-dashboard") trackingService.recordFlow("screen_oracle_dashboard_viewed");
    if (screen === "armory") trackingService.recordFlow("screen_armory_viewed");
    if (screen === "exit-scripts") trackingService.recordFlow("screen_exit_scripts_viewed");
    if (screen === "grounding") trackingService.recordFlow("screen_grounding_viewed");
  }, [screen]);

  useEffect(() => {
    trackPageView(PAGE_NAMES[screen]);
  }, [screen]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const seo = SEO_BY_SCREEN[screen];
    const documentRef = getDocumentOrNull();
    if (!documentRef) return;

    documentRef.title = seo.title;

    const descriptionTag = documentRef.querySelector('meta[name="description"]');
    if (descriptionTag) descriptionTag.setAttribute("content", seo.description);

    const setMeta = (selector: string, value: string) => {
      const tag = documentRef.querySelector(selector);
      if (tag) tag.setAttribute("content", value);
    };

    setMeta('meta[property="og:title"]', seo.title);
    setMeta('meta[property="og:description"]', seo.description);
    setMeta('meta[name="twitter:title"]', seo.title);
    setMeta('meta[name="twitter:description"]', seo.description);

    const canonical = documentRef.querySelector('link[rel="canonical"]');
    if (canonical) {
      const href = `${getOrigin()}${getPathname()}`;
      canonical.setAttribute("href", href);
      setMeta('meta[property="og:url"]', href);
    }

    const robotsTag = documentRef.querySelector('meta[name="robots"]');
    if (robotsTag) {
      const path = getPathname().toLowerCase();
      const isPrivatePath = path.startsWith("/admin") || path.startsWith("/analytics");
      robotsTag.setAttribute(
        "content",
        isPrivatePath
          ? "noindex,nofollow,noarchive"
          : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
      );
    }
  }, [screen]);
}
