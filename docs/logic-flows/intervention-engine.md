# Intervention Engine Flow

## Purpose
The Intervention Engine analyzes user pulse data, identifies risky patterns (such as low mood streaks, stress overload, and energy crashes), and automatically suggests targeted interventions/actions to help correct the user's trajectory.

## Process
1. **Fetch Telemetry**: The system pulls the last 7 days of pulse logs (`daily_pulse_logs`) for a given user.
2. **Action Adaptation Context**: The current mood is used to retrieve ranked, adapted actions.
3. **Pattern Recognition (Rules)**:
   - *Low Mood Streak*: Detects if the user has had 3 consecutive days with mood <= 2. Suggests Red Orbit Analysis or Quick Journaling.
   - *Stress Overload*: Detects if the same stress tag appears 4 or more times in 7 days. Suggests Rebalancing Circles or Map Focus.
   - *Energy Crash*: Detects a sudden drop of 2+ points in energy between consecutive days. Suggests Quick Journaling or Map Focus.
4. **Intervention Generation & Persistence**:
   - For all identified findings, the system performs a bulk query (`.in('type', types)`) to verify if interventions of these types have already been created in the last 24 hours.
   - Newly discovered findings that don't already have an active intervention are batched and persisted via a single bulk `insert` into the `interventions` table to avoid N+1 query latency.

## Performance Considerations
The finding generation logic requires high database throughput when run at scale. Sequential database lookups and inserts are avoided by utilizing bulk `.in()` queries for duplicate checks, followed by batch array insertion.
