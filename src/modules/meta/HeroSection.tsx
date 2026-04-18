import React, { type FC, useEffect, useState, useCallback, useMemo, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Zap, Shield, Heart } from "lucide-react";
import { RotatingWord as HeroRotatingWord, SovereignMap as HeroSovereignMap } from "./HeroSectionVisuals";
    --crimson: #ff0055;
    --text-main: #ffffff;
    --text-muted: #8faab8;
    --hero-copy-measure: 46ch;
    
    /* Glassmorphism 3.0 Tokens */
    --glass-bg: rgba(5, 8, 20, 0.75);
    --glass-border: rgba(0, 240, 255, 0.25);
    --glass-reflection: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
    
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    overflow-x: hidden;
    overflow-y: clip;
    background: var(--void);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  .hero-layer {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .hero-screen-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 95% 85% at 50% 50%, transparent 35%, rgba(2,4,8,0.85) 100%);
    pointer-events: none;
    will-change: opacity;
  }

  .hero-screen-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 30% at 50% 0%, rgba(0, 240, 255, 0.06) 0%, transparent 100%);
    pointer-events: none;
    z-index: 1;
  }

  .hero-copy-column {
    flex: 1 1 0;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .hero-eyebrow-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-badge__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--cyan);
    box-shadow: 0 0 14px var(--cyan-glow);
  }

  .headline-line {
    display: flex;
    align-items: flex-start;
    min-height: 70px;
    height: auto;
    line-height: 1.2;
    overflow: visible;
    width: min(100%, var(--headline-measured-width, var(--hero-copy-measure)));
    max-width: 100%;
    margin-bottom: 0.1em;
    color: var(--amber-500);
    font-family: "Noto Kufi Arabic";
  }

  .hero-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hero-input-wrapper {
    display: flex;
    align-items: center;
    border-radius: 20px;
    overflow: hidden;
    max-width: 420px;
    position: relative;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: transform 0.3s ease;
    will-change: transform, opacity;
  }

  .hero-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 15px 20px;
    font-size: 15px;
    font-weight: 600;
    color: rgba(255, 255, 255, 1);
    font-family: "Noto Kufi Arabic";
    text-align: right;
    position: relative;
    z-index: 1;
  }

  .hero-input::placeholder {
    color: rgb(199, 220, 232);
    opacity: 1;
    font-weight: 600;
  }

  .hero-input-greeting {
    padding: 0 18px;
    font-size: 13px;
    color: var(--gold);
    font-weight: 800;
    white-space: nowrap;
    filter: drop-shadow(0 0 12px var(--gold-glow));
    position: relative;
    z-index: 1;
  }

  .hero-input-note {
    font-size: 10.5px;
    color: #627a8e;
    font-weight: 600;
    padding-right: 4px;
  }

  .hero-headline {
    font-size: clamp(2.4rem, 5.5vw, 4.4rem);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    overflow: visible;
    font-family: "Alexandria", sans-serif;
    line-height: 1.4;
    padding-top: 0.2em;
    padding-bottom: 0.2em;
    color: var(--text-main);
  }

  .hero-copy-column .hero-body {
    font-weight: 500;
    font-size: 1.1rem;
    color: rgba(255,255,255,0.85);
  }

  .hero-action-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .hero-trust-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cta-free-badge {
    font-size: 11px;
    font-weight: 700;
    color: rgba(45, 212, 191, 0.8);
    text-align: center;
    margin-top: 8px;
    letter-spacing: 0.03em;
  }

  .hero-bottom-fade {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 160px;
    pointer-events: none;
    background: linear-gradient(to top, var(--void), transparent);
  }

  .warp-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #020408;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .warp-overlay__content {
    text-align: center;
  }

  .warp-icon-shell {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cyan), #2dd4bf);
    box-shadow: 0 0 60px var(--cyan-glow);
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .warp-text {
    font-size: 14px;
    font-weight: 800;
    color: #ffffff;
    font-family: "Tajawal", sans-serif;
    letter-spacing: 0.2em;
  }

  .sovereign-map {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    max-width: 520px;
    perspective: 1200px;
    transform-style: preserve-3d;
    backface-visibility: hidden;
    will-change: transform;
  }

  .sovereign-map__atmosphere {
    position: absolute;
    inset: -18%;
    background: radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 75%);
    filter: blur(50px);
    pointer-events: none;
  }

  .sovereign-map__svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .orbit-line {
    transition: opacity 0.3s;
  }

  .orbit-ring {
    transform-origin: 190px 190px;
  }

  .orbit-ring--glow {
    filter: blur(1px) drop-shadow(0 0 4px currentColor);
  }

  .node-group {
    cursor: pointer;
  }

  .node-core {
    filter: drop-shadow(0 0 10px rgba(255,255,255,0.08));
  }

  .pulse-ring {
    animation: pulse-ring 1.4s ease-out infinite;
  }

  @keyframes pulse-ring {
    0%   { transform: scale(1);    opacity: 0.6; }
    100% { transform: scale(1.65); opacity: 0;   }
  }

  .center-core {
    transform-origin: 190px 190px;
  }

  .center-core__glow {
    filter: drop-shadow(0 0 32px var(--cyan));
  }

  .metric-card {
    position: absolute;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 16px;
    border-radius: 24px;
    min-width: 150px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    z-index: 10;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .metric-card--health {
    top: 8%;
    right: -8%;
  }

  .metric-card--drain {
    bottom: 12%;
    left: -10%;
  }

  .metric-card-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.2em;
    margin-bottom: 4px;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .metric-card-label--alert {
    color: var(--crimson);
  }

  .metric-card-value {
    font-size: 26px;
    font-weight: 900;
    color: #fff;
    font-family: "Tajawal", sans-serif;
  }

  .metric-card-value--small {
    font-size: 22px;
  }

  .metric-card-text {
    font-size: 11px;
    color: #6b8a9e;
    font-weight: 700;
  }

  .metric-card-bar {
    margin-top: 8px;
    height: 3px;
    border-radius: 2px;
    background: rgba(255,255,255,0.08);
    overflow: hidden;
  }

  .metric-card-bar__fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--cyan), #2dd4bf);
  }

  .metric-card-dots {
    margin-top: 8px;
    display: flex;
    gap: 4px;
  }

  .metric-card-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--crimson);
  }

  .legend {
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
  }

  .legend-dot--teal { color: var(--cyan); }
  .legend-dot--gold { color: var(--gold); }
  .legend-dot--crimson { color: var(--crimson); }

  .legend-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    font-family: "Tajawal", sans-serif;
  }
  .legend-label--teal { color: var(--cyan); filter: brightness(1.2); }
  .legend-label--gold { color: var(--gold); filter: brightness(1.2); }
  .legend-label--crimson { color: var(--crimson); filter: brightness(1.2); }

  .node-tooltip-body {
    background: rgba(4,8,18,0.9);
    border: 1px solid rgba(0, 240, 255, 0.27);
    border-radius: 12px;
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
    backdrop-filter: blur(6px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(0, 240, 255, 0.14);
    font-family: "Tajawal", sans-serif;
  }

  .metric-card-values {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .trust-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    border-radius: 100px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(12px);
    font-size: 11px;
    font-weight: 700;
    color: #8faab8;
  }

  .trust-icon {
    width: 13px;
    height: 13px;
    color: var(--cyan);
  }

  .warp-icon {
    width: 24px;
    height: 24px;
    fill: white;
    color: white;
  }

  .pulse-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    border-radius: 100px;
    border: 1px solid rgba(239, 68, 68, 0.2);
    background: rgba(239, 68, 68, 0.06);
    backdrop-filter: blur(12px);
  }

  .pulse-badge__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 12px #ef4444;
  }

  .pulse-badge__text {
    font-size: 11px;
    font-weight: 800;
    color: #a8bfcc;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .hero-layer--nebula,
  .hero-layer--starfield,
  .hero-layer--grid,
  .hero-layer--dust {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .hero-cta-icon {
    width: 20px;
    height: 20px;
    fill: white;
  }

  .hero-cta-icon--arrow {
    width: 18px;
    height: 18px;
  }

  .neural-dust-field {
    position: absolute;
    inset: -20%;
    background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
    background-size: 80px 80px;
    opacity: 0.15;
  }

  .warp-line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  }

  .hero-canvas {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
  }

  .hero-grid-wrapper {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    perspective: 1000px;
    transform-style: preserve-3d;
    backface-visibility: hidden;
  }

  .hero-grid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-image:
      linear-gradient(var(--cyan-glow) 1px, transparent 1px),
      linear-gradient(90deg, var(--cyan-glow) 1px, transparent 1px);
    background-size: 60px 60px;
    background-position: center bottom;
    mask-image: radial-gradient(ellipse 80% 50% at 50% 50%, black 10%, transparent 70%);
    opacity: 0.3;
    transform: rotateX(60deg) scale(1.5);
    transform-origin: center center;
    will-change: transform;
    backface-visibility: hidden;
  }

  .hero-nebula {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    background-image: 
      radial-gradient(circle at 35% 65%, rgba(0, 240, 255, 0.1) 0%, transparent 45%),
      radial-gradient(circle at 75% 25%, rgba(245, 166, 35, 0.08) 0%, transparent 45%),
      radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.05) 0%, transparent 60%);
    filter: blur(20px);
    opacity: 0.6;
  }

  .hero-starfield {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    background-image: radial-gradient(2px 2px at 40px 60px, #ffffff 50%, rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 200px 200px;
    opacity: 0.08;
    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 90%);
  }

  .hero-grain {
    position: absolute;
    inset: 0;
    opacity: 0.02;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 50;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 7px 18px;
    border-radius: 100px;
    border: 1px solid rgba(0, 240, 255, 0.25);
    background: rgba(245, 166, 35, 0.05);
    backdrop-filter: blur(12px);
    font-size: 10px;
    font-weight: 950;
    letter-spacing: 0.35em;
    color: var(--gold);
    text-transform: uppercase;
  }

  .headline-static {
    font-family: "Alexandria", sans-serif;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
    text-align: right;
  }

  .headline-accent {
    background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 40%, #5eead4 75%, #a7f3d0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 24px rgba(45,212,191,0.28));
    display: block;
    width: 100%;
  }

  .rotating-word-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 1.3em;
    padding: 0;
    overflow: visible;
    white-space: nowrap;
    font-family: "Noto Kufi Arabic";
    line-height: 1.2;
    vertical-align: middle;
    text-align: right;
  }

  .rotating-word-mobile {
    display: block;
    width: 100%;
    min-height: 1.3em;
    white-space: nowrap;
    transform: translateZ(0);
    backface-visibility: hidden;
  }

  .hero-body {
    font-size: 1rem;
    line-height: 1.9;
    color: var(--text-muted);
    width: min(100%, var(--headline-measured-width, var(--hero-copy-measure)));
    max-width: 100%;
    text-align: right;
  }

  .cta-primary {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 18px 36px;
    border-radius: 20px;
    background: rgba(0, 240, 255, 0.08);
    backdrop-filter: blur(20px) saturate(180%);
    font-size: 1.15rem;
    font-weight: 950;
    color: #fff;
    cursor: pointer;
    border: 1px solid rgba(0, 240, 255, 0.5);
    box-shadow: 0 0 40px rgba(0, 240, 255, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.15);
    transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
    white-space: nowrap;
  }

  .hero-content-wrapper {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
    padding: 7rem 2rem 6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4rem;
  }

  .map-area {
    flex: 0 0 auto;
    width: min(46vw, 520px);
    position: relative;
    padding-bottom: 56px;
  }

  .headline-subline-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    font-size: 0.78em;
    margin-top: 18px;
    width: 100%;
  }

  .headline-fixed-subline {
    display: inline-flex;
    align-items: baseline;
    gap: 0.28em;
    font-size: 1.1em;
    font-weight: 800;
    line-height: 1;
    white-space: nowrap;
  }
  .word-ant  { opacity: 0.98; font-size: 1.42em; }
  .word-faqat { opacity: 0.95; }

  @media (max-width: 1023px) {
    .hero-headline {
      font-size: clamp(1.6rem, 7.5vw, 2.4rem) !important;
      align-items: flex-start !important;
      text-align: right !important;
    }
    .headline-line {
      text-align: right !important;
      justify-content: flex-start !important;
      width: 100% !important;
      /* Prevent jitter by locking height */
      min-height: 1.4em !important;
      backface-visibility: hidden;
      transform: translateZ(0);
    }
    .headline-subline-container {
      align-items: flex-start !important;
      width: 100% !important;
    }
    .hero-content-wrapper {
      flex-direction: column !important;
      padding: 5.5rem 1rem 2rem !important;
      gap: 2rem !important;
    }
    .map-area {
      order: -1 !important;
      width: min(85vw, 320px) !important;
      margin: 0 auto !important;
      will-change: transform;
    }
    .hero-copy-column {
      max-width: 100% !important;
      align-items: center !important;
    }
    .hero-body {
      text-align: right !important;
    }
    .hero-action-row {
      align-items: center !important;
    }
    .hero-input-wrapper, .cta-primary {
      width: 100% !important;
      max-width: 320px !important;
      /* Reduce heavy blur effect on mobile to prevent shaking */
      backdrop-filter: blur(4px) !important;
      -webkit-backdrop-filter: blur(4px) !important;
    }
    .sovereign-map__atmosphere {
      /* Reduce blur intensity for performance */
      filter: blur(30px) !important;
      opacity: 0.08 !important;
    }
    .sovereign-map,
    .sovereign-map__svg,
    .metric-card,
    .hero-layer--starfield,
    .hero-layer--grid,
    .rotating-word-wrapper,
    .rotating-word-mobile {
      will-change: auto !important;
    }
    .hero-grid,
    .hero-grid-wrapper,
    .hero-starfield {
      transform: none !important;
      backface-visibility: hidden;
    }
    .metric-card {
      transform: none !important;
      box-shadow: 0 12px 24px rgba(0,0,0,0.28) !important;
    }
    .hero-eyebrow-row {
      display: none !important;
    }
    .legend {
      bottom: -10px !important;
    }
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const techEase = [0, 0.7, 0.1, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.65, ease: techEase } 
  },
};

const fadeUpWithClip = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.65, ease: techEase } 
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } },
};

/* ─── Rotating Headline Word ─────────────────────────────────────────────────── */
const LegacyRotatingWord: FC<{ isMobile: boolean }> = React.memo(({ isMobile }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % ROTATING_WORDS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (isMobile) {
    return (
      <span className="rotating-word-mobile headline-accent font-extrabold font-['Noto_Kufi_Arabic']">
        {ROTATING_WORDS[index]}
      </span>
    );
  }

  return (
    <span className="rotating-word-wrapper">
      {/* 🛡️ Anchor with the widest possible word to keep the container stable */}
      <span className="invisible select-none block whitespace-nowrap font-extrabold" aria-hidden>
        {ROTATING_WORDS.reduce((a, b) => (a.length > b.length ? a : b))}
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.45, ease: techEase }}
          className="absolute top-0 flex items-center headline-accent h-fit whitespace-nowrap leading-[1.2] overflow-visible box-content px-2 mt-0 mb-0 align-middle font-extrabold font-['Noto_Kufi_Arabic']"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
});

/* ─── Sovereign Map (Right Panel) ───────────────────────────────────────────── */
const LegacySovereignMap: FC<{ reduceMotion: boolean | null; isMobile: boolean }> = React.memo(({ reduceMotion, isMobile }) => {
  const rings = [
    { r: 68,  stroke: "rgba(0, 240, 255, 0.35)", dash: "none", dur: 22 },
    { r: 110, stroke: "rgba(245, 166, 35, 0.25)", dash: "4 14", dur: 38 },
    { r: 152, stroke: "rgba(239, 68, 68, 0.2)",   dash: "2 22", dur: 60 },
    { r: 194, stroke: "rgba(0, 240, 255, 0.15)",  dash: "1 30", dur: 90 },
  ];

  const nodes = [
    { cx: 190, cy: 190 - 68,  r: 13, color: "#00f0ff", label: "علاقة بميزانها",  w: 1.2 },
    { cx: 190 + 62, cy: 190 - 34, r: 11, color: "#00eeff", label: "دعم خاص",    w: 0.8 },
    { cx: 190 + 110, cy: 190 + 55, r: 14, color: "#f5a623", label: "نبض متذبذب",  w: 1.5 },
    { cx: 190 - 60, cy: 190 + 104, r: 10, color: "#fbbf24", label: "تشويش روح",   w: 0.9 },
    { cx: 190 - 130, cy: 190 - 65, r: 16, color: "#00d0ff", label: "احتواء حقيقي",w: 1.1 },
    { cx: 190 - 28, cy: 190 - 148, r: 12, color: "#ff0055", label: "نزيف طاقة",   w: 2.0 },
    { cx: 190 + 118, cy: 190 - 100, r: 11, color: "#ff0044", label: "حدود مهدورة", w: 1.7 },
  ];

  const [hovered, setHovered] = useState<number | null>(null);
  const toSafeRadius = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;

  return (
    <motion.div className="sovereign-map">
      <div className="sovereign-map__atmosphere" aria-hidden />
      <svg viewBox="0 0 380 380" fill="none" className="sovereign-map__svg">
        {nodes.map((n, i) => (
          <Fragment key={`nexus-${i}`}>
            <motion.line
              x1="190" y1="190" x2={n.cx} y2={n.cy}
              stroke={n.color}
              strokeWidth="0.5"
              opacity={hovered === i ? 0.6 : 0.15}
              className="orbit-line"
            />
          </Fragment>
        ))}

        {rings.map((ring, i) => {
          const safeRingRadius = toSafeRadius(ring.r, 1);
          return (
            <g key={i}>
              <motion.circle
                cx="190" cy="190" r={safeRingRadius}
                stroke={ring.stroke}
                strokeWidth="1"
                fill="none"
                style={{ transform: "translateZ(0)" }}
                animate={reduceMotion || isMobile ? {} : { rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
                transformOrigin="190px 190px"
              />
            </g>
          );
        })}

        {nodes.map((node, i) => {
          const safeNodeRadius = toSafeRadius(node.r, 1);
          return (
            <motion.g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              cursor="pointer"
            >
              <circle cx={node.cx} cy={node.cy} r={safeNodeRadius + 4} fill={node.color} opacity={0.1} />
              <circle cx={node.cx} cy={node.cy} r={safeNodeRadius} fill={node.color} />
              <AnimatePresence>
                {hovered === i && (
                  <motion.foreignObject
                    x={node.cx - 75} y={node.cy - 16}
                    width="150" height="36"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="node-tooltip-body">{node.label}</div>
                  </motion.foreignObject>
                )}
              </AnimatePresence>
            </motion.g>
          );
        })}

        <motion.g className="center-core" transformOrigin="190px 190px">
          <circle cx="190" cy="190" r="14" fill="var(--cyan)" className="center-core__glow" />
          <circle cx="190" cy="190" r="6" fill="#fff" />
        </motion.g>
      </svg>

      <div className="metric-card metric-card--health">
        <p className="metric-card-label">صحتك الداخلية</p>
        <div className="metric-card-values">
          <span className="metric-card-value">٧٨</span>
          <span className="metric-card-text">/ ١٠٠</span>
        </div>
        <div className="metric-card-bar">
          {isMobile ? (
            <div className="metric-card-bar__fill" style={{ width: "78%" }} />
          ) : (
            <motion.div className="metric-card-bar__fill" initial={{ width: "0%" }} animate={{ width: "78%" }} transition={{ duration: 1.2, delay: 0.6 }} />
          )}
        </div>
      </div>

      <div className="legend">
        {[
          { label: "توازن", color: "var(--cyan)" },
          { label: "تشتت", color: "var(--gold)" },
          { label: "استنزاف", color: "var(--crimson)" },
        ].map(({ label, color }) => (
          <div key={label} className="legend-item">
            <span className="legend-dot" style={{ color }} />
            <span className="legend-label" style={{ color }}>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

/* ─── Pulse Badge ───────────────────────────────────────────────────────────── */
const PulseBadge: FC<{ count?: number }> = React.memo(({ count: initialCount }) => {
  const [count, setCount] = useState(initialCount ?? 1947);

  useEffect(() => {
    if (initialCount !== undefined) {
      setCount(initialCount);
      return;
    }

    const interval = setInterval(() => {
      setCount(prev => {
        const fluctuation = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, prev + fluctuation);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [initialCount]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.4, duration: 0.6, ease: techEase }}
      className="pulse-badge"
    >
      <motion.span
        className="pulse-badge__dot"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      <span className="pulse-badge__text">
        {count.toLocaleString("en-US")} يستعيدون نبضهم الآن
      </span>
    </motion.div>
  );
});

/* ─── Main Hero Component ────────────────────────────────────────────────────── */
export const HeroSection: FC<HeroSectionProps> = React.memo(({
  onStartJourney,
  mirrorName,
  setMirrorName,
  pulseCount,
  trustPoints,
  ctaJourney,
  secondaryCta,
}) => {
  const reduceMotion = useReducedMotion();
  const [isWarping, setIsWarping] = useState(false);
  const [isMobileHero, setIsMobileHero] = useState(false);
  const headlineLineRef = useRef<HTMLSpanElement | null>(null);
  const [headlineMeasuredWidth, setHeadlineMeasuredWidth] = useState<number>(0);

  const globalMouseX = useMotionValue(0);
  const globalMouseY = useMotionValue(0);

  const handleGlobalMouseMove = useCallback((e: React.MouseEvent) => {
    // 🛡️ Guard: Parallax is too expensive and jittery on most mobile/touch devices
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (reduceMotion || isTouch) return;
    
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    globalMouseX.set((e.clientX - cx) / 20);
    globalMouseY.set((e.clientY - cy) / 20);
  }, [reduceMotion, globalMouseX, globalMouseY]);

  const gridX = useSpring(useTransform(globalMouseX, x => -x * 1.5), { stiffness: 45, damping: 20, mass: 0.5 });
  const gridY = useSpring(useTransform(globalMouseY, y => -y * 1.5), { stiffness: 45, damping: 20, mass: 0.5 });

  const starX = useSpring(useTransform(globalMouseX, x => -x * 0.5), { stiffness: 20, damping: 30, mass: 1 });
  const starY = useSpring(useTransform(globalMouseY, y => -y * 0.5), { stiffness: 20, damping: 30, mass: 1 });

  const warpLines = useMemo(() => (
    Array.from({ length: 40 }, (_, i) => ({
      id: `warp-line-${i}`,
      top: `${(i / 40) * 110 - 5}%`,
      width: `${15 + Math.random() * 45}%`,
      opacity: 0.15 + Math.random() * 0.55,
      delay: Math.random() * 0.4,
      duration: 0.25 + Math.random() * 0.3,
    }))
  ), []);

  useEffect(() => {
    const updateIsMobileHero = () => {
      setIsMobileHero(window.innerWidth < 768 || navigator.maxTouchPoints > 0);
    };

    updateIsMobileHero();
    window.addEventListener("resize", updateIsMobileHero);
    return () => window.removeEventListener("resize", updateIsMobileHero);
  }, []);

  useLayoutEffect(() => {
    const node = headlineLineRef.current;
    if (!node) return;

    const isMobile = window.innerWidth < 1024;
    
    const updateMeasuredWidth = () => {
      // On mobile, the width is usually predictable (screen width - padding).
      // We lock it to avoid jitter from browser chrome toggling.
      if (window.innerWidth < 1024) {
        setHeadlineMeasuredWidth(window.innerWidth - 32);
        return;
      }
      
      if (!node) return;
      const nextWidth = Math.ceil(node.getBoundingClientRect().width);
      // Only set if diff is significant to avoid sub-pixel jitter
      setHeadlineMeasuredWidth(prev => (Math.abs(prev - nextWidth) < 1 ? prev : nextWidth));
    };

    updateMeasuredWidth();
    const observer = new ResizeObserver(updateMeasuredWidth);
    observer.observe(node);
    window.addEventListener("resize", updateMeasuredWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMeasuredWidth);
    };
  }, []);

  const handleStart = useCallback(() => {
    setIsWarping(true);
    setTimeout(onStartJourney, 1200);
  }, [onStartJourney]);

  return (
    <>
      <style>{HERO_STYLES}</style>

      <section className="hero-root" dir="rtl" onMouseMove={handleGlobalMouseMove}>
        <div className="hero-canvas" aria-hidden>
          <motion.div className="hero-layer hero-layer--starfield" style={{ x: starX, y: starY }}>
            <div className="hero-starfield" />
          </motion.div>
          <motion.div className="hero-layer hero-layer--grid" style={{ x: gridX, y: gridY }}>
            <div className="hero-grid-wrapper"><div className="hero-grid" /></div>
          </motion.div>
          <div className="hero-grain" />
          <div className="hero-screen-vignette" />
          <div className="hero-screen-glow" />
        </div>

        <div className="hero-content-wrapper">
          <motion.div
            variants={stagger} initial="hidden" animate="visible"
            className="hero-copy-column"
            style={{ ["--headline-measured-width" as any]: headlineMeasuredWidth > 0 ? `${headlineMeasuredWidth}px` : undefined }}
          >
            <motion.div variants={fadeUp} className="hero-eyebrow-row">
              <span className="hero-badge"><span className="hero-badge__dot" />الرحلة</span>
              <PulseBadge count={pulseCount} />
            </motion.div>

            <motion.h1 variants={fadeUpWithClip} className="headline-static hero-headline">
              <span ref={headlineLineRef} className="headline-line">أنت لست مرهقاً</span>
              <div className="headline-subline-container">
                <div className="headline-fixed-subline">
                  <span className="word-ant">أنت</span>
                  <span className="word-faqat">فقط</span>
                </div>
                <HeroRotatingWord isMobile={isMobileHero} />
              </div>
            </motion.h1>

            <motion.p variants={fadeUp} className="hero-body">
              قف خذ نفساً عميقاً أنت مش محتاج مهام أكتر أنت محتاج تشوف نفسك خريطة تترجم فوضى أفكارك لإحداثيات بصرية وترصد نزيف طاقتك فوراً
            </motion.p>

            <div className="hero-action-row">
              <motion.div variants={fadeUp} className="hero-input-wrapper">
                <div className="hero-input-greeting">يا مسافر،</div>
                <input type="text" className="hero-input" placeholder="اسمك إيه؟" value={mirrorName} onChange={(e) => setMirrorName(e.target.value)} />
              </motion.div>
              <motion.button variants={fadeUp} onClick={handleStart} className="cta-primary">
                <Zap className="hero-cta-icon" />{ctaJourney}<ArrowLeft className="hero-cta-icon--arrow" />
              </motion.button>
              <motion.p variants={fadeUp} className="cta-free-badge">استكشاف مجاني ١٠٠٪ — لا يتطلب بطاقة ائتمان</motion.p>
            </div>

            <motion.div variants={stagger} className="hero-trust-row mt-4">
              {trustPoints.map(point => (
                <motion.div key={point} variants={fadeUp} className="trust-pill">
                  <Shield className="trust-icon" /><span>{point}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={isMobileHero ? { opacity: 0, x: 0 } : { opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: isMobileHero ? 0.7 : 1.2, delay: 0.4, ease: techEase }} className="map-area">
            <HeroSovereignMap reduceMotion={reduceMotion} isMobile={isMobileHero} />
          </motion.div>
        </div>

        <div className="hero-bottom-fade" />
      </section>

      <AnimatePresence>
        {isWarping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="warp-overlay">
            <div className="warp-overlay__content">
              <div className="warp-icon-shell"><Zap className="warp-icon" /></div>
              <div className="warp-text">جاري تحليل وعيك...</div>
            </div>
            {warpLines.map(line => (
              <motion.div key={line.id} className={`warp-line ${line.id}`} initial={{ left: "-100%" }} animate={{ left: "200%" }} transition={{ duration: line.duration, repeat: Infinity, delay: line.delay, ease: "linear" }} style={{ top: line.top, width: line.width, opacity: line.opacity }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
