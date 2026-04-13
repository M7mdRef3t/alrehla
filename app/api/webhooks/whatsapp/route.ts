import { NextResponse } from 'next/server';
import { whatsappAutomationService } from '@/services/whatsappAutomationService';
import { verifyWhatsAppSignature } from './_security';

/**
 * Unified WhatsApp Webhook
 * Handles Meta Cloud API challenge (GET) and incoming messages (POST)
 */

// GET: Handshake with Meta
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_WA_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsAppWebhook] Verification successful');
    return new Response(challenge, { status: 200 });
  }

  return new Response('Verification failed', { status: 403 });
}

// POST: Direct message processing
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const appSecret = process.env.META_APP_SECRET;

    // 1. Verify Signature
    const isSecure = await verifyWhatsAppSignature(req, rawBody, appSecret);
    if (!isSecure) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // 2. Detect source (Default to Meta)
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      
      // Meta sends messages in a nested structure
      // We process them in the background to return 200 fast
      processMetaMessages(entries).catch(err => {
        console.error('[WhatsAppWebhook] Background processing error:', err);
      });

      return NextResponse.json({ status: 'queued', source: 'meta' });
    }

    // 2. Fallback for other gateways (like UltraMsg if needed)
    if (body.instance_id && body.data) {
       // Example UltraMsg structure
       processGenericMessage({
         from: body.data.from,
         text: body.data.body,
         timestamp: body.data.time,
         messageId: body.data.id,
         gateway: 'ultramsg',
         metadata: { instance_id: body.instance_id }
       }).catch(err => console.error(err));
       
       return NextResponse.json({ status: 'queued', source: 'ultramsg' });
    }

    return NextResponse.json({ status: 'ignored', reason: 'unknown_source' });
  } catch (error) {
    console.error('[WhatsAppWebhook] Request error:', error);
    return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
  }
}

/**
 * Meta specific parser
 */
async function processMetaMessages(entries: any[]) {
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value || !value.messages) continue;

      const metadata = {
        display_phone_number: value.metadata?.display_phone_number,
        phone_number_id: value.metadata?.phone_number_id
      };

      for (const msg of value.messages) {
        // Only process text or button messages for intent detection
        const text = msg.text?.body || msg.button?.text || '';
        if (!text) continue;

        const contact = value.contacts?.find((c: any) => c.wa_id === msg.from);
        const senderName = contact?.profile?.name;

        await whatsappAutomationService.processInboundMessage({
          from: msg.from,
          name: senderName,
          text: text,
          timestamp: msg.timestamp,
          messageId: msg.id,
          gateway: 'meta',
          metadata: { ...metadata, raw: msg }
        });
      }
    }
  }
}

/**
 * Generic handler for non-Meta sources
 */
async function processGenericMessage(payload: any) {
  await whatsappAutomationService.processInboundMessage(payload);
}
