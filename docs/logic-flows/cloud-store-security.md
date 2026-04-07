# Cloud Store Security Updates

## Background
The Cloud Store handles remote synchronization of app settings. One crucial part of the authentication mechanism is generating a device token.

## Token Generation Mechanism
To ensure predictability in testing and absolute security in production, tokens must not be generated using Math.random().
- In browsers supporting Web Crypto, `crypto.randomUUID()` or `crypto.getRandomValues()` is used to construct the token.
- In legacy browsers, the system must fail closed (throw an error) to prevent predictable token generation risks.
