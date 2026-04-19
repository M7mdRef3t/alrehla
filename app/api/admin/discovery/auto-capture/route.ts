import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/infrastructure/database/client";
import { sendAdminTelegramNotice } from "@/server/telegramNotifier";
import { DiscoveryItem } from "@/types/discovery";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.INTERCEPTOR_SECRET_KEY || process.env.VITE_TELEGRAM_BOT_TOKEN;
    const authHeader = req.headers.get("authorization") || req.headers.get("x-engine-token");
    
    // Allow if it matches internal secrets for automation
    const isAuthorized = authHeader === `Bearer ${secret}` || authHeader === secret;
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized Access" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Sovereign Engine DB Disconnected" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    
    // Map whatever input we get to a DiscoveryItem
    const { 
      title = "System Anomaly", 
      description = "No description provided.", 
      source = "ops_insight", 
      priority = "medium",
      facts = [],
      metadata = {}
    } = body;

    const newItem: Partial<DiscoveryItem> = {
      title,
      description,
      source,
      priority,
      stage: "Inbox",
      facts: Array.isArray(facts) ? facts : [JSON.stringify(metadata)],
      business_goal: "Automated Platform Stability"
    };

    const { data, error } = await supabaseAdmin
      .from("discovery_items")
      .insert([newItem])
      .select()
      .single();

    if (error) {
      console.error("[Auto-Capture] Insert failed", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Alert Admin
    const msg = `⚡ <b>Auto-Genesis Triggered!</b>\n\n` +
      `<b>Signal:</b> ${data.title}\n` +
      `<b>Source:</b> ${data.source}\n` +
      `<b>Priority:</b> ${data.priority}\n\n` +
      `<i>The engine has captured this automatically. Check your Inbox.</i>`;
    
    await sendAdminTelegramNotice(msg).catch(console.error);

    return NextResponse.json({ success: true, item: data });

  } catch (err: any) {
    console.error("[Auto-Capture] Error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
