# Owner Alerts Polling

## Overview
Describes the logic for polling and dispatching admin/owner alerts regarding platform usage and milestone achievements.

## Trigger
- Client side `setInterval` configured in `AppRuntimeControllers.tsx`.
- Runs only if `canPollOwnerAlerts` is true and environment is production.

## Steps
1. Fetch latest owner alerts from `fetchOwnerAlerts` (bypassing normal user boundaries).
2. If new visitors, logins, or installs are found, batch concurrent notifications using `Promise.all` to avoid N+1 blocking delays.
3. Determine phase one milestones (e.g., 10 registered, 10 installs, 10 added).
4. If a milestone state changed compared to local storage, push a notification request to the concurrent batch.
5. Await all notification requests.
6. Update local storage with the new milestone state and the latest generation timestamp to avoid duplicate alerts.
