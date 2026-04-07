import { supabase } from "./supabaseClient";

/**
 * Pulse Engagement Service
 * Handles real-time metrics for "Global Pulse" and social proof.
 */

const BASE_PULSE = 3240;
let cachedRealPulse: number | null = null;
let lastFetchTime = 0;

/**
 * Calculates a realistic number of active users based on the time of day.
 * If Supabase is available, it blends real data with the deterministic model.
 */
export function getLivePulseCount(): number {
  if (typeof window === "undefined") return BASE_PULSE;
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Dynamic offset based on hour (Peak at 9 AM and 10 PM)
  const hourOffset = Math.sin((hours - 6) * Math.PI / 12) * 500;
  const minuteOffset = Math.floor(minutes / 2) * 5;
  
  const calculatedPulse = Math.floor(BASE_PULSE + hourOffset + minuteOffset);

  // If we have a real pulse from the DB in the last 5 minutes, use it to "anchor" the calculation
  if (cachedRealPulse !== null && (Date.now() - lastFetchTime < 300000)) {
     // We blend the calculated "vibe" with the hard reality
     return Math.floor((calculatedPulse * 0.7) + (cachedRealPulse * 0.3));
  }

  // Trigger background fetch if needed
  if (Date.now() - lastFetchTime > 300000) {
    void refreshRealPulseStats();
  }
  
  return calculatedPulse;
}

let isFetchingPulse = false;

/**
 * Fetches real stats from Supabase RPC
 */
async function refreshRealPulseStats() {
    if (!supabase || isFetchingPulse) return;
    isFetchingPulse = true;
    try {
        const { data, error } = await supabase.rpc('get_live_pulse_stats');
        if (!error && data && data[0]) {
            cachedRealPulse = Number(data[0].total_recent_visitors);
            lastFetchTime = Date.now();
            console.info("💓 Pulse anchored to reality:", cachedRealPulse);
        }
    } catch (err) {
        console.warn("💓 Pulse sync failed, using deterministic model.");
    } finally {
        isFetchingPulse = false;
    }
}


/**
 * Simulates a single random heartbeat pulse activity.
 * Returns true if a "Pulse" event should be visually triggered.
 */
export function shouldTriggerHeartbeat(): boolean {
  return Math.random() > 0.85;
}

