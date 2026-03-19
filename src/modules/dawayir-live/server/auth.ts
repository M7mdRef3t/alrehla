import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../../../../app/api/_lib/supabaseAdmin";

export interface LiveAuthContext {
  client: SupabaseClient;
  userId: string;
  role: string;
}

export function getLiveFeatureFlag(name: string): boolean {
  const raw =
    process.env[name] ??
    process.env[`NEXT_PUBLIC_${name}`] ??
    process.env[`VITE_${name}`];
  if (!raw) return true;
  return raw === "1" || raw === "true" || raw === "on";
}

export function getLiveModel(): string {
  return (
    process.env.NEXT_PUBLIC_DAWAYIR_LIVE_MODEL ||
    process.env.DAWAYIR_LIVE_MODEL ||
    "gemini-2.5-flash-native-audio-latest"
  );
}

export function getLiveVoice(): string {
  return process.env.NEXT_PUBLIC_DAWAYIR_LIVE_VOICE || process.env.DAWAYIR_LIVE_VOICE || "Aoede";
}

export function getLiveApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_DAWAYIR_LIVE_API_KEY ||
    process.env.DAWAYIR_LIVE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

export async function getOptionalLiveAuthContext(req: NextRequest): Promise<LiveAuthContext | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.id) return null;

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    client,
    userId: data.user.id,
    role: typeof profile?.role === "string" ? profile.role : "user",
  };
}

export async function requireLiveAuth(req: NextRequest): Promise<LiveAuthContext | NextResponse> {
  const client = getSupabaseAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    client,
    userId: data.user.id,
    role: typeof profile?.role === "string" ? profile.role : "user",
  };
}

export function isAdminLikeRole(role: string): boolean {
  return ["owner", "superadmin", "admin", "developer"].includes(role.toLowerCase());
}
