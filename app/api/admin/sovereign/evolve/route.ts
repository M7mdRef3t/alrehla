import { NextResponse, NextRequest } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
// @ts-ignore
import { quickAnalyze } from "@alrehla/masarat";
import { requireAdmin } from "@/server/requireAdmin";

export const dynamic = "force-dynamic";

/**
 * Sovereign Evolve API 🧬🌀
 * =========================
 * يقوم بمسح أحداث الرحلة (journey_events) واكتشاف أنماط الاحتكاك،
 * ثم يولد طفرات (Mutations) مقترحة لتحسين تجربة المسافرين.
 */

export async function POST(req: NextRequest) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        const supabaseAdmin = getSupabaseAdminClient();
        if (!supabaseAdmin) throw new Error("Supabase Admin client missing");

        console.log("🚀 [Sovereign Evolve] Initiating Collective Consciousness Deep Scan...");

        // 1. Fetch latest behavioral events from the correct table
        const { data: events, error: eventsError } = await supabaseAdmin
            .from("routing_events")
            .select("*")
            .order("occurred_at", { ascending: false })
            .limit(200);

        if (eventsError) throw eventsError;

        // 2. Identify Friction Hotspots in Routing
        const frictionEvents = events?.filter(e => 
            (e.event_type === 'route_dropout' || e.event_type === 'navigation_error' || (e.payload?.duration_ms > 10000))
        ) || [];

        const results = [];
        let mutationsCount = 0;

        // 3. Generate Mutation Hypotheses (Archetype-driven)
        if (frictionEvents.length > 0) {
            // Hypothesis A: Travelers are stuck in Onboarding or specific Surface
            const onboardingFriction = frictionEvents.filter(e => e.payload?.path?.includes('onboarding') || e.payload?.surface === 'onboarding');
            
            if (onboardingFriction.length > 0 || frictionEvents.length > 5) {
                const mutation = {
                    component_id: "SovereignGate",
                    variant_name: `clarity_stabilizer_${Date.now().toString(36)}`,
                    variant_path: "evolution/gate_v2_clarity.tsx",
                    hypothesis: `Friction detected in routing flows (${frictionEvents.length} points). Proposing a "Clarity Stabilizer" for the Sovereign Gate to reduce cognitive dropouts.`,
                    resonance_score_delta: 0.15,
                    is_active: false
                };
                
                await supabaseAdmin.from("ui_mutations").upsert(mutation, { onConflict: "component_id,variant_name" });
                mutationsCount++;
                results.push({ target: mutation.component_id, hypothesis: mutation.hypothesis });
            }
        }

        // 4. Evolutionary Success Signal
        return NextResponse.json({
            ok: true,
            scanned_events: events?.length || 0,
            friction_points: frictionEvents.length,
            new_mutations: mutationsCount,
            results
        });

    } catch (error: any) {
        console.error("[Sovereign Evolve] Evolution Interrupted:", error);
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
