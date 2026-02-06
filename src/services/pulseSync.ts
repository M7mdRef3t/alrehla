import type { PulseEntry } from "../state/pulseState";
import { isSupabaseReady, supabase } from "./supabaseClient";
import { getTrackingMode, getTrackingSessionId } from "./journeyTracking";

const SUPABASE_PULSE_TABLE = "daily_pulse_logs";

export async function pushPulseLog(entry: PulseEntry): Promise<void> {
  if (!isSupabaseReady || !supabase) return;
  const mode = getTrackingMode();
  const sessionId = mode === "identified" ? getTrackingSessionId() : null;

  const { error } = await supabase.from(SUPABASE_PULSE_TABLE).insert({
    session_id: sessionId,
    energy: entry.energy,
    mood: entry.mood,
    focus: entry.focus,
    auto: entry.auto ?? false,
    created_at: new Date(entry.timestamp).toISOString()
  });

  if (error && import.meta.env.DEV) {
    console.warn("pulseSync: supabase insert failed", error);
  }
}
