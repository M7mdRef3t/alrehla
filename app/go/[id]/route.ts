import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../api/_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.alrehla.app").replace(/\/$/, "");
  
  const supabase = getSupabaseAdminClient();
  let targetPath = "/onboarding";
  const queryParams = new URLSearchParams({
    ref: id,
    utm_source: "email",
    utm_medium: "shortlink",
    utm_campaign: "direct_access"
  });

  if (supabase) {
    try {
      // Lookup lead by ID (marketing_leads.id is UUID pk)
      const { data: lead } = await supabase
        .from("marketing_leads")
        .select("name, email, status")
        .eq("id", id)
        .maybeSingle();

      if (lead) {
        if (lead.name) queryParams.set("name", lead.name);
        if (lead.email) queryParams.set("email", lead.email);

        // Smart Routing Logic: Prioritize showing the map (The Sanctuary / המלאד האמן)
        const status = (lead.status || "new") as string;
        if (
          status === "activated" || 
          status === "converted" ||
          status === "payment_requested" || 
          status === "proof_received" || 
          status === "hot_activation_interrupted"
        ) {
          targetPath = "/";
          queryParams.set("boot_action", "start_recovery");
        }
      }
    } catch (err) {
      console.error("[go-smart-redirect] Supabase lookup failed:", err);
    }
  }
  
  const targetUrl = `${appUrl}${targetPath}?${queryParams.toString()}`;
  
  // Perform a 307 temporary redirect
  return NextResponse.redirect(targetUrl, 307);
}
