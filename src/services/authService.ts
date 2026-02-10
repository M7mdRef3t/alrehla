import type { AuthOtpResponse, AuthResponse, OAuthResponse } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export type UserToneGender = "male" | "female" | "neutral";

function getRedirectUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const origin = window.location.origin;
  // لو التطبيق شغال على localhost (سواء dev أو production build محلي) → الـ redirect يبقى على نفس السيرفر المحلي
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return origin.endsWith("/") ? origin : `${origin}/`;
  }
  // على السيرفر الحقيقي: استخدم المتغير أو دومين الإنتاج
  const configured =
    (import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined) ||
    (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) ||
    "https://www.alrehla.app";
  const base = configured.trim();
  return base.endsWith("/") ? base : `${base}/`;
}

function buildSupabaseUnavailableError() {
  return new Error("Supabase غير متاح");
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: buildSupabaseUnavailableError()
    } as AuthResponse;
  }
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: buildSupabaseUnavailableError()
    } as AuthResponse;
  }
  return supabase.auth.signUp({ email, password, options: { emailRedirectTo: getRedirectUrl() } });
}

export async function signInWithGoogle(): Promise<OAuthResponse> {
  if (!supabase) {
    return {
      data: { provider: "google", url: null },
      error: buildSupabaseUnavailableError()
    } as OAuthResponse;
  }
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getRedirectUrl() }
  });
}

export async function signInWithMagicLink(email: string): Promise<AuthOtpResponse> {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: buildSupabaseUnavailableError()
    } as AuthOtpResponse;
  }
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getRedirectUrl(),
      shouldCreateUser: true
    }
  });
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function updateAuthUserMetadata(metadata: Record<string, unknown>) {
  if (!supabase) {
    return {
      data: { user: null },
      error: buildSupabaseUnavailableError()
    };
  }
  return supabase.auth.updateUser({ data: metadata });
}

export async function updateDisplayName(fullName: string) {
  const normalized = fullName.replace(/\s+/g, " ").trim();
  // Keep both keys in sync since providers and app code may read either.
  return updateAuthUserMetadata({ full_name: normalized, name: normalized });
}

export async function updateToneGender(toneGender: UserToneGender) {
  return updateAuthUserMetadata({ tone_gender: toneGender });
}

export async function updateAccountProfile(input: { fullName?: string; toneGender?: UserToneGender }) {
  const data: Record<string, unknown> = {};

  if (typeof input.fullName === "string") {
    const normalized = input.fullName.replace(/\s+/g, " ").trim();
    data.full_name = normalized;
    data.name = normalized;
  }

  if (typeof input.toneGender === "string") {
    data.tone_gender = input.toneGender;
  }

  return updateAuthUserMetadata(data);
}
