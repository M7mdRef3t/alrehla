import { useEffect } from 'react';

/**
 * Ambient Screen Sync — dynamically updates the browser theme-color
 * and CSS custom properties based on the current emotional mood.
 * Creates an immersive feeling where the entire device UI matches the story.
 */

const MOOD_THEMES = {
  ambient_calm: { themeColor: '#0a1a2a', glow: 'rgba(100, 200, 255, 0.08)', statusBar: '#0a1a2a' },
  tense_drone: { themeColor: '#1a0a0a', glow: 'rgba(255, 80, 60, 0.10)', statusBar: '#1a0a0a' },
  hopeful_strings: { themeColor: '#0a1a0f', glow: 'rgba(120, 255, 120, 0.08)', statusBar: '#0a1a0f' },
  mysterious_wind: { themeColor: '#120a1e', glow: 'rgba(180, 120, 255, 0.08)', statusBar: '#120a1e' },
  triumphant_rise: { themeColor: '#1a1500', glow: 'rgba(255, 215, 0, 0.10)', statusBar: '#1a1500' },
};

export default function useAmbientSync(mood, isActive) {
  useEffect(() => {
    if (!isActive) return;

    const theme = MOOD_THEMES[mood] || MOOD_THEMES.ambient_calm;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme.themeColor);
    }

    document.documentElement.style.setProperty('--ambient-glow', theme.glow);
    document.documentElement.style.setProperty('--ambient-theme', theme.themeColor);

    return () => {
      if (meta) meta.setAttribute('content', '#030305');
      document.documentElement.style.removeProperty('--ambient-glow');
      document.documentElement.style.removeProperty('--ambient-theme');
    };
  }, [mood, isActive]);
}
