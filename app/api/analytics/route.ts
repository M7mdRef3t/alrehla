import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

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

// Strict Schema Validation
// We avoid a hardcoded enum whitelist here because the grep query showed dozens of dynamic event names
// in use across the frontend. Instead, we strictly bound the strings.
const analyticsSchema = z.object({
    event_type: z.string().min(1).max(128),
    client_event_id: z.string().max(128).optional().nullable(),
    anonymous_id: z.string().max(256).optional().nullable(),
    session_id: z.string().max(256).optional().nullable(),
    payload: z.record(z.any()).optional().default({}),
    lead_id: z.string().optional().nullable(),
    lead_source: z.string().optional().nullable(),
    utm_source: z.string().optional().nullable(),
    utm_medium: z.string().optional().nullable(),
    utm_campaign: z.string().optional().nullable()
}).strict();

export async function POST(req: Request) {
    try {
        // 4. Missing Config Mitigation: Return 503 instead of 204 silent failure
        if (!supabase) {
            console.error("[Analytics Ingestion] Missing Supabase configuration (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).");
            return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
        }

        // 1. Basic Payload Mitigation (Prevent huge JSON blobs)
        const contentLength = req.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > 50000) {
            return NextResponse.json({ error: "Payload too large" }, { status: 413 });
        }

        const json = await req.json();
        
        // 2. Strict Zod Validation
        const parsedData = analyticsSchema.safeParse(json);
        if (!parsedData.success) {
            return NextResponse.json({ 
                error: "Invalid payload schema", 
                details: parsedData.error.errors 
            }, { status: 400 });
        }

        const data = parsedData.data;

        // 3. Security: Identity Boundary Check (Only use server-verified token, ignore data.user_id)
        let verifiedUserId: string | null = null;
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (!authError && user) {
                verifiedUserId = user.id;
            }
        }

        const finalUserId = verifiedUserId || null;

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
            // 5. Separate anonymous_id and session_id
            anonymous_id: data.anonymous_id || null,
            session_id: data.session_id || null,
            user_id: finalUserId,
            payload: mergedPayload,
            // 3. Server-side timestamps only (No client spoofing)
            occurred_at: new Date().toISOString()
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
        response.headers.set("X-Analytics-Version", "v3-clean-strict");
        return response;
    } catch (e) {
        console.error("[Analytics Ingestion] Server Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

