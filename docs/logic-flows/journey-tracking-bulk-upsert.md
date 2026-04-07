# Journey Tracking Bulk Upsert

## Overview
When syncing anonymous tracking events to Supabase (`flushSupabaseSync`), we check for the `auth_login_success` event to perform session-to-user stitching by upserting a profile.

## The Optimization
Previously, the system would issue an individual `supabase.from('profiles').upsert()` for each matching event sequentially in a `for...of` loop.

To prevent an N+1 query problem, which blocks the event loop and increases database load, this logic was changed to:
1. Aggregate all upsert payloads into a local array `userProfileUpserts`.
2. Check if the array is non-empty.
3. Issue a single bulk `supabase.from('profiles').upsert(userProfileUpserts)`.
