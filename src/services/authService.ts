import type { AuthOtpResponse, AuthResponse, OAuthResponse } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export type UserToneGender = "male" | "female" | "neutral";

function getRedirectUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const configured =
    (import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined) ||
    (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) ||
    "";
  const base = configured.trim() || window.location.origin;
  
  // Fix for development: ensure we use the correct port
  const isDev = import.meta.env.DEV;
  if (isDev && base.includes('localhost:3000')) {
    return 'http://localhost:5000/';
  }
  
  // For production, ensure we use the correct domain
  if (!isDev) {
    // Force the correct production domain
    return 'https://www.alrehla.app/';
  }
  
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
