import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type LeadPayload = {
  email?: string;
  source?: string;
  utm?: Record<string, string>;
  note?: string;
};

type OutreachQueueStatus = "pending" | "sent" | "failed" | "simulated";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isDebugAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const key = process.env.MARKETING_DEBUG_KEY;
  if (!key) return false;
  return request.headers.get("x-marketing-debug-key") === key;
}

async function enqueueOutreach(
  email: string,
  source: string,
  utm: Record<string, string> | null
): Promise<void> {
  const now = Date.now();
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  // 5-step drip campaign over 7 days
  const steps = [
    {
      channel: "email" as const,
      delay: 5 * MINUTE,
      payload: {
        step: 1,
        subject: "أهلاً بك في الرحلة — خطوتك الأولى خلال 3 دقائق",
        html: `
          <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.9;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:16px">
            <h2 style="color:#2dd4bf;margin-bottom:8px">مرحباً بك في الرحلة 🌙</h2>
            <p>في أقل من 3 دقائق، هتشوف خريطة علاقاتك لأول مرة.</p>
            <p>مش محتاج تعرف كل حاجة — المهم تبدأ.</p>
            <a href="https://www.alrehla.app/onboarding" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;margin-top:16px">ابدأ رحلتك الآن</a>
            <p style="color:#64748b;font-size:12px;margin-top:24px">— فريق الرحلة</p>
          </div>`,
        source, utm
      }
    },
    {
      channel: "email" as const,
      delay: 1 * DAY,
      payload: {
        step: 2,
        subject: "هل جربت خريطة الوعي؟ — شوف إيه اللي اتغير",
        html: `
          <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.9;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:16px">
            <h2 style="color:#2dd4bf">خريطة وعيك مستنياك 🗺️</h2>
            <p>ناس كتير بتفضل مترددة... لحد ما بتشوف أول دايرة.</p>
            <p><strong style="color:#f59e0b">سؤال واحد بس:</strong> مين أكتر شخص واخد مساحة من تفكيرك النهاردة؟</p>
            <p>حطه في الخريطة وشوف إيه اللي هيظهر.</p>
            <a href="https://www.alrehla.app/onboarding" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;margin-top:16px">جرّب دلوقتي</a>
          </div>`,
        source, utm
      }
    },
    {
      channel: "email" as const,
      delay: 3 * DAY,
      payload: {
        step: 3,
        subject: "\"أتمنى لو كنت عملت ده من زمان\" — حكاية مستخدم حقيقي",
        html: `
          <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.9;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:16px">
            <h2 style="color:#2dd4bf">حكاية من الرحلة 💬</h2>
            <blockquote style="border-right:3px solid #7c3aed;padding-right:16px;margin:16px 0;color:#94a3b8;font-style:italic">
              "كنت فاكر إن العلاقة دي طبيعية. بس لما شفت الخريطة، اكتشفت إنها بتسحب 70% من طاقتي. قررت أحط حدود... والنتيجة؟ راحة بال حقيقية."
            </blockquote>
            <p>الخريطة مش بتحكم — هي بتوضّح. والوضوح هو أول خطوة للتغيير.</p>
            <a href="https://www.alrehla.app" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;margin-top:16px">ابدأ خريطتك</a>
          </div>`,
        source, utm
      }
    },
    {
      channel: "whatsapp" as const,
      delay: 5 * DAY,
      payload: {
        step: 4,
        template: "alrehla_onboarding_5day",
        message: "مرحباً 👋 لاحظنا إنك سجلت في الرحلة بس لسه ما بدأت. لو عندك أي سؤال أو محتاج مساعدة، إحنا هنا. جرّب الرحلة من هنا: https://www.alrehla.app/onboarding",
        source, utm
      }
    },
    {
      channel: "email" as const,
      delay: 7 * DAY,
      payload: {
        step: 5,
        subject: "آخر فرصة — عرض الرواد بيخلص قريب 🔥",
        html: `
          <div dir="rtl" style="font-family:'Segoe UI',Arial,sans-serif;line-height:1.9;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:16px">
            <h2 style="color:#f59e0b">عرض الرواد — المقاعد بتخلص ⏰</h2>
            <p>فاضل <strong style="color:#ef4444">مقاعد محدودة</strong> في فوج التأسيس:</p>
            <ul style="color:#94a3b8;padding-right:20px">
              <li>21 يوم تركيز عميق</li>
              <li>100 نقطة وعي</li>
              <li>ذكاء اصطناعي شخصي</li>
              <li><strong style="color:#2dd4bf">السعر: 12-15 دولار فقط</strong> (بدل 9.99$/شهر)</li>
            </ul>
            <a href="https://www.alrehla.app/checkout" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">احجز مقعدك الآن</a>
            <p style="color:#64748b;font-size:12px;margin-top:24px">لو مش مهتم، تقدر تتجاهل الرسالة. مش هنزعجك تاني.</p>
          </div>`,
        source, utm
      }
    }
  ];

  // Use step number as unique key to allow multiple emails per lead
  const rows = steps.map((s) => ({
    lead_email: email,
    channel: s.channel,
    step: s.payload.step,
    status: "pending" as OutreachQueueStatus,
    scheduled_at: new Date(now + s.delay).toISOString(),
    payload: s.payload
  }));

  // Insert all steps — ignore conflicts (lead may re-subscribe)
  const { error } = await supabaseAdmin
    .from("marketing_lead_outreach_queue")
    .upsert(rows, { onConflict: "lead_email,channel,step", ignoreDuplicates: true });
  if (error) throw error;
}

function enqueueOutreachAsync(
  email: string,
  source: string,
  utm: Record<string, string> | null
): void {
  void enqueueOutreach(email, source, utm).catch((error) => {
    console.error("[marketing/lead] enqueue_outreach_failed:", error);
  });
}

export async function GET(req: Request) {
  if (!isDebugAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ ok: false, error: "missing_supabase_config" }, { status: 503 });
  }
  const url = new URL(req.url);
  const email = String(url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("marketing_leads")
    .select("email,source,created_at,updated_at")
    .eq("email", email)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: "lead_lookup_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, exists: Boolean(data), lead: data ?? null });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadPayload;
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }
    const row = {
      email,
      source: String(body.source ?? "landing"),
      utm: body.utm ?? null,
      note: body.note ? String(body.note).slice(0, 300) : null,
      created_at: new Date().toISOString()
    };
    if (hasSupabaseConfig()) {
      const { error } = await supabaseAdmin.from("marketing_leads").upsert(row, { onConflict: "email" });
      if (error) {
        console.error("[marketing/lead] Supabase upsert failed:", error);
        return NextResponse.json({ ok: false, error: "lead_store_failed" }, { status: 500 });
      }
      // Fail-fast: never block lead capture on outreach queue delays.
      enqueueOutreachAsync(email, row.source, row.utm as Record<string, string> | null);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[marketing/lead] unexpected error:", error);
    return NextResponse.json({ ok: false, error: "lead_store_failed" }, { status: 500 });
  }
}
