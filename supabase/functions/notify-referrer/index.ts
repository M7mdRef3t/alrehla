import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@3.2.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const resend = new Resend(RESEND_API_KEY)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { referrerCode, newUserName } = await req.json()

    if (!referrerCode) {
      throw new Error('Missing required field: referrerCode')
    }

    console.warn(`[NotifyReferrer] Attempting to notify referrer for code: ${referrerCode}`)

    // Find the referrer in the database
    const { data: referrer, error: fetchError } = await supabase
      .from('marketing_leads')
      .select('email')
      .filter('metadata->>referral_code', 'eq', referrerCode)
      .maybeSingle()

    if (fetchError) {
      console.error(`[NotifyReferrer] Supabase fetch error: ${JSON.stringify(fetchError)}`)
      throw fetchError
    }

    if (!referrer || !referrer.email) {
      console.warn(`[NotifyReferrer] Referrer not found or has no email for code: ${referrerCode}`)
      return new Response(JSON.stringify({ ok: true, message: 'Referrer not found, no email sent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const html = `
      <h1>مرحباً بك!</h1>
      <p>لقد قام ${newUserName || 'مستخدم جديد'} بالتسجيل باستخدام كود الإحالة الخاص بك.</p>
      <p>شكراً لدعمك!</p>
    `

    const { data, error: sendError } = await resend.emails.send({
      from: 'Alrehla <team@alrehla.app>',
      to: referrer.email,
      subject: 'مستخدم جديد استخدم كود الإحالة الخاص بك!',
      html,
      text: `لقد قام ${newUserName || 'مستخدم جديد'} بالتسجيل باستخدام كود الإحالة الخاص بك. شكراً لدعمك!`,
    })

    if (sendError) {
      console.error(`[NotifyReferrer] Resend API Error: ${JSON.stringify(sendError)}`)
      throw sendError
    }

    console.warn(`[NotifyReferrer] Success notifying ${referrer.email}: ${data?.id}`)

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
