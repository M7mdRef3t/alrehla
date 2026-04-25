import { logger } from "@/services/logger";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { runtimeEnv } from "@/config/runtimeEnv";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = runtimeEnv.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = runtimeEnv.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
/**
 * Checks if we need cross-domain cookie storage (production with subdomains).
 * On localhost, JWT tokens exceed the 4KB browser cookie limit and get silently dropped,
 * so we always use the default localStorage for localhost/dev.
 */
function needsCrossDomainCookies(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.")) return false;
  // Only use cookies for production domains (enables cross-domain SSO between subdomains)
  return true;
}

// Create a custom cross-domain storage adapter for Unified SSO (Hub + Satellites).
// ONLY used in production — avoids 4KB cookie limit issues in dev.
const createCrossDomainStorage = () => {
  if (typeof window === "undefined") return undefined;
  if (!needsCrossDomainCookies()) {
    // In dev/localhost, use the default storage (localStorage) for reliability
    return undefined;
  }

  return {
    getItem: (key: string): string | null => {
      try {
        // First try localStorage as a fallback in case cookies are unavailable
        const lsValue = window.localStorage.getItem(key);
        if (lsValue) return lsValue;

        const name = encodeURIComponent(key) + "=";
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const c = cookies[i].trim();
          if (c.indexOf(name) === 0) {
            return decodeURIComponent(c.substring(name.length));
          }
        }
      } catch (err) {
        console.error("[StorageAdapter] Error reading storage:", err);
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      try {
        // Always mirror to localStorage for fast reads
        window.localStorage.setItem(key, value);

        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        const tld = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
        const domainString = `; domain=.${tld}`;
        const expireDate = new Date();
        expireDate.setFullYear(expireDate.getFullYear() + 1);
        const isSecure = "; Secure";
        
        // Write cookie for cross-domain access between subdomains
        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; expires=${expireDate.toUTCString()}; path=/${domainString}; SameSite=None${isSecure}`;
      } catch (err) {
        console.error("[StorageAdapter] Error writing storage:", err);
      }
    },
    removeItem: (key: string): void => {
      try {
        window.localStorage.removeItem(key);
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        const tld = parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
        document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${tld}; SameSite=None; Secure`;
      } catch (err) {
        console.error("[StorageAdapter] Error removing from storage:", err);
      }
    }
  };
};

declare global {
  // Keep a single Supabase client across Fast Refresh / repeated module evaluation.
  // This avoids duplicate auth-lock traffic and session churn in dev.
  var __dawayirSupabaseClient: SupabaseClient | undefined;
}

export const supabase: SupabaseClient | null = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase] Missing URL or Anon Key. Client will not be initialized.");
    return null;
  }

  // Reuse existing client across Fast Refresh cycles (crucial for session continuity in dev)
  if (typeof window !== "undefined" && globalThis.__dawayirSupabaseClient) {
    return globalThis.__dawayirSupabaseClient;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true,
      storageKey: "alrehla-ecosystem-auth", // Unified Identity SSO key
      storage: createCrossDomainStorage(),  // undefined on localhost = use default localStorage
      detectSessionInUrl: true,             // Let Supabase auto-detect hash-based tokens
      // Bypass navigator.locks on localhost to suppress unhandled AbortErrors caused by Fast Refresh & React Strict Mode
      lock: needsCrossDomainCookies() ? undefined : async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
    }
  });

  if (typeof window !== "undefined") {
    globalThis.__dawayirSupabaseClient = client;
  }

  return client;
})();

export const supabaseAdmin: SupabaseClient | null = (() => {
  if (typeof window !== "undefined") return null;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !adminKey) return null;

  return createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
})();

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

export async function safeGetUser(): Promise<User | null> {
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch (error) {
    if (isSupabaseAbortError(error)) {
      return null;
    }
    throw error;
  }
}

// Tactical Helpers

import { CommanderStats, Rank } from "@/types/tactical";

export const fetchCommanderStats = async (userId: string): Promise<CommanderStats | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('command_center_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching commander stats:', error);
    return null;
  }
  return data;
};

export const updateCommanderRank = async (userId: string, missionCount: number) => {
  if (!supabase) return;

  let newRank: Rank = "Recruit";
  if (missionCount >= 26) newRank = "Master General";
  else if (missionCount >= 16) newRank = "Border Commander";
  else if (missionCount >= 6) newRank = "Awareness Lieutenant";

  const { error } = await supabase
    .from('command_center_stats')
    .upsert({
      user_id: userId,
      rank: newRank,
      missions_completed: missionCount,
      last_promotion_date: new Date().toISOString()
    });

  if (error) logger.error('Error updating rank:', error);
  return newRank;
};

export const updateAssetLocation = async (assetId: string, newZone: string) => {
  if (!supabase) return;

  let threatLevel = "Stable";
  if (newZone === "Red") threatLevel = "Hostile";
  if (newZone === "Green") threatLevel = "Safe";

  const { error } = await supabase
    .from('field_assets')
    .update({
      deployment_zone: newZone,
      threat_level: threatLevel,
      last_engagement: new Date().toISOString()
    })
    .eq('id', assetId);

  if (error) logger.error('Error updating asset location:', error);
};

export const saveDailyIntel = async (userId: string, missionId: string, content: string, breachDetected: boolean = false) => {
  if (!supabase) return;

  const { error } = await supabase
    .from('tactical_journal')
    .insert({
      user_id: userId,
      mission_id: missionId,
      content,
      breach_detected: breachDetected,
      created_at: new Date().toISOString()
    });

  if (error) logger.error('Error saving daily intel:', error);
  return !error;
};
