import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const TABLE = "user_state";

function getDeviceToken(req: NextRequest): string | null {
  const token = req.headers.get("x-device-token") || req.headers.get("X-Device-Token");
  if (!token) return null;
  const trimmed = token.trim();
  return trimmed.length >= 20 ? trimmed : null;
}

function filterData(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!key.startsWith("dawayir-")) continue;
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

export async function GET(req: NextRequest) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const deviceToken = getDeviceToken(req);
  const ownerId = await getAuthUserId(req);
  if (!deviceToken && !ownerId) {
    return NextResponse.json({ error: "Missing identity" }, { status: 401 });
  }

  if (ownerId) {
    const { data: byOwner, error } = await admin
      .from(TABLE)
      .select("data, device_token")
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Failed to fetch user state" }, { status: 500 });

    if (byOwner?.data) return NextResponse.json({ data: byOwner.data }, { status: 200 });

    if (deviceToken) {
      const { data: byDevice } = await admin
        .from(TABLE)
        .select("data")
        .eq("device_token", deviceToken)
        .maybeSingle();
      if (byDevice?.data) {
        await admin
          .from(TABLE)
          .update({ owner_id: ownerId, updated_at: new Date().toISOString() })
          .eq("device_token", deviceToken);
        return NextResponse.json({ data: byDevice.data }, { status: 200 });
      }
    }

    return NextResponse.json({ data: {} }, { status: 200 });
  }

  const { data, error } = await admin.from(TABLE).select("data").eq("device_token", deviceToken).maybeSingle();
  if (error) return NextResponse.json({ error: "Failed to fetch user state" }, { status: 500 });
  return NextResponse.json({ data: data?.data ?? {} }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const deviceToken = getDeviceToken(req);
  const ownerId = await getAuthUserId(req);
  if (!deviceToken && !ownerId) {
    return NextResponse.json({ error: "Missing identity" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const source = body?.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : body;
  const updates = filterData(source ?? {});
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  const finalDeviceToken = deviceToken ?? (ownerId ? `user_${ownerId}` : null);
  const { data: existing, error: existingError } = await admin
    .from(TABLE)
    .select("data, device_token, id")
    .or(ownerId ? `owner_id.eq.${ownerId},device_token.eq.${finalDeviceToken}` : `device_token.eq.${finalDeviceToken}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("[user-state] Failed to read existing data:", existingError.message);
    return NextResponse.json({ error: "Failed to read existing data" }, { status: 500 });
  }

  const merged = {
    ...(existing?.data ?? {}),
    ...updates
  };

  // Build the upsert payload — only include owner_id when we actually have one
  // to avoid violating the unique index on owner_id.
  const payload: Record<string, unknown> = {
    device_token: finalDeviceToken,
    data: merged,
    updated_at: new Date().toISOString()
  };
  if (ownerId) {
    payload.owner_id = ownerId;
  }

  const { error } = await admin.from(TABLE).upsert(payload, { 
    onConflict: ownerId ? "owner_id" : "device_token" 
  });

  if (error) {
    console.error("[user-state] Upsert failed:", error.message, error.code);
    
    // Fallback: If upsert failed (e.g. unique constraint on device_token while targeting owner_id),
    // we perform a targeted update on the primary record we identified.
    const targetId = existing?.id;
    if (targetId) {
      const { error: fallbackError } = await admin
        .from(TABLE)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", targetId);
        
      if (fallbackError) {
        return NextResponse.json({ error: "Failed to save user state" }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "No matching record for fallback" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
