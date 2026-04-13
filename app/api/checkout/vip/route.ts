import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, phone, code } = await request.json();
    const cleanCode = String(code || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPhone = String(phone || "").trim();

    if (!cleanCode) {
      return NextResponse.json({ success: false, message: "الرجاء إدخال كود مرور." }, { status: 400 });
    }

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ success: false, message: "الرجاء إدخال الإيميل المعرف." }, { status: 400 });
    }

    const supabase = await getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
    }

    // 1. Consume the Promo Code via RPC
    const { data: promoResult, error: promoError } = await supabase.rpc("consume_promo_code", { p_code: cleanCode });

    if (promoError) {
      console.error("RPC Error:", promoError);
      return NextResponse.json({ success: false, message: "حدث خطأ أثناء فحص الكود السري." }, { status: 500 });
    }

    if (!promoResult || promoResult.success === false) {
      return NextResponse.json({ success: false, message: promoResult?.message || "كود غير صالح." }, { status: 400 });
    }

    // 2. Upsert into marketing_leads to mark them as activated
    const updates: any = {
      status: "activated",
      lead_score: 100, // full VIP confidence
      source: "vip_code",
      updated_at: new Date().toISOString()
    };

    let identifierMatch = null;
    if (cleanEmail) {
      updates.email = cleanEmail;
      identifierMatch = { key: "email", value: cleanEmail };
    } else {
      updates.phone = cleanPhone;
      identifierMatch = { key: "phone", value: cleanPhone };
    }

    const { error: upsertError } = await supabase
      .from("marketing_leads")
      .upsert(
        { ...updates },
        { onConflict: identifierMatch.key }
      );

    if (upsertError) {
      console.error("VIP Upsert Error:", upsertError);
    }

    // Profiles table matching email:
    if (cleanEmail) {
      await supabase
        .from("profiles")
        .update({ role: "vip" }) // Give them some special role
        .eq("email", cleanEmail);
    }

    return NextResponse.json({ success: true, message: "تم تفعيل حسابك بنجاح." });
  } catch (err: any) {
    console.error("VIP Process Error:", err);
    return NextResponse.json({ success: false, message: "فشل التحقق من الخادم." }, { status: 500 });
  }
}
