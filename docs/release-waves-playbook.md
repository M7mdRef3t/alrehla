# Release Waves Playbook (Al-Rehla)

## Goal
Ship in controlled waves to maximize retention, reduce overload, and keep technical risk low.

## Wave 1 (Awakening) - default for regular users
### Active
- `dawayir_map`
- `journey_tools`
- `basic_diagnosis`
- `pulse_check`
- `ai_field` (text assistant only)

### Locked (Coming Soon)
- `mirror_tool`
- `family_tree`
- `internal_boundaries`
- `generative_ui_mode`
- `global_atlas`

## Wave 2 (Control)
- Unlock in order:
1. `internal_boundaries`
2. `mirror_tool`
3. `generative_ui_mode` (beta first)

## Wave 3 (Roots)
- Unlock in order:
1. `family_tree`
2. `global_atlas`

## Access Model
- `user`: sees only effective access from flags.
- `admin`, `owner`, `superadmin`, `developer`: God Mode (all features enabled).

## Source of Truth
- Feature definitions/defaults: `src/config/features.ts`
- Effective access and role bypass: `src/utils/featureFlags.ts`
- Admin controls: `src/components/admin/AdminDashboard.tsx`

## Locked UX Contract
- Disabled features never return 404 from UI clicks.
- Use `FeatureLockedModal` with one consistent message.
- Keep teaser entries visible for roadmap anticipation where needed.

## AI Contract
- Inject `availableFeatures` into agent context.
- Do not suggest or execute locked tools.
- For locked requests, use approved fallback response and route to current-wave alternatives.

## Data Integrity Contract
- Family lineage is represented with `treeRelation.parentId` in node JSON.
- Validate node schema during load/save.
- Preserve lineage data in export/import even when family-tree UI is locked.

## Rollback Criteria
Immediately turn off newly enabled flags if any of these happen:
- crash-free < 98.5%
- API error rate > 2%
- conversion drop > 20% over 24h

## Operations Checklist (before enabling any feature)
1. Confirm current flag values in Admin Dashboard.
2. Verify role behavior (`user` vs privileged roles).
3. Run smoke flow: Landing, Tools, Map, Locked modal, AI fallback.
4. Monitor first 60 minutes after release.
