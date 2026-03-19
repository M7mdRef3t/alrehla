/**
 * Haptic Pulse — uses Navigator.vibrate() to add tactile feedback
 * at dramatic story moments. Progressive enhancement: no-op if unsupported.
 */

const PATTERNS = {
  sceneReveal: [40, 30, 60],
  choiceMade: [20],
  redirect: [30, 20, 30, 20, 50],
  ending: [80, 50, 80, 50, 120],
  nightmare: [60, 30, 60, 30, 60, 30, 100],
};

function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail on unsupported devices
    }
  }
}

export function hapticSceneReveal() {
  vibrate(PATTERNS.sceneReveal);
}

export function hapticChoiceMade() {
  vibrate(PATTERNS.choiceMade);
}

export function hapticRedirect() {
  vibrate(PATTERNS.redirect);
}

export function hapticEnding() {
  vibrate(PATTERNS.ending);
}

export function hapticNightmare() {
  vibrate(PATTERNS.nightmare);
}
