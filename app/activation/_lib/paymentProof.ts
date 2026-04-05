"use client";

export type ProofImageState = {
  name: string;
  type: string;
  bytes: number;
  dataUrl: string;
};

export const LAST_PAYMENT_MODE_KEY = "activation.last_payment_mode";
export const COMPLETE_REGISTRATION_SESSION_KEY = "activation.complete_registration_tracked";
export const ALLOWED_PROOF_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const MAX_PROOF_IMAGE_BYTES = 900_000;

export function isLikelyEgyptUser(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  const locales = [nav.language, ...(nav.languages ?? [])].map((value) => String(value ?? "").toLowerCase());
  const hasEgyptLocale = locales.some((locale) => locale.includes("ar-eg"));
  const tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "").toLowerCase();
  const hasEgyptTimezone = tz.includes("cairo") || tz.includes("egypt");
  return hasEgyptLocale || hasEgyptTimezone;
}

export async function copyValue(value: string, onDone: (message: string) => void) {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  await navigator.clipboard.writeText(value);
  onDone("اتنسخت البيانات. حوّل وارجع ابعت إثبات الدفع.");
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ماقدرناش نجهز صورة الإثبات."));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });
}
