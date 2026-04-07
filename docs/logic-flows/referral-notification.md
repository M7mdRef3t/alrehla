# Referral Edge Function Notification

## Context / Context
Added a fire-and-forget notification mechanism via Supabase Edge Functions when a user's referral code is applied successfully.

## Components / Components
*   **src/services/referralEngine.ts**: Updated \`applyReferralCode\` to asynchronously query the referrer's email and invoke the \`send-email\` edge function.

## Flow / Flow
1. User applies a referral code.
2. \`applyReferralCode\` updates local storage with the applied code.
3. If Supabase is ready, an async IIFE fires.
4. The DB is queried for the \`marketing_leads\` row where \`referral_code\` matches.
5. If found, the \`send-email\` Supabase edge function is invoked to notify the referrer that they have earned a premium week.

## Security & Edge Cases / Security
*   **Non-blocking**: The edge function invocation is wrapped in an async IIFE so the main synchronous thread of \`applyReferralCode\` is not blocked or modified.
*   **Fail-safe**: The DB call and function invocation are wrapped in a \`try/catch\` block. A failure to send the email will log a console error but will not disrupt the referral registration flow.
