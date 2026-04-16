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

    // Atomic increment using a PostgreSQL function (RPC)
    const { data: newCount, error: rpcError } = await supabaseAdmin.rpc(
      "increment_lantern_resonance",
      { lantern_id }
    );

    if (rpcError) {
      console.error("Lantern resonance RPC error:", rpcError);
      return NextResponse.json({ error: "Failed to update lantern resonance" }, { status: 500 });
    }

    if (newCount === null || newCount === undefined) {
      return NextResponse.json({ error: "Lantern not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, new_count: newCount });
  } catch (err) {
    console.error("Lantern resonance error:", err);
    return NextResponse.json({ error: "Failed to light lantern" }, { status: 500 });
  }
}
