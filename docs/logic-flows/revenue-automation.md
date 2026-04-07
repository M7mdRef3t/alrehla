# Revenue Automation Logic Flow

## analyzeCurrentMetrics
1. Gets a Supabase Admin client using `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`.
2. Queries the `profiles` table to retrieve `role` and `subscription_status` for all users.
3. Iterates over the retrieved profiles to aggregate total users, free users, premium users, and coach users.
4. Calculates the Monthly Recurring Revenue (MRR) based on the current active subscriptions.
5. Calculates the Annual Recurring Revenue (ARR).
6. Computes standard metrics like Average Revenue Per User (ARPU) and Lifetime Value (LTV).
