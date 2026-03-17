import type { SupabaseClient } from "@supabase/supabase-js";

export async function mirrorJourneyEvent(
  client: SupabaseClient,
  userId: string,
  eventName: string,
  payload: Record<string, unknown>,
) {
  try {
    await client.from("journey_events").insert({
      user_id: userId,
      event_name: eventName,
      payload,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking mirror.
  }
}

export async function mirrorAnalyticsEvent(
  client: SupabaseClient,
  userId: string,
  eventName: string,
  properties: Record<string, unknown>,
) {
  try {
    await client.from("analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      properties,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking mirror.
  }
}
