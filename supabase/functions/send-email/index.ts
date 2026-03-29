
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@3.2.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const resend = new Resend(RESEND_API_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text, from = 'Alrehla <team@alrehla.app>' } = await req.json()

    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, html')
    }

    console.log(`[SendEmail] Attempting to send email to: ${to}`)

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text || "فتح الروشتة الخاصة بك من الرحلة",
    })

    if (error) {
      console.error(`[SendEmail] Resend API Error: ${JSON.stringify(error)}`)
      throw error
    }

    console.log(`[SendEmail] Success: ${data?.id}`)

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error(`[SendEmail] Catch-all error: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
