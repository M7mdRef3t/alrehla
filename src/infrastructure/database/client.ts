/**
 * Infrastructure — Database Client
 * 
 * نقطة الوصول الموحدة لـ Supabase.
 * كل domain يستورد من هنا بدل الوصول المباشر لـ supabase-js.
 */

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { runtimeEnv } from "@/config/runtimeEnv";

// ─── Client-side (anon key) ───────────────────────────

const supabaseUrl = runtimeEnv.supabaseUrl;
const supabaseAnonKey = runtimeEnv.supabaseAnonKey;

declare global {
  var __dawayirSupabaseClient: SupabaseClient | undefined;
}

export const supabase: SupabaseClient | null = (() => {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  if (typeof window !== "undefined" && globalThis.__dawayirSupabaseClient) {
    return globalThis.__dawayirSupabaseClient;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  if (typeof window !== "undefined") {
    globalThis.__dawayirSupabaseClient = client;
  }

  return client;
})();

// ─── Server-side (service role key) ────────────────────

export const supabaseAdmin: SupabaseClient | null = (() => {
  if (typeof window !== "undefined") return null;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !adminKey) return null;

  return createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
})();

// ─── Helpers ───────────────────────────────────────────

export const isSupabaseReady = Boolean(supabase);

export function isSupabaseAbortError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message;
    if (/signal is aborted/i.test(message) || /aborterror/i.test(message)) {
      return true;
    }
  }

  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (error instanceof Error) {
    return error.name === "AbortError" || /signal is aborted/i.test(error.message);
  }

  return false;
}

export async function safeGetSession(): Promise<Session | null> {
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  } catch (error) {
    if (isSupabaseAbortError(error)) {
      return null;
    }
    throw error;
  }
}

// Re-export types for convenience
export type { SupabaseClient, Session };
