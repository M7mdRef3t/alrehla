# Auto Health Check Notifications Logic Flow

## Goal
To notify administrators in real-time about critical system health issues detected by the auto-health checker using an email integration.

## Mental Model
- The auto-health check runs periodically (e.g. hourly) and evaluates system status.
- When critical issues are detected, the system needs to alert the administrators so they can intervene immediately.
- This flow ensures critical problems aren't silently stored in `localStorage` but are broadcast to external channels via email.

## Inputs / Outputs
- Inputs: `HealthCheckResult` (with `critical` status)
- Outputs: An email sent via the `/api/admin/health-alert` route, which invokes the Supabase `send-email` edge function to alert the admin.

## States
- `evaluating`
- `detected_critical`
- `notification_sent`
- `notification_failed`

## Transitions
1. `evaluating -> detected_critical` when score is low or critical issues are identified.
2. `detected_critical -> notification_sent` when `notifyAdmin` successfully invokes the API route and the email is sent.
3. `detected_critical -> notification_failed` when the API route or edge function throws an error.

## Edge Cases
- Network issues: The client-side fetch wrapper handles network errors gracefully without blocking the application.

## Failure & Fallback
- If the `/api/admin/health-alert` API fails: The error is logged to the console without crashing the health check.
- Local Storage history: The fallback logic using `localStorage` was removed entirely in favor of immediate telegram alerts.

## Performance Constraints
- Target complexity: O(1) for alerting.
- Max latency: Fetch request is non-blocking (fire-and-forget async IIFE).
- Memory constraints: Negligible.

## Security Constraints
- Validation rules: Payload formatting handles missing properties safely.
- Authorization boundary: None required (server to telegram).
- Sensitive data handling: Excludes PII from health check logs.

## Acceptance Criteria
1. Critical health checks trigger `notifyAdmin`.
2. `notifyAdmin` formats a Markdown string describing the issues.
3. `notifyAdmin` invokes the `/api/admin/health-alert` endpoint with the payload.
4. Failures in sending notifications are caught and don't halt the rest of the health checker.
