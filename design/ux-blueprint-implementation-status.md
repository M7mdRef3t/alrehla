# Alrehla UX Blueprint - Implementation Status

Date: 2026-03-06

## Discovery Pass

### Already exists in codebase
- Sanctuary mode: `src/modules/dawayir/DawayirApp.tsx` (`isSanctuary` overlay).
- Orbit map + quick add + node detail:
  - `src/components/CoreMapScreen.tsx`
  - `src/modules/map/MapCanvas.tsx`
  - `src/components/AddPersonModal.tsx`
  - `src/components/ViewPersonModal.tsx`
- Mission screen: `src/components/MissionScreen.tsx`
- Pulse check: `src/components/PulseCheckModal.tsx`
- Trajectory/dashboard surfaces:
  - `src/components/TrackingDashboard.tsx`
  - `src/components/JourneyTimeline.tsx`
  - `src/components/Trajectory/TrajectoryDashboard.tsx`
- Educational library: `src/components/EducationalLibrary.tsx`
- Settings/profile: `src/components/SettingsScreen.tsx`

### Duplicated/legacy patterns found
- Multiple navigation paradigms existed together:
  - Legacy mobile bottom nav in `src/App.tsx`
  - Internal tab system in map context (`src/components/TabNavigation.tsx`)
- Blueprint-aligned 5-tab shell was not mapped clearly in mobile app-level nav.

## Executed in this task

- Updated app-level mobile bottom navigation in `src/App.tsx` to blueprint-aligned tabs:
  - `الخريطة` -> `map`
  - `المسار` -> `tools`
  - `النبض` -> opens `PulseCheckModal`
  - `المكتبة` -> opens `EducationalLibrary`
  - `أنا` -> `settings`
- Unified internal map tab dock (`src/components/TabNavigation.tsx`) with the same 5-tab model and callbacks wired from `CoreMapScreen`/`App`.
- Enforced sanctuary behavior for app chrome:
  - Hide mobile tab bar and floating chrome while any sanctuary/emergency context is active (`showBreathing`, `showCocoon`, `isEmergencyOpen`) via `resolveLandingChromeVisibility`.
- Removed mobile nav duplication:
  - Internal map dock (`TabNavigation`) and `LayoutModeSwitcher` now render on desktop/tablet only (`md+`), while mobile uses the app-level 5-tab bar only.

## Validation

- TypeScript check: passed (`npm run typecheck`).
- ESLint: passed (`npm run lint`).
- Production build: passed (`npm run build`).
