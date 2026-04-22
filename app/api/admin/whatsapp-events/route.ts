import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAppRouterAdmin } from "../../../../server/admin/_shared";

export const dynamic = "force-dynamic";

function buildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
}

async function checkAuth(req: Request): Promise<boolean> {
  return await verifyAppRouterAdmin(req);
}

export async function GET(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = buildClient();

  try {
    const { data: events, error } = await supabase
      .from('whatsapp_message_events')
      .select(`
        id,
        created_at,
        from_phone,
        to_phone,
        message_body,
        direction,
        intent_detected,
        processed_at,
        raw_payload,
        lead_id,
        marketing_leads(name, status, campaign, source, ad)
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[WhatsAppEventsAPI] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (err) {
    console.error('[WhatsAppEventsAPI] Fatal:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
