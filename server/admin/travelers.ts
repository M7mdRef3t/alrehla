import { getAdminSupabase, verifyAdmin } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

/**
 * Sovereign Traveler Telemetry 📡
 * =============================
 * Fetches granular data for active travelers to provide a "First Principles"
 * view of the collective consciousness movement.
 */

export async function handleTravelers(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  const limit = Number(req.query?.limit ?? 20);
  const skip = Number(req.query?.skip ?? 0);

  // 1. Fetch Profiles with their current cohort status and latest session pulse
  const { data, error, count } = await client
    .from("profiles")
    .select(`
      id,
      full_name,
      phone,
      email,
      role,
      created_at,
      awareness_tokens,
      journey_expires_at,
      cohort_seat_reservations (
        status,
        provider,
        activated_at
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(skip, skip + limit - 1);

  if (error || !data) {
    console.error("[Travelers API] Error:", error);
    res.status(500).json({ error: "Failed to fetch traveler telemetry" });
    return;
  }

  // 2. Map data for the Radar
  const travelers = data.map(p => {
    const reservation = p.cohort_seat_reservations?.[0];
    return {
      id: p.id,
      name: p.full_name || "Unknown Traveler",
      phone: p.phone,
      email: p.email,
      role: p.role,
      tokens: p.awareness_tokens ?? 0,
      isPremium: reservation?.status === "activated",
      status: reservation?.status || "lead",
      joinedAt: p.created_at,
      expiresAt: p.journey_expires_at,
      // Heuristic: Churn risk if no activity for 3 days and not premium
      churnRisk: !p.journey_expires_at && (new Date().getTime() - new Date(p.created_at).getTime() > 86400000 * 3)
    };
  });

  res.status(200).json({ 
    travelers,
    total: count,
    timestamp: new Date().toISOString()
  });
}
