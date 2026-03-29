import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Shield, Zap, Clock, Lock,
  ChevronDown, Heart
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
    --space-void: #0a0e1f;
    --text-primary: #ffffff;
    --text-secondary: rgba(203, 213, 225, 0.95);
    --text-muted: rgba(148, 163, 184, 0.7);
    --glass-bg: rgba(12, 17, 40, 0.78);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-border-hover: rgba(255, 255, 255, 0.18);
    --soft-teal: #2dd4bf;
    --soft-teal-dim: rgba(45, 212, 191, 0.12);
    --soft-teal-glow: rgba(45, 212, 191, 0.25);
    color-scheme: dark;
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

  const nodes = [
    { cx: 240, cy: 190, r: 8,   color: "#10b981", delay: 0,   label: "علاقة مُشحِنة" },
    { cx: 190, cy: 100, r: 7,   color: "#10b981", delay: 1.5, label: "دعم متبادل" },
    { cx: 290, cy: 190, r: 7.5, color: "#f59e0b", delay: 0.3, label: "علاقة مختلطة" },
    { cx: 190, cy: 300, r: 6.5, color: "#f59e0b", delay: 1,   label: "تذبذب طاقي" },
    { cx: 190, cy: 30,  r: 7.5, color: "#ef4444", delay: 0.7, label: "استنزاف حاد" },
    { cx: 340, cy: 190, r: 7,   color: "#ef4444", delay: 0.2, label: "حدود مكسورة" },
    { cx: 70,  cy: 140, r: 6.5, color: "#ef4444", delay: 1.8, label: "ارتباط مُرهِق" },
  ];

  return (
    <div className="relative flex items-center justify-center select-none" aria-hidden="true"
      style={{ width: 380, height: 380 }}>
      {/* Background glow disc */}
      <div className="absolute rounded-full"
        style={{
          width: 340, height: 340,
          background: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.12) 0%, rgba(20,184,166,0.04) 40%, transparent 70%)",
          filter: "blur(2px)"
        }} />

      <svg width="380" height="380" viewBox="0 0 380 380" fill="none" style={{ overflow: "visible" }}>
        {/* Orbit rings — stronger for light mode */}
        {[
          { r: 82,  stroke: "rgba(16,185,129,0.55)",  dash: "none", dur: 3.2 },
          { r: 130, stroke: "rgba(245,158,11,0.4)",   dash: "5 7",  dur: 4.5 },
          { r: 170, stroke: "rgba(239,68,68,0.3)",    dash: "3 9",  dur: 6 },
        ].map((ring, i) => (
          <motion.g key={i}
            animate={reduceMotion ? {} : { opacity: [0.5, 1, 0.5] }}
            transition={{ duration: ring.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          >
            <circle
              cx="190" cy="190" r={ring.r}
              stroke={ring.stroke} strokeWidth="2" fill="none"
              strokeDasharray={ring.dash === "none" ? undefined : ring.dash}
            />
          </motion.g>
        ))}

        {/* Node dots — bigger for light mode visibility */}
        {nodes.map((node, i) => (
          <motion.g key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            animate={reduceMotion ? {} : {
              opacity: hoveredIdx === i ? 1 : [0.7, 1, 0.7],
              scale: hoveredIdx === i ? 1.4 : [1, 1.12, 1]
            }}
            transition={{ duration: hoveredIdx === i ? 0.2 : 3 + node.delay, repeat: hoveredIdx === i ? 0 : Infinity, ease: "easeInOut", delay: hoveredIdx === i ? 0 : node.delay }}
            style={{ transformOrigin: `${node.cx}px ${node.cy}px`, cursor: "pointer" }}
          >
            <circle cx={node.cx} cy={node.cy} r={node.r} fill={node.color}
              style={{ filter: `drop-shadow(0 0 ${hoveredIdx === i ? 12 : 4}px ${node.color}80)` }} />
            
            <AnimatePresence>
              {hoveredIdx === i && (
                <motion.foreignObject
                  x={node.cx + 12} y={node.cy - 14} width="110" height="40"
                  initial={{ opacity: 0, x: node.cx + 5 }}
                  animate={{ opacity: 1, x: node.cx + 14 }}
                  exit={{ opacity: 0 }}
                >
                  <div style={{ 
                    background: "rgba(255,255,255,0.95)", border: `2px solid ${node.color}50`, 
                    borderRadius: 10, padding: "5px 10px", color: "#1e293b", 
                    fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
                    backdropFilter: "blur(8px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}>
                    {node.label}
                  </div>
                </motion.foreignObject>
              )}
            </AnimatePresence>
          </motion.g>
        ))}

        {/* Center — "أنت" */}
        <motion.g
          animate={reduceMotion ? {} : { 
            scale: mirrorName ? [1, 1.3, 1] : [1, 1.15, 1], 
            opacity: [0.85, 1, 0.85] 
          }}
          transition={{ duration: mirrorName ? 1.5 : 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "190px 190px" }}
        >
          <circle cx="190" cy="190" r={10} fill="#14B8A6" />
        </motion.g>
        <circle cx="190" cy="190" r={5} fill="#0f172a" opacity={0.8} />
      </svg>

      {/* Ring legend */}
      <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-5">
        {[
          { color: "#10b981", label: "مُشحِن" },
          { color: "#f59e0b", label: "مختلط" },
          { color: "#ef4444", label: "مُرهِق" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
            <span className="text-[11px] font-bold" style={{ color: "#475569" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};



/* ─── Typing Text Animation ──────────────────────────────────────────────────── */

const ROTATING_WORDS = ["استنزاف طاقتك", "الذنب اللي مالوش لزوم", "الضغط العصبي", "الحدود المكسورة", "العلاقات المرهقة"];

const TypingWord: FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);


  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 400);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-flex items-center justify-start" style={{ minWidth: "6em", height: "1.2em", verticalAlign: "baseline" }}>
      {/* Invisible spacer — uses the longest word to reserve space */}
      <span className="invisible select-none pointer-events-none whitespace-nowrap" aria-hidden="true">
        الذنب اللي مالوش لزوم
      </span>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex items-center"
            style={{
              background: "linear-gradient(90deg, #0d9488, #6d28d9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
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

  // Always show testimonials in final product
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

    // Trigger Warp Cinema effect
    setIsWarping(true);
    soundManager.playEffect("cosmic_pulse");
    
    setTimeout(() => {
      // Unify all acquisition to /onboarding route
      if (typeof window !== "undefined") {
        window.location.assign("/onboarding");
      }
    }, 1200);
  }, [mirrorName]);

  /* ─── JSX ─────────────────────────────────────────────────── */

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden landing-dark-force"
      style={{ background: "var(--space-void)", fontFamily: "'IBM Plex Sans Arabic', Tajawal, sans-serif" }}
      dir="rtl"
    >
      <style>{LANDING_STYLES}</style>

      {/* ── Global ambient background — light-mode native ── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: [
            "radial-gradient(ellipse 60% 50% at 20% 10%, rgba(13,148,136,0.06) 0%, transparent 55%)",
            "radial-gradient(ellipse 50% 40% at 80% 80%, rgba(109,40,217,0.05) 0%, transparent 50%)",
            "radial-gradient(ellipse 40% 30% at 50% 50%, rgba(20,184,166,0.03) 0%, transparent 55%)"
          ].join(", ")
        }} />
        {/* Subtle dot grid — light mode */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      {/* ══════════════════════════════════════════════
          SECTION 1: HERO — Orbital Center (Premium V2)
      ══════════════════════════════════════════════ */}
      <section className="hero-orbital-center px-4 overflow-hidden">
        {/* ── Immersive Atmospheric Visuals ── */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Main Orbit Background */}
          <div className="orbit-atmospheric scale-[1.5] sm:scale-[2] contrast-[1.05]">
            <OrbitViz reduceMotion={reduceMotion} mirrorName={mirrorName} />
          </div>
          {/* Subtle Glows */}
          <div 
            className="absolute inset-x-0 top-0 h-[60vh] opacity-40" 
            style={{ background: "linear-gradient(to bottom, var(--soft-teal-dim), transparent)" }}
          />
          <div className="hero-starfield" />
        </div>

        {/* ── Central Content Stack ── */}
        <motion.div
           variants={stagger}
           initial="hidden"
           animate="visible"
           className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center px-6 pt-16 sm:pt-20"
        >
          {/* Platform Badge — real pulseCount */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-8 glass-button text-[10px] sm:text-[11px] tracking-[0.25em] uppercase py-2 px-5 backdrop-blur-3xl"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-pulse" />
            {pulseCount > 0
              ? `دلوقتي ${pulseCount.toLocaleString("ar-EG")}+ شخص شايفوا نفسهم بوضوح`
              : "انضم لآلاف ماشيين في رحلتهم"}
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="cosmic-headline text-[1.85rem] sm:text-[2.6rem] lg:text-[3.3rem] font-bold mb-4 sm:mb-5"
            style={{ fontFamily: "Tajawal, sans-serif", color: "var(--text-primary)", lineHeight: 1.25 }}
          >
            <span className="block opacity-90">فيه حاجة بتسرق طاقتك.</span>
            <span className="block mt-2 sm:mt-3">
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #14b8a6, #06b6d4, #6366f1)" }}>
                <TypingWord />
              </span>
              <span className="opacity-85"> — وانت عارف مين.</span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-base sm:text-lg leading-relaxed mb-7 sm:mb-8 max-w-[42ch] font-normal"
            style={{ color: "var(--text-secondary)", opacity: 0.8 }}
          >
            {landingCopy.subtitle}
          </motion.p>

          {/* 3 Problem Pills — above the fold */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10"
          >
            {landingCopy.problemSection.points.map((point, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[11px] sm:text-xs font-semibold"
                style={{
                  background: [
                    "rgba(239,68,68,0.07)",
                    "rgba(245,158,11,0.07)",
                    "rgba(99,102,241,0.07)"
                  ][i],
                  border: `1px solid ${["rgba(239,68,68,0.2)","rgba(245,158,11,0.2)","rgba(99,102,241,0.2)"][i]}`,
                  color: ["#FCA5A5","#FCD34D","#A5B4FC"][i]
                }}
              >
                <span>{["😶","💸","🤯"][i]}</span>
                {point}
              </div>
            ))}
          </motion.div>

          {/* CTA — full width, no input friction */}
          <motion.div
            variants={fadeUp}
            className="w-full max-w-xl mx-auto"
          >
            <motion.button
              type="button"
              onClick={handleStart}
              whileHover={{ scale: 1.03, boxShadow: "0 20px 55px rgba(20,184,166,0.45)" }}
              whileTap={{ scale: 0.97 }}
              className="group relative w-full flex items-center justify-center gap-3 px-8 py-5 rounded-3xl overflow-hidden isolate"
              style={{
                background: "linear-gradient(135deg, #14B8A6 0%, #7C3AED 100%)",
                boxShadow: "0 12px 40px -10px rgba(20,184,166,0.45)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)" }}
              />
              <Zap className="relative w-5 h-5 text-white" />
              <span className="relative text-lg sm:text-xl font-black text-white" style={{ fontFamily: "Tajawal, sans-serif" }}>
                شوف نفسك بوضوح — مجاناً
              </span>
              <ArrowLeft className="relative w-5 h-5 text-white transition-transform duration-300 group-hover:-translate-x-1" />
            </motion.button>

            {/* Optional name hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="mt-4 text-center"
            >
              <button
                type="button"
                onClick={() => {
                  const name = window.prompt("اكتب اسمك — هنبدأ الرحلة باسمك:");
                  if (name?.trim()) {
                    setMirrorName(name.trim());
                    handleStart();
                  }
                }}
                className="text-[11px] font-semibold underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              >
                أو ابدأ بـ اسمك الشخصي ←
              </button>
            </motion.div>

            {/* Micro trust indicators */}
            <div className="mt-5 flex flex-wrap justify-center gap-5 sm:gap-8">
              {[
                { icon: Lock,   label: "بيانات مشفرة" },
                { icon: Clock,  label: "دقيقتان فقط" },
                { icon: Shield, label: "بدون تسجيل" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold tracking-wide" style={{ color: "var(--text-muted)" }}>
                  <Icon className="w-3 h-3 opacity-70" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center pointer-events-none z-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 3, duration: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              animate={reduceMotion ? {} : { y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-4 h-4" style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Section Divider ── */}
      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.2), transparent)" }} />
      </div>


      {/* ══════════════════════════════════════════════
          SECTION 4: HOW IT WORKS
      ══════════════════════════════════════════════ */}
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
            <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "Tajawal, sans-serif", color: "var(--text-primary)" }}>
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
                <h3 className="text-base font-black" style={{ fontFamily: "Tajawal, sans-serif", color: "var(--text-primary)" }}>{step.title}</h3>
                <p className="text-sm leading-loose" style={{ color: "var(--text-secondary)" }}>{step.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Section Divider ── */}
      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.25), transparent)" }} />
      </div>

      {/* ══════════════════════════════
          SECTION 4.5: INTERACTIVE DEMO
      ══════════════════════════════ */}
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
            <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ fontFamily: "Tajawal, sans-serif", color: "var(--text-primary)" }}>
              دقيقتين تكشفلك الحقيقة
            </h2>
            <p className="text-sm max-w-[38ch] mx-auto" style={{ color: "var(--text-secondary)" }}>
              3 أسئلة بسيطة — بدون تفكير — وهتعرف إيه اللي سارق طاقتك فعلاً
            </p>
          </div>
          <LandingSimulation />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 5: TESTIMONIALS
      ══════════════════════════════════════════════ */}
      {showTestimonials && (
        <>
          {/* ── Section Divider ── */}
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
                <h2 className="text-2xl sm:text-3xl font-black " style={{ fontFamily: "Tajawal, sans-serif", color: "var(--text-primary)" }}>
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

      {/* ── Section Divider ── */}
      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.25), transparent)" }} />
      </div>

      {/* ══════════════════════════════════════════════
          SECTION 6: FINAL CTA
      ══════════════════════════════════════════════ */}
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
            style={{ fontFamily: "Tajawal, sans-serif" }}
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

          {/* Trust chips */}
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

          {!isUserMode && onOpenSurvey && (
            <motion.button
              variants={fadeUp}
              type="button"
              onClick={onOpenSurvey}
              className="mt-5 block mx-auto text-xs font-semibold cursor-pointer hover:underline"
              style={{ color: "#475569" }}
            >
              أو ساعدنا بمشاركة رأيك →
            </motion.button>
          )}
        </motion.div>
      </section>

      {/* ── Footer Divider ── */}
      <div className="max-w-5xl mx-auto px-8 mt-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
      </div>

      {/* ── Footer ── */}
      {/* ── Warp to Reality Overlay ── */}
      <AnimatePresence>
        {isWarping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A1A]"
          >
            {/* Warp streaks */}
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

            {/* Expanding central glow */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 4, opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, ease: "easeIn" }}
              className="w-40 h-40 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(45,212,191,0.6) 0%, transparent 70%)",
                filter: "blur(20px)"
              }}
            />
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/50 text-xs font-black tracking-[0.4em] uppercase"
            >
              توليد الوعي..
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LandingFooter
        trustPoints={landingCopy.trustPoints}
        stagger={stagger}
        onOpenLegal={(path) => {
          if (typeof window !== "undefined") window.open(path, "_blank", "noopener,noreferrer");
        }}
      />
    </div>
  );
};
