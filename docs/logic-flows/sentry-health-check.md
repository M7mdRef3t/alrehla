# Auto Health Check Sentry Integration

In production, the `autoHealthCheck` script now relies on Sentry to capture errors rather than checking `localStorage`.
Critical health check results are also submitted directly to Sentry via `Sentry.captureException`.
