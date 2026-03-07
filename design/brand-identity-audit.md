# Brand Identity Audit - Platform Coverage (User Mode)

Date: 2026-03-05
Scope: User-facing runtime (`VITE_APP_ENV=user`) + shared UI foundation.

## 1) What already matches the identity book
- Brand artifacts exist:
  - `design/brand-identity.html`
  - `design/design-system.html`
  - `design/tokens.json`
- Global design-system stylesheet is loaded in app shell:
  - `app/globals.css` imports `src/styles/design-system.css`
- Design tokens are applied at runtime from `design/tokens.json`:
  - `app/client-app.tsx` calls `applyDesignSystemTokens()`
  - `src/services/designSystemTokens.ts` flattens tokens to `--ds-*` vars
- Core brand fonts are present globally:
  - `Almarai` + `IBM Plex Sans Arabic` via `app/globals.css`

## 2) Gaps (not fully implemented platform-wide)
- Dual style foundation still active:
  - New tokenized system: `src/styles/design-system.css`
  - Legacy theme layer: `src/styles.css` (many non-token vars like `--soft-teal`, `--warm-amber`, `--color-primary`)
- Mixed component styling:
  - Some surfaces use `ds-*` components/classes
  - Many surfaces still use ad-hoc Tailwind/custom color classes directly
- Brand-book chapters not fully enforced as product rules:
  - Voice/tone matrix and forbidden-word policy are not centralized as runtime copy guard across all UI copy
  - Logo usage/safe-area/variants are documented but not enforced in a reusable logo system package/component set
  - Print/social application chapter is documented, not represented as production app modules (expected but still "not platform-applied")
- User-mode content constraints partly applied, but some pages still carry mixed visual language from older system.

## 3) Duplicate / non-active / partial items
- Duplicate styling source of truth (primary risk):
  - `src/styles.css` vs `src/styles/design-system.css`
- User-mode gating exists but some UX branches still depend on older styling tokens.
- Feature gating evidence (partial/disabled UX options):
  - `src/components/GoalPicker.tsx` keeps only `family` enabled in user mode and marks others as `??????`.

## 4) Execution plan (practical)
1. **Single Source of Truth**
   - Freeze new UI styling on `--ds-*` tokens only.
   - Migrate legacy variables in `src/styles.css` to `--ds-*` references, then deprecate old vars.
2. **Brand primitives rollout**
   - Enforce using shared UI primitives (`Button`, `Card`, `Input`, badges) for user-mode screens.
   - Replace hardcoded color classes with semantic token vars.
3. **Copy governance**
   - Add centralized tone guard utility (from identity voice matrix) for user-facing copy blocks.
4. **Visual compliance sweep**
   - Audit top user routes (`/`, `/dawayir`, core modals) and align spacing/typography hierarchy to token scale.
5. **Definition of done**
   - No user-mode screen should rely on legacy color variables directly.
   - All major CTAs and cards must resolve from `--ds-*` token system.

## 5) Owner-centric value
- Reduces brand drift and maintenance cost.
- Makes every new screen automatically match identity without manual restyling.
- Keeps user-mode visuals stable while dev-mode can iterate safely.
