# Resonance Monitor Logic Flow

## Overview

The `ResonanceMonitor` orchestrates various psychological and behavioral interventions, including:
- Inactivity nudges
- Synchronicity pairing
- Pre-Ionization dispatch

## Optimization Flow: Pre-Ionization Riddle
The `dispatchPreIonizationRiddle` logic flow handles sending a systemic riddle to all pioneers:

1. Retrieve all pioneer `id`s from `profiles`.
2. Map the data into an array of insertion objects containing the user's ID, nudge type, sentiment, and riddle text.
3. Perform a single bulk array insert to the `resonance_nudge_logs` table via Supabase to record the events simultaneously and avoid an N+1 scaling bottleneck.
4. If the database insertion is successful, dispatch real-time side-effects (e.g. logging or emitting metrics). Otherwise, record an error telemetry event.

---
*Updated for bulk-insert optimization by Jules*
