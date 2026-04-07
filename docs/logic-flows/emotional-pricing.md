# Emotional Pricing Logic Update

Updated the Emotional Pricing Engine to correctly utilize the authenticated user ID rather than a hardcoded placeholder.

## Change Details

- Replaced the hardcoded `userId: "current-user"` with `getAuthUserId() || "anonymous"`.
- This ensures that when `runDailyEmotionalCheck` runs or `analyzeUserState` is executed, the context of the user being analyzed correctly matches their actual session id, linking the emotional pricing data correctly to their account instead of aggregating it under a single "current-user" placeholder.
