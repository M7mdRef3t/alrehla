import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { requireAdmin } from "@/server/requireAdmin";

/**
 * Sovereign Mutations API 🧬
 * =========================
 * GET: استرجاع جميع الطفرات المقترحة والنشطة.
 * PATCH: تفعيل أو تعطيل طفرة معينة (Governance).
 */

export async function GET(req: Request) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        const supabaseAdmin = getSupabaseAdminClient();
        if (!supabaseAdmin) throw new Error("Supabase Admin client missing");

        const { data: mutations, error } = await supabaseAdmin
            .from("ui_mutations")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ ok: true, data: mutations });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        const supabaseAdmin = getSupabaseAdminClient();
        if (!supabaseAdmin) throw new Error("Supabase Admin client missing");

        const { id, is_active } = await req.json();

        if (!id) throw new Error("Mutation ID is required");

        // لو هنفعل طفرة، لازم نعطل أي طفرات تانية لنفس الـ component_id
        if (is_active) {
            const { data: current } = await supabaseAdmin
                .from("ui_mutations")
                .select("component_id")
                .eq("id", id)
                .single();

            if (current) {
                await supabaseAdmin
                    .from("ui_mutations")
                    .update({ is_active: false, deactivated_at: new Date().toISOString() })
                    .eq("component_id", current.component_id)
                    .neq("id", id);
            }
        }

        const { error } = await supabaseAdmin
            .from("ui_mutations")
            .update({ 
                is_active, 
                activated_at: is_active ? new Date().toISOString() : null,
                deactivated_at: is_active ? null : new Date().toISOString()
            })
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
export async function POST(req: Request) {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    try {
        const supabaseAdmin = getSupabaseAdminClient();
        if (!supabaseAdmin) throw new Error("Supabase Admin client missing");

        const mutation = await req.json();

        // Validation
        if (!mutation.component_id || !mutation.variant_name) {
            throw new Error("Missing required fields: component_id, variant_name");
        }

        const { data, error } = await supabaseAdmin
            .from("ui_mutations")
            .insert([{
                ...mutation,
                is_active: false,
                resonance_score_delta: mutation.resonance_score_delta ?? 0,
                friction_events_count: mutation.friction_events_count ?? 0,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ ok: true, data });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
