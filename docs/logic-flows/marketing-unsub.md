# Marketing Unsubscribe Logic Flow

## Overview
This logic flow dictates the procedure for securely handling unsubscribe tokens within the marketing component.

## Token Generation Security (Unsub Secret)
The application relies on an HMAC token validation for verifying that unsubscribe requests are valid.
This requires a `UNSUB_SECRET` environment variable.

If this is missing, the system checks `CRON_SECRET`. If both are missing, rather than failing insecurely or reverting to a hardcoded string, the system generates an ephemeral secure random 32-byte hex string via `crypto.randomBytes()`. This ephemeral string is maintained in memory per instance/session runtime context, ensuring session-bound link generation and validations still operate securely, while logging a loud warning.
