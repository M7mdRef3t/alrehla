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
        eventData.occurred_at = new Date().toISOString();

        // 🛡️ [Hardening] Database ingestion should not 500 the whole request if possible.
        // We attempt to insert, but catch errors to avoid UX blocking.
        const { error: insertError } = await supabase.from("routing_events").insert(eventData);

        if (insertError) {
            if (insertError.code === "23505") {
                // Duplicate IGNORED
                return NextResponse.json({ status: "success", duplicate: true });
            }
            
            // Handle missing columns or table errors gracefully
            if (insertError.code === "42703" || insertError.code === "42P01") {
                console.warn(`[Analytics Ingestion] Schema/Table Issue [${insertError.code}]:`, insertError.message);
                // Return success anyway to unblock client, but log it
                return NextResponse.json({ 
                    status: "partial_success", 
                    warning: "Database schema mismatch. Event logged to console only." 
                });
            }

            console.error(`[Analytics Ingestion] Database Error [${insertError.code}]:`, insertError.message);
            // Still don't 500 unless it's a critical logic failure. 
            // Better to lose one event than to freeze the user's UI.
            return NextResponse.json({ status: "accepted_with_db_error" }, { status: 202 });
        }

        if (process.env.NODE_ENV === "development") {
            console.log(`[Analytics Ingestion] Received: ${data.event_type} | CID: ${data.client_event_id}`);
        }

        // --- CAPI Bridge (Server-Side Side Effect) ---
        // This is where we bridge analytics to Meta CAPI without waiting for the response
        try {
            const { sendMetaCapiEvent } = await import("@/server/metaCapi");
            
            const event_id = data.client_event_id || data.lead_id || `${data.event_type}_${Date.now()}`;
            
            // Map internal events to Meta Standard Events
            const capiMapping: Record<string, "Lead" | "ViewContent" | "Contact" | "CompleteRegistration" | "GateQualified" | "Purchase"> = {
                "lead_form_submitted": "Lead",
                "weather_share_completed": "Contact",
                "payment_proof_submitted": "Purchase",
                "gate_qualified": "GateQualified",
                "onboarding_completed": "CompleteRegistration",
            };

            const mappedEvent = capiMapping[data.event_type];
            
            if (mappedEvent) {
                // Extract browser context for CAPI
                const cookies = req.headers.get("cookie") || "";
                const fbp = cookies.split("; ").find(row => row.startsWith("_fbp="))?.split("=")[1];
                const fbc = cookies.split("; ").find(row => row.startsWith("_fbc="))?.split("=")[1];
                const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip");
                const userAgent = req.headers.get("user-agent");

                // Note: We must await this in serverless environments (e.g. Vercel) 
                // to prevent the promise from being aborted before CAPI delivery.
                await sendMetaCapiEvent({
                    eventName: mappedEvent,
                    eventId: event_id,
                    sourceUrl: req.headers.get("referer") || "https://alrehla.com",
                    userData: {
                        email: (mergedPayload as any).email || null,
                        phone: (mergedPayload as any).phone || null,
                        fbc,
                        fbp,
                        clientIpAddress: ip,
                        clientUserAgent: userAgent
                    }
                }).catch(err => console.error("[Analytics CAPI Bridge] Error:", err));
            }
        } catch (capiErr) {
            console.error("[Analytics CAPI Bridge] Failed to trigger CAPI:", capiErr);
        }

        const response = NextResponse.json({ status: "success" });
        response.headers.set("X-Analytics-Version", "v3-bridge-capi-v1");
        return response;
    } catch (e: any) {
        console.error("[Analytics Ingestion] Server Error:", e);
        return NextResponse.json({ error: "Internal Server Error", details: e?.message || String(e) }, { status: 500 });
    }
}


