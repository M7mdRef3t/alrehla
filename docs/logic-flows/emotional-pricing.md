# Emotional Pricing Engine

## Daily Emotional Check
The `EmotionalPricingEngine` runs a daily background check (`runDailyEmotionalCheck`) to evaluate the user's emotional state.
It analyzes local journal entries and history.

- The `analyzeUserState` method relies on the `getAuthUserId()` to properly identify the current user.
- A fallback of `"anonymous"` is used if the user ID is not available.

## Interventions
Based on the emotional state (e.g., "crisis" or "thriving"), the system can intervene by granting a free month or offering a premium discount.
