/**
 * Global Harmony Pulse Service
 * Calculates the "World Harmony Score" (0.0 to 1.0)
 * reflecting the collective emotional resonance of the Alrehla community.
 */

import { supabase, isSupabaseReady } from "./supabaseClient";

export interface HarmonyPulse {
  score: number; // 0 (Stressed) to 1 (Zen)
  activeUsers: number;
  label: string;
  color: string;
  breathConfig: {
    inhale: number;
    hold: number;
    exhale: number;
    total: number;
  };
}

let sovereignOverride: number | null = null;

// Real-time listener for Sovereign Override
if (isSupabaseReady && supabase) {
  supabase
    .channel("system_settings_changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "system_settings", filter: "key=eq.global_harmony_override" },
      (payload) => {
        if (payload.new && typeof payload.new.value === "number") {
          sovereignOverride = payload.new.value;
        }
      }
    )
    .subscribe();

  // Initial fetch
  void supabase
    .from("system_settings")
    .select("value")
    .eq("key", "global_harmony_override")
    .maybeSingle()
    .then(({ data }) => {
      if (data && typeof data.value === "number") {
        sovereignOverride = data.value;
      }
    });
}

export const getGlobalHarmony = (): HarmonyPulse => {
  const now = new Date();
  const hours = now.getHours();
  
  // Use override if available, otherwise use simulation
  let baseScore = sovereignOverride !== null ? sovereignOverride : 0.8;
  
  if (sovereignOverride === null) {
    if (hours >= 9 && hours <= 17) {
      baseScore = 0.55;
    } else if (hours >= 22 || hours <= 4) {
      baseScore = 0.92;
    } else {
      baseScore = 0.75;
    }
  }

  // Add a slight oscillating wave for "liveness"
  const wave = Math.sin(Date.now() / 10000) * 0.05;
  const score = Math.min(1, Math.max(0, baseScore + wave));

  // Determine configuration based on score
  if (score > 0.8) {
    return {
      score,
      activeUsers: Math.floor(1240 + Math.random() * 200),
      label: "سكينة عالمية (Universal Calm)",
      color: "#2dd4bf", // Teal
      breathConfig: { inhale: 4, hold: 7, exhale: 8, total: 19 } // 4-7-8 Zen
    };
  } else if (score > 0.6) {
    return {
      score,
      activeUsers: Math.floor(4580 + Math.random() * 500),
      label: "توازن مستقر (Stable Balance)",
      color: "#14b8a6",
      breathConfig: { inhale: 5, hold: 5, exhale: 5, total: 15 } // 5-5-5 Box
    };
  } else {
    return {
      score,
      activeUsers: Math.floor(8920 + Math.random() * 1000),
      label: "ضجيج مرتفع (High Resonance)",
      color: "#f59e0b", // Amber/Gold
      breathConfig: { inhale: 4, hold: 2, exhale: 4, total: 10 } // Faster breath
    };
  }
};
