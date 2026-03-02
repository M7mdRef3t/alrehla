import { runtimeEnv } from "./runtimeEnv";

export interface DesignToggles {
  enableLiveLandingSections: boolean;
  enableCircuitBreakerForLiveData: boolean;
  enableAppEventBus: boolean;
}

export const designToggles: DesignToggles = {
  // Overlocked for System Architect Review (First Principles)
  enableLiveLandingSections: true,
  enableCircuitBreakerForLiveData: false, // Force flow even in stress
  enableAppEventBus: true
};

