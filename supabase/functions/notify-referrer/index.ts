import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@3.2.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const resend = new Resend(RESEND_API_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, referrerCode, newUserName = "مستخدم جديد" } = await req.json()

    if (!to || !referrerCode) {
      throw new Error('Missing required fields: to, referrerCode')
    }

    console.warn(`[NotifyReferrer] Attempting to send email to: ${to}`)

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2dd4bf;">مبروك! إحالة ناجحة 🎉</h2>
        <p>مرحباً،</p>
        <p>لقد قام <strong>${newUserName}</strong> بالتسجيل باستخدام كود الإحالة الخاص بك (<strong>${referrerCode}</strong>).</p>
        <p>تم إضافة أسبوع بريميوم مجاني إلى حسابك مكافأة لك لدعوة أصدقائك إلى الرحلة.</p>
        <br/>
        <p>استمر في دعوة المزيد من الأصدقاء لكسب المزيد من المكافآت!</p>
        <p>فريق الرحلة</p>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'Alrehla <team@alrehla.app>',
      to,
      subject: "إحالة ناجحة! لقد كسبت أسبوع بريميوم 🎁",
      html,
      text: `مبروك! لقد قام ${newUserName} بالتسجيل باستخدام كود الإحالة الخاص بك. لقد كسبت أسبوع بريميوم جديد.`,
    })

    if (error) {
      console.error(`[NotifyReferrer] Resend API Error: ${JSON.stringify(error)}`)
      throw error
    }

    console.warn(`[NotifyReferrer] Success: ${data?.id}`)

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[NotifyReferrer] Catch-all error: ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
