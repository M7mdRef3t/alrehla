# Resonance Monitor Logic Flow

## Context
The Resonance Monitor handles scheduled and event-based dispatching of nudges, riddles, and pairings.

## Optimization: Pre-Ionization Riddle
The `dispatchPreIonizationRiddle` function handles the "T-Minus 45m Riddle Dispatcher".
Previously, it used a loop to insert individual `resonance_nudge_logs` into Supabase for each pioneer, leading to an N+1 query issue.

### Change
- Fetches all pioneers.
- Maps pioneers to an array of log payloads.
- Executes a single bulk insert using `supabase.from('resonance_nudge_logs').insert(payloads)`.
- If successful, it loops through the pioneers in-memory to preserve the console logging behavior.

This significantly reduces network overhead.
