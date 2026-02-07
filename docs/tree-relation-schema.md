# Tree Relation Schema Contract

## Why this exists
The app stores relationship nodes in JSON (`journey_maps.nodes` and `user_state.data`) instead of a dedicated SQL `nodes` table.

For family-tree lineage, the equivalent of `nodes.parent_id` is:
- `MapNode.treeRelation.parentId`

## Contract
`treeRelation` is valid only when all fields are valid:
- `type`: one of `family | work | social`
- `parentId`: `string | null`
- `relationLabel`: non-empty `string`

Invalid `treeRelation` objects are dropped during local state hydration and save sanitization.

## Enforcement
- Validation runs in `src/utils/mapNodeSchema.ts`.
- Local load/save path uses this validator in `src/services/localStore.ts`.

This keeps schema integrity from day one, even when family-tree UI is feature-flagged off.
