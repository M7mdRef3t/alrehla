import type { AuthOtpResponse, AuthResponse, OAuthResponse } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

function getRedirectUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const configured =
    (import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined) ||
    (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined) ||
    "";
  const base = configured.trim() || window.location.origin;
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
