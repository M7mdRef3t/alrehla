import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as getSupabaseAdminClient } from "@/infrastructure/database/client"; // Triggering Next.js rebuild
import { sendAdminTelegramNotice } from "@/server/telegramNotifier";

export const dynamic = "force-dynamic";

/**
 * Parses SMS or Notification text to find Amount and Phone number.
 */
function extractPaymentInfo(text: string): { amount: number | null; phone: string | null } {
  // Normalize Arabic numbers to English if any
  const normalizedText = text.replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);

  // 1. Extract amount (Matches: "مبلغ 150.0" or "150 ج.م" or "EGP 150")
  const amountRegexes = [
    /مبلغ\s*([\d,.]+)/i,
    /([\d,.]+)\s*(ج\.م|جنيه|egp)/i,
    /(egp|ج\.م)\s*([\d,.]+)/i,
  ];

  let amount: number | null = null;
  for (const regex of amountRegexes) {
    const match = normalizedText.match(regex);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    } else if (match && match[2]) {
      // In case the number is in group 2 (e.g. egp 150)
       const parsed = parseFloat(match[2].replace(/,/g, ""));
       if (!isNaN(parsed) && parsed > 0) {
         amount = parsed;
         break;
       }
    }
  }

  // Fallback: Just get the first reasonable block of numbers with an optional decimal
  if (amount === null) {
      const genericMatch = normalizedText.match(/(\d+(?:\.\d+)?)/);
      if (genericMatch) {
          const parsed = parseFloat(genericMatch[1]);
          // To avoid extracting the phone number as an amount!
          if (parsed > 0 && parsed < 1000000 && !normalizedText.includes(`01${genericMatch[1]}`)) amount = parsed;
      }
  }

  // 2. Extract phone number (Egyptian: 11 digits starting with 010, 011, 012, 015)
  const noSpaceText = normalizedText.replace(/[\s-]/g, ""); // Strip spaces/dashes
  const phoneMatch = noSpaceText.match(/(01[0125][0-9]{8})/);
  
  const phone = phoneMatch ? phoneMatch[1] : null;

  return { amount, phone };
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.INTERCEPTOR_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Interceptor disabled (missing secret)." }, { status: 503 });
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("x-interceptor-token");
    if (authHeader !== `Bearer ${secret}` && authHeader !== secret) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { text, sender } = body;

    // We only care if there is text.
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text payload provided." }, { status: 400 });
    }

    const { amount, phone } = extractPaymentInfo(text);

    // If we can't find an amount or phone, just notify the admin for manual review
    if (!amount || !phone) {
        const msg = `⚠️ <b>رصدت رسالة بنكية مجهولة!</b>\n\nلم أتمكن من استخراج المبلغ أو رقم الهاتف منها.\n\nالمصدر: ${sender || "غير معروف"}\nالنص:\n<pre>${text}</pre>\n\nيرجى المراجعة يدوياً.`;
        await sendAdminTelegramNotice(msg);
        return NextResponse.json({ ok: true, matched: false, reason: "Parsing failed" });
    }

    const admin = getSupabaseAdminClient;
    if (!admin) return NextResponse.json({ error: "DB Error" }, { status: 500 });

    // Look for a pending transaction matching this amount and phone (with tolerance)
    const { data: transactions, error: txError } = await admin
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .eq("amount", amount)
      .order("created_at", { ascending: false });

    if (txError || !transactions || transactions.length === 0) {
       const msg = `⚠️ <b>رصدت استلام مبلغ (${amount} ج.م) من (${phone})!</b>\n\nلكن لم أجد أي طلب دفع (Pending) مطابق لهذا المبلغ على المنصة.\nالمصدر: ${sender || "غير معروف"}\n\nيرجى المراجعة يدوياً.`;
       await sendAdminTelegramNotice(msg);
       return NextResponse.json({ ok: true, matched: false, reason: "No pending transaction found" });
    }

    // Filter by phone (matching phone column, or metadata phone/account string if guest passed it)
    const matchedTx = transactions.find(tx => {
       const dbPhone = tx.phone || "";
       const dbEmailOrContact = tx.email || ""; // we stored it in email previously if it wasn't valid email
       return dbPhone.includes(phone) || dbEmailOrContact.includes(phone);
    });

    if (!matchedTx) {
       const msg = `⚠️ <b>رصدت استلام مبلغ (${amount} ج.م) من (${phone})!</b>\n\nيوجد طلب أو طلبات بهذا المبلغ، لكن ولا واحد فيهم مرتبط برقم الهاتف ده.\nالمصدر: ${sender || "غير معروف"}\n\nيرجى المراجعة وتأكيد العملية يدوياً من لوحة التحكم.`;
       await sendAdminTelegramNotice(msg);
       return NextResponse.json({ ok: true, matched: false, reason: "Amount matched, phone mismatched" });
    }

    // MATCH FOUND! Let's complete the transaction.
    const { error: updateError } = await admin
      .from("transactions")
      .update({ 
         status: "completed",
         metadata: { ...matchedTx.metadata, activated_by: "interceptor", verified_at: new Date().toISOString() }
      })
      .eq("id", matchedTx.id);

    // Activate the user
    if (matchedTx.user_id) {
       await admin
         .from("profiles")
         .update({ tier: "premium", is_subscriber: true, subscription_status: "active" })
         .eq("id", matchedTx.user_id);
    }

    // Telemetry & Alert
    const publicUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || "https://alrehla.app";
    const msg = `💥 <b>تم التفعيل التلقائي (Zero-Touch)!</b>\n\n✨ <b>الرقم السحري:</b> ${phone}\n💰 <b>المبلغ المستلم:</b> ${amount} ج.م\n🧾 <b>المصدر:</b> ${sender || "رسالة موبايل / إشعار الدفع"}\n\nتم مطابقة الحوالة بطلب مسبق وتفعيل الحساب مباشرة بدون أي تدخل بشري.\n<a href="${publicUrl}/admin">الدخول لغرفة العمليات</a>`;
    await sendAdminTelegramNotice(msg);

    return NextResponse.json({ ok: true, matched: true, transactionId: matchedTx.id });

  } catch (error: any) {
    console.error("[Payment Interceptor error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
