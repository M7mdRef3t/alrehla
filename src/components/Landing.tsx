import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { landingCopy } from "../copy/landing";
import { getJourneyToolsView } from "../data/journeyTools";
import { useJourneyState } from "../state/journeyState";
import { useMapState } from "../state/mapState";
import { useAchievementState } from "../state/achievementState";
import { getGoalLabel, getLastGoalMeta } from "../utils/goalLabel";
import { getGoalMeta } from "../data/goalMeta";
import type { FeatureFlagKey } from "../config/features";
import { EditableText } from "./EditableText";

interface LandingProps {
  onStartJourney: () => void;
  onOpenTools?: () => void;
  showTopToolsButton?: boolean;
  showPostStartContent?: boolean;
  showToolsSection?: boolean;
  onFeatureLocked?: (feature: FeatureFlagKey) => void;
  availableFeatures?: Partial<Record<FeatureFlagKey, boolean>>;
}

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

  const handleStartJourney = () => {
    onStartJourney();
  };

  const badgePulseClass = badgePulse ? "animate-bounce" : "";
  const fallbackBadgeClasses =
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200";
  const reduceMotion = useReducedMotion();
  const fogEase = [0.22, 1, 0.36, 1] as const;

  const fogContainer = {
    hidden: {},
    visible: {
      transition: reduceMotion ? {} : { staggerChildren: 0.18, delayChildren: 0.1 }
    }
  };

  const fogTitleContainer = {
    hidden: {},
    visible: {
      transition: reduceMotion ? {} : { staggerChildren: 0.18 }
    }
  };

  // Keep a tiny blur in the final state to avoid a last-frame "jump" on some mobile browsers
  // when switching between filtered/unfiltered text rendering pipelines.
  const fogFinalBlur = "blur(0.01px)";

  const fogItem = {
    hidden: reduceMotion ? { opacity: 1, y: 0, filter: fogFinalBlur } : { opacity: 0, y: 10, filter: "blur(18px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: fogFinalBlur,
      transition: reduceMotion ? { duration: 0 } : { duration: 1.6, ease: fogEase }
    }
  };

  const fogCta = {
    hidden: reduceMotion
      ? { opacity: 1, y: 0, scale: 1, filter: fogFinalBlur }
      : { opacity: 0, y: 14, scale: 0.985, filter: "blur(18px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: fogFinalBlur,
      transition: reduceMotion ? { duration: 0 } : { duration: 1.6, ease: fogEase, delay: 0.25 }
    }
  };

  return (
    <div className="relative w-full max-w-xl min-h-[70vh] min-h-[70svh] py-6 sm:py-10 md:py-14 px-4 sm:px-0 flex flex-col items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" aria-hidden="true">
        <div
          className="w-[min(80vmax,520px)] h-[min(80vmax,520px)] rounded-full blur-2xl dark:hidden animate-pulse"
          style={{
            background:
              "radial-gradient(circle at center, rgba(71,85,105,0.24), rgba(148,163,184,0.16) 42%, rgba(255,255,255,0) 72%)"
          }}
        />
        <div className="hidden w-[min(80vmax,520px)] h-[min(80vmax,520px)] rounded-full bg-teal-900/40 blur-3xl dark:block animate-pulse" />
      </div>

      <main
        className="relative z-10 w-full text-center"
        style={{ willChange: "transform, opacity" }}
        aria-labelledby="landing-title"
      >
        {onOpenTools && showTopToolsButton && (
          <button
            type="button"
            onClick={onOpenTools}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold shadow-sm hover:bg-slate-800 transition-all"
          >
            <span>
              <EditableText
                id="landing_tools_cta"
                defaultText={landingCopy.toolsCta}
                page="landing"
                editOnClick={false}
              />
            </span>
            <span className="text-[10px] text-slate-200">
              <EditableText
                id="landing_tools_cta_hint"
                defaultText={landingCopy.toolsCtaHint}
                page="landing"
                showEditIcon={false}
              />
            </span>
          </button>
        )}

        <motion.div variants={fogContainer} initial="hidden" animate="visible">
          <motion.h1
            id="landing-title"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight sm:leading-normal"
            style={{ fontFamily: "'Almarai', sans-serif", willChange: "transform, opacity, filter" }}
            variants={fogTitleContainer}
          >
            <motion.span className="block" variants={fogItem}>
              <EditableText id="landing_title_line1" defaultText={landingCopy.titleLine1} page="landing" />
            </motion.span>
            <motion.span className="block mt-2" variants={fogItem}>
              <EditableText id="landing_title_line2" defaultText={landingCopy.titleLine2} page="landing" />
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto whitespace-pre-line"
            style={{ willChange: "transform, opacity, filter" }}
            variants={fogItem}
          >
            <EditableText
              id="landing_subtitle"
              defaultText={landingCopy.subtitle}
              page="landing"
              multiline
              className="whitespace-pre-line"
            />
          </motion.p>

          <motion.div className="mt-6 sm:mt-8" style={{ willChange: "transform, opacity, filter" }} variants={fogCta}>
            <div className="relative inline-block">
              <div
                className="pointer-events-none absolute -inset-4 rounded-full bg-teal-500/20 blur-2xl dark:bg-teal-400/20"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={handleStartJourney}
                className="relative rounded-full bg-teal-600 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transition-colors"
              >
                <EditableText
                  id="landing_cta_journey"
                  defaultText={landingCopy.ctaJourney}
                  page="landing"
                  editOnClick={false}
                />
              </button>
            </div>

            {showPostStartContent && onOpenTools && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenTools}
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800 underline decoration-teal-200"
                >
                  <EditableText
                    id="landing_tools_cta"
                    defaultText={landingCopy.toolsCta}
                    page="landing"
                    showEditIcon={false}
                  />
                </button>
                <p className="text-xs text-slate-500">
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

        {showPostStartContent && (
          <section className="mt-8 sm:mt-10 text-right max-w-md mx-auto px-4 sm:px-0" aria-labelledby="landing-what-is">
            <h2 id="landing-what-is" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <EditableText id="landing_what_is_title" defaultText={landingCopy.whatIsTitle} page="landing" />
            </h2>
            <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-1.5 list-none pr-0">
              {landingCopy.whatIsPoints.map((point, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="text-teal-500 mt-0.5 shrink-0" aria-hidden>
                    •
                  </span>
                  <span>
                    <EditableText
                      id={`landing_what_is_point_${i + 1}`}
                      defaultText={point}
                      page="landing"
                      showEditIcon={false}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {showPostStartContent && (
          <section className="mt-6 sm:mt-8 text-center max-w-md mx-auto px-4 sm:px-0" aria-labelledby="landing-trust">
            <p id="landing-trust" className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              <EditableText id="landing_trust_title" defaultText={landingCopy.trustTitle} page="landing" showEditIcon={false} />
            </p>
            <p className="text-base sm:text-lg font-bold text-teal-600 dark:text-teal-400 mt-0.5">
              <EditableText id="landing_trust_count" defaultText={landingCopy.trustCount} page="landing" showEditIcon={false} />
              {" "}
              <EditableText id="landing_trust_suffix" defaultText={landingCopy.trustSuffix} page="landing" showEditIcon={false} />
            </p>
            <div className="mt-4 space-y-3">
              {landingCopy.testimonials.map((t, i) => (
                <blockquote
                  key={i}
                  className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic border-r-2 border-teal-200 dark:border-teal-700 pr-3 text-right"
                >
                  "
                  <EditableText
                    id={`landing_testimonial_${i + 1}_quote`}
                    defaultText={t.quote}
                    page="landing"
                    multiline
                    showEditIcon={false}
                  />
                  "
                  <cite className="block text-xs not-italic text-slate-500 dark:text-slate-500 mt-1">
                    —{" "}
                    <EditableText
                      id={`landing_testimonial_${i + 1}_author`}
                      defaultText={t.author}
                      page="landing"
                      showEditIcon={false}
                    />
                  </cite>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {showPostStartContent && showToolsSection && (
          <section className="mt-8 text-right max-w-md mx-auto" aria-labelledby="landing-tools">
            <h2 id="landing-tools" className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              <EditableText id="landing_tools_title" defaultText={landingCopy.toolsTitle} page="landing" showEditIcon={false} />
            </h2>
            <div className="space-y-3">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    if (!tool.locked || !tool.featureKey || !onFeatureLocked) return;
                    onFeatureLocked(tool.featureKey);
                  }}
                  className={`rounded-2xl border px-4 py-3 shadow-sm transition-colors ${
                    tool.locked
                      ? "border-slate-200 bg-white dark:bg-slate-800"
                      : "border-teal-200 bg-teal-50/70 dark:bg-teal-900/20 dark:border-teal-700"
                  } w-full text-right`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          tool.locked
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                            : "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200"
                        }`}
                      >
                        <span aria-hidden="true">{tool.icon}</span>
                      </div>
                      <div className="text-right min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{tool.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${
                          tool.locked
                            ? "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                            : "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200"
                        }`}
                      >
                        {tool.status}
                      </span>
                      {!tool.locked && tool.id !== "dawayir" && (
                        <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200 whitespace-nowrap">
                          تم فتحها
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{tool.description}</p>
                </button>
              ))}
            </div>
            {showPostStartContent && onOpenTools && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-teal-100 bg-teal-50/80 px-4 py-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-teal-700">{landingCopy.toolsCta}</p>
                  <p className="text-xs text-slate-600">{landingCopy.toolsCtaHint}</p>
                  {lastGoalLabel && (
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        lastGoalMeta?.badgeClasses ?? fallbackBadgeClasses
                      } ${badgePulseClass}`}
                    >
                      {lastGoalMeta ? <lastGoalMeta.icon className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                      آخر هدف محفوظ: {lastGoalLabel}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onOpenTools}
                  className="text-sm font-semibold text-teal-700 underline decoration-teal-200"
                >
                  افتح
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
