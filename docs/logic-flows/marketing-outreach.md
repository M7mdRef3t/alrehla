# Marketing Outreach Logic Flow

## Overview
This document outlines the logic flow for the automated marketing outreach system. The system runs via a cron job and processes queued messages for both email and WhatsApp channels.

## Core Flow (Optimized)
1. **Fetch Pending Queue**: The system retrieves a batch (e.g., up to 100) of \`pending\` messages from \`marketing_lead_outreach_queue\` whose \`scheduled_at\` time has passed.
2. **Batch Data Retrieval**:
   - Collects all unique \`lead_email\`s and \`lead_id\`s from the fetched rows.
   - Executes a single batch query to fetch all relevant records from the \`marketing_leads\` table based on the collected emails.
   - Executes a single batch query to fetch relevant records from the \`routing_events\` table based on collected \`lead_id\`s (to determine if a user has already started onboarding).
3. **Queue Processing**: Iterates through the batch:
   - For **email**, checks if the user is unsubscribed. If not, it builds personalized and unsub links, selects an A/B tested subject line, builds an HTML email template, and sends the email via the provider (Resend). If the user hasn't started the onboarding (checked against the batched routing events data) and hasn't completed the drip campaign, the next step is scheduled.
   - For **WhatsApp**, retrieves the user's phone number and sends the configured template payload via the webhook provider.
4. **Bulk Updates/Inserts**:
   - The results of processing (successes and failures) are tracked in memory.
   - A single bulk insert operation adds all next-step queue entries.
   - A series of queued update operations asynchronously mark the processed queue rows as \`sent\`, \`failed\`, or \`cancelled\`.
