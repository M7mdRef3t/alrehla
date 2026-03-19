import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

/**
 * StoryCanvas - Full-screen cinematic background canvas.
 * Forked from DawayirCanvas.jsx - keeps particle system and animation loop,
 * replaces nodes with full-screen image rendering + mood-based particles.
 */
const StoryCanvas = forwardRef(({ mood, isStale = false, uiLanguage = 'ar', sceneAltText = '' }, ref) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const imageRef = useRef(null);        // Current displayed image
  const targetImageRef = useRef(null);   // Image to transition to
  const prevImageRef = useRef(null);     // Previous image for crossfade
  const imageOpacityRef = useRef(0);     // Current image opacity (0-1)
  const targetOpacityRef = useRef(0);    // Target opacity
  const crossfadeProgressRef = useRef(1); // 0=showing old, 1=showing new (complete)
  const moodRef = useRef(mood || 'ambient_calm');

  // Cache gradients to avoid re-creation on every frame
  const bgGradientRef = useRef(null);
  const vignetteGradientRef = useRef(null);

  // Mood-based particle color mapping
  const MOOD_COLORS = {
    ambient_calm: { r: 100, g: 200, b: 255, speed: 0.15 },
    tense_drone: { r: 255, g: 80, b: 60, speed: 0.4 },
    hopeful_strings: { r: 120, g: 255, b: 120, speed: 0.2 },
    mysterious_wind: { r: 180, g: 120, b: 255, speed: 0.25 },
    triumphant_rise: { r: 255, g: 215, b: 0, speed: 0.3 },
  };

  const isShatteringRef = useRef(false);

  // Define profound mood shifts that trigger shattering
  const isSevereShift = (oldMood, newMood) => {
    const opposites = {
      hope: ['nightmare', 'anger', 'anxiety'],
      ambient_calm: ['tense_drone'],
      wonder: ['confusion', 'loneliness'],
    };
    return opposites[oldMood]?.includes(newMood) || opposites[newMood]?.includes(oldMood);
  };

  useEffect(() => {
    if (moodRef.current && moodRef.current !== mood && isSevereShift(moodRef.current, mood)) {
      isShatteringRef.current = true;
      setTimeout(() => {
        isShatteringRef.current = false;
        if (canvasRef.current) {
          canvasRef.current.classList.remove('scene-image--shatter');
        }
      }, 1800); // match animation duration
    }
    moodRef.current = mood || 'ambient_calm';
  }, [mood]);

  // Initialize particles
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        // Native directional tendency
        dirX: Math.random() > 0.5 ? 1 : -1,
        dirY: (Math.random() - 0.5) * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  // Expose methods for scene image transitions
  useImperativeHandle(ref, () => ({
    setImage: (base64, mimeType) => {
      const img = new Image();
      img.onload = () => {
        // Save current image as previous for crossfade
        if (imageRef.current) {
          prevImageRef.current = imageRef.current;
          crossfadeProgressRef.current = 0; // Start crossfade from old image
        }
        targetImageRef.current = img;
        targetOpacityRef.current = 1;
      };
      img.src = `data:${mimeType};base64,${base64}`;
    },
    clearImage: () => {
      targetOpacityRef.current = 0;
      prevImageRef.current = null;
    },
  }));

  // Handle resize and recreate gradients
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext('2d');

      // Create and cache Background Gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 1.2);
      bgGrad.addColorStop(0, '#0a0a14');
      bgGrad.addColorStop(1, '#030305');
      bgGradientRef.current = bgGrad;

      // Create and cache Vignette Gradient
      const vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
      vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
      vignetteGradientRef.current = vignetteGrad;
    };

    handleResize(); // Initial setup
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const lerp = (a, b, t) => a + (b - a) * t;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Background gradient (Use cached)
      if (bgGradientRef.current) {
        ctx.fillStyle = bgGradientRef.current;
        ctx.fillRect(0, 0, w, h);
      }

      // Helper: draw an image in "cover" mode
      const drawCover = (img, alpha, blurPx) => {
        ctx.globalAlpha = alpha;
        if (blurPx > 0.1) {
          ctx.filter = `blur(${blurPx}px)`;
        } else {
          ctx.filter = 'none';
        }
        const imgRatio = img.width / img.height;
        const canvasRatio = w / h;
        let dw, dh, dx, dy;
        if (imgRatio > canvasRatio) {
          dh = h; dw = h * imgRatio; dx = (w - dw) / 2; dy = 0;
        } else {
          dw = w; dh = w / imgRatio; dx = 0; dy = (h - dh) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
      };

      // 2. Scene image with cinematic crossfade transition
      if (targetImageRef.current && targetOpacityRef.current > 0) {
        imageOpacityRef.current = lerp(imageOpacityRef.current, targetOpacityRef.current, 0.03);

        if (imageOpacityRef.current > 0.01) {
          if (targetImageRef.current !== imageRef.current && imageOpacityRef.current > 0.5) {
            imageRef.current = targetImageRef.current;
          }
        }
      } else {
        imageOpacityRef.current = lerp(imageOpacityRef.current, 0, 0.03);
      }

      // Advance crossfade
      if (crossfadeProgressRef.current < 1) {
        crossfadeProgressRef.current = Math.min(1, crossfadeProgressRef.current + 0.015);
      }

      const cfProgress = crossfadeProgressRef.current;
      const baseAlpha = Math.min(imageOpacityRef.current, 0.85);

      // Draw previous image (fading out) during crossfade
      if (prevImageRef.current && cfProgress < 1 && baseAlpha > 0.01) {
        const prevAlpha = baseAlpha * (1 - cfProgress);
        // Slight zoom-out on the old image for cinematic feel
        const prevScale = 1 + (cfProgress * 0.03);
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(prevScale, prevScale);
        ctx.translate(-w / 2, -h / 2);
        drawCover(prevImageRef.current, prevAlpha, cfProgress * 4);
        ctx.restore();
      }

      // Draw current image (fading in)
      if (imageRef.current && baseAlpha > 0.01) {
        const curAlpha = cfProgress < 1 ? baseAlpha * cfProgress : baseAlpha;
        const blurFactor = cfProgress < 1 ? (1 - cfProgress) * 8 : (0.85 - baseAlpha) * 15;
        // Slight zoom-in on new image
        const newScale = cfProgress < 1 ? 1.02 - (cfProgress * 0.02) : 1;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(newScale, newScale);
        ctx.translate(-w / 2, -h / 2);
        drawCover(imageRef.current, curAlpha, blurFactor);
        ctx.restore();

        // Cleanup prev after crossfade complete
        if (cfProgress >= 1) {
          prevImageRef.current = null;
        }

        // Image Latency Fallback: Grade Shift
        if (isStale) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '14px Inter, sans-serif';
          ctx.textAlign = 'center';
          const msg = uiLanguage === 'ar' ? 'يتم تعديل المشهد البصري...' : 'Adjusting visual stream...';
          ctx.fillText(msg, w / 2, h - 30);
        }
      }

      // 3. Vignette overlay (Use cached)
      if (vignetteGradientRef.current) {
        ctx.fillStyle = vignetteGradientRef.current;
        ctx.fillRect(0, 0, w, h);
      }

      // 4. Mood-based particles
      const moodConfig = MOOD_COLORS[moodRef.current] || MOOD_COLORS.ambient_calm;
      // Set fillStyle ONCE per frame for all particles
      ctx.fillStyle = `rgba(${moodConfig.r}, ${moodConfig.g}, ${moodConfig.b}, 0.6)`;

      particlesRef.current.forEach((p) => {
        // Smoothly adjust speed towards target based on mood and its native direction multiplier
        const targetSpeedX = p.dirX * moodConfig.speed;
        const targetSpeedY = p.dirY * moodConfig.speed;

        p.speedX = lerp(p.speedX, targetSpeedX, 0.005);
        p.speedY = lerp(p.speedY, targetSpeedY, 0.005);

        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.globalAlpha = p.opacity;
        // Use fillRect instead of beginPath/arc/fill for extreme performance boost
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={sceneAltText || (uiLanguage === 'en' ? 'Story scene background' : 'خلفية مشهد القصة')}
      width={window.innerWidth}
      height={window.innerHeight}
      className={[
        'story-canvas',
        `story-canvas--${String(mood || 'ambient_calm').replace(/_/g, '-')}`,
        isShatteringRef.current ? 'scene-image--shatter' : '',
      ].filter(Boolean).join(' ')}
      style={{
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
});

export default StoryCanvas;
