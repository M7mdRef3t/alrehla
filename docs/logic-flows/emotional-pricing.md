# Emotional Pricing Logic Flow

## Goal
The Emotional Pricing Engine analyzes the user's local interaction history (TEI, Shadow Pulse, journal entries) to dynamically determine their emotional state and recommend context-aware subscription or support interventions.

## Mental Model
- The system periodically (daily) assesses the user's holistic emotional trajectory.
- Based on predefined thresholds (e.g., crisis, struggling, thriving), it generates actionable recommendations.
- For users in crisis, it grants a free support month; for stable users showing high engagement, it presents a premium discount offer.

## Inputs / Outputs
- Inputs: `MapNode[]`, `DailyJournalEntry[]`, `teiHistory` (number[]), `shadowPulseHistory` (number[]), `userId` (string).
- Outputs: `UserEmotionalState` containing the evaluated state and `recommendedAction` (e.g., 'free_support', 'premium_offer', 'no_action').

## States
- `stable`
- `struggling`
- `thriving`
- `crisis`

## Transitions
1. `runDailyEmotionalCheck` is triggered periodically.
2. Data is loaded and passed to `analyzeUserState`.
3. If an action is recommended, `executeAction` is called.
4. An event is recorded, an alert is sent via Telegram, and the cooldown timestamp is stored in `localStorage`.

## Edge Cases
- Missing local history: Gracefully falls back to empty arrays and skips actionable thresholds.
- Unauthenticated users: Resolves the `userId` to "anonymous" to prevent crashes during the analysis phase.

## Failure & Fallback
- If `executeAction` encounters a recent cooldown timestamp, it gracefully skips without executing to prevent spamming the user.
- Execution failures are caught by the `try-catch` block inside `runDailyEmotionalCheck` and logged without blocking the application.

## Performance Constraints
- Target complexity: O(N) where N is the number of local historical entries (capped).
- Execution: Must run asynchronously without blocking the main UI thread.

## Security Constraints
- All analytical processing occurs locally on the client to protect journal privacy.
- Only aggregated, non-PII signals (e.g., 'crisis', 'stable_offer') are sent externally via Telegram alerts or the decision engine.

## Acceptance Criteria
1. The engine successfully parses local history and computes an emotional state.
2. Appropriate actions are triggered based on the calculated state thresholds.
3. The engine respects the internal cooldown to prevent redundant offers.
4. Unauthenticated users fallback to the ID "anonymous" gracefully.
