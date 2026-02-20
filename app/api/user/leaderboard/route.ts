import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Mirrors points logic from src/state/achievementState.ts as closely as possible
const JOURNEY_POINTS: Record<string, number> = {
  path_started: 5,
  task_started: 2,
  task_completed: 8,
  path_regenerated: 4,
  node_added: 10,
  mood_logged: 3,
  flow_event: 1
};

const FLOW_POINTS: Record<string, number> = {
  landing_viewed: 1,
  landing_clicked_start: 3,
  auth_login_success: 6,
  install_clicked: 8,
  profile_clicked: 1,
  pulse_opened: 2,
  pulse_notes_used: 3,
  pulse_completed: 4,
  pulse_completed_with_choices: 6,
  pulse_completed_without_choices: 2,
  add_person_opened: 3,
  add_person_done_show_on_map: 7,
  feedback_submitted: 5,
  tools_opened: 2
};

type LeaderboardRow = {
  displayName: string;
  score: number;
  rankLabel: string;
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

function getScoreRank(score: number): string {
  if (score >= 1800) return "قائد أعلى";
  if (score >= 1200) return "قائد";
  if (score >= 700) return "قائد فريق";
  if (score >= 300) return "طليعة";
  return "كشاف";
}

function maskEmail(email: string): string {
  const [name] = email.split("@");
  if (!name) return "مستخدم";
  if (name.length <= 3) return `${name[0] ?? "م"}**`;
  return `${name.slice(0, 2)}***${name.slice(-1)}`;
}

function shortSessionLabel(sessionId: string): string {
  return `لاعب ${sessionId.slice(-4).toUpperCase()}`;
}

export async function GET(req: Request) {
  const client = getServiceClient();
  if (!client) {
    return NextResponse.json(
      { leaderboard: [], source: "not_configured" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const now = Date.now();
  const requestUrl = new URL(req.url);
  const requestedWindow = requestUrl.searchParams.get("window");
  const windowDays = requestedWindow === "7d" ? 7 : 30;
  const sinceIso = new Date(now - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: events, error } = await client
    .from("journey_events")
    .select("session_id,type,payload,created_at")
    .not("session_id", "is", null)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(12000);

  if (error || !events) {
    return NextResponse.json(
      { leaderboard: [], source: "query_failed" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }

  const scoreBySession = new Map<string, number>();
  for (const row of events as Array<Record<string, unknown>>) {
    const sid = String(row.session_id ?? "").trim();
    if (!sid) continue;
    const type = String(row.type ?? "");
    const payload = (row.payload as Record<string, unknown> | null) ?? null;
    const flowStep = type === "flow_event" && typeof payload?.step === "string" ? payload.step : null;
    const increment = type === "flow_event"
      ? (FLOW_POINTS[flowStep ?? ""] ?? JOURNEY_POINTS.flow_event)
      : (JOURNEY_POINTS[type] ?? 1);
    scoreBySession.set(sid, (scoreBySession.get(sid) ?? 0) + increment);
  }

  const sessionIds = Array.from(scoreBySession.keys()).slice(0, 300);
  const profilesBySession = new Map<string, { email: string | null; fullName: string | null }>();

  if (sessionIds.length > 0) {
    const { data: profiles } = await client
      .from("profiles")
      .select("id,user_id,email,full_name")
      .in("id", sessionIds);

    for (const profile of (profiles ?? []) as Array<Record<string, unknown>>) {
      profilesBySession.set(String(profile.id), {
        email: typeof profile.email === "string" ? profile.email : null,
        fullName: typeof profile.full_name === "string" ? profile.full_name : null
      });
    }
  }

  const leaderboard: LeaderboardRow[] = Array.from(scoreBySession.entries())
    .map(([sessionId, score]) => {
      const profile = profilesBySession.get(sessionId);
      const displayName =
        (profile?.fullName?.trim() || "") ||
        (profile?.email ? maskEmail(profile.email) : "") ||
        shortSessionLabel(sessionId);

      return {
        displayName,
        score,
        rankLabel: getScoreRank(score)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return NextResponse.json(
    { leaderboard, source: "supabase", window: `${windowDays}d`, scoring: "achievement_points_model" },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
