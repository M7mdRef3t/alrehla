import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, MapPin, Mic, Eye, Shield, Zap, Clock, Lock,
  ChevronDown, Smartphone, Star, Heart, BookOpen, Brain, Sparkles
} from "lucide-react";
import { recordFlowEvent } from "../services/journeyTracking";
import { usePWAInstall } from "../contexts/PWAInstallContext";
import { getLivePulseCount, shouldTriggerHeartbeat } from "../services/pulseEngagement";
import { fetchResourceCounts } from "../services/learningService";
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
  onNavigate?: (screen: string) => void;
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

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
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

/* ─── Product Card ───────────────────────────────────────────────────────────── */

interface ProductCardProps {
  icon: FC<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  border: string;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  preview: string;
  onClick?: () => void;
  cta?: string;
}

const ProductCard: FC<ProductCardProps> = ({
  icon: Icon, iconColor, iconBg, border, tag, tagColor,
  title, subtitle, preview, onClick, cta
}) => (
  <motion.div
    variants={fadeUp}
          className="group relative flex flex-col rounded-2xl overflow-hidden cursor-default transition-all duration-300"
    style={{ border: `1px solid ${border}`, background: "rgba(15,15,28,0.6)", backdropFilter: "blur(12px)" }}
    whileHover={{ y: -4, borderColor: iconColor + "50" }}
  >
    {/* Top gradient line */}
    <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${iconColor}60, transparent)` }} />

    <div className="flex flex-col flex-1 p-5 gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <span style={{ color: iconColor, display: "flex" }}><Icon className="w-5 h-5" /></span>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: tagColor + "18", color: tagColor }}>
          {tag}
        </span>
      </div>

      {/* Text */}
      <div>
        <h3 className="text-base font-black text-white mb-1" style={{ fontFamily: "Tajawal, sans-serif" }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
      </div>

      {/* Preview chip */}
      <div className="mt-auto rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.03)", color: "#475569", border: "1px solid var(--glass-border)" }}>
        {preview}
      </div>

      {/* CTA */}
      {onClick && cta && (
        <button
          type="button"
          onClick={onClick}
          className="mt-1 w-full rounded-xl py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer"
          style={{ background: iconColor + "18", color: iconColor, border: `1px solid ${iconColor}30` }}
        >
          {cta}
        </button>
      )}
    </div>
  </motion.div>
);

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
  onNavigate,
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

  // Always show metrics and testimonials in final product
  const showLiveMetrics = true;
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
  const [resourceStats, setResourceStats] = useState({ articles: 45, videos: 12 });
  const [isWarping, setIsWarping] = useState(false);
  const landingViewTrackedRef = useRef(false);
  const startTrackedRef = useRef(false);

  useEffect(() => {
    fetchResourceCounts().then(stats => setResourceStats(stats)).catch(console.error);

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
          {/* Platform Badge — value, not description */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-8 glass-button text-[10px] sm:text-[11px] tracking-[0.25em] uppercase py-2 px-5 backdrop-blur-3xl"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-pulse" />
            دلوقتي ٣٢٠٠+ شخص شايفوا نفسهم بوضوح
          </motion.div>

          {/* Headline V6: Two complete sentences + TypingWord as subject */}
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
            className="text-base sm:text-lg leading-relaxed mb-7 sm:mb-9 max-w-[42ch] font-normal"
            style={{ color: "var(--text-secondary)", opacity: 0.8 }}
          >
            {landingCopy.subtitle}
          </motion.p>

          {/* Social Proof — trust before action */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mb-8 sm:mb-10"
          >
            {/* Objection handler */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
              style={{ background: "rgba(20,184,166,0.10)", border: "1px solid rgba(20,184,166,0.25)", color: "#0d9488" }}
            >
              <Lock className="w-3 h-3" />
              مجاناً تماماً — بدون بطاقة
            </div>
            {/* Real quote-style testimonial */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold italic"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "var(--text-secondary)" }}
            >
              <span style={{ color: "#7C3AED", fontStyle: "normal" }}>❝</span>
              أخيراً حاجة بتشرح اللي بشعر بيه
              <span style={{ color: "#7C3AED", fontStyle: "normal" }}>❞</span>
            </div>
          </motion.div>

          {/* Mirror Portal: Input + Always-Active CTA */}
          <motion.div
            variants={fadeUp}
            className="w-full max-w-2xl mx-auto"
          >
            <div className="premium-glass-portal p-1.5 sm:p-2 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.5),0_0_50px_-15px_rgba(20,184,166,0.12)]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={mirrorName}
                    onChange={(e) => setMirrorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleStart();
                      }
                    }}
                    placeholder="اكتب اسمه لو حابب — أو ابدأ مباشرة"
                    className="w-full bg-transparent border-none rounded-3xl px-8 py-5 text-lg sm:text-xl outline-none transition-all font-normal"
                    style={{ color: "var(--text-primary)", fontFamily: "Tajawal, sans-serif" }}
                  />
                  {!mirrorName && (
                    <div
                      className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-15"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {/* CTA: always-active gradient — shimmer on hover */}
                <motion.button
                  type="button"
                  onClick={handleStart}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex items-center justify-center gap-3 px-8 py-5 rounded-3xl overflow-hidden sm:min-w-[210px] isolate"
                  style={{
                    background: mirrorName
                      ? "linear-gradient(135deg, #14B8A6 0%, #7C3AED 100%)"
                      : "linear-gradient(135deg, #0d9488 0%, #4f46e5 100%)",
                    boxShadow: mirrorName
                      ? "0 12px 40px -10px rgba(20,184,166,0.55)"
                      : "0 8px 28px -10px rgba(13,148,136,0.4)",
                    transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)"
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)" }}
                  />
                  <span className="relative text-base sm:text-lg font-bold text-white" style={{ fontFamily: "Tajawal, sans-serif" }}>
                    {mirrorName ? "ابدأ رحلتك الآن" : "شوف نفسك بوضوح — مجاناً"}
                  </span>
                  <ArrowLeft className="relative w-5 h-5 text-white transition-transform duration-300 group-hover:-translate-x-1" />
                </motion.button>
              </div>
            </div>
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





      {/* ══════════════════════════════════════════════
          SECTION 1.75: LIVE METRICS STRIP
      ══════════════════════════════════════════════ */}
      {showLiveMetrics && (
        <section className="relative py-16 px-5 max-w-5xl mx-auto">
          <motion.div
            variants={staggerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { value: "٣٢٠٠+", label: "مستخدم جرّب المنصة",  color: "#14B8A6", glow: "rgba(20,184,166,0.08)" },
              { value: "١٢٠٠٠+", label: "جلسة دواير مكتملة",   color: "#7C3AED", glow: "rgba(124,58,237,0.08)" },
              { value: `${resourceStats.articles}+`,   label: "مقال ودليل معرفي",  color: "#FBBF24", glow: "rgba(251,191,36,0.08)" },
              { value: `${resourceStats.videos}+`,  label: "مسار وفيديو مرئي", color: "#F472B6", glow: "rgba(244,114,182,0.08)" },
            ].map((m, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-2xl p-6 text-center"
                style={{
                  background: m.glow,
                  border: `1px solid ${m.color}18`,
                  backdropFilter: "blur(12px)"
                }}
              >
                <p className="text-2xl sm:text-3xl font-black mb-1.5" style={{ color: m.color, fontFamily: "Tajawal, sans-serif" }}>
                  {m.value}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>{m.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ── Section Divider ── */}
      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.2), transparent)" }} />
      </div>

      {/* ══════════════════════════════════════════════
          SECTION 2: PLATFORM PRODUCTS
      ══════════════════════════════════════════════ */}
      <section className="relative py-20 px-5 max-w-6xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* Section Header */}
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ color: "#7C3AED" }}>
              رحلة التعافي
            </p>
            <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "Tajawal, sans-serif", color: "var(--text-primary)" }}>
              من التشخيص.. وصولاً للحرية.
            </h2>
            <p className="text-base max-w-[44ch] mx-auto" style={{ color: "var(--text-secondary)" }}>
              مش مجرد أدوات — دي منظومة متكاملة متجربة علمياً عشان تخرجك من الاستنزاف وتستعيد نفسك بجد.
            </p>
          </motion.div>

          {/* Products Grid — 1-col mobile, 2-col sm, 3-col md */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <ProductCard
              icon={MapPin}
              iconColor="#14B8A6"
              iconBg="rgba(20,184,166,0.12)"
              border="rgba(20,184,166,0.18)"
              tag="المرحلة الأولى"
              tagColor="#14B8A6"
              title="خريطة التشخيص"
              subtitle="أول خطوة حقيقية. بنحدد فيها الثقوب السوداء في علاقاتك وبنشوف النزيف منين بالظبط."
              preview="📍 تشخيص بصري فوري"
              onClick={handleStart}
              cta="ابدأ التشخيص"
            />
            <ProductCard
              icon={Eye}
              iconColor="#38BDF8"
              iconBg="rgba(56,189,248,0.12)"
              border="rgba(56,189,248,0.18)"
              tag="المرحلة الثانية"
              tagColor="#38BDF8"
              title="تحليل الأنماط"
              subtitle="إزاي بتوصل لنفس النقطة كل مرة؟ بنحلل القصص اللي بتكررها وبنعرف جرس الإنذار فين."
              preview="🪞 تحليل الأنماط المتكررة"
            />
            <ProductCard
              icon={Zap}
              iconColor="#FBBF24"
              iconBg="rgba(251,191,36,0.12)"
              border="rgba(251,191,36,0.18)"
              tag="المرحلة الثالثة"
              tagColor="#FBBF24"
              title="خطة العمل"
              subtitle="مفيش كلام نظري. بتاخد خطة يومية مخصصة ليك، بتقولك بالظبط تعمل إيه مع كل حد."
              preview="📋 خطة تعافي يومية AI"
            />
            <ProductCard
              icon={Shield}
              iconColor="#F87171"
              iconBg="rgba(248,113,113,0.12)"
              border="rgba(248,113,113,0.18)"
              tag="أدوات الحماية"
              tagColor="#F87171"
              title="العدة الكاملة"
              subtitle="جمل الرد الجاهزة، تمارين التنفس، وغرفة الطوارئ.. أسلحتك في طريقك للاستقلال."
              preview="🛡️ مكتبة الحماية الذاتية"
            />
            <ProductCard
              icon={Heart}
              iconColor="#F472B6"
              iconBg="rgba(244,114,182,0.12)"
              border="rgba(244,114,182,0.18)"
              tag="المتابعة"
              tagColor="#F472B6"
              title="النبض اليومي"
              subtitle="بنفضل معاك. بتسجّل حالتك يومياً وبنشوف مدى التطور اللي بتوصله في قوتك النفسية."
              preview="💓 تتبع جودة الحياة"
            />
            <ProductCard
              icon={Mic}
              iconColor="#7C3AED"
              iconBg="rgba(124,58,237,0.12)"
              border="rgba(124,58,237,0.18)"
              tag="دعم حي"
              tagColor="#7C3AED"
              title="مساعدك الشخصي"
              subtitle="تكلم مع ذكاء اصطناعي متخصص في العلاقات. يسمعك، يحلل صوتك، ويوجهك في لحظتها."
              preview="🎙️ تحليل صوتي فوري"
            />
          </div>
        </motion.div>
      </section>

      {/* ── Section Divider ── */}
      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(248,113,113,0.2), transparent)" }} />
      </div>

      {/* ══════════════════════════════════════════════
          QUICK ACCESS SHORTCUTS
      ══════════════════════════════════════════════ */}
      {onNavigate && (
        <section className="relative py-10 px-5 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-5 text-center" style={{ color: "#06B6D4" }}>
              وصول سريع
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: BookOpen,
                  label: "مركز التعلم",
                  desc: "فيديوهات، تمارين، وجمل خروج — كل ما تحتاجه في مكان واحد",
                  color: "#06B6D4",
                  screen: "resources",
                  emoji: "📚",
                },
                {
                  icon: Brain,
                  label: "تحليل الأنماط",
                  desc: "اكتشف سلوكياتك العميقة والمحفزات الخفية",
                  color: "#A78BFA",
                  screen: "behavioral-analysis",
                  emoji: "🧠",
                },
                {
                  icon: Sparkles,
                  label: "الاختبارات",
                  desc: "نمط التعلق، رد الفعل العاطفي — تعرف على نفسك",
                  color: "#F59E0B",
                  screen: "quizzes",
                  emoji: "✨",
                },
              ].map((item) => (
                <motion.button
                  key={item.screen}
                  type="button"
                  onClick={() => { trackEvent("landing_shortcut_click" as string, { screen: item.screen }); onNavigate(item.screen); }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col gap-3 rounded-2xl p-5 text-right cursor-pointer w-full"
                  style={{
                    background: `${item.color}08`,
                    border: `1px solid ${item.color}20`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${item.color}18` }}
                    >
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <h3 className="text-sm font-black" style={{ fontFamily: "Tajawal, sans-serif", color: "var(--text-primary)" }}>
                      {item.label}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                  <div className="text-xs font-bold self-start" style={{ color: item.color }}>
                    اذهب إليه ←
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          SECTION 3: PROBLEM
      ══════════════════════════════════════════════ */}
      <section className="relative py-20 px-5 max-w-4xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="rounded-3xl p-8 sm:p-12"
          style={{
            border: "1px solid rgba(248,113,113,0.15)",
            background: "radial-gradient(ellipse at 50% 0%, rgba(248,113,113,0.05) 0%, transparent 65%)"
          }}
        >
          <motion.p variants={fadeUp} className="text-xs font-bold tracking-widest uppercase mb-4 text-center" style={{ color: "#F87171" }}>
            هل ده بيحصل معاك؟
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-black text-white text-center mb-8 leading-tight" style={{ fontFamily: "Tajawal, sans-serif" }}>
            {landingCopy.problemSection.title}
          </motion.h2>

          <motion.div variants={staggerFast} className="grid sm:grid-cols-3 gap-4 mb-8">
            {landingCopy.problemSection.points.map((point, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex flex-col gap-2 rounded-2xl p-5 text-sm font-semibold text-center"
                style={{ border: "1px solid var(--glass-border)", background: "var(--glass-bg)", color: "#CBD5E1" }}
              >
                <span className="text-2xl">{["😶", "💸", "🤯"][i]}</span>
                {point}
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="text-center text-sm font-bold" style={{ color: "#F87171" }}>
            {landingCopy.problemSection.closing}
          </motion.p>
        </motion.div>
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

          <motion.div variants={staggerFast} className="grid md:grid-cols-3 gap-5">
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
          <motion.div variants={staggerFast} className="flex flex-wrap justify-center gap-2 mb-8">
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
