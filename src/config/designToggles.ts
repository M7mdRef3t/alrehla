import { runtimeEnv } from "./runtimeEnv";

export interface DesignToggles {
  enableLiveLandingSections: boolean;
  enableCircuitBreakerForLiveData: boolean;
  enableAppEventBus: boolean;
}

export const designToggles: DesignToggles = {
  enableLiveLandingSections: true,
  enableCircuitBreakerForLiveData: true,
  enableAppEventBus: runtimeEnv.isDev
};

