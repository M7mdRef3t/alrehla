# 🧠 Al-Rehla Service Architecture (The Engines)

Welcome to the core intelligence layer of the platform. With over 130 service files, maintaining architectural integrity is critical.

## 🛡️ The Service Guard (Rule #1)
**Always use the Discovery Pass before creating a new service.**
- Search by keyword (e.g., `rg "Engine"`, `rg "Sync"`) to see if the logic already exists.
- Check `src/services/README.md` (this file) for categorization.
- If a service exists but is incomplete, **extend it** instead of creating a duplicate.

---

## 📂 Service Categories

### 1. 🏗️ Foundations (Core)
Low-level infrastructure used by the entire app.
- `authService.ts`: User lifecycle and sessions.
- `supabaseClient.ts`: Direct DB interface (Admin vs Anon).
- `i18n.ts`: Cultural and linguistic adaptation.
- `config/appEnv.ts`: Environment mode management (`user` vs `dev`).

### 2. 🧬 The Engines (Intelligence)
Analytical processors that transform raw interaction data into insights.
- `EnergyROIEngine.ts`: Calculates the "ROI of Energy" for relations.
- `FlowEngine.ts`: Manages the state of the "Invisible Budget".
- `GrowthEngine.ts`: Tracks behavioral trajectory.
- `ShadowEngine.ts`: Handles subconscious pattern detection.

### 3. 🔄 Sync Layers (State Management)
Orchestrators that ensure the UI, Local Storage, and DB are in perfect harmony.
- `mapSync.ts`: Synchronizes the Orbit Map across devices.
- `gamificationSync.ts`: Handles points, streaks, and achievements.

### 4. 📢 Outreach & Growth (Marketing)
Systems for manual and automated user engagement.
- `marketingLeadService.ts`: Lead ingestion and CRM integration.
- `whatsappAutomationService.ts`: Atomic handling of WhatsApp inbound/outbound.
- `emailService.ts`: Newsletter and transactional flow engine.

### 5. 🎭 Generative Narratives (Maraya)
Logic specific to the storyteller side of the project.
- `mirrorLogic.ts`: The "Emotional Mirror" algorithm.
- `chronicleGenerator.ts`: Generates visual/textual narratives from user sessions.

---

## 🛠️ Performance & Concurrency
- **Atomic Operations:** Use PostgreSQL RPCs (like `upsert_marketing_lead_v2`) for critical data ingestion to prevent race conditions.
- **Caching:** Use `browserStorage.ts` for optimistic UI updates in low-connectivity scenarios.
