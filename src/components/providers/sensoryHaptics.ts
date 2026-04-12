export const triggerHapticIntervention = (level: 'mild' | 'moderate' | 'crisis') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (level === 'mild') navigator.vibrate(50);
    else if (level === 'moderate') navigator.vibrate([100, 50, 100]);
    else navigator.vibrate([200, 100, 200, 100, 400]); // Heartbeat panic pattern
  }
};
