import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    analyticsEnvelopeSchema,
    resolveAnalyticsPayloadSchema
} from "@/domains/analytics/contracts";

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

export async function POST(req: Request) {
    try {
        if (!supabase) {
            console.error("[Analytics Ingestion] Missing Supabase configuration.");
            return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
        }

        const contentLength = req.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > 50000) {
            return NextResponse.json({ error: "Payload too large" }, { status: 413 });
        }

        const json = await req.json();
        
        // Data sanitization: Convert empty strings to null before validation
        const sanitizedJson = { ...json };
        ["lead_id", "client_event_id", "anonymous_id", "session_id"].forEach(key => {
            if (sanitizedJson[key] === "") sanitizedJson[key] = null;
        });

        const parsedData = analyticsEnvelopeSchema.safeParse(sanitizedJson);
        if (!parsedData.success) {
            // Log the validation error for debugging but don't 500
            console.warn("[Analytics Ingestion] Validation Failed:", parsedData.error.format());
            return NextResponse.json({ 
                error: "Invalid payload schema", 
                details: parsedData.error.errors 
            }, { status: 400 });
        }

        const data = parsedData.data;
        const payloadSchema = resolveAnalyticsPayloadSchema(data.event_type);
        const parsedPayload = payloadSchema.safeParse(data.payload ?? {});
        if (!parsedPayload.success) {
            console.warn("[Analytics Ingestion] Payload Family Validation Failed:", {
                event_type: data.event_type,
                issues: parsedPayload.error.errors
            });
            return NextResponse.json({
                error: "Invalid payload for event family",
                details: parsedPayload.error.errors
            }, { status: 400 });
        }

        // Security: Identity Boundary Check
        let verifiedUserId: string | null = null;
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (!authError && user) {
                verifiedUserId = user.id;
            }
        }

        const mergedPayload = {
            ...parsedPayload.data
        };

        const eventData: any = {
            event_type: data.event_type,
            client_event_id: data.client_event_id || null,
            anonymous_id: data.anonymous_id || null,
            session_id: data.session_id || null,
            user_id: verifiedUserId,
            lead_id: data.lead_id || null,
            lead_source: data.lead_source || null,
            utm_source: data.utm_source || null,
            utm_medium: data.utm_medium || null,
            utm_campaign: data.utm_campaign || null,
            payload: mergedPayload,
        };

        // Standard column is occurred_at, but we fallback to created_at if insertion fails
        // or just let the DB handle the default if we omit it. 
        // Based on migrations, it is occurred_at.
        eventData.occurred_at = new Date().toISOString();

        const { error } = await supabase.from("routing_events").insert(eventData);

        if (error) {
            if (error.code === "23505") {
                return NextResponse.json({ status: "success", duplicate: true });
            }
            
            // If occurred_at is missing, try a desperate fallback to created_at or omitting it
            if (error.code === "42703" && error.message.includes("occurred_at")) {
                console.warn("[Analytics Ingestion] occurred_at missing, retrying with created_at fallback");
                delete eventData.occurred_at;
                eventData.created_at = new Date().toISOString();
                const { error: retryError } = await supabase.from("routing_events").insert(eventData);
                if (!retryError) return NextResponse.json({ status: "success", fallback: true });
            }

            console.error(`[Analytics Ingestion] Database Error [${error.code}]:`, error.message);
            return NextResponse.json({ 
                error: "Ingestion failed", 
                code: error.code,
                message: process.env.NODE_ENV === "development" ? error.message : undefined
            }, { status: 500 });
        }

        const response = NextResponse.json({ status: "success" });
        response.headers.set("X-Analytics-Version", "v3-clean-hardened-v2");
        return response;
    } catch (e) {
        console.error("[Analytics Ingestion] Server Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

