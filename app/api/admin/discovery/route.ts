import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { sendAdminTelegramNotice } from "@/server/telegramNotifier";
import { requireAdmin } from "@/server/requireAdmin";

const supabaseAdmin =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    : null;

const discoveryItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  source: z.string().min(1, "Source is required"),
  stage: z.enum([
    "Inbox",
    "Needs Evidence",
    "Validated",
    "Prioritized",
    "In Delivery",
    "Shipped",
    "Dropped",
  ]).optional().default("Inbox"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  facts: z.array(z.string()).optional().default([]),
  interpretations: z.array(z.string()).optional().default([]),
  jira_issue_url: z.string().url().optional().or(z.literal("")).nullable(),
  signal_source: z.string().optional().nullable(),
  funnel_stage: z.string().optional().nullable(),
  business_goal: z.string().optional().nullable(),
  confidence: z.number().min(0).max(100).optional().nullable(),
  evidence: z.array(z.string()).optional().default([]),
  hypothesis: z.string().optional().nullable(),
  risk: z.string().optional().nullable(),
  next_step: z.string().optional().nullable(),
  execution_link: z.string().url().optional().or(z.literal("")).nullable(),
  tags: z.array(z.string()).optional().default([]),
});

const discoveryUpdateSchema = discoveryItemSchema.partial();

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  if (!supabaseAdmin)
    return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("discovery_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!supabaseAdmin)
      return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const rawItem = await req.json();
    
    // Parse and validate via Zod
    const result = discoveryItemSchema.safeParse(rawItem);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const item = result.data;

    const { data, error } = await supabaseAdmin
      .from("discovery_items")
      .insert([item])
      .select()
      .single();

    if (error) throw error;

    // Notify admin
    await sendAdminTelegramNotice(
      `🚀 <b>إشارة جديدة في Discovery Engine</b>\n\n` +
        `<b>العنوان:</b> ${data.title}\n` +
        `<b>المصدر:</b> ${data.source}\n` +
        `<b>الأهمية:</b> ${data.priority}`
    ).catch(console.error);

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error("Failed to create discovery item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!supabaseAdmin)
      return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const body = await req.json();
    const { id, updates: rawUpdates } = body || {};

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
    }

    if (!rawUpdates || typeof rawUpdates !== 'object') {
        return NextResponse.json({ error: "Invalid or missing updates object" }, { status: 400 });
    }

    // Parse and validate via Zod
    const result = discoveryUpdateSchema.safeParse(rawUpdates);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const updates = result.data;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("discovery_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Notify admin on critical stage changes
    if (updates.stage && (data.priority === "critical" || updates.stage === "Shipped")) {
      await sendAdminTelegramNotice(
        `🔄 <b>تحديث مهم في Discovery Engine</b>\n\n` +
          `<b>المهمة:</b> ${data.title}\n` +
          `<b>الحالة الجديدة:</b> ${data.stage}\n` +
          `<b>الأهمية:</b> ${data.priority}`
      ).catch(console.error);
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error("Failed to update discovery item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    if (!supabaseAdmin)
      return NextResponse.json({ error: "DB not initialized" }, { status: 500 });

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("discovery_items")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete discovery item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
