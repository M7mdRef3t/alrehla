# Auto Health Check Notifications Logic Flow

## Goal
To notify administrators of critical system health issues in real-time via email notifications using Supabase Edge Functions, replacing local storage logging.

## Mental Model
- The system checks health automatically.
- The system needs to inform the admin if things go wrong.
- Email provides immediate push notifications.

## Inputs / Outputs
- Inputs: Health check results containing issues.
- Outputs: Email dispatched via Supabase edge function.

## States
- `idle`
- `sending`
- `sent`
- `error`

## Transitions
1. `idle -> sending` when critical issues detected.
2. `sending -> sent` when Supabase edge function responds successfully.
3. `sending -> error` when Supabase edge function fails.

## Edge Cases
- Empty issues list.
- Network failure during edge function call.

## Failure & Fallback
- If edge function fails, log error to console.

## Performance Constraints
- Target complexity: O(1) notification dispatch.

## Security Constraints
- Validation rules: Verify health check format.
- Authorization boundary: None.
- Sensitive data handling: Email content could contain sensitive application state.

## Acceptance Criteria
1. Email message is sent when health score drops or critical issues arise.
