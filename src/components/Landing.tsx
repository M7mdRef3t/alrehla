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
    <div className="relative w-full min-h-[70vh] min-h-[70svh] py-6 sm:py-10 md:py-14 px-3 sm:px-0 flex flex-col items-center justify-center">

      {/* ── Cosmic Ambient Glow ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
        <motion.div
          className="w-[min(80vmax,480px)] h-[min(80vmax,480px)] rounded-full"
          style={{
            background: "radial-gradient(circle at center, rgba(45, 212, 191, 0.12), rgba(139, 92, 246, 0.08) 45%, transparent 70%)",
            filter: "blur(60px)"
          }}
          animate={reduceMotion ? {} : {
            scale: [1, 1.08, 1],
            opacity: [0.6, 0.8, 0.6]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* ── Abstract Orbits on the sides (breaking empty space) ── */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden md:block" aria-hidden="true">
        <div
          className="absolute -left-20 top-1/3 w-40 h-40 rounded-full border border-white/8"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(45,212,191,0.18), transparent 65%)",
            filter: "blur(18px)",
            opacity: 0.55
          }}
        />
        <div
          className="absolute -right-16 bottom-1/4 w-32 h-32 rounded-full border border-white/10"
          style={{
            background: "radial-gradient(circle at 70% 70%, rgba(148,163,184,0.35), transparent 65%)",
            filter: "blur(20px)",
            opacity: 0.4
          }}
        />
      </div>

      <main
        className="relative z-10 w-full text-center"
        style={{ willChange: "transform, opacity" }}
        aria-labelledby="landing-title"
      >
        {/* ── Top Tools Badge ── */}
        {onOpenTools && showTopToolsButton && (
          <motion.button
            type="button"
            onClick={onOpenTools}
            className="mx-auto mb-5 sm:mb-7 inline-flex items-center gap-2 glass-button px-4 py-2 text-xs font-semibold"
            style={{ color: "var(--text-secondary)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              <EditableText
                id="landing_tools_cta"
                defaultText={landingCopy.toolsCta}
                page="landing"
                editOnClick={false}
              />
            </span>
            <span className="sm:hidden">مثالي للموبايل</span>
          </motion.button>
        )}

        {/* ── Hero Section ── */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.h1
            id="landing-title"
            className="text-xl sm:text-2xl md:text-4xl font-bold mb-6 sm:mb-10 leading-tight sm:leading-snug"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "var(--tracking-wider)",
              willChange: "transform, opacity, filter"
            }}
          >
            {/* السطر الأساسي — يجذب العين أولاً */}
            <motion.span
              className="block text-2xl sm:text-3xl md:text-[2.6rem]"
              variants={cosmicFadeUp}
            >
              <EditableText id="landing_title_line1" defaultText={landingCopy.titleLine1} page="landing" />
            </motion.span>
            {/* السطر التاني — يدعم الفكرة بنبرة أهدى */}
            <motion.span
              className="block mt-3 text-sm sm:text-base md:text-lg font-medium"
              variants={cosmicFadeUp}
              style={{ color: "var(--soft-teal)" }}
            >
              <EditableText id="landing_title_line2" defaultText={landingCopy.titleLine2} page="landing" />
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-sm sm:text-base leading-relaxed max-w-md mx-auto whitespace-pre-line mt-1"
            style={{
              color: "var(--text-secondary)",
              letterSpacing: "var(--tracking-wide)",
              willChange: "transform, opacity, filter"
            }}
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

          {/* ── CTA Button ── */}
          <motion.div className="mt-8 sm:mt-12" variants={staggerItem}>
            <div className="relative inline-block">
              <motion.button
                type="button"
                onClick={onStartJourney}
                className="relative cta-primary px-7 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-0"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <span className="flex items-center gap-2">
                  <EditableText
                    id="landing_cta_journey"
                    defaultText={landingCopy.ctaJourney}
                    page="landing"
                    editOnClick={false}
                  />
                  <ArrowRight className="w-4 h-4" />
                </span>
              </motion.button>
            </div>
            <p className="mt-3 text-xs" style={{ color: "rgba(255, 255, 255, 0.72)" }}>
              {hasExistingJourney ? "هنكمل من آخر مدار كنت واقف عنده." : "خطوة واحدة بسيطة عشان نرسم أول نسخة من خريطة وعيك."}
            </p>

            {showPostStartContent && onOpenTools && (
              <div className="mt-5 flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenTools}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: "var(--soft-teal)" }}
                >
                  <EditableText
                    id="landing_tools_cta"
                    defaultText={landingCopy.toolsCta}
                    page="landing"
                    showEditIcon={false}
                  />
                </button>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <EditableText
                    id="landing_tools_cta_hint"
                    defaultText={landingCopy.toolsCtaHint}
                    page="landing"
                    showEditIcon={false}
                  />
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* ── "What Is" Section — Glass Cards ── */}
        {showPostStartContent && (
          <motion.section
            className="mt-8 sm:mt-12 text-right max-w-md mx-auto px-4 sm:px-0"
            aria-labelledby="landing-what-is"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.h2
              id="landing-what-is"
              className="text-xs sm:text-sm font-bold mb-4"
              style={{ color: "var(--text-primary)", letterSpacing: "var(--tracking-wider)" }}
              variants={staggerItem}
            >
              <EditableText id="landing_what_is_title" defaultText={landingCopy.whatIsTitle} page="landing" />
            </motion.h2>
            <ul className="text-xs sm:text-sm leading-relaxed space-y-3 list-none pr-0">
              {landingCopy.whatIsPoints.map((point, i) => (
                <motion.li
                  key={i}
                  className="flex gap-3 items-start glass-card px-4 py-3"
                  variants={staggerItem}
                >
                  <span className="mt-0.5 shrink-0" style={{ color: "var(--soft-teal)" }} aria-hidden>
                    {i === 0 && <Target className="w-4 h-4" />}
                    {i === 1 && <Shield className="w-4 h-4" />}
                    {i === 2 && <CheckCircle2 className="w-4 h-4" />}
                  </span>
                  <span className="flex-1" style={{ color: "var(--text-secondary)" }}>
                    <EditableText
                      id={`landing_what_is_point_${i + 1}`}
                      defaultText={point}
                      page="landing"
                      showEditIcon={false}
                    />
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ── Trust Section — Social Proof ── */}
        {showPostStartContent && (
          <motion.section
            className="mt-8 text-center max-w-md mx-auto px-4 sm:px-0"
            aria-labelledby="landing-trust"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.p
              id="landing-trust"
              className="text-xs sm:text-sm font-semibold"
              style={{ color: "var(--text-muted)" }}
              variants={staggerItem}
            >
              <EditableText id="landing_trust_title" defaultText={landingCopy.trustTitle} page="landing" showEditIcon={false} />
            </motion.p>
            <motion.p
              className="text-base sm:text-lg font-bold mt-1"
              style={{ color: "var(--soft-teal)" }}
              variants={staggerItem}
            >
              <EditableText id="landing_trust_count" defaultText={landingCopy.trustCount} page="landing" showEditIcon={false} />
              {" "}
              <EditableText id="landing_trust_suffix" defaultText={landingCopy.trustSuffix} page="landing" showEditIcon={false} />
            </motion.p>

            {/* Testimonials */}
            <div className="mt-5 space-y-3">
              {landingCopy.testimonials.map((t, i) => (
                <motion.blockquote
                  key={i}
                  className="glass-card px-4 py-3 text-right"
                  style={{ borderRightWidth: "2px", borderRightColor: "rgba(45, 212, 191, 0.3)" }}
                  variants={staggerItem}
                >
                  <p className="text-xs sm:text-sm italic" style={{ color: "var(--text-secondary)" }}>
                    &ldquo;
                    <EditableText
                      id={`landing_testimonial_${i + 1}_quote`}
                      defaultText={t.quote}
                      page="landing"
                      multiline
                      showEditIcon={false}
                    />
                    &rdquo;
                  </p>
                  <cite className="block text-xs not-italic mt-1.5" style={{ color: "var(--text-muted)" }}>
                    &mdash;{" "}
                    <EditableText
                      id={`landing_testimonial_${i + 1}_author`}
                      defaultText={t.author}
                      page="landing"
                      showEditIcon={false}
                    />
                  </cite>
                </motion.blockquote>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Tools Section — Glass Cards ── */}
        {showPostStartContent && showToolsSection && (
          <motion.section
            className="mt-10 text-right max-w-md mx-auto"
            aria-labelledby="landing-tools"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.h2
              id="landing-tools"
              className="text-sm font-bold mb-4"
              style={{ color: "var(--text-primary)", letterSpacing: "var(--tracking-wider)" }}
              variants={staggerItem}
            >
              <EditableText id="landing_tools_title" defaultText={landingCopy.toolsTitle} page="landing" showEditIcon={false} />
            </motion.h2>
            <div className="space-y-3">
              {tools.map((tool) => (
                <motion.button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    if (!tool.locked || !tool.featureKey || !onFeatureLocked) return;
                    onFeatureLocked(tool.featureKey);
                  }}
                  className="glass-card w-full text-right px-4 py-3 transition-all"
                  style={{
                    borderColor: tool.locked
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(45, 212, 191, 0.2)"
                  }}
                  variants={staggerItem}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          background: tool.locked
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(45, 212, 191, 0.1)",
                          color: tool.locked
                            ? "var(--text-muted)"
                            : "var(--soft-teal)",
                          border: `1px solid ${tool.locked ? "rgba(255, 255, 255, 0.06)" : "rgba(45, 212, 191, 0.2)"}`
                        }}
                      >
                        <span aria-hidden="true">{tool.icon}</span>
                      </div>
                      <div className="text-right min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{tool.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
                        style={{
                          background: tool.locked
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(45, 212, 191, 0.1)",
                          color: tool.locked
                            ? "var(--text-muted)"
                            : "var(--soft-teal)",
                          border: `1px solid ${tool.locked ? "rgba(255, 255, 255, 0.06)" : "rgba(45, 212, 191, 0.2)"}`
                        }}
                      >
                        {tool.status}
                      </span>
                      {!tool.locked && tool.id !== "dawayir" && (
                        <span
                          className="text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
                          style={{
                            background: "rgba(45, 212, 191, 0.12)",
                            color: "var(--soft-teal)",
                            border: "1px solid rgba(45, 212, 191, 0.25)"
                          }}
                        >
                          تم فتحها
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{tool.description}</p>
                </motion.button>
              ))}
            </div>

            {/* Tools CTA card */}
            {showPostStartContent && onOpenTools && (
              <motion.div
                className="mt-4 glass-card flex items-center justify-between px-4 py-3"
                style={{ borderColor: "rgba(45, 212, 191, 0.2)" }}
                variants={staggerItem}
              >
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: "var(--soft-teal)" }}>{landingCopy.toolsCta}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{landingCopy.toolsCtaHint}</p>
                  {lastGoalLabel && (
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgePulseClass}`}
                      style={{
                        background: "rgba(245, 166, 35, 0.1)",
                        border: "1px solid rgba(245, 166, 35, 0.25)",
                        color: "var(--warm-amber)"
                      }}
                    >
                      {lastGoalMeta ? <lastGoalMeta.icon className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                      آخر هدف محفوظ: {lastGoalLabel}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onOpenTools}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: "var(--soft-teal)" }}
                >
                  افتح
                </button>
              </motion.div>
            )}
          </motion.section>
        )}
      </main>
    </div>
  );
};
