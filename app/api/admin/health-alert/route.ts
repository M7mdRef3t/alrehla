import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runtimeEnv } from "@/config/runtimeEnv";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the user's role from the 'profiles' table to verify admin privileges.
    // In our project, 'super_admin' or 'enterprise_admin' roles might have administrative access.
    // We'll accept any user for now as long as they are authenticated to prevent unauthenticated spam,
    // since critical health checks can happen for any user session.
    // However, to be stricter, we can check if they are an admin.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // Health alerts are system-level, they are triggered by the client-side health checker
    // which runs for all users. If we strictly limit to 'super_admin', normal users experiencing
    // critical issues won't be able to report them.
    // Thus, being authenticated is a good enough barrier against anonymous spam.

    const body = await req.json();
    const { message, severity, affectedFeatures } = body;

    if (!message || !severity || !affectedFeatures) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { telegramBot } = await import("@/services/telegramBot");

    await telegramBot.alertCriticalError({
      message: `[User: ${user.id}]\n${message}`,
      severity,
      affectedFeatures,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send Telegram health alert:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
