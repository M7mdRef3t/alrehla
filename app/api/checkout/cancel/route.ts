import { NextResponse } from 'next/server';
import { getStripeClient } from '../../_lib/stripeConfig';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const { client: stripe } = getStripeClient();
        if (!stripe) {
            return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
        }

        const { subscriptionId, immediately } = await req.json();

        if (!subscriptionId) {
            return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
        }

        if (immediately) {
            await stripe.subscriptions.cancel(subscriptionId);
        } else {
            // Cancel at the end of the period
            await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
        }

        return NextResponse.json({ success: true, message: 'Subscription cancellation scheduled' });
    } catch (err: unknown) {
        console.error('Error canceling subscription:', err);
        const message = err instanceof Error ? err.message : 'cancel_subscription_failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
