# Stripe Live Cutover Checklist

1. Set `STRIPE_MODE=live` in environment.
2. Fill these live secrets (server-side only):
- `STRIPE_SECRET_KEY_LIVE`
- `STRIPE_WEBHOOK_SECRET_LIVE` (must start with `whsec_`)
3. Fill these live price IDs:
- `STRIPE_PRICE_PREMIUM_LIVE`
- `STRIPE_PRICE_COACH_LIVE`
4. Keep `NEXT_PUBLIC_SITE_URL` and `PUBLIC_APP_URL` on production domain:
- `https://www.alrehla.app`
5. Stripe dashboard:
- Webhook endpoint: `https://www.alrehla.app/api/webhooks/stripe`
- Enabled events:
  - `checkout.session.completed`
  - `checkout.session.expired`
  - `invoice.payment_failed`
  - `payment_intent.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
6. Deploy and verify:
- `POST /api/checkout` returns a checkout URL.
- One successful payment updates:
  - `profiles.awareness_tokens` to `100`
  - `cohort_seat_reservations.status` to `activated`
  - `journey_events` contains `checkout_session_created` then `payment_success`
- Replayed webhook returns deduped response.

