# Session OS And Admin Paths

## Scope
- Session intake and prep flows
- Admin session console
- Admin path generation and audit endpoints
- Session followup cron

## Entry Points
- `app/sessions/intake/page.tsx`
- `app/sessions/prep/[requestId]/page.tsx`
- `app/admin/sessions/page.tsx`
- `app/api/admin/sessions/route.ts`
- `app/api/admin/sessions/map-nodes/route.ts`
- `app/api/admin/paths/generate/route.ts`
- `app/api/admin/paths/audit/route.ts`
- `app/api/cron/sessions/followup/route.ts`

## Flow 1: Session Intake To Prep
1. User opens `/sessions/intake`.
2. Intake form posts to `POST /api/sessions/intake`.
3. Backend creates or enriches the session request payload in Supabase-backed storage.
4. User is redirected to `/sessions/prep/[requestId]`.
5. Prep page requests AI/session context through `POST /api/sessions/prep-form` and `POST /api/sessions/ai-brief`.

## Flow 2: Admin Session Console
1. Owner opens `/admin/sessions`.
2. Screen loads `SessionOSConsole` and fetches session records through `GET /api/admin/sessions`.
3. Optional node-map enrichment is fetched through `GET /api/admin/sessions/map-nodes`.
4. Admin reviews session state, summaries, and operational followups from one console.

## Flow 3: Admin Path Generation
1. Admin opens the path tools from the dashboard.
2. UI submits generation input to `POST /api/admin/paths/generate`.
3. API composes AI/system signals and returns a candidate path.
4. Audit and validation can be run via `POST /api/admin/paths/audit`.
5. Generated path output is shown in the Paths dashboard widgets for iteration or intervention.

## Flow 4: Followup Cron
1. Vercel cron hits `GET /api/cron/sessions/followup`.
2. Handler loads completed sessions that still require followup.
3. Handler sends followup email content using the configured email service.
4. Sent followups are recorded to avoid duplicate delivery.

## Operational Notes
- Supabase public and service-role credentials are required for the session and admin APIs.
- Email provider configuration is required for followup delivery.
- The cron path is safe to deploy only when `CRON_SECRET` and backend envs are configured.

## 2026-04-12 Stability Update (PR #128)
- Activation wizard render stability was tightened in `StepWelcome` and `StepSendProof` to prevent production type/build breaks.
- Marketing catchall in `app/(marketing)/p/[...catchall]/page.tsx` now supports a guarded fallback path when Plasmic marketing is disabled.
- Sensory providers were hardened to remove unsafe typing and split haptics helper logic into `src/components/providers/sensoryHaptics.ts`.
- CI install step now retries `npm ci` up to 3 attempts to handle transient network failures during dependency setup.

## 2026-04-12 Landing Render Guard (PR #129)
- Home rendering in `app/client-app-shell.tsx` now validates Puck payload before rendering `PuckLandingAdapter`.
- If CMS payload exists but has no renderable blocks (for example `content: []`), the app falls back to default `Landing` instead of showing a blank body.

## 2026-04-12 Marketing Gateway Fallback (PR #130)
- `src/services/marketingGatewayService.ts` now returns safe default gateway configs when Supabase client/admin credentials are unavailable.
- This prevents diffusion metrics screens from throwing runtime errors on production domains that don't expose admin service-role configuration to client-side flows.

## 2026-04-12 User State API Fail-Safe (Hotfix)
- `app/api/user/state/route.ts` now degrades gracefully on Supabase schema/table errors and storage write failures.
- Instead of returning `500` for non-critical persistence failures, the endpoint returns safe fallback responses to keep client hydration and intervention generation running.
