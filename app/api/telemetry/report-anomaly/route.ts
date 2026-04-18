import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { sendAdminTelegramNotice } from "@/server/telegramNotifier";
import { DiscoveryItem } from "@/types/discovery";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Basic CORS/Origin check could go here if needed
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Sovereign Engine DB Disconnected" }, { status: 500 });
    }

    const { type, message, details, sourcePath } = await req.json().catch(() => ({}));
    
    if (!type || !message) {
      return NextResponse.json({ error: "Invalid anomaly payload" }, { status: 400 });
    }

    const titlePrefix = type === "error" ? "🚨 Tech Error:" : "🌊 Rhythm Spike:";
    const priority = type === "error" ? "high" : "critical";
    const source = type === "error" ? "ops_insight" : "user_signal";

    const newItem: Partial<DiscoveryItem> = {
      title: `${titlePrefix} ${message.substring(0, 50)}`,
      description: `Anomaly detected from path: ${sourcePath || "Unknown"}\nDetails: ${JSON.stringify(details, null, 2)}`,
      source,
      priority,
      stage: "Inbox",
      facts: [
        `Type: ${type}`,
        `Path: ${sourcePath || "Unknown"}`,
        `Time: ${new Date().toISOString()}`
      ],
      business_goal: type === "error" ? "Platform Stability" : "User Resonance"
    };

    const { data, error } = await supabaseAdmin
      .from("discovery_items")
      .insert([newItem])
      .select()
      .single();

    if (error) {
      console.error("[Report Anomaly] Insert failed", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Attempt to notify owner if it's critical
    if (priority === "critical") {
      const msg = `⚡ <b>Auto-Genesis Flag:</b>\n\n` +
        `<b>Issue:</b> ${data.title}\n` +
        `<b>Action:</b> Review Discovery Board\n`;
      await sendAdminTelegramNotice(msg).catch(() => {});
    }

    return NextResponse.json({ success: true, id: data.id });

  } catch (err: any) {
    console.error("[Report Anomaly] Process Error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
