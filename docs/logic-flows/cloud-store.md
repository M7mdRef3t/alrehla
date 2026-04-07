# Cloud Store Logic Flow

## Purpose
Manages state synchronization between the client device and the remote API (`USER_STATE_ENDPOINT`). Ensures user preferences and session data are persisted securely.

## Authentication and Security
The `cloudStore.ts` uses dual tokens for secure requests:
1. \`Authorization\` header containing the user's `authToken`.
2. \`x-device-token\` header containing a securely generated device-specific token.

### Device Token Generation
Device tokens are explicitly required to be cryptographically secure to prevent spoofing or session hijacking.

**Flow:**
1. Check if token exists in \`localStorage\` (`dawayir-device-token`). If yes, return it.
2. If no, attempt generation via \`window.crypto.randomUUID()\`.
3. If \`randomUUID\` is unavailable, fallback to \`window.crypto.getRandomValues()\`.
4. If the browser does not support \`window.crypto\`, it **fails securely** by throwing an error (`Secure random number generation is not supported by this browser.`). \`Math.random()\` must NEVER be used for token generation.
