# Platform Access Bootstrap (Supabase + Vercel)

## Goal
Configure full operational access once, then reuse it in all future sessions without re-entering credentials.

## One-time requirements
Set these values once on your machine:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_API_SECRET`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `VERCEL_TOKEN`

## Commands

1. Health check:

```powershell
npm run access:doctor
```

2. Bootstrap + persist credentials:

```powershell
npm run access:bootstrap
```

3. Re-check:

```powershell
npm run access:doctor
```

## Notes

- `access:bootstrap` updates `.env.local` for project runtime keys.
- `access:bootstrap` also persists keys at user environment scope for future terminal sessions.
- Supabase CLI auth is performed via token and verified.
- Vercel auth is verified via token (`vercel whoami --token`).
