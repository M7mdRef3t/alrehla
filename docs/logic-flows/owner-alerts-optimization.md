# Owner Alerts Polling Optimization

## Overview
The `pollOwnerAlerts` function in `AppRuntimeControllers.tsx` is responsible for fetching new alerts (visitors, logins, installs) and dispatching notifications to the system owner.

## Previous Flow (Sequential)
1. Fetch alerts from API.
2. Iterate over `newVisitors.sessionIds`, `await` a notification for each.
3. Iterate over `logins.sessionIds`, `await` a notification for each.
4. Iterate over `installs.sessionIds`, `await` a notification for each.
5. Process milestone achievements.

## New Flow (Concurrent)
1. Fetch alerts from API.
2. Create an empty array `notificationPromises`.
3. Iterate over `newVisitors`, `logins`, and `installs`. For each, `push` the unawaited `sendOwnerNotification` Promise into the array.
4. `await Promise.all(notificationPromises)` to execute all dispatches concurrently.
5. Process milestone achievements.

This resolves an N+1 scaling bottleneck in the polling lifecycle.
