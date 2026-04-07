# Ghosting Simulator Logic Flow

## Feature
Ghosting Simulator Modal

## Triggers
- When the user clicks the Ghosting Simulator button from the ViewPersonModal ("انسحاب تكتيكي").

## Data Required
- Person node ID
- Weekly and monthly energy drain calculations based on `node.energyBalance.transactions` from the past 7 days.

## Business Rules
- Calculate the total negative energy drain connected to the person over the last 7 days.
- Extrapolate the monthly drain (weekly * 4).
- If the weekly drain > 0, provide an option to ask the AI Oracle for a withdrawal plan.
- Use `useAppOverlayState.getState().openOverlay('journeyGuideChat')` to trigger the TherapistChatModal which acts as the AI Oracle.

## Edge Cases
- If the user has no energy drain history with the person, display a safe state message.
