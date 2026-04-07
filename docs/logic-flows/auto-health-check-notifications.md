# Auto Health Check Notifications Logic Flow

## Goal
To notify administrators in real-time about critical system health issues detected by the auto-health checker using Telegram.

## Mental Model
- The auto-health check runs periodically (e.g. hourly) and evaluates system status.
- When critical issues are detected, the system needs to alert the administrators so they can intervene immediately.
- This flow ensures critical problems aren't silently stored in `localStorage` but are broadcast to external channels like Telegram.

## Inputs / Outputs
- Inputs: `HealthCheckResult` (with `critical` status)
- Outputs: A `critical_error_alert` message sent via `TelegramBotService` to the configured admin chat.

## States
- `evaluating`
- `detected_critical`
- `notification_sent`
- `notification_failed`

## Transitions
1. `evaluating -> detected_critical` when score is low or critical issues are identified.
2. `detected_critical -> notification_sent` when `notifyAdmin` successfully calls `telegramBot.sendMessage()`.
3. `detected_critical -> notification_failed` when `telegramBot.sendMessage()` throws an error (caught internally).

## Edge Cases
- Missing Telegram configuration (`VITE_TELEGRAM_BOT_TOKEN`, `VITE_TELEGRAM_CHAT_ID`): The `TelegramBotService` remains disabled and silently drops the message.
- Circular imports: Handled using dynamic imports `await import("../services/telegramBot")` to instantiate the bot inside `notifyAdmin` without bootstrapping issues.

## Failure & Fallback
- If the Telegram API fails or throws: The error is logged to `console.error` and handled gracefully without crashing the health check.
- Local Storage history: The fallback logic using `localStorage` was removed entirely in favor of immediate telegram alerts.

## Performance Constraints
- Target complexity: O(1) for alerting.
- Max latency: Telegram request is asynchronous and happens in the background.
- Memory constraints: String manipulation for Markdown generation only.

## Security Constraints
- Validation rules: Payload formatting handles missing properties safely.
- Authorization boundary: None required (server to telegram).
- Sensitive data handling: Excludes PII from health check logs.

## Acceptance Criteria
1. Critical health checks trigger `notifyAdmin`.
2. `notifyAdmin` formats a Markdown string describing the issues.
3. `notifyAdmin` invokes `telegramBot.sendMessage` with the `critical_error_alert` type.
4. Failures in sending notifications are caught and don't halt the rest of the health checker.
