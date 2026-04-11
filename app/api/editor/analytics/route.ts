import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get("blockId");

    if (!blockId) return NextResponse.json({ error: "Missing blockId" }, { status: 400 });

    try {
        // We use contains to match the payload JSON
        const { count: viewCount, error: viewError } = await supabase
            .from("routing_events")
            .select("id", { count: "exact", head: true })
            .eq("event_type", "block_view")
            .contains("payload", { block_id: blockId });

        const { count: clickCount, error: clickError } = await supabase
            .from("routing_events")
            .select("id", { count: "exact", head: true })
            .eq("event_type", "block_click")
            .contains("payload", { block_id: blockId });

        if (viewError) throw viewError;
        if (clickError) throw clickError;

        const views = viewCount || 0;
        const clicks = clickCount || 0;
        const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0";

        return NextResponse.json({ views, clicks, ctr: Number(ctr) }, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
            }
        });
    } catch (e) {
        console.error("[Editor Analytics Error]:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
