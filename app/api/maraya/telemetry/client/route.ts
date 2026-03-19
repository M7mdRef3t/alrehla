import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
import { getOrCreateMarayaProfile } from "@/lib/maraya/profiles";

export const dynamic = "force-dynamic";

async function parsePayload(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }

  const raw = await req.text().catch(() => "");
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { raw };
  }
}

export async function POST(req: NextRequest) {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ ok: false, error: "Supabase admin client is not configured." }, { status: 500 });
  }

  try {
    const payload = await parsePayload(req);
    const anonId = typeof payload.anonId === "string" ? payload.anonId : "";
    const sessionId = typeof payload.sessionId === "string" ? payload.sessionId : null;
    const eventName = typeof payload.eventName === "string" ? payload.eventName : "client_event";

    let profileId: string | null = null;
    if (anonId) {
      const profile = await getOrCreateMarayaProfile(
        client,
        anonId,
        typeof payload.displayName === "string" ? payload.displayName : null,
      );
      profileId = profile.id;
    }

    const insert = await client.from("maraya_telemetry").insert({
      session_id: sessionId,
      profile_id: profileId,
      event_name: eventName,
      payload,
    });

    if (insert.error) {
      throw new Error(insert.error.message);
    }

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
