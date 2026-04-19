import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MessageCircle 
} from "lucide-react";
import { trackingService } from "@/domains/journey";
import { usePWAInstall } from "@/contexts/PWAInstallContext";
import { soundManager } from "@/services/soundManager";
import { LandingSimulation } from "./LandingSimulation";
import { useJourneyProgress } from "@/domains/journey";
import { useMapState } from '@/modules/map/dawayirIndex';
import { getGoalLabel, getLastGoalMeta } from "@/utils/goalLabel";
import { LandingFooter } from "./landing/LandingFooter";
import { AmbientBackground } from "./landing/AmbientBackground";
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";
import { landingCopy } from "@/copy/landing";
import { HeroSection } from "./HeroSection";
import { runtimeEnv } from "@/config/runtimeEnv";
import { normalizeWhatsAppPhone } from "@/utils/phoneNumber";
import { openInNewTab } from "@/services/clientDom";

// Modular Sections
import { 
  ProblemFirstSection, 
  FeatureShowcaseSection, 
  HowItWorksSection, 
  MetricsSection, 
  SystemOverclockSection,
  FinalReadinessSection
} from "./landing/LandingSections";

const DEFAULT_WHATSAPP_CONTACT = "201110795932";

/* ─── Animation Variants ─────────────────────────────────────────────────── */

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)", 
    transition: { duration: 0.8, ease } 
  }
};

const stagger = {
  hidden: {},
  visible: { 
    transition: { 
      staggerChildren: 0.2, 
      delayChildren: 0.1 
    } 
  }
};

const LANDING_STYLES = `
  .phi-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 6rem 1.5rem;
    position: relative;
    z-index: 10;
  }

  .glass-premium {
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .organic-tap:active {
    transform: scale(0.96);
  }

  /* Fix for smooth scrolling on all devices */
  html {
    scroll-behavior: smooth;
  }
`;

/* ─── Main Component ─────────────────────────────────────────────────────────── */

interface LandingProps {
  onStartJourney: () => void;
  onOpenSurvey?: () => void;
  ownerInstallRequestNonce?: number;
  onOwnerInstallRequestHandled?: () => void;
}

export const Landing: FC<LandingProps> = ({
  onStartJourney: _onStartJourney,
  ownerInstallRequestNonce = 0,
  onOwnerInstallRequestHandled,
}) => {
  const storedMirrorName = useJourneyProgress().mirrorName;
  const nodesCount = useMapState((s) => s.nodes.length);
  const baselineCompletedAt = useJourneyProgress().baselineCompletedAt;
  const lastGoalId = useJourneyProgress().goalId;
  const lastGoalCategory = useJourneyProgress().category;
  const lastGoalById = useJourneyProgress().lastGoalById;
  
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const hasExistingJourney = Boolean(baselineCompletedAt || nodesCount > 0);

  const whatsAppNumber = runtimeEnv.whatsappContactNumber || DEFAULT_WHATSAPP_CONTACT;
  const whatsAppLink = useMemo(() => {
    const normalized = normalizeWhatsAppPhone(whatsAppNumber);
    if (!normalized) return null;
    return `https://wa.me/${normalized}`;
  }, [whatsAppNumber]);

  const openWhatsAppChat = (placement: "landing_floating_fab") => {
    if (!whatsAppLink) return;
    analyticsService.whatsapp({ placement });
    openInNewTab(whatsAppLink);
  };

  const pwaInstall = usePWAInstall();
  const [mirrorName, setMirrorName] = useState(storedMirrorName ?? "");
  const landingViewTrackedRef = useRef(false);
  const startTrackedRef = useRef(false);

  const setStoreMirrorName = useJourneyProgress().setMirrorName;
  const syncLockRef = useRef(false);

  // Sync LOCAL -> STORE
  useEffect(() => {
    if (syncLockRef.current) {
      syncLockRef.current = false;
      return;
    }
    if (storedMirrorName !== mirrorName) {
      setStoreMirrorName(mirrorName);
    }
  }, [mirrorName]);

  // Sync STORE -> LOCAL
  useEffect(() => {
    const nextName = storedMirrorName ?? "";
    if (nextName !== mirrorName) {
      syncLockRef.current = true;
      setMirrorName(nextName);
    }
  }, [storedMirrorName]);

  useEffect(() => {
    if (landingViewTrackedRef.current) return;
    landingViewTrackedRef.current = true;
    void trackingService.recordFlow("landing_viewed");
    void analyticsService.track(AnalyticsEvents.LANDING_VIEW, {
      pwa_status: pwaInstall?.canShowInstallButton === false ? "pwa" : "browser",
      device: pwaInstall?.isIOS ? "ios" : pwaInstall?.isAndroid ? "android" : "desktop",
    });
  }, [pwaInstall]);

  const handleStart = useCallback(() => {
    if (startTrackedRef.current) return;
    startTrackedRef.current = true;

    void trackingService.recordFlow("landing_clicked_start");
    analyticsService.cta({
      source: "landing",
      cta_name: "start_journey",
      placement: mirrorName ? "mirror_named" : "default"
    });
    
    soundManager.playEffect("cosmic_pulse");
    
    setTimeout(() => {
      if (typeof window !== "undefined") {
        if (hasExistingJourney) {
          _onStartJourney();
        } else {
          void trackingService.recordFlow("journey_started_frictionless" as any);
          try {
            const nextUrl = new URL(getHref());
            nextUrl.pathname = "/onboarding";
            nextUrl.search = "";
            pushUrl(nextUrl);
          } catch {
            window.location.assign("/onboarding");
          }
        }
      }
    }, 1200);
  }, [mirrorName, hasExistingJourney, _onStartJourney]);

  const lastNonceRef = useRef(0);
  useEffect(() => {
    if (ownerInstallRequestNonce !== lastNonceRef.current && ownerInstallRequestNonce > 0) {
      lastNonceRef.current = ownerInstallRequestNonce;
      if (pwaInstall) {
        void pwaInstall.triggerInstall();
      }
      onOwnerInstallRequestHandled?.();
    }
  }, [ownerInstallRequestNonce, pwaInstall, onOwnerInstallRequestHandled]);

  return (
    <div
      className="landing-root relative min-h-screen w-full overflow-x-hidden bg-[#02040a]"
      dir="rtl"
    >
      <style>{LANDING_STYLES}</style>
      
      <AmbientBackground 
        ambientBackground="var(--ds-color-space-void)" 
        showHeavyAmbientLayers={true}
        reduceMotion={false}
      />

      {/* 1. HERO SECTION — The Cinematic Sovereignty Entry */}
      <HeroSection
        onStartJourney={handleStart}
        mirrorName={mirrorName}
        setMirrorName={setMirrorName}
        pulseCount={2147}
        trustPoints={["تحليل منطقي", "خصوصية كاملة", "بدون تسجيل"]}
        ctaJourney={landingCopy.ctaJourney}
        secondaryCta="استكشف الأدوات"
      />

      <div className="landing-intrinsic-sentinel" />

      {/* 2. PROBLEM SECTION — Why are you here? */}
      <ProblemFirstSection 
        stagger={stagger} 
        item={fadeUp} 
        data={landingCopy.problemSection}
        onShowExample={() => document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* 3. FEATURE SHOWCASE — The Radar and Tools */}
      <FeatureShowcaseSection 
        stagger={stagger} 
        item={fadeUp} 
        onOpenRadar={handleStart}
        onOpenCourt={handleStart}
      />

      {/* 4. SIMULATION — The Interactive Heart */}
      <section id="simulation" className="phi-section">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="text-center mb-12">
            <motion.p variants={fadeUp} className="text-xs font-black tracking-[0.4em] uppercase mb-4 text-indigo-400">
              المُحاكي — The Simulation
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-5xl font-black mb-6 text-white leading-tight">
              صمم مسارك <span className="text-indigo-400">الداخلي</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base sm:text-lg max-w-[42ch] mx-auto text-slate-400 leading-relaxed">
              ٣ أسئلة بسيطة — بدون تفكير — وهتكشف النمط اللي ماسك دماغك دلوقتي وتجسده في خوارزمية بصرية.
            </motion.p>
          </div>
          
          <div className="glass-premium rounded-[40px] p-6 sm:p-12 border-indigo-500/10">
            <LandingSimulation />
          </div>
        </motion.div>
      </section>

      {/* 5. SYSTEM OVERCLOCK — Under the Hood for System Architects */}
      <SystemOverclockSection 
        stagger={stagger} 
        item={fadeUp} 
      />

      {/* 6. HOW IT WORKS — The Practical Path */}
      <HowItWorksSection
        stagger={stagger}
        item={fadeUp}
        data={landingCopy.howItWorks}
      />

      {/* 7. METRICS — Proof of Traction */}
      <MetricsSection 
        stagger={stagger} 
        item={fadeUp} 
        metricsState={{
          data: {
            activeUnits30d: 1472,
            retentionRate30d: 84,
            activity24h: 312
          },
          isLoading: false,
          lastUpdatedAt: Date.now(),
          mode: "fallback"
        }}
        liveEnabled={false}
      />

      {/* 8. FINAL READINESS — The Departure Gate */}
      <FinalReadinessSection 
        stagger={stagger} 
        item={fadeUp}
        lastGoalLabel={lastGoalLabel}
      />

      {/* FINAL CALL TO ACTION */}
      <section className="relative py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-6xl font-black text-white mb-8">جاهز تسترد سيادتك؟</h2>
          <motion.button
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center gap-4 px-12 py-6 bg-white text-black rounded-2xl font-black text-xl shadow-[0_0_50px_rgba(255,255,255,0.2)]"
          >
            اسمح للرحلة بالبدء
            <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-2" />
          </motion.button>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-8 mb-12">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <LandingFooter
        trustPoints={landingCopy.trustPoints}
        stagger={stagger}
        onOpenLegal={(path) => {
          if (typeof window !== "undefined") window.open(path, "_blank", "noopener,noreferrer");
        }}
      />

      {/* ───── FLOATING WHATSAPP ───── */}
      {whatsAppLink && (
        <motion.button
          type="button"
          title="تواصل عبر واتساب"
          onClick={() => openWhatsAppChat("landing_floating_fab")}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.9 }}
          className="fixed z-[100] left-6 bottom-8 w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/10 hover:bg-emerald-500 transition-colors"
        >
          <MessageCircle className="w-6 h-6 shrink-0" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </motion.button>
      )}
    </div>
  );
};
