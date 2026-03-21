import { useEffect, useRef } from "react";
import type { AppScreen } from "../../navigation/navigationMachine";
import { trackPageView } from "../../services/analytics";
import { recordFlowEvent } from "../../services/journeyTracking";
import { getDocumentOrNull } from "../../services/clientRuntime";
import { getOrigin, getPathname } from "../../services/navigation";

const PAGE_NAMES: Record<AppScreen, string> = {
  landing: "الرئيسية",
  goal: "اختيار الهدف",
  map: "خريطة العلاقات",
  guided: "الرحلة الموجهة",
  mission: "شاشة المهمة",
  tools: "أدوات الرحلة",
  settings: "الإعدادات",
  enterprise: "بوابة المؤسسات",
  "guilt-court": "محكمة الشعور بالذنب",
  diplomacy: "البرقيات الدبلوماسية",
  "oracle-dashboard": "مجلس الحكماء",
  armory: "الترسانة (Armory)",
  survey: "استبيان البحث",
  "exit-scripts": "مكتبة جمل الخروج",
  grounding: "تقنيات تهدئة الجسم"
};

const SEO_BY_SCREEN: Record<AppScreen, { title: string; description: string }> = {
  landing: {
    title: "Alrehla | Relationship Clarity Platform",
    description: "Alrehla helps you understand your relationships and boundaries with clarity through Dawayir."
  },
  goal: {
    title: "Choose Your Goal | Alrehla",
    description: "Choose the relationship goal you want to work on and start your guided journey."
  },
  map: {
    title: "Relationship Map | Alrehla",
    description: "Visualize your relationship circles and set healthier boundaries with confidence."
  },
  guided: {
    title: "Guided Journey | Alrehla",
    description: "Follow a structured journey with practical steps to regain clarity and control."
  },
  mission: {
    title: "Mission Screen | Alrehla",
    description: "Complete your mission steps and track progress in real relationship scenarios."
  },
  tools: {
    title: "Journey Tools | Alrehla",
    description: "Access focused tools that help you regulate, reflect, and take practical action."
  },
  settings: {
    title: "Settings | Alrehla",
    description: "Manage your subscription, language, and B2B portal settings."
  },
  enterprise: {
    title: "Enterprise Portal | Alrehla",
    description: "B2B psychological safety and organizational analytics dashboard."
  },
  "guilt-court": {
    title: "Guilt Court | Alrehla",
    description: "Strategically dismantle irrational guilt through logical analysis."
  },
  diplomacy: {
    title: "Diplomatic Cables | Alrehla",
    description: "Smart message templates for strategic communication and boundary setting."
  },
  "oracle-dashboard": {
    title: "Oracle Council | Alrehla",
    description: "Review system anomalies and administrative configurations."
  },
  armory: {
    title: "The Armory | Alrehla",
    description: "Access advanced cognitive and psychological defense protocols."
  },
  survey: {
    title: "Research Survey | Alrehla",
    description: "Help us understand your needs through a quick research survey."
  },
  "exit-scripts": {
    title: "Exit Scripts Library | Alrehla",
    description: "Ready-made exit phrases for every difficult situation."
  },
  grounding: {
    title: "Grounding Toolkit | Alrehla",
    description: "Body-first calming techniques to regulate your nervous system."
  }
};

export function useAppPageMetadata(screen: AppScreen) {
  const screenFlowTrackInitializedRef = useRef(false);

  useEffect(() => {
    if (!screenFlowTrackInitializedRef.current) {
      screenFlowTrackInitializedRef.current = true;
      return;
    }

    if (screen === "goal") recordFlowEvent("screen_goal_viewed");
    if (screen === "map") recordFlowEvent("screen_map_viewed");
    if (screen === "guided") recordFlowEvent("screen_guided_viewed");
    if (screen === "mission") recordFlowEvent("screen_mission_viewed");
    if (screen === "tools") recordFlowEvent("screen_tools_viewed");
    if (screen === "diplomacy") recordFlowEvent("screen_diplomacy_viewed");
    if (screen === "guilt-court") recordFlowEvent("screen_guilt_court_viewed");
    if (screen === "enterprise") recordFlowEvent("screen_enterprise_viewed");
    if (screen === "settings") recordFlowEvent("screen_settings_viewed");
    if (screen === "oracle-dashboard") recordFlowEvent("screen_oracle_dashboard_viewed");
    if (screen === "armory") recordFlowEvent("screen_armory_viewed");
    if (screen === "exit-scripts") recordFlowEvent("screen_exit_scripts_viewed");
    if (screen === "grounding") recordFlowEvent("screen_grounding_viewed");
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
    if (descriptionTag) {
      descriptionTag.setAttribute("content", seo.description);
    }

    const setMeta = (selector: string, value: string) => {
      const tag = documentRef.querySelector(selector);
      if (tag) {
        tag.setAttribute("content", value);
      }
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
