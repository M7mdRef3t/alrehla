import React, { type FC, useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Heart } from "lucide-react";

/**
 * v2_performance_plus 🚀
 * Evolution: ADK Architectural Optimization
 * Rationale: Reducing Framer Motion overhead on high-frequency rotations.
 */

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

interface HeroSectionProps {
  onStartJourney: () => void;
  mirrorName: string;
  setMirrorName: (name: string) => void;
  pulseCount: number;
}

const HeroSectionV2: FC<HeroSectionProps> = ({ 
    onStartJourney, 
    mirrorName, 
    setMirrorName,
    pulseCount
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Smoother interval for less main-thread stutter
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 4000); // Slower, more readable rotation
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-root ob-dark-force p-6 md:p-12 min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Optimized Background Layers */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-900/10 to-transparent" />
        <div className="hero-grid opacity-20" />
      </div>

      <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Copy Column */}
        <div className="hero-copy-column text-right order-2 lg:order-1">
          <div className="hero-eyebrow-row mb-4">
             <div className="hero-badge bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full inline-flex items-center gap-2">
                <div className="hero-badge__dot bg-teal-400 w-2 h-2 rounded-full" />
                <span className="text-teal-400 text-[10px] font-bold tracking-widest uppercase">السيادة الشخصية</span>
             </div>
          </div>

          <h1 className="hero-headline text-white font-black text-5xl md:text-7xl leading-tight mb-6">
            <span className="block opacity-60 text-3xl md:text-4xl mb-2">لأن في الحقيقة</span>
            <div className="rotating-word-wrapper h-[1.2em] relative overflow-hidden" 
                 style={{ willChange: 'transform' }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={ROTATING_WORDS[index]}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.22, 1, 0.36, 1],
                    opacity: { duration: 0.4 }
                  }}
                  className="block text-teal-400 glow-sm"
                >
                  {ROTATING_WORDS[index]}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="block mt-2">وأنت مش داري</span>
          </h1>

          <p className="hero-body text-slate-400 text-lg mb-8 max-w-lg mr-0 ml-auto font-medium">
            الرحلة مش مجرد أداة، هي المساحة اللي هترجع فيها السيطرة على مدارك النفسي وتعرف مين فعلاً بيسندك ومين بيسحب من طاقتك.
          </p>

          <div className="hero-input-group mb-8">
            <div className="hero-input-wrapper bg-white/5 border border-white/10 p-1 rounded-2xl flex items-center">
               <input 
                type="text" 
                value={mirrorName}
                onChange={(e) => setMirrorName(e.target.value)}
                placeholder="لقبك أو اسمك هنا.."
                className="bg-transparent text-white px-4 py-3 flex-1 text-right outline-none font-bold"
               />
               <div className="px-4 text-teal-400 font-black border-l border-white/10">أهلاً بك</div>
            </div>
          </div>

          <div className="hero-action-row space-y-4">
            <button 
              onClick={onStartJourney}
              className="cta-primary w-full bg-teal-400 text-slate-900 font-black py-5 rounded-2xl text-xl hover:bg-teal-300 transition-all active:scale-[0.98] shadow-[0_10px_40px_rgba(45,212,191,0.3)]"
            >
              ابدأ رحلة السيادة →
            </button>
            <div className="hero-trust-row flex flex-wrap gap-3 justify-end opacity-60">
              <div className="trust-pill flex items-center gap-2"><Shield size={12}/> بياناتك مشفّرة محلياً</div>
              <div className="trust-pill flex items-center gap-2"><Zap size={12}/> جيل ثالث من الذكاء</div>
              <div className="trust-pill flex items-center gap-2"><Heart size={12}/> إنساني بالكامل</div>
            </div>
          </div>
        </div>

        {/* Map Illustration (Sovereign Map Placeholder for V2) */}
        <div className="map-area order-1 lg:order-2 flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 border-2 border-teal-500/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="absolute inset-0 rounded-full border border-teal-500/40 animate-ping opacity-20" />
                <Zap size={64} className="text-teal-400 opacity-60" />
                <div className="absolute -top-4 -right-4 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black">
                   نبض: {pulseCount}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default memo(HeroSectionV2);
