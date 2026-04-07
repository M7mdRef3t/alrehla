# Intervention Engine

This document outlines the high-level logic flow for the Intervention Engine, particularly regarding the persistence of identified interventions.

## Discovery Phase

The `interventionEngine` analyzes a user's recent pulse logs (typically the last 7 days) and identifies patterns that require intervention. These patterns are based on:
1. Low Mood Streaks (e.g. 3 consecutive days with mood <= 2).
2. Stress Overloads (e.g. repeating stress tags).
3. Energy Crashes (e.g. a sudden drop of 2+ points in 2 days).

These form a set of `findings`.

## Persistence Phase

To save these new interventions to the database (`interventions` table), we adhere to the following optimized bulk persistence pattern:

1. Collect the intervention types from the newly identified findings.
2. Query the existing interventions for the user within a rolling lookback window (e.g. 24 hours).
3. We fetch these using a single `in` query checking against the collected finding types.
4. Filter out any findings that correspond to a type that has already been recorded within the lookback window.
5. Bulk insert any remaining new interventions using a single `.insert([...])` network call.

This eliminates N+1 queries when processing intervention findings concurrently, preserving database connection pools and accelerating the background evaluation loops.
