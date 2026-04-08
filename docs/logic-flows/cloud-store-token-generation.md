# Cloud Store Token Generation Logic Flow

## Goal
Enforce strictly secure generation of device tokens and eliminate fallback to insecure `Math.random()`.

## Mental Model
- The system requires a device token to identify clients.
- The token MUST be generated using cryptographically secure methods (`crypto.randomUUID()` or `crypto.getRandomValues()`).
- If an environment does not support these methods, it is inherently insecure and the system should "fail-closed" by throwing an error rather than attempting an insecure fallback.

## Inputs / Outputs
- Inputs: Environment crypto API (`window.crypto`).
- Outputs: A secure `dev_...` prefixed token string.

## States
- `token_exists`: Found in local storage.
- `crypto_supported`: Secure crypto API is available.
- `crypto_unsupported`: Secure crypto API is not available.

## Transitions
1. `idle -> token_exists`: Reads from local storage successfully.
2. `idle -> crypto_supported -> token_generated`: Uses `window.crypto` to generate and save a secure token.
3. `idle -> crypto_unsupported -> error`: Throws an error.

## Edge Cases
- `window.crypto.randomUUID` is missing but `window.crypto.getRandomValues` is available (falls back to `getRandomValues`).

## Failure & Fallback
- If token generation fails (due to unsupported crypto APIs), it throws a hard error. No silent fallbacks to `Math.random()` are permitted.

## Performance Constraints
- Target complexity: O(1)
- Max latency: < 5ms

## Security Constraints
- Validation rules: Token MUST be generated using CSPRNG.
- Authorization boundary: Client-side identity assertion.
- Sensitive data handling: `Math.random()` is prohibited.

## Acceptance Criteria
1. Token is retrieved from local storage if available.
2. If absent, token is generated via `randomUUID` or `getRandomValues`.
3. If neither crypto method is available, an Error is thrown indicating lack of secure random number generation.
