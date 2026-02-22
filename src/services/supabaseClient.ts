import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runtimeEnv } from "../config/runtimeEnv";

const supabaseUrl = runtimeEnv.supabaseUrl;
const supabaseAnonKey = runtimeEnv.supabaseAnonKey;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
    : null;

export const isSupabaseReady = Boolean(supabase);

// Debug logging for production
if (typeof window !== 'undefined' && !isSupabaseReady) {
  console.error('=== Supabase Debug ===');
  console.error('supabaseUrl:', supabaseUrl);
  console.error('supabaseAnonKey:', supabaseAnonKey ? 'SET' : 'UNDEFINED');
  console.error('runtimeEnv check:', {
    hasUrl: !!runtimeEnv.supabaseUrl,
    hasKey: !!runtimeEnv.supabaseAnonKey,
    isDev: runtimeEnv.isDev
  });
  console.error('====================');
}
// Tactical Helpers

import { CommanderStats, Rank } from "../types/tactical";

export const fetchCommanderStats = async (userId: string): Promise<CommanderStats | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('command_center_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching commander stats:', error);
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

  if (error) console.error('Error updating rank:', error);
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

  if (error) console.error('Error updating asset location:', error);
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

  if (error) console.error('Error saving daily intel:', error);
  return !error;
};
