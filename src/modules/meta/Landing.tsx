import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Shield, 
  Zap, 
  Heart, 
  Fingerprint, 
  Activity, 
  ShieldCheck, 
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
import { useAdminState } from "@/domains/admin/store/admin.store";
import {
  getRelationshipWeatherEntryHref,
  getRelationshipWeatherPath
} from "@/utils/relationshipWeatherJourney";
import { runtimeEnv } from "@/config/runtimeEnv";
import { normalizeWhatsAppPhone } from "@/utils/phoneNumber";
import { openInNewTab } from "@/services/clientDom";

const DEFAULT_WHATSAPP_CONTACT = "201062635923";

// Modular Sections
import { 
  HowItWorksSection 
} from "./landing/LandingSections";

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

  const weatherEntryHref = getRelationshipWeatherEntryHref();

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
          void trackingService.recordFlow("journey_started_frictionless");
          window.location.assign("/sanctuary");
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

      {/* 1. HERO SECTION */}
      <HeroSection
        onStartJourney={handleStart}
        mirrorName={mirrorName}
        setMirrorName={setMirrorName}
        pulseCount={1947}
        trustPoints={["توازن", "تشتت", "استنزاف"]}
        ctaJourney={landingCopy.ctaJourney}
        secondaryCta={landingCopy.secondaryCta}
      />

      <div className="landing-intrinsic-sentinel" />

      {/* 2. VALUE PROPOSITIONS — 3 Cards */}
      <section className="relative py-24 px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            ليه <span className="text-teal-400">الرحلة</span> مختلفة؟
          </h2>
          <p className="text-base text-slate-500 max-w-[45ch] mx-auto">
            مش نصايح عامة. بيانات حقيقية عن علاقاتك — تشوفها وتقرر.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" dir="rtl">
          {[
            { 
              title: "شوف مين بيسحب طاقتك", 
              desc: "خريطة بصرية توريك تدفق الطاقة في كل علاقة — مين بيزودك ومين بيستنزفك.", 
              icon: <Fingerprint className="w-7 h-7 text-teal-400" />,
              accent: "rgba(45, 212, 191, 0.12)"
            },
            { 
              title: "افهم نمطك الحقيقي", 
              desc: "تحليل ذكي لأنماطك المتكررة في العلاقات — والنقط العمياء اللي مش شايفها.", 
              icon: <Activity className="w-7 h-7 text-sky-400" />,
              accent: "rgba(56, 189, 248, 0.12)"
            },
            { 
              title: "احمي حدودك بوضوح", 
              desc: "أدوات عملية تساعدك تبني جدار حماية لسلامك النفسي وقراراتك.", 
              icon: <ShieldCheck className="w-7 h-7 text-indigo-400" />,
              accent: "rgba(129, 140, 248, 0.12)"
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                style={{ backgroundColor: f.accent }}
              >
                {f.icon}
              </div>
              <h3 className="text-xl font-black mb-3 text-white group-hover:text-teal-300 transition-colors">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium group-hover:text-slate-400 transition-colors">{f.desc}</p>
            </motion.div>
          ))}
        </div>
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
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3 landing-simulation-label">
              المُحاكي — Simulation
            </p>
            <h2 className="text-2xl sm:text-4xl font-black mb-3 landing-simulation-title">
              صمم مسارك الداخلي
            </h2>
            <p className="text-sm sm:text-base max-w-[38ch] mx-auto text-slate-400 leading-relaxed">
              ٣ أسئلة بسيطة — بدون تفكير — وهتكشف النمط اللي ماسك دماغك دلوقتي.
            </p>
          </div>
          <LandingSimulation />
          <motion.div variants={fadeUp} className="mt-10 flex justify-center">
            <a
              href={weatherEntryHref}
              className="landing-weather-entry group inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300"
            >
              <span className="landing-weather-dot" />
              قيّم طقس علاقاتك (Weather Check)
              <span className="transition-transform duration-300 group-hover:translate-x-[-4px]">←</span>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* 4. HOW IT WORKS */}
      <HowItWorksSection
        stagger={stagger}
        item={fadeUp}
        data={landingCopy.howItWorks}
      />

      {/* FINAL CALL TO ACTION */}
      <section className="relative py-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-6xl font-black text-white mb-8">جاهز تشوف خريطتك؟</h2>
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

      {/* FLOATING WHATSAPP */}
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
