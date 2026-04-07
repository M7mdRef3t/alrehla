# Revenue Automation Logic Flow

## Goal
Automate the aggregation of revenue metrics (MRR, ARR, active user counts by subscription tier) by pulling real-time data from Supabase. Provide the necessary context to Gemini for revenue and pricing optimization.

## Mental Model
- The system periodically calculates revenue performance.
- It determines the number of free, premium, and coach users.
- It aggregates financial numbers and forwards the report to the AI Decision Engine for pricing suggestions.

## Inputs / Outputs
- Inputs: Current state of `profiles` table in Supabase.
- Outputs: `RevenueMetrics` object containing total users, breakdown, MRR, ARR, churn, and conversion rates.

## States
- `idle`: Awaiting scheduled execution.
- `analyzing`: Fetching data from Supabase and performing aggregation logic.
- `success`: Metrics calculated successfully and returned.
- `error`: Failed to fetch data from Supabase.

## Transitions
1. `idle -> analyzing` when periodic job triggered.
2. `analyzing -> success` when data successfully aggregated.
3. `analyzing -> error` when Supabase query fails or throws an exception.

## Edge Cases
- Missing Supabase connection or credentials.
- Zero profiles returned from the database.
- Zero users in a specific tier (handling division by zero for ARPU and Conversion rates).

## Failure & Fallback
- If Supabase fails, catch error and return `null`.
- The scheduled job logs the failure and gracefully exits.

## Performance Constraints
- Target complexity: `O(n)` where n is the number of profiles.
- Need a more scalable solution for `count` endpoints when profiles scale beyond memory limits, but simple `select` iteration is used temporarily.

## Security Constraints
- Needs proper service role or authenticated requests when running in production.

## Acceptance Criteria
1. Successfully queries Supabase `profiles` table.
2. Accurately maps roles and subscription status to tiers (Coach, Premium, Free).
3. Calculates MRR and ARR correctly based on current `TIER_PRICES_USD`.
4. Handles division by zero gracefully.
