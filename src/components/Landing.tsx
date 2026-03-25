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
    { cx: 232, cy: 160, r: 6, color: "#34D399", delay: 0, label: "علاقة مُشحِنة" },
    { cx: 160, cy: 88,  r: 5, color: "#34D399", delay: 1.5, label: "دعم متبادل" },
    { cx: 270, cy: 160, r: 5.5, color: "#FBBF24", delay: 0.3, label: "علاقة مختلطة" },
    { cx: 160, cy: 270, r: 4.5, color: "#FBBF24", delay: 1, label: "تذبذب طاقي" },
    { cx: 160, cy: 12,  r: 5.5, color: "#F87171", delay: 0.7, label: "استنزاف حاد" },
    { cx: 310, cy: 160, r: 5, color: "#F87171", delay: 0.2, label: "حدود مكسورة" },
    { cx: 60,  cy: 120, r: 4.5, color: "#F87171", delay: 1.8, label: "ارتباط مُرهِق" },
  ];

  return (
    <div className="relative flex items-center justify-center select-none" aria-hidden="true"
      style={{ width: 320, height: 320 }}>
      {/* Background glow */}
      <div className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(20,184,166,0.07) 0%, transparent 65%)" }} />

      <svg width="320" height="320" viewBox="0 0 320 320" fill="none" style={{ overflow: "visible" }}>
        {/* Orbit rings */}
        {[
          { r: 72,  stroke: "rgba(20,184,166,0.45)",  dash: "none", dur: 3.2 },
          { r: 110, stroke: "rgba(251,191,36,0.3)",   dash: "4 6",  dur: 4.5 },
          { r: 148, stroke: "rgba(248,113,113,0.22)", dash: "2 8",  dur: 6 },
        ].map((ring, i) => (
          <motion.g key={i}
            animate={reduceMotion ? {} : { opacity: [0.6, 1, 0.6] }}
            transition={{ duration: ring.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          >
            <circle
              cx="160" cy="160" r={ring.r}
              stroke={ring.stroke} strokeWidth="1.5" fill="none"
              strokeDasharray={ring.dash === "none" ? undefined : ring.dash}
            />
          </motion.g>
        ))}

        {/* Node dots */}
        {nodes.map((node, i) => (
          <motion.g key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            animate={reduceMotion ? {} : {
              opacity: hoveredIdx === i ? 1 : [0.75, 1, 0.75],
              scale: hoveredIdx === i ? 1.4 : [1, 1.15, 1]
            }}
            transition={{ duration: hoveredIdx === i ? 0.2 : 3 + node.delay, repeat: hoveredIdx === i ? 0 : Infinity, ease: "easeInOut", delay: hoveredIdx === i ? 0 : node.delay }}
            style={{ transformOrigin: `${node.cx}px ${node.cy}px`, cursor: "pointer" }}
          >
            <circle cx={node.cx} cy={node.cy} r={node.r} fill={node.color} style={{ filter: hoveredIdx === i ? `drop-shadow(0 0 8px ${node.color})` : "none" }} />
            
            <AnimatePresence>
              {hoveredIdx === i && (
                <motion.foreignObject
                  x={node.cx + 10} y={node.cy - 10} width="100" height="40"
                  initial={{ opacity: 0, x: node.cx + 5 }}
                  animate={{ opacity: 1, x: node.cx + 12 }}
                  exit={{ opacity: 0 }}
                >
                  <div style={{ 
                    background: "rgba(10,10,26,0.9)", border: `1px solid ${node.color}40`, 
                    borderRadius: 8, padding: "4px 8px", color: node.color, 
                    fontSize: 10, fontWeight: 800, whiteSpace: "nowrap", backdropFilter: "blur(4px)" 
                  }}>
                    {node.label}
                  </div>
                </motion.foreignObject>
              )}
            </AnimatePresence>
          </motion.g>
        ))}

        {/* Center */}
        <motion.g
          animate={reduceMotion ? {} : { 
            scale: mirrorName ? [1, 1.4, 1] : [1, 1.2, 1], 
            opacity: [0.85, 1, 0.85] 
          }}
          transition={{ duration: mirrorName ? 1.5 : 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "160px 160px" }}
        >
          <circle cx="160" cy="160" r={8} fill="#14B8A6" />
        </motion.g>
        <circle cx="160" cy="160" r={4} fill="white" opacity={0.9} />
      </svg>

      {/* Ring legend */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4">
        {[
          { color: "#34D399", label: "مُشحِن" },
          { color: "#FBBF24", label: "مختلط" },
          { color: "#F87171", label: "مُرهِق" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
            <span className="text-[11px] font-semibold" style={{ color: "#64748B" }}>{label}</span>
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
        <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{subtitle}</p>
      </div>

      {/* Preview chip */}
      <div className="mt-auto rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.03)", color: "#475569", border: "1px solid rgba(255,255,255,0.05)" }}>
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
              background: "linear-gradient(90deg, #14B8A6, #7C3AED)",
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
    trackEvent(AnalyticsEvents.CTA_CLICK);
    trackLead({
      source: "landing",
      cta_name: "start_journey",
      destination: "full_app_boot",
      intent: mirrorName ? "mirror_named" : "default"
    });
    
    if (mirrorName) {
      useJourneyState.getState().setMirrorName(mirrorName);
    }

    // Trigger Warp Cinema
    setIsWarping(true);
    soundManager.playEffect("cosmic_pulse");
    
    setTimeout(() => {
      onStartJourney();
    }, 1200);
  }, [onStartJourney, mirrorName]);

  /* ─── JSX ─────────────────────────────────────────────────── */

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ background: "#0A0A1A", fontFamily: "IBM Plex Sans Arabic, Tajawal, sans-serif" }}
      dir="rtl"
    >

      {/* ── Global ambient background ── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 15% 8%, rgba(124,58,237,0.10) 0%, transparent 55%)",
            "radial-gradient(ellipse 55% 45% at 85% 85%, rgba(20,184,166,0.07) 0%, transparent 50%)",
            "radial-gradient(ellipse 35% 35% at 50% 40%, rgba(20,184,166,0.04) 0%, transparent 60%)"
          ].join(", ")
        }} />
        {/* Subtle dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 1
        }} />
      </div>

      {/* ══════════════════════════════════════════════
          SECTION 1: HERO
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-5 pt-10 md:pt-16 pb-12 md:pb-20 max-w-6xl mx-auto">
        <motion.div
          className="w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-10"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* ── Text ── — 55% من عرض الـ desktop */}
          <div className="flex-1 lg:flex-none lg:basis-[55%] text-center lg:text-right">

            {/* Platform badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#34D399", boxShadow: "0 0 8px #34D399aa" }} />
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#64748B" }}>الرحلة — منصة الوعي الذاتي</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-[1.8rem] sm:text-5xl lg:text-6xl font-black leading-[1.25] mb-8"
              style={{ fontFamily: "Tajawal, sans-serif", color: "#F8FAFC" }}
            >
              {landingCopy.hook}
              <br />
              من <TypingWord />
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-[50ch]"
              style={{ color: "#94A3B8" }}
            >
              {landingCopy.subtitle}
            </motion.p>

            {/* Value chips */}
            <motion.div variants={staggerFast} className="flex flex-wrap justify-center lg:justify-end gap-2 mb-8">
              {[
                { icon: Lock, label: "بياناتك خاصة" },
                { icon: Clock, label: "نتيجة في 3 دقائق" },
                { icon: Star, label: "بدون تسجيل للبداية" },
              ].map(({ icon: Icon, label }) => (
                <motion.div
                  key={label}
                  variants={fadeIn}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{ border: "1px solid rgba(20,184,166,0.2)", background: "rgba(20,184,166,0.05)", color: "#5EEAD4" }}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </motion.div>
              ))}
            </motion.div>

            {/* ── 10-Second Mirror (New Hook) ── */}
            <motion.div variants={fadeUp} className="mb-8 max-w-md mx-auto lg:mr-0 lg:ml-auto">
              <div className="relative group">
                <input
                  type="text"
                  value={mirrorName}
                  onChange={(e) => setMirrorName(e.target.value)}
                  placeholder="مين الشخص اللي شاغل تفكيرك دلوقتي؟"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-teal-500/50 transition-all"
                  style={{ backdropFilter: "blur(8px)" }}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  {mirrorName ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-teal-400 text-xs font-bold">بدأنا نركز..</motion.span>
                  ) : (
                    <Sparkles className="w-4 h-4 text-white/20" />
                  )}
                </div>
              </div>
              <p className="mt-2 text-[10px] text-white/30 text-right pr-2">
                * اكتب اسمه فقط (أو حرف)، ده بيساعد عقلك يركز في الخريطة.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3">
              <motion.button
                type="button"
                id="landing-hero-cta"
                onClick={handleStart}
                className="group relative w-full sm:w-auto sm:min-w-[15rem] inline-flex items-center justify-center gap-3 rounded-2xl px-7 py-4 text-base font-black text-white transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A1A]"
                style={{ background: "linear-gradient(135deg, #14B8A6 0%, #0e9488 100%)", boxShadow: "0 12px 36px rgba(20,184,166,0.28)" }}
                whileHover={{ scale: 1.03, boxShadow: "0 16px 44px rgba(20,184,166,0.38)" }}
                whileTap={{ scale: 0.97 }}
              >
                ابدأ خريطتك — مجاناً
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </motion.button>

              {shouldShowLandingInstallButton && (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-200"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", color: "#94A3B8" }}
                >
                  <Smartphone className="w-4 h-4" />
                  {installButtonLabel}
                </button>
              )}
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-3 text-[12px] font-bold text-center lg:text-right"
              style={{ color: "rgba(148,163,184,0.82)" }}
            >
              تبدأ الآن، ترى الخريطة خلال دقائق، ثم تقرر بعدها هل تحتاج الأدوات الأعمق أم لا.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto lg:mr-0 lg:ml-auto"
            >
              {[
                { step: "01", title: "اكتب 3 أسماء", copy: "بدون شرح طويل. فقط الأشخاص الذين يشغلون مساحة من تفكيرك الآن." },
                { step: "02", title: "حدد المسافة", copy: "قريب يشحنك، متذبذب يربكك، أو بعيد يستنزفك." },
                { step: "03", title: "خذ أول خطوة", copy: "ترى الصورة فورًا، ثم تبدأ من أوضح نقطة بدل الدوران." }
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl p-4 text-right"
                  style={{
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(10px)"
                  }}
                >
                  <p className="text-[11px] font-black tracking-[0.25em] mb-2" style={{ color: "#2DD4BF" }}>
                    {item.step}
                  </p>
                  <h3 className="text-sm font-black text-white mb-1" style={{ fontFamily: "Tajawal, sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#94A3B8" }}>
                    {item.copy}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Returning user */}
            {hasExistingJourney && lastGoalLabel && (
              <motion.div
                variants={fadeUp}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                style={{ border: "1px solid rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.05)", color: "#FCD34D" }}
              >
                {lastGoalMeta && <lastGoalMeta.icon className="w-3.5 h-3.5" />}
                أهلاً بعودتك · آخر هدف: {lastGoalLabel}
              </motion.div>
            )}
          </div>

          <motion.div variants={fadeUp} className="flex-shrink-0 lg:flex-none lg:basis-[40%] flex items-center justify-center origin-center scale-[0.80] sm:scale-90 lg:scale-100">
            <OrbitViz reduceMotion={reduceMotion} mirrorName={mirrorName} />
          </motion.div>
        </motion.div>

        {/* Scroll hint & Global Pulse */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
            className="flex items-center gap-4 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-[10px] font-black text-teal-400/80 tracking-tight">النبض الحي:</span>
            </div>
            <p className="text-[10px] font-bold text-white/40">
              <span className="text-white/80">{pulseCount.toLocaleString("ar-EG")}</span> شخص بيحاولوا يرجعوا طاقتهم دلوقتي
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 2.5, duration: 1 }}
          >
            <span className="text-[10px] tracking-widest font-bold" style={{ color: "#334155" }}>اكتشف المنصة</span>
            <motion.div
              animate={reduceMotion ? {} : { y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-4 h-4" style={{ color: "#334155" }} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Section Divider ── */}
      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)" }} />
      </div>

      {/* ══════════════════════════════════════════════
          SECTION 1.5: INTERACTIVE DEMO
      ══════════════════════════════════════════════ */}
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
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ fontFamily: "Tajawal, sans-serif" }}>
              دقيقتين تكشفلك الحقيقة
            </h2>
            <p className="text-sm max-w-[38ch] mx-auto" style={{ color: "#94A3B8" }}>
              3 أسئلة بسيطة — بدون تفكير — وهتعرف إيه اللي سارق طاقتك فعلاً
            </p>
          </div>
          <LandingSimulation />
        </motion.div>
      </section>

      {/* ── Section Divider ── */}
      <div className="max-w-4xl mx-auto px-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.25), transparent)" }} />
      </div>

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
                <p className="text-[11px] font-semibold" style={{ color: "#94A3B8" }}>{m.label}</p>
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
              المنصة الكاملة
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: "Tajawal, sans-serif" }}>
              ست أدوات. هدف واحد.
            </h2>
            <p className="text-base max-w-[44ch] mx-auto" style={{ color: "#64748B" }}>
              مش مجرد تطبيق — منظومة متكاملة تشتغل مع بعض عشان تديك وضوح حقيقي.
            </p>
          </motion.div>

          {/* Products Grid — 1-col mobile, 2-col sm, 3-col md */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <ProductCard
              icon={MapPin}
              iconColor="#14B8A6"
              iconBg="rgba(20,184,166,0.12)"
              border="rgba(20,184,166,0.18)"
              tag="الأساس"
              tagColor="#14B8A6"
              title="دواير"
              subtitle="خريطة علاقاتك التفاعلية — شوف مين قريب ومين بيستنزفك في لحظة واحدة."
              preview="📍 رادار العلاقات التفاعلي"
              onClick={handleStart}
              cta="جرّب الخريطة"
            />
            <ProductCard
              icon={Mic}
              iconColor="#7C3AED"
              iconBg="rgba(124,58,237,0.12)"
              border="rgba(124,58,237,0.18)"
              tag="صوت + AI"
              tagColor="#7C3AED"
              title="دواير لايف"
              subtitle="تكلم بصوتك. الذكاء الاصطناعي يسمع ويحلل ويرد في الوقت الحقيقي."
              preview="🎙️ محادثة صوتية حية مع AI"
            />
            <ProductCard
              icon={Eye}
              iconColor="#38BDF8"
              iconBg="rgba(56,189,248,0.12)"
              border="rgba(56,189,248,0.18)"
              tag="أنماط عميقة"
              tagColor="#38BDF8"
              title="مرايا"
              subtitle="اكتشف الأنماط المتكررة والقصص اللي بتحكيها لنفسك بدون ما تعرف."
              preview="🪞 تحليل السرد الذاتي العميق"
            />
            <ProductCard
              icon={Shield}
              iconColor="#F87171"
              iconBg="rgba(248,113,113,0.12)"
              border="rgba(248,113,113,0.18)"
              tag="لحظة الأزمة"
              tagColor="#F87171"
              title="العدة الكاملة"
              subtitle="جمل الخروج، تهدئة الجسم، غرفة الطوارئ — جاهزة قبل ما تحتاجها."
              preview="🛡️ 24 جملة + تنفس + طوارئ"
              onClick={handleStart}
              cta="استكشف الأدوات"
            />
            <ProductCard
              icon={Zap}
              iconColor="#FBBF24"
              iconBg="rgba(251,191,36,0.12)"
              border="rgba(251,191,36,0.18)"
              tag="تغيير سلوكي"
              tagColor="#FBBF24"
              title="خطة التعافي"
              subtitle="خطة يومية مخصصة بالذكاء الاصطناعي — خطوة عملية كل يوم مبنية على بياناتك."
              preview="📋 خطة AI مخصصة ليك أنت"
            />
            <ProductCard
              icon={Heart}
              iconColor="#F472B6"
              iconBg="rgba(244,114,182,0.12)"
              border="rgba(244,114,182,0.18)"
              tag="وضوح يومي"
              tagColor="#F472B6"
              title="النبض اليومي"
              subtitle="سجّل كيف إنت النهارده — طاقتك، مزاجك، وين تركيزك — وشوف الأنماط."
              preview="💓 تتبع الطاقة اليومية"
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
                    <h3 className="text-sm font-black text-white" style={{ fontFamily: "Tajawal, sans-serif" }}>
                      {item.label}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>{item.desc}</p>
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
                style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", color: "#CBD5E1" }}
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
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ fontFamily: "Tajawal, sans-serif" }}>
              {landingCopy.howItWorks.title}
            </h2>
            <p className="text-sm" style={{ color: "#64748B" }}>{landingCopy.howItWorks.subtitle}</p>
          </motion.div>

          <motion.div variants={staggerFast} className="grid md:grid-cols-3 gap-5">
            {landingCopy.howItWorks.steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative flex flex-col gap-4 rounded-2xl p-7"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.015)"
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
                <h3 className="text-base font-black text-white" style={{ fontFamily: "Tajawal, sans-serif" }}>{step.title}</h3>
                <p className="text-sm leading-loose" style={{ color: "#64748B" }}>{step.body}</p>
              </motion.div>
            ))}
          </motion.div>
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
                <h2 className="text-2xl sm:text-3xl font-black text-white" style={{ fontFamily: "Tajawal, sans-serif" }}>
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
                    <p className="text-sm leading-loose mb-5" style={{ color: "#CBD5E1" }}>&#x201C;{t.quote}&#x201D;</p>
                    <p className="text-xs font-bold" style={{ color: "#64748B" }}>— {t.author}</p>
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
            className="text-2xl sm:text-3xl font-black text-white mb-4"
            style={{ fontFamily: "Tajawal, sans-serif" }}
          >
            الوضوح موجود — هو بس محتاج خريطة.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-sm leading-loose max-w-[40ch] mx-auto mb-8"
            style={{ color: "#94A3B8" }}
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
