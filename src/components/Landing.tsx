import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Shield, Zap,
  ChevronDown, Heart, Brain
} from "lucide-react";
import { recordFlowEvent } from "../services/journeyTracking";
import { usePWAInstall } from "../contexts/PWAInstallContext";
import { getLivePulseCount, shouldTriggerHeartbeat } from "../services/pulseEngagement";

import { soundManager } from "../services/soundManager";
import { LandingSimulation } from "./LandingSimulation";

import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import { LandingFooter } from "./landing/LandingFooter";
import { trackEvent, AnalyticsEvents, trackLandingView, trackLead } from "../services/analytics";
import { isUserMode } from "../config/appEnv";
import { landingCopy } from "../copy/landing";

/* ─── Props ─────────────────────────────────────────────────────────────────── */

interface LandingProps {
  onStartJourney: () => void;
  onOpenSurvey?: () => void;
  ownerInstallRequestNonce?: number;
  onOwnerInstallRequestHandled?: () => void;
}

/* ─── Animation Variants ─────────────────────────────────────────────────────── */

const LANDING_STYLES = `
  .landing-dark-force {
    --space-void: #010204;
    --text-primary: #ffffff;
    --text-secondary: rgba(234, 237, 243, 0.75);
    --text-muted: rgba(148, 163, 184, 0.4);
    --glass-bg: rgba(6, 8, 14, 0.55);
    --glass-border: rgba(255, 255, 255, 0.06);
    --soft-teal: #14b8a6;
    --soft-teal-glow: rgba(20, 184, 166, 0.25);
    --luminous-cyan: #22d3ee;
    --aura-gold: #fbbf24;
    color-scheme: dark;
  }

  .cosmic-editorial {
    font-family: 'Tajawal', sans-serif;
    letter-spacing: -0.07em;
    line-height: 0.88;
    text-shadow: 0 0 50px rgba(45, 212, 191, 0.1);
  }

  .mesh-gradient-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    background: radial-gradient(circle at 50% 0%, #080a12 0%, #010204 100%);
  }

  .mesh-ball {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    mix-blend-mode: screen;
    opacity: 0.12;
    animation: mesh-float 40s infinite alternate ease-in-out, breathe-pulse 19s infinite ease-in-out;
  }

  @keyframes mesh-float {
    0% { transform: translate(0%, 0%) scale(1); }
    33% { transform: translate(10%, -8%) scale(1.15); }
    66% { transform: translate(-15%, 12%) scale(0.9); }
    100% { transform: translate(5%, -5%) scale(1.05); }
  }

  @keyframes breathe-pulse {
    0% { opacity: 0.1; filter: blur(120px); }
    21% { opacity: 0.25; filter: blur(150px); } /* 4s inhale */
    58% { opacity: 0.25; filter: blur(150px); } /* 7s hold */
    100% { opacity: 0.1; filter: blur(120px); } /* 8s exhale */
  }

  .grain-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.04;
    pointer-events: none;
    z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }

  .glass-card-v2 {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 12px 64px 0 rgba(0, 0, 0, 0.45);
  }

  .hero-shell {
    position: relative;
    isolation: isolate;
  }

  .hero-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 28% 20%, rgba(20, 184, 166, 0.12), transparent 26%),
      radial-gradient(circle at 78% 34%, rgba(251, 191, 36, 0.08), transparent 22%);
    pointer-events: none;
  }

  .hero-shell::after {
    content: "";
    position: absolute;
    inset: auto 8% 8% 8%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.35), rgba(255, 255, 255, 0.2), transparent);
    opacity: 0.55;
    pointer-events: none;
  }

  .hero-visual-shell {
    background:
      radial-gradient(circle at 50% 35%, rgba(45, 212, 191, 0.2), transparent 40%),
      radial-gradient(circle at 65% 70%, rgba(251, 191, 36, 0.08), transparent 46%),
      rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      0 50px 150px rgba(0, 0, 0, 0.52),
      0 0 0 1px rgba(255, 255, 255, 0.03),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px) saturate(150%);
  }

  .hero-visual-note {
    letter-spacing: 0.24em;
  }

  .glow-border {
    position: relative;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .glow-border::before {
    content: "";
    position: absolute;
    inset: -150%;
    background: conic-gradient(from 0deg, transparent, rgba(45,212,191,0.6), transparent 40%);
    animation: rotate-glow 5s linear infinite;
    pointer-events: none;
    opacity: 0.6;
    transition: opacity 0.5s ease;
  }
  .glow-border:hover::before {
    opacity: 1;
    animation: rotate-glow 2.5s linear infinite;
  }
  @keyframes rotate-glow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .glow-border > * {
    position: relative;
    z-index: 1;
  }
`;

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

/* ─── Orbit Visualization ───────────────────────────────────────────────────── */

const OrbitViz: FC<{ reduceMotion: boolean | null; mirrorName: string }> = ({ reduceMotion, mirrorName }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduceMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const dx = (e.clientX - centerX) / 80;
      const dy = (e.clientY - centerY) / 80;
      setMousePos({ x: dx, y: dy });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [reduceMotion]);

  const nodes = [
    { cx: 190, cy: 190 - 82, r: 16, color: "var(--soft-teal)", delay: 0, label: "علاقة بميزانها", weight: 1.2 },
    { cx: 190 + 71, cy: 190 - 41, r: 14, color: "var(--soft-teal)", delay: 0.5, label: "دعم سيادي", weight: 0.8 },
    { cx: 190 + 112, cy: 190 + 65, r: 15, color: "var(--aura-gold)", delay: 0.3, label: "نبض متذبذب", weight: 1.5 },
    { cx: 190 - 65, cy: 190 + 112, r: 12, color: "var(--aura-gold)", delay: 1, label: "تشويش روح", weight: 0.9 },
    { cx: 190 - 150, cy: 190 - 80, r: 18, color: "var(--soft-teal)", delay: 0.7, label: "احتواء حقيقي", weight: 1.1 },
    { cx: 190 - 30, cy: 190 - 165, r: 14, color: "#ef4444", delay: 0.2, label: "نزيف طاقة", weight: 2 },
    { cx: 190 + 130, cy: 190 - 110, r: 13, color: "#ef4444", delay: 1.8, label: "حدود مهدورة", weight: 1.7 },
  ];

  return (
    <motion.div
      className="relative flex items-center justify-center select-none"
      aria-hidden="true"
      style={{
        width: 380,
        height: 380,
        rotateX: -mousePos.y * 0.5,
        rotateY: mousePos.x * 0.5,
      }}
    >
      <div className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          background: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.15) 0%, rgba(109,40,217,0.04) 40%, transparent 80%)",
          filter: "blur(60px)",
          transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`
        }} />

      <svg width="420" height="420" viewBox="0 0 380 380" fill="none" style={{ overflow: "visible", transform: "scale(1.2)" }}>
        {[
          { r: 82, stroke: "rgba(45,212,191,0.25)", dash: "none", dur: 25 },
          { r: 130, stroke: "rgba(251,191,36,0.18)", dash: "2 12", dur: 45 },
          { r: 175, stroke: "rgba(239,68,68,0.15)", dash: "1 20", dur: 70 },
        ].map((ring, i) => (
          <motion.g key={i}
            animate={reduceMotion ? {} : { rotate: 360 }}
            transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "190px 190px" }}
          >
            <circle
              cx="190" cy="190" r={ring.r}
              stroke={ring.stroke} strokeWidth="1" fill="none"
              strokeDasharray={ring.dash === "none" ? undefined : ring.dash}
            />
          </motion.g>
        ))}

        {nodes.map((node, i) => (
          <motion.g key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            animate={reduceMotion ? {} : {
              opacity: hoveredIdx === i ? 1 : [0.7, 0.9, 0.7],
              scale: hoveredIdx === i ? 1.3 : [1, 1.05, 1],
              x: mousePos.x * (node.weight || 1),
              y: mousePos.y * (node.weight || 1)
            }}
            transition={{ 
              x: { type: "spring", stiffness: 50, damping: 20 }, 
              y: { type: "spring", stiffness: 50, damping: 20 },
              opacity: { duration: 3 + node.delay, repeat: Infinity, ease: "easeInOut" }
            }}
            style={{ transformOrigin: `${node.cx}px ${node.cy}px`, cursor: "pointer" }}
          >
            <circle cx={node.cx} cy={node.cy} r={node.r + 10} fill={node.color} opacity={0.08} />
            <circle cx={node.cx} cy={node.cy} r={node.r} fill={node.color}
              style={{ filter: `drop-shadow(0 0 ${hoveredIdx === i ? 30 : 12}px ${node.color}cc)` }} />
            
            <AnimatePresence>
              {hoveredIdx === i && (
                <motion.foreignObject
                  x={node.cx + 20} y={node.cy - 12} width="180" height="40"
                  initial={{ opacity: 0, x: node.cx + 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: node.cx + 20, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                >
                  <div style={{ 
                    background: "rgba(6,8,14,0.85)", 
                    border: `1px solid ${node.color}55`, 
                    borderRadius: 16, padding: "8px 16px", color: "#fff", 
                    fontSize: 13, fontWeight: 900, whiteSpace: "nowrap",
                    backdropFilter: "blur(12px)", 
                    boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 25px ${node.color}33`
                  }}>
                    {node.label}
                  </div>
                </motion.foreignObject>
              )}
            </AnimatePresence>
          </motion.g>
        ))}

        <motion.g
          animate={reduceMotion ? {} : { 
            scale: [1, 1.15, 1],
            opacity: [0.95, 1, 0.95],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "190px 190px" }}
        >
          <circle cx="190" cy="190" r={16} fill="var(--soft-teal)" style={{ filter: "drop-shadow(0 0 30px var(--soft-teal))" }} />
          <circle cx="190" cy="190" r={8} fill="#010204" />
        </motion.g>
      </svg>

      <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-8 opacity-60">
        {[
          { color: "var(--soft-teal)", label: "نبض سيادي" },
          { color: "var(--aura-gold)", label: "تشويش" },
          { color: "#ef4444", label: "نزيف" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
            <span className="text-[11px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};


/* ─── Floating Signatures (Cosmic Labels) ───────────────────────────────────── */
const FloatingSignatures: FC = () => {
  const signatures = landingCopy.floatingSignatures || ["علاقة سامة", "استنزاف طاقة", "حدود مكسورة"];
  
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
      {signatures.map((text, i) => {
        const delay = i * 1.5;
        const top = 15 + (i * 22) % 65;
        const left = 10 + (i * 35) % 80;
        
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0, 0.4, 0.4, 0], 
              scale: [0.8, 1, 1, 0.8],
              y: [-10, 10, -10]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              delay,
              ease: "easeInOut"
            }}
            className="absolute whitespace-nowrap text-[9px] font-black uppercase tracking-[0.3em] text-slate-200 sm:text-[11px]"
            style={{ 
               top: `${top}%`, 
               left: `${left}%`,
               filter: 'drop-shadow(0 0 10px rgba(45,212,191,0.18))',
                fontFamily: 'Tajawal'
             }}
          >
            ✦ {text}
          </motion.div>
        );
      })}
    </div>
  );
};

const ROTATING_WORDS = ["مُنتهك الحدود", "تنزف طاقتك ببطء", "مُثقل بنبض الآخرين", "في مسار مشتت"];

const TypingWord: FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block" style={{ minWidth: "6.5ch" }}>
      <span className="invisible select-none pointer-events-none whitespace-nowrap block" aria-hidden="true">
        مُثقل بنبض الآخرين
      </span>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[0.68em] text-[var(--luminous-cyan)] sm:text-[0.8em] lg:text-[0.86em]"
            style={{
              fontWeight: 950,
              textShadow: "0 0 18px rgba(34,211,238,0.26)"
            }}
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────────── */

export const Landing: FC<LandingProps> = ({
  onStartJourney,
  onOpenSurvey,
  ownerInstallRequestNonce = 0,
  onOwnerInstallRequestHandled,
}) => {
  const reduceMotion = useReducedMotion();
  const nodesCount = useMapState((s) => s.nodes.length);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const lastGoalId = useJourneyState((s) => s.goalId);
  const lastGoalCategory = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const lastGoalMeta = getGoalMeta(lastGoalRecord?.goalId);
  const hasExistingJourney = Boolean(baselineCompletedAt || nodesCount > 0);

  const pwaInstall = usePWAInstall();
  const [showDesktopInstallFallback, setShowDesktopInstallFallback] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    const isTouch = "ontouchstart" in window || nav.maxTouchPoints > 0;
    setShowDesktopInstallFallback(!isStandalone && !isTouch);
  }, []);

  const shouldShowLandingInstallButton =
    Boolean(pwaInstall?.canShowInstallButton) || showDesktopInstallFallback;
  const installButtonLabel =
    pwaInstall?.isIOS || pwaInstall?.isAndroid ? "ثبّت على الهاتف" : "ثبّت التطبيق";

  const showTestimonials = true;

  const lastNonceRef = useRef(0);

  const handleInstall = useCallback(() => {
    if (pwaInstall) {
      void pwaInstall.triggerInstall();
    } else if (typeof window !== "undefined") {
      window.alert('على Chrome أو Edge من الكمبيوتر: افتح قائمة المتصفح ثم اختر "Install app" أو "تثبيت التطبيق".');
    }
    onOwnerInstallRequestHandled?.();
    void recordFlowEvent("install_clicked");
  }, [pwaInstall, onOwnerInstallRequestHandled]);

  if (ownerInstallRequestNonce !== lastNonceRef.current && ownerInstallRequestNonce > 0) {
    lastNonceRef.current = ownerInstallRequestNonce;
    handleInstall();
  }

  const [mirrorName, setMirrorName] = useState("");
  const [pulseCount, setPulseCount] = useState(getLivePulseCount());
  const [isWarping, setIsWarping] = useState(false);
  const landingViewTrackedRef = useRef(false);
  const startTrackedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (shouldTriggerHeartbeat()) {
        setPulseCount(getLivePulseCount());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isUserMode || landingViewTrackedRef.current) return;
    landingViewTrackedRef.current = true;
    trackLandingView({
      entry_variant: "default"
    });
  }, []);

  const handleStart = useCallback(() => {
    if (startTrackedRef.current) return;
    startTrackedRef.current = true;

    void recordFlowEvent("landing_clicked_start");
    trackEvent(AnalyticsEvents.CTA_CLICK, {
      source: "landing",
      cta_name: "start_journey",
      intent: mirrorName ? "mirror_named" : "default"
    });
    
    if (mirrorName) {
      useJourneyState.getState().setMirrorName(mirrorName);
    }

    setIsWarping(true);
    soundManager.playEffect("cosmic_pulse");
    
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.assign("/onboarding");
      }
    }, 1200);
  }, [mirrorName]);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden landing-dark-force"
       style={{ background: "var(--space-void)", fontFamily: "var(--font-sans)" }}
      dir="rtl"
    >
      <style>{LANDING_STYLES}</style>

      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: [
            "radial-gradient(ellipse 60% 50% at 20% 10%, rgba(13,148,136,0.06) 0%, transparent 55%)",
            "radial-gradient(ellipse 50% 40% at 80% 80%, rgba(109,40,217,0.05) 0%, transparent 50%)",
            "radial-gradient(ellipse 40% 30% at 50% 50%, rgba(20,184,166,0.03) 0%, transparent 55%)"
          ].join(", ")
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      <section className="hero-orbital-center hero-shell relative overflow-hidden px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mesh-gradient-bg">
          <div className="mesh-ball w-[600px] h-[600px] bg-teal-500/15 top-[-10%] right-[-5%]" />
          <div className="mesh-ball w-[500px] h-[500px] bg-indigo-600/15 bottom-[-5%] left-[-10%] animate-[mesh-float_30s_infinite_reverse]" />
          <div className="mesh-ball w-[400px] h-[400px] bg-cyan-400/10 top-[20%] left-[20%] animate-[mesh-float_40s_infinite]" />
        </div>
        <div className="grain-overlay" />

        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_40%),radial-gradient(circle_at_left_center,rgba(59,130,246,0.08),transparent_35%),linear-gradient(180deg,rgba(3,4,11,0.6)_0%,rgba(3,4,11,0.9)_100%)]" />
          <div className="hero-starfield opacity-20" />
          <FloatingSignatures />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto flex min-h-[66vh] w-full max-w-7xl flex-col justify-center pb-8 lg:flex-row lg:items-center lg:justify-start lg:gap-12 lg:pb-10 xl:min-h-[62vh]"
        >
          <div className="relative z-10 flex flex-col items-center text-center mt-8 lg:mt-0 lg:max-w-[34rem] lg:-translate-x-8 lg:items-start lg:text-right xl:max-w-[33rem] xl:-translate-x-12">
            <motion.div
              variants={fadeUp}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.34em] text-white/85 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--soft-teal)] shadow-[0_0_16px_rgba(45,212,191,0.8)]" aria-hidden="true" />
              <span>DAWAYIR</span>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-5 hidden items-center gap-3 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-[9px] font-black uppercase tracking-[0.42em] text-white/45 sm:inline-flex"
            >
              <span className="h-px w-10 bg-gradient-to-r from-transparent via-teal-300/70 to-transparent" aria-hidden="true" />
              opening frame
            </motion.div>

            <motion.span
              variants={fadeUp}
              className="mt-4 inline-flex max-w-[20rem] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] sm:max-w-none"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--soft-teal)] shadow-[0_0_16px_rgba(45,212,191,0.75)]" />
              {landingCopy.hook}
            </motion.span>

            <motion.h1
              variants={fadeUp}
            className="cosmic-editorial mt-7 flex max-w-[11ch] flex-col items-center gap-1.5 text-center text-[1.58rem] font-black leading-[1.02] tracking-[-0.075em] text-[var(--text-primary)] sm:max-w-[15ch] sm:items-end sm:gap-3 sm:text-right sm:text-[3.6rem] sm:leading-[1.0] lg:max-w-[14ch] lg:text-[4.05rem] xl:max-w-[13ch] xl:text-[4.25rem]"
              style={{ textWrap: "balance" }}
            >
              <span className="block whitespace-normal leading-[0.94] sm:whitespace-nowrap">{landingCopy.titleLine1}</span>
              <span className="block whitespace-normal leading-[0.94] text-[0.98em] sm:whitespace-nowrap sm:text-[0.98em]">{landingCopy.titleLine2.trimEnd()}</span>
              <span className="mt-1 block leading-[1]">
                <TypingWord />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[26rem] text-balance text-right text-[0.82rem] leading-[1.85] text-[var(--text-secondary)] sm:mt-6 sm:max-w-[28rem] sm:text-[0.95rem] font-medium"
            >
              {landingCopy.subtitle}
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-[30rem] text-[8px] font-black uppercase tracking-[0.34em] text-white/42 sm:mt-4"
            >
              {landingCopy.description}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-5 hidden items-center gap-3 rounded-full border border-white/10 bg-slate-950/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.34em] text-teal-200 backdrop-blur-xl sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.65)]" aria-hidden="true" />
              first screen / live decision
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-4 flex w-full max-w-[34rem] flex-col gap-3 sm:mt-6 sm:flex-row sm:gap-3 lg:justify-start"
            >
              <motion.button
                type="button"
                onClick={handleStart}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.96 }}
                className="group glow-border relative overflow-hidden inline-flex min-h-[56px] flex-1 items-center justify-center gap-3 rounded-[1.35rem] px-5 py-4 text-[0.92rem] font-black text-white shadow-[0_22px_55px_rgba(20,184,166,0.42)] transition-all duration-300 sm:min-h-[60px] sm:gap-4 sm:rounded-[1.55rem] sm:px-7 sm:py-4 sm:text-[1rem]"
                style={{ 
                  background: "linear-gradient(135deg, #5eead4 0%, #2dd4bf 20%, #14b8a6 48%, #0f766e 76%, #083344 100%)",
                  fontFamily: "Tajawal"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" style={{ transform: 'skewX(-20deg)' }} />
                <Zap className="h-4.5 w-4.5 fill-white animate-pulse sm:h-5 sm:w-5" />
                <span>{landingCopy.ctaJourney}</span>
                <ArrowLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-3 sm:h-5 sm:w-5" />
              </motion.button>

              <motion.button
                type="button"
                onClick={() => document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 px-5 py-4 text-[0.84rem] font-black text-white shadow-[0_16px_34px_rgba(0,0,0,0.2)] backdrop-blur-3xl transition-all hover:bg-white/10 hover:border-white/20 sm:min-h-[60px] sm:gap-4 sm:rounded-[1.55rem] sm:px-7 sm:py-4 sm:text-[0.92rem] sm:flex-none"
              >
                {landingCopy.secondaryCta}
                <ChevronDown className="h-4.5 w-4.5 opacity-40 group-hover:translate-y-2 transition-transform" />
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3 lg:justify-start"
            >
              {[
                { icon: Zap, label: landingCopy.trustPoints[0] },
                { icon: Heart, label: landingCopy.trustPoints[1] },
                { icon: Shield, label: landingCopy.trustPoints[2] },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[10px] font-bold text-white backdrop-blur-xl sm:px-4 sm:text-xs"
                >
                  <Icon className="h-4 w-4 text-[var(--soft-teal)]" />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            variants={fadeIn}
            className="absolute inset-x-0 top-0 bottom-0 z-0 flex items-center justify-center opacity-18 pointer-events-none sm:opacity-24 lg:justify-end lg:pr-0 lg:opacity-78 overflow-hidden"
          >
            <div
              className="relative flex w-[108vw] h-[108vw] max-w-[640px] max-h-[640px] items-center justify-center"
            >
              <div
                className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.15)_0%,rgba(251,191,36,0.08)_34%,rgba(59,130,246,0.08)_58%,transparent_76%)] blur-3xl"
                aria-hidden="true"
              />
              <div
                className="relative flex items-center justify-center w-full h-full lg:translate-x-[6%]"
              >
                <div
                  className="orbit-atmospheric relative scale-[0.96] sm:scale-[1] lg:scale-[1.05]"
                  style={{
                    maskImage: "radial-gradient(circle at 50% 50%, black 0%, black 58%, rgba(0,0,0,0.86) 72%, transparent 96%)",
                    WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 0%, black 58%, rgba(0,0,0,0.86) 72%, transparent 96%)",
                  }}
                >
                  <OrbitViz reduceMotion={reduceMotion} mirrorName={mirrorName} />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.2), transparent)" }} />
      </div>

      <section className="relative py-20 px-5 max-w-5xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#14B8A6" }}>
              خطوتين بسيطتين
            </p>
              <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              {landingCopy.howItWorks.title}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{landingCopy.howItWorks.subtitle}</p>
          </motion.div>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-5">
            {landingCopy.howItWorks.steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative flex flex-col gap-4 rounded-2xl p-7"
                style={{
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)"
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{
                    background: ["rgba(20,184,166,0.15)", "rgba(124,58,237,0.15)", "rgba(251,191,36,0.15)"][i],
                    color: ["#14B8A6", "#7C3AED", "#FBBF24"][i]
                  }}
                >
                  {["١", "٢", "٣"][i]}
                </div>
                  <h3 className="text-base font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>{step.title}</h3>
                <p className="text-sm leading-loose" style={{ color: "var(--text-secondary)" }}>{step.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.25), transparent)" }} />
      </div>

      <section className="relative py-20 px-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease }}
        >
          <div className="text-center mb-8">
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: "#7C3AED" }}>
              جرّب بنفسك
            </p>
              <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              دقيقتين تكشفلك الحقيقة
            </h2>
            <p className="text-sm max-w-[38ch] mx-auto" style={{ color: "var(--text-secondary)" }}>
              3 أسئلة بسيطة — بدون تفكير — وهتعرف إيه اللي سارق طاقتك فعلاً
            </p>
          </div>
          <LandingSimulation />
        </motion.div>
      </section>

      {showTestimonials && (
        <>
          <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)" }} />
          </div>

          <section className="relative py-20 px-5 max-w-4xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.div variants={fadeUp} className="text-center mb-10">
                <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: "#7C3AED" }}>
                  فوج التأسيس
                </p>
                <h2 className="text-2xl sm:text-3xl font-black " style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  ناس زيّك بدأوا رحلتهم
                </h2>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-5">
                {landingCopy.testimonials?.map((t, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="relative rounded-2xl p-7"
                    style={{
                      border: "1px solid rgba(124,58,237,0.15)",
                      background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.05) 0%, transparent 70%)"
                    }}
                  >
                    <Heart className="w-4 h-4 mb-4" style={{ color: "#7C3AED" }} />
                    <p className="text-sm leading-loose mb-5" style={{ color: "var(--text-secondary)" }}>&#x201C;{t.quote}&#x201D;</p>
                    <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>— {t.author}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>
        </>
      )}

      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.25), transparent)" }} />
      </div>

      <section className="relative py-20 px-5 max-w-3xl mx-auto text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-3xl p-10 sm:p-14"
          style={{
            border: "1px solid rgba(20,184,166,0.18)",
            background: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.07) 0%, transparent 65%)"
          }}
        >
          <motion.div variants={fadeUp} className="text-4xl mb-5">🌟</motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl font-black  mb-4"
             style={{ fontFamily: "var(--font-display)" }}
          >
            الوضوح موجود — هو بس محتاج خريطة.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-sm leading-loose max-w-[40ch] mx-auto mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            بدون تسجيل. بدون حكم. بدون ضغط.
            بس خطوة واحدة تقول فيها: "جاهز أشوف الحقيقة."
          </motion.p>

          <motion.div variants={stagger} className="flex flex-wrap justify-center gap-2 mb-8">
            {["بدون تسجيل", "بياناتك ليك", "مش بنحكم", "مفيش إشعارات زيادة"].map((t) => (
              <motion.span
                key={t}
                variants={fadeIn}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ border: "1px solid rgba(20,184,166,0.2)", background: "rgba(20,184,166,0.05)", color: "#5EEAD4" }}
              >
                ✓ {t}
              </motion.span>
            ))}
          </motion.div>

          <motion.button
            variants={fadeUp}
            type="button"
            id="landing-final-cta"
            onClick={handleStart}
            className="group inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-black text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A1A]"
            style={{ background: "linear-gradient(135deg, #14B8A6, #0d9488)", boxShadow: "0 14px 42px rgba(20,184,166,0.28)" }}
            whileHover={{ scale: 1.04, boxShadow: "0 18px 50px rgba(20,184,166,0.38)" }}
            whileTap={{ scale: 0.97 }}
          >
            استعد مساحتك — مجاناً
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </motion.button>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-8 mt-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
      </div>

      <LandingFooter
        trustPoints={landingCopy.trustPoints}
        stagger={stagger}
        onOpenLegal={(path) => {
          if (typeof window !== "undefined") window.open(path, "_blank", "noopener,noreferrer");
        }}
      />
      
      <AnimatePresence>
        {isWarping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A1A]"
          >
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-[1px] bg-gradient-to-l from-teal-400 to-transparent"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: "-100%",
                    width: `${20 + Math.random() * 50}%`,
                    opacity: 0.2 + Math.random() * 0.5,
                  }}
                  animate={{
                    left: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 0.3 + Math.random() * 0.4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: Math.random() * 0.5
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
