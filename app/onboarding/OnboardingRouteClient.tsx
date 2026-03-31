"use client";

import { useEffect } from "react";

import { OnboardingFlow } from "../../src/components/OnboardingFlow";
import { useJourneyState } from "../../src/state/journeyState";
import {
  captureLeadAttributionFromCurrentUrl,
  captureUtmFromCurrentUrl
} from "../../src/services/marketingAttribution";

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";

export default function OnboardingRouteClient() {
  const mirrorName = useJourneyState((s) => s.mirrorName);

  useEffect(() => {
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();
  }, []);

  return (
    <OnboardingFlow
      initialMirrorName={mirrorName}
      onComplete={() => {
        // Send user directly to sanctuary map instead of landing page.
        window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, "start_recovery");
        window.location.href = "/dawayir";
      }}
    />
  );
}
