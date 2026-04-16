import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/server/requireAdmin";

export const dynamic = "force-dynamic";

function buildAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } }
  );
}

export type OpsCounts = {
  pending_proofs: number;
  open_tickets: number;
  unanalyzed_leads: number;
};

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = buildAdminClient();

  const [proofRes, ticketRes, leadRes] = await Promise.all([
    db
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .neq("status", "resolved"),
    db
      .from("marketing_leads")
      .select("id", { count: "exact", head: true })
      .is("last_ai_analysis_at", null),
  ]);

  const counts: OpsCounts = {
    pending_proofs: proofRes.count ?? 0,
    open_tickets: ticketRes.count ?? 0,
    unanalyzed_leads: leadRes.count ?? 0,
  };

  return NextResponse.json(counts);
}
