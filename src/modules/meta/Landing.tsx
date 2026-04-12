import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Zap, Heart } from "lucide-react";
import { trackingService } from "@/domains/journey";
import { usePWAInstall } from "@/contexts/PWAInstallContext";
import { getLivePulseCount } from "@/services/pulseEngagement";
import { soundManager } from "@/services/soundManager";
import { LandingSimulation } from "./LandingSimulation";
import { useJourneyProgress } from "@/domains/journey";
import { useMapState } from "@/domains/dawayir/store/map.store";
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
  const [pulseCount, setPulseCount] = useState(getLivePulseCount());
  const landingViewTrackedRef = useRef(false);
  const startTrackedRef = useRef(false);

  const setStoreMirrorName = useJourneyProgress().setMirrorName;

  useEffect(() => {
    if (storedMirrorName !== mirrorName) {
      setStoreMirrorName(mirrorName);
    }
  }, [mirrorName, storedMirrorName, setStoreMirrorName]);

  useEffect(() => {
    const nextName = storedMirrorName ?? "";
    if (nextName && nextName.trim() !== mirrorName.trim()) {
      setMirrorName(nextName);
    }
  }, [storedMirrorName, mirrorName]);

  useEffect(() => {
    let timeoutId: number | null = null;

    const scheduleNextUpdate = () => {
      const now = new Date();
      const msUntilNextMinute = Math.max(1000, (60 - now.getSeconds()) * 1000 - now.getMilliseconds());

      timeoutId = window.setTimeout(() => {
        setPulseCount(getLivePulseCount());
        scheduleNextUpdate();
      }, msUntilNextMinute);
    };

    scheduleNextUpdate();

    return () => {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isUserMode || landingViewTrackedRef.current) return;
    landingViewTrackedRef.current = true;
    analyticsService.trackLanding({
      entry_variant: "default"
    });
  }, []);

  const handleStart = useCallback(() => {
    if (startTrackedRef.current) return;
    startTrackedRef.current = true;

    void trackingService.recordFlow("landing_clicked_start");
    analyticsService.track(AnalyticsEvents.CTA_CLICK, {
      source: "landing",
      cta_name: "start_journey",
      intent: mirrorName ? "mirror_named" : "default"
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
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ fontFamily: "var(--font-sans)", background: "transparent" }}
      dir="rtl"
    >
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
        pulseCount={pulseCount}
        trustPoints={landingCopy.trustPoints}
        ctaJourney={landingCopy.ctaJourney}
        secondaryCta={landingCopy.secondaryCta}
      />

      <div style={{ contentVisibility: "auto", containIntrinsicSize: "1px 2600px" }} />

      <section className="relative py-28 px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="glass-premium rounded-[32px] overflow-hidden p-10 sm:p-20 text-center"
        >
          <div className="mb-12">
            <p className="text-xs font-black tracking-[0.4em] uppercase mb-4" style={{ fontFamily: "var(--ds-font-prestige)", color: "var(--ds-color-primary)" }}>
              المبادئ الأولى — First Principles
            </p>
            <h2 className="text-3xl sm:text-5xl font-black mb-6" style={{ fontFamily: "var(--ds-font-display)", color: "var(--text-primary)", lineHeight: 1.1 }}>
              إحنا مش بنخمّن.<br />إحنا بنحلل الـ Logic.
            </h2>
            <p className="text-base sm:text-lg max-w-[50ch] mx-auto" style={{ color: "var(--text-secondary)", lineHeight: 1.8, textAlign: "justify", textJustify: "inter-word" }}>
              الرحلة بتستخدم "نظام تشغيل سيادي" بيشوف علاقاتك كداوئر طاقة ومسارات تدفق. مفيش أحكام، بس فيه بيانات بتساعدك تاخد قراراتك من مركز قوتك.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-right" dir="rtl">
            {[
              { title: "رصد الاستنزاف", desc: "تحديد النقط اللي طاقتك بتتسرب منها بدقة جراحية.", icon: "⚡" },
              { title: "خرائط النبض", desc: "رسم بياني حقيقي لمين بيزودك ومين بيسحب منك.", icon: "📈" },
              { title: "تحصين الحدود", desc: "أدوات عملية لبناء جدار حماية لسلامك النفسي.", icon: "🛡️" }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-8 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-black mb-2" style={{ fontFamily: "var(--ds-font-display)", color: "var(--ds-color-primary)" }}>{f.title}</h3>
                <p className="text-sm opacity-70 leading-relaxed" style={{ textAlign: "justify", textJustify: "inter-word" }}>{f.desc}</p>
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
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-3" style={{ fontFamily: "var(--ds-font-prestige)", color: "var(--ds-color-accent-indigo)" }}>
              المُحاكي — Simulation
            </p>
            <h2 className="text-2xl sm:text-4xl font-black mb-3" style={{ fontFamily: "var(--ds-font-display)", color: "var(--text-primary)" }}>
              صمم مسارك الداخلي
            </h2>
            <p className="text-sm sm:text-base max-w-[38ch] mx-auto" style={{ color: "var(--text-secondary)", textAlign: "justify", textJustify: "inter-word", textAlignLast: "center" }}>
              ٣ أسئلة بسيطة — بدون تفكير — وهتكشف النمط اللي ماسك دماغك دلوقتي.
            </p>
          </div>
          <LandingSimulation />
          <motion.div variants={fadeUp} className="mt-10 flex justify-center">
            <a
              href={weatherEntryHref}
              className="group inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300"
              style={{
                border: "1px solid rgba(20,184,166,0.25)",
                background: "rgba(20,184,166,0.06)",
                color: "#2dd4bf",
                backdropFilter: "blur(12px)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(20,184,166,0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(20,184,166,0.45)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(20,184,166,0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(20,184,166,0.25)";
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#14b8a6", boxShadow: "0 0 8px #14b8a6", display: "inline-block", flexShrink: 0 }} />
              قيّم طقس علاقاتك
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
             style={{ fontFamily: "var(--font-display)" }}
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

          <motion.div variants={stagger} className="flex flex-wrap justify-center gap-2 mb-8">
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
            style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(20,184,166,0.2)", boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.1)" }}
            whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.06)", borderColor: "rgba(20,184,166,0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            اسمح للرحلة بالبدء
            <ArrowLeft style={{ width: 18, height: 18, color: "#14B8A6" }} className="transition-transform group-hover:-translate-x-1" />
          </motion.button>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-8 mt-8" aria-hidden="true">
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--page-border), transparent)" }} />
      </div>

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
