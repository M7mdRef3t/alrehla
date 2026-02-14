import type { FC } from "react";
import { useEffect, useRef, useState, useMemo } from "react";
import { recordFlowEvent } from "../services/journeyTracking";
import { motion, useReducedMotion } from "framer-motion";
import {
  Star, ArrowLeft, Sparkles, Heart, Compass, Map, Orbit, Quote,
  Zap, Users, TrendingUp, Smartphone
} from "lucide-react";
import { usePWAInstall } from "../contexts/PWAInstallContext";
import { landingCopy } from "../copy/landing";
import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import type { FeatureFlagKey } from "../config/features";
import { EditableText } from "./EditableText";

/* ══════════════════════════════════════════
   LANDING — Dawayir
   ══════════════════════════════════════════ */

interface LandingProps {
  onStartJourney: () => void;
  onOpenTools?: () => void;
  showTopToolsButton?: boolean;
  showPostStartContent?: boolean;
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

/* ── reusable card style ── */
const CARD = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1.25rem",
} as const;

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
  onOpenTools: _onOpenTools,
  showTopToolsButton: _showTopToolsButton = true,
  showPostStartContent = true,
  showToolsSection: _showToolsSection = true,
  onFeatureLocked: _onFeatureLocked,
  availableFeatures: _availableFeatures,
  ownerInstallRequestNonce = 0,
  onOwnerInstallRequestHandled
}) => {
  const nodesCount = useMapState((s) => s.nodes.length);
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
  const landingViewedAt = useRef<number | null>(null);
  const didStartJourneyRef = useRef(false);
  const didTrackLandingClosedRef = useRef(false);
  const pwaInstall = usePWAInstall();

  useEffect(() => {
    if (landingViewedAt.current == null) {
      landingViewedAt.current = Date.now();
      recordFlowEvent("landing_viewed");
    }
  }, []);

  const handleStartJourney = () => {
    didStartJourneyRef.current = true;
    const timeToAction = landingViewedAt.current ? Date.now() - landingViewedAt.current : undefined;
    recordFlowEvent("landing_clicked_start", { timeToAction });
    onStartJourney();
  };

  useEffect(() => {
    const trackLandingClosedOnce = () => {
      if (didStartJourneyRef.current) return;
      if (didTrackLandingClosedRef.current) return;
      didTrackLandingClosedRef.current = true;
      recordFlowEvent("landing_closed");
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") trackLandingClosedOnce();
    };

    const onPageHide = () => {
      trackLandingClosedOnce();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
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
    if (pwaInstall?.canShowInstallButton) {
      recordFlowEvent("install_clicked");
      if (pwaInstall.hasInstallPrompt) void pwaInstall.triggerInstall();
      else pwaInstall.showInstallHint();
    }
    onOwnerInstallRequestHandled?.();
  }, [ownerInstallRequestNonce, pwaInstall, onOwnerInstallRequestHandled]);

  const features = [
    { icon: Compass, title: "خريطة الوعي", desc: landingCopy.whatIsPoints[0], accent: "#2dd4bf" },
    { icon: Orbit, title: "المدارات الذكية", desc: landingCopy.whatIsPoints[1], accent: "#fbbf24" },
    { icon: Map, title: "خطة التحرك", desc: landingCopy.whatIsPoints[2], accent: "#34d399" },
  ];

  const stats = [
    { icon: Users, val: "١٬٠٠٠+", label: "شخص بدأ رحلته", accent: "#2dd4bf" },
    { icon: TrendingUp, val: "٩٣٪", label: "شافوا فرق حقيقي", accent: "#fbbf24" },
    { icon: Zap, val: "٥ دقائق", label: "لبداية التغيير", accent: "#34d399" },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-hidden">

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

        {/* ════════════════════════════════
            HERO
           ════════════════════════════════ */}
        <motion.section
          className="flex flex-col items-center justify-center text-center min-h-screen py-12"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* pill badge */}
          <motion.div
            className="flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
            variants={fadeUp}
            style={{ background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.18)" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[13px] font-bold text-teal-300/90">من هنا هنبدأ الحكاية</span>
          </motion.div>

          {/* hook — فوق العنوان (ثابت من الكود) */}
          <motion.p
            className="text-[15px] sm:text-base leading-[1.8] max-w-[420px] mx-auto mb-4"
            style={{ color: "rgba(203,213,225,0.92)" }}
            variants={fadeUp}
          >
            {landingCopy.hook}
          </motion.p>

          {/* headline — يحتفظ بفونت IBM Plex Sans Arabic */}
          <motion.h1
            id="landing-title"
            className="text-[2rem] sm:text-[2.5rem] md:text-[2.85rem] font-bold leading-[1.25] mb-3"
            style={{ fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
            variants={fadeUp}
          >
            {landingCopy.titleLine1}
          </motion.h1>

          {/* sub-headline — teal — يحتفظ بفونت IBM Plex Sans Arabic */}
          <motion.p
            className="text-lg sm:text-xl font-semibold mb-6"
            style={{ color: "#2dd4bf", fontFamily: '"IBM Plex Sans Arabic", system-ui, sans-serif' }}
            variants={fadeUp}
          >
            {landingCopy.titleLine2}
          </motion.p>

          {/* body copy — opacity أعلى للقراءة على خلفية كحلي */}
          <motion.p
            className="text-[15px] sm:text-base leading-[1.8] max-w-[420px] mx-auto mb-10"
            style={{ color: "rgba(203,213,225,0.92)" }}
            variants={item}
          >
            <EditableText
              id="landing_subtitle"
              defaultText={landingCopy.subtitle}
              page="landing"
              multiline
              className="whitespace-pre-line"
            />
          </motion.p>

          {/* CTA — centered */}
          <motion.div className="flex flex-col items-center" variants={item}>
            <motion.button
              type="button"
              onClick={handleStartJourney}
              className="group inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-[15px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                color: "#fff",
                boxShadow: "0 4px 24px rgba(16,185,129,0.3), 0 1px 3px rgba(0,0,0,0.2)"
              }}
              whileHover={{ y: -2, boxShadow: "0 8px 36px rgba(16,185,129,0.4), 0 2px 8px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <EditableText
                id="landing_cta_journey"
                defaultText={landingCopy.ctaJourney}
                page="landing"
                editOnClick={false}
                showEditIcon={false}
              />
            </motion.button>

            <p className="mt-2.5 text-[15px] text-center font-medium" style={{ color: "rgba(203,213,225,0.94)" }}>
              {hasExistingJourney
                ? "هنكمل من آخر مدار كنت واقف عنده"
                : <>
                خطوة واحدة بسيطة عشان نرسم أول نسخة
                <br />
                من خريطة وعيك
              </>
              }
            </p>

            {/* زر التثبيت — يظهر لجميع المستخدمين (وضع المستخدم) على موبايل/تابلت */}
            {pwaInstall?.canShowInstallButton && (
              <button
                type="button"
                onClick={() => {
                  recordFlowEvent("install_clicked");
                  if (pwaInstall.hasInstallPrompt) void pwaInstall.triggerInstall();
                  else pwaInstall.showInstallHint();
                }}
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
            )}
          </motion.div>

          {/* scroll indicator */}
          {showPostStartContent && (
            <motion.div
              className="mt-auto pt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              <motion.div
                className="w-5 h-8 rounded-full border border-white/15 flex justify-center pt-1.5 mx-auto"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  className="w-1 h-2 rounded-full bg-teal-400/50"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          )}
        </motion.section>

        {/* ════════════════════════════════
            FEATURES — 3 cards
           ════════════════════════════════ */}
        {showPostStartContent && (
          <motion.section
            className="py-12 sm:py-16"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {/* section label */}
            <motion.p
              className="text-[13px] font-semibold tracking-wide text-center mb-2"
              style={{ color: "rgba(148,163,184,0.5)", letterSpacing: "0.05em" }}
              variants={item}
            >
              إزاي بتشتغل
            </motion.p>
            <motion.h2
              className="text-xl sm:text-2xl font-bold text-center mb-10"
              variants={item}
            >
              <EditableText id="landing_what_is_title" defaultText={landingCopy.whatIsTitle} page="landing" showEditIcon={false} />
            </motion.h2>

            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  className="flex gap-4 items-start rounded-2xl p-5 transition-colors duration-300 hover:bg-white/[0.06]"
                  style={CARD}
                  variants={item}
                >
                  {/* icon */}
                  <div
                    className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center mt-0.5"
                    style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}22` }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                  </div>

                  {/* text */}
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold mb-1" style={{ color: "#fff" }}>
                      {f.title}
                    </h3>
                    <p className="text-[14px] leading-[1.75]" style={{ color: "rgba(203,213,225,0.75)" }}>
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ════════════════════════════════
            STATS — horizontal row
           ════════════════════════════════ */}
        {showPostStartContent && (
          <motion.section
            className="py-10 sm:py-14"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div
              className="rounded-2xl p-6 sm:p-8 grid grid-cols-3 divide-x divide-white/[0.06]"
              style={CARD}
            >
              {stats.map((s, i) => (
                <motion.div key={i} className="flex flex-col items-center text-center px-2" variants={item}>
                  <s.icon className="w-5 h-5 mb-2 opacity-60" style={{ color: s.accent }} />
                  <div
                    className="text-xl sm:text-2xl font-bold mb-1"
                    style={{ color: s.accent }}
                  >
                    {s.val}
                  </div>
                  <p className="text-[12px] sm:text-[13px] leading-snug" style={{ color: "rgba(148,163,184,0.7)" }}>
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ════════════════════════════════
            TESTIMONIALS
           ════════════════════════════════ */}
        {showPostStartContent && landingCopy.testimonials?.length > 0 && (
          <motion.section
            className="py-10 sm:py-14"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.p
              className="text-[13px] font-semibold tracking-wide text-center mb-2"
              style={{ color: "rgba(148,163,184,0.5)", letterSpacing: "0.05em" }}
              variants={item}
            >
              تجارب حقيقية
            </motion.p>
            <motion.h2
              className="text-xl sm:text-2xl font-bold text-center mb-8"
              variants={item}
            >
              قالوا عن تجربتهم
            </motion.h2>

            <div className="space-y-4">
              {landingCopy.testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  className="rounded-2xl p-5 sm:p-6"
                  style={CARD}
                  variants={item}
                >
                  <Quote className="w-5 h-5 mb-3" style={{ color: i === 0 ? "rgba(45,212,191,0.35)" : "rgba(251,191,36,0.35)" }} />
                  <p className="text-[14px] sm:text-[15px] leading-[1.8] mb-4" style={{ color: "rgba(203,213,225,0.85)" }}>
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        background: i === 0 ? "rgba(45,212,191,0.12)" : "rgba(251,191,36,0.12)",
                        border: `1px solid ${i === 0 ? "rgba(45,212,191,0.25)" : "rgba(251,191,36,0.25)"}`
                      }}
                    >
                      <Heart className="w-3 h-3" style={{ color: i === 0 ? "#2dd4bf" : "#fbbf24" }} />
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>
                      {t.author}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ════════════════════════════════
            FINAL CTA
           ════════════════════════════════ */}
        {showPostStartContent && (
          <motion.section
            className="py-16 sm:py-20 flex flex-col items-center text-center"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.h2
              className="text-xl sm:text-2xl font-bold mb-3"
              variants={item}
            >
              جاهز تبدأ رحلتك؟
            </motion.h2>
            <motion.p
              className="text-[14px] sm:text-[15px] mb-8 max-w-sm mx-auto"
              style={{ color: "rgba(148,163,184,0.75)", lineHeight: 1.75 }}
              variants={item}
            >
              خطوة واحدة بتفرق… ابدأ دلوقتي واكتشف خريطة وعيك
            </motion.p>

            <motion.div className="flex flex-col items-center" variants={item}>
              <motion.button
                type="button"
                onClick={handleStartJourney}
                className="group inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-[15px] font-semibold"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  color: "#fff",
                  boxShadow: "0 4px 24px rgba(16,185,129,0.3), 0 1px 3px rgba(0,0,0,0.2)"
                }}
                whileHover={{ y: -2, boxShadow: "0 8px 36px rgba(16,185,129,0.4), 0 2px 8px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.97 }}
              >
                ابدأ الرحلة الآن
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </motion.button>
            </motion.div>

            {lastGoalLabel && (
              <motion.div className="mt-6" variants={item}>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium ${badgePulse ? "animate-bounce" : ""}`}
                  style={{
                    background: "rgba(45,212,191,0.08)",
                    border: "1px solid rgba(45,212,191,0.2)",
                    color: "#2dd4bf"
                  }}
                >
                  {lastGoalMeta ? <lastGoalMeta.icon className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                  آخر هدف: {lastGoalLabel}
                </span>
              </motion.div>
            )}
          </motion.section>
        )}

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
      </div>
    </div>
  );
};
