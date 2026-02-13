# Add Person Flow State Machine

This document maps the current runtime flow from pressing `إضافة شخص` to closing the result screen.

## Entry Point

- Trigger button: `src/components/CoreMapScreen.tsx` (`setShowAddPerson(true)`).
- Modal mount: `src/components/AddPersonModal.tsx`.
- Flow analytics on mount: `recordFlowEvent("add_person_opened")`.

## State Machine

1. `select`
- Component: `SelectPersonStep`.
- Required: title selection (preset or custom).
- Optional: display name.
- Family-only optional relation link.
- Continue -> `quickQuestions`.
- Close -> `add_person_dropped` with `{ atStep: "select" }`.

2. `quickQuestions`
- Component: `QuickQuestionsStep`.
- Captures:
  - `quickAnswer1` (energy drain),
  - `quickAnswer2` (safety/space),
  - `isEmergency`.
- Continue blocked until both quick answers are selected.
- Continue -> `feeling`.
- Back -> `select`.
- Close -> `add_person_dropped` with `{ atStep: "quickQuestions" }`.

3. `feeling`
- Component: `FeelingStep` -> `FeelingCheck`.
- Captures 3 feeling answers.
- Continue blocked until all 3 are explicitly answered.
- Computes `healthScore` using `feelingScore`.
- Continue -> `position`.
- Close -> `add_person_dropped` with `{ atStep: "feeling" }`.

4. `position`
- Component: `PositionStep` -> `RealityCheck`.
- Captures 3 reality answers.
- Continue blocked until all 3 are explicitly answered.
- Ring decision:
  - if `isEmergency === true` -> `red`
  - else -> `realityScoreToRing(answers)`.
- Creates node via `useMapState.addNode(...)`.
- Emits `recordJourneyEvent("node_added", ...)`.
- Continue -> `result`.
- Back -> `feeling`.
- Close -> `add_person_dropped` with `{ atStep: "position" }`.

5. `result`
- Component: `ResultScreen` (`summaryOnly` in modal flow).
- Builds scenario text from:
  - feeling answers,
  - reality answers,
  - emergency flag,
  - `quickAnswer2` (`safetyAnswer`).
- CTA `تم، ورّيني مكانه على الخريطة` -> closes modal with `openNodeId`.
- Parent map screen then selects node and opens person card.
- Close here does not emit `add_person_dropped`.

## Persisted Node Fields

`addNode(...)` persists:
- `label`, `ring`, `goalId`,
- `analysis` (score + feeling answers + recommended ring),
- `treeRelation` (if selected),
- `detachmentMode` (red + low contact),
- `realityAnswers`,
- `isEmergency`,
- `safetyAnswer` (quick answer 2),
- mission/recovery defaults.

## Notes

- `quickAnswer1` is currently used in flow UI and analytics context but not in final ring computation.
- `suggestInitialRing(...)` helper exists but is not wired into this modal flow.
