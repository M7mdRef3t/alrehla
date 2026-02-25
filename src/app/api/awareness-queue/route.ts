import { NextResponse } from 'next/server';
import { supabase } from '../../../services/supabaseClient';

/**
 * /api/awareness-queue — بوابه استلام أحداث الوعي 📩
 * ===============================================
 * Implements the "Acknowledge & Defer" pattern (HTTP 202).
 * Writes events to a persistent queue for background processing.
 */

export async function POST(req: Request) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
        }
        const payload = await req.json();

        // 1. Validation (Basic)
        if (!payload.userId || !payload.actionType) {
            return NextResponse.json({ error: 'Invalid Payload' }, { status: 400 });
        }

        // 2. Persistent Outbox Write
        const { error } = await supabase
            .from('awareness_events_queue')
            .insert({
                user_id: payload.userId,
                action_type: payload.actionType,
                payload: payload,
                status: 'PENDING'
            });

        if (error) throw error;

        // 3. Trigger Background Worker (Non-blocking)
        // In a real serverless env, this could be a call to a Vercel Queue or a simple internal fetch
        triggerWorker();

        // 4. Respond with 202 Accepted
        return new Response(JSON.stringify({ status: 'queued' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        console.error('Queue Ingestion Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * Non-blocking call to wake up the processor
 */
function triggerWorker() {
    // We fire and forget this request
    const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/awareness-queue/worker`;
    fetch(workerUrl, { method: 'POST' }).catch(() => { });
}
