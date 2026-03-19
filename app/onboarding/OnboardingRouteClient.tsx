"use client";

import { OnboardingFlow } from "../../src/components/OnboardingFlow";

export default function OnboardingRouteClient() {
  return (
    <OnboardingFlow
      onComplete={() => {
        window.location.href = "/";
      }}
    />
  );
}
