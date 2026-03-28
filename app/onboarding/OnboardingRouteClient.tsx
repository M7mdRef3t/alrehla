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
        // Redirect to checkout after onboarding to prevent the landing loop
        // and guide the high-intent lead towards payment.
        window.location.href = "/checkout";
      }}
    />
  );
}
