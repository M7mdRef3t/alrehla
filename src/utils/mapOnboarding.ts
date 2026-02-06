const ONBOARDING_STORAGE_KEY = "dawayir-onboarding-map-seen";

export function setOnboardingSeen(): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
  }
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
}
