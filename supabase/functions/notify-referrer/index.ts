import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { Resend } from "npm:resend@3.2.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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
    const { referrerCode } = await req.json()

    if (!referrerCode) {
      throw new Error('Missing required field: referrerCode')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables')
    }

    // Initialize Supabase client with Service Role Key to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })

    // Fetch the referrer's email securely on the server
    const { data: referrer, error: fetchError } = await supabase
        .from('marketing_leads')
        .select('email')
        .filter('metadata->>referral_code', 'eq', referrerCode)
        .maybeSingle()

    if (fetchError) {
        throw new Error(`Failed to fetch referrer: ${fetchError.message}`)
    }

    if (!referrer || !referrer.email) {
        throw new Error('Referrer not found or email is missing')
    }

    const to = referrer.email

    console.warn(`[NotifyReferrer] Attempting to send email to: ${to}`)

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2dd4bf;">مبروك! إحالة ناجحة 🎉</h2>
        <p>مرحباً،</p>
        <p>لقد قام شخص ما بالتسجيل باستخدام كود الإحالة الخاص بك (<strong>${referrerCode}</strong>).</p>
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
      text: `مبروك! لقد قام شخص ما بالتسجيل باستخدام كود الإحالة الخاص بك. لقد كسبت أسبوع بريميوم جديد.`,
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
