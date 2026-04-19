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
        <div className="hero-content-wrapper">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: techEase }}
            className="flex-1 max-w-[640px]"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Dawayir — السيادة الشخصية</span>
              <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-cyan-400">{pulseCount.toLocaleString()} يستعيدون نبضهم</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-4">
              أنت لست مرهقاً <br />
              <span className="text-slate-400 font-light text-4xl md:text-5xl">أنت فقط</span>
              <RotatingWord />
            </h1>

            <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-[500px] mb-8">
              خذ نفساً عميقاً. أنت لا تحتاج لمهام جديدة، أنت تحتاج للخريطة التي تصبح فيها <span className="text-white font-bold">مرئياً لنفسك</span>.
            </p>

            <div className="flex flex-col md:flex-row gap-4 mb-10">
              <input
                type="text"
                placeholder="ماذا تحب أن نناديك؟"
                value={mirrorName}
                onChange={(e) => setMirrorName(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-cyan-500/50 transition-colors w-full md:w-[260px]"
              />
              <motion.button
                onClick={handleStart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-cyan-500 text-black px-8 py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-cyan-400 transition-colors"
              >
                <Zap size={18} fill="currentColor" />
                <span>{ctaJourney}</span>
                <ArrowLeft size={18} />
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-6">
              {trustPoints.map((point, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <ShieldCheck size={14} className="text-cyan-500/50" />
                  {point}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            style={{ rotateX, rotateY, perspective: 1000 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: techEase, delay: 0.2 }}
            className="map-area"
          >
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
