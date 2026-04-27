import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";
import { classifyState } from "@/modules/transformationEngine/interpretationEngine";

export async function GET() {
  console.log("[MapSync API] GET request received");
  return NextResponse.json({ ok: true, message: "Sync Map API is alive (use POST to sync)" });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  console.log("[MapSync API] POST request received at", new Date().toISOString());
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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase Admin Client not initialized (check env vars)" }, { status: 500 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    
    // Basic validation
    if (!payload.session_id || !payload.nodes) {
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
    }

    // Auto-Diagnosis Logic (Sovereign Engine) - Guarded
    let autoDiagnosis = payload.transformation_diagnosis;
    if (!autoDiagnosis && Array.isArray(payload.nodes)) {
      try {
        const redCount = payload.nodes.filter((n: any) => n && (n.ring === "red" || n.color === "red")).length;
        const yellowCount = payload.nodes.filter((n: any) => n && (n.ring === "yellow" || n.color === "yellow")).length;
        const greenCount = payload.nodes.filter((n: any) => n && (n.ring === "green" || n.color === "green")).length;
        
        autoDiagnosis = classifyState("", { red: redCount, yellow: yellowCount, green: greenCount });
      } catch (diagError) {
        console.warn("[MapSync API] Auto-diagnosis logic failure:", diagError);
      }
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
      console.error("[MapSync API] Upsert Error:", {
        code: error.code,
        message: error.message,
        sessionId: payload.session_id,
        nodesCount: Array.isArray(payload.nodes) ? payload.nodes.length : 0
      });
      return NextResponse.json({ 
        error: "Database ingestion failed", 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, status: "synced_anonymously" });
  } catch (error: any) {
    console.error("[MapSync API] CRITICAL_FAILURE:", {
      message: error?.message,
      stack: error?.stack,
      error
    });
    return NextResponse.json({ 
      error: "Sovereign Ingestion Failure", 
      message: error.message 
    }, { status: 500 });
  }
}
