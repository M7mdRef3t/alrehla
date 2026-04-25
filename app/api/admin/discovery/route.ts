import { NextRequest, NextResponse } from "next/server";
import { DiscoveryItem } from "@/types/discovery";
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

// Suppress unused import warning (DiscoveryItem used for type inference)
void (null as unknown as DiscoveryItem);

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

    const item = await req.json();
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

    const { id, updates } = await req.json();

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
