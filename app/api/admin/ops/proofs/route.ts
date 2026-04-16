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

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = buildAdminClient();

  // Fetch tickets that are pending and belong to payment_activation
  const { data: tickets, error } = await db
    .from("support_tickets")
    .select("*")
    .eq("category", "payment_activation")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate signed URLs for images if they exist in storage
  const processedTickets = await Promise.all(
    (tickets || []).map(async (ticket: any) => {
      const metadata = ticket.metadata || {};
      const proofImage = metadata.proof_image;

      if (proofImage?.storage_bucket && proofImage?.storage_path) {
        const { data: signedData } = await db.storage
          .from(proofImage.storage_bucket)
          .createSignedUrl(proofImage.storage_path, 3600); // 1 hour

        return {
          ...ticket,
          metadata: {
            ...metadata,
            proof_image: {
              ...proofImage,
              signed_url: signedData?.signedUrl || null,
            },
          },
        };
      }
      return ticket;
    })
  );

  return NextResponse.json(processedTickets);
}
