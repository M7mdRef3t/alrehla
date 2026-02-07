# Weekly Release Report - Example (Week 1)

## Report Info
- Week: `2026-W06`
- Date Range: `2026-02-01 -> 2026-02-07`
- Prepared By: `Core Team`
- Current Wave: `Wave 1`

## Feature Flags Snapshot
- `dawayir_map`: `on`
- `journey_tools`: `on`
- `basic_diagnosis`: `on`
- `pulse_check`: `on`
- `ai_field`: `on`
- `mirror_tool`: `off`
- `family_tree`: `off`
- `internal_boundaries`: `off`
- `generative_ui_mode`: `off`
- `global_atlas`: `off`

## Access Validation
- `user` sees only enabled features: `PASS`
- `developer/admin/owner/superadmin` see all features: `PASS`
- Locked UX message is consistent: `PASS`

## KPI Summary
- Activation Rate: `61%`
- D1 Retention: `34%`
- D7 Retention: `N/A` (first week baseline)
- Daily Mission Completion: `37%`
- Crash-Free Sessions: `99.2%`
- API Error Rate: `0.8%`
- Locked Feature Clicks (per 100 users): `42`
- Locked Click Return Rate: `76%`

## AI Guardrails
- Locked-tool suggestion violations count: `0`
- Family-tree blocked fallback behavior: `PASS`
- Agent tool execution errors (top 3):
1. `navigate(person:nodeId)` on stale node id
2. `addOrUpdateSymptom` on node بدون analysis
3. transient API timeout in AI response stream

## Wave Gate Decision
- Ready for next wave: `NO`
- Reason: لازم دورة بيانات كاملة تشمل D7 retention الحقيقي.
- Missing conditions:
1. D7 retention for two consecutive weekly reports
2. stable mission completion trend for 2 weeks

## Incidents & Rollback
- Incidents this week: `1` (Pulse modal loop, fixed)
- Any rollback executed: `NO`

## Actions for Next Week
1. Monitor `locked click -> return` by source screen (`Landing`, `Tools`, `Sidebar`).
2. Improve stale-node guardrails in agent person navigation flow.
3. Validate `developer` role provisioning path in production profiles.

## Sign-off
- Product: `Approved`
- Engineering: `Approved`
- Data/Analytics: `Approved with D7 pending`
