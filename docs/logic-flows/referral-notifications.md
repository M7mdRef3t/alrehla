# Referral Notifications Logic Flow

## Context & Purpose
When a new user successfully registers using an existing user's referral code, the referrer should be notified and rewarded for bringing a new member to the journey.

## Trigger
- New user completes registration and validation
- `applyReferralCodeAsync(code, myEmail)` is called in `src/services/referralEngine.ts`.

## Execution Flow
1. Check if the provided `code` is valid and the referrer can be identified in `marketing_leads`.
2. Determine if the new user `myEmail` has already been recorded for this referrer.
3. If not, add `myEmail` to the `referred_users` array.
4. Increment `referral_count` and `earned_weeks` for the referrer in the database.
5. Invoke the Supabase edge function `send-email`.
   - Prepare a localized Arabic email template (`html` and `text`).
   - Pass the newly calculated `earned_weeks` and `referral_count` into the email body.
   - Dispatch the email to `referrer.email`.
6. Handle any errors quietly via `try-catch` to avoid breaking the core referral logic if the notification fails.

## Edge Cases Handled
- Missing `SUPABASE_SERVICE_ROLE_KEY` or misconfigured functions.
- Repeated/duplicate referral attempts (checked via `rUsers.includes(myEmail)`).
- Edge function failures do not block the lead metadata update.

## Related Components
- `src/services/referralEngine.ts`
- Supabase Edge Function: `send-email`
