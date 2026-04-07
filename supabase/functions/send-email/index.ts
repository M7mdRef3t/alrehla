/**
 * Sovereign Mail — Supabase Edge Function
 * Sends emails via SMTP (Nodemailer-compatible) instead of Resend.
 *
 * Required Supabase Secrets:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
 *
 * Falls back to Resend if RESEND_API_KEY is set and SMTP is not configured.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @deno-types="https://esm.sh/v135/@types/nodemailer@6.4.14/index.d.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

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

    console.warn(`[SendEmail] Attempting to send email to: ${to}`)

    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')

    // ── Strategy 1: SMTP (Sovereign) ────────────────────────────────────
    if (smtpHost && smtpUser && smtpPassword) {
      const client = new SmtpClient()

      await client.connectTLS({
        hostname: smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPassword,
      })

      const result = await client.send({
        from,
        to,
        subject,
        content: text || "فتح الروشتة الخاصة بك من الرحلة",
        html,
      })

      await client.close()

      console.warn(`[SendEmail] ✅ SMTP Success to: ${to}`)

      return new Response(JSON.stringify({ ok: true, id: `smtp_${Date.now()}`, engine: "sovereign" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ── Strategy 2: Resend Fallback ─────────────────────────────────────
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      const { Resend } = await import("npm:resend@3.2.0")
      const resend = new Resend(resendApiKey)

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

      console.warn(`[SendEmail] ✅ Resend Fallback Success: ${data?.id}`)

      return new Response(JSON.stringify({ ok: true, id: data?.id, engine: "resend_fallback" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error('No email provider configured. Set SMTP_HOST or RESEND_API_KEY.')

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[SendEmail] Catch-all error: ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
