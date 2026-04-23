/**
 * adminSettings.ts — System settings management via Supabase.
 * Feature flags, scoring, pulse, theme palette, marketing spend, journey paths config.
 */

import { supabase, isSupabaseReady } from "../supabaseClient";
import { callAdminApi } from "./adminCore";
import { SETTINGS_TABLE } from "./adminCore";
import type {
  SystemSettingKey,
  ThemePalette,
  FeatureFlagKey,
  FeatureFlagMode,
  ScoringWeights,
  ScoringThresholds,
  PulseCheckMode,
  PulseCopyOverrides,
  JourneyPath,
} from "./adminTypes";

// ─── Internal Helpers ───────────────────────────────────────────────
const toSettingMap = (rows: Array<{ key: string; value: unknown }>) => {
  const map = new Map<string, unknown>();
  rows.forEach((row) => map.set(row.key, row.value));
  return map;
};

export async function fetchSettings(keys: SystemSettingKey[]) {
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select("key,value")
    .in("key", keys);
  if (error || !data) return null;
  return toSettingMap(data as Array<{ key: string; value: unknown }>);
}

export async function saveSetting(key: SystemSettingKey, value: unknown) {
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from(SETTINGS_TABLE).upsert(
    {
      key,
      value
    },
    { onConflict: "key" }
  );
  return !error;
}

// ─── Feature Flags ──────────────────────────────────────────────────
export async function fetchFeatureMode(key: FeatureFlagKey): Promise<FeatureFlagMode | null> {
  const flags = await fetchSettings(["feature_flags"]);
  if (!flags) return null;
  const val = flags.get("feature_flags") as Record<FeatureFlagKey, FeatureFlagMode>;
  return val?.[key] ?? null;
}

export async function updateFeatureMode(key: FeatureFlagKey, mode: FeatureFlagMode): Promise<boolean> {
  const flagsMap = await fetchSettings(["feature_flags"]);
  const current = (flagsMap?.get("feature_flags") as Record<FeatureFlagKey, FeatureFlagMode>) ?? {};
  return saveSetting("feature_flags", { ...current, [key]: mode });
}

export async function saveFeatureFlags(flags: Record<FeatureFlagKey, FeatureFlagMode>): Promise<boolean> {
  return saveSetting("feature_flags", flags);
}

// ─── System Prompt ──────────────────────────────────────────────────
export async function saveSystemPrompt(prompt: string): Promise<boolean> {
  return saveSetting("system_prompt", prompt);
}

// ─── Scoring ────────────────────────────────────────────────────────
export async function fetchScoringWeights(): Promise<ScoringWeights | null> {
  const data = await fetchSettings(["scoring_weights"]);
  return (data?.get("scoring_weights") as ScoringWeights) ?? null;
}

export async function updateScoringWeights(weights: ScoringWeights): Promise<boolean> {
  return saveSetting("scoring_weights", weights);
}

export async function fetchScoringThresholds(): Promise<ScoringThresholds | null> {
  const data = await fetchSettings(["scoring_thresholds"]);
  return (data?.get("scoring_thresholds") as ScoringThresholds) ?? null;
}

export async function updateScoringThresholds(thresholds: ScoringThresholds): Promise<boolean> {
  return saveSetting("scoring_thresholds", thresholds);
}

export async function saveScoring(
  weights: ScoringWeights,
  thresholds: ScoringThresholds
): Promise<boolean> {
  const [weightsSaved, thresholdsSaved] = await Promise.all([
    updateScoringWeights(weights),
    updateScoringThresholds(thresholds)
  ]);
  return weightsSaved && thresholdsSaved;
}

// ─── Pulse Check Mode ───────────────────────────────────────────────
export async function fetchPulseCheckMode(): Promise<PulseCheckMode | null> {
  const data = await fetchSettings(["pulse_check_mode"]);
  return (data?.get("pulse_check_mode") as PulseCheckMode) ?? null;
}

export async function updatePulseCheckMode(mode: PulseCheckMode): Promise<boolean> {
  return saveSetting("pulse_check_mode", mode);
}

export async function savePulseCheckMode(mode: PulseCheckMode): Promise<boolean> {
  return updatePulseCheckMode(mode);
}

// ─── Theme Palette ──────────────────────────────────────────────────
export async function fetchThemePalette(): Promise<ThemePalette | null> {
  const data = await fetchSettings(["theme_palette"]);
  return (data?.get("theme_palette") as ThemePalette) ?? null;
}

export async function updateThemePalette(palette: ThemePalette): Promise<boolean> {
  return saveSetting("theme_palette", palette);
}

export async function saveThemePalette(palette: ThemePalette): Promise<boolean> {
  return updateThemePalette(palette);
}

// ─── Pulse Copy Overrides ───────────────────────────────────────────
export async function fetchPulseCopyOverrides(): Promise<PulseCopyOverrides | null> {
  const data = await fetchSettings(["pulse_copy_overrides"]);
  return (data?.get("pulse_copy_overrides") as PulseCopyOverrides) ?? null;
}

export async function updatePulseCopyOverrides(overrides: PulseCopyOverrides): Promise<boolean> {
  return saveSetting("pulse_copy_overrides", overrides);
}

// ─── Admin Config (bulk fetch) ──────────────────────────────────────
export async function fetchAdminConfig(): Promise<{
  featureFlags: Record<FeatureFlagKey, FeatureFlagMode> | null;
  systemPrompt: string | null;
  scoringWeights: ScoringWeights | null;
  scoringThresholds: ScoringThresholds | null;
  pulseCheckMode: PulseCheckMode | null;
  pulseCopyOverrides: PulseCopyOverrides | null;
} | null> {
  const data = await fetchSettings([
    "feature_flags",
    "system_prompt",
    "scoring_weights",
    "scoring_thresholds",
    "pulse_check_mode",
    "pulse_copy_overrides"
  ]);

  if (!data) return null;

  return {
    featureFlags: (data.get("feature_flags") as Record<FeatureFlagKey, FeatureFlagMode>) ?? null,
    systemPrompt: (data.get("system_prompt") as string) ?? null,
    scoringWeights: (data.get("scoring_weights") as ScoringWeights) ?? null,
    scoringThresholds: (data.get("scoring_thresholds") as ScoringThresholds) ?? null,
    pulseCheckMode: (data.get("pulse_check_mode") as PulseCheckMode) ?? null,
    pulseCopyOverrides: (data.get("pulse_copy_overrides") as PulseCopyOverrides) ?? null
  };
}

// ─── Marketing Spend ────────────────────────────────────────────────
export async function fetchMarketingSpend(): Promise<number> {
  const data = await fetchSettings(["marketing_spend"]);
  return (data?.get("marketing_spend") as number) ?? 0;
}

export async function updateMarketingSpend(spend: number): Promise<boolean> {
  return saveSetting("marketing_spend", spend);
}

// ─── Campaign Budgets ───────────────────────────────────────────────
export async function fetchCampaignBudgets(): Promise<Record<string, number>> {
  const data = await fetchSettings(["campaign_budgets"]);
  return (data?.get("campaign_budgets") as Record<string, number>) ?? {};
}

export async function updateCampaignBudget(campaignId: string, budget: number): Promise<boolean> {
  const currentBudgets = await fetchCampaignBudgets();
  return saveSetting("campaign_budgets", { ...currentBudgets, [campaignId]: budget });
}

// ─── Journey Paths Config ───────────────────────────────────────────
export async function fetchJourneyPaths(): Promise<JourneyPath[] | null> {
  const data = await fetchSettings(["journey_paths"]);
  return (data?.get("journey_paths") as JourneyPath[]) ?? null;
}

export async function updateJourneyPaths(paths: JourneyPath[]): Promise<boolean> {
  return saveSetting("journey_paths", paths);
}
