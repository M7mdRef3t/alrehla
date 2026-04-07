# PWA Install Logic

## Overview
This document describes the logic flow for managing the PWA installation experience across different devices and browsers.

## Core State
The PWA install state is managed by the `usePWALogic` hook, which keeps track of:
- Whether the app is running in a standalone display mode.
- The `beforeinstallprompt` event.
- Whether the user is on an iOS or Android device.
- Whether the user is using an in-app browser.
- Banner visibility and dismissal states.

## Device & Environment Detection
- **Standalone Mode:** Checks if `window.matchMedia("(display-mode: standalone)").matches` or `navigator.standalone` is true.
- **In-App Browser:** Uses regex on the user agent to detect browsers like Facebook, Instagram, TikTok, Snapchat, etc.
- **Device Type:** Uses user agent parsing and `maxTouchPoints` to identify iOS, iPadOS, and Android devices.

## Event Listeners
- `beforeinstallprompt`: Captured to allow manual triggering of the install prompt later. Only active in non-standalone modes and production environments.
- `appinstalled`: Listens for successful installation to clean up the state and set the standalone mode to true.
- `matchMedia("(display-mode: standalone)")`: Listens for dynamic changes to the display mode.

## Installation Flow
1. **Trigger Install (`triggerInstall`):**
   - If the `beforeinstallprompt` event (`installEvent`) exists, it prompts the user using `installEvent.prompt()` and awaits `installEvent.userChoice`.
   - If the event is missing (e.g., on iOS), it falls back to showing instructions via `showInstallInstructions`.
2. **Show Hint (`showInstallHint`):**
   - Forces the installation banner to appear. If no `installEvent` exists, it immediately shows the relevant platform instructions.
3. **Dismiss Banner (`dismissBanner`):**
   - Hides the banner and records the dismissal timestamp in `localStorage` for a week to prevent nagging the user.

## Platform-Specific Instructions
When native installation prompts are unavailable, manual instructions are shown:
- **In-App Browsers:** Prompts the user to open the page in Chrome/Safari.
- **Android:** Directs the user to the browser menu -> "Add to Home screen".
- **iOS:** Directs the user to the Share menu -> "Add to Home screen".
- **Desktop:** Directs the user to the browser menu -> "Install app".
