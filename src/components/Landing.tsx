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
  TestimonialsSection,
  FinalReadinessSection
} from "./landing/LandingSections";
import { useLandingLiveData } from "../architecture/landingLiveData";

interface LandingProps {
  onStartJourney: () => void;
  onRestartJourney?: () => void;
  ownerInstallRequestNonce?: number;
  onOwnerInstallRequestHandled?: () => void;
}

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

const FloatingParticles: FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 22 + 18,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.32 + 0.08,
        color:
          i % 3 === 0
            ? "rgba(45,212,191,"
            : i % 3 === 1
              ? "rgba(167,139,250,"
              : "rgba(125,211,252,"
      })),
    []
  );

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: `${particle.color}${particle.opacity})`,
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}${particle.opacity * 0.5})`
          }}
          animate={{
            y: [0, -28, 8, -16, 0],
            x: [0, 12, -8, 4, 0],
            opacity: [particle.opacity, particle.opacity * 1.4, particle.opacity * 0.75, particle.opacity]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

const OrbitalRings: FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const rings = [
    { size: 320, border: "rgba(45,212,191,0.08)", duration: 46 },
    { size: 480, border: "rgba(167,139,250,0.07)", duration: 62 },
    { size: 640, border: "rgba(125,211,252,0.06)", duration: 84 }
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rings.map((ring, idx) => (
        <motion.div
          key={ring.size}
          className="absolute rounded-full border border-dashed"
          style={{
            width: ring.size,
            height: ring.size,
            borderColor: ring.border
          }}
          animate={shouldReduceMotion ? {} : { rotate: idx % 2 === 0 ? 360 : -360 }}
          transition={{ duration: ring.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
};

export const Landing: FC<LandingProps> = ({
  onStartJourney,
  onRestartJourney,
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
  const landingLiveData = useLandingLiveData(landingCopy.testimonials ?? []);

  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const lastGoalRef = useRef<string | null>(lastGoalLabel ?? null);
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

  const handleStartJourney = useCallback(() => {
    didStartJourneyRef.current = true;
    const timeToAction = landingViewedAt.current ? Date.now() - landingViewedAt.current : undefined;
    try {
      recordFlowEvent("landing_clicked_start", { timeToAction });
    } catch {
      // Never block the primary CTA on tracking failures.
    }
    onStartJourney();
  }, [onStartJourney]);

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
        {!reduceMotion && <FloatingParticles />}
        {!reduceMotion && <OrbitalRings />}
      </div>

      <div className="relative z-10 w-full min-h-screen px-4 pt-8 sm:pt-10 pb-16 overflow-x-hidden">
        <motion.section
          className="min-h-[88vh] flex flex-col items-center justify-center text-center max-w-5xl mx-auto"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {canShowInstallButton && (
            <motion.button
              variants={item(reduceMotion)}
              type="button"
              onClick={() => {
                soundManager.playClick();
                triggerPwaInstall();
              }}
              onMouseEnter={() => soundManager.playHover()}
              className="mb-8 inline-flex items-center gap-2 rounded-xl border border-blue-400/35 bg-blue-500/10 px-5 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/20 transition-colors"
              aria-label="تثبيت التطبيق"
            >
              <Smartphone className="w-4 h-4" />
              تثبيت التطبيق
            </motion.button>
          )}

          <motion.div variants={fadeUp(reduceMotion)} className="mb-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-teal-300">
                {hasExistingJourney ? "مركز القيادة نشط" : "استعداد للانطلاق"}
              </span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp(reduceMotion)}
            className="text-[clamp(2.2rem,6vw,4.2rem)] font-black leading-tight tracking-tight mb-5"
          >
            <span className="block text-slate-100 mb-2">مهمتنا الأساسية</span>
            <span className="bg-gradient-to-r from-teal-300 via-indigo-300 to-rose-400 text-transparent bg-clip-text">
              {landingCopy.titleLine2}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp(reduceMotion)}
            className="text-[clamp(1rem,2.1vw,1.35rem)] leading-[1.9] font-bold text-slate-300 max-w-[44ch] mb-9"
          >
            {landingCopy.subtitle}
          </motion.p>

          <motion.div variants={item(reduceMotion)} className="flex flex-col items-center">
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
                <EditableText
                  id="landing_cta_journey"
                  defaultText="ابدأ الرادار فورًا"
                  page="landing"
                  editOnClick={false}
                  showEditIcon={false}
                />
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:-translate-x-1">
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </div>
            </motion.button>

            <p className="mt-4 text-[12px] font-bold tracking-wider text-teal-300/80 uppercase">
              نظام استعادة السيادة الرقمية
            </p>

            {hasExistingJourney && onRestartJourney && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    setShowRestartConfirm(true);
                  }}
                  onMouseEnter={() => soundManager.playHover()}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold opacity-70 hover:opacity-100 transition-all border border-amber-400/25 bg-amber-400/5 text-amber-200"
                >
                  <Target className="w-3.5 h-3.5" />
                  إعادة تعيين المسار
                </button>
                <p className="text-[10px] text-amber-200/45">لا يحذف بياناتك الحالية</p>
              </div>
            )}
          </motion.div>
        </motion.section>

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

        <FeatureShowcaseSection
          stagger={stagger}
          item={item(reduceMotion)}
          onOpenRadar={() => {
            soundManager.playClick();
            handleStartJourney();
          }}
          onOpenCourt={() => {
            soundManager.playClick();
            handleStartJourney();
          }}
          onOpenPlaybooks={() => {
            soundManager.playClick();
            handleStartJourney();
          }}
        />

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
            ابدأ الرادار فورًا
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </motion.section>

        <motion.footer
          className="pb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]"
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
    </div>
  );
};
