import { NextResponse } from 'next/server';
import { metaLeadsService } from '@/services/metaLeadsService';

/**
 * Handle incoming Meta webhook events
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[MetaLeadsWebhook] Received event:', JSON.stringify(body));

    // Meta Webhooks for Lead Gen send changes in an array
    if (body.object === 'page') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id;
            console.log('[MetaLeadsWebhook] Lead ID detected:', leadgenId);

            const leadDetails = await metaLeadsService.fetchLeadDetails(leadgenId);
            if (leadDetails) {
              await metaLeadsService.processAndStoreLead(leadDetails);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[MetaLeadsWebhook] Error processing webhook:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * Handle Meta webhook verification challenge
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      console.log('[MetaLeadsWebhook] Webhook verified');
      return new Response(challenge, { status: 200 });
    } else {
      console.warn('[MetaLeadsWebhook] Verification failed: Token mismatch');
      return new Response('Forbidden', { status: 403 });
    }
  }

  return new Response('Missing parameters', { status: 400 });
}
