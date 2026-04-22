# 🚀 Al-Rehla Deployment Guide (Next.js Only)

This project has been unified to run exclusively on **Next.js 14**. The hybrid Vite-Next.js setup has been removed to ensure architectural consistency and performance.

## 🏗️ Production Build
```bash
npm run build
```

## 🌐 Environment Variables (Vercel)

### Client-Side (Public)
* `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase API URL.
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anonymous key.
* `NEXT_PUBLIC_SENTRY_DSN`: (Optional) Sentry client DSN.

### Server-Side (Secrets)
* `SUPABASE_SERVICE_ROLE_KEY`: **CRITICAL**. Never expose to client.
* `GEMINI_API_KEY`: Google AI credentials.
* `ADMIN_API_SECRET`: Secret for securing admin dashboard endpoints.
* `CRON_SECRET`: Secret for verifying Vercel Cron requests.

## 🚀 Deployment (Vercel)
The project is optimized for **Vercel**. All routing and API handlers are within the `app/` directory using Next.js App Router.

1. Connect `M7mdRef3t/alrehla` to Vercel.
2. Select **Next.js** framework.
3. Configure the env vars listed above.
4. Deploy.

### GitHub Actions deploy
This repo also includes a direct deploy workflow on `push` to `main`:

- Workflow: `.github/workflows/vercel-deploy.yml`
- Required GitHub secret: `VERCEL_TOKEN`
- Vercel project IDs are pinned from `.vercel/project.json`

If the workflow says the token is missing, add `VERCEL_TOKEN` in GitHub repo settings under **Secrets and variables > Actions**.

---
*Motto: Kill the Deceiver with Science.*
 🛡️ [ARCHITECTURE.md](./ARCHITECTURE.md) | 🧠 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
