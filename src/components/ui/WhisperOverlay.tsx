'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Global dispatch helper to trigger whispers from anywhere
export const injectWhisper = (text: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sovereign-whisper', { detail: { text } }));
  }
};

interface Whisper {
  id: string;
  text: string;
  x: number;
  y: number;
  rotation: number;
}

export function WhisperOverlay() {
  const [whispers, setWhispers] = useState<Whisper[]>([]);

  useEffect(() => {
    const handleWhisper = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      const newWhisper: Whisper = {
        id: Math.random().toString(36).substr(2, 9),
        text: customEvent.detail.text,
        // Random edges coordinates mapping:
        x: Math.random() > 0.5 ? Math.random() * 20 : 80 + Math.random() * 15, // near left or right edge in VW
        y: Math.random() * 80 + 10, // Avoid absolute top/bottom in VH
        rotation: (Math.random() - 0.5) * 10 // slight tilt
      };

      setWhispers(prev => [...prev, newWhisper]);

      // Remove after lingering
      setTimeout(() => {
        setWhispers(prev => prev.filter(w => w.id !== newWhisper.id));
      }, 7000);
    };

    window.addEventListener('sovereign-whisper', handleWhisper);
    return () => window.removeEventListener('sovereign-whisper', handleWhisper);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
      <AnimatePresence>
        {whispers.map(whisper => (
          <motion.div
            key={whisper.id}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 0.15, filter: 'blur(1px)' }} // stays very faint
            exit={{ opacity: 0, filter: 'blur(5px)' }}
            transition={{ duration: 3, ease: 'easeInOut' }}
            className="absolute text-xl font-arabic font-thin text-white mix-blend-overlay tracking-widest"
            style={{
              left: `${whisper.x}vw`,
              top: `${whisper.y}vh`,
              transform: `rotate(${whisper.rotation}deg)`,
              textShadow: '0 0 10px rgba(255,255,255,0.2)'
            }}
            dir="rtl"
          >
            {whisper.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
