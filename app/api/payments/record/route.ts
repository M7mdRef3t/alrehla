import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database configuration missing." }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { 
      userId, 
      email, 
      phone, 
      amount, 
      currency, 
      provider, 
      itemType, 
      itemId,
      metadata = {},
      receiptUrl
    } = body;

    if (!amount || !provider) {
      return NextResponse.json({ error: "Amount and provider are required." }, { status: 400 });
    }

    const finalEmail = email && email !== "غير معروف" ? email : "غير معروف";
    const finalReceipt = metadata.receipt || "بدون إيصال";

    const { data, error } = await admin
      .from("transactions")
      .insert({
        user_id: userId || null,
        email: email || null,
        phone: phone || null,
        amount,
        currency: currency || "EGP",
        provider,
        item_type: itemType || "subscription",
        item_id: itemId || "premium",
        status: "pending",
        metadata: {
          ...metadata,
          source: "automated_checkout",
          timestamp: new Date().toISOString()
        }
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Record API] Insert error:", error);
      return NextResponse.json({ error: "Failed to create transaction record." }, { status: 500 });
    }

    // Server-Side Telegram Notification
    import("@/server/telegramNotifier").then(({ sendAdminTelegramNotice }) => {
      const publicUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || "https://alrehla.app";
      const methodLabel = provider.replace(/_/g, " ").toUpperCase();
      
      const telegramMessage = `
💳 <b>طلب ترقية جديد!</b>

👤 <b>الحساب:</b> ${finalEmail}
📱 <b>الطريقة:</b> ${methodLabel}
💰 <b>المبلغ:</b> ${amount} ${currency || "EGP"}
🧾 <b>رقم الحوالة:</b> ${finalReceipt}
🔗 <b>صورة الإيصال:</b> ${receiptUrl ? `<a href="${receiptUrl}">اضغط هنا للمشاهدة</a>` : "لم يرفق صورة"}

<a href="${publicUrl}/admin?tab=exec-overview">راجع التذكرة من لوحة التحكم</a>
      `.trim();
      
      sendAdminTelegramNotice(telegramMessage);
    }).catch(err => console.error("Failed to load Telegram Notifier:", err));

    return NextResponse.json({ 
      ok: true, 
      transactionId: data.id 
    });

  } catch (err) {
    console.error("[Record API] Request error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
