"use client";

import { usePersonalizedBiometrics } from "@/hooks/usePersonalizedBiometrics";
import { useWeatherFunnelBridge } from "@/hooks/useWeatherFunnelBridge";

export function DeferredExperienceEnhancers() {
  usePersonalizedBiometrics();
  useWeatherFunnelBridge();

  return null;
}
