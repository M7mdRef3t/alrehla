/* eslint-disable @typescript-eslint/no-explicit-any */
import confetti from 'canvas-confetti';

export const triggerConfetti = (durationInSeconds = 2) => {
    const end = Date.now() + durationInSeconds * 1000;
    
    // Emerald / Indigo palette to match Dawayir's vibe
    const colors = ['#34d399', '#818cf8', '#ffffff', '#10b981'];

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
        });
        
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
};

export const triggerLevelUp = () => {
    // A single burst from the center for leveling up
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#4ade80', '#60a5fa', '#fcd34d', '#3b82f6', '#10b981']
    };
  
    function fire(particleRatio: number, opts: any) {
      confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio)
      }));
    }
  
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
};
