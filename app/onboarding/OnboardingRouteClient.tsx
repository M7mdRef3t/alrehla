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
        // Return the user into the app shell and land them on the map flow.
        window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, "start_recovery");
        window.location.href = "/";
      }}
    />
  );
}
