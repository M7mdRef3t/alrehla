# Referral System Logic Flow

## Referral Process
1. When a user registers using a referral code, the `applyReferralCodeAsync` function is called.
2. The system checks if the referral code is valid and the user hasn't already been referred.
3. The referrer's count and earned weeks are incremented in the `marketing_leads` table.
4. The system invokes the `notify-referrer` Supabase edge function.

## Notify Referrer Edge Function
1. The edge function receives the `referrerCode` and `newUserName`.
2. It fetches the referrer's email from the `marketing_leads` table.
3. If an email is found, it uses the Resend API to send an email notification to the referrer, thanking them for the referral.
