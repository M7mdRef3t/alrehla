import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/server/requireAuth";

// We use the service_role key to bypass RLS when incrementing resonance
// to prevent letting regular users overwrite the resonance_count field arbitrarily.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Ensure only authenticated travelers can light a lantern
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user; // Unauthorized

  try {
    const { lantern_id } = await req.json();

    if (!lantern_id) {
      return NextResponse.json({ error: "Missing lantern_id parameter" }, { status: 400 });
    }

    // Since we don't have an RPC for atomic increment right now, we will do a read/write.
    // For production scaling, convert this to an RPC function: `increment_lantern_resonance`
    const { data: currentLantern, error: fetchErr } = await supabaseAdmin
      .from("sullam_lanterns")
      .select("resonance_count")
      .eq("id", lantern_id)
      .single();

    if (fetchErr || !currentLantern) {
      return NextResponse.json({ error: "Lantern not found" }, { status: 404 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("sullam_lanterns")
      .update({ resonance_count: currentLantern.resonance_count + 1 })
      .eq("id", lantern_id);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, new_count: currentLantern.resonance_count + 1 });
  } catch (err) {
    console.error("Lantern resonance error:", err);
    return NextResponse.json({ error: "Failed to light lantern" }, { status: 500 });
  }
}
