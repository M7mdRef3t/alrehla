import { runtimeEnv } from "./runtimeEnv";

export interface DesignToggles {
  enableLiveLandingSections: boolean;
  enableCircuitBreakerForLiveData: boolean;
  enableAppEventBus: boolean;
}

export const designToggles: DesignToggles = {
  // User mode favors stability/consistency over experimental live sections.
  enableLiveLandingSections: runtimeEnv.isDev,
  enableCircuitBreakerForLiveData: true,
  enableAppEventBus: runtimeEnv.isDev
};

