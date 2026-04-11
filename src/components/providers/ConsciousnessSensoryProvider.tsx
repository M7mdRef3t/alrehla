'use client';

import React, { useEffect, useRef } from 'react';
import { consciousnessTheme } from '@/ai/consciousnessThemeEngine';

export function ConsciousnessSensoryProvider({ children }: { children: React.ReactNode }) {
  const lastMousePos = useRef({ x: 0, y: 0, time: Date.now() });

  useEffect(() => {
    // 1. Mouse Velocity Tracker
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dt = now - lastMousePos.current.time;
      if (dt > 50) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt; // pixels per ms
        
        // Normalize velocity to 0 - 1
        const normalizedVelocity = Math.min(velocity / 5, 1);
        document.documentElement.style.setProperty('--cursor-velocity', normalizedVelocity.toFixed(3));

        // Let consciousness engine process the motion for audio modulation
        if (typeof (consciousnessTheme as any).handleSensoryInput === 'function') {
          (consciousnessTheme as any).handleSensoryInput('motion', normalizedVelocity);
        }

        lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
      }
    };

    // 2. Scroll Velocity Tracker
    let scrollTimeout: any;
    const handleScroll = () => {
      // Basic modulation
      if (typeof (consciousnessTheme as any).handleSensoryInput === 'function') {
        (consciousnessTheme as any).handleSensoryInput('scroll', window.scrollY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return <>{children}</>;
}

// Global helper for Haptic Shocks
export const triggerHapticIntervention = (level: 'mild' | 'moderate' | 'crisis') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (level === 'mild') navigator.vibrate(50);
    else if (level === 'moderate') navigator.vibrate([100, 50, 100]);
    else navigator.vibrate([200, 100, 200, 100, 400]); // Heartbeat panic pattern
  }
};
