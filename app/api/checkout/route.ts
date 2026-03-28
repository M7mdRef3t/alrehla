import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../_lib/supabaseAdmin';
import { getStripeClient, isAutomatedCardCheckoutEnabled } from '../_lib/stripeConfig';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    let safeUserIdForRollback = '';
    try {
        if (!isAutomatedCardCheckoutEnabled()) {
            return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });
        }
        const { client: stripe, config: stripeConfig } = getStripeClient();
        const supabaseAdmin = getSupabaseAdminClient();
        if (!stripe) {
            return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
        }
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 503 });
        }

        const body = await req.json();
        const { priceId, userId, trackingSessionId, tier } = body as {
            priceId?: string;
            userId?: string;
            trackingSessionId?: string;
            tier?: 'premium' | 'coach';
        };

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }
        const safeUserId = String(userId).trim();
        const mappedPriceId =
            tier === 'coach'
                ? stripeConfig.priceCoach
                : stripeConfig.pricePremium;
        const safePriceId = String(priceId || mappedPriceId).trim();
        const safeTrackingSessionId = typeof trackingSessionId === 'string' ? trackingSessionId.trim() : '';
        safeUserIdForRollback = safeUserId;

        if (!safePriceId) {
            return NextResponse.json({ error: 'Missing Stripe price configuration for the selected tier.' }, { status: 503 });
        }

        // Atomic seat reservation before creating the checkout session.
        const { data: seatReservation, error: seatReservationError } = await supabaseAdmin.rpc('reserve_founding_cohort_seat', {
            p_user_id: safeUserId,
            p_provider: 'stripe'
        });

        if (seatReservationError) {
            return NextResponse.json({ error: 'Failed to reserve cohort seat', details: seatReservationError.message }, { status: 500 });
        }

        const reserved = Boolean((seatReservation as Record<string, unknown> | null)?.reserved);
        if (!reserved) {
            const reason = String((seatReservation as Record<string, unknown> | null)?.reason ?? 'sold_out');
            const status = reason === 'sold_out' || reason === 'cohort_closed' ? 409 : 400;
            return NextResponse.json({ error: reason }, { status });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: safePriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${stripeConfig.siteUrl}/checkout?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${stripeConfig.siteUrl}/checkout?payment=cancelled`,
            client_reference_id: safeUserId,
            metadata: {
                userId: safeUserId, // Safe Financial Handshake
                trackingSessionId: safeTrackingSessionId || '',
                stripeMode: stripeConfig.mode
            },
        });

        await supabaseAdmin
            .from('journey_events')
            .insert({
                session_id: safeTrackingSessionId || safeUserId,
                mode: 'identified',
                type: 'flow_event',
                payload: {
                    step: 'checkout_session_created',
                    extra: {
                        source: 'server_checkout',
                        provider: 'stripe',
                        stripeMode: stripeConfig.mode,
                        checkoutSessionId: session.id,
                        priceId: safePriceId
                    }
                }
            });

        return NextResponse.json({ url: session.url });
    } catch (err: unknown) {
        console.error('Error creating checkout session:', err);
        // Best-effort seat release on checkout creation failure.
        try {
            if (safeUserIdForRollback) {
                const supabaseAdmin = getSupabaseAdminClient();
                await supabaseAdmin?.rpc('release_founding_cohort_seat', {
                    p_user_id: safeUserIdForRollback,
                    p_reason: 'checkout_session_creation_failed'
                });
            }
        } catch {
            // Never mask original checkout error.
        }
        const message = err instanceof Error ? err.message : 'checkout_session_failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
