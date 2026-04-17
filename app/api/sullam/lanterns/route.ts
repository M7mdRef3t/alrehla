import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/serverClient";
import { requireAuth } from "@/server/requireAuth";

// GET: Fetch a random lantern for a specific growth area
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const area = searchParams.get("area");

  if (!area) {
    return NextResponse.json({ error: "Missing area parameter" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  
  // Fetch up to 10 resonance-rich lanterns for this area to pick a random one
  // In a massive scale app, we would use a true random function, but this is fine for MVP
  const { data, error } = await supabase
    .from("sullam_lanterns")
    .select("id, growth_area, content_type, content_payload, resonance_count, created_at")
    .eq("growth_area", area)
    .order("resonance_count", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch lanterns" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ lantern: null });
  }

  // Pick a random lantern from the top ones
  const randomLantern = data[Math.floor(Math.random() * data.length)];

  return NextResponse.json({ lantern: randomLantern });
}

// POST: Add a new lantern
export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user; // Unauthorized

  try {
    const body = await req.json();
    const { growth_area, content_type, content_payload } = body;

    if (!growth_area || !content_payload) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("sullam_lanterns")
      .insert([
        {
          traveler_id: user.id || user.user_id, // Dependent on profile structure handling
          growth_area,
          content_type: content_type || "text",
          content_payload,
        },
      ])
      .select("id, growth_area, content_type, content_payload, resonance_count, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, lantern: data });
  } catch (err) {
    console.error("Lantern post error:", err);
    return NextResponse.json({ error: "Failed to post lantern" }, { status: 500 });
  }
}
