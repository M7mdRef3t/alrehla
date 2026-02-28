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
        // 1. Fetch PENDING or FAILED (due for retry) events
        const { data: events, error: fetchError } = await supabase
            .from('awareness_events_queue')
            .select('*')
            .in('status', ['PENDING', 'FAILED'])
            .lte('next_retry_at', new Date().toISOString())
            .order('created_at', { ascending: true })
            .limit(5); // Process in small batches to avoid timeouts

        if (fetchError) throw fetchError;
        if (!events || events.length === 0) {
            return NextResponse.json({ status: 'no_pending_events' });
        }

        const results = [];

        for (const event of events) {
            try {
                // Mark as PROCESSING
                await supabase
                    .from('awareness_events_queue')
                    .update({ status: 'PROCESSING' })
                    .eq('id', event.id);

                // 2. Execute Orchestration (The Router)
                // Note: In a real app, you'd fetch the user's current context (last DDA/BI) from DB
                const mockContext = {
                    clientId: event.user_id,
                    lastDDA: 0, // Placeholder
                    lastBI: 0.5, // Placeholder
                };

                const _result = await DynamicContextRouter.route(mockContext, {
                    type: event.action_type,
                    payload: event.payload
                });

                // 4. Update status to COMPLETED
                await supabase
                    .from('awareness_events_queue')
                    .update({ status: 'COMPLETED' })
                    .eq('id', event.id);

                results.push({ id: event.id, status: 'success' });

            } catch (procError: any) {
                console.error(`Error processing event ${event.id}:`, procError);

                // 5. Exponential Backoff Logic
                const nextRetryCount = (event.retry_count || 0) + 1;
                if (nextRetryCount > 4) {
                    // Move to Dead Letter Queue (DLQ)
                    await supabase
                        .from('awareness_events_queue')
                        .update({
                            status: 'DLQ',
                            last_error: procError.message,
                            retry_count: nextRetryCount
                        })
                        .eq('id', event.id);
                } else {
                    // Schedule next retry
                    const backoffMinutes = Math.pow(2, nextRetryCount);
                    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60000).toISOString();

                    await supabase
                        .from('awareness_events_queue')
                        .update({
                            status: 'FAILED',
                            last_error: procError.message,
                            retry_count: nextRetryCount,
                            next_retry_at: nextRetryAt
                        })
                        .eq('id', event.id);
                }
                results.push({ id: event.id, status: 'failed', error: procError.message });
            }
        }

        return NextResponse.json({ processed: results });
    } catch (err: any) {
        console.error('Worker General Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
