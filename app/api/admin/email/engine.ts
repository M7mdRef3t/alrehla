/**
 * ══════════════════════════════════════════════════════════════
 *  Sovereign Mail Engine — Alrehla's Self-Hosted Email Core
 * ══════════════════════════════════════════════════════════════
 *
 * Replaces Resend SDK entirely. Uses Nodemailer + any SMTP provider.
 *
 * Supported SMTP providers (via env vars):
 *   - Gmail:       SMTP_HOST=smtp.gmail.com, SMTP_PORT=587
 *   - Amazon SES:  SMTP_HOST=email-smtp.eu-west-1.amazonaws.com, SMTP_PORT=587
 *   - Custom:      Any SMTP server
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
 *
 * Optional env vars:
 *   SMTP_SECURE (true for port 465), DKIM_PRIVATE_KEY, DKIM_SELECTOR, SMTP_FROM
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

// ─── Configuration ──────────────────────────────────────────────────────────

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_SECURE = process.env.SMTP_SECURE === "true" || SMTP_PORT === 465;
const DEFAULT_FROM = process.env.SMTP_FROM || "Alrehla <team@alrehla.app>";

const DKIM_PRIVATE_KEY = process.env.DKIM_PRIVATE_KEY || "";
const DKIM_SELECTOR = process.env.DKIM_SELECTOR || "default";
const DKIM_DOMAIN = process.env.DKIM_DOMAIN || "alrehla.app";

// ─── Tracking Config ────────────────────────────────────────────────────────

export const TRACKING_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alrehla.app";

// ─── Transporter (Singleton) ────────────────────────────────────────────────

let _transporter: any = null;

function getTransporter(): any {
  if (_transporter) return _transporter;

  const transportOptions = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  } as any;

  // DKIM signing (if key provided)
  if (DKIM_PRIVATE_KEY) {
    transportOptions.dkim = {
      domainName: DKIM_DOMAIN,
      keySelector: DKIM_SELECTOR,
      privateKey: DKIM_PRIVATE_KEY,
    };
  }

  _transporter = nodemailer.createTransport(transportOptions);
  return _transporter;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  /** Internal tracking ID (from email_sends table) */
  trackingId?: string;
  /** Whether to inject open/click tracking */
  enableTracking?: boolean;
}

export interface SendEmailResult {
  ok: boolean;
  messageId: string | null;
  error: string | null;
  /** SMTP response */
  response: string | null;
}

// ─── Tracking Injection ─────────────────────────────────────────────────────

/**
 * Injects an invisible 1x1 tracking pixel at the end of the HTML body
 * to detect email opens.
 */
export function injectOpenTracker(html: string, trackingId: string): string {
  const pixelUrl = `${TRACKING_BASE_URL}/api/email/track?t=open&id=${trackingId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;

  // Insert before </body> if exists, else append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return html + pixel;
}

/**
 * Wraps all <a href="..."> links with click tracking redirects.
 */
export function injectClickTracker(html: string, trackingId: string): string {
  return html.replace(
    /<a\s([^>]*?)href="(https?:\/\/[^"]+)"([^>]*?)>/gi,
    (_match, before, url, after) => {
      // Don't track unsubscribe or tracking URLs
      if (url.includes("/api/email/track") || url.includes("unsubscribe")) {
        return `<a ${before}href="${url}"${after}>`;
      }
      const trackedUrl = `${TRACKING_BASE_URL}/api/email/track?t=click&id=${trackingId}&url=${encodeURIComponent(url)}`;
      return `<a ${before}href="${trackedUrl}"${after}>`;
    }
  );
}

// ─── Core Send Function ─────────────────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const {
    to,
    subject,
    from = DEFAULT_FROM,
    replyTo,
    text,
    trackingId,
    enableTracking = true,
  } = options;

  let { html } = options;

  // Inject tracking if enabled and trackingId provided
  if (enableTracking && trackingId) {
    html = injectOpenTracker(html, trackingId);
    html = injectClickTracker(html, trackingId);
  }

  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || stripHtml(html),
      replyTo: replyTo || undefined,
      // Headers for tracking
      headers: trackingId
        ? { "X-Alrehla-Tracking-Id": trackingId }
        : undefined,
    });

    console.log(`[SovereignMail] ✅ Sent to ${to} | MessageID: ${info.messageId} | Response: ${info.response}`);

    return {
      ok: true,
      messageId: info.messageId || null,
      error: null,
      response: info.response || null,
    };
  } catch (err: any) {
    const errorMessage = err?.message || String(err);
    console.error(`[SovereignMail] ❌ Failed to send to ${to}: ${errorMessage}`);

    return {
      ok: false,
      messageId: null,
      error: errorMessage,
      response: null,
    };
  }
}

// ─── Batch Send ─────────────────────────────────────────────────────────────

export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<SendEmailResult[]> {
  // Process sequentially for rate limiting safety
  const results: SendEmailResult[] = [];
  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
    // Small delay between sends (100ms) for rate limiting
    if (emails.length > 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return results;
}

// ─── Verify Connection ─────────────────────────────────────────────────────

export async function verifySmtpConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "SMTP verification failed" };
  }
}

// ─── Utility ────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Engine Info (for dashboard) ────────────────────────────────────────────

export function getEngineInfo() {
  return {
    provider: "sovereign",
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    user: SMTP_USER ? `${SMTP_USER.substring(0, 3)}***` : "not-configured",
    dkim: Boolean(DKIM_PRIVATE_KEY),
    from: DEFAULT_FROM,
    trackingUrl: TRACKING_BASE_URL,
  };
}
