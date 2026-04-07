# Marketing Outreach Cron Logic Flow

## Trigger
- Fired via scheduled cron job.
- Endpoint: `GET /api/cron/marketing-outreach`

## Condition
- Must include valid `Authorization: Bearer <CRON_SECRET>` or a match against `CRON_SECRET`.
- Alternatively forces execution if `?force=true` query parameter is provided.

## Action
1. Queries up to 100 pending outreach jobs from `marketing_lead_outreach_queue` where `scheduled_at` <= now.
2. Extracts unique `lead_email` and `lead_id` values from the pending queue rows.
3. Pre-fetches necessary context in bulk (resolving N+1 query overhead):
   - Fetches associated `marketing_leads` profiles via an `.in('email', leadEmails)` query into a Map to check for unsubscription status and names.
   - Fetches associated `routing_events` via an `.in('lead_id', leadIds)` query into a Set to see if leads have already begun onboarding.
4. Iterates through the queue rows referencing the in-memory Maps/Sets.
5. Sends emails (Resend) or WhatsApp messages (Webhook endpoint) depending on `row.channel`.
6. Creates follow-up queue rows for multi-step drip campaigns if the user has not started onboarding and has not finished the sequence.
7. Updates queue row status to 'sent', 'cancelled', or 'failed' based on provider responses and validations.

## Fallback
- If the database query for leads or queue items fails, it returns a 500 status.
- If an individual email/WhatsApp send fails, the specific queue row is marked as `failed` with the error message.
