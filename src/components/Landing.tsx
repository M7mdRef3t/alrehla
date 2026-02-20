import type { FC } from "react";
import { useEffect, useRef, useState, useMemo } from "react";
import { recordFlowEvent } from "../services/journeyTracking";
import { motion, useReducedMotion } from "framer-motion";
import {
  Star, ArrowLeft, Smartphone, Target, Telescope, X,
  AlertTriangle, Trophy, BookOpen
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
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } };

/* ═══════════════════════════════════
   🌌 Floating Particles — خلفية متحركة
   ═══════════════════════════════════ */
const FloatingParticles: FC = () => {
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
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
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
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const currentLang = getLanguage();
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
  const reduceMotion = useReducedMotion();
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

  useEffect(() => {
    if (viewMode === "cosmic" && !canUseCosmicView) {
      setViewMode("standard");
    }
  }, [canUseCosmicView, viewMode]);

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
        <div className="absolute top-6 right-6 z-[60]">
          <button
            type="button"
            onClick={() => {
              setLanguage(nextLangOption.code);
              window.location.reload();
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
      </div>

      <div className="relative z-10 w-full max-w-[680px] mx-auto px-5 sm:px-6">

        {/* TELESCOPE TOGGLE (Phase 17) */}
        {canUseCosmicView && (
          <div className="absolute top-4 right-4 z-50">
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
          <>
            {/* ════════════════════════════════
              HERO (Standard View)
             ════════════════════════════════ */}
            <motion.section
              className="flex flex-col items-center justify-center text-center min-h-screen py-12"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {/* pill badge — Tactical Status */}
              {/* pill badge — Tactical Status (Silent Observer) */}
              {/* Phase 25: Sovereign Identity Profile */}
              <motion.div variants={fadeUp} className="order-6 w-full max-w-lg mx-auto mb-6 px-4">
                <SovereigntyOracle />
              </motion.div>

              <motion.div variants={fadeUp} className="order-7 w-full max-w-lg mx-auto mb-6 px-4">
                <SovereignProfile />
              </motion.div>

              {/* Phase 21: Behavioral Mode Banner (Strategic Context) */}
              <motion.div variants={fadeUp} className="order-8 w-full max-w-lg mx-auto mb-6 px-4">
                <BehavioralModeBanner
                  mode={isCrisis ? "containment" : psychState === "CHAOS" ? "containment" : nodes.length > 5 ? "growth" : "flow"}
                  entropyScore={entropyScore}
                />
              </motion.div>

              {/* Phase 22: Crisis Alert / Suicide Mission */}
              {isCrisis && (
                <motion.div
                  className="order-5 mb-8 px-4 py-3 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-200 text-sm font-bold flex items-center gap-3 animate-pulse"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  بروتوكول الطوارئ مُفعل: الأولوية لقطع "الثقوب السوداء" فوراً.
                </motion.div>
              )}


              {/* App Store Style Header */}
              <motion.div variants={fadeUp} className="order-1 flex flex-col items-center mb-6">
                <p className="text-xs sm:text-sm font-semibold text-teal-300 mb-2">
                  {landingCopy.hook}
                </p>
                {showLandingStreak && (
                  <motion.div variants={item} className="mb-4 w-56">
                    <StreakWidget compact={true} />
                  </motion.div>
                )}
                <h1
                  className="text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-bold leading-[1.1] mb-2 tracking-tight"
                  style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
                >
                  {landingCopy.titleLine1}
                  <br />
                  {landingCopy.titleLine2}
                </h1>
                <p className="text-lg sm:text-xl font-medium text-slate-400">
                  {landingCopy.subtitle}
                </p>
                <p className="mt-2 text-sm text-slate-500">{landingCopy.slogan}</p>
              </motion.div>

              {/* Ratings & Badges */}
              <motion.div variants={fadeUp} className="order-3 flex items-center gap-6 mb-10 text-xs sm:text-sm font-medium text-slate-400">
                <div className="text-center">
                  <p className="text-[10px] text-teal-300">بياناتك الحالية</p>
                  <p className="text-[11px] text-slate-300">مؤشرات مباشرة من رحلتك</p>
                </div>
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
              </motion.div>

              {/* 🎯 Tactical Headquarters (Phase 23) */}
              <motion.div
                className="order-9 grid grid-cols-2 gap-4 w-full max-w-lg mx-auto mb-10"
                variants={item}
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

              {/* ════════════════════════════════
              LEADERBOARD ADDITION (Phase 15)
             ════════════════════════════════ */}
              <motion.div variants={item} className="order-10">
                <LeaderboardWidget
                  currentXP={xp}
                  currentRank={rank}
                  completedMissions={completedMissionsCount}
                  streakDays={streakData.currentStreak}
                  achievementsCount={achievementsCount}
                />
              </motion.div>

              {/* ════════════════════════════════
              SIMULATION DEMO
              ════════════════════════════════ */}
              {/* CTA — centered (Primary Action) - Moved UP */}
              <motion.div className="order-2 flex flex-col items-center mb-16" variants={item}>
                <motion.button
                  type="button"
                  onClick={handleStartJourney}
                  className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-10 py-4 text-[16px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                    color: "#fff",
                    boxShadow: "0 0 0 1px rgba(16,185,129,0.3), 0 4px 24px rgba(16,185,129,0.35), 0 1px 2px rgba(0,0,0,0.2)"
                  }}
                  whileHover={{ y: -2, boxShadow: "0 0 0 1px rgba(16,185,129,0.4), 0 8px 36px rgba(16,185,129,0.5), 0 2px 8px rgba(0,0,0,0.15)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <div className="relative flex items-center gap-2">
                    <EditableText
                      id="landing_cta_journey"
                      defaultText={landingCopy.ctaJourney}
                      page="landing"
                      editOnClick={false}
                      showEditIcon={false}
                    />
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                  </div>
                </motion.button>

                <p className="mt-3 text-[14px] text-center font-medium leading-relaxed max-w-xs" style={{ color: "rgba(203,213,225,0.8)" }}>
                  {hasExistingJourney
                    ? "استعد لاستكمال المناورات من آخر إحداثيات"
                    : "خطوة واحدة لتأمين أول قاعدة في خريطة وعيك"
                  }
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
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold transition-all"
                      style={{
                        background: "rgba(251, 191, 36, 0.08)",
                        border: "1px solid rgba(251, 191, 36, 0.25)",
                        color: "rgba(253, 230, 138, 0.9)"
                      }}
                      whileHover={{ scale: 1.03, backgroundColor: "rgba(251, 191, 36, 0.14)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Target className="w-3.5 h-3.5" />
                      إعادة إعداد الرحلة
                    </motion.button>
                    <p className="text-[11px] text-amber-200/80">لا يحذف بياناتك الحالية</p>
                  </div>
                )}
              </motion.div>

              {showTopToolsButton && onOpenTools && (
                <motion.div variants={item} className="order-4 mb-8">
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
              <motion.div variants={item} className="order-11 w-full max-w-sm mx-auto mb-10">
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

                  <p className="text-slate-200 text-sm leading-relaxed mb-4 font-medium opacity-90">
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
            SIMULATION PLAYGROUND — Full Width Section
           ════════════════════════════════ */}
            <motion.section
              id="simulation-playground"
              className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] py-20 flex flex-col items-center justify-center overflow-hidden"
              style={{}}
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
            >
              <motion.div variants={fadeUp} className="text-center mb-8 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/10 mb-3 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  <span className="text-[11px] font-bold tracking-wider text-teal-200 uppercase">مساحة تجريبية</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">جرب تحط حدودك</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto px-4">
                  اسحب "شخص" وحطه في المدار المناسب ليك وشوف إحساسك إيه
                </p>
              </motion.div>

              <motion.div variants={item} className="relative z-10 scale-110 sm:scale-125 transition-transform duration-500 hover:scale-[1.3]">
                <LandingSimulation />
              </motion.div>

              {/* Cosmic Ambient Background for this section */}
              <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px]" />
              </div>
            </motion.section>

            <QuickPrioritySection stagger={stagger} item={item} />
            <FeatureShowcaseSection
              stagger={stagger}
              item={item}
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
            {showToolsSection && onOpenTools && (
              <motion.section
                className="py-8 sm:py-12"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
              >
                <motion.div variants={item} className="rounded-2xl p-6 text-center bg-slate-900/45 border border-teal-500/20">
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
            <MetricsSection stagger={stagger} item={item} metricsState={landingLiveData.metrics} />
            <TestimonialsSection
              stagger={stagger}
              item={item}
              testimonials={landingCopy.testimonials ?? []}
              testimonialsState={landingLiveData.testimonials}
            />
            <FinalReadinessSection
              stagger={stagger}
              item={item}
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
              <a
                href="/privacy"
                className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
              >
                سياسة الخصوصية
              </a>
              <a
                href="/terms"
                className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
              >
                شروط الاستخدام
              </a>
            </motion.footer>

            <div className="h-8" />
          </>
        )}

        {/* Phase 21: Honesty Challenge Overlay */}
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
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
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

        {/* 🔮 Victory & Playbook Modals (Phase 23) */}
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

      </div >
    </div >
  );
};
