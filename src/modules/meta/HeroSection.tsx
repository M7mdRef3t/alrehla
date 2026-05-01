import React, { type FC, useEffect, useState, useCallback, useMemo, useLayoutEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Zap, Shield, Heart } from "lucide-react";
import { AlrehlaIcon } from "./logo/AlrehlaIcon";
import { AlrehlaWordmark } from "./logo/AlrehlaWordmark";
import { soundManager } from "@/services/soundManager";
import { SafeMotionCircle, toSafeSvgRadius } from "@/components/ui/SafeSvg";


/* --- Types --- */
interface HeroSectionProps {
  onStartJourney: () => void;
  mirrorName: string;
  setMirrorName: (name: string) => void;
  pulseCount: number;
  trustPoints: string[];
  ctaJourney: string;
  secondaryCta?: string;
  hideCta?: boolean;
}

/* --- Constants --- */
const ROTATING_WORDS = [
  "مش شايف الحقيقة",
  "ماشي في الضباب",
  "بتصدق أوهام",
  "محتاج وضوح",
  "مستنزف طاقياً",
  "تايه في رحلتك",
  "جاهز للحقيقة"
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
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    overflow: hidden;
    background: var(--void);
    /* Mobile: will be overridden to flat + contain */
  }

  .hero-layer {
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
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

  .text-shadow-glow {
    text-shadow: 0 0 20px rgba(45, 212, 191, 0.4), 0 0 40px rgba(45, 212, 191, 0.2);
  }
  
  .headline-glow {
    filter: drop-shadow(0 0 15px rgba(45, 212, 191, 0.3));
  }

  .hero-copy-column {
    flex: 1 1 0;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 0.25rem; /* Minimized gap */
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
    display: block;
    line-height: 1; /* Tightest */
    margin-bottom: 0; /* Removed margin */
    color: var(--amber-500);
    font-family: var(--font-display);
    font-size: clamp(2.8rem, 6.5vw, 4.8rem);
    white-space: nowrap;
  }

  /* Subline */
  .headline-subline {
    display: inline-block;
    width: auto;
    line-height: 1; /* Tightest */
    color: var(--color-amber-50);
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    font-weight: 600;
    margin: 0;
    font-family: var(--font-display);
    white-space: nowrap;
  }

  .hero-divider {
    height: 1px;
    max-width: 60%;
    background: linear-gradient(90deg, var(--cyan-glow), var(--gold-glow), transparent);
    border-radius: 1px;
    margin-top: 0rem; 
    margin-bottom: 0.25rem;
    opacity: 0.5;
  }

  .hero-command-bar {
    display: flex;
    align-items: center;
    background: rgba(8, 12, 22, 0.45);
    border: 1px solid rgba(45, 212, 191, 0.15);
    border-radius: 20px;
    padding: 6px;
    gap: 8px;
    backdrop-filter: blur(40px);
    box-shadow: 
      0 20px 50px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    width: 100%;
    max-width: 580px;
    margin-top: 32px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .hero-command-bar:focus-within {
    border-color: rgba(45, 212, 191, 0.5);
    box-shadow: 
      0 0 30px rgba(45, 212, 191, 0.12),
      0 20px 50px rgba(0, 0, 0, 0.6);
    transform: translateY(-2px);
    background: rgba(8, 12, 22, 0.6);
  }

  .hero-command-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    padding: 14px 24px;
    font-size: 1.15rem;
    font-weight: 500;
    color: #fff;
    font-family: var(--font-tajawal), sans-serif;
    text-align: right;
    transition: all 0.3s ease;
  }

  .hero-command-input::placeholder {
    color: #475569;
    transition: opacity 0.3s;
  }

  .hero-command-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
    color: #02040a;
    border: none;
    border-radius: 16px;
    padding: 14px 36px;
    font-size: 1.1rem;
    font-weight: 850;
    font-family: var(--font-display);
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(20, 184, 166, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    position: relative;
    overflow: hidden;
  }

  .hero-command-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      120deg,
      transparent,
      rgba(255, 255, 255, 0.35),
      transparent
    );
    transition: all 0.6s;
  }

  .hero-command-btn:hover::before {
    left: 100%;
  }

  .hero-command-btn:hover {
    transform: scale(1.02) translateX(-2px);
    box-shadow: 0 8px 25px rgba(20, 184, 166, 0.5);
    filter: brightness(1.1);
  }

  @media (max-width: 640px) {
    .hero-eyebrow-row {
      gap: 6px;
      justify-content: center;
      position: relative;
      top: -5px;
    }
    .hero-command-bar {
      flex-direction: column;
      border-radius: 20px;
      padding: 12px;
      gap: 12px;
      margin-top: 20px;
    }
    .hero-command-btn {
      width: 80%;
      max-width: 280px;
      justify-content: center;
    }
    .hero-command-input {
      text-align: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      width: 100%;
      padding: 14px;
    }
  }

  /* Headline container */
  .hero-headline {
    font-size: clamp(2.4rem, 5.5vw, 4.4rem);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: fit-content;
    max-width: 100%;
    gap: 0;
    overflow: visible;
    font-family: var(--font-alexandria), sans-serif;
    line-height: 1; /* Tightest from 1.4 */
    padding-top: 0;
    padding-bottom: 0;
    color: var(--text-main);
    text-shadow: 0 0 40px rgba(0, 240, 255, 0.15);
  }

  .headline-inline-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    margin-top: -0.5rem; /* Force pull up */
  }

  .rotating-word-wrapper {
    margin-top: -0.8rem; /* Force pull up to "أنت فقط" */
  }

  .hero-copy-column .hero-body {
    font-weight: 500;
    font-size: 1.15rem;
    line-height: 1.9;
    color: #e2e8f0;
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
    color: #94a3b8;
    font-family: var(--font-tajawal), sans-serif;
    letter-spacing: 0.2em;
  }

  .leadership-map {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    max-width: 520px;
    perspective: 1200px;
  }

  .leadership-map__atmosphere {
    position: absolute;
    inset: -18%;
    background: radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 75%);
    filter: blur(50px);
    pointer-events: none;
  }

  .leadership-map__svg {
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
    will-change: transform;
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
    display: none; /* Removed per user request */
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
    overflow: hidden;
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
    display: none; /* Removed per user request */
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
    display: inline-block;
    padding: 0;
    margin: 0;
  }

  /* --- Rotating word --- */
  /* --- rotation  Time Complexity --- */
  .rotating-word-wrapper {
    position: relative;
    display: inline-grid;
    width: auto;
    min-height: 1.3em;
    padding: 0;
    overflow: visible;
    white-space: nowrap;
    box-sizing: content-box;
    font-family: var(--font-display);
    line-height: 1.4; /* Increased from 1.2 */
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
    margin-top: -0.25rem; /* Pull up closer to headline */
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
  .leadership-map {
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
    animation: card-hover-float 6s ease-in-out infinite alternate;
    will-change: transform;
  }
  @keyframes card-hover-float {
    0%   { transform: translateY(0px) translateX(0px);  }
    100% { transform: translateY(-8px) translateX(2px); }
  }

  @media (max-width: 1023px) {
    .metric-card {
      animation: none !important;
      will-change: auto;
      transform: none !important;
    }
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
      overflow-y: visible !important;
      width: 100%;
      min-height: 100dvh;
      height: auto;
      transform-style: flat !important;
      perspective: none !important;
    }

    .hero-root *,
    .hero-root *::before,
    .hero-root *::after {
      transform-style: flat !important;
      perspective: none !important;
    }

    .hero-content-wrapper {
      flex-direction: column;
      align-items: center;
      gap: 1.5rem; /* Reduced from 2rem */
      padding: 6rem 1rem 4rem; /* Reduced padding */
      width: 100%;
      min-height: 100dvh;
      height: auto;
      max-width: 100vw;
      box-sizing: border-box;
      overflow-x: hidden;
      justify-content: center;
    }

    .hero-copy-column {
      display: contents;
    }

    .hero-eyebrow-row { order: 1; margin-bottom: -0.25rem; }
    .hero-headline { order: 2; margin-bottom: -0.25rem; }
    .hero-divider { order: 3; margin: 0; }
    .map-area { 
      order: 4; 
      margin-top: 0rem !important; 
      transform: none;
      transform-origin: top center; 
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
    }
    .hero-cta-container { order: 5; margin-top: 0.5rem; margin-bottom: 0.5rem; width: 100%; z-index: 10; }
    .hero-body { order: 6; }
    
    .headline-static {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center !important;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      transform: none;
    }
    
    .headline-line {
      font-size: clamp(2.3rem, 8vw, 3rem);
      line-height: 1.1;
      white-space: normal;
      text-align: center;
    }
    
    .headline-subline {
      text-align: center;
      white-space: normal;
      margin-top: 0;
      font-size: clamp(1.4rem, 6vw, 2.1rem);
    }

    .headline-inline-row {
      flex-direction: column;
      align-items: center;
      gap: 0;
      margin-top: 0.75rem; /* Reduced from 1.25rem */
    }

    .rotating-word-wrapper {
      display: grid !important;
      justify-items: center;
      text-align: center !important;
      margin-left: auto;
      margin-right: auto;
      margin-top: 0rem; /* Reduced from 0.25rem */
      width: 100%;
      max-width: 100%;
      min-height: 1.35em;
      /* Isolate layout: prevents reflow from propagating upward */
      contain: layout style;
      overflow: hidden;
      transform: none;
      -webkit-transform: none;
    }

    .rotating-word-wrapper > .headline-accent {
      position: absolute !important;
      inset: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
      text-align: center !important;
    }

    .hero-copy-column .hero-body {
      text-align: center !important;
      text-align-last: center !important;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
      max-width: 95vw;
      box-sizing: border-box;
      font-size: 0.88rem;
      line-height: 1.6;
      padding: 0 0.5rem;
    }

    .hero-body--no-cta {
      margin-top: 0.5rem;
      position: relative;
      z-index: 10;
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

    .legend {
      bottom: -15px; /* Lift the legend words up */
    }

    .map-area {
      width: 100%;
      max-width: min(85vw, 320px);
      margin: -0.5rem auto 0rem; /* Pull up slightly */
      padding-bottom: 0;
      box-sizing: border-box;
      overflow: visible;
    }

    /* ══════════════════════════════════════════════════════════
       Mobile Performance Optimizations (Deep GPU Fix)
       Root cause: backdrop-filter compositing + active CSS
       animations + preserve-3d = GPU thrashing on mobile.
       ══════════════════════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .hero-root *,
      .hero-root *::before,
      .hero-root *::after {
        scroll-behavior: auto !important;
      }

      /* Kill ALL backdrop-filter on mobile — this is the #1 cause of jitter */
      .hero-command-bar, 
      .pulse-badge, 
      .trust-pill, 
      .metric-card, 
      .node-tooltip-body,
      .hero-badge {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        background: rgba(8, 12, 22, 0.92) !important;
      }

      /* Kill all background CSS animations — not just slow them */
      .ambient-orb,
      .ambient-orb-1,
      .ambient-orb-2,
      .ambient-orb-3 {
        animation: none !important;
        will-change: auto !important;
        transform: none !important;
      }

      .hero-grid,
      .hero-nebula,
      .hero-starfield,
      .neural-dust-field {
        animation: none !important;
        will-change: auto !important;
      }

      .hero-scan-line {
        display: none !important;
      }

      /* Kill all will-change on background layers */
      .hero-layer,
      .hero-layer--nebula,
      .hero-layer--starfield,
      .hero-layer--grid,
      .hero-layer--dust {
        will-change: auto !important;
        transform: none !important;
      }

      .hero-grid-wrapper {
        perspective: none !important;
      }

      .hero-grid {
        transform: rotateX(45deg) scale(1.2) !important;
        will-change: auto !important;
      }

      .hero-content-wrapper {
        transform: none !important;
        will-change: auto !important;
      }

      .pulse-badge__dot {
        animation: none !important;
        opacity: 1 !important;
      }

      /* Kill the grain overlay — it's expensive */
      .hero-grain {
        display: none !important;
      }

      /* Reduce filter usage */
      .hero-nebula {
        filter: blur(30px) !important;
      }

      .leadership-map__atmosphere {
        filter: blur(30px) !important;
      }
    }






    .metric-card--health {
      top: -5%;
      right: 0%;
      transform: scale(0.85);
      transform-origin: top right;
    }
    .metric-card--drain {
      bottom: -5%;
      left: 0%;
      transform: scale(0.85);
      transform-origin: bottom left;
    }
    .node-core, .center-core__glow, .orbit-ring--glow {
      filter: none;
    }
    .orbit-ring--glow {
      opacity: 0.3;
    }
  }

`;

/* --- Helpers --- */
const techEase = [0, 0.7, 0.1, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, clipPath: "polygon(-100% 100%, 200% 100%, 200% 100%, -100% 100%)", y: 15 },
  visible: { opacity: 1, clipPath: "polygon(-100% -100%, 200% -100%, 200% 200%, -100% 200%)", y: 0, transition: { duration: 0.65, ease: techEase } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } },
};

/* --- Rotating Headline Word --- */
const RotatingWord: FC<{ isMobile?: boolean }> = ({ isMobile }) => {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % ROTATING_WORDS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const mobile = isMobile ?? false;
  const yAmount = reduceMotion ? 0 : mobile ? 6 : 10;
  const dur = reduceMotion ? 0.01 : 0.5;

  return (
    <span 
      className="rotating-word-wrapper inline-grid max-w-full" 
      style={{ gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }}
    >
      <span 
        className="invisible select-none pointer-events-none whitespace-normal opacity-0" 
        style={{ gridArea: '1 / 1' }} 
        aria-hidden
      >
        {ROTATING_WORDS.reduce((a, b) => a.length > b.length ? a : b)}
      </span>
      
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: yAmount }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -yAmount }}
          transition={{ duration: dur, ease: [0.23, 1, 0.32, 1] }}
          className="headline-accent whitespace-nowrap leading-[1.4] py-2 font-normal text-right flex items-start justify-start"
          style={{
            gridArea: '1 / 1',
            fontFamily: 'var(--font-display)',
            willChange: 'opacity, transform',
            WebkitFontSmoothing: 'antialiased',
            backfaceVisibility: 'hidden'
          }}
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};


/* --- Leadership Map --- */
const LeadershipMap: FC<{ reduceMotion: boolean | null; isMobile: boolean }> = ({ reduceMotion, isMobile }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 50, mass: 1.5 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 50, mass: 1.5 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (reduceMotion || isMobile) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    // Discretize mapping for robotic snap feeling
    const rawX = (e.clientX - cx) / 90;
    const rawY = (e.clientY - cy) / 90;
    mouseX.set(rawX);
    mouseY.set(rawY);
  }, [reduceMotion, isMobile, mouseX, mouseY]);

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
    { cx: 190, cy: 190 - 68,  r: 13, color: "#00f0ff", label: "حقيقة واضحة",  w: 1.2 },
    { cx: 190 + 62, cy: 190 - 34, r: 11, color: "#00eeff", label: "نور حقيقي",    w: 0.8 },
    { cx: 190 + 110, cy: 190 + 55, r: 14, color: "#f5a623", label: "غموض يحتاج كشف",  w: 1.5 },
    { cx: 190 - 60, cy: 190 + 104, r: 10, color: "#fbbf24", label: "ضباب يحتاج إضاءة",   w: 0.9 },
    { cx: 190 - 130, cy: 190 - 65, r: 16, color: "#00d0ff", label: "بصيرة صادقة",w: 1.1 },
    { cx: 190 - 28, cy: 190 - 148, r: 12, color: "#ff0055", label: "خداع مستتر",   w: 2.0 },
    { cx: 190 + 118, cy: 190 - 100, r: 11, color: "#ff0044", label: "حدود مخترقة", w: 1.7 },
  ];


  const [hovered, setHovered] = useState<number | null>(null);


  return (
    <motion.div
      className="leadership-map"
    >
      <div className="leadership-map__atmosphere" aria-hidden />
      <div className="hero-scan-line" aria-hidden />

      <svg
        viewBox="0 0 380 380"
        fill="none"
        className="leadership-map__svg"
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
            {!isMobile && Number.isFinite(n.cx) && Number.isFinite(n.cy) && (
              <SafeMotionCircle
                r={1.5}
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
                  willChange: isMobile ? "auto" : "offset-distance, opacity"
                }}
              />
            )}
          </Fragment>
        ))}

        {rings.map((ring, i) => (
          <g key={i}>
            <SafeMotionCircle
              cx={190} cy={190} r={ring.r}
              stroke={ring.stroke}
              strokeWidth={1}
              fill="none"
              strokeDasharray={ring.dash === "none" ? undefined : ring.dash}
              animate={reduceMotion || isMobile ? {} : { rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
              className="orbit-ring"
              style={{ transformOrigin: "190px 190px" }}
            />
            {!reduceMotion && !isMobile && (
              <SafeMotionCircle
                cx={190} cy={190} r={ring.r}
                fill="none"
                stroke={ring.stroke}
                strokeWidth={2}
                strokeDasharray="1 100"
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: ring.dur * 0.4, repeat: Infinity, ease: "linear" }}
                className="orbit-ring orbit-ring--glow"
                style={{ transformOrigin: "190px 190px" }}
              />
            )}
          </g>
        ))}

        {nodes.map((node, i) => (
          <motion.g
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            animate={reduceMotion || isMobile ? {} : {
              x: isMobile ? 0 : springX.get() * node.w,
              y: isMobile ? 0 : springY.get() * node.w,
              opacity: hovered === i ? 1 : [0.7, 1, 0.7],
            }}
            transition={{
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 },
            }}
            style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
            cursor="pointer"
            className="node-group"
          >
            {hovered === i && (
              <SafeMotionCircle
                cx={node.cx} cy={node.cy} r={node.r + 6}
                fill="none" stroke={node.color} strokeWidth={1.5}
                opacity={0.4}
                className="pulse-ring"
                style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
              />
            )}
            <SafeMotionCircle cx={node.cx} cy={node.cy} r={node.r + 8} fill={node.color} opacity={0.07} />
            <SafeMotionCircle
              cx={node.cx} cy={node.cy} r={node.r}
              fill={node.color}
              className="node-core"
            />
            <SafeMotionCircle cx={node.cx} cy={node.cy} r={node.r * 0.35} fill="rgba(0,0,0,0.55)" />


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
        ))}

        <motion.g
          animate={reduceMotion || isMobile ? {} : { scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="center-core"
          style={{ transformOrigin: "190px 190px" }}
        >
          <SafeMotionCircle cx={190} cy={190} r={22} fill="rgba(0, 240, 255, 0.15)" />
          <SafeMotionCircle cx={190} cy={190} r={14} fill="var(--teal)" className="center-core__glow" />
          <SafeMotionCircle cx={190} cy={190} r={6} fill="#fff" opacity={0.9} />
        </motion.g>
      </svg>

      <div className="metric-card metric-card--health">
        <p className="metric-card-label">مستوى بصيرتك</p>
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
        <p className="metric-card-label metric-card-label--alert">مناطق الضباب</p>
        <div className="metric-card-values metric-card-values--inline">
          <span className="metric-card-value metric-card-value--small">٣</span>
          <span className="metric-card-text">مصادر الخداع</span>
        </div>
        <div className="metric-card-dots">
          {[1, 2, 3].map((dot) => (
            <motion.div
              key={dot}
              className="metric-card-dot"
              animate={isMobile ? {} : { opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: dot * 0.3 }}
            />
          ))}
        </div>
      </div>

      <div className="legend">
        {[
          { dotClass: "legend-dot legend-dot--teal", label: "توازن" },
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
  hideCta = false,
}) => {
  const reduceMotion = useReducedMotion();
  const [isWarping, setIsWarping] = useState(false);
  const headlineLineRef = useRef<HTMLSpanElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dynamicHeadline, setDynamicHeadline] = useState<string | null>(null);
  const [dynamicSubline, setDynamicSubline] = useState<string | null>(null);
  const [dynamicCta, setDynamicCta] = useState<string | null>(null);
  const [targetRedirect, setTargetRedirect] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(
      window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024
    );
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const h = params.get("h");
      const s = params.get("s");
      const c = params.get("c");
      const utmContent = params.get("utm_content");

      if (utmContent) {
        const illusionMap: Record<string, { h: string, s: string, c: string }> = {
          'sunk-cost': {
            h: "لسه مكمل في طريق الغلط؟",
            s: "سمعتني وأنا بتكلم عن مغالطة التكلفة الغارقة، وعرفت إن استمرارك في علاقة أو قرار عشان استثمرت فيه كتير هو أكبر فخ. أنت مش محتاج تخسر أكتر من كده.",
            c: "اكتشف حجم تورطك"
          },
          'confirmation': {
            h: "بتدور على اللي يرضيك بس؟",
            s: "تحيز التأكيد بيخليك تشوف بس اللي يثبت وجهة نظرك وتتجاهل الحقيقة. سمعت الفخ في الفيديو، ودلوقتي جه وقت المواجهة.",
            c: "اختبر تحيزاتك"
          },
          'familiarity': {
            h: "متعلق باللي تعرفه؟",
            s: "تأثير الألفة بيخليك تفضل المألوف حتى لو مؤذي وترفض الجديد حتى لو فيه نجاتك. زي ما قلت لك، مش كل مألوف أمان.",
            c: "اكتشف منطقة الراحة"
          },
          'illusion-of-control': {
            h: "فاكر إنك متحكم في كل حاجة؟",
            s: "وهم السيطرة بيخليك تفتكر إنك سايق، لكن الحقيقة إنك بتستنزف طاقتك في حاجات برا إرادتك. وقف استنزاف وابدأ تفهم.",
            c: "اكتشف دايرة تحكمك"
          },
          'optimism': {
            h: "فاكر إن الوحش مش هيصيبك؟",
            s: "تحيز التفاؤل بيعميك عن الاستعداد للصدمات ويخليك فاكر إنك محصن. المواجهة دلوقتي أفضل من الصدمة بعدين.",
            c: "واجه الحقيقة"
          },
          'status-quo': {
            h: "خايف من التغيير؟",
            s: "تحيز الوضع الراهن بيربطك بمكانك عشان خايف تخسر، بس الحقيقة إنك بتخسر عمرك وأنت واقف. آن الأوان تتحرك.",
            c: "اكسر حاجز الثبات"
          },
          'blind-spot': {
            h: "شايف عيوب الكل إلا نفسك؟",
            s: "تحيز النقطة العمياء بيخلينا دايماً شايفين الغلط في غيرنا ونبرر لنفسنا. أول خطوة في الرحلة إنك تشوف صورتك الحقيقية.",
            c: "أضئ نقطتك العمياء"
          }
        };

        if (illusionMap[utmContent]) {
          setDynamicHeadline(illusionMap[utmContent].h);
          setDynamicSubline(illusionMap[utmContent].s);
          setDynamicCta(illusionMap[utmContent].c);
          setTargetRedirect(`/go/illusion/${utmContent}`);
          return;
        }
      }

      if (h) setDynamicHeadline(h);
      if (s) setDynamicSubline(s);
      if (c) setDynamicCta(c);
    }
  }, []);


  // Global Mouse tracking for Parallax Base
  const globalMouseX = useMotionValue(0);
  const globalMouseY = useMotionValue(0);

  const handleGlobalMouseMove = useCallback((e: React.MouseEvent) => {
    if (reduceMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    // 5x more sensitive for dramatic architectural tracking -> now calmed down
    globalMouseX.set((e.clientX - cx) / 80);
    globalMouseY.set((e.clientY - cy) / 80);
  }, [reduceMotion, globalMouseX, globalMouseY]);

  // Layer 1: Foreground Grid (Fastest response, moves opposite to mouse context)
  const gridX = useSpring(useTransform(globalMouseX, x => isMobile ? 0 : -x * 1.5), { stiffness: 45, damping: 20, mass: 0.5 });
  const gridY = useSpring(useTransform(globalMouseY, y => isMobile ? 0 : -y * 1.5), { stiffness: 45, damping: 20, mass: 0.5 });

  // Layer 2: Midground Stars (Medium response)
  const starX = useSpring(useTransform(globalMouseX, x => isMobile ? 0 : -x * 0.5), { stiffness: 20, damping: 30, mass: 1 });
  const starY = useSpring(useTransform(globalMouseY, y => isMobile ? 0 : -y * 0.5), { stiffness: 20, damping: 30, mass: 1 });

  // Layer 3: Deep Nebula (Slow, heavy response)
  const nebulaX = useSpring(useTransform(globalMouseX, x => isMobile ? 0 : -x * 0.2), { stiffness: 10, damping: 40, mass: 2 });
  const nebulaY = useSpring(useTransform(globalMouseY, y => isMobile ? 0 : -y * 0.2), { stiffness: 10, damping: 40, mass: 2 });

  // Layer 4: Neural Dust (Near plane) — disabled on mobile to prevent jitter
  const dustX = useSpring(useTransform(globalMouseX, x => isMobile ? 0 : -x * 2.5), { stiffness: 60, damping: 20, mass: 0.3 });
  const dustY = useSpring(useTransform(globalMouseY, y => isMobile ? 0 : -y * 2.5), { stiffness: 60, damping: 20, mass: 0.3 });

  // Tilt disabled on text column for readability — kept on map only

  const handleStart = useCallback(() => {
    soundManager.playEffect("cosmic_pulse");
    setIsWarping(true);
    if (targetRedirect) {
      setTimeout(() => { window.location.href = targetRedirect; }, 900);
    } else {
      setTimeout(onStartJourney, 900);
    }
  }, [onStartJourney, targetRedirect]);



  const warpLines = useMemo(() => (
    Array.from({ length: 20 }, (_, i) => ({
      id: `warp-line-${i}`,
      top: `${(i / 20) * 110 - 5}%`,
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
          {/* Layer 3: Deep Nebula — parallax disabled on mobile via static div */}
          {isMobile ? (
            <div className="hero-layer hero-layer--nebula">
              <div className="hero-nebula" />
              <div className="ambient-orb ambient-orb-3" />
            </div>
          ) : (
            <motion.div className="hero-layer hero-layer--nebula" style={{ x: nebulaX, y: nebulaY }}>
              <div className="hero-nebula" />
              <div className="ambient-orb ambient-orb-3" />
            </motion.div>
          )}

          {/* Layer 2: Starfield */}
          {isMobile ? (
            <div className="hero-layer hero-layer--starfield">
              <div className="hero-starfield" />
              <div className="ambient-orb ambient-orb-2" />
            </div>
          ) : (
            <motion.div className="hero-layer hero-layer--starfield" style={{ x: starX, y: starY }}>
              <div className="hero-starfield" />
              <div className="ambient-orb ambient-orb-2" />
            </motion.div>
          )}

          {/* Layer 1: Foreground Grid */}
          {isMobile ? (
            <div className="hero-layer hero-layer--grid">
              <div className="hero-grid-wrapper">
                <div className="hero-grid" />
              </div>
              <div className="ambient-orb ambient-orb-1" />
            </div>
          ) : (
            <motion.div className="hero-layer hero-layer--grid" style={{ x: gridX, y: gridY }}>
              <div className="hero-grid-wrapper">
                <div className="hero-grid" />
              </div>
              <div className="ambient-orb ambient-orb-1" />
            </motion.div>
          )}

          {/* Layer 4: Neural Dust (Near plane) — skip entirely on mobile */}
          {!isMobile && (
            <motion.div className="hero-layer hero-layer--dust" style={{ x: dustX, y: dustY }}>
              <div className="neural-dust-field" />
            </motion.div>
          )}

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
          >
            <motion.div variants={fadeUp} className="hero-eyebrow-row">
              <span className="hero-badge">
                <span className="hero-badge__dot" />
                <AlrehlaWordmark height={14} color="var(--gold)" className="inline-block" />
              </span>
              <PulseBadge count={pulseCount} />
            </motion.div>

            <motion.h1 variants={fadeUp} className="headline-static hero-headline">
              <span ref={headlineLineRef} className="headline-line headline-glow">
                {dynamicHeadline || "أنت لست ضائعاً"}
              </span>
              {!dynamicHeadline && (
                <span className="headline-inline-row mt-1">
                  <span className="headline-subline">أنت فقط</span>
                  <RotatingWord isMobile={isMobile} />
                </span>
              )}
            </motion.h1>

            <motion.div variants={fadeUp} className="hero-divider" />

            <motion.p variants={fadeUp} className={`hero-body ${hideCta ? 'hero-body--no-cta' : ''}`}>
              {dynamicSubline || "توقف. مشكلتك ليست التعب — مشكلتك أنك ماشي في ضباب وفاكر ده هو الطريق. حولك أوهام متنكرة في شكل حقائق، وعلاقات متنكرة في شكل حب. نحن نكشف لك ما خفي عنك — نُنير لك الحقيقة عن نفسك وعن مَن حولك، لتأخذ قراراتك بعلم لا بوهم."}
            </motion.p>

            <div className={`hero-cta-container ${hideCta ? 'hidden md:hidden max-md:block' : ''}`}>
              <motion.div variants={fadeUp}>
                {hideCta ? (
                  <div className="flex justify-center mt-12">
                    <motion.button
                      type="button"
                      className="hero-command-btn group cosmic-pulse-btn"
                      onClick={handleStart}
                      id="hero-cta-start-returning"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={isMobile ? {} : { boxShadow: ["0 4px 15px rgba(20, 184, 166, 0.3)", "0 4px 30px rgba(20, 184, 166, 0.8)", "0 4px 15px rgba(20, 184, 166, 0.3)"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="relative z-10 font-black tracking-wide">{dynamicCta || ctaJourney}</span>
                      <ArrowLeft className="hero-cta-icon hero-cta-icon--arrow relative z-10 transition-transform duration-300 group-hover:-translate-x-2" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="hero-command-bar">
                    <input
                      type="text"
                      id="mirror-name"
                      name="mirrorName"
                      placeholder="اسمك (اختياري)"
                      aria-label="اكتب اسمك"
                      value={mirrorName}
                      onChange={e => setMirrorName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleStart(); }}
                      maxLength={24}
                      dir="rtl"
                      className="hero-command-input"
                    />
                    <motion.button
                      type="button"
                      className="hero-command-btn group cosmic-pulse-btn"
                      onClick={handleStart}
                      id="hero-cta-start"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={isMobile ? {} : { boxShadow: ["0 4px 15px rgba(20, 184, 166, 0.3)", "0 4px 30px rgba(20, 184, 166, 0.8)", "0 4px 15px rgba(20, 184, 166, 0.3)"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span className="relative z-10 font-black tracking-wide">{dynamicCta || ctaJourney}</span>
                      <ArrowLeft className="hero-cta-icon hero-cta-icon--arrow relative z-10 transition-transform duration-300 group-hover:-translate-x-2" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="map-area"
            initial={{ opacity: 0, scale: 0.88, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: techEase, delay: 0.35 }}
          >
            <LeadershipMap reduceMotion={reduceMotion} isMobile={isMobile} />
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
                جاري كشف الحقيقة...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
