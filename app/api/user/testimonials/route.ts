import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Testimonial = {
  quote: string;
  author: string;
};

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

function toAuthor(sessionId: string): string {
  const tail = sessionId.slice(-4).toUpperCase();
  return `قائد ${tail}`;
}

function sanitizeMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 220);
}

export async function GET() {
  const client = getServiceClient();
  if (!client) {
    return NextResponse.json(
      { testimonials: [], source: "not_configured", is_live: false },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const now = Date.now();
  const since30dIso = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("journey_events")
    .select("session_id,payload,created_at")
    .eq("type", "flow_event")
    .gte("created_at", since30dIso)
    .order("created_at", { ascending: false })
    .limit(4000);

  if (error || !data) {
    return NextResponse.json(
      { testimonials: [], source: "query_failed", is_live: false },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rows = (data as Array<Record<string, unknown>>)
    .map((row) => {
      const payload = (row.payload as Record<string, unknown> | null) ?? null;
      if (String(payload?.step ?? "") !== "feedback_submitted") return null;
      const extra = (payload?.extra as Record<string, unknown> | undefined) ?? {};
      const message = sanitizeMessage(String(extra.message ?? ""));
      const rating = typeof extra.rating === "number" ? extra.rating : null;
      // جودة: حد أدنى طول كافي عشان تبقى شهادة مفهومة
      if (!message || message.length < 18) return null;
      const sessionId = String(row.session_id ?? "anon");
      const createdAt = row.created_at ? new Date(String(row.created_at)).getTime() : 0;
      return { message, rating, sessionId, createdAt };
    })
    .filter((row): row is { message: string; rating: number | null; sessionId: string; createdAt: number } => Boolean(row));

  // إزالة التكرار: نص موحد بدون تشكيل/رموز ومسافات
  const seen = new Set<string>();
  const deduped = rows.filter((row) => {
    const key = row.message
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const rowsTop = deduped
    .sort((a, b) => {
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.createdAt - a.createdAt;
    })
    .slice(0, 6);

  const testimonials: Testimonial[] = rowsTop.map((row) => ({
    quote: row.message,
    author: toAuthor(row.sessionId)
  }));

  return NextResponse.json(
    { testimonials, source: "supabase", is_live: true },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
