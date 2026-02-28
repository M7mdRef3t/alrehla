import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';
import { getStripeClient, isValidWebhookSecret } from '../../_lib/stripeConfig';

function extractUserIdFromSession(session: import("stripe").Stripe.Checkout.Session): string | null {
    const metadataUserId = typeof session.metadata?.userId === 'string' ? session.metadata.userId.trim() : '';
    const referenceUserId = typeof session.client_reference_id === 'string' ? session.client_reference_id.trim() : '';
    return metadataUserId || referenceUserId || null;
}

function extractTrackingSessionId(session: import("stripe").Stripe.Checkout.Session, userId: string): string {
    const trackingSessionId = typeof session.metadata?.trackingSessionId === 'string'
        ? session.metadata.trackingSessionId.trim()
        : '';
    return trackingSessionId || userId;
}

async function appendFlowEvent(params: {
    supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>;
    sessionId: string | null;
    step: string;
    extra?: Record<string, unknown>;
}) {
    if (!params.supabaseAdmin || !params.sessionId) return;
    await params.supabaseAdmin.from('journey_events').insert({
        session_id: params.sessionId,
        mode: 'identified',
        type: 'flow_event',
        payload: {
            step: params.step,
            extra: params.extra ?? {}
        }
    });
}

export async function POST(req: Request) {
    const { client: stripe, config: stripeConfig } = getStripeClient();
    const webhookSecret = stripeConfig.webhookSecret;
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    if (!webhookSecret || !isValidWebhookSecret(webhookSecret)) {
        return NextResponse.json(
            { error: 'Stripe webhook secret is invalid. Expected a whsec_ signing secret.' },
            { status: 503 }
        );
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 503 });
    }

    const bodyText = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event: import("stripe").Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(bodyText, sig, webhookSecret);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid webhook signature';
        console.error(`Webhook Error: ${message}`);
        return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    try {
        let maybeUserId: string | null = null;
        let maybeCheckoutSessionId: string | null = null;

        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
            const session = event.data.object as import("stripe").Stripe.Checkout.Session;
            maybeUserId = extractUserIdFromSession(session);
            maybeCheckoutSessionId = typeof session.id === 'string' ? session.id : null;
        }

        const { data: isNewEvent } = await supabaseAdmin.rpc('register_payment_webhook_event', {
            p_provider: 'stripe',
            p_provider_event_id: event.id,
            p_event_type: event.type,
            p_user_id: maybeUserId,
            p_checkout_session_id: maybeCheckoutSessionId,
            p_metadata: { livemode: event.livemode }
        });

        if (isNewEvent === false) {
            return NextResponse.json({ received: true, deduped: true });
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as import("stripe").Stripe.Checkout.Session;
                const userId = extractUserIdFromSession(session);

                if (!userId) throw new Error("No userId found in session metadata");
                const trackingSessionId = extractTrackingSessionId(session, userId);

                await supabaseAdmin.rpc('activate_founding_cohort_seat', {
                    p_user_id: userId,
                    p_provider: 'stripe',
                    p_payment_ref: session.id,
                    p_token_amount: 100,
                    p_journey_days: 21
                });

                // Retrieve the subscription to get the price ID
                if (session.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                    const priceId = subscription.items.data[0].price.id;

                    // Determine new role based on Price ID
                    const coachPriceId = stripeConfig.priceCoach;

                    const isCoachPlan = priceId === coachPriceId;
                    const newRole = isCoachPlan ? 'coach' : 'user';
                    const maxClients = isCoachPlan ? 10 : 0;

                    // Update Supabase
                    const { error } = await supabaseAdmin
                        .from('profiles')
                        .update({
                            stripe_customer_id: session.customer as string,
                            subscription_status: subscription.status,
                            subscription_price_id: priceId,
                            role: newRole,
                            max_clients: maxClients,
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        })
                        .eq('id', userId);

                    if (error) throw error;
                    console.warn(`User ${userId} upgraded successfully to ${isCoachPlan ? 'Coach' : 'Premium'}.`);
                }

                await appendFlowEvent({
                    supabaseAdmin,
                    sessionId: trackingSessionId,
                    step: 'payment_success',
                    extra: {
                        source: 'stripe_webhook',
                        provider: 'stripe',
                        stripeMode: stripeConfig.mode,
                        providerEventId: event.id,
                        checkoutSessionId: session.id
                    }
                });
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object as import("stripe").Stripe.Checkout.Session;
                const userId = extractUserIdFromSession(session);
                const trackingSessionId = userId ? extractTrackingSessionId(session, userId) : null;
                if (userId) {
                    await supabaseAdmin.rpc('release_founding_cohort_seat', {
                        p_user_id: userId,
                        p_reason: 'checkout_session_expired'
                    });
                }

                await appendFlowEvent({
                    supabaseAdmin,
                    sessionId: trackingSessionId,
                    step: 'payment_failed',
                    extra: {
                        source: 'stripe_webhook',
                        provider: 'stripe',
                        stripeMode: stripeConfig.mode,
                        providerEventId: event.id,
                        reason: 'checkout_session_expired'
                    }
                });
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as import("stripe").Stripe.Subscription;
                // Update status (e.g., active -> past_due)
                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: subscription.status,
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                    })
                    .eq('stripe_customer_id', subscription.customer as string);

                if (error) console.error("Error updating subscription status:", error);

                // If past_due, we could trigger an email via Resend here.
                if (subscription.status === 'past_due') {
                    console.warn(`Subscription for customer ${subscription.customer} is past due! Grace period activated.`);
                    // TODO: Trigger email
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as import("stripe").Stripe.Subscription;
                // Downgrade user
                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        subscription_status: 'canceled',
                        role: 'user', // Revert to base user
                        max_clients: 0
                    })
                    .eq('stripe_customer_id', subscription.customer as string);

                if (error) console.error("Error downgrading subscription:", error);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as import("stripe").Stripe.Invoice;
                const customerId = typeof invoice.customer === 'string' ? invoice.customer : null;
                let userId: string | null = null;
                if (customerId) {
                    const { data: profile } = await supabaseAdmin
                        .from('profiles')
                        .select('id')
                        .eq('stripe_customer_id', customerId)
                        .maybeSingle();
                    userId = typeof profile?.id === 'string' ? profile.id : null;
                }

                if (userId) {
                    await supabaseAdmin.rpc('release_founding_cohort_seat', {
                        p_user_id: userId,
                        p_reason: 'invoice_payment_failed'
                    });
                }

                await appendFlowEvent({
                    supabaseAdmin,
                    sessionId: userId,
                    step: 'payment_failed',
                    extra: {
                        source: 'stripe_webhook',
                        provider: 'stripe',
                        stripeMode: stripeConfig.mode,
                        providerEventId: event.id,
                        reason: 'invoice_payment_failed'
                    }
                });
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as import("stripe").Stripe.PaymentIntent;
                const userId =
                    typeof paymentIntent.metadata?.userId === 'string' && paymentIntent.metadata.userId.trim()
                        ? paymentIntent.metadata.userId.trim()
                        : null;
                if (userId) {
                    await supabaseAdmin.rpc('release_founding_cohort_seat', {
                        p_user_id: userId,
                        p_reason: 'payment_intent_failed'
                    });
                }

                await appendFlowEvent({
                    supabaseAdmin,
                    sessionId: userId,
                    step: 'payment_failed',
                    extra: {
                        source: 'stripe_webhook',
                        provider: 'stripe',
                        stripeMode: stripeConfig.mode,
                        providerEventId: event.id,
                        reason: 'payment_intent_failed'
                    }
                });
                break;
            }
            default:
                console.warn(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: unknown) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
