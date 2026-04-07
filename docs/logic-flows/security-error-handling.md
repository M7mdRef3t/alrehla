# Secure Error Handling Logic Flow

## Context
When upstream services fail or unexpected exceptions occur, the raw error objects and stack traces can sometimes leak sensitive configuration or infrastructure details.

## Logic Flow
1. **Error Interception**: Errors thrown during API execution are caught in `catch` blocks.
2. **Formatting**: The system utilizes a helper function (`toErrorMessage`) to convert `unknown` errors into strings.
3. **Environment Segregation**:
   - `if (process.env.NODE_ENV !== 'development')`
   - In production or non-development environments, the function returns a generic fallback string: `"An unexpected error occurred"`.
   - The actual error trace is still preserved in server-side logs and telemetry (like the AI telemetry payload) to ensure observability without compromising security to the client.
   - In development mode, the raw error message is returned to aid local debugging.

## Affected Components
- AI Facilitator Agent (`app/api/chat/agent/route.ts`)
- Cron Alert Sweeps (`app/api/cron/alert-sweep/route.ts`)
- Cron Marketing Outreach (`app/api/cron/marketing-outreach/route.ts`)
- Inject Mock/Dev Routes (`app/api/dev/inject-mock/route.ts`)
- Gemini Action Routes (`app/api/gemini/[action]/route.ts`)
