import { logger } from "@/services/logger";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/services/supabaseClient";
import { useJourneyProgress } from "@/domains/journey";
import { assignUrl, getSearch } from "@/services/navigation";
import type { AppScreen } from "@/navigation/navigationMachine";
import type { WelcomeSource } from "../OnboardingWelcomeBubble";

type WelcomeState = {
  message: string;
  source: WelcomeSource;
} | null;

import type { AdviceCategory } from "@/data/adviceScripts";

interface UseAppGateHandoffParams {
  navigateToScreen: (screen: AppScreen) => boolean;
  setGoalId: (goalId: string) => void;
  setCategory: (category: AdviceCategory) => void;
}

const GATE_ONBOARDING_PAYLOAD_KEY = "dawayir-gate-onboarding-payload";

function redirectGateUserToOnboarding(): void {
  assignUrl("/onboarding?source=gate");
}

export function useAppGateHandoff({
  navigateToScreen,
  setGoalId,
  setCategory
}: UseAppGateHandoffParams) {
  const [gateWelcome, setGateWelcome] = useState<WelcomeState>(null);
  const journey = useJourneyProgress();
  
  const clearGateWelcome = useCallback(() => {
    setGateWelcome(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rawSearch = getSearch();
    const searchParams = new URLSearchParams(rawSearch);
    const gateSessionId = searchParams.get("gateSessionId");

    if (!gateSessionId) return;

    // Immediately remove `gateSessionId` from url to prevent re-execution or confusion
    searchParams.delete("gateSessionId");
    const newSearch = searchParams.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
    
    // Replace URL without reload
    window.history.replaceState(null, "", newUrl);

    // Save global session trace for `MapCompleted` Brutal rule later
    journey.setGateSessionId(gateSessionId);

    // Now securely fetch the payload to construct personalized welcome
    let cancelled = false;

    // Keep defaults aligned, but let onboarding own the actual routing decision.
    setGoalId("family");
    setCategory("family");

    void (async () => {
      try {
        if (!supabase) {
          if (!cancelled) redirectGateUserToOnboarding();
          return;
        }

        const { data, error } = await supabase
          .from("gate_sessions")
          .select("pain_point, intent")
          .eq("id", gateSessionId)
          .single();

        if (error || !data) {
          logger.error("[Gate Handoff] Failed to retrieve session.", error);
          if (!cancelled) redirectGateUserToOnboarding();
          return;
        }

        if (cancelled) return;

        // Custom Welcome messages based on `pain_point` Map
        let message = "مساحة لا تحتاج فيها إلى تبرير كل شيء.. ضع دوائرك كما تراها أنت."; // Default fallback
        const pain = data.pain_point?.toLowerCase() || "";

        if (pain.includes("confusion") || pain.includes("غموض")) {
          message = "ابدأ من النقطة التي لا تراها بوضوح.";
        } else if (pain.includes("pattern") || pain.includes("نمط")) {
          message = "لن نعيد نفس النمط المميت.. سنرسم خريطتك أولاً لتراه.";
        } else if (pain.includes("guilt") || pain.includes("ذنب")) {
          message = "مساحة لا تحتاج فيها إلى تبرير كل شيء.. ضع دوائرك كما تراها أنت.";
        } else if (pain.includes("burnout") || pain.includes("استنزاف")) {
          message = "في دوائرك شخص يستنزفك. الملاذ يساعدك تراه بدون ضجيج.";
        }

        setGateWelcome({ message, source: "template" });
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            GATE_ONBOARDING_PAYLOAD_KEY,
            JSON.stringify({
              message,
              source: "template" as WelcomeSource,
              painPoint: data.pain_point ?? null,
              intent: data.intent ?? null,
            })
          );
        }
        redirectGateUserToOnboarding();
        
      } catch (err) {
        logger.error("[Gate Handoff] Unexpected error", err);
        if (!cancelled) redirectGateUserToOnboarding();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [journey, navigateToScreen, setGoalId, setCategory]);

  return {
    gateWelcome,
    clearGateWelcome
  };
}
