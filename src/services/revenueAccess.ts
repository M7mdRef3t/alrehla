import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";

export const LEAD_EMAIL_KEY = "dawayir_lead_email";
export const ACTIVATION_UNLOCK_KEY = "dawayir_activation_unlocked";

export function setStoredLeadEmail(email: string) {
  const clean = email.trim().toLowerCase();
  if (clean) setInLocalStorage(LEAD_EMAIL_KEY, clean);
}

export function getStoredLeadEmail(): string | null {
  return getFromLocalStorage(LEAD_EMAIL_KEY);
}

export function markRevenueAccessUnlocked() {
  setInLocalStorage(ACTIVATION_UNLOCK_KEY, "true");
}

export function hasRevenueAccess(): boolean {
  return getFromLocalStorage(ACTIVATION_UNLOCK_KEY) === "true";
}
