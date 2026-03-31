import os

file_path = r'c:\Users\ty\Downloads\Dawayir-main\Dawayir-main\src\components\Landing.tsx'

content = """import type { FC } from "react";
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
    --space-void: #03040b;
    --text-primary: #ffffff;
    --text-secondary: rgba(226, 232, 240, 0.85);
    --text-muted: rgba(148, 163, 184, 0.5);
    --glass-bg: rgba(10, 15, 28, 0.65);
    --glass-border: rgba(255, 255, 255, 0.08);
    --soft-teal: #14b8a6;
    --soft-teal-glow: rgba(20, 184, 166, 0.35);
    --luminous-cyan: #22d3ee;
    color-scheme: dark;
  }

  .cosmic-editorial {
    font-family: 'Tajawal', sans-serif;
    letter-spacing: -0.05em;
    line-height: 0.95;
    text-shadow: 0 0 30px rgba(255,255,255,0.05);
  }

  .mesh-gradient-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    background: radial-gradient(circle at 50% 50%, #03040b 0%, #000000 100%);
  }

  .mesh-ball {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    mix-blend-mode: screen;
    opacity: 0.15;
    animation: mesh-float 25s infinite alternate ease-in-out;
  }

  @keyframes mesh-float {
    0% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(15%, -10%) scale(1.1); }
    100% { transform: translate(-5%, 15%) scale(0.9); }
  }

  .grain-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.04;
    pointer-events: none;
    z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  .glass-card-v2 {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  .glow-border {
    position: relative;
  }
  .glow-border::before {
    content: "";
    position: absolute;
    inset: -1px;
    background: linear-gradient(45deg, transparent, rgba(45,212,191,0.3), transparent);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    border-radius: inherit;
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
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) / 40,
        y: (e.clientY - window.innerHeight / 2) / 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [reduceMotion]);

  const nodes = [
    { cx: 240, cy: 190, r: 14,  color: "#2DD4BF", delay: 0,   label: "علاقة مُشحِنة" },
    { cx: 190, cy: 100, r: 12,  color: "#2DD4BF", delay: 1.5, label: "دعم متبادل" },
    { cx: 290, cy: 190, r: 13,  color: "#FBBF24", delay: 0.3, label: "علاقة مختلطة" },
    { cx: 190, cy: 300, r: 11,  color: "#FBBF24", delay: 1,   label: "تذبذب طاقي" },
    { cx: 190, cy: 30,  r: 13,  color: "#ef4444", delay: 0.7, label: "استنزاف حاد" },
    { cx: 340, cy: 190, r: 12,  color: "#ef4444", delay: 0.2, label: "حدود مكسورة" },
    { cx: 70,  cy: 140, r: 11,  color: "#ef4444", delay: 1.8, label: "ارتباط مُرهِق" },
  ];

  return (
    <motion.div
      className="relative flex items-center justify-center select-none"
      aria-hidden="true"
      style={{
        width: 380,
        height: 380,
        x: mousePos.x,
        y: mousePos.y,
      }}
    >
      <div className="absolute rounded-full"
        style={{
          width: 420, height: 420,
          background: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.06) 40%, transparent 80%)",
          filter: "blur(40px)"
        }} />

      <svg width="380" height="380" viewBox="0 0 380 380" fill="none" style={{ overflow: "visible" }}>
        {[
          { r: 82,  stroke: "rgba(45,212,191,0.3)",  dash: "none", dur: 20 },
          { r: 130, stroke: "rgba(251,191,36,0.25)",  dash: "4 8",  dur: 35 },
          { r: 170, stroke: "rgba(239,68,68,0.2)",    dash: "2 12", dur: 50 },
        ].map((ring, i) => (
          <motion.g key={i}
            animate={reduceMotion ? {} : { rotate: 360 }}
            transition={{ duration: ring.dur, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "190px 190px" }}
          >
            <circle
              cx="190" cy="190" r={ring.r}
              stroke={ring.stroke} strokeWidth="1.5" fill="none"
              strokeDasharray={ring.dash === "none" ? undefined : ring.dash}
            />
            <motion.circle
               cx="190" cy={190 - ring.r} r={2}
               fill="#fff"
               style={{ filter: "drop-shadow(0 0 5px #fff)" }}
               animate={{ opacity: [0.3, 1, 0.3] }}
               transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.g>
        ))}

        {nodes.map((node, i) => (
          <motion.g key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            animate={reduceMotion ? {} : {
              opacity: hoveredIdx === i ? 1 : [0.8, 1, 0.8],
              scale: hoveredIdx === i ? 1.4 : [1, 1.1, 1],
              x: mousePos.x * (i * 0.1),
              y: mousePos.y * (i * 0.1)
            }}
            transition={{ duration: hoveredIdx === i ? 0.2 : 3 + node.delay, repeat: hoveredIdx === i ? 0 : Infinity, ease: "easeInOut", delay: hoveredIdx === i ? 0 : node.delay }}
            style={{ transformOrigin: `${node.cx}px ${node.cy}px`, cursor: "pointer" }}
          >
            <circle cx={node.cx} cy={node.cy} r={node.r + 6} fill={node.color} opacity={0.1} />
            <circle cx={node.cx} cy={node.cy} r={node.r} fill={node.color}
              style={{ filter: `drop-shadow(0 0 ${hoveredIdx === i ? 16 : 8}px ${node.color}aa)` }} />
            
            <AnimatePresence>
              {hoveredIdx === i && (
                <motion.foreignObject
                  x={node.cx + 12} y={node.cy - 14} width="110" height="40"
                  initial={{ opacity: 0, x: node.cx + 5 }}
                  animate={{ opacity: 1, x: node.cx + 14 }}
                  exit={{ opacity: 0 }}
                >
                  <div style={{ 
                    background: "rgba(255,255,255,0.98)", border: `2px solid ${node.color}`, 
                    borderRadius: 12, padding: "6px 12px", color: "#060813", 
                    fontSize: 12, fontWeight: 900, whiteSpace: "nowrap",
                    backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
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
            scale: mirrorName ? [1, 1.4, 1] : [1, 1.2, 1], 
            opacity: [0.9, 1, 0.9],
            filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
          }}
          transition={{ duration: mirrorName ? 1.5 : 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "190px 190px" }}
        >
          <circle cx="190" cy="190" r={12} fill="#2DD4BF" style={{ filter: "drop-shadow(0 0 15px #2DD4BF)" }} />
        </motion.g>
        <circle cx="190" cy="190" r={6} fill="#060813" opacity={0.9} />
      </svg>

      <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-6">
        {[
          { color: "#2DD4BF", label: "مُشحِن" },
          { color: "#FBBF24", label: "مختلط" },
          { color: "#ef4444", label: "مُرهِق" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}aa` }} />
            <span className="text-[12px] font-black tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
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

const ROTATING_WORDS = ["علاقة بتسحبك", "ضغط من غير سبب", "حدود مكسورة", "ذنب مالوش لزوم"];

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
    <span className="relative inline-block" style={{ minWidth: "6ch" }}>
      <span className="invisible select-none pointer-events-none whitespace-nowrap block" aria-hidden="true">
        ضغط من غير سبب
      </span>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 20, filter: "blur(12px)", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(12px)", scale: 1.1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[var(--luminous-cyan)]"
            style={{
              fontWeight: 950,
              textShadow: "0 0 40px rgba(34,211,238,0.4)"
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

      <section className="hero-orbital-center relative overflow-hidden px-4 pt-28 sm:px-6 sm:pt-36 lg:px-8">
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
          className="relative z-10 mx-auto grid min-h-[88vh] w-full max-w-7xl items-center gap-12 pb-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:gap-16 lg:pb-24"
        >
          <div className="order-1 flex flex-col items-center text-center lg:items-start lg:text-right">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--soft-teal)] shadow-[0_0_16px_rgba(45,212,191,0.75)]" />
              {landingCopy.hook}
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="cosmic-editorial mt-8 max-w-[11ch] text-[2.8rem] font-black leading-[0.92] tracking-[-0.06em] text-[var(--text-primary)] sm:text-[4.3rem] lg:max-w-[9ch] lg:text-[5.6rem]"
            >
              <span className="block">{landingCopy.titleLine1}</span>
              <span className="mt-3 block">
                <span>{landingCopy.titleLine2}</span>{" "}
                <span className="inline-block whitespace-nowrap">
                  <TypingWord />
                </span>
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-[35rem] text-base leading-8 text-white sm:text-xl"
            >
              {landingCopy.subtitle}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row lg:justify-start"
            >
              <motion.button
                type="button"
                onClick={handleStart}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group glow-border inline-flex min-h-[68px] flex-1 items-center justify-center gap-3 rounded-[1.5rem] px-8 py-4 text-xl font-black text-white shadow-[0_20px_50px_rgba(13,148,136,0.35)] transition-all duration-300"
                style={{ 
                  background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  fontFamily: "Tajawal"
                }}
              >
                <Zap className="h-5 w-5 fill-white/20" />
                <span>{landingCopy.ctaJourney}</span>
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-2" />
              </motion.button>

              <motion.button
                type="button"
                onClick={() => document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex min-h-[68px] items-center justify-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white shadow-[0_15px_35px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/20 sm:flex-none"
              >
                {landingCopy.secondaryCta}
                <ChevronDown className="h-4 w-4 opacity-50 group-hover:translate-y-1 transition-transform" />
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              {[
                { icon: Zap, label: landingCopy.trustPoints[0] },
                { icon: Heart, label: landingCopy.trustPoints[1] },
                { icon: Shield, label: landingCopy.trustPoints[2] },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs font-bold text-white backdrop-blur-xl"
                >
                  <Icon className="h-4 w-4 text-[var(--soft-teal)]" />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            variants={fadeIn}
            className="order-2 flex items-center justify-center lg:justify-center"
          >
            <div
              className="relative flex min-h-[420px] w-full max-w-[760px] items-center justify-center px-4 py-10 sm:min-h-[500px] sm:px-0 lg:min-h-[620px] lg:py-16"
            >
              <div
                className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.16)_0%,rgba(59,130,246,0.11)_36%,transparent_74%)] blur-3xl"
                aria-hidden="true"
              />
              <div
                className="relative flex translate-x-[8%] translate-y-0 items-center justify-center sm:translate-x-[10%] lg:translate-x-[14%]"
                style={{
                  width: "min(100%, 720px)",
                  height: "min(100%, 720px)",
                }}
              >
                <div
                  className="orbit-atmospheric relative scale-[1.08] sm:scale-[1.18] lg:scale-[1.3]"
                  style={{
                    top: "auto",
                    left: "auto",
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
            ابدأ رحلتك — مجاناً
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
"""

# Write as UTF-8
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Final Landing.tsx rewrite complete with redesign and fixed build.")
