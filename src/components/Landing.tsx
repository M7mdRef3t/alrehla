import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Smartphone } from "lucide-react";
import { recordFlowEvent } from "../services/journeyTracking";
import { usePWAInstall } from "../contexts/PWAInstallContext";
import { landingCopy } from "../copy/landing";
import { soundManager } from "../services/soundManager";
import { useJourneyState } from "../state/journeyState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import { EditableText } from "./EditableText";
import { getDocumentOrNull, getWindowOrNull } from "../services/clientRuntime";
import { getDocumentVisibilityState } from "../services/clientDom";
import {
  MetricsSection,
  HowItWorksSection,
  ProblemFirstSection,
  FinalReadinessSection
} from "./landing/LandingSections";
import { trackEvent, AnalyticsEvents } from "../services/analytics";
import { useLandingLiveData } from "../architecture/landingLiveData";
import { isPublicPaymentsEnabled } from "../config/payments";
import { useABTestingVariant } from "../hooks/useABTestingVariant";
import { designToggles } from "../config/designToggles";
import { Badge, Button, Card, Input } from "./UI";
import { captureMarketingLead } from "../services/marketingLeadService";
import { landingHeroVariants } from "../data/marketingContent";
import { getStoredUtmParams } from "../services/marketingAttribution";

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
const MARKETING_HERO_VARIANT_KEY = "landing.marketing_hero_variant";
const MARKETING_HERO_VARIANT_STARTED_AT_KEY = "landing.marketing_hero_variant_started_at";

const formatLiveAge = (updatedAt: number | null): string => {
  if (!updatedAt) return "ØºØ± ØªØ§Ø­";
  const deltaMs = Math.max(0, Date.now() - updatedAt);
  if (deltaMs < 60_000) return "Ø§Ø¢";
  if (deltaMs < 3_600_000) return `Ø° ${Math.floor(deltaMs / 60_000)} Ø¯Ø©`;
  return `Ø° ${Math.floor(deltaMs / 3_600_000)} Ø³Ø§Ø¹Ø©`;
};

const formatCountdown = (isoDate: string | null): string | null => {
  if (!isoDate) return null;
  const endsAt = new Date(isoDate).getTime();
  if (!Number.isFinite(endsAt)) return null;
  const remainingMs = Math.max(0, endsAt - Date.now());
  if (remainingMs === 0) return "Ø£ÙØº Ø¨Ø§Ø¨ Ø§ÙØ¬ Ø§Ø­Ø§.";
  const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (hours < 24) return `Øª Ø®Ø§ ${hours} Ø³Ø§Ø¹Ø©`;
  const days = Math.ceil(hours / 24);
  return `Øª Ø®Ø§ ${days} `;
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
  const lastGoalId = useJourneyState((s) => s.goalId);
  const lastGoalCategory = useJourneyState((s) => s.category);
  const lastGoalById = useJourneyState((s) => s.lastGoalById);
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const lastGoalMeta = getGoalMeta(lastGoalRecord?.goalId);
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
  const marketingHeroVariant = useABTestingVariant(MARKETING_HERO_VARIANT_KEY, MARKETING_HERO_VARIANT_STARTED_AT_KEY);
  const [showCheckoutHint, setShowCheckoutHint] = useState(false);
  const [quickIntent, setQuickIntent] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState<string | null>(null);
  const [leadBusy, setLeadBusy] = useState(false);
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
  const checkoutCtaLabel = checkoutCtaVariant === "B" ? "ÙØ¹ Ø±Ø­Ø© 21 " : "Ø§Ø­Ø¬Ø² Ø¹Ø¯ Ø§Ø¢";
  const marketingHero = landingHeroVariants[marketingHeroVariant];
  const heroTitle = {
    line1: marketingHero.headlineLine1,
    line2: marketingHero.headlineLine2
  };
  const heroSubtitle =
    subtitleVariant === "B"
      ? "Ø¶Ø¹ Ø´Øª Ø¹ Ø§Ø®Ø±Ø·Ø© Ø§ . Ø§ØªØ´Ø®Øµ Ø§ØµØ§Ø¯ Ø£ØµØ± Ø·Ø± ØªØ¹Ø§Ù Ø§ÙØ¹."
      : marketingHero.subtitle;
  const heroValuePoints = useMemo(
    () => ["Ø®Ø±Ø·Ø© Ø¹ Ø­Ø¸Ø©", "ØªØ­ Ø¹ Ø¨Ø§ Ø¶Ø¶Ø§Ø¡", "Ø®ØµØµØª Ø­ÙØ¸Ø© Ø¨Ø§Ø§"],
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
    if (typeof scarcity.totalSeats !== "number" || scarcity.totalSeats <= 0) return `ÙØ¹ Ø§Ø¢: ${scarcity.activePremium} Ø³ØªØ®Ø¯.`;
    return `ÙØ¹ Ø§Ø¢: ${scarcity.activePremium}/${scarcity.totalSeats} Ø¹Ø¯.`;
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

  useEffect(() => {
    recordFlowEvent("landing_ab_assigned", {
      meta: {
        heroVariant,
        subtitleVariant,
        marketingHeroVariant
      }
    });
  }, [heroVariant, subtitleVariant, marketingHeroVariant]);

  const handleStartJourney = useCallback(() => {
    didStartJourneyRef.current = true;
    const timeToAction = landingViewedAt.current ? Date.now() - landingViewedAt.current : undefined;
    try {
      recordFlowEvent("cta_free_clicked", { timeToAction, meta: { heroVariant, subtitleVariant } });
      recordFlowEvent("landing_clicked_start", {
        timeToAction,
        meta: {
          heroVariant,
          subtitleVariant,
          marketingHeroVariant,
          quickIntentProvided: quickIntent.trim().length > 0,
          quickIntentLength: quickIntent.trim().length
        }
      });
      trackEvent(AnalyticsEvents.CTA_CLICK, { timeToAction: timeToAction ?? 0 });
    } catch {
      // Never block the primary CTA on tracking failures.
    }
    onStartJourney();
  }, [heroVariant, marketingHeroVariant, onStartJourney, quickIntent, subtitleVariant]);

  const handleCaptureLead = useCallback(async () => {
    const email = leadEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLeadStatus("Ø§ÙƒØªØ¨ Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØµØ­ÙŠØ­.");
      return;
    }

    setLeadBusy(true);
    setLeadStatus(null);
    const ok = await captureMarketingLead(email, quickIntent);
    setLeadBusy(false);

    if (!ok) {
      setLeadStatus("ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¢Ù†. Ø­Ø§ÙˆÙ„ Ù„Ø§Ø­Ù‚Ù‹Ø§.");
      return;
    }

    trackEvent("lead_captured", { source: "landing" });
    recordFlowEvent("cta_free_clicked", {
      meta: {
        leadCaptured: true,
        emailDomain: email.split("@")[1] ?? null,
        utm: getStoredUtmParams()
      }
    });
    setLeadStatus("ØªÙ… Ø­ÙØ¸ Ø¨Ø±ÙŠØ¯Ùƒ. Ø³Ù†Ø±Ø³Ù„ Ù„Ùƒ Ø®Ø·Ø© Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©.");
    setLeadEmail("");
  }, [leadEmail, quickIntent]);

  const handleShareLanding = useCallback(async () => {
    const shareText = "Ø£Ù†Øª Ù„Ø§ ØªØ­ØªØ§Ø¬ Ø¹Ù„Ø§Ø¬Ù‹Ø§. ØªØ­ØªØ§Ø¬ ÙˆØ¶ÙˆØ­Ù‹Ø§. Ø¬Ø±Ù‘Ø¨ Ø§Ù„Ø±Ø­Ù„Ø© Ø§Ù„Ø¢Ù†.";
    const shareData = {
      title: "Ø§Ù„Ø±Ø­Ù„Ø©",
      text: shareText,
      url: typeof window !== "undefined" ? window.location.href : undefined
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n${shareData.url ?? ""}`);
      }
      recordFlowEvent("feature_showcase_clicked", { meta: { feature: "landing_share" } });
    } catch {
      // Keep UX non-blocking.
    }
  }, []);

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
    <main className="relative w-full min-h-screen" dir="rtl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none focus:ring-2 focus:ring-teal-300"
      >
        تخطَّ إلى المحتوى الرئيسي
      </a>
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

      <div id="main-content" className="relative z-10 w-full min-h-screen px-4 pt-8 sm:pt-10 pb-28 md:pb-16 overflow-x-hidden">
        <motion.section
          className="min-h-[88vh] flex flex-col items-center justify-center text-center max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp(reduceMotion)} className="hidden mb-5">
            <Badge className="inline-flex items-center gap-2 px-5 py-2 border-teal-300/50 bg-teal-500/20 shadow-[0_0_20px_rgba(45,212,191,0.22)]">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-300 animate-pulse" />
              <span className="text-sm font-black tracking-[0.18em] uppercase text-teal-100">
                Ø¬Ø§Ø² ØªÙØ¹
              </span>
            </Badge>
          </motion.div>

          <motion.div variants={item(reduceMotion)} className="hidden mb-4 min-h-[50px] flex flex-col items-center justify-center">
            <div className="inline-flex h-[34px] items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 text-sm text-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              {isPublicPulseLoading ? (
                <span className="inline-flex h-[14px] w-[17rem] items-center gap-2">
                  <span className="h-3.5 w-44 rounded bg-emerald-200/20 animate-pulse" />
                  <span className="h-3.5 w-14 rounded bg-emerald-200/20 animate-pulse" />
                </span>
              ) : (
                <span>
                  ØªØ³Ø· Ø·Ø§Ø© Ø§ØªØ¹Ø§Ù Ø¨Ø§ØµØ© Ø§Ø¢: {publicPulseAvg == null ? "Ø§Ø¨Ø§Ø§Øª Ø§Ø­Ø¸Ø© ØºØ± ØªØ§Ø­Ø©" : `${publicPulseAvg.toFixed(1)}%`}.
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-200">Ø¢Ø®Ø± ØªØ­Ø¯Ø«: {formatLiveAge(lastLiveUpdatedAt)}</p>
          </motion.div>

          <motion.h1
            variants={fadeUp(reduceMotion)}
            className="text-[clamp(2.2rem,6vw,4.2rem)] font-black leading-tight tracking-tight mb-5"
          >
            <span className="block text-slate-100 mb-2">{heroTitle.line1}</span>
            <span className="text-[var(--soft-teal)]">{heroTitle.line2}</span>
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

          <motion.div variants={item(reduceMotion)} className="mb-6 flex flex-col items-center gap-3">
            <Button
              onClick={handleStartJourney}
              variant="primary"
              size="lg"
              className="group relative overflow-hidden px-10 sm:px-14 py-5 text-[18px] sm:text-[20px] font-black text-[var(--space-deep)] focus-visible:ring-amber-300/40"
            >
              <div className="relative flex items-center gap-4">
                <span>{marketingHero.cta}</span>
                <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-transform group-hover:-translate-x-1">
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </div>
            </Button>
            <p className="text-sm font-semibold text-slate-200">Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¢Ù† Ø¨Ø¯ÙˆÙ† Ø¨Ø·Ø§Ù‚Ø©. Ø®ØµÙˆØµÙŠØªÙƒ Ù…Ø­ÙÙˆØ¸Ø© Ø¨Ø§Ù„ÙƒØ§Ù…Ù„.</p>
          </motion.div>

          <motion.ul variants={item(reduceMotion)} className="hidden mb-7 flex flex-wrap items-center justify-center gap-2.5">
            {heroValuePoints.map((point) => (
              <li
                key={point}
                className="rounded-full border border-white/15 bg-slate-900/45 px-3 py-1 text-sm font-semibold text-slate-200/90"
              >
                {point}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={item(reduceMotion)} className="hidden flex flex-col items-center">
            {scarcity.isLive && scarcityMeter && (
              <Card className="mb-6 w-[min(22rem,92vw)] flex flex-col items-center justify-center rounded-2xl p-3 bg-white/[0.03] border-white/10">
                <motion.button
                  type="button"
                  variants={item(reduceMotion)}
                  onClick={handleOpenCheckout}
                  className="w-full text-right rounded-2xl px-4 py-3 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
                  aria-label="ØªØ§Ø¨Ø¹Ø© Ø­Ø¬Ø² Ø§Ø¹Ø¯"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[12px] font-black text-amber-200 uppercase tracking-wider">
                      ØªØ¨ {scarcityMeter.seatsLeft} Ø¹Ø¯ ÙØ·
                    </div>
                    <div className="text-sm font-bold text-slate-200">
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
                  <p className="mt-1.5 text-sm text-slate-200 font-semibold">
                    Ø§ÙØ¬ Ø§Ø­Ø§ Øº Ø¹Ø¯ Ø§ØªØ§ Ø§Ø§Ø¹Ø¯.
                  </p>
                  {scarcityCountdown && (
                    <p className="mt-1 text-sm font-black text-amber-100">{scarcityCountdown}</p>
                  )}
                </motion.button>
                <p
                  className={`mt-1 h-4 text-sm font-semibold transition-opacity ${showCheckoutHint ? "opacity-100 text-amber-100" : "opacity-0"
                    }`}
                >
                  Ø³Øª ÙØªØ­ ØµÙØ­Ø© Ø§Ø­Ø¬Ø²
                </p>
              </Card>
            )}
            <Card className="mb-5 w-[min(38rem,92vw)] p-3 rounded-2xl border-white/10 bg-white/[0.03]">
              <label htmlFor="intent-note" className="mb-2 block text-sm font-bold text-slate-300">
                Ø¨Ø¬Ø© Ø§Ø­Ø¯Ø© (Ø§Ø®ØªØ§Ø±): Ø§ Ø£Ø«Ø± Ø´Ø¡ Ø³ØªØ²Ù Ø§Ø¢
              </label>
              <Input
                id="intent-note"
                value={quickIntent}
                onChange={(event) => setQuickIntent(event.target.value)}
                placeholder="Ø«Ø§: Ø³Ø¡ ØªØ§Ø² Ø§Ø¹Ø§Ø§Øª Ø§Ø§Ø±Ø§ Ø§."
                maxLength={140}
                className="text-sm"
              />
            </Card>
            <Card className="mb-5 w-[min(38rem,92vw)] p-3 rounded-2xl border-white/10 bg-white/[0.03]">
              <label htmlFor="lead-email-hero" className="mb-2 block text-sm font-bold text-slate-300">
                Ø®Ù„ÙŠÙƒ Ø£ÙˆÙ„ Ù…Ù† ÙŠØ³ØªÙ„Ù… Ø®Ø§Ø±Ø·Ø© Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="lead-email-hero"
                  type="email"
                  value={leadEmail}
                  onChange={(event) => setLeadEmail(event.target.value)}
                  placeholder="name@email.com"
                  className="text-sm"
                />
                <Button
                  type="button"
                  onClick={() => void handleCaptureLead()}
                  disabled={leadBusy}
                  data-testid="capture-lead-button-hero"
                  variant="secondary"
                  size="md"
                  className="whitespace-nowrap border-teal-400/30 bg-teal-500/15 text-teal-100 hover:bg-teal-500/25"
                >
                  {leadBusy ? "Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸..." : "Ø§Ø­Ø¬Ø² Ù…ÙƒØ§Ù†Ùƒ"}
                </Button>
              </div>
              {leadStatus ? <p data-testid="lead-status-hero" className="mt-2 text-sm text-slate-200">{leadStatus}</p> : null}
            </Card>

            <Button
              onClick={handleStartJourney}
              variant="primary"
              size="lg"
              className="group relative overflow-hidden px-10 sm:px-14 py-5 text-[18px] sm:text-[20px] font-black text-[var(--space-deep)] focus-visible:ring-amber-300/40"
            >
              <div className="relative flex items-center gap-4">
                <span>{marketingHero.cta}</span>
                <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-transform group-hover:-translate-x-1">
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </div>
            </Button>
            {isPublicPaymentsEnabled && (
              <Button
                onClick={handleCheckoutCta}
                variant="secondary"
                size="md"
                className="mt-3 border-amber-300/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 focus-visible:ring-amber-300/50"
              >
                {checkoutCtaLabel}
              </Button>
            )}

            <p className="mt-4 text-[13px] font-bold text-slate-300/90 tracking-wide bg-white/5 border border-white/5 px-4 py-1 rounded-full">
              Ø§Ø¨Ø¯Ø£ Ø¬Ø§Ø§  Ø¨Ø¯ Ø¨Ø·Ø§Ø©.
            </p>
            <p className="mt-2 text-sm text-[var(--soft-teal)] font-black uppercase tracking-widest opacity-90">
              Ø¨Ø§Ø§Øª ØªØ¸  Ø¨Ø§Ø§.
            </p>
            <Button
              type="button"
              onClick={() => void handleShareLanding()}
              variant="ghost"
              size="sm"
              className="mt-3 text-sm font-semibold text-slate-200 hover:text-white"
            >
              شارك الصفحة مع شخص يحتاج وضوحًا
            </Button>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Button
                type="button"
                onClick={() => {
                  handleStartJourney();
                }}
                variant="ghost"
                size="sm"
                className="text-sm font-black text-[var(--soft-teal)] hover:text-[var(--soft-teal)]/80"
              >
                ابدأ الآن
              </Button>
            </div>

            <motion.div
              variants={fadeUp(reduceMotion)}
              className="mt-6 flex flex-col items-center gap-1 text-center"
            >
              <p className="text-[14px] sm:text-[16px] font-black text-[var(--soft-teal)]/90 tracking-wide uppercase">
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
                aria-label="ØªØ«Ø¨Øª Ø§ØªØ·Ø¨"
              >
                <Smartphone className="w-4 h-4" />
                ØªØ«Ø¨Øª Ø§ØªØ·Ø¨
              </motion.button>
            )}
          </motion.div>
        </motion.section>

        <ProblemFirstSection
          stagger={stagger}
          item={item(reduceMotion)}
          data={landingCopy.problemSection}
          onShowExample={handleStartJourney}
        />

        <motion.section
          className="phi-section w-full max-w-3xl mx-auto"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <motion.div variants={item(reduceMotion)} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <h3 className="text-xl font-black text-white mb-2">Ø®Ø·ÙˆØ© Ø§Ø®ØªÙŠØ§Ø±ÙŠØ© Ù‚Ø¨Ù„ Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©</h3>
            <p className="text-sm text-slate-300 mb-4">
              Ø§ØªØ±Ùƒ Ø¨Ø±ÙŠØ¯Ùƒ Ù„Ù†Ø±Ø³Ù„ Ù„Ùƒ Ø®Ø·Ø© Ø¨Ø¯Ø§ÙŠØ© Ù…Ø®ØªØµØ±Ø© Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø©.
            </p>

            <label htmlFor="lead-email" className="mb-2 block text-sm font-semibold text-slate-200">
              Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="lead-email"
                type="email"
                value={leadEmail}
                onChange={(event) => setLeadEmail(event.target.value)}
                placeholder="name@email.com"
                className="text-sm"
              />
              <Button
                type="button"
                onClick={() => void handleCaptureLead()}
                disabled={leadBusy}
                data-testid="capture-lead-button"
                variant="secondary"
                size="md"
                className="whitespace-nowrap border-teal-400/30 bg-teal-500/15 text-teal-100 hover:bg-teal-500/25"
              >
                {leadBusy ? "Ø¬Ø§Ø±Ù Ø§Ù„Ø­ÙØ¸..." : "Ø§Ø­Ø¬Ø² Ù…ÙƒØ§Ù†Ùƒ"}
              </Button>
            </div>
            {leadStatus ? (
              <p data-testid="lead-status" className="mt-2 text-sm text-slate-200">
                {leadStatus}
              </p>
            ) : null}

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                id="intent-note"
                value={quickIntent}
                onChange={(event) => setQuickIntent(event.target.value)}
                placeholder="Ø§Ø®ØªÙŠØ§Ø±ÙŠ: Ù…Ø§ Ø£ÙƒØ«Ø± Ø´ÙŠØ¡ ÙŠØ³ØªÙ†Ø²ÙÙƒ Ø§Ù„Ø¢Ù†ØŸ"
                maxLength={140}
                className="text-sm sm:col-span-2"
              />
              {isPublicPaymentsEnabled && (
                <Button
                  onClick={handleCheckoutCta}
                  variant="secondary"
                  size="md"
                  className="border-amber-300/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 focus-visible:ring-amber-300/50"
                >
                  {checkoutCtaLabel}
                </Button>
              )}
              <Button
                type="button"
                onClick={() => {
                  handleStartJourney();
                }}
                variant="ghost"
                size="md"
                className="text-slate-200 hover:text-white"
              >
                Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¢Ù†
              </Button>
            </div>
          </motion.div>
        </motion.section>

        <div>
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

          <motion.section
            className="phi-section flex flex-col items-center text-center"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={item(reduceMotion)}>
              <Button
                type="button"
                onClick={handleStartJourney}
                variant="primary"
                size="lg"
                className="inline-flex items-center justify-center gap-3 px-10 py-4 text-lg font-black text-slate-950 hover:bg-amber-400 transition-colors"
              >
                {marketingHero.cta}
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </motion.div>
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
            <Button
              type="button"
              onClick={() => openLegalPage("/privacy")}
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-[var(--soft-teal)]"
            >
              Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©
            </Button>
            <Button
              type="button"
              onClick={() => openLegalPage("/terms")}
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-[var(--soft-teal)]"
            >
              Ø´Ø±ÙˆØ· Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…
            </Button>
            <a
              href="https://wa.me/0201023050092"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-[var(--ds-color-brand-teal-400)] transition-colors underline underline-offset-2"
            >
              ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§
            </a>
          </div>
          <div className="flex flex-col items-center gap-3 mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest mb-1">ØªØ¹Ù‡Ø¯Ø§Øª Ø§Ù„Ø«Ù‚Ø©</p>
            <div className="flex flex-col items-center gap-1.5">
              {landingCopy.trustPoints.map((point, idx) => (
                <p key={idx} className="text-sm text-slate-200 font-bold flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-teal-500/40" />
                  {point}
                </p>
              ))}
            </div>
          </div>
          <span className="text-sm text-slate-400 font-mono tracking-widest">
            ALREHLA // ALPHA v0.1
          </span>
        </motion.footer>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden">
        <div className="mx-auto max-w-md rounded-2xl border border-teal-300/20 bg-slate-900/85 p-2.5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <Button
            onClick={handleStartJourney}
            variant="primary"
            size="lg"
            className="w-full rounded-xl text-sm font-black text-slate-950 hover:bg-amber-400 focus-visible:ring-amber-300/60"
          >
            {marketingHero.cta}
          </Button>
        </div>
      </div>

      {isPublicPaymentsEnabled && (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex">
          <Button
            onClick={handleDesktopStickyCheckout}
            variant="secondary"
            size="md"
            className="rounded-2xl border-amber-300/35 bg-slate-900/85 text-sm font-black text-amber-100 hover:bg-slate-900 shadow-[0_10px_26px_rgba(0,0,0,0.35)] focus-visible:ring-amber-300/50"
          >
            {checkoutCtaLabel}
          </Button>
        </div>
      )}
    </main>
  );
};

