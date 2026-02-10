import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star, Target, Shield, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";
import { landingCopy } from "../copy/landing";
import { getJourneyToolsView } from "../data/journeyTools";
import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { useAchievementState } from "../state/achievementState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import type { FeatureFlagKey } from "../config/features";
import { EditableText } from "./EditableText";

/* ════════════════════════════════════════════════
   🌌 LANDING — Digital Sanctuary Gateway
   ════════════════════════════════════════════════ */

interface LandingProps {
  onStartJourney: () => void;
  onOpenTools?: () => void;
  showTopToolsButton?: boolean;
  showPostStartContent?: boolean;
  showToolsSection?: boolean;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
  availableFeatures?: Partial<Record<FeatureFlagKey, boolean>>;
}

/* ── Cosmic Animations ── */
const cosmicEase = [0.22, 1, 0.36, 1] as [number, number, number, number];

const cosmicFadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: cosmicEase }
  }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.15 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: cosmicEase }
  }
};

export const Landing: FC<LandingProps> = ({
  onStartJourney,
  onOpenTools,
  showTopToolsButton = true,
  showPostStartContent = true,
  showToolsSection = true,
  onFeatureLocked,
  availableFeatures
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
  const unlockedIds = useAchievementState((s) => s.unlockedIds);
  const hasMissionCompleted = useMapState((s) => s.nodes.some((n) => n.missionProgress?.isCompleted));
  const tools = getJourneyToolsView({
    nodesCount,
    baselineCompletedAt: baselineCompletedAt ?? null,
    unlockedIds,
    hasMissionCompleted,
    availableFeatures
  });
  const reduceMotion = useReducedMotion();
  const hasExistingJourney = Boolean(baselineCompletedAt || nodesCount > 0);

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

  const badgePulseClass = badgePulse ? "animate-bounce" : "";

  return (
    <div className="relative w-full min-h-screen py-10 sm:py-14 md:py-16 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">

      {/* ── Cosmic Ambient Glow ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="w-[100vmax] h-[100vmax] rounded-full"
          style={{
            background: "radial-gradient(circle at center, rgba(45, 212, 191, 0.14), rgba(245, 166, 35, 0.08) 40%, transparent 70%)",
            filter: "blur(80px)"
          }}
          animate={reduceMotion ? {} : {
            scale: [1, 1.08, 1],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <main
        className="relative z-10 w-full text-center"
        style={{ willChange: "transform, opacity" }}
        aria-labelledby="landing-title"
      >

        {/* ── Hero Block ── */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.h1
            id="landing-title"
            className="mb-8 sm:mb-10 leading-[1.15] tracking-tight"
            style={{ color: "var(--text-primary)", willChange: "transform, opacity, filter" }}
          >
            <motion.span
              className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-5"
              variants={cosmicFadeUp}
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(45,212,191,0.8) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              {landingCopy.titleLine1}
            </motion.span>
            <motion.span
              className="block text-lg sm:text-xl md:text-2xl font-bold tracking-tight"
              variants={cosmicFadeUp}
              style={{
                background: "linear-gradient(135deg, rgba(45,212,191,0.9) 0%, rgba(245,166,35,0.7) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              {landingCopy.titleLine2}
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto whitespace-pre-line mb-8"
            style={{ color: "var(--text-secondary)", willChange: "transform, opacity, filter" }}
            variants={staggerItem}
          >
            <EditableText
              id="landing_subtitle"
              defaultText={landingCopy.subtitle}
              page="landing"
              multiline
              className="whitespace-pre-line"
            />
          </motion.p>

          {/* ── CTA Block ── */}
          <motion.div className="mt-8 sm:mt-10" variants={staggerItem}>
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-xl blur-lg opacity-50"
                style={{
                  background: "linear-gradient(135deg, #f5a623, #d97706)",
                  transform: "scale(1.05)"
                }}
              />
              <motion.button
                type="button"
                onClick={onStartJourney}
                className="relative px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--space-void)]"
                style={{
                  background: "linear-gradient(135deg, #f5a623 0%, #fbbf24 50%, #f5a623 100%)",
                  backgroundSize: "200% 100%",
                  color: "#000",
                  boxShadow: "0 8px 32px rgba(245, 166, 35, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)"
                }}
                whileHover={{
                  scale: 1.04,
                  y: -2,
                  boxShadow: "0 12px 48px rgba(245, 166, 35, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <span className="flex items-center gap-2 sm:gap-3">
                  <EditableText
                    id="landing_cta_journey"
                    defaultText={landingCopy.ctaJourney}
                    page="landing"
                    editOnClick={false}
                  />
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
              </motion.button>
            </div>
            <p className="mt-4 text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
              {hasExistingJourney ? "هنكمل من آخر مدار كنت واقف عنده." : "خطوة واحدة بسيطة عشان نرسم أول نسخة من خريطة وعيك."}
            </p>
          </motion.div>
        </motion.div>

        {/* ── What Is Block — 3 كروت ── */}
        {showPostStartContent && (
          <motion.section
            className="mt-16 sm:mt-20 md:mt-24"
            aria-labelledby="landing-what-is"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.h2
              id="landing-what-is"
              className="text-lg sm:text-xl font-bold mb-6 sm:mb-8 text-center"
              style={{ color: "var(--text-primary)", letterSpacing: "var(--tracking-wider)" }}
              variants={staggerItem}
            >
              <EditableText id="landing_what_is_title" defaultText={landingCopy.whatIsTitle} page="landing" showEditIcon={false} />
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {landingCopy.whatIsPoints.map((point, i) => (
                <motion.div
                  key={i}
                  className="relative group"
                  variants={staggerItem}
                >
                  {/* Glow على hover */}
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                    style={{
                      background: i === 0 ? "rgba(45, 212, 191, 0.4)" : i === 1 ? "rgba(245, 166, 35, 0.4)" : "rgba(16, 185, 129, 0.4)"
                    }}
                  />

                  <div
                    className="relative bento-block h-full px-5 py-5 sm:px-6 sm:py-6"
                    style={{
                      borderColor: i === 0 ? "rgba(45, 212, 191, 0.2)" : i === 1 ? "rgba(245, 166, 35, 0.2)" : "rgba(16, 185, 129, 0.2)"
                    }}
                  >
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 mx-auto"
                      style={{
                        background: i === 0 ? "rgba(45, 212, 191, 0.12)" : i === 1 ? "rgba(245, 166, 35, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        border: `1px solid ${i === 0 ? "rgba(45, 212, 191, 0.25)" : i === 1 ? "rgba(245, 166, 35, 0.25)" : "rgba(16, 185, 129, 0.25)"}`
                      }}
                    >
                      {i === 0 && <Target className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "var(--soft-teal)" }} />}
                      {i === 1 && <Shield className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "var(--warm-amber)" }} />}
                      {i === 2 && <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "var(--soft-emerald)" }} />}
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed text-center" style={{ color: "var(--text-secondary)" }}>
                      <EditableText
                        id={`landing_what_is_point_${i + 1}`}
                        defaultText={point}
                        page="landing"
                        showEditIcon={false}
                      />
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Trust Block ── */}
        {showPostStartContent && (
          <motion.section
            className="mt-14 sm:mt-16 text-center"
            aria-labelledby="landing-trust"
            variants={staggerItem}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p id="landing-trust" className="text-xs sm:text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
              <EditableText id="landing_trust_title" defaultText={landingCopy.trustTitle} page="landing" showEditIcon={false} />
            </p>
            <div className="inline-flex items-baseline gap-2 sm:gap-3">
              <span
                className="text-4xl sm:text-5xl font-black"
                style={{
                  background: "linear-gradient(135deg, rgba(45,212,191,0.9) 0%, rgba(16,185,129,0.7) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                <EditableText id="landing_trust_count" defaultText={landingCopy.trustCount} page="landing" showEditIcon={false} />
              </span>
              <span className="text-base sm:text-lg font-bold" style={{ color: "var(--text-secondary)" }}>
                <EditableText id="landing_trust_suffix" defaultText={landingCopy.trustSuffix} page="landing" showEditIcon={false} />
              </span>
            </div>
          </motion.section>
        )}

        {/* ── Final CTA Block ── */}
        {showPostStartContent && onOpenTools && (
          <motion.section
            className="mt-14 sm:mt-16 md:mt-20 text-center"
            variants={staggerItem}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              جاهز تبدأ؟
            </h2>
            <p className="text-base sm:text-lg mb-6" style={{ color: "var(--text-secondary)" }}>
              دوس على الزرار واتحرك خطوة واحدة لقدام
            </p>
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-xl blur-lg opacity-50"
                style={{
                  background: "linear-gradient(135deg, #f5a623, #d97706)",
                  transform: "scale(1.05)"
                }}
              />
              <motion.button
                type="button"
                onClick={onStartJourney}
                className="relative px-10 py-5 text-lg font-bold rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #f5a623 0%, #fbbf24 50%, #f5a623 100%)",
                  color: "#000",
                  boxShadow: "0 8px 32px rgba(245, 166, 35, 0.35)"
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
              >
                ابدأ الرحلة الآن
              </motion.button>
            </div>
            {lastGoalLabel && (
              <div className="mt-6">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${badgePulseClass}`}
                  style={{
                    background: "rgba(45, 212, 191, 0.12)",
                    border: "1px solid rgba(45, 212, 191, 0.25)",
                    color: "var(--soft-teal)"
                  }}
                >
                  {lastGoalMeta ? <lastGoalMeta.icon className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  آخر هدف: {lastGoalLabel}
                </span>
              </div>
            )}
          </motion.section>
        )}
      </main>
      </div>
    </div>
  );
};
