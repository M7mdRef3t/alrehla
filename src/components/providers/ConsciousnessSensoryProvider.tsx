'use client';

import React, { useEffect, useRef } from 'react';
import { consciousnessTheme } from '@/ai/consciousnessThemeEngine';

type SensoryInputType = 'motion' | 'scroll';
type SensoryAwareTheme = {
  handleSensoryInput?: (type: SensoryInputType, value: number) => void;
};

export function ConsciousnessSensoryProvider({ children }: { children: React.ReactNode }) {
  const lastMousePos = useRef({ x: 0, y: 0, time: Date.now() });

  useEffect(() => {
    const sensoryTheme = consciousnessTheme as SensoryAwareTheme;

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
        if (typeof sensoryTheme.handleSensoryInput === 'function') {
          sensoryTheme.handleSensoryInput('motion', normalizedVelocity);
        }

        lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
      }
    };

    // 2. Scroll Velocity Tracker
    const handleScroll = () => {
      // Basic modulation
      if (typeof sensoryTheme.handleSensoryInput === 'function') {
        sensoryTheme.handleSensoryInput('scroll', window.scrollY);
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
