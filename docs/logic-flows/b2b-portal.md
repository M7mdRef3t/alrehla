# B2B Portal Logic Flow

## Goal
Manage B2B interactions, including coach registration, client addition, and joining a coach, providing a streamlined portal for B2B features.

## Mental Model
- The system handles roles for coaches and regular users linking via invite codes.
- Users access different views ("landing", "coach_register", "coach_dashboard", "client_share", "join_coach") depending on their B2B role and status.

## Inputs / Outputs
- Inputs: User actions (register as coach, add client, join coach), Form fields (name, role, specialty, client code, client alias, invite code).
- Outputs: UI state changes (view transitions), Supabase updates (coach registration, profile updates).

## States
- `landing`: Default entry point.
- `coach_register`: Form for registering as a new coach.
- `coach_dashboard`: Dashboard for registered coaches to manage clients.
- `client_share`: View to display the user's share code.
- `join_coach`: Form to join a coach via an invite code.

## Transitions
1. `landing -> coach_register` when the user chooses to register as a coach.
2. `coach_register -> coach_dashboard` when registration is successful.
3. `landing -> join_coach` when the user has an invite code.
4. `join_coach -> landing` on success or cancel.
5. `landing -> client_share` to share tracking code with a coach.

## Edge Cases
- Invalid or already used invite code handling.
- Trying to join a coach when not logged in.
- Empty coach name/client code handling.

## Failure & Fallback
- If joining coach fails: Show an error message (joinMessage).
- If coach data fetch fails: Default to landing view.

## Performance Constraints
- Target complexity: O(1) for state transitions.
- Max latency: UI updates should be immediate; API calls within 1-2 seconds.

## Security Constraints
- Validation rules: Verify invite code existence and `used` status.
- Authorization boundary: Supabase session check required to associate `coach_id`.

## Acceptance Criteria
1. Users can register as a coach.
2. Coaches can view and add clients to their dashboard.
3. Users can copy their share code to give to coaches.
4. Users can successfully join a coach using an invite code.
