import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Smartphone, Target } from "lucide-react";
import { recordFlowEvent } from "../services/journeyTracking";
import { usePWAInstall } from "../contexts/PWAInstallContext";
import { landingCopy } from "../copy/landing";
import { soundManager } from "../services/soundManager";
import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import { EditableText } from "./EditableText";
import { getDocumentOrNull, getWindowOrNull } from "../services/clientRuntime";
import { getDocumentVisibilityState } from "../services/clientDom";
import { LandingSimulation } from "./LandingSimulation";
import {
  FeatureShowcaseSection,
  MetricsSection,
  HowItWorksSection,
  ProblemFirstSection,
  FinalReadinessSection,
  SystemOverclockSection
} from "./landing/LandingSections";
import { trackEvent, AnalyticsEvents } from "../services/analytics";
import { useLandingLiveData } from "../architecture/landingLiveData";
import { isPublicPaymentsEnabled } from "../config/payments";
import { useABTestingVariant } from "../hooks/useABTestingVariant";
import { designToggles } from "../config/designToggles";

interface LandingProps {
  onStartJourney: () => void;
  ownerInstallRequestNonce?: number;
  onOwnerInstallRequestHandled?: () => void;
}

type PublicPulsePayload = {
  global_phoenix_avg?: number | null;
  is_live?: boolean;
};

type PublicScarcityPayload = {
  seats_left?: number | null;
  total_seats?: number | null;
  active_premium?: number | null;
  closes_at?: string | null;
  is_live?: boolean;
};

const ease = [0.25, 1, 0.5, 1] as [number, number, number, number];
const fadeUp = (reduceMotion: boolean | null) => ({
  hidden: { opacity: 0, y: reduceMotion ? 0 : 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } }
});
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const item = (reduceMotion: boolean | null) => ({
  hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } }
});
const HERO_AB_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const HERO_VARIANT_KEY = "landing.hero_variant";
const HERO_VARIANT_STARTED_AT_KEY = "landing.hero_variant_started_at";
const CHECKOUT_CTA_VARIANT_KEY = "landing.checkout_cta_variant";
const CHECKOUT_CTA_VARIANT_STARTED_AT_KEY = "landing.checkout_cta_variant_started_at";
const SUBTITLE_VARIANT_KEY = "landing.subtitle_variant";
const SUBTITLE_VARIANT_STARTED_AT_KEY = "landing.subtitle_variant_started_at";

const formatLiveAge = (updatedAt: number | null): string => {
  if (!updatedAt) return "غير متاح";
  const deltaMs = Math.max(0, Date.now() - updatedAt);
  if (deltaMs < 60_000) return "الآن";
  if (deltaMs < 3_600_000) return `منذ ${Math.floor(deltaMs / 60_000)} دقيقة`;
  return `منذ ${Math.floor(deltaMs / 3_600_000)} ساعة`;
};

const formatCountdown = (isoDate: string | null): string | null => {
  if (!isoDate) return null;
  const endsAt = new Date(isoDate).getTime();
  if (!Number.isFinite(endsAt)) return null;
  const remainingMs = Math.max(0, endsAt - Date.now());
  if (remainingMs === 0) return "أُغلق باب الفوج الحالي.";
  const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (hours < 24) return `ينتهي خلال ${hours} ساعة`;
  const days = Math.ceil(hours / 24);
  return `ينتهي خلال ${days} يوم`;
};

const FloatingParticles: FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.6)] animate-pulse" style={{ animationDuration: "3s" }} />
      <div className="absolute top-[60%] left-[80%] w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-[0_0_8px_rgba(167,139,250,0.6)] animate-pulse" style={{ animationDuration: "4s" }} />
      <div className="absolute top-[80%] left-[20%] w-2.5 h-2.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.6)] animate-pulse" style={{ animationDuration: "5s" }} />
      <div className="absolute top-[10%] left-[70%] w-1 h-1 rounded-full bg-teal-200 shadow-[0_0_6px_rgba(45,212,191,0.4)] animate-pulse" style={{ animationDuration: "2.5s" }} />
    </div>
  );
};

const OrbitalRings: FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
      <div className="absolute rounded-full border border-dashed border-teal-500/10 w-[320px] h-[320px] animate-[spin_40s_linear_infinite]" />
      <div className="absolute rounded-full border border-dashed border-indigo-500/10 w-[480px] h-[480px] animate-[spin_60s_linear_infinite_reverse]" />
    </div>
  );
};

const RadarSweep: FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_12s_linear_infinite]"
        style={{
          width: "120vh",
          height: "120vh",
          background: "conic-gradient(from 0deg, rgba(45,212,191,0.15) 0deg, rgba(45,212,191,0) 60deg, transparent 360deg)",
          borderRadius: "50%",
          filter: "blur(40px)"
        }}
      />
    </div>
  );
};

export const Landing: FC<LandingProps> = ({
  onStartJourney,
  ownerInstallRequestNonce = 0,
  onOwnerInstallRequestHandled
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
  const landingLiveData = useLandingLiveData(landingCopy.testimonials ?? [], {
    enableLiveMetrics: designToggles.enableLiveLandingSections,
    enableLiveTestimonials: designToggles.enableLiveLandingSections
  });

  const [badgePulse, setBadgePulse] = useState(false);
  const [publicPulseAvg, setPublicPulseAvg] = useState<number | null>(null);
  const [isPublicPulseLoading, setIsPublicPulseLoading] = useState(true);
  const [lastLiveUpdatedAt, setLastLiveUpdatedAt] = useState<number | null>(null);
  const heroVariant = useABTestingVariant(HERO_VARIANT_KEY, HERO_VARIANT_STARTED_AT_KEY);
  const checkoutCtaVariant = useABTestingVariant(CHECKOUT_CTA_VARIANT_KEY, CHECKOUT_CTA_VARIANT_STARTED_AT_KEY);
  const subtitleVariant = useABTestingVariant(SUBTITLE_VARIANT_KEY, SUBTITLE_VARIANT_STARTED_AT_KEY);
  const [showExtendedMobileContent, setShowExtendedMobileContent] = useState(false);
  const [showCheckoutHint, setShowCheckoutHint] = useState(false);
  const [showSimulationSection, setShowSimulationSection] = useState(false);
  const [scarcity, setScarcity] = useState<{
    isLive: boolean;
    seatsLeft: number | null;
    totalSeats: number | null;
    activePremium: number | null;
    closesAt: string | null;
  }>({
    isLive: false,
    seatsLeft: null,
    totalSeats: null,
    activePremium: null,
    closesAt: null
  });
  const checkoutHintWindowUntilRef = useRef(0);
  const checkoutHintTimerRef = useRef<number | null>(null);
  const lastGoalRef = useRef<string | null>(lastGoalLabel ?? null);
  const landingViewedAt = useRef<number | null>(null);
  const didStartJourneyRef = useRef(false);
  const didTrackLandingClosedRef = useRef(false);

  const pwaInstall = usePWAInstall();
  const [hasMounted, setHasMounted] = useState(false);
  const [useLiteVisuals, setUseLiteVisuals] = useState(false);
  const canShowInstallButton = hasMounted && Boolean(pwaInstall?.canShowInstallButton);
  const showHeavyAmbientLayers = !reduceMotion && !useLiteVisuals;
  const checkoutCtaLabel = checkoutCtaVariant === "B" ? "فعّل رحلة 21 يوم" : "احجز مقعدك الآن";
  const showLongSections = showExtendedMobileContent;
  const heroTitle = {
    line1: landingCopy.titleLine1,
    line2: landingCopy.titleLine2
  };
  const heroSubtitle =
    subtitleVariant === "B"
      ? "ضع مشكلتك على الخريطة كما هي. التشخيص الصادق أقصر طريق للتعافي الفعلي."
      : landingCopy.subtitle;
  const heroValuePoints = useMemo(
    () => ["خريطة وعي لحظية", "تحليل عميق بلا ضوضاء", "خصوصيتك محفوظة بالكامل"],
    []
  );
  const scarcityMeter = useMemo(() => {
    if (!scarcity.isLive) return null;
    if (typeof scarcity.seatsLeft !== "number" || typeof scarcity.totalSeats !== "number") return null;
    if (!Number.isFinite(scarcity.totalSeats) || scarcity.totalSeats <= 0) return null;

    const seatsLeft = Math.max(0, scarcity.seatsLeft);
    const totalSeats = Math.max(1, scarcity.totalSeats);
    const ratio = Math.min(1, seatsLeft / totalSeats);
    const fillPercent = Math.max(4, Math.round(ratio * 100));
    const rawDanger = 1 - ratio;
    // Keep scarcity visual calm while seats are still comfortably available.
    const danger = seatsLeft > 30 ? rawDanger * 0.35 : rawDanger;
    const start = { r: 45, g: 212, b: 191 }; // teal
    const end = { r: 244, g: 63, b: 94 }; // rose
    const r = Math.round(start.r + (end.r - start.r) * danger);
    const g = Math.round(start.g + (end.g - start.g) * danger);
    const b = Math.round(start.b + (end.b - start.b) * danger);

    return {
      seatsLeft,
      totalSeats,
      fillPercent,
      fillColor: `rgb(${r}, ${g}, ${b})`
    };
  }, [scarcity]);
  const scarcityCountdown = useMemo(() => formatCountdown(scarcity.closesAt), [scarcity.closesAt]);
  const socialProofLine = useMemo(() => {
    if (!scarcity.isLive || typeof scarcity.activePremium !== "number") return null;
    if (typeof scarcity.totalSeats !== "number" || scarcity.totalSeats <= 0) return `مفعّل الآن: ${scarcity.activePremium} مستخدم.`;
    return `مفعّل الآن: ${scarcity.activePremium}/${scarcity.totalSeats} مقعد.`;
  }, [scarcity]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    const nav = windowRef.navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency ?? 8;
    const memory = nav.deviceMemory ?? 8;
    const isSmallScreen = windowRef.matchMedia?.("(max-width: 768px)")?.matches ?? false;
    setUseLiteVisuals(isSmallScreen || cores <= 4 || memory <= 4);
  }, []);

  useEffect(() => {
    if (landingViewedAt.current == null) {
      landingViewedAt.current = Date.now();
      recordFlowEvent("landing_viewed");
      trackEvent(AnalyticsEvents.LANDING_VIEW);
    }
  }, []);

  const handleStartJourney = useCallback(() => {
    didStartJourneyRef.current = true;
    const timeToAction = landingViewedAt.current ? Date.now() - landingViewedAt.current : undefined;
    try {
      recordFlowEvent("cta_free_clicked", { timeToAction, meta: { heroVariant, subtitleVariant } });
      recordFlowEvent("landing_clicked_start", { timeToAction, meta: { heroVariant, subtitleVariant } });
      trackEvent(AnalyticsEvents.CTA_CLICK, { timeToAction: timeToAction ?? 0 });
    } catch {
      // Never block the primary CTA on tracking failures.
    }
    onStartJourney();
  }, [heroVariant, onStartJourney, subtitleVariant]);

  const triggerPwaInstall = useCallback(() => {
    if (!pwaInstall || !canShowInstallButton) return;
    try {
      recordFlowEvent("install_clicked");
    } catch {
      // ignore tracking failures
    }
    if (pwaInstall.hasInstallPrompt) void pwaInstall.triggerInstall();
    else pwaInstall.showInstallHint();
  }, [canShowInstallButton, pwaInstall]);

  const navigateToCheckout = useCallback((source: "scarcity_meter" | "hero_checkout_cta" | "desktop_sticky_checkout") => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    if (!isPublicPaymentsEnabled) {
      handleStartJourney();
      return;
    }
    try {
      const timeToAction = landingViewedAt.current ? Date.now() - landingViewedAt.current : undefined;
      recordFlowEvent("cta_checkout_clicked", {
        timeToAction,
        meta: { source, heroVariant, checkoutCtaVariant, subtitleVariant }
      });
    } catch {
      // keep checkout navigation resilient even if tracking fails
    }
    windowRef.location.href = "/checkout";
  }, [checkoutCtaVariant, handleStartJourney, heroVariant, subtitleVariant]);

  const handleOpenCheckout = useCallback(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    const now = Date.now();
    if (now <= checkoutHintWindowUntilRef.current) {
      navigateToCheckout("scarcity_meter");
      return;
    }
    setShowCheckoutHint(true);
    checkoutHintWindowUntilRef.current = now + 5000;
    if (checkoutHintTimerRef.current != null) {
      windowRef.clearTimeout(checkoutHintTimerRef.current);
    }
    checkoutHintTimerRef.current = windowRef.setTimeout(() => {
      setShowCheckoutHint(false);
      checkoutHintWindowUntilRef.current = 0;
      checkoutHintTimerRef.current = null;
    }, 2200);
  }, [navigateToCheckout]);

  const handleCheckoutCta = useCallback(() => {
    navigateToCheckout("hero_checkout_cta");
  }, [navigateToCheckout]);

  const handleDesktopStickyCheckout = useCallback(() => {
    navigateToCheckout("desktop_sticky_checkout");
  }, [navigateToCheckout]);

  useEffect(() => {
    return () => {
      const windowRef = getWindowOrNull();
      if (!windowRef) return;
      if (checkoutHintTimerRef.current != null) {
        windowRef.clearTimeout(checkoutHintTimerRef.current);
      }
    };
  }, []);

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
      const timeoutId = setTimeout(() => setBadgePulse(false), 700);
      lastGoalRef.current = lastGoalLabel;
      return () => clearTimeout(timeoutId);
    }
    lastGoalRef.current = lastGoalLabel;
  }, [lastGoalLabel]);

  useEffect(() => {
    if (!ownerInstallRequestNonce) return;
    triggerPwaInstall();
    onOwnerInstallRequestHandled?.();
  }, [ownerInstallRequestNonce, onOwnerInstallRequestHandled, triggerPwaInstall]);

  useEffect(() => {
    let mounted = true;
    const loadHeroSignals = async () => {
      setIsPublicPulseLoading(true);
      try {
        const pulseResponse = await fetch("/api/public/pulse", { cache: "no-store" });
        const scarcityResponse = await fetch("/api/public/scarcity", { cache: "no-store" }).catch(() => null);
        const pulseData = (await pulseResponse.json()) as PublicPulsePayload;
        const scarcityData = scarcityResponse && scarcityResponse.ok
          ? ((await scarcityResponse.json()) as PublicScarcityPayload)
          : null;
        if (!mounted) return;
        if (
          pulseData?.is_live === true &&
          typeof pulseData?.global_phoenix_avg === "number" &&
          Number.isFinite(pulseData.global_phoenix_avg)
        ) {
          setPublicPulseAvg(pulseData.global_phoenix_avg);
        } else {
          setPublicPulseAvg(null);
        }
        const hasLiveScarcity =
          scarcityData?.is_live === true &&
          typeof scarcityData?.seats_left === "number" &&
          Number.isFinite(scarcityData.seats_left);
        const totalSeats =
          scarcityData && typeof scarcityData?.total_seats === "number" && Number.isFinite(scarcityData.total_seats)
            ? Number(scarcityData.total_seats)
            : null;
        setScarcity({
          isLive: hasLiveScarcity,
          seatsLeft: hasLiveScarcity ? Number(scarcityData.seats_left) : null,
          totalSeats,
          activePremium:
            hasLiveScarcity && typeof scarcityData?.active_premium === "number" && Number.isFinite(scarcityData.active_premium)
              ? Number(scarcityData.active_premium)
              : null,
          closesAt:
            hasLiveScarcity && typeof scarcityData?.closes_at === "string" && scarcityData.closes_at.trim()
              ? scarcityData.closes_at
              : null
        });
        setLastLiveUpdatedAt(Date.now());
      } catch {
        if (!mounted) return;
        setPublicPulseAvg(null);
        setScarcity({ isLive: false, seatsLeft: null, totalSeats: null, activePremium: null, closesAt: null });
        setLastLiveUpdatedAt(null);
      } finally {
        if (mounted) {
          setIsPublicPulseLoading(false);
        }
      }
    };
    void loadHeroSignals();
    return () => {
      mounted = false;
    };
  }, []);

  const openLegalPage = (path: "/privacy" | "/terms") => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    windowRef.history.pushState({ screen: "landing" }, "", path);
    windowRef.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="relative w-full min-h-screen" dir="rtl">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 25% 20%, rgba(167,139,250,0.14) 0%, transparent 52%), radial-gradient(ellipse at 75% 75%, rgba(45,212,191,0.12) 0%, transparent 58%), radial-gradient(ellipse at 45% 50%, rgba(125,211,252,0.1) 0%, transparent 65%), linear-gradient(120deg, #0f172a 0%, #11183a 42%, #06243b 100%)"
          }}
        />
        {showHeavyAmbientLayers && <FloatingParticles />}
        {!reduceMotion && <OrbitalRings />}
        {showHeavyAmbientLayers && <RadarSweep />}
      </div>

      <div className="relative z-10 w-full min-h-screen px-4 pt-8 sm:pt-10 pb-28 md:pb-16 overflow-x-hidden">
        <motion.section
          className="min-h-[88vh] flex flex-col items-center justify-center text-center max-w-5xl mx-auto"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp(reduceMotion)} className="mb-5">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-teal-300/50 bg-teal-500/20 shadow-[0_0_20px_rgba(45,212,191,0.22)]">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-300 animate-pulse" />
              <span className="text-xs font-black tracking-[0.18em] uppercase text-teal-100">
                جاهز للتفعيل
              </span>
            </div>
          </motion.div>

          <motion.div variants={item(reduceMotion)} className="mb-4 min-h-[50px] flex flex-col items-center justify-center">
            <div className="inline-flex h-[34px] items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 text-xs text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              {isPublicPulseLoading ? (
                <span className="inline-flex h-[14px] w-[17rem] items-center gap-2">
                  <span className="h-3.5 w-44 rounded bg-emerald-200/20 animate-pulse" />
                  <span className="h-3.5 w-14 rounded bg-emerald-200/20 animate-pulse" />
                </span>
              ) : (
                <span>
                  متوسط طاقة التعافي بالمنصة الآن: {publicPulseAvg == null ? "البيانات اللحظية غير متاحة" : `${publicPulseAvg.toFixed(1)}%`}.
                </span>
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-400/80">آخر تحديث: {formatLiveAge(lastLiveUpdatedAt)}</p>
          </motion.div>

          <motion.h1
            variants={fadeUp(reduceMotion)}
            className="text-[clamp(2.2rem,6vw,4.2rem)] font-black leading-tight tracking-tight mb-5"
          >
            <span className="block text-slate-100 mb-2">{heroTitle.line1}</span>
            <span className="text-teal-300">{heroTitle.line2}</span>
          </motion.h1>

          <motion.p
            variants={fadeUp(reduceMotion)}
            className="text-[clamp(1rem,2.1vw,1.35rem)] leading-[1.9] font-bold text-slate-300 max-w-[44ch] mb-9"
          >
            <EditableText
              id={subtitleVariant === "B" ? "landing_subtitle_variant_b" : "landing_subtitle"}
              defaultText={heroSubtitle}
              page="landing"
              editOnClick={false}
              showEditIcon={false}
            />
          </motion.p>

          <motion.ul variants={item(reduceMotion)} className="mb-7 flex flex-wrap items-center justify-center gap-2.5">
            {heroValuePoints.map((point) => (
              <li
                key={point}
                className="rounded-full border border-white/15 bg-slate-900/45 px-3 py-1 text-[11px] font-semibold text-slate-200/90"
              >
                {point}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={item(reduceMotion)} className="flex flex-col items-center">
            {scarcity.isLive && scarcityMeter && (
              <div className="mb-6 w-[min(22rem,92vw)] flex flex-col items-center justify-center">
                <motion.button
                  type="button"
                  variants={item(reduceMotion)}
                  onClick={handleOpenCheckout}
                  className="w-full text-right rounded-2xl px-4 py-3 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40"
                  aria-label="متابعة حجز المقعد"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[12px] font-black text-amber-200 uppercase tracking-wider">
                      تبقى {scarcityMeter.seatsLeft} مقعد فقط 🚨
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">
                      {scarcityMeter.seatsLeft}/{scarcityMeter.totalSeats}
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${scarcityMeter.fillPercent}%`,
                        backgroundColor: scarcityMeter.fillColor
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-300/85 font-semibold">
                    الفوج الحالي يغلق عند اكتمال المقاعد.
                  </p>
                  {scarcityCountdown && (
                    <p className="mt-1 text-[10px] font-black text-amber-200/95">{scarcityCountdown}</p>
                  )}
                </motion.button>
                <p
                  className={`mt-1 h-4 text-[10px] font-semibold transition-opacity ${showCheckoutHint ? "opacity-100 text-amber-200" : "opacity-0"
                    }`}
                >
                  سيتم فتح صفحة الحجز
                </p>
              </div>
            )}

            <motion.button
              type="button"
              onClick={handleStartJourney}
              className="group relative inline-flex items-center justify-center gap-3 rounded-full px-10 sm:px-14 py-5 text-[18px] sm:text-[20px] font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #2dd4bf 50%, #10b981 100%)",
                backgroundSize: "200% auto",
                color: "#fff",
                boxShadow: "0 0 0 1px rgba(45,212,191,0.3), 0 12px 40px rgba(16,185,129,0.35), 0 2px 4px rgba(0,0,0,0.2)"
              }}
              animate={{ backgroundPosition: ["0% center", "100% center", "0% center"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <div className="relative flex items-center gap-4">
                <span>{landingCopy.ctaJourney}</span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:-translate-x-1">
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </div>
            </motion.button>
            {isPublicPaymentsEnabled && (
              <button
                type="button"
                onClick={handleCheckoutCta}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/40 bg-amber-500/10 px-7 py-3 text-sm font-black text-amber-100 hover:bg-amber-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
              >
                {checkoutCtaLabel}
              </button>
            )}

            <p className="mt-4 text-[13px] font-bold text-slate-300/90 tracking-wide bg-white/5 border border-white/5 px-4 py-1 rounded-full">
              ابدأ مجانًا — بدون بطاقة.
            </p>
            <p className="mt-2 text-[10px] text-teal-400 font-black uppercase tracking-widest opacity-80">
              بياناتك تظل ملكك بالكامل.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowSimulationSection(true);
                  const el = document.getElementById('simulation-playground');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-black text-teal-200/90 hover:text-teal-100 underline underline-offset-8 decoration-teal-500/30 transition-all hover:decoration-teal-500"
              >
                [ شوف مثال حيّ للقوة التحليلية ]
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowExtendedMobileContent((prev) => !prev)}
              className="mt-2 text-xs font-semibold text-slate-300/85 hover:text-slate-200 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 rounded md:hidden"
            >
              {showExtendedMobileContent ? "إخفاء التفاصيل" : "اكتشف أكثر"}
            </button>

            <motion.div
              variants={fadeUp(reduceMotion)}
              className="mt-6 flex flex-col items-center gap-1 text-center"
            >
              <p className="text-[14px] sm:text-[16px] font-black text-teal-200/90 tracking-wide uppercase">
                {landingCopy.hook}
              </p>
            </motion.div>

            {canShowInstallButton && (
              <motion.button
                variants={item(reduceMotion)}
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  triggerPwaInstall();
                }}
                onMouseEnter={() => soundManager.playHover()}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-blue-400/35 bg-blue-500/10 px-5 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 transition-colors"
                aria-label="تثبيت التطبيق"
              >
                <Smartphone className="w-4 h-4" />
                تثبيت التطبيق
              </motion.button>
            )}
          </motion.div>
        </motion.section>

        <ProblemFirstSection
          stagger={stagger}
          item={item(reduceMotion)}
          data={landingCopy.problemSection}
          onShowExample={() => setShowSimulationSection(true)}
        />

        <div className={showLongSections ? "block" : "hidden md:block"}>
          {showSimulationSection && (
            <motion.section
              id="simulation-playground"
              className="phi-section w-full max-w-5xl mx-auto"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.div
                variants={fadeUp(reduceMotion)}
                className="rounded-[2.5rem] bg-teal-500/[0.03] border border-teal-500/15 p-8 sm:p-10 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/25 to-transparent" />
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  {hasExistingJourney ? "تحديث تمركزك الآن" : "جرب تثبيت حدودك الآن"}
                </h2>
                <p className="text-sm text-slate-400 mb-8">
                  {hasExistingJourney
                    ? "اسحب شخصًا وشوف بسرعة وضعه الحالي قبل قرارك التالي."
                    : "اسحب شخصًا للمدار المناسب لك لتشوف أثر القرار قبل ما تبدأ."}
                </p>
                <div className="scale-75 sm:scale-90 origin-center">
                  <LandingSimulation />
                </div>
              </motion.div>
            </motion.section>
          )}

          <FeatureShowcaseSection
            stagger={stagger}
            item={item(reduceMotion)}
            onOpenRadar={() => {
              soundManager.playClick();
              recordFlowEvent("feature_showcase_clicked", { meta: { feature: "radar" } });
              handleStartJourney();
            }}
            onOpenCourt={() => {
              soundManager.playClick();
              recordFlowEvent("feature_showcase_clicked", { meta: { feature: "guilt_court" } });
              handleStartJourney();
            }}
            onOpenPlaybooks={() => {
              soundManager.playClick();
              recordFlowEvent("feature_showcase_clicked", { meta: { feature: "playbooks" } });
              handleStartJourney();
            }}
          />

          <MetricsSection
            stagger={stagger}
            item={item(reduceMotion)}
            metricsState={landingLiveData.metrics}
            liveEnabled={designToggles.enableLiveLandingSections}
          />

          <HowItWorksSection
            stagger={stagger}
            item={item(reduceMotion)}
            data={landingCopy.howItWorks}
          />

          <FinalReadinessSection
            stagger={stagger}
            item={item(reduceMotion)}
            lastGoalLabel={lastGoalLabel}
            badgePulse={badgePulse}
            LastGoalIcon={lastGoalMeta?.icon}
          />

          <SystemOverclockSection
            stagger={stagger}
            item={item(reduceMotion)}
          />

          <motion.section
            className="phi-section flex flex-col items-center text-center"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.button
              variants={item(reduceMotion)}
              type="button"
              onClick={handleStartJourney}
              className="inline-flex items-center justify-center gap-3 rounded-full px-10 py-4 text-lg font-black text-white bg-teal-500 hover:bg-teal-400 transition-colors"
            >
              {landingCopy.ctaJourney}
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </motion.section>
        </div>

        <motion.footer
          className="pb-8 flex flex-col items-center gap-4 text-[13px]"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
            <a
              href="https://wa.me/0201023050092"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
            >
              تواصل معنا
            </a>
          </div>
          <div className="flex flex-col items-center gap-3 mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">تعهد الأمان</p>
            <div className="flex flex-col items-center gap-1.5">
              {landingCopy.trustPoints.map((point, idx) => (
                <p key={idx} className="text-[10px] text-slate-500 font-bold flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-teal-500/40" />
                  {point}
                </p>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-slate-600 font-mono tracking-widest">
            ALREHLA // ALPHA v0.1
          </span>
        </motion.footer>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
        <div className="mx-auto max-w-md rounded-2xl border border-teal-300/20 bg-slate-900/85 p-2.5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <button
            type="button"
            onClick={handleStartJourney}
            className="w-full rounded-xl bg-teal-500 py-3 text-sm font-black text-slate-950 hover:bg-teal-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60"
          >
            {landingCopy.ctaJourney}
          </button>
        </div>
      </div>

      {isPublicPaymentsEnabled && (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex">
          <button
            type="button"
            onClick={handleDesktopStickyCheckout}
            className="rounded-2xl border border-amber-300/35 bg-slate-900/85 px-4 py-3 text-sm font-black text-amber-100 hover:bg-slate-900 transition-colors shadow-[0_10px_26px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
          >
            {checkoutCtaLabel}
          </button>
        </div>
      )}
    </div>
  );
};
