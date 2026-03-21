"use client";

import { useEffect } from "react";

import { OnboardingFlow } from "../../src/components/OnboardingFlow";
import {
  captureLeadAttributionFromCurrentUrl,
  captureUtmFromCurrentUrl
} from "../../src/services/marketingAttribution";

export default function OnboardingRouteClient() {
  useEffect(() => {
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();
  }, []);

  return (
    <OnboardingFlow
      onComplete={() => {
        window.location.href = "/";
      }}
    />
  );
}
