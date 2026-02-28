import { NextResponse } from 'next/server';
import { supabase } from '../../../../services/supabaseClient';
import { DynamicContextRouter } from '../../../../services/dynamicContextRouter';

/**
 * /api/awareness-queue/worker — محرك المعالجة الخلفية ⚙️
 * ====================================================
 * Processes PENDING events from the awareness_events_queue.
 * Implements Exponential Backoff and DDA Feedback Loop.
 */

export async function POST() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
        }
        // 1) Atomically claim due events with SKIP LOCKED.
        const { data: events, error: fetchError } = await supabase
            .rpc('claim_awareness_events_batch', { p_limit: 50 });

        if (fetchError) throw fetchError;
        if (!events || events.length === 0) {
            return NextResponse.json({ status: 'no_pending_events' });
        }

        // 2) Process all claimed events concurrently.
        const outcomes = await Promise.all(
            events.map(async (event: {
                id: string;
                user_id: string;
                action_type: string;
                payload: unknown;
                retry_count?: number;
            }) => {
                try {
                    const mockContext = {
                        clientId: event.user_id,
                        lastDDA: 0,
                        lastBI: 0.5
                    };
                    await DynamicContextRouter.route(mockContext, {
                        type: event.action_type,
                        payload: event.payload
                    });
                    return { id: event.id, status: 'completed' as const };
                } catch (procError: unknown) {
                    const nextRetryCount = (event.retry_count || 0) + 1;
                    const message = procError instanceof Error ? procError.message : 'worker_processing_failed';
                    if (nextRetryCount > 4) {
                        return {
                            id: event.id,
                            status: 'dlq' as const,
                            retry_count: nextRetryCount,
                            error: message
                        };
                    }
                    const backoffMinutes = Math.pow(2, nextRetryCount);
                    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60000).toISOString();
                    return {
                        id: event.id,
                        status: 'failed' as const,
                        retry_count: nextRetryCount,
                        next_retry_at: nextRetryAt,
                        error: message
                    };
                }
            })
        );

        // 3) Apply results in one DB batch call.
        const { data: batchApplyResult, error: applyError } = await supabase
            .rpc('apply_awareness_event_results', { p_results: outcomes });
        if (applyError) throw applyError;

        return NextResponse.json({
            claimed: events.length,
            processed: batchApplyResult ?? null,
            outcomes
        });
    } catch (err) {
        console.error('Worker General Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
