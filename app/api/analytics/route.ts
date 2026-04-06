import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Uses a service role key to bypass row level security for ingestion purposes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey, {
              auth: {
                  autoRefreshToken: false,
                  persistSession: false,
              },
          })
        : null;

export const dynamic = "force-dynamic";

function validateAnalyticsPayload(data: any) {
    if (!data || typeof data.event_type !== 'string' || data.event_type.length === 0) {
        return "Invalid event_type";
    }
    if (data.event_type.length > 128) return "event_type too long";
    return null;
}

export async function POST(req: Request) {
    try {
        if (!supabase) {
            return new NextResponse(null, { status: 204 });
        }

        // 1. Basic Payload Mitigation (Prevent huge JSON blobs)
        const contentLength = req.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > 50000) {
            return NextResponse.json({ error: "Payload too large" }, { status: 413 });
        }

        const json = await req.json();
        
        // 2. Manual Validation
        const validationError = validateAnalyticsPayload(json);
        if (validationError) {
            return NextResponse.json({ 
                error: "Invalid payload", 
                details: validationError 
            }, { status: 400 });
        }

        const data = json;

        // 3. Security: Identity Boundary Check
        let verifiedUserId: string | null = null;
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (!authError && user) {
                verifiedUserId = user.id;
            }
        }

        const finalUserId = verifiedUserId || data.user_id || null;

        // 4. Ingestion Idempotency
        const mergedPayload = {
            ...(data.payload || {}),
            lead_id: data.lead_id || null,
            lead_source: data.lead_source || null,
            utm_source: data.utm_source || null,
            utm_medium: data.utm_medium || null,
            utm_campaign: data.utm_campaign || null,
        };

        const { error } = await supabase.from("routing_events").insert({
            event_type: data.event_type,
            client_event_id: data.client_event_id || null,
            anonymous_id: data.anonymous_id || data.session_id || null,
            session_id: data.session_id || null,
            user_id: finalUserId,
            payload: mergedPayload,
            occurred_at: data.occurred_at || new Date().toISOString()
        });

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ status: "success", duplicate: true });
            }
            
            if (process.env.NODE_ENV === "development") {
                console.error("[Analytics Ingestion] Database Error:", error);
            }
            
            return NextResponse.json({ error: "Ingestion failed", code: error.code }, { status: 500 });
        }

        const response = NextResponse.json({ status: "success" });
        response.headers.set("X-Analytics-Version", "v2-hardened");
        return response;
    } catch (e) {
        console.error("[Analytics Ingestion] Server Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

