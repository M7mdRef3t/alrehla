import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";

const ONBOARDING_STORAGE_KEY = "dawayir-onboarding-map-seen";

export function setOnboardingSeen(): void {
  setInLocalStorage(ONBOARDING_STORAGE_KEY, "true");
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return getFromLocalStorage(ONBOARDING_STORAGE_KEY) === "true";
}
