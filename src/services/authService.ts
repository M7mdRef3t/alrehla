import type { AuthOtpResponse, AuthResponse, OAuthResponse } from "@supabase/supabase-js";
import { safeGetSession, supabase } from "./supabaseClient";
import { runtimeEnv } from "../config/runtimeEnv";
import { getWindowOrNull } from "./clientRuntime";

export type UserToneGender = "male" | "female" | "neutral";

function getRedirectUrl(): string | undefined {
  const windowRef = getWindowOrNull();
  if (!windowRef) return undefined;
  // IMPORTANT:
  // In installed PWAs, forcing a fixed production domain (e.g. www) can
  // complete OAuth in a different origin than the running app, so the app
  // appears "logged out" after returning. Always use the current origin.
  const origin = windowRef.location.origin.trim();
  if (origin) return origin.endsWith("/") ? origin : `${origin}/`;

  const configured = (runtimeEnv.authRedirectUrl || runtimeEnv.publicAppUrl || "").trim();
  if (configured) return configured.endsWith("/") ? configured : `${configured}/`;
  return undefined;
}

function buildRedirectUrl(pathname?: string): string | undefined {
  const base = getRedirectUrl();
  if (!base) return undefined;
  if (!pathname) return base;

  try {
    return new URL(pathname, base).toString();
  } catch {
    return base;
  }
}

function buildOAuthCallbackUrl(pathname?: string): string | undefined {
  const base = getRedirectUrl();
  if (!base) return undefined;

  try {
    const callbackUrl = new URL("/auth/callback", base);
    const nextPath = pathname || "/";
    callbackUrl.searchParams.set("next", nextPath);
    return callbackUrl.toString();
  } catch {
    return buildRedirectUrl(pathname);
  }
}

async function signInWithGoogleInternal(pathname?: string): Promise<OAuthResponse> {
  if (!supabase) {
    return {
      data: { provider: "google", url: null },
      error: buildSupabaseUnavailableError()
    } as OAuthResponse;
  }
  const redirectTo = buildOAuthCallbackUrl(pathname);
  const response = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      // Control the final browser navigation ourselves so dev/local testing
      // cannot silently fall back to a different origin.
      skipBrowserRedirect: true
    }
  });

  if (!response.error && response.data?.url) {
    const windowRef = getWindowOrNull();
    const target = response.data.url;

    if (windowRef) {
      try {
        const nextUrl = new URL(target);
        if (redirectTo) {
          nextUrl.searchParams.set("redirect_to", redirectTo);
          nextUrl.searchParams.set("redirectTo", redirectTo);
        }
        windowRef.location.assign(nextUrl.toString());
      } catch {
        windowRef.location.assign(target);
      }
    }
  }

  return response;
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
  return signInWithGoogleInternal();
}

export async function signInWithGoogleAtPath(pathname: string): Promise<OAuthResponse> {
  return signInWithGoogleInternal(pathname);
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
  return safeGetSession();
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
