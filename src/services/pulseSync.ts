import type { PulseEntry } from "../state/pulseState";
import { isSupabaseReady, supabase } from "./supabaseClient";
import { getTrackingMode, getTrackingSessionId } from "./journeyTracking";

const SUPABASE_PULSE_TABLE = "daily_pulse_logs";

export async function pushPulseLog(entry: PulseEntry): Promise<void> {
  if (!isSupabaseReady || !supabase) return;
  const mode = getTrackingMode();
  const sessionId = mode === "identified" ? getTrackingSessionId() : null;

  const basePayload = {
    session_id: sessionId,
    energy: entry.energy,
    mood: entry.mood,
    focus: entry.focus,
    auto: entry.auto ?? false,
    created_at: new Date(entry.timestamp).toISOString()
  };

  const extendedPayload = {
    ...basePayload,
    energy_reasons: entry.energyReasons ?? null,
    energy_confidence: entry.energyConfidence ?? null
  };

  const { error } = await supabase.from(SUPABASE_PULSE_TABLE).insert(extendedPayload);

  if (!error) return;

  // Backward compatibility: if columns are not deployed yet, retry with base payload.
  const msg = String(error.message ?? "");
  if (/column|energy_reasons|energy_confidence|schema cache|does not exist/i.test(msg)) {
    const { error: fallbackError } = await supabase.from(SUPABASE_PULSE_TABLE).insert(basePayload);
    if (fallbackError && import.meta.env.DEV) {
      console.warn("pulseSync: supabase insert fallback failed", fallbackError);
    }
    return;
  }

  if (error && import.meta.env.DEV) {
    console.warn("pulseSync: supabase insert failed", error);
  }
}
