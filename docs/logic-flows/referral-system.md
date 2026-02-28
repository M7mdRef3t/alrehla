# Referral System Logic Flow

## Context
This document covers the referral engine enhancements made to notify users when their referral code is used.
Additionally, some related frontend type fixes and component cleanup are bundled within this flow context.

## State Transitions
When a user applies a referral code:
1. `applyReferralCode` checks if it's the user's own code or if a code was already applied.
2. If valid, the code is saved.
3. A fire-and-forget Supabase Edge Function (`notify-referrer`) is invoked with `referrerCode` and `referredByCode`.

## Effects
- The edge function logs and processes the referral usage notification.
- UI validation errors resolved to ensure application stability across components.
