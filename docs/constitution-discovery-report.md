# Constitution Discovery Report

## Scope
Review alignment between current codebase and the Al-Rehla wave-based launch constitution.

## Already Implemented
- Centralized feature flags are in place (`src/config/features.ts`).
- Effective access with role-based bypass exists (`src/utils/featureFlags.ts`).
- Admin feature flag controls are present (`src/components/admin/AdminDashboard.tsx`).
- Locked feature modal flow exists (`src/components/FeatureLockedModal.tsx`).
- Agent context carries available feature access (`src/agent/types.ts`, `src/App.tsx`).
- Agent prompt and runner include locked-feature constraints (`src/agent/prompt.ts`, `src/agent/runner.ts`).
- Family tree lineage contract exists via `treeRelation.parentId` with schema validation (`src/utils/mapNodeSchema.ts`).

## Duplications / Risk Points
- Sidebar has desktop/mobile duplicated sections, increasing lock-behavior drift risk (`src/components/AppSidebar.tsx`).
- Some screens include role checks separate from flag checks; consistency depends on shared helpers.

## Changes Applied In This Pass
- Restricted advanced map views to privileged roles only (not just explicit `user`) in `src/components/CoreMapScreen.tsx`.
- Tuned map color scale to improve yellow/grey separation in `src/modules/map/MapCanvas.tsx` and `src/components/CoreMapScreen.tsx`.
- Updated option amber styling for clearer hierarchy in `src/utils/optionColors.ts`.
- Improved result screen visual hierarchy for clarity and scanability in `src/components/AddPersonModal/ResultScreen.tsx`.
- Added operational rule files: `.cursorrules` and `docs/platform-constitution-summary.md`.

## Remaining Recommended Work
- Extract shared sidebar action renderer to remove desktop/mobile duplication.
- Add an integration test covering role + flag combinations for map view modes.
- Add lock-click analytics to measure demand for upcoming wave features.
