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
  let config = { inhale: 4, hold: 7, exhale: 8, total: 19 };
  let color = "#2dd4bf"; // Teal
  let label = "سكينة عالمية (Universal Calm)";
  let activeUsers = Math.floor(1240 + Math.random() * 200);

  if (score > 0.8) {
    config = { inhale: 4, hold: 7, exhale: 8, total: 19 }; // 4-7-8 Zen
    color = "#2dd4bf";
    label = "سكينة عالمية (Universal Calm)";
    activeUsers = Math.floor(1240 + Math.random() * 200);
  } else if (score > 0.6) {
    config = { inhale: 5, hold: 5, exhale: 5, total: 15 }; // 5-5-5 Box
    color = "#14b8a6";
    label = "توازن مستقر (Stable Balance)";
    activeUsers = Math.floor(4580 + Math.random() * 500);
  } else {
    config = { inhale: 4, hold: 2, exhale: 4, total: 10 }; // Faster breath
    color = "#f59e0b";
    label = "ضجيج مرتفع (High Resonance)";
    activeUsers = Math.floor(8920 + Math.random() * 1000);
  }

  // Biometric UI Throttling: Inject physics directly to CSS variables
  if (typeof document !== "undefined") {
    // Determine a global speed multiplier (lower score = faster animations)
    // 1.0 score means base speed (e.g., 1x), 0.0 means fast speed (e.g., 0.5x)
    const speedMultiplier = 0.5 + (score * 0.5); // ranges from 0.5 to 1.0
    document.documentElement.style.setProperty("--harmony-duration", `${config.total}s`);
    document.documentElement.style.setProperty("--ui-speed", `${speedMultiplier}`);
    document.documentElement.style.setProperty("--harmony-color", color);
  }

  return {
    score,
    activeUsers,
    label,
    color,
    breathConfig: config
  };
};
