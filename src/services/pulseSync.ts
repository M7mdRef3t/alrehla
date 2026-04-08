import { logger } from "@/services/logger";
import type { PulseEntry } from "@/state/pulseState";
import { isSupabaseReady, supabase } from "./supabaseClient";
import { getTrackingMode, getTrackingSessionId } from "./journeyTracking";
import { runtimeEnv } from "@/config/runtimeEnv";
import { trackEvent, AnalyticsEvents } from "./analytics";

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
    if (fallbackError && runtimeEnv.isDev) {
      console.warn("pulseSync: supabase insert fallback failed", fallbackError);
    }
    return;
  }

  if (error && runtimeEnv.isDev) {
    console.warn("pulseSync: supabase insert failed", error);
  }
}

/**
 * Merge logic (Idempotent):
 * Syncs pulses recorded in Guest Mode from LocalStorage to the cloud account.
 */
export async function syncLocalPulsesOnLogin(): Promise<void> {
  if (typeof window === "undefined") return;
  const localDataStr = localStorage.getItem('dawayir_guest_pulses');
  if (!localDataStr) return;

  try {
    const guestPulses: any[] = JSON.parse(localDataStr);
    if (!guestPulses.length) return;

    const { data: { session } } = await supabase!.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    if (runtimeEnv.isDev) console.log(`[PulseSync] Merging ${guestPulses.length} guest pulses...`);

    for (const p of guestPulses) {
      // We use the /api/pulse endpoint which handles the upsert/logic check by 'day'
      await fetch('/api/pulse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mood: p.mood,
          energy: p.energy,
          stress_tag: p.stress_tag,
          note: p.note,
          focus: p.focus,
          day: p.day // Essential for past days
        })
      });
    }

    localStorage.removeItem('dawayir_guest_pulses');
    trackEvent(AnalyticsEvents.MERGE_SUCCESS, { count: guestPulses.length });
    if (runtimeEnv.isDev) console.log("[PulseSync] Guest pulses merged and cleared.");
  } catch (e) {
    logger.error("[PulseSync] Merge failed:", e);
  }
}
