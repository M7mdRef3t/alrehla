import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function GET() {
  const client = getServiceClient();
  if (!client) {
    return NextResponse.json({ broadcasts: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await client
    .from("admin_broadcasts")
    .select("id,title,body,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return NextResponse.json({ broadcasts: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { broadcasts: data },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
