import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';

function getStripeClient() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return null;
    return new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia',
    });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function sendPastDueEmail(toEmail: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.REPORT_EMAIL_FROM || "billing@alrehla.app";
    if (!apiKey) {
        console.warn("RESEND_API_KEY not configured. Skipping past_due email.");
        return;
    }
    const subject = "Action Required: Subscription Payment Failed";
    const html = `<p>Hello,</p><p>We were unable to process the payment for your subscription. Your subscription is now past due. Please update your payment method to continue accessing premium features.</p><p>Thank you,</p><p>The Team</p>`;

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from,
                to: toEmail,
                subject,
                html
            })
        });
        if (!res.ok) {
            console.error("Failed to send past_due email:", await res.text());
        } else {
            console.log(`Successfully sent past_due email to ${toEmail}`);
        }
    } catch (error) {
        console.error("Error sending past_due email:", error);
    }
}


export async function POST(req: Request) {
    const stripe = getStripeClient();
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
    }

    if (!webhookSecret) {
        return NextResponse.json({ error: 'Stripe webhook secret is not configured.' }, { status: 503 });
    }

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

                // If past_due, trigger an email via Resend
                if (subscription.status === 'past_due') {
                    console.log(`Subscription for customer ${subscription.customer} is past due! Grace period activated.`);

                    const { data: profileData, error: profileError } = await supabaseAdmin
                        .from('profiles')
                        .select('email')
                        .eq('stripe_customer_id', subscription.customer as string)
                        .single();

                    if (!profileError && profileData?.email) {
                        await sendPastDueEmail(profileData.email);
                    } else {
                        console.error("Could not find email for customer", subscription.customer);
                    }
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
