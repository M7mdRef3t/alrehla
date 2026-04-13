import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";
import { classifyState } from "@/modules/transformationEngine/interpretationEngine";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "System configuration missing" }, { status: 500 });
    }

    // Rate limiting / Spam prevention
    // In a full production system, use Vercel KV or redis here.
    // For now, we will track the IP/Device and limit the payload size.
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1024 * 500) { // Max 500KB per map update
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const payload = await req.json();
    
    // Basic validation
    if (!payload.session_id || !payload.nodes) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    // Auto-Diagnosis Logic (Sovereign Engine)
    let autoDiagnosis = payload.transformation_diagnosis;
    if (!autoDiagnosis && Array.isArray(payload.nodes)) {
      const redCount = payload.nodes.filter((n: any) => n.ring === "red").length;
      const yellowCount = payload.nodes.filter((n: any) => n.ring === "yellow").length;
      const greenCount = payload.nodes.filter((n: any) => n.ring === "green").length;
      
      autoDiagnosis = classifyState("", { red: redCount, yellow: yellowCount, green: greenCount });
    }

    // Extract expected fields, ignoring potentially dangerous injection attempts
    const safePayload = {
      session_id: payload.session_id,
      nodes: payload.nodes,
      map_type: payload.map_type || "dawayir",
      feeling_results: payload.feeling_results || null,
      transformation_diagnosis: autoDiagnosis || null,
      ai_interpretation: payload.ai_interpretation || null,
      updated_at: payload.updated_at || new Date().toISOString(),
      client_phone: payload.client_phone || null,
      origin_product: payload.origin_product || "alrehla",
      is_public: false // Anonymous maps are never public by default
    };

    // Upsert into Sovereign context (journey_maps)
    const { error } = await supabaseAdmin
      .from("journey_maps")
      .upsert(safePayload, {
        onConflict: "session_id",
      });

    if (error) {
      console.error("[MapSync API] Upsert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "synced_anonymously" });
  } catch (error: any) {
    console.error("[MapSync API] Server error:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
