import React, { type FC, useEffect, useState, useCallback, useMemo, useLayoutEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Zap, Shield, Heart } from "lucide-react";

/* --- Types --- */
interface HeroSectionProps {
  onStartJourney: () => void;
  mirrorName: string;
  setMirrorName: (name: string) => void;
  pulseCount: number;
  trustPoints: string[];
  ctaJourney: string;
  secondaryCta: string;
}

/* --- Constants --- */
const ROTATING_WORDS = [
  "خايف تقول لأ",
  "طاقتك بتتسرب",
  "مراية لزعل غيرك",
  "سايب مفتاحك لغيرك",
  "شايل شيلة مش شيلتك",
  "عايش عشان ترضيهم",
  "ماشي في طريق مش بتاعك"
];

/* --- Styles --- */
const HERO_STYLES = `
  /* @import fonts removed */

  .hero-root {
    --void: #02040a;
    --cyan: #00f0ff;
    --cyan-glow: rgba(0, 240, 255, 0.4);
    --gold: #f5a623;
    --gold-glow: rgba(245, 166, 35, 0.4);
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
    overflow: hidden;
    background: var(--void);
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

  /* Time Complexity */
  .headline-line {
    display: block;
    min-height: 70px;
    height: auto;
    line-height: 1.2;
    overflow: visible;
    width: 100%;
    margin-bottom: 0.1em;
    color: var(--amber-500);
    font-family: var(--font-display);
    font-size: clamp(2.8rem, 6.5vw, 4.8rem);
    white-space: nowrap;
  }

  /* height  clipping Time Complexity */
  .headline-subline {
    display: block;
    min-height: 45px;
    height: auto;
    line-height: 1.2;
    overflow: visible;
    width: 100%;
    color: var(--color-amber-50);
    font-size: 0.78em;
    font-weight: 600;
    margin-bottom: 0.1em;
    font-family: var(--font-display);
  }

  .hero-divider {
    height: 1px;
    background: linear-gradient(90deg, var(--cyan-glow), var(--gold-glow), transparent);
    border-radius: 1px;
  }

  .hero-command-bar {
    display: flex;
    align-items: center;
    background: var(--glass-bg);
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: 24px;
    padding: 8px;
    gap: 12px;
    backdrop-filter: blur(24px);
    box-shadow: 0 10px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1);
    width: 100%;
    max-width: 520px;
    margin-top: 10px;
  }

  .hero-command-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    font-family: var(--font-tajawal), sans-serif;
    text-align: right;
  }

  .hero-command-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #00f0ff, #2dd4bf);
    color: #02040a;
    border: none;
    border-radius: 18px;
    padding: 14px 28px;
    font-size: 1.15rem;
    font-weight: 900;
    font-family: var(--font-display);
    cursor: pointer;
    box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  
  .hero-command-btn:hover {
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.6);
    filter: brightness(1.1);
  }

  .hero-command-secondary {
    display: block;
    margin-top: 12px;
    font-size: 14px;
    color: #8faab8;
    text-align: right;
    cursor: pointer;
    font-weight: 600;
    transition: color 0.3s;
  }
  
  .hero-command-secondary:hover {
    color: #fff;
  }
  
  @media (max-width: 640px) {
    .hero-command-bar {
      flex-direction: column;
      border-radius: 20px;
      padding: 12px;
      gap: 16px;
    }
    .hero-command-btn {
      width: 100%;
      justify-content: center;
    }
    .hero-command-input {
      text-align: center;
    }
    .hero-command-secondary {
      text-align: center;
    }
  }

  /* container  Time Complexity */
  .hero-headline {
    font-size: clamp(2.4rem, 5.5vw, 4.4rem);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 0;
    overflow: visible;
    font-family: var(--font-alexandria), sans-serif;
    line-height: 1.4;
    padding-top: 0.2em;
    padding-bottom: 0.2em;
    color: var(--text-main);
  }

  .hero-copy-column .hero-body {
    font-weight: 500;
    font-size: 1.15rem;
    line-height: 1.9;
    color: rgba(255,255,255,0.85);
    width: 100%;
    text-align: justify;
  }

  .hero-trust-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
    color: rgba(255,255,255,0.7);
    font-family: var(--font-tajawal), sans-serif;
    letter-spacing: 0.2em;
  }

  .sovereign-map {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    max-width: 520px;
    perspective: 1200px;
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
    backdrop-filter: blur(16px);
    padding: 16px;
    border-radius: 24px;
    min-width: 150px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    z-index: 10;
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
    font-family: var(--font-tajawal), sans-serif;
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
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .legend-dot--teal { background: var(--cyan); }
  .legend-dot--gold { background: var(--gold); }
  .legend-dot--crimson { background: var(--crimson); }

  .legend-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    color: #7a95a8;
    text-transform: uppercase;
    font-family: var(--font-tajawal), sans-serif;
  }

  .node-tooltip-body {
    background: rgba(4,8,18,0.9);
    border: 1px solid rgba(0, 240, 255, 0.27);
    border-radius: 12px;
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 800;
    color: #fff;
    white-space: nowrap;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(0, 240, 255, 0.14);
    font-family: var(--font-tajawal), sans-serif;
  }

  .metric-card-values {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .metric-card-values--inline {
    display: flex;
    align-items: center;
    gap: 8px;
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
    display: inline-block;
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
  .hero-layer--grid {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .hero-cta-icon {
    width: 18px;
    height: 18px;
    fill: white;
  }

  .hero-cta-icon--arrow {
    width: 17px;
    height: 17px;
  }

  .trust-pill svg {
    width: 13px;
    height: 13px;
    color: #14b8a6;
  }

  .hero-layer--dust {
    z-index: 5;
    pointer-events: none;
  }

  .neural-dust-field {
    position: absolute;
    inset: -20%;
    background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
    background-size: 80px 80px;
    filter: blur(1px);
    opacity: 0.25;
  }

  .warp-line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
  }

  .hero-canvas > .hero-screen-vignette,
  .hero-canvas > .hero-screen-glow {
    pointer-events: none;
  }

  /* --- Ambient Canvas --- */
  .hero-canvas {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
    background: transparent;
  }

  .ambient-orb {
    position: absolute;
    border-radius: 50%;
    will-change: transform;
    opacity: 0.8;
  }

  .ambient-orb-1 {
    width: 800px; height: 800px;
    background: radial-gradient(circle, rgba(0, 240, 255, 0.14) 0%, transparent 60%);
    top: -20%; right: -10%;
    animation: orb-drift1 38s infinite ease-in-out alternate;
  }

  .ambient-orb-2 {
    width: 900px; height: 900px;
    background: radial-gradient(circle, rgba(245, 166, 35, 0.1) 0%, transparent 65%);
    bottom: -30%; left: -15%;
    animation: orb-drift2 52s infinite ease-in-out alternate;
  }

  .ambient-orb-3 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%);
    top: 45%; left: 20%;
    animation: orb-drift3 44s infinite ease-in-out alternate;
  }

  @keyframes orb-drift1 {
    0%   { transform: translate(0%,   0%)   scale(1);    }
    50%  { transform: translate(-6%,  8%)   scale(1.15); }
    100% { transform: translate(4%,  -5%)   scale(0.85); }
  }
  @keyframes orb-drift2 {
    0%   { transform: translate(0%,   0%)   scale(1);    }
    50%  { transform: translate(8%,  -10%)  scale(1.2); }
    100% { transform: translate(-5%,  6%)   scale(0.9); }
  }
  @keyframes orb-drift3 {
    0%   { transform: translate(0%,  0%)   scale(1);    }
    100% { transform: translate(10%, -15%) scale(1.2); }
  }

  /* --- Grid --- */
  .hero-grid-wrapper {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    perspective: 1000px;
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
    will-change: transform;
    opacity: 0.6;
    transform: rotateX(60deg) scale(1.5);
    transform-origin: center center;
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
    filter: blur(45px);
    will-change: transform;
    opacity: 0.8;
    pointer-events: none;
  }

  .hero-starfield {
    position: absolute;
    inset: -50%;
    width: 200%;
    height: 200%;
    background-image: radial-gradient(2px 2px at 40px 60px, #ffffff 50%, rgba(0,0,0,0)), radial-gradient(2px 2px at 20px 50px, rgba(255,255,255,0.8) 50%, rgba(0,0,0,0)), radial-gradient(2px 2px at 30px 100px, rgba(255,255,255,0.6) 50%, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 60px, rgba(255,255,255,0.4) 50%, rgba(0,0,0,0));
    background-repeat: repeat;
    background-size: 200px 200px;
    opacity: 0.15;
    will-change: transform;
    mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 90%);
  }

  /* --- Noise grain --- */
  .hero-grain {
    position: absolute;
    inset: 0;
    opacity: 0.045;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 50;
  }

  /* --- Badge eyebrow --- */
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 7px 18px;
    border-radius: 100px;
    border: 1px solid var(--ds-color-border-default);
    background: rgba(245, 166, 35, 0.05);
    backdrop-filter: blur(12px);
    font-size: 10px;
    font-weight: 950;
    letter-spacing: 0.35em;
    color: var(--gold);
    text-transform: uppercase;
    box-shadow: inset 0 1px rgba(245, 166, 35, 0.1);
  }

  /* --- Headline --- */
  .headline-static {
    font-family: var(--font-alexandria), sans-serif;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: var(--text-hero);
    text-shadow: 0 0 60px rgba(45, 212, 191, 0.12);
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

  /* --- Rotating word --- */
  /* --- rotation  Time Complexity --- */
  .rotating-word-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
    min-height: 1.3em;
    padding: 0;
    overflow: visible;
    white-space: nowrap;
    box-sizing: content-box;
    font-family: var(--font-display);
    line-height: 1.2;
    vertical-align: middle;
    text-align: right;
  }

  /* --- Body copy --- */
  .hero-body {
    font-size: 1.15rem;
    line-height: 1.9;
    color: var(--text-sub);
    width: 100%;
    text-align: justify;
    text-align-last: right;
  }

  /* --- Trust pills --- */
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

  /* --- Right panel The Sovereign Map --- */
  .sovereign-map {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    max-width: 520px;
  }

  /* --- Pulse ring --- */
  @keyframes pulse-ring {
    0%   { transform: scale(1);    opacity: 0.6; }
    100% { transform: scale(1.65); opacity: 0;   }
  }

  /* --- Metric Card --- */
  .metric-card {
    position: absolute;
    backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    padding: 16px 20px;
    background: rgba(8, 12, 22, 0.7);
    box-shadow: 0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07);
    min-width: 130px;
    animation: card-hover-snap 8s steps(4) infinite alternate;
  }
  @keyframes card-hover-snap {
    0%   { transform: translateY(0px);  }
    25%  { transform: translateY(-4px); }
    50%  { transform: translateY(-4px) translateX(2px); }
    75%  { transform: translateY(-8px) translateX(2px); }
    100% { transform: translateY(-8px); }
  }

  /* --- Warp transition --- */
  .warp-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #020408;
    display: flex;
    align-items: center;
    justify-content: center;
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }

  /* --- Starfield dots --- */
  .starfield-dot {
    position: absolute;
    border-radius: 50%;
    background: white;
    pointer-events: none;
  }

  /* --- Scan line --- */
  @keyframes scan {
    0%   { top: -4%; }
    100% { top: 104%; }
  }
  .hero-scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(45,212,191,0.35), transparent);
    animation: scan 8s linear infinite;
    pointer-events: none;
  }

  /* --- Layout --- */
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

  /* --- Mobile Layout --- */
  @media (max-width: 1023px) {
    .hero-root {
      overflow-x: hidden;
      width: 100%;
    }

    .hero-content-wrapper {
      flex-direction: column;
      gap: 2rem;
      padding: 5rem 1rem 3rem;
      width: 100%;
      max-width: 100vw;
      box-sizing: border-box;
      overflow-x: hidden;
    }

    .hero-copy-column {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .headline-static {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center !important;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }
    
    .headline-line {
      font-size: clamp(2.2rem, 8vw, 3rem);
      line-height: 1.2;
      white-space: normal; /* Fix horizontal scaling issue */
      text-align: center;
    }
    
    .headline-subline {
      text-align: center;
      white-space: normal;
      margin-top: 0.5rem;
    }

    .rotating-word-wrapper {
      justify-content: center;
      text-align: center !important;
      margin-left: auto;
      margin-right: auto;
      display: flex !important;
    }

    .hero-body {
      text-align: center !important;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
      box-sizing: border-box;
      font-size: 1.05rem;
      line-height: 1.6;
      padding: 0;
    }

    .hero-input-group {
      width: 100%;
      max-width: 100vw;
      box-sizing: border-box;
    }

    .hero-input-wrapper {
      width: 100%;
      box-sizing: border-box;
    }

    .cta-group {
      justify-content: center;
      width: 100%;
      flex-direction: column;
      gap: 16px;
      box-sizing: border-box;
    }

    .cta-primary {
      width: 100%;
      justify-content: center;
      padding: 18px 20px;
      font-size: 1.1rem;
      background: rgba(20,184,166,0.2);
      border: 1px solid rgba(20,184,166,0.8);
      box-shadow: 0 0 40px rgba(20,184,166,0.2), inset 0 1px rgba(255,255,255,0.1);
      box-sizing: border-box;
      white-space: normal; /* Allow text wrap instead of push */
    }

    .cta-secondary {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
      white-space: normal;
    }

    .hero-trust-row {
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }

    .trust-pill {
      font-size: 0.75rem;
      padding: 6px 10px;
    }

    .map-area {
      width: 100%;
      max-width: min(95vw, 400px);
      margin: 0 auto;
      padding-bottom: 24px;
      box-sizing: border-box;
      overflow: visible;
    }
  }
`;

/* --- Helpers --- */
const techEase = [0, 0.7, 0.1, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)", y: 15 },
  visible: { opacity: 1, clipPath: "polygon(0 0%, 100% 0%, 100% 100%, 0% 100%)", y: 0, transition: { duration: 0.65, ease: techEase } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } },
};

/* --- Rotating Headline Word --- */
const RotatingWord: FC = () => {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % ROTATING_WORDS.length);
        setShow(true);
      }, 450);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="rotating-word-wrapper relative inline-block w-full max-w-full">
      {/* wrapper  Time Complexity */}
      <span className="invisible select-none block whitespace-nowrap" aria-hidden>
        {ROTATING_WORDS[5]}
      </span>
      <AnimatePresence mode="wait">
        {show && (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 12, clipPath: "polygon(0 150%, 100% 150%, 100% 150%, 0% 150%)" }}
            animate={{ opacity: 1, y: 0, clipPath: "polygon(0 -50%, 100% -50%, 100% 150%, 0% 150%)" }}
            exit={{ opacity: 0, y: -12, clipPath: "polygon(0 -50%, 100% -50%, 100% -50%, 0% -50%)" }}
            transition={{ duration: 0.45, ease: techEase }}
            /* placeholder  Time Complexity */
            className="absolute right-0 top-0 flex items-center headline-accent w-fit h-fit whitespace-nowrap leading-[1.2] overflow-visible box-content pt-0 pb-0 mt-0 mb-0 align-middle font-normal" style={{ fontFamily: 'var(--font-display)' }}
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

/* --- Sovereign Map  Right Panel --- */
const SovereignMap: FC<{ reduceMotion: boolean | null }> = ({ reduceMotion }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 50, mass: 1.5 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 50, mass: 1.5 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (reduceMotion) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    // Discretize mapping for robotic snap feeling
    const rawX = (e.clientX - cx) / 90;
    const rawY = (e.clientY - cy) / 90;
    const step = 0.5;
    mouseX.set(Math.round(rawX / step) * step);
    mouseY.set(Math.round(rawY / step) * step);
  }, [reduceMotion, mouseX, mouseY]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const rings = [
    { r: 68,  stroke: "rgba(0, 240, 255, 0.35)", dash: "none", dur: 22 },
    { r: 110, stroke: "rgba(245, 166, 35, 0.25)", dash: "4 14", dur: 38 },
    { r: 152, stroke: "rgba(239, 68, 68, 0.2)",   dash: "2 22", dur: 60 },
    { r: 194, stroke: "rgba(0, 240, 255, 0.15)",  dash: "1 30", dur: 90 },
  ];

  const nodes = [
    { cx: 190, cy: 190 - 68,  r: 13, color: "#00f0ff", label: "علاقة بموزانها",  w: 1.2 },
    { cx: 190 + 62, cy: 190 - 34, r: 11, color: "#00eeff", label: "دعم سيادي",    w: 0.8 },
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
    <motion.div
      className="sovereign-map"
    >
      <div className="sovereign-map__atmosphere" aria-hidden />
      <div className="hero-scan-line" aria-hidden />

      <svg
        viewBox="0 0 380 380"
        fill="none"
        className="sovereign-map__svg"
      >
        {nodes.map((n, i) => (
          <Fragment key={`nexus-${i}`}>
            <motion.line
              x1="190" y1="190" x2={n.cx} y2={n.cy}
              stroke={n.color}
              strokeWidth="0.5"
              opacity={hovered === i ? 0.6 : 0.15}
              className="orbit-line"
            />
            {/* Neural Pulse - Data traveling from core to node */}
            <motion.circle
              r="1.5"
              fill={n.color}
              initial={{ offsetDistance: "0%", opacity: 0 }}
              animate={{ 
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
              style={{
                offsetPath: `path('M 190 190 L ${n.cx} ${n.cy}')`,
                filter: `drop-shadow(0 0 4px ${n.color})`
              }}
            />
          </Fragment>
        ))}

        {rings.map((ring, i) => (
          (() => {
            const safeRingRadius = toSafeRadius(ring.r, 1);
            return (
              <g key={i}>
                <motion.circle
                  cx="190" cy="190" r={safeRingRadius}
                  stroke={ring.stroke}
                  strokeWidth="1"
                  fill="none"
                  strokeDasharray={ring.dash === "none" ? undefined : ring.dash}
                  animate={reduceMotion ? {} : { rotate: i % 2 === 0 ? 360 : -360 }}
                  transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
                  className="orbit-ring"
                  transformOrigin="190px 190px"
                />
                {!reduceMotion && (
                  <motion.circle
                    cx="190" cy="190" r={safeRingRadius}
                    fill="none"
                    stroke={ring.stroke}
                    strokeWidth="2"
                    strokeDasharray="1 100"
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: ring.dur * 0.4, repeat: Infinity, ease: "linear" }}
                    className="orbit-ring orbit-ring--glow"
                    transformOrigin="190px 190px"
                  />
                )}
              </g>
            );
          })()
        ))}

        {nodes.map((node, i) => (
          (() => {
            const safeNodeRadius = toSafeRadius(node.r, 1);
            return (
              <motion.g
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                animate={reduceMotion ? {} : {
                  x: springX.get() * node.w,
                  y: springY.get() * node.w,
                  opacity: hovered === i ? 1 : [0.7, 1, 0.7],
                }}
                transition={{
                  opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 },
                }}
                transformOrigin={`${node.cx}px ${node.cy}px`}
                cursor="pointer"
                className="node-group"
              >
                {hovered === i && (
                  <circle
                    cx={node.cx} cy={node.cy} r={safeNodeRadius + 6}
                    fill="none" stroke={node.color} strokeWidth="1.5"
                    opacity={0.4}
                    className="pulse-ring"
                    transformOrigin={`${node.cx}px ${node.cy}px`}
                  />
                )}
                <circle cx={node.cx} cy={node.cy} r={safeNodeRadius + 8} fill={node.color} opacity={0.07} />
                <circle
                  cx={node.cx} cy={node.cy} r={safeNodeRadius}
                  fill={node.color}
                  className="node-core"
                />
                <circle cx={node.cx} cy={node.cy} r={safeNodeRadius * 0.35} fill="rgba(0,0,0,0.55)" />

                <AnimatePresence>
                  {hovered === i && (
                    <motion.foreignObject
                      x={node.cx > 190 ? node.cx - 160 : node.cx + 18}
                      y={node.cy - 16}
                      width="150" height="36"
                      initial={{ opacity: 0, filter: "blur(4px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, filter: "blur(4px)" }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="node-tooltip-body">
                        {node.label}
                      </div>
                    </motion.foreignObject>
                  )}
                </AnimatePresence>
              </motion.g>
            );
          })()
        ))}

        <motion.g
          animate={reduceMotion ? {} : { scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="center-core"
          transformOrigin="190px 190px"
        >
          <circle cx="190" cy="190" r="22" fill="rgba(0, 240, 255, 0.15)" />
          <circle cx="190" cy="190" r="14" fill="var(--teal)" className="center-core__glow" />
          <circle cx="190" cy="190" r="6" fill="#fff" opacity={0.9} />
        </motion.g>
      </svg>

      <div className="metric-card metric-card--health">
        <p className="metric-card-label">صحتك الداخلية</p>
        <div className="metric-card-values">
          <span className="metric-card-value">٧٨</span>
          <span className="metric-card-text">/ ١٠٠</span>
        </div>
        <div className="metric-card-bar">
          <motion.div
            className="metric-card-bar__fill"
            initial={{ width: "0%" }}
            animate={{ width: "78%" }}
            transition={{ duration: 1.2, ease: techEase, delay: 0.6 }}
          />
        </div>
      </div>

      <div className="metric-card metric-card--drain">
        <p className="metric-card-label metric-card-label--alert">نزيف طاقة</p>
        <div className="metric-card-values metric-card-values--inline">
          <span className="metric-card-value metric-card-value--small">٣</span>
          <span className="metric-card-text">مصادر الاستنزاف</span>
        </div>
        <div className="metric-card-dots">
          {[1, 2, 3].map((dot) => (
            <motion.div
              key={dot}
              className="metric-card-dot"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: dot * 0.3 }}
            />
          ))}
        </div>
      </div>

      <div className="legend">
        {[
          { dotClass: "legend-dot legend-dot--teal", label: "توازن ذاتي" },
          { dotClass: "legend-dot legend-dot--gold", label: "تشتت" },
          { dotClass: "legend-dot legend-dot--crimson", label: "استنزاف" },
        ].map(({ dotClass, label }) => (
          <div key={label} className="legend-item">
            <span className={dotClass} />
            <span className="legend-label">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const PulseBadge: FC<{ count: number }> = ({ count }) => (
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

/* --- Main Hero Component --- */
export const HeroSection: FC<HeroSectionProps> = ({
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
  const headlineLineRef = useRef<HTMLSpanElement | null>(null);
  const [headlineMeasuredWidth, setHeadlineMeasuredWidth] = useState<number>(0);

  // Global Mouse tracking for Parallax Base
  const globalMouseX = useMotionValue(0);
  const globalMouseY = useMotionValue(0);

  const handleGlobalMouseMove = useCallback((e: React.MouseEvent) => {
    if (reduceMotion) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    // 5x more sensitive for dramatic architectural tracking -> now calmed down
    globalMouseX.set((e.clientX - cx) / 80);
    globalMouseY.set((e.clientY - cy) / 80);
  }, [reduceMotion, globalMouseX, globalMouseY]);

  // Layer 1: Foreground Grid (Fastest response, moves opposite to mouse context)
  const gridX = useSpring(useTransform(globalMouseX, x => -x * 1.5), { stiffness: 45, damping: 20, mass: 0.5 });
  const gridY = useSpring(useTransform(globalMouseY, y => -y * 1.5), { stiffness: 45, damping: 20, mass: 0.5 });

  // Layer 2: Midground Stars (Medium response)
  const starX = useSpring(useTransform(globalMouseX, x => -x * 0.5), { stiffness: 20, damping: 30, mass: 1 });
  const starY = useSpring(useTransform(globalMouseY, y => -y * 0.5), { stiffness: 20, damping: 30, mass: 1 });

  // Layer 3: Deep Nebula (Slow, heavy response)
  const nebulaX = useSpring(useTransform(globalMouseX, x => -x * 0.2), { stiffness: 10, damping: 40, mass: 2 });
  const nebulaY = useSpring(useTransform(globalMouseY, y => -y * 0.2), { stiffness: 10, damping: 40, mass: 2 });

  // Layer 4: Neural Dust (Extreme foreground, super fast)
  const dustX = useSpring(useTransform(globalMouseX, x => -x * 2.5), { stiffness: 60, damping: 20, mass: 0.3 });
  const dustY = useSpring(useTransform(globalMouseY, y => -y * 2.5), { stiffness: 60, damping: 20, mass: 0.3 });

  // Tilt transforms for content
  const tiltX = useSpring(useTransform(globalMouseY, y => y * 0.4), { stiffness: 45, damping: 25 });
  const tiltY = useSpring(useTransform(globalMouseX, x => -x * 0.4), { stiffness: 45, damping: 25 });

  const handleStart = useCallback(() => {
    setIsWarping(true);
    setTimeout(onStartJourney, 900);
  }, [onStartJourney]);

  // Time Complexity
  useLayoutEffect(() => {
    const node = headlineLineRef.current;
    if (!node) return;

    const updateMeasuredWidth = () => {
      const nextWidth = Math.ceil(node.getBoundingClientRect().width);
      setHeadlineMeasuredWidth(prev => (prev === nextWidth ? prev : nextWidth));
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

  const warpLineStyles = useMemo(() => warpLines.map((line) => `
    .${line.id} {
      top: ${line.top};
      width: ${line.width};
      opacity: ${line.opacity};
    }
  `).join('\n'), [warpLines]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_STYLES }} />
      <style dangerouslySetInnerHTML={{ __html: warpLineStyles }} />

      {/* --- Section wrapper --- */}
      <section
        className="hero-root"
        dir="rtl"
        onMouseMove={handleGlobalMouseMove}
      >
        {/* --- Ambient canvas --- */}
        <div className="hero-canvas" aria-hidden>
          {/* Layer 3: Deep Nebula */}
          <motion.div className="hero-layer hero-layer--nebula" style={{ x: nebulaX, y: nebulaY }}>
            <div className="hero-nebula" />
            <div className="ambient-orb ambient-orb-3" />
          </motion.div>

          {/* Layer 2: Starfield */}
          <motion.div className="hero-layer hero-layer--starfield" style={{ x: starX, y: starY }}>
            <div className="hero-starfield" />
            <div className="ambient-orb ambient-orb-2" />
          </motion.div>

          {/* Layer 1: Foreground Grid */}
          <motion.div className="hero-layer hero-layer--grid" style={{ x: gridX, y: gridY }}>
            <div className="hero-grid-wrapper">
              <div className="hero-grid" />
            </div>
            <div className="ambient-orb ambient-orb-1" />
          </motion.div>

          {/* Layer 4: Neural Dust (Near plane) */}
          <motion.div className="hero-layer hero-layer--dust" style={{ x: dustX, y: dustY }}>
            <div className="neural-dust-field" />
          </motion.div>

          <div className="hero-grain" />
          <div className="hero-screen-vignette" />
          <div className="hero-screen-glow" />
        </div>

        {/* --- Content container --- */}
        <div className="hero-content-wrapper">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="hero-copy-column"
            style={{
              rotateX: tiltX,
              rotateY: tiltY,
              // Time Complexity
              ["--headline-measured-width" as any]:
                headlineMeasuredWidth > 0 ? `${headlineMeasuredWidth}px` : undefined,
            }}
          >
            <motion.div variants={fadeUp} className="hero-eyebrow-row">
              <span className="hero-badge">
                <span className="hero-badge__dot" />
                DAWAYIR — الرحلة
              </span>
              <PulseBadge count={pulseCount} />
            </motion.div>

            <motion.h1 variants={fadeUp} className="headline-static hero-headline">
              <span ref={headlineLineRef} className="headline-line">أنت لست مرهقاً</span>
              <span className="headline-subline">أنت فقط</span>
              <RotatingWord />
            </motion.h1>

            <motion.div variants={fadeUp} className="hero-divider" />

            <motion.p variants={fadeUp} className="hero-body">
              قف خذ نفساً عميقاً أنت لست بحاجة إلى المزيد من المهام أنت بحاجة إلى <strong>خريطة تصبح فيها مرئياً لنفسك</strong> نترجم فوضى أفكارك فوراً لإحداثيات بصرية ترصد نزيف طاقتك.
            </motion.p>

            <motion.div variants={fadeUp}>
              <div className="hero-command-bar">
                <input
                  type="text"
                  id="mirror-name"
                  name="mirrorName"
                  placeholder="اسمك (اختياري)"
                  value={mirrorName}
                  onChange={e => setMirrorName(e.target.value)}
                  maxLength={24}
                  dir="rtl"
                  className="hero-command-input"
                />
                <button
                  type="button"
                  className="hero-command-btn"
                  onClick={handleStart}
                  id="hero-cta-start"
                >
                  <span>{ctaJourney}</span>
                  <ArrowLeft className="hero-cta-icon hero-cta-icon--arrow" />
                </button>
              </div>
              <span
                className="hero-command-secondary"
                onClick={() => document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" })}
              >
                {secondaryCta}
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            className="map-area"
            initial={{ opacity: 0, scale: 0.88, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: techEase, delay: 0.35 }}
          >
            <SovereignMap reduceMotion={reduceMotion} />
          </motion.div>
        </div>

        <div className="hero-bottom-fade" />
      </section>

      <AnimatePresence>
        {isWarping && (
          <motion.div
            className="warp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {warpLines.map((line) => (
              <motion.div
                key={line.id}
                className={`warp-line ${line.id}`}
                animate={{ left: ["-150%", "300%"] }}
                transition={{
                  duration: line.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: line.delay,
                }}
              />
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="warp-overlay__content"
            >
              <div className="warp-icon-shell">
                <Zap className="warp-icon" />
              </div>
              <p className="warp-text">
                جاري تحليل وعيك...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
