import { logger } from "@/services/logger";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { runtimeEnv } from "@/config/runtimeEnv";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = runtimeEnv.supabaseUrl;
const supabaseAnonKey = runtimeEnv.supabaseAnonKey;

declare global {
  // Keep a single Supabase client across Fast Refresh / repeated module evaluation.
  // This avoids duplicate auth-lock traffic and session churn in dev.
   
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
