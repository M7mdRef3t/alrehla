import React, { type FC, useEffect, useState, useCallback, useRef, Fragment } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Zap, Shield, Heart, ShieldCheck } from "lucide-react";

/* ——— Types ———————————————————————————————————————————————————————————— */
interface HeroSectionProps {
  onStartJourney: () => void;
  mirrorName: string;
  setMirrorName: (name: string) => void;
  pulseCount: number;
  trustPoints: string[];
  ctaJourney: string;
  secondaryCta: string;
}

/* ——— Constants —————————————————————————————————————————————————————————— */
const ROTATING_WORDS = [
  "دوايرك ملخبطة",
  "طاقتك بتتسرب",
  "حدودك مستباحة",
  "خايف تقول لأ",
  "مراية لزعل غيرك",
  "تايه في خوارزمياتهم",
  "نبضك مربوط بغيرك",
  "سايب بابك موارب"
];

/* ——— Styles ————————————————————————————————————————————————————————————— */
const HERO_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&family=Tajawal:wght@400;700;800;900&display=swap');

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
    
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    overflow: hidden;
    background: var(--void);
    font-family: 'Alexandria', sans-serif;
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

  .hero-content-wrapper {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 6rem 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5rem;
  }

  .hero-copy-column {
    flex: 1 1 50%;
    max-width: 700px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    text-align: right;
  }

  .hero-headline {
    font-size: clamp(3rem, 6vw, 5.2rem);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.03em;
    color: #fff;
    margin-bottom: 0.5rem;
  }

  .hero-input-wrapper {
    display: flex;
    align-items: center;
    border-radius: 24px;
    overflow: hidden;
    max-width: 460px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .hero-input-wrapper:focus-within {
    border-color: rgba(0, 240, 255, 0.4);
    box-shadow: 0 0 30px rgba(0, 240, 255, 0.15);
    background: rgba(15, 23, 42, 0.6);
  }

  .hero-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.4);
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.3);
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
    padding: 15px 18px;
    font-size: 13px;
    background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 40%, #5eead4 75%, #a7f3d0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 12px rgba(45,212,191,0.28));
    font-weight: 800;
    white-space: nowrap;
    position: relative;
    z-index: 1;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .hero-input-note {
    font-size: 10.5px;
    color: #627a8e;
    font-weight: 600;
    padding-right: 4px;
  }

  .hero-headline {
    font-size: clamp(2.5rem, 5vw, 4.1rem);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    overflow: visible;
    font-family: "Alexandria", sans-serif;
    line-height: 1.15;
    padding-top: 0;
    padding-bottom: 0.3em;
    color: var(--text-main);
  }

  .hero-body {
    font-size: 1.25rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.7);
    max-width: 580px;
  }

  .hero-action-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: fit-content;
    align-items: center;
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
    width: 100%;
    margin-top: 4px;
    letter-spacing: 0.03em;
  }

  .hero-bottom-fade {
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 450px;
    background: linear-gradient(to top, 
      var(--void) 0%, 
      var(--void) 20%, 
      rgba(2, 4, 10, 0.5) 50%, 
      transparent 100%
    );
    pointer-events: none;
    z-index: 5;
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
    color: rgba(255,255,255,0.7);
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
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
    mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 95%);
    -webkit-mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 95%);
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
    display: inline-flex;
    align-items: center;
    width: auto;
    min-height: 1.3em;
    padding: 0;
    overflow: visible;
    white-space: nowrap;
    font-family: "Noto Kufi Arabic";
    line-height: 1.2;
    vertical-align: middle;
    text-align: right;
  }

  .hero-body {
    font-size: 1rem;
    line-height: 1.85;
    color: var(--text-muted);
    max-width: 520px;
    text-align: justify;
    text-align-last: right;
    margin-top: 0.5rem;
  }

  .cta-primary {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 2px; /* For the gradient border effect */
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, transparent 50%, rgba(0, 240, 255, 0.2) 100%);
    cursor: pointer;
    border: none;
    transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
    overflow: hidden;
    z-index: 5;
  }

  .cta-primary:hover {
    transform: translateY(-2px) scale(1.01);
  }

  .cta-primary:active {
    transform: translateY(1px) scale(0.98);
  }

  .cta-surface {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 16px 36px;
    background: #02040a;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 2;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  }

  .cta-liquid {
    position: absolute;
    inset: -100%;
    background: radial-gradient(circle at center, rgba(0, 240, 255, 0.1) 0%, transparent 70%);
    animation: cta-liquid-flow 6s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes cta-liquid-flow {
    0% { transform: translate(-10%, -10%) rotate(0deg); }
    50% { transform: translate(10%, 10%) rotate(180deg); }
    100% { transform: translate(-10%, -10%) rotate(360deg); }
  }

  .cta-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0) 40%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0) 60%,
      transparent 100%
    );
    transform: translateX(-100%) skewX(-15deg);
    pointer-events: none;
    z-index: 3;
  }

  .cta-primary:hover .cta-shimmer {
    animation: cta-shimmer-sweep 1.2s infinite;
  }

  @keyframes cta-shimmer-sweep {
    0% { transform: translateX(-150%) skewX(-15deg); }
    100% { transform: translateX(150%) skewX(-15deg); }
  }

  .cta-aura {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%);
    opacity: 0;
    filter: blur(15px);
    transition: opacity 0.4s ease;
    z-index: 0;
    pointer-events: none;
  }

  .cta-primary:hover .cta-aura {
    opacity: 1;
  }

  .hero-cta-icon {
    width: 20px;
    height: 20px;
    color: var(--cyan);
    filter: drop-shadow(0 0 8px var(--cyan-glow));
    transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
  }

  .hero-cta-icon--arrow {
    width: 18px;
    height: 18px;
    color: white;
    transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
  }

  .cta-primary:hover .hero-cta-icon--arrow {
    transform: translateX(-6px);
  }

    font-size: 1.1rem;
    font-weight: 800;
    color: #fff;
    font-family: 'Tajawal', sans-serif;
    letter-spacing: 0.01em;
    z-index: 5;
  }
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
    flex: 0 0 45%;
    width: min(48vw, 620px);
    position: relative;
    perspective: 1500px;
  }

  .metric-card {
    position: absolute;
    backdrop-filter: blur(20px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 18px;
    padding: 16px 20px;
    background: rgba(8, 12, 22, 0.7);
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    min-width: 130px;
  }

  .hero-scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.2), transparent);
    animation: scan 8s linear infinite;
    pointer-events: none;
  }

  @keyframes scan {
    0% { top: -4%; }
    100% { top: 104%; }
  }

  @media (max-width: 1023px) {
    .hero-content-wrapper {
      flex-direction: column;
      text-align: center;
      padding: 5rem 1.25rem;
    }
    .map-area {
      width: min(90vw, 400px);
      margin-top: 2rem;
    }
  }
`;

const techEase = [0.16, 1, 0.3, 1];

/* ——— Rotating Headline Word ————————————————————————————————————————————— */
const RotatingWord: FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % ROTATING_WORDS.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-[1.2em] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute right-0 left-0 text-cyan-400 font-bold"
        >
          {ROTATING_WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

/* ——— Sovereign Map (Simplified Restored Version) ————————————————————————— */
const SovereignMap: FC<{ reduceMotion: boolean | null }> = ({ reduceMotion }) => {
  return (
    <div className="relative aspect-square w-full max-w-[520px] mx-auto">
      <div className="hero-scan-line" />
      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,240,255,0.2)]">
        <circle cx="200" cy="200" r="180" stroke="rgba(0,240,255,0.1)" strokeWidth="1" fill="none" />
        <circle cx="200" cy="200" r="120" stroke="rgba(0,240,255,0.15)" strokeWidth="1" fill="none" />
        <circle cx="200" cy="200" r="60" stroke="rgba(0,240,255,0.2)" strokeWidth="1" fill="none" />
        
        <motion.circle 
          cx="200" cy="200" r="20" fill="#00f0ff" 
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Nodes */}
        {[
          { cx: 200, cy: 80, color: "#00f0ff", label: "ميزان" },
          { cx: 320, cy: 200, color: "#f5a623", label: "نبض" },
          { cx: 200, cy: 320, color: "#ff0055", label: "نزيف" },
          { cx: 80, cy: 200, color: "#00f0ff", label: "دواير" },
        ].map((node, i) => (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.2 }}>
            <line x1="200" y1="200" x2={node.cx} y2={node.cy} stroke={node.color} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <circle cx={node.cx} cy={node.cy} r="8" fill={node.color} />
          </motion.g>
        ))}
      </svg>
      
      {/* Metrics */}
      <motion.div 
        className="metric-card top-[5%] -right-[5%]"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="text-[10px] text-slate-400 block mb-1">صحتك الداخلية</span>
        <span className="text-xl font-black text-cyan-400">٩٨٪</span>
      </motion.div>

      <motion.div 
        className="metric-card bottom-[10%] -left-[5%]"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span className="text-[10px] text-red-400 block mb-1">نزيف طاقة</span>
        <span className="text-lg font-bold text-white">٣ مصادر</span>
      </motion.div>
    </div>
  );
};

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

  // 3D Tilt Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), { stiffness: 100, damping: 30 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleStart = () => {
    setIsWarping(true);
    setTimeout(onStartJourney, 1000);
  };

  return (
    <>
      <style>{HERO_STYLES}</style>
      <section className="hero-root" dir="rtl" onMouseMove={handleMouseMove}>
        <div className="hero-canvas" aria-hidden>
          <motion.div className="hero-layer hero-layer--starfield">
            <div className="hero-starfield" />
          </motion.div>
          <motion.div className="hero-layer hero-layer--grid">
            <div className="hero-grid-wrapper"><div className="hero-grid" /></div>
          </motion.div>
          <div className="hero-screen-vignette" />
          <div className="hero-screen-glow" />
        </div>
        <div className="hero-bottom-fade" />
        <div className="hero-content-wrapper">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: techEase }}
            className="hero-copy-column"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase">Dawayir — السيادة الشخصية</span>
              <div className="h-px w-12 bg-cyan-500/30" />
            </div>

            <h1 className="hero-headline">
              أنت لست مرهقاً <br />
              <span className="text-slate-500 font-light opacity-60 italic">أنت فقط</span>
              <RotatingWord />
            </h1>

            <p className="hero-body">
              "الرحلة" مش مجرد أداة، هي نظام تشغيل لوعيك بيشوف علاقاتك كداوئر طاقة. اعرف فين النزيف وابدأ تسترد سيادتك فوراً.
            </p>

            <div className="flex flex-col gap-6">
              <div className="hero-input-wrapper">
                <input
                  type="text"
                  placeholder="ماذا تحب أن نناديك؟"
                  value={mirrorName}
                  onChange={(e) => setMirrorName(e.target.value)}
                  className="hero-input"
                />
                <div className="hero-input-greeting">أهلاً بك</div>
              </div>

              <motion.button
                onClick={handleStart}
                whileHover={{ scale: 1.02, x: -5 }}
                whileTap={{ scale: 0.98 }}
                className="cta-primary"
              >
                <div className="cta-aura" />
                <div className="cta-surface">
                  <div className="cta-liquid" />
                  <div className="cta-shimmer" />
                  <Zap className="hero-cta-icon" fill="currentColor" />
                  <span className="text-lg font-black text-white">{ctaJourney}</span>
                  <ArrowLeft className="hero-cta-icon--arrow" />
                </div>
              </motion.button>
            </div>

            <div className="hero-trust-row">
              {trustPoints.map((point, i) => (
                <div key={i} className="trust-pill">
                  <ShieldCheck className="trust-icon" />
                  {point}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            style={{ rotateX, rotateY }}
            initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.5, ease: techEase, delay: 0.3 }}
            className="map-area"
          >
            <div className="sovereign-map__atmosphere" />
            <SovereignMap reduceMotion={reduceMotion} />
          </motion.div>
        </div>

        <AnimatePresence>
          {isWarping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mb-6 inline-block"
                >
                  <Zap size={48} className="text-cyan-400" />
                </motion.div>
                <p className="text-2xl font-black text-white tracking-widest animate-pulse">جاري فحص إحداثيات وعيك...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
};
