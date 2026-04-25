import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { 
  ArrowLeft, 
  Shield, 
  Zap, 
  Heart, 
  Fingerprint, 
  Activity, 
  ShieldCheck, 
  Zap as Sparkles
} from "lucide-react";
import dynamic from "next/dynamic";
import { trackingService } from "@/domains/journey";
import { usePWAInstall } from "@/contexts/PWAInstallContext";
import { soundManager } from "@/services/soundManager";
import { useJourneyProgress } from "@/domains/journey";
import { useMapState } from '@/modules/map/dawayirIndex';
import { getGoalLabel, getLastGoalMeta } from "@/utils/goalLabel";
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";
import { landingCopy } from "@/copy/landing";
import { HeroSection } from "./HeroSection";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { useAuthState } from "@/domains/auth/store/auth.store";


// Dynamic Imports for Performance
const LandingSimulation = dynamic(() => import("./LandingSimulation").then(mod => mod.LandingSimulation), { ssr: false });
import { PlatformFooter } from "./PlatformFooter";
const AmbientBackground = dynamic(() => import("./landing/AmbientBackground").then(mod => mod.AmbientBackground), { ssr: false });

const ProblemFirstSection = dynamic(() => import("./landing/LandingSections").then(mod => mod.ProblemFirstSection), { ssr: true });
const FeatureShowcaseSection = dynamic(() => import("./landing/LandingSections").then(mod => mod.FeatureShowcaseSection), { ssr: true });
const HowItWorksSection = dynamic(() => import("./landing/LandingSections").then(mod => mod.HowItWorksSection), { ssr: true });
const MetricsSection = dynamic(() => import("./landing/LandingSections").then(mod => mod.MetricsSection), { ssr: false });
const SystemOverclockSection = dynamic(() => import("./landing/LandingSections").then(mod => mod.SystemOverclockSection), { ssr: true });
const StoriesSection = dynamic(() => import("./landing/LandingSections").then(mod => mod.StoriesSection), { ssr: false });
const FinalReadinessSection = dynamic(() => import("./landing/LandingSections").then(mod => mod.FinalReadinessSection), { ssr: true });
import {
  getRelationshipWeatherEntryHref,
  getRelationshipWeatherPath
} from "@/utils/relationshipWeatherJourney";
import { runtimeEnv } from "@/config/runtimeEnv";
import { openInNewTab } from "@/services/clientDom";


// ... existing utility imports ...

/* ─── Animation Variants ─────────────────────────────────────────────────── */

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

const LANDING_STYLES = `
  .landing-root {
    font-family: var(--font-sans);
    background: transparent;
  }

  .glass-premium {
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .phi-section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 6rem 1.5rem;
    position: relative;
    z-index: 10;
  }

  .landing-principles-title,
  .landing-simulation-title {
    font-family: var(--ds-font-display);
    color: var(--text-primary);
    line-height: 1.1;
  }

  .landing-simulation-label {
    font-family: var(--ds-font-prestige);
    color: var(--ds-color-accent-indigo);
  }

  .landing-weather-entry {
    border: 1px solid rgba(20,184,166,0.25);
    background: rgba(20,184,166,0.06);
    color: #2dd4bf;
    backdrop-filter: blur(12px);
  }

  .landing-weather-entry:hover {
    background: rgba(20,184,166,0.12);
    border-color: rgba(20,184,166,0.45);
  }

  .landing-weather-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #14b8a6;
    box-shadow: 0 0 8px #14b8a6;
    display: inline-block;
    flex-shrink: 0;
  }

  .landing-card-panel {
    border: 1px solid rgba(20,184,166,0.18);
    background: radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.07) 0%, transparent 65%);
  }

  @media (max-width: 1023px) {
    .landing-weather-entry {
      backdrop-filter: blur(4px) !important;
      -webkit-backdrop-filter: blur(4px) !important;
    }
    .landing-root {
      overflow-x: hidden;
    }
  }
`;


/* ─── Main Component ─────────────────────────────────────────────────────────── */

interface LandingProps {
  onStartJourney: () => void;
  onNavigate?: (screen: string) => void;
  onOpenSurvey?: () => void;
  ownerInstallRequestNonce?: number;
  onOwnerInstallRequestHandled?: () => void;
}

export const Landing: FC<LandingProps> = ({
  onStartJourney: _onStartJourney,
  onNavigate,
  ownerInstallRequestNonce = 0,
  onOwnerInstallRequestHandled,
}) => {
  const storedMirrorName = useJourneyProgress().mirrorName;
  const nodesCount = useMapState((s) => s.nodes.length);
  const baselineCompletedAt = useJourneyProgress().baselineCompletedAt;
  const isLoggedIn = !!useAuthState((s) => s.user);

  const lastGoalId = useJourneyProgress().goalId;
  const lastGoalCategory = useJourneyProgress().category;
  const lastGoalById = useJourneyProgress().lastGoalById;
  
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const hasExistingJourney = Boolean(baselineCompletedAt || nodesCount > 0);
  const journeyPaths = useAdminState((s) => s.journeyPaths);
  const weatherPath = useMemo(() => getRelationshipWeatherPath(journeyPaths), [journeyPaths]);
  const weatherEntryHref = getRelationshipWeatherEntryHref(weatherPath);

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
          void trackingService.recordFlow("journey_started_frictionless");
          if (onNavigate) {
            onNavigate("sanctuary");
          } else {
            window.sessionStorage.setItem("dawayir-app-boot-action", "navigate:sanctuary");
            window.location.reload();
          }
        }
      }
    }, 1200);
  }, [mirrorName, hasExistingJourney, _onStartJourney, onNavigate]);

  const isMobile = useIsMobile();


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
        showHeavyAmbientLayers={!isMobile}
        reduceMotion={isMobile}
      />

      {/* 1. HERO SECTION */}
      <HeroSection
        onStartJourney={handleStart}
        mirrorName={mirrorName}
        setMirrorName={setMirrorName}
        pulseCount={1947}
        trustPoints={["توازن", "تشتت", "استنزاف"]}
        ctaJourney={hasExistingJourney ? "العودة للخريطة" : landingCopy.ctaJourney}
        secondaryCta={landingCopy.secondaryCta}
        hideCta={isLoggedIn || hasExistingJourney}

      />

      <div className="landing-intrinsic-sentinel" />

      {/* 2. TRAVELER'S ARSENAL SECTION (Journey Philosophy) */}
      <section className="relative py-28 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="glass-premium rounded-[48px] overflow-hidden p-10 sm:p-20 text-center relative group/arsenal"
        >
          {/* Ambient Breathing Background */}
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.15, 0.1],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-full bg-gradient-to-b from-teal-500/10 to-indigo-500/5 blur-[120px] pointer-events-none" 
          />

          <div className="mb-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-teal-500 opacity-80" />
              <p className="text-[10px] font-black tracking-[0.5em] uppercase text-teal-500 opacity-80 m-0 leading-none">
                عُدَّة المَسَافِر
              </p>
              <Sparkles className="w-4 h-4 text-teal-500 opacity-80" />
            </motion.div>
            <h2 className="text-4xl sm:text-6xl font-black mb-8 landing-principles-title tracking-tight !text-white leading-tight">
              لا تمشِ في الظلام.<br />
              <span className="inline-block mt-4 sm:mt-6 text-teal-400 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-sky-300">نحن نضيء لك خريطة طاقتك.</span>
            </h2>
            <p className="text-base sm:text-xl max-w-[55ch] mx-auto text-slate-300 leading-relaxed font-medium">
              "الرحلة" ليست مجرد منصة، هي بوصلتك وعدستك لرؤية ما خفي عنك. نكشف لك مسارات طاقتك، من يمنحك النور، ومن يسحب منك الحياة، لتسترد قيادتك على مسارك.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-right relative z-10" dir="rtl">
            {[
              { 
                title: "كشف الثقوب السوداء", 
                desc: "نضيء لك الأماكن الخفية التي تتسرب منها طاقة حياتك، لتوقف النزيف قبل أن تفقد شغفك.", 
                icon: <Fingerprint className="w-8 h-8 text-teal-300 relative z-10" />,
                bgIcon: <Fingerprint className="w-24 h-24 text-teal-500/10 absolute -right-4 -bottom-4 group-hover/card:scale-110 transition-transform duration-700" />,
                accent: "rgba(45, 212, 191, 0.15)",
                glow: "group-hover/card:shadow-[0_0_40px_rgba(45,212,191,0.15)]",
                borderGlow: "group-hover/card:border-teal-500/30"
              },
              { 
                title: "رادار الطاقة والنبض", 
                desc: "رسم حي لنبض علاقاتك؛ ترى بوضوح من يمدك بالحياة ومن يطفئ نورك في كل دائرة.", 
                icon: <Activity className="w-8 h-8 text-sky-300 relative z-10" />,
                bgIcon: <Activity className="w-24 h-24 text-sky-500/10 absolute -right-4 -bottom-4 group-hover/card:scale-110 transition-transform duration-700" />,
                accent: "rgba(56, 189, 248, 0.15)",
                glow: "group-hover/card:shadow-[0_0_40px_rgba(56,189,248,0.15)]",
                borderGlow: "group-hover/card:border-sky-500/30"
              },
              { 
                title: "درع القيادة والحماية", 
                desc: "عُدّة مسافر متكاملة لبناء أسوار حصينة تحمي سلامك النفسي وتضمن قيادتك الكاملة على قرارك.", 
                icon: <ShieldCheck className="w-8 h-8 text-indigo-300 relative z-10" />,
                bgIcon: <ShieldCheck className="w-24 h-24 text-indigo-500/10 absolute -right-4 -bottom-4 group-hover/card:scale-110 transition-transform duration-700" />,
                accent: "rgba(129, 140, 248, 0.15)",
                glow: "group-hover/card:shadow-[0_0_40px_rgba(129,140,248,0.15)]",
                borderGlow: "group-hover/card:border-indigo-500/30"
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.15, duration: 0.6, ease: "easeOut" }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group/card p-10 rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-md transition-all duration-500 relative overflow-hidden ${f.glow} ${f.borderGlow}`}
              >
                {/* Background oversized icon for cinematic depth */}
                {f.bgIcon}
                
                {/* Subtle radial gradient that follows hover (simulated via CSS opacity on hover) */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/[0.03] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                <motion.div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 relative"
                  style={{ backgroundColor: f.accent }}
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Inner pulse ring */}
                  <motion.div 
                    className="absolute inset-0 rounded-2xl border border-white/20"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  {f.icon}
                </motion.div>
                
                <h3 className="text-2xl font-black mb-4 text-white group-hover/card:text-teal-300 transition-colors duration-300 relative z-10">{f.title}</h3>
                <p className="text-base text-slate-400 leading-relaxed font-medium group-hover/card:text-slate-300 transition-colors duration-300 relative z-10">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 3. SIMULATION SECTION */}
      <section className="relative py-20 px-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-3 h-3 text-indigo-400 opacity-80" />
              <p className="text-xs font-bold tracking-[0.25em] uppercase landing-simulation-label m-0 leading-none text-indigo-400">
                مِرْآة الوَعْي
              </p>
              <Sparkles className="w-3 h-3 text-indigo-400 opacity-80" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-4 landing-simulation-title !text-white leading-tight">
              أين تقف في رحلتك الآن؟
            </h2>
            <p className="text-base sm:text-lg max-w-[42ch] mx-auto text-slate-300 leading-relaxed">
              ٣ إشارات صامتة تكشف لك ما يعيق تقدمك ويسحب طاقتك في هذه المحطة.
            </p>
          </div>
          <LandingSimulation />
          <motion.div variants={fadeUp} className="mt-10 flex justify-center">
            <a
              href={weatherEntryHref}
              className="landing-weather-entry group inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300"
            >
              <span className="landing-weather-dot" />
              تفقد طقس علاقاتك
              <span className="transition-transform duration-300 group-hover:translate-x-[-4px]">←</span>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. SYSTEM OVERCLOCK — Restored for System Architects */}
      <SystemOverclockSection 
        stagger={stagger} 
        item={fadeUp} 
      />

      {/* 5. METRICS — Proof of Traction */}
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

      {/* 6. HOW IT WORKS */}
      <HowItWorksSection
        stagger={stagger}
        item={fadeUp}
        data={landingCopy.howItWorks}
      />

      {/* 7. STORIES — Social Proof */}
      <StoriesSection
        stagger={stagger}
        item={fadeUp}
      />

      {/* 8. FINAL READINESS */}
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
          <h2 className="text-4xl sm:text-6xl font-black text-white mb-8">جاهز تسترد قيادتك؟</h2>
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

      <PlatformFooter
        trustPoints={landingCopy.trustPoints}
        stagger={stagger}
        onOpenLegal={(path) => {
          if (typeof window !== "undefined") window.open(path, "_blank", "noopener,noreferrer");
        }}
      />

      {/* GLOBAL WHATSAPP MOVED TO SURFACE */}
    </div>
  );
};
