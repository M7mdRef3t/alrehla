import { NextResponse } from "next/server";
import { supabase } from "../../../src/services/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError
    } = await supabase!.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mood, energy, stress_tag, note, focus, day } = body;
    const pulseDay = day || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase!
      .from("daily_pulse_logs")
      .upsert(
        {
          user_id: user.id,
          day: pulseDay,
          mood,
          energy,
          stress_tag,
          note,
          focus: focus || "general",
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "user_id, day"
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Pulse upsert error:", error);
      return NextResponse.json({ error: "Failed to save pulse" }, { status: 500 });
    }

    const { processActionImpacts } = await import("../../../src/services/impactEngine");
    await processActionImpacts(user.id, mood, energy);

    const { processShadowSignals } = await import("../../../src/services/shadowEngine");
    await processShadowSignals(user.id);

    const { processMilestones } = await import("../../../src/services/milestoneEngine");
    await processMilestones(user.id);

    const { processContextualInsights } = await import("../../../src/services/contextEngine");
    await processContextualInsights(user.id);

    const { processStabilitySnapshot } = await import("../../../src/services/stabilityEngine");
    await processStabilitySnapshot(user.id, 30);

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    console.error("Pulse API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user }
    } = await supabase!.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "7", 10);

    const { data, error } = await supabase!
      .from("daily_pulse_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("day", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Pulse fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
