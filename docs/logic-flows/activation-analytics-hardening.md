# Activation + Analytics Hardening (PR #134 follow-up)

## Why this flow note exists
- This update documents the production behavior after hardening activation/admin analytics and review-driven fixes.
- It satisfies the Logic Flow gate by explicitly capturing runtime rules for API auth, ingestion compatibility, and admin lead rendering.

## 1) Admin Funnel API auth flow
**File:** `app/api/admin/analytics/funnel/route.ts`

### Request contract
- Endpoint: `GET /api/admin/analytics/funnel`
- Auth input: `code` query param OR `Authorization: Bearer <secret>`

### Runtime behavior
1. If Supabase config or `SOVEREIGN_ADMIN_SECRET` is missing => return `503 Service unavailable`.
2. Resolve `code` from query/header.
3. If `code !== SOVEREIGN_ADMIN_SECRET` => return `401 Unauthorized`.
4. If authorized, fetch the 30-day routing events subset and aggregate unique sessions into funnel counters.

### Security intent
- No auth bypass by sending a random `Authorization` header.
- No hardcoded fallback secret in code path.

## 2) Analytics ingestion compatibility flow
**File:** `app/api/analytics/route.ts`

### Request contract
- Endpoint: `POST /api/analytics`
- Payload validated by Zod schema with `.passthrough()`

### Runtime behavior
1. Validate payload size and required shape.
2. Keep unknown fields (backward compatibility for older clients).
3. Resolve user identity only from verified bearer token.
4. Write to `routing_events` with server-side `occurred_at`.
5. Return controlled errors (`400/413/500/503`) without filesystem writes.

### Operational intent
- Serverless-safe logging behavior (no file append).
- Preserve ingestion for old clients sending extra fields.

## 3) Activation back navigation flow
**File:** `app/activation/page.tsx`

### Behavior
- Back action uses `router.push("/pricing")` instead of `window.location.href`.
- Keeps Next.js SPA navigation semantics and avoids full page reload.

## 4) Marketing leads modal rendering flow
**File:** `src/components/admin/dashboard/MarketingOps/CampaignLeadsModal.tsx`

### Behavior
- Removed fixed-height virtualization strategy.
- Leads render as a normal mapped list to avoid variable-content clipping/overlap.
- Hook order is stable regardless of modal open/closed state.

### UX intent
- Long notes / AI summaries render fully without row height assumptions.
