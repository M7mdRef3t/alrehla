# Intervention Engine

This service processes daily pulse logs and generates "interventions" if users hit specific negative criteria.

## Flow
1. Fetch the user's pulse logs for the last 7 days.
2. Rank adaptation actions based on the current mood.
3. Check rules:
    - Rule A: Low mood streak.
    - Rule B: Stress overload.
    - Rule C: Energy crash.
4. Filter out intervention types that have already been triggered within the last 24 hours.
5. Bulk insert any new findings into the `interventions` table.

## Performance Optimization (N+1 Query Issue)
- Previously, finding insertion operated in a sequential loop mapping each finding to an individual `select` query and `insert` statement.
- This was refactored to aggregate all finding types, run a single `select * from interventions where type in (...)` query, and perform a single `.insert([...])` batch payload, resolving the N+1 latency bottleneck.
