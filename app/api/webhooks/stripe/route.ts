import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase admin is not configured.' }, { status: 503 });
    }

    const bodyText = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(bodyText, sig, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId || session.client_reference_id;

                if (!userId) throw new Error("No userId found in session metadata");

                // Retrieve the subscription to get the price ID
                if (session.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                    const priceId = subscription.items.data[0].price.id;

                    // Determine new role based on Price ID
                    const premiumPriceId = process.env.VITE_STRIPE_PRICE_PREMIUM;
                    const coachPriceId = process.env.VITE_STRIPE_PRICE_COACH;

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
                    console.log(`User ${userId} upgraded successfully to ${isCoachPlan ? 'Coach' : 'Premium'}.`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
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
                    console.log(`Subscription for customer ${subscription.customer} is past due! Grace period activated.`);
                    // TODO: Trigger email
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
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
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
