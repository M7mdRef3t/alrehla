# Auto Health Check Notifications Logic Flow

## Goal
To notify administrators of critical system health issues in real-time via Telegram, replacing local storage logging.

## Mental Model
- The system checks health automatically.
- The system needs to inform the admin if things go wrong.
- Telegram provides immediate push notifications.

## Inputs / Outputs
- Inputs: Health check results containing issues.
- Outputs: Telegram message dispatched.

## States
- `idle`
- `sending`
- `sent`
- `error`

## Transitions
1. `idle -> sending` when critical issues detected.
2. `sending -> sent` when Telegram API responds OK.
3. `sending -> error` when Telegram API fails.

## Edge Cases
- Empty issues list.
- Network failure during Telegram API call.

## Failure & Fallback
- If Telegram notification fails, log error to console.

## Performance Constraints
- Target complexity: O(1) notification dispatch.

## Security Constraints
- Validation rules: Verify health check format.
- Authorization boundary: None.
- Sensitive data handling: None.

## Acceptance Criteria
1. Telegram message is sent when health score drops or critical issues arise.
