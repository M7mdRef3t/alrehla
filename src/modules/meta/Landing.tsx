import type { FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Zap, Heart, Fingerprint, Activity, ShieldCheck, MessageCircle } from "lucide-react";
import { trackingService } from "@/domains/journey";
import { usePWAInstall } from "@/contexts/PWAInstallContext";
import { getLivePulseCount } from "@/services/pulseEngagement";
import { soundManager } from "@/services/soundManager";
import { LandingSimulation } from "./LandingSimulation";
import { useJourneyProgress } from "@/domains/journey";
import { useMapState } from '@/modules/map/dawayirIndex';
import { getGoalLabel, getLastGoalMeta } from "@/utils/goalLabel";
import { getGoalMeta } from "@/data/goalMeta";
import { LandingFooter } from "./landing/LandingFooter";
import { AmbientBackground } from "./landing/AmbientBackground";
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";
import { isUserMode } from "@/config/appEnv";
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

/* ─── Props ─────────────────────────────────────────────────────────── */

interface LandingProps {
  onStartJourney: () => void;
  onOpenSurvey?: () => void;
  ownerInstallRequestNonce?: number;
  onOwnerInstallRequestHandled?: () => void;
}

/* ─── Animation Variants (used by sections below the hero) ─────────────── */

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

  .landing-principles-label {
    font-family: var(--ds-font-prestige);
    color: var(--ds-color-primary);
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

  .landing-principles-copy,
  .landing-simulation-copy {
    color: var(--text-secondary);
    line-height: 1.8;
    text-align: justify;
    text-justify: inter-word;
  }

  .landing-feature-title {
    font-family: var(--ds-font-display);
    color: var(--ds-color-primary);
  }

  .landing-feature-desc,
  .landing-simulation-copy {
    text-align: justify;
    text-justify: inter-word;
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

  .landing-card-heading {
    font-family: var(--font-display);
  }

  .landing-card-accent-pill {
    border: 1px solid rgba(20,184,166,0.2);
    background: rgba(20,184,166,0.05);
    color: #5EEAD4;
  }

  .landing-final-cta {
    background: rgba(255,255,255,0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(20,184,166,0.2);
    box-shadow: 0 10px 40px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.1);
  }

  .landing-final-cta:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(20,184,166,0.4);
  }

  .landing-final-icon {
    width: 18px;
    height: 18px;
    color: var(--teal);
  }

  .landing-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.2), transparent);
  }

  @media (max-width: 1023px) {
    .landing-weather-entry,
    .landing-final-cta {
      backdrop-filter: blur(4px) !important;
      -webkit-backdrop-filter: blur(4px) !important;
    }
    .landing-root {
      /* Prevent horizontal bounce which can look like jitter */
      overflow-x: hidden;
    }
  }
`;


/* ─── Main Component ─────────────────────────────────────────────────────────── */

interface LandingPropsExtended {
  onStartJourney: () => void;
  onOpenSurvey?: () => void;
  ownerInstallRequestNonce?: number;
  onOwnerInstallRequestHandled?: () => void;
}

export const Landing: FC<LandingPropsExtended> = ({
  onStartJourney: _onStartJourney,
  onOpenSurvey: _onOpenSurvey,
  ownerInstallRequestNonce = 0,
  onOwnerInstallRequestHandled,
}) => {
  const storedMirrorName = useJourneyProgress().mirrorName;
  const nodesCount = useMapState((s) => s.nodes.length);
  const baselineCompletedAt = useJourneyProgress().baselineCompletedAt;
  const lastGoalId = useJourneyProgress().goalId;
  const lastGoalCategory = useJourneyProgress().category;
  const lastGoalById = useJourneyProgress().lastGoalById;
  const weatherPath = useAdminState((state) => {
    const path = getRelationshipWeatherPath(state.journeyPaths);
    return path?.isActive ? path : null;
  });
  const lastGoalRecord = getLastGoalMeta(lastGoalById, lastGoalId, lastGoalCategory);
  const lastGoalLabel = getGoalLabel(lastGoalRecord?.goalId);
  const lastGoalMeta = getGoalMeta(lastGoalRecord?.goalId);
  const hasExistingJourney = Boolean(baselineCompletedAt || nodesCount > 0);
  const weatherEntryHref = getRelationshipWeatherEntryHref(weatherPath);

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

  const showTestimonials = true;

  const lastNonceRef = useRef(0);

  const handleInstall = useCallback(() => {
    if (pwaInstall) {
      void pwaInstall.triggerInstall();
    } else if (typeof window !== "undefined") {
      window.alert('على Chrome أو Edge من الكمبيوتر: افتح قائمة المتصفح ثم اختر "Install app" أو "تثبيت التطبيق".');
    }
    onOwnerInstallRequestHandled?.();
    void trackingService.recordFlow("install_clicked");
  }, [pwaInstall, onOwnerInstallRequestHandled]);

  if (ownerInstallRequestNonce !== lastNonceRef.current && ownerInstallRequestNonce > 0) {
    lastNonceRef.current = ownerInstallRequestNonce;
    handleInstall();
  }

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
          window.location.assign("/onboarding");
        }
      }
    }, 1200);
  }, [mirrorName, hasExistingJourney, _onStartJourney]);

  return (
    <div
      className="landing-root relative min-h-screen w-full overflow-x-hidden"
      dir="rtl"
    >
      <style>{LANDING_STYLES}</style>
      <AmbientBackground 
        ambientBackground="var(--ds-color-space-void)" 
        showHeavyAmbientLayers={true} 
        reduceMotion={false} 
      />
      {/* ════ NEW HERO SECTION ════ */}
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

      <section className="relative py-28 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="glass-premium rounded-[48px] overflow-hidden p-10 sm:p-20 text-center relative"
        >
          {/* Ambient section glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-teal-500/10 blur-[120px] pointer-events-none" />

          <div className="mb-16 relative z-10">
            <p className="text-[10px] font-black tracking-[0.5em] uppercase mb-6 text-teal-500 opacity-80">
              نظام التشغيل — Operating System
            </p>
            <h2 className="text-4xl sm:text-6xl font-black mb-8 landing-principles-title tracking-tight text-white">
              إحنا مش بنخمّن.<br /><span className="text-teal-400">إحنا بنحلل الـ Logic.</span>
            </h2>
            <p className="text-base sm:text-xl max-w-[55ch] mx-auto text-slate-400 leading-relaxed font-medium">
              "الرحلة" بتوفرلك نظام تشغيل لوعيك بيشوف علاقاتك كداوئر طاقة ومسارات تدفق. مفيش أحكام عاطفية، فيه بيانات منطقية بتساعدك تسترد سيادتك على حياتك.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-right relative z-10" dir="rtl">
            {[
              { 
                title: "رصد الاستنزاف", 
                desc: "تحديد النقط اللي طاقتك بتتسرب منها بدقة جراحية وتوقف النزيف فوراً.", 
                icon: <Fingerprint className="w-8 h-8 text-teal-400" />,
                accent: "rgba(45, 212, 191, 0.15)"
              },
              { 
                title: "خرائط النبض", 
                desc: "رسم بياني حي لتدفق الطاقة في كل دائرة؛ مين بيزودك ومين بيسحب منك.", 
                icon: <Activity className="w-8 h-8 text-sky-400" />,
                accent: "rgba(56, 189, 248, 0.15)"
              },
              { 
                title: "تحصين الحدود", 
                desc: "أدوات عملية لبناء جدار حماية لسلامك النفسي وسيادتك على قرارك.", 
                icon: <ShieldCheck className="w-8 h-8 text-indigo-400" />,
                accent: "rgba(129, 140, 248, 0.15)"
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group p-10 rounded-[32px] border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg"
                  style={{ backgroundColor: f.accent }}
                >
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 text-white group-hover:text-teal-300 transition-colors">{f.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed font-medium group-hover:text-slate-400 transition-colors">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

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
            <p className="text-sm sm:text-base max-w-[38ch] mx-auto landing-simulation-copy">
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

      <section className="relative py-20 px-5 max-w-3xl mx-auto text-center">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="landing-card-panel rounded-3xl p-10 sm:p-14"
        >
          <motion.div variants={fadeUp} className="text-4xl mb-5">🌟</motion.div>
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl font-black mb-4 landing-card-heading"
          >
            الوضوح موجود — هو بس محتاج خريطة.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-sm leading-loose max-w-[40ch] mx-auto mb-8"
          >
            بدون تسجيل. بدون حكم. بدون ضغط.
            بس خطوة واحدة تقول فيها: "جاهز أشوف الحقيقة."
          </motion.p>

          <motion.div variants={stagger} className="flex flex-wrap justify-center gap-2 mb-8">
            {["بدون تسجيل", "بياناتك ليك", "مش بنحكم", "مفيش إشعارات زيادة"].map((t) => (
              <motion.span
                key={t}
                variants={fadeIn}
                className="text-xs font-semibold px-3 py-1.5 rounded-full landing-card-accent-pill"
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
            className="landing-final-cta group inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-black text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A1A]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            اسمح للرحلة بالبدء
            <ArrowLeft className="landing-final-icon transition-transform group-hover:-translate-x-1" />
          </motion.button>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-8 mt-8" aria-hidden="true">
        <div className="landing-divider" />
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
