import React, { type FC, useEffect, useState, useCallback, useMemo, useLayoutEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Zap, Shield } from "lucide-react";

/**
 * HeroSection Variant: v1_high_resonance 🧬
 * Hypothesis: Slower word rotation and higher visual contrast reduce cognitive load.
 */

interface HeroSectionProps {
  onStartJourney: () => void;
  mirrorName: string;
  setMirrorName: (name: string) => void;
  pulseCount: number;
  trustPoints: string[];
  ctaJourney: string;
}

const ROTATING_WORDS = [
  "وقتك مش ليك",
  "طاقتك لغيرك",
  "حدودك مستباحة",
  "صوتك مخنوق",
  "همهم عليك",
  "مكانك مش واضح",
  "حياتك لغيرك",
  "نفسك آخر همك"
];

const HERO_STYLES = `
  .hero-root {
    --void: #02040a;
    --cyan: #00f0ff;
    --gold: #f5a623;
    --glass-bg: rgba(5, 8, 20, 0.85); /* Increased opacity */
    --glass-border: rgba(0, 240, 255, 0.4); /* Higher contrast */
    position: relative;
    min-height: 100svh;
    background: var(--void);
    color: white;
    overflow: hidden;
  }
  /* ... simplified styles for the mutation test ... */
  .hero-content {
     max-width: 1200px;
     margin: 0 auto;
     padding: 100px 20px;
     display: grid;
     grid-template-columns: 1fr 1fr;
     gap: 40px;
     align-items: center;
  }
  .mutation-badge {
    position: fixed;
    top: 20px;
    left: 20px;
    background: #2dd4bf;
    color: black;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 900;
    z-index: 100;
  }
  @media (max-width: 1024px) {
    .hero-content { grid-template-columns: 1fr; text-align: center; }
  }
`;

export default function HeroSectionVariant({ 
  onStartJourney, 
  mirrorName, 
  setMirrorName, 
  pulseCount, 
  trustPoints, 
  ctaJourney 
}: HeroSectionProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Slower rotation for resonance: 6 seconds instead of 4
    const id = setInterval(() => {
      setIndex(i => (i + 1) % ROTATING_WORDS.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-root" dir="rtl">
       <style>{HERO_STYLES}</style>
       <div className="mutation-badge">EVOLVED VERSION v1</div>
       
       <div className="hero-content">
          <div className="copy-area">
             <h1 className="text-5xl font-black mb-6 leading-tight">
               أنت لست مرهقاً <br/>
               <span className="text-teal-400">أنت فقط {ROTATING_WORDS[index]}</span>
             </h1>
             <p className="text-lg text-slate-400 mb-8">
               هنا بنساعدك تشوف خريطة نفسك الحقيقية وتوقف نزيف طاقتك.
             </p>
             
             <div className="flex flex-col gap-4">
               <input 
                 className="p-4 rounded-xl bg-slate-900 border border-teal-500/30 text-white" 
                 placeholder="اسمك إيه؟"
                 value={mirrorName}
                 onChange={e => setMirrorName(e.target.value)}
               />
               <button onClick={onStartJourney} className="p-4 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center gap-2">
                 <Zap size={20} /> {ctaJourney}
               </button>
             </div>
          </div>
          
          <div className="visual-area flex justify-center">
             <div className="w-80 h-80 rounded-full border-2 border-teal-500/20 animate-pulse flex items-center justify-center">
                <Shield size={100} className="text-teal-400 opacity-20" />
             </div>
          </div>
       </div>
    </div>
  );
}
