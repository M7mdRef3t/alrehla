# Admin Overview Updates

Updated `OverviewPanel` to use strict `OverviewStats` type for remote stats, eliminating the use of `any` type for payload.

## Payload Changes

- Replaced `any` with `OverviewStats` in `OverviewPanel` state
- Ensures strictly typed response matching admin API

## 2026-04 Release Flow Notes

This release updates three operational flows that now move together during review and deployment:

- Marketing lead intake now supports Meta lead ingestion, safer Supabase lazy initialization during build, and manual admin resend/logging from the marketing operations panel.
- Activation and gate pages now use a split component structure, payment-proof helpers, and dedicated gate session/map completion endpoints so user-mode activation can complete without relying on dev-only wiring.
- Admin marketing operations and sovereign dashboards were expanded, so any future change to lead repair, outreach, or gate handoff should be reviewed against both the API routes in `app/api/admin/marketing-ops/*` and the admin dashboard panels in `src/components/admin/dashboard/*`.
This logic flow documentation was updated to reflect the new referrer notification edge function call.
