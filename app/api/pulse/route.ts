import { NextResponse } from "next/server";
import { supabase } from "../../../src/services/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PulseRow = {
  id: string;
  energy: number | null;
  mood: number | string | null;
  focus: string | null;
  created_at: string | null;
  energy_reasons?: string[] | null;
  energy_confidence?: string | null;
};

function getDayRange(day: string) {
  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function normalizePulseRow(row: PulseRow) {
  const createdAt = typeof row.created_at === "string" && row.created_at ? row.created_at : new Date().toISOString();
  const reasons = Array.isArray(row.energy_reasons) ? row.energy_reasons.filter((value) => typeof value === "string" && value.trim()) : [];
  const primaryReason = reasons[0] ?? "";

  return {
    id: row.id,
    day: createdAt.slice(0, 10),
    mood: typeof row.mood === "number" ? row.mood : Number(row.mood ?? 0) || 0,
    energy: typeof row.energy === "number" ? row.energy : Number(row.energy ?? 0) || 0,
    stress_tag: primaryReason,
    note: "",
    focus: row.focus ?? "general"
  };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError
  } = await supabase!.auth.getUser(token);

  if (authError || !user) {
    return { user: null, errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, errorResponse: null as NextResponse | null };
}

export async function POST(req: Request) {
  try {
    const { user, errorResponse } = await getAuthedUser(req);
    if (!user) return errorResponse!;

    const body = await req.json();
    const { mood, energy, stress_tag, note, focus, day } = body;
    const pulseDay = day || new Date().toISOString().split("T")[0];
    const { start, end } = getDayRange(pulseDay);
    const energyReasons = [stress_tag, note]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    const basePayload = {
      user_id: user.id,
      mood,
      energy,
      focus: typeof focus === "string" && focus.trim() ? focus.trim() : "general",
      auto: false,
      created_at: start
    };

    const extendedPayload = {
      ...basePayload,
      energy_reasons: energyReasons.length > 0 ? energyReasons : null,
      energy_confidence: null as string | null
    };

    const { data: existingRow, error: existingError } = await supabase!
      .from("daily_pulse_logs")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Pulse existing-row lookup error:", existingError);
      return NextResponse.json({ error: "Failed to save pulse" }, { status: 500 });
    }

    const mutation = existingRow
      ? supabase!
          .from("daily_pulse_logs")
          .update(extendedPayload)
          .eq("id", existingRow.id)
      : supabase!
          .from("daily_pulse_logs")
          .insert(extendedPayload);

    let { data, error }: { data: PulseRow | null; error: unknown } = await mutation
      .select("id, energy, mood, focus, created_at, energy_reasons, energy_confidence")
      .single();

    if (error) {
      const message = getErrorMessage(error);
      if (/column|energy_reasons|energy_confidence|schema cache|does not exist/i.test(message)) {
        const fallbackMutation = existingRow
          ? supabase!
              .from("daily_pulse_logs")
              .update(basePayload)
              .eq("id", existingRow.id)
          : supabase!
              .from("daily_pulse_logs")
              .insert(basePayload);

        const fallbackResult = await fallbackMutation.select("id, energy, mood, focus, created_at").single();
        data = fallbackResult.data as PulseRow | null;
        error = fallbackResult.error;
      }
    }

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

    return NextResponse.json({ success: true, data: normalizePulseRow(data as PulseRow) });
  } catch (err: unknown) {
    console.error("Pulse API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { user, errorResponse } = await getAuthedUser(req);
    if (!user) return errorResponse!;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "7", 10);

    let { data, error }: { data: PulseRow[] | null; error: unknown } = await supabase!
      .from("daily_pulse_logs")
      .select("id, energy, mood, focus, created_at, energy_reasons, energy_confidence")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      const message = getErrorMessage(error);
      if (/column|energy_reasons|energy_confidence|schema cache|does not exist/i.test(message)) {
        const fallbackResult = await supabase!
          .from("daily_pulse_logs")
          .select("id, energy, mood, focus, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit);
        data = fallbackResult.data as PulseRow[] | null;
        error = fallbackResult.error;
      }
    }

    if (error) {
      console.error("Pulse fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    return NextResponse.json(((data as PulseRow[] | null) ?? []).map(normalizePulseRow));
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
