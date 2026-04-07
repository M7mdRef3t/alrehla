# AI Content Validation Flow

## Overview
This logic flow documents how AI-generated content is validated against the application's core principles before being executed or surfaced to the user.

## Trigger
The flow is triggered whenever the `DecisionEngine` evaluates a decision of type `generate_daily_question`, `generate_content_packet`, `generate_recovery_script`, or `content_generated` which fall under the `AUTONOMOUS_WITH_LOG` autonomy level.

## Validation Process
1. The `DecisionEngine.evaluate()` method calls the private `validateContentQuality()` method.
2. The `validateContentQuality` method extracts text content from known payload structures, such as:
   - `generatedQuestion.text`
   - `greeting`
   - `missionDescription`
   - `doSay`
   - `dontSay`
3. Each extracted string is passed to `isAlignedWithPrinciples()` from `CORE_PRINCIPLES.ts`.
4. If any content violates the core principles (e.g., toxic positivity, guru speak), the decision is marked as requiring human approval, and the specific violations are logged as the reason for rejection.
5. If all content passes, the decision is executed autonomously and logged.

## Related Code
- `src/ai/decision-framework.ts`
- `src/ai/CORE_PRINCIPLES.ts`
