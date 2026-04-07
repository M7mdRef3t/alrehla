# Logic Flow: Error Sanitization

## Purpose
Ensure that sensitive stack traces, DB credentials, and file paths are not exposed to clients in production environments through API error responses.

## Implementation Details
In `app/api/dev/inject-mock/route.ts`, the `toErrorMessage` function has been updated:
- In non-production environments (`process.env.NODE_ENV !== 'production'`), it will extract and return `error.message` for debugging.
- In production, it will return a generic string ('An unexpected error occurred.') or a designated fallback string.

## Files Touched
- `app/api/dev/inject-mock/route.ts`
