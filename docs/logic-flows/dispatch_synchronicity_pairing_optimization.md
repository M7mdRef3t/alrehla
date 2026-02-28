# Optimization of `dispatchSynchronicityPairings`

## Motivation
Previously, the `dispatchSynchronicityPairings` function inside the `ResonanceMonitor` service iteratively looped through all unpaired pioneers to match them with a complementary partner using a Supabase RPC function (`find_resonance_partner`), followed immediately by a database insertion. This resulted in O(N) database RPC queries and O(N) database insertions, meaning it suffered from extreme N+1 scaling issues resulting in network delay and potential locking/race conditions during overlapping concurrent runs.

## Logic Flow Changes
1. Data for all unpaired pioneers is now fetched in a single Supabase `select` query, incorporating their `awareness_vector`.
2. The logic used in `find_resonance_partner` (finding the highest complementary score by measuring symmetry (RS), velocity (AV), integrity (BI), and entropy (SE) dimensions) is reproduced in an in-memory O(N^2) evaluation loop entirely in TypeScript.
3. Newly established matches are aggregated into a `newPairs` array.
4. Instead of individual `insert` queries per match, the accumulated array is dispatched via a single bulk `insert` operation to Supabase, reducing the total network round-trips to exactly two (1 Fetch + 1 Insert).

## Auxiliary Changes
Alongside this fix, numerous UI fixes (e.g. SwarmStatusBadge, AwarenessSkeleton, type augmentations in journeyTracking.ts/Recharts) were included to pass CI requirements.
