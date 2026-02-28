# Admin Overview Updates

Updated `OverviewPanel` to use strict `OverviewStats` type for remote stats, eliminating the use of `any` type for payload.

## Payload Changes

- Replaced `any` with `OverviewStats` in `OverviewPanel` state
- Ensures strictly typed response matching admin API
