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

export async function POST(req: Request) {
    try {
        if (!supabase) {
            return new NextResponse(null, { status: 204 });
        }

        const body = await req.json();
        
        // Basic validation
        if (!body || typeof body.event_type !== 'string') {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const {
            event_type,
            user_id,
            session_id,
            lead_id,
            lead_source,
            utm_source,
            utm_medium,
            utm_campaign,
            payload,
            occurred_at
        } = body;

        // Ensure we don't insert garbage
        const { error } = await supabase.from("routing_events").insert({
            event_type,
            user_id: user_id || null,
            session_id: session_id || null,
            lead_id: lead_id || null,
            lead_source: lead_source || null,
            utm_source: utm_source || null,
            utm_medium: utm_medium || null,
            utm_campaign: utm_campaign || null,
            payload: payload || {},
            occurred_at: occurred_at || new Date().toISOString()
        });

        if (error) {
            console.error("[Analytics Ingestion] Splunk DB Insert Error:", error);
            return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
        }

        return NextResponse.json({ status: "success" });
    } catch (e) {
        console.error("[Analytics Ingestion] Server Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
