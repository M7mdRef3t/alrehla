# Graph Projection Engine Logic Flow

## Goal
Translates the Map psychological state into a Knowledge Graph framework linking nodes with Consciousness Vectors. This supports semantic search and deeper structural analysis.

## Mental Model
- The system processes user's internal nodes ("Daira").
- Each node and related patterns are transformed into vectors.
- These vectors are connected via weighted relationships like ORBITS or EXHIBITS to the Seeker node.

## Inputs / Outputs
- Inputs: `userId`, `MapNode[]`
- Outputs: Updates to `consciousness_vectors` and `consciousness_edges` in Supabase.

## Transitions
1. Fetch/ensure 'Seeker' vector.
2. Iterate through each MapNode, ensuring vector representation.
3. Establish edge weights based on node state (e.g. Ring color).
4. Establish pattern edges if insights are available.

## Failure & Fallback
- Fails safely on DB exceptions, logging errors without disrupting standard user flow.
