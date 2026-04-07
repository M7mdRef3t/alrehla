# Auto Health Check Logic Flow

## Goal
The auto health check monitors the application's runtime health, including console errors, state consistency, and storage integrity, taking corrective action or notifying administrators when necessary.

## Mental Model
- The system runs silently in the background (every hour).
- It aims to proactively detect errors and anomalies.
- Using Sentry integration in production provides reliable remote error logging and admin notifications for critical alerts.

## Inputs / Outputs
- Inputs: Application state, localStorage, performance APIs.
- Outputs: HealthCheckResult containing score and severity.

## States
- `idle`
- `checking`
- `resolved` (auto-fixed)
- `escalated` (notified admin)

## Transitions
1. `idle -> checking` when timer triggers.
2. `checking -> resolved` if issues are auto-fixable.
3. `checking -> escalated` if critical issues remain.

## Edge Cases
- Missing localStorage API (e.g., restricted mode).
- Sentry initialized vs uninitialized.

## Failure & Fallback
- If Sentry fails, relies on local console logs.

## Performance Constraints
- Target complexity: Minimal background processing.
- Max latency: N/A (background task).
- Memory constraints: No heavy accumulations in history arrays.

## Security Constraints
- Validation rules: Securely handles notification payloads.
- Authorization boundary: Admins only.
- Sensitive data handling: Excludes PII from health alerts.

## Acceptance Criteria
1. Successfully detects and logs health issues.
2. Uses Sentry for tracking critical alerts in production.
3. Fixes trivial storage inconsistencies.
