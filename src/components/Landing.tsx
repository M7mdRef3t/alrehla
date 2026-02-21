import type { FC } from "react";
import { useEffect, useRef, useState, useMemo } from "react";
import { recordFlowEvent } from "../services/journeyTracking";
import { motion, useReducedMotion } from "framer-motion";
import {
  Star, ArrowLeft, Smartphone, Target, Telescope, X,
  AlertTriangle, Trophy, BookOpen, Compass, ShieldAlert, Navigation, Activity, Menu
} from "lucide-react";
import { usePWAInstall } from "../contexts/PWAInstallContext";
import { landingCopy } from "../copy/landing";
import { soundManager } from "../services/soundManager";
import { loadStreak } from "../services/streakSystem";
import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { calculateEntropy, type UserState } from "../services/predictiveEngine";
import { getDailyContent } from "../services/contentEngine";
import { useGamificationState } from "../services/gamificationEngine";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import type { FeatureFlagKey } from "../config/features";
import { isUserMode } from "../config/appEnv";
import { EditableText } from "./EditableText";
import { getWindowOrNull, getDocumentOrNull } from "../services/clientRuntime";
import { getDocumentVisibilityState } from "../services/clientDom";
import { LandingSimulation } from "./LandingSimulation";
import { StreakWidget } from "./StreakWidget";
import { LeaderboardWidget } from "./LeaderboardWidget";
import { CosmicDashboard } from "./CosmicDashboard";
import { SovereignProfile } from "./SovereignProfile";
import { BehavioralModeBanner } from "./BehavioralModeBanner";
import { HonestyChallenge } from "./HonestyChallenge";
import { SovereigntyOracle } from "./SovereigntyOracle";
import { detectContradictions, dismissMirrorInsight } from "../services/mirrorLogic";
import type { MirrorInsight } from "../services/mirrorLogic";
import { AnimatePresence } from "framer-motion";
import { VictoryReport } from "./VictoryReport";
import { PlaybookViewer } from "./PlaybookViewer";
import { getLanguage, setLanguage, LANGUAGE_OPTIONS } from "../services/i18n";
import { scanForAchievements } from "../services/victoryEngine";
import { useEventHistoryStore } from "../state/eventHistoryStore";
import {
  QuickPrioritySection,
  FeatureShowcaseSection,
  MetricsSection,
  TestimonialsSection,
  FinalReadinessSection
} from "./landing/LandingSections";
import { useLandingLiveData } from "../architecture/landingLiveData";

/* ══════════════════════════════════════════
   LANDING — Dawayir
   ══════════════════════════════════════════ */

interface LandingProps {
  onStartJourney: () => void;
  onRestartJourney?: () => void;
  onOpenTools?: () => void;
  showTopToolsButton?: boolean;

  showToolsSection?: boolean;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
  availableFeatures?: Partial<Record<FeatureFlagKey, boolean>>;
  ownerInstallRequestNonce?: number;
  onOwnerInstallRequestHandled?: () => void;
}

/* ── animation tokens ── */
const ease = [0.25, 1, 0.5, 1] as [number, number, number, number];
const fadeUp = (reduceMotion: boolean | null) => ({
  hidden: { opacity: 0, y: reduceMotion ? 0 : 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } }
});
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const item = (reduceMotion: boolean | null) => ({
  hidden: { opacity: 0, y: reduceMotion ? 0 : 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } }
});

/* ═══════════════════════════════════
   🌌 Floating Particles — خلفية متحركة
   ═══════════════════════════════════ */
const FloatingParticles: FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.35 + 0.08,
      color: i % 4 === 0 ? "rgba(45,212,191," :
        i % 4 === 1 ? "rgba(167,139,250," :
          i % 4 === 2 ? "rgba(125,211,252," : "rgba(52,211,153,",
    })),
    []
  );

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `${p.color}${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}${p.opacity * 0.5})`,
          }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 5, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.7, p.opacity * 1.3, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════
   🪐 Orbital Rings — مدارات دائرية
   ═══════════════════════════════════ */
const OrbitalRings: FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const rings = [
    { size: 280, border: "rgba(45,212,191,0.08)", duration: 45, dash: "4 12" },
    { size: 420, border: "rgba(167,139,250,0.06)", duration: 60, dash: "6 18" },
    { size: 560, border: "rgba(125,211,252,0.05)", duration: 80, dash: "3 20" },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rings.map((r, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: r.size,
            height: r.size,
            border: `1px solid transparent`,
            borderImage: `repeating-linear-gradient(0deg, ${r.border}, ${r.border} 4px, transparent 4px, transparent 12px) 1`,
            borderRadius: "50%",
            borderStyle: "dashed",
            borderColor: r.border,
          }}
          animate={shouldReduceMotion ? {} : { rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: r.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

/* ══════ MAIN ══════ */
export const Landing: FC<LandingProps> = ({
  onStartJourney,
  onRestartJourney,
  onOpenTools,
  showTopToolsButton = true,
  showToolsSection = true,
  onFeatureLocked,
  availableFeatures,
  ownerInstallRequestNonce = 0,
  onOwnerInstallRequestHandled
}) => {
  const nodesCount = useMapState((s) => s.nodes.length);
  const nodes = useMapState((s) => s.nodes); // needed for reactivity
  const eventsCount = useEventHistoryStore((s) => s.events.length);

  // Silent Observer State
  const [psychState, setPsychState] = useState<UserState>("ORDER");
  const [entropyScore, setEntropyScore] = useState(0);
  const adaptiveContent = useMemo(() => getDailyContent(psychState), [psychState]);

  // Phase 21: Honesty Challenge state
  const [honestyInsight, setHonestyInsight] = useState<MirrorInsight | null>(null);

  // Phase 23: Tactical HQ State
  const [showVictoryReport, setShowVictoryReport] = useState(false);
  const [showPlaybookViewer, setShowPlaybookViewer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => getLanguage());
  const currentLangIndex = Math.max(0, LANGUAGE_OPTIONS.findIndex((opt) => opt.code === currentLang));
  const currentLangOption = LANGUAGE_OPTIONS[currentLangIndex] ?? LANGUAGE_OPTIONS[0];
  const nextLangOption = LANGUAGE_OPTIONS[(currentLangIndex + 1) % LANGUAGE_OPTIONS.length] ?? LANGUAGE_OPTIONS[0];

  // Gamification State (Phase 15)
  const rank = useGamificationState((s) => s.rank);
  const xp = useGamificationState((s) => s.xp);
  const nextLevelXP = Math.ceil((xp + 1) / 100) * 100; // Simplified next level logic
  const progress = (xp % 100);

  useEffect(() => {
    const insight = calculateEntropy();
    setPsychState(insight.state);
    setEntropyScore(insight.entropyScore);

    // Phase 21: Check for contradictions after state update
    if (!honestyInsight) {
      const contradiction = detectContradictions();
      if (contradiction) setHonestyInsight(contradiction);
    }
  }, [nodes]);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const lastGoalId = useJourneyState((s) => s.goalId);
  const lastGoalCategory = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const lastGoalMeta = getGoalMeta(lastGoalRecord?.goalId);
  const [badgePulse, setBadgePulse] = useState(false);
  const lastGoalRef = useRef<string | null>(lastGoalLabel ?? null);
  const hasExistingJourney = Boolean(baselineCompletedAt || nodesCount > 0);
  const showLandingStreak = hasExistingJourney && loadStreak().currentStreak > 0;
  const streakData = loadStreak();
  const completedMissionsCount = useMemo(
    () => nodes.filter((n) => Boolean(n.missionProgress?.isCompleted)).length,
    [nodes]
  );
  const growthDecisionInsight = useMemo(() => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const yellowNodes = nodes.filter((n) => n.ring === "yellow" && !n.isNodeArchived);
    if (yellowNodes.length === 0) return null;

    const enriched = yellowNodes.map((node) => {
      const anchor = node.analysis?.timestamp ?? node.journeyStartDate ?? null;
      const ageDays = anchor ? Math.max(0, Math.floor((now - anchor) / DAY_MS)) : 0;
      return { node, ageDays };
    });

    const candidate = enriched.sort((a, b) => b.ageDays - a.ageDays)[0];
    if (!candidate) return null;

    return {
      nodeId: candidate.node.id,
      nodeLabel: candidate.node.label,
      ageDays: candidate.ageDays
    };
  }, [nodes]);
  const achievementsCount = useMemo(() => scanForAchievements().length, [eventsCount]);
  const landingLiveData = useLandingLiveData(landingCopy.testimonials ?? []);
  const hasVictoryAchievements = achievementsCount > 0;
  const landingViewedAt = useRef<number | null>(null);
  const didStartJourneyRef = useRef(false);
  const didTrackLandingClosedRef = useRef(false);
  const pwaInstall = usePWAInstall();
  const [hasMounted, setHasMounted] = useState(false);
  const canShowInstallButton = hasMounted && Boolean(pwaInstall?.canShowInstallButton);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (landingViewedAt.current == null) {
      landingViewedAt.current = Date.now();
      recordFlowEvent("landing_viewed");
    }
  }, []);

  const handleStartJourney = () => {
    didStartJourneyRef.current = true;
    const timeToAction = landingViewedAt.current ? Date.now() - landingViewedAt.current : undefined;
    try {
      recordFlowEvent("landing_clicked_start", { timeToAction });
    } catch {
      // Never block the primary CTA on analytics/tracking failures.
    }
    onStartJourney();
  };

  const triggerPwaInstall = () => {
    if (!pwaInstall || !canShowInstallButton) return;
    try {
      recordFlowEvent("install_clicked");
    } catch {
      // ignore tracking failures
    }
    if (pwaInstall.hasInstallPrompt) void pwaInstall.triggerInstall();
    else pwaInstall.showInstallHint();
  };

  useEffect(() => {
    const windowRef = getWindowOrNull();
    const documentRef = getDocumentOrNull();
    if (!windowRef || !documentRef) return;

    const trackLandingClosedOnce = () => {
      if (didStartJourneyRef.current) return;
      if (didTrackLandingClosedRef.current) return;
      didTrackLandingClosedRef.current = true;
      try {
        recordFlowEvent("landing_closed");
      } catch {
        // ignore tracking failures
      }
    };

    const onVisibility = () => {
      if (getDocumentVisibilityState() === "hidden") trackLandingClosedOnce();
    };

    const onPageHide = () => {
      trackLandingClosedOnce();
    };

    documentRef.addEventListener("visibilitychange", onVisibility);
    windowRef.addEventListener("pagehide", onPageHide);
    return () => {
      documentRef.removeEventListener("visibilitychange", onVisibility);
      windowRef.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  useEffect(() => {
    if (!lastGoalLabel) return;
    if (lastGoalRef.current && lastGoalRef.current !== lastGoalLabel) {
      setBadgePulse(true);
      const t = setTimeout(() => setBadgePulse(false), 700);
      lastGoalRef.current = lastGoalLabel;
      return () => clearTimeout(t);
    }
    lastGoalRef.current = lastGoalLabel;
  }, [lastGoalLabel]);

  useEffect(() => {
    if (!ownerInstallRequestNonce) return;
    triggerPwaInstall();
    onOwnerInstallRequestHandled?.();
  }, [ownerInstallRequestNonce, onOwnerInstallRequestHandled, triggerPwaInstall]);

  // View Mode: Standard vs Cosmic (Phase 17)
  const [viewMode, setViewMode] = useState<"standard" | "cosmic">("standard");

  const isCrisis = entropyScore >= 85;
  const canUseCosmicView = Boolean(availableFeatures?.global_atlas);
  const canUseLanguageSwitcher = Boolean(availableFeatures?.language_switcher);
  const shouldShowTopToolsButton = showTopToolsButton && !isUserMode;
  const shouldShowToolsSection = showToolsSection && !isUserMode;

  useEffect(() => {
    if (viewMode === "cosmic" && !canUseCosmicView) {
      setViewMode("standard");
    }
  }, [canUseCosmicView, viewMode]);

  const openLegalPage = (path: "/privacy" | "/terms") => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    windowRef.history.pushState({ screen: "landing" }, "", path);
    windowRef.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div
      className={`relative w-full min-h-screen transition-all duration-1000 ${isCrisis ? "bg-black" : ""}`}
      style={{
        background: isCrisis
          ? "radial-gradient(circle at center, #1a0000 0%, #000 100%)"
          : undefined
      }}
      dir={currentLang === "ar" ? "rtl" : "ltr"}
    >

      {/* ── 🌍 Language Toggle (Phase 23) ── */}
      {canUseLanguageSwitcher && (
        <div className="absolute top-16 right-4 z-[60] sm:top-6 sm:right-6">
          <button
            type="button"
            onClick={() => {
              const nextLangCode = nextLangOption.code;
              setLanguage(nextLangCode);
              setCurrentLang(nextLangCode);
            }}
            className="px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all bg-white/10 border-white/20 text-white hover:bg-white/15"
            title={`تبديل اللغة إلى ${nextLangOption.label}`}
          >
            {currentLangOption.flag} {currentLangOption.label}
          </button>
        </div>
      )}

      {/* ── 🌌 animated background ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* gradient base — لمسات أزرق فاتح وبنفسجي للهدوء النفسي */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 30% 20%, rgba(167,139,250,0.07) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(125,211,252,0.06) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(45,212,191,0.05) 0%, transparent 60%), radial-gradient(ellipse at 15% 80%, rgba(192,132,252,0.04) 0%, transparent 45%)"
        }} />
        {/* particles */}
        {!reduceMotion && <FloatingParticles />}
        {/* orbital rings */}
        {!reduceMotion && <OrbitalRings />}

        {/* Tactical Scanner Sweep */}
        {!reduceMotion && (
          <motion.div
            className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/20 to-transparent z-[1]"
            animate={{
              top: ["0%", "100%", "0%"],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col items-center pt-8 sm:pt-12 px-4 pb-20 overflow-x-hidden">
        {/* 🛠️ Sticky Tactical HUD (Phase 50) */}
        <AnimatePresence>
          {scrolled && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[95%] max-w-lg"
            >
              <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center justify-between shadow-2xl shadow-teal-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                    <Target className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-teal-300 font-black uppercase tracking-tighter leading-none">مركز العمليات</p>
                      <span className="text-[9px] bg-white/10 px-1.5 rounded-full text-white/60 font-mono">RANK {rank}</span>
                    </div>
                    <div className="mt-1 w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-teal-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(xp % 1000) / 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={handleStartJourney} className="px-5 py-2 rounded-full bg-teal-500 text-slate-950 text-xs font-black hover:bg-teal-400 transition-all">
                    الرادار
                  </button>
                  <button
                    onClick={() => {
                      const el = document.getElementById("simulation-playground");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <Activity className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TELESCOPE TOGGLE (Phase 17) */}
        {canUseCosmicView && (
          <div className="absolute top-4 left-4 z-50 sm:top-4 sm:left-6">
            <button
              onClick={() => setViewMode(prev => prev === "standard" ? "cosmic" : "standard")}
              className={`p-3 rounded-full border backdrop-blur-md transition-all duration-500 ${viewMode === "cosmic"
                ? "bg-purple-500/20 border-purple-400 text-purple-300 rotate-180 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white"
                }`}
              title="تبديل العرض"
            >
              {viewMode === "cosmic" ? <X className="w-5 h-5" /> : <Telescope className="w-5 h-5" />}
            </button>
          </div>
        )}

        {viewMode === "cosmic" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-24 min-h-screen"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                الواجهة الكونية
              </h2>
              <p className="text-sm text-purple-400/60 font-mono tracking-widest uppercase mt-1">
                محرك التحليل نشط
              </p>
            </div>
            <CosmicDashboard />
          </motion.div>
        ) : (
          <div className="w-full">
            {/* ════════════════════════════════
              HERO (Standard View)
             ════════════════════════════════ */}
            <motion.section
              className="flex flex-col items-center justify-center text-center min-h-screen py-10 sm:py-14"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {/* Phase 22: Crisis Alert / Supportive Mission (Adaptive Tone) */}
              {isCrisis && (
                <motion.div
                  className="order-5 mb-8 px-4 py-3 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-sm font-bold flex items-center gap-3 animate-pulse relative overflow-hidden"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <div className="absolute inset-0 bg-indigo-500/5 animate-flicker pointer-events-none" />
                  <AlertTriangle className="w-5 h-5 text-indigo-400" />
                  <span className="relative z-10">نظام الدعم نشط والدروع مفعلة: مساحتك آمنة المحيط، دعنا نخفف الضغط معاً بهدوء.</span>
                </motion.div>
              )}

              {/* App Store Style Header */}
              <motion.div variants={fadeUp(reduceMotion)} className="order-1 flex flex-col items-center mb-10 sm:mb-12">
                <div className="flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                  <span className="text-[10px] font-black tracking-[0.2em] text-teal-400 uppercase">
                    {hasExistingJourney ? "مركز العمليات نشط" : "استعداد للانطلاق"}
                  </span>
                </div>

                <h1
                  className="text-[clamp(2.5rem,6vw,4rem)] font-black leading-[1.15] mb-4 tracking-tighter"
                  style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
                >
                  <span className="text-white">{landingCopy.titleLine1}</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-400">
                    {landingCopy.titleLine2}
                  </span>
                </h1>

                <p className="text-[clamp(1.1rem,2.2vw,1.4rem)] font-bold text-slate-300 max-w-[45ch] mb-6 leading-[1.8]">
                  {landingCopy.subtitle}
                </p>

                {/* 🧭 Mission-Gate Flow (Phase 51) */}
                <div className="flex flex-wrap justify-center gap-4 mb-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartJourney}
                    className="group px-6 py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex flex-col items-center gap-2 min-w-[160px]"
                  >
                    <ShieldAlert className="w-6 h-6 text-rose-500 group-hover:animate-pulse transition-transform group-hover:scale-110" />
                    <div className="text-center">
                      <span className="text-[10px] block font-black text-rose-400 uppercase tracking-widest font-mono">CODE: RED_ZONE</span>
                      <span className="text-sm font-bold text-rose-100 italic">أنا في استنزاف</span>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartJourney}
                    className="group px-6 py-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all flex flex-col items-center gap-2 min-w-[160px] hover-glitch"
                  >
                    <Navigation className="w-6 h-6 text-teal-400 group-hover:rotate-12 transition-transform group-hover:scale-110" />
                    <div className="text-center">
                      <span className="text-[10px] block font-black text-teal-400 uppercase tracking-widest font-mono">CODE: GOLD_ORBIT</span>
                      <span className="text-sm font-bold text-teal-100 italic">أريد النمو</span>
                    </div>
                  </motion.button>
                </div>

                <p className="text-xs font-bold text-slate-500 tracking-wide uppercase mt-4 mb-2">{landingCopy.slogan}</p>
              </motion.div>

              {/* 🎮 Fast Simulation Playground (Only for New Users - High Priority) */}
              {!hasExistingJourney && (
                <motion.section
                  id="simulation-playground-hero"
                  className="order-3 phi-section w-full mb-16"
                  variants={fadeUp(reduceMotion)}
                >
                  <div className="rounded-[2.5rem] bg-teal-500/[0.03] border border-teal-500/10 p-8 text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
                    <h3 className="text-xl font-black text-white mb-2">جرب تثبيت حدودك الآن</h3>
                    <p className="text-xs text-slate-500 mb-8">اسحب "شخص" وضعه في المدار المناسب لك لرؤية الأثر</p>
                    <div className="scale-75 sm:scale-90 origin-center transition-transform duration-700 group-hover:scale-[0.95]">
                      <LandingSimulation />
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Identity & Status Bento (Phase 52) */}
              <motion.div
                variants={fadeUp(reduceMotion)}
                className="order-6 w-full max-w-4xl mx-auto mb-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min"
              >
                {/* Oracle - Scanner (Dominant) */}
                <motion.div
                  className="md:col-span-2 md:row-span-2"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="h-full rounded-[2.5rem] border border-teal-500/20 bg-slate-900/40 backdrop-blur-xl p-1 overflow-hidden group relative">
                    <motion.div
                      className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      animate={{ opacity: [0, 0.05, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                    <SovereigntyOracle />
                  </div>
                </motion.div>

                {/* Profile Widget */}
                {hasExistingJourney ? (
                  <motion.div className="md:col-span-1" whileHover={{ y: -5 }}>
                    <div className="h-full rounded-[2.5rem] border border-white/5 bg-slate-800/20 backdrop-blur-xl p-1 shadow-xl">
                      <SovereignProfile />
                    </div>
                  </motion.div>
                ) : (
                  <div className="md:col-span-1 bg-white/5 rounded-[2.5rem] border border-white/5 p-8 flex flex-col justify-center items-center text-center group hover:bg-white/[0.08] transition-all">
                    <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Compass className="w-6 h-6 text-teal-400" />
                    </div>
                    <h4 className="text-sm font-black text-white mb-2 uppercase tracking-widest">بوصلة الوعي</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">بمجرد بدئك، سيتم تحليل نمط طاقتك هنا آلياً.</p>
                  </div>
                )}

                {/* Behavioral banner Across bottom */}
                <motion.div className="md:col-span-1" whileHover={{ y: -5 }}>
                  <div className="h-full rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl">
                    <BehavioralModeBanner
                      mode={isCrisis ? "containment" : psychState === "CHAOS" ? "containment" : nodes.length > 5 ? "growth" : "flow"}
                      entropyScore={entropyScore}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* Ratings & Badges */}
              <motion.div variants={fadeUp(reduceMotion)} className="order-3 flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 text-xs sm:text-sm font-medium text-slate-400">
                <p className="text-[10px] text-teal-300">بياناتك الحالية</p>
                <p className="text-[11px] text-slate-300">مؤشرات مباشرة من رحلتك</p>
              </motion.div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-slate-200">{nodesCount}</span>
                <span className="text-[10px]">علاقة على الخريطة</span>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-slate-200">{completedMissionsCount}</span>
                <span className="text-[10px]">مهام مكتملة</span>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-slate-200">{streakData.totalActiveDays}</span>
                <span className="text-[10px]">أيام نشاط</span>
              </div>



              {/* 🎯 Tactical Headquarters (Phase 23) - Progressive Disclosure */}
              {hasExistingJourney && (
                <motion.div
                  className="order-9 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mx-auto mb-10"
                  variants={item(reduceMotion)}
                >
                  {hasVictoryAchievements && (
                    <button
                      onClick={() => setShowVictoryReport(true)}
                      className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-right flex flex-col gap-2 hover:bg-indigo-500/20 transition-all group"
                    >
                      <Trophy className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <h3 className="text-sm font-bold text-white">تحليل الانتصارات</h3>
                        <p className="text-[10px] text-indigo-300/60 leading-tight">شاهد خريطة نموك وأوسمة الشرف</p>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => setShowPlaybookViewer(true)}
                    className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-right flex flex-col gap-2 hover:bg-teal-500/20 transition-all group"
                  >
                    <BookOpen className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="text-sm font-bold text-white">كتيبات المناورة</h3>
                      <p className="text-[10px] text-teal-300/60 leading-tight">خطط تكتيكية للتعامل مع الصراعات</p>
                    </div>
                  </button>
                </motion.div>
              )}

              {/* ════════════════════════════════
              LEADERBOARD ADDITION (Phase 15) - Progressive Disclosure
             ════════════════════════════════ */}
              {hasExistingJourney && (
                <motion.div variants={item(reduceMotion)} className="order-10">
                  <LeaderboardWidget
                    currentXP={xp}
                    currentRank={rank}
                    completedMissions={completedMissionsCount}
                    streakDays={streakData.currentStreak}
                    achievementsCount={achievementsCount}
                  />
                </motion.div>
              )}

              {/* ════════════════════════════════
              SIMULATION DEMO
              ════════════════════════════════ */}
              {/* CTA — centered (Primary Action) - Moved UP */}
              <motion.div className="order-2 flex flex-col items-center mb-12 sm:mb-16" variants={item(reduceMotion)}>
                <motion.button
                  type="button"
                  onClick={handleStartJourney}
                  className="group relative inline-flex items-center justify-center gap-3 rounded-full px-10 sm:px-14 py-5 sm:py-6 text-[18px] sm:text-[20px] font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9 0%, #2dd4bf 50%, #10b981 100%)",
                    backgroundSize: "200% auto",
                    color: "#fff",
                    boxShadow: "0 0 0 1px rgba(45,212,191,0.3), 0 8px 40px rgba(16,185,129,0.4), 0 2px 4px rgba(0,0,0,0.2)"
                  }}
                  animate={{
                    backgroundPosition: ["0% center", "100% center", "0% center"]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  whileHover={{ y: -4, scale: 1.03, boxShadow: "0 0 0 1px rgba(45,212,191,0.5), 0 16px 64px rgba(16,185,129,0.5), 0 4px 12px rgba(0,0,0,0.15)" }}
                  whileTap={{ scale: 0.96 }}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-4">
                    <EditableText
                      id="landing_cta_journey"
                      defaultText={hasExistingJourney ? "استعادة الاتصال بالمدار" : landingCopy.ctaJourney}
                      page="landing"
                      editOnClick={false}
                      showEditIcon={false}
                    />
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:-translate-x-1.5 backdrop-blur-sm">
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                  </div>
                </motion.button>

                <p className="mt-4 text-[13px] text-center font-bold tracking-widest text-[#21e6c1] uppercase opacity-70">
                  نظام استعادة السيادة الرقمية
                </p>

                {/* ── زر ابدأ رحلة جديدة — يظهر فقط للمستخدم القديم ── */}
                {hasExistingJourney && onRestartJourney && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setShowRestartConfirm(true);
                      }}
                      onMouseEnter={() => soundManager.playHover()}
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold transition-all opacity-60 hover:opacity-100"
                      style={{
                        background: "rgba(251, 191, 36, 0.05)",
                        border: "1px solid rgba(251, 191, 36, 0.15)",
                        color: "rgba(253, 230, 138, 0.7)"
                      }}
                      whileHover={{ scale: 1.03, backgroundColor: "rgba(251, 191, 36, 0.1)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Target className="w-3.5 h-3.5" />
                      إعادة تعيين المسار
                    </motion.button>
                    <p className="text-[10px] text-amber-200/40">لا يحذف بياناتك الحالية</p>
                  </div>
                )}
              </motion.div>

              {shouldShowTopToolsButton && onOpenTools && (
                <motion.div variants={item(reduceMotion)} className="order-4 mb-8">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      onOpenTools();
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all"
                    style={{
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(45, 212, 191, 0.35)",
                      color: "rgba(153, 246, 228, 0.95)"
                    }}
                  >
                    <Target className="w-4 h-4" />
                    {landingCopy.toolsTitle}
                  </button>
                </motion.div>
              )}

              {/* ════════════════════════════════
              ADAPTIVE MISSION CARD (Phase 14)
             ════════════════════════════════ */}
              <motion.div variants={item(reduceMotion)} className="order-11 w-full max-w-[34rem] mx-auto mb-10">
                <div
                  className={`p-6 rounded-2xl border backdrop-blur-md text-right relative overflow-hidden group transition-all duration-500 hover:scale-[1.02]`}
                  style={{
                    background: adaptiveContent.themeColor === "rose"
                      ? "linear-gradient(135deg, rgba(244,63,94,0.1), rgba(244,63,94,0.02))"
                      : adaptiveContent.themeColor === "cyan"
                        ? "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(34,211,238,0.02))"
                        : "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))",
                    borderColor: adaptiveContent.themeColor === "rose"
                      ? "rgba(244,63,94,0.2)"
                      : adaptiveContent.themeColor === "cyan"
                        ? "rgba(34,211,238,0.2)"
                        : "rgba(16,185,129,0.2)"
                  }}
                >
                  {/* Dynamic Icon/Emoji */}
                  <div className="absolute top-4 left-4 text-2xl opacity-80 group-hover:scale-110 transition-transform">
                    {adaptiveContent.themeColor === "rose" ? "🛡️" : adaptiveContent.themeColor === "cyan" ? "🌊" : "🚀"}
                  </div>

                  <h3 className={`text-lg font-bold mb-2 ${adaptiveContent.themeColor === "rose" ? "text-rose-300" : adaptiveContent.themeColor === "cyan" ? "text-cyan-300" : "text-emerald-300"
                    }`}>
                    {growthDecisionInsight ? "قرار نمو يحتاج حسم 🚀" : adaptiveContent.missionTitle}
                  </h3>

                  <p className="text-slate-200 text-sm leading-[1.8] mb-4 font-medium opacity-90">
                    {growthDecisionInsight ? `حالة معلّقة: ${growthDecisionInsight.nodeLabel}` : adaptiveContent.greeting} <br />
                    <span className="opacity-70 font-normal">
                      {growthDecisionInsight
                        ? growthDecisionInsight.ageDays > 0
                          ? `بقالها ${growthDecisionInsight.ageDays} يوم في المدار الأصفر. القرار النهاردة هيحسم التردد.`
                          : "مفتوحة النهاردة في المدار الأصفر. الحسم السريع أفضل من التأجيل."
                        : adaptiveContent.missionDescription}
                    </span>
                  </p>

                  {(growthDecisionInsight || adaptiveContent.script) && (
                    <div className="bg-black/20 rounded-lg p-3 text-xs text-slate-400 border border-white/5">
                      <div className="flex gap-2 mb-1">
                        <span className="text-rose-400 font-bold">❌ لا تقل:</span>
                        <span>{growthDecisionInsight ? "هأجل القرار يوم كمان" : adaptiveContent.script?.dontSay}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-emerald-400 font-bold">✅ قل:</span>
                        <span>{growthDecisionInsight ? "هفتح الخريطة دلوقتي وأثبت قرار واضح" : adaptiveContent.script?.doSay}</span>
                      </div>
                    </div>
                  )}

                  {growthDecisionInsight && (
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        recordFlowEvent("next_step_action_taken", {
                          meta: {
                            action: "growth_card_execute_now",
                            nodeId: growthDecisionInsight.nodeId,
                            nodeLabel: growthDecisionInsight.nodeLabel,
                            ageDays: growthDecisionInsight.ageDays
                          }
                        });
                        handleStartJourney();
                      }}
                      className="mt-3 w-full rounded-xl bg-emerald-500 text-slate-950 py-2.5 text-xs font-black hover:bg-emerald-400 transition-colors"
                    >
                      افتح الخريطة وخد القرار الآن
                    </button>
                  )}
                </div>
              </motion.div>

              {/* ════════════════════════════════
              SIMULATION DEMO
              ════════════════════════════════ */}


              {/* زر التثبيت — يظهر لجميع المستخدمين (وضع المستخدم) على موبايل/تابلت */}
              {canShowInstallButton && (
                <div className="w-full flex justify-center">
                  <button
                    type="button"
                    onClick={() => { soundManager.playClick(); triggerPwaInstall(); }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium border transition-colors"
                    style={{
                      borderColor: "rgba(59, 130, 246, 0.5)",
                      color: "rgba(147, 197, 253, 0.95)",
                      background: "rgba(59, 130, 246, 0.12)"
                    }}
                    aria-label="تثبيت التطبيق"
                  >
                    <Smartphone className="w-4 h-4" />
                    تثبيت التطبيق
                  </button>
                </div>
              )}

              {/* scroll indicator (Mouse icon) */}
              <motion.div
                className="mt-8 mb-6 cursor-pointer hover:opacity-100 transition-opacity relative z-50 pointer-events-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 2, duration: 1 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const el = document.getElementById("simulation-playground");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              >
                <motion.div
                  className="w-5 h-8 rounded-full border-2 border-white/30 flex justify-center pt-1.5 mx-auto shadow-lg shadow-teal-500/10"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-1 h-2 rounded-full bg-teal-400"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              </motion.div>
            </motion.section>

            {/* ════════════════════════════════
            SIMULATION PLAYGROUND — ONLY FOR RETURNING (Lower Priority)
           ════════════════════════════════ */}
            {hasExistingJourney && (
              <motion.section
                id="simulation-playground"
                className="phi-section relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] flex flex-col items-center justify-center overflow-hidden py-24 sm:py-32"
                style={{ background: "radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.1) 0%, transparent 70%)" }}
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-10%" }}
              >
                <motion.div variants={fadeUp(reduceMotion)} className="text-center mb-12 relative z-10 px-4">
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 mb-6 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-xs font-black tracking-[0.2em] text-teal-200 uppercase">غرفة المحاكاة</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">جرب تثبيت حدودك الآن</h3>
                  <p className="text-slate-400 text-lg max-w-[45ch] mx-auto leading-relaxed">
                    اسحب "شخصية" وضعها في المدار الذي تستحقه.. <br className="hidden sm:block" />
                    استشعر الفرق الفوري في طاقتك ومساحتك الآمنة.
                  </p>
                </motion.div>

                <motion.div
                  variants={item(reduceMotion)}
                  className="relative z-10 scale-90 sm:scale-105 md:scale-125 transition-transform duration-700 hover:scale-[1.1] md:hover:scale-[1.3]"
                >
                  <div className="absolute -inset-20 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
                  <LandingSimulation />
                </motion.div>
              </motion.section>
            )}

            <QuickPrioritySection stagger={stagger} item={item(reduceMotion)} />
            <FeatureShowcaseSection
              stagger={stagger}
              item={item(reduceMotion)}
              onExploreAll={() => {
                soundManager.playClick();
                if (onOpenTools) onOpenTools();
                else handleStartJourney();
              }}
              onOpenRadar={() => {
                soundManager.playClick();
                recordFlowEvent("next_step_action_taken", { meta: { action: "feature_radar_opened" } });
                handleStartJourney();
              }}
              onOpenCourt={() => {
                soundManager.playClick();
                recordFlowEvent("next_step_action_taken", { meta: { action: "feature_inner_court_opened" } });
                handleStartJourney();
              }}
              onOpenPlaybooks={() => {
                soundManager.playClick();
                recordFlowEvent("next_step_action_taken", { meta: { action: "feature_playbooks_opened" } });
                setShowPlaybookViewer(true);
              }}
            />
            {shouldShowToolsSection && onOpenTools && (
              <motion.section
                className="py-8 sm:py-12"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
              >
                <motion.div variants={item(reduceMotion)} className="rounded-2xl p-6 text-center bg-slate-900/45 border border-teal-500/20">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{landingCopy.toolsTitle}</h3>
                  <p className="text-sm text-slate-300 mb-5">{landingCopy.toolsCtaHint}</p>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      onOpenTools();
                    }}
                    onMouseEnter={() => soundManager.playHover()}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)" }}
                  >
                    <Target className="w-4 h-4" />
                    {landingCopy.toolsCta}
                  </button>
                </motion.div>
              </motion.section>
            )}
            {!shouldShowToolsSection && (
              <motion.section
                className="py-6 sm:py-8"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
              >
                <motion.div variants={item(reduceMotion)} className="rounded-2xl p-5 text-center bg-slate-900/35 border border-slate-700/60">
                  <p className="text-sm text-slate-300">
                    قسم الأدوات المتقدمة غير متاح في باقتك الحالية.
                  </p>
                </motion.div>
              </motion.section>
            )}
            <MetricsSection stagger={stagger} item={item(reduceMotion)} metricsState={landingLiveData.metrics} />
            <TestimonialsSection
              stagger={stagger}
              item={item(reduceMotion)}
              testimonials={landingCopy.testimonials ?? []}
              testimonialsState={landingLiveData.testimonials}
            />
            <FinalReadinessSection
              stagger={stagger}
              item={item(reduceMotion)}
              lastGoalLabel={lastGoalLabel}
              badgePulse={badgePulse}
              LastGoalIcon={lastGoalMeta?.icon}
            />


            {/* ════════════════════════════════
            LEGAL — سياسة الخصوصية وشروط الاستخدام
           ════════════════════════════════ */}
            <motion.footer
              className="py-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <button
                type="button"
                onClick={() => openLegalPage("/privacy")}
                className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
              >
                سياسة الخصوصية
              </button>
              <button
                type="button"
                onClick={() => openLegalPage("/terms")}
                className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
              >
                شروط الاستخدام
              </button>
            </motion.footer>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showRestartConfirm && onRestartJourney && (
          <motion.div
            className="fixed inset-0 z-[130] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
              onClick={() => setShowRestartConfirm(false)}
              aria-label="إغلاق تأكيد إعادة الإعداد"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="relative w-full max-w-sm rounded-2xl border border-amber-400/25 bg-slate-900/95 p-5 text-right"
            >
              <h4 className="text-sm font-black text-amber-300 mb-2">تأكيد إعادة الإعداد</h4>
              <p className="text-xs text-slate-300 leading-[1.8] mb-4">
                هتبدأ إعداد الرحلة من جديد (Onboarding)، لكن بياناتك الحالية هتفضل محفوظة.
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRestartConfirm(false)}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/5"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setShowRestartConfirm(false);
                    onRestartJourney();
                  }}
                  className="rounded-lg border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-200 hover:bg-amber-500/30"
                >
                  نعم، ابدأ من جديد
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {honestyInsight && (
          <HonestyChallenge
            insight={honestyInsight}
            onAccept={() => {
              dismissMirrorInsight(honestyInsight.id);
              setHonestyInsight(null);
              useGamificationState.getState().addXP(50, "Honesty Challenge Resolved");
            }}
            onDismiss={() => {
              dismissMirrorInsight(honestyInsight.id);
              setHonestyInsight(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVictoryReport && (
          <VictoryReport
            onClose={() => setShowVictoryReport(false)}
            onTakeTodayAction={() => {
              setShowVictoryReport(false);
              handleStartJourney();
            }}
          />
        )}
        {showPlaybookViewer && (
          <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-3xl overflow-y-auto pt-10">
            <button
              onClick={() => setShowPlaybookViewer(false)}
              className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 z-[130]"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <PlaybookViewer />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
