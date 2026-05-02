"use client";

/**
 * JourneyFlow.tsx
 * ══════════════════════════════════════════════════
 * الرحلة التفاعلية عبر المحطات الثلاث:
 * المواجهة → التجلي → القيادة
 *
 * يُعرض بعد اختيار المسار مباشرةً في MasaratScreen
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  useMasaratStore,
  selectCurrentStep,
  selectJourneyProgress,
  selectCompletedStageIds,
} from "./store/masarat.store";
import { STAGE_META } from "./journeySteps.data";
import type { StageId, ResponseDepth, RecommendedTool } from "./store/masarat.store";
import type { MasaratContext } from "./masaratContext";

// ─── Constants ────────────────────────────────────────────────
const SURFACE_THRESHOLD_MS = 5_000;
const DEEP_THRESHOLD_MS    = 30_000;

// ─── PathRoadmap ─────────────────────────────────────────────
interface PathRoadmapProps {
  totalSteps: number;
  currentIndex: number;
  stages: { id: StageId; label: string; icon: string; color: string }[];
  completedStageIds: StageId[];
}

function PathRoadmap({ totalSteps, currentIndex, stages, completedStageIds }: PathRoadmapProps) {
  const stepsPerStage = Math.ceil(totalSteps / stages.length);

  return (
    <div style={RS.roadmapWrapper}>
      {/* Stage pills */}
      <div style={RS.stageRow}>
        {stages.map((stage, sIdx) => {
          const stageStart = sIdx * stepsPerStage;
          const stageEnd   = Math.min(stageStart + stepsPerStage, totalSteps);
          const isCompleted = completedStageIds.includes(stage.id);
          const isActive    = currentIndex >= stageStart && currentIndex < stageEnd;
          const isLocked    = !isCompleted && !isActive;

          return (
            <div key={stage.id} style={RS.stagePill}>
              {/* Stage label */}
              <div
                style={{
                  ...RS.stageLabel,
                  color: isCompleted ? stage.color : isActive ? "#f1f5f9" : "#475569",
                  opacity: isLocked ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: 18 }}>{stage.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{stage.label}</span>
              </div>

              {/* Step dots */}
              <div style={RS.dotsRow}>
                {Array.from({ length: stageEnd - stageStart }).map((_, dIdx) => {
                  const globalIdx  = stageStart + dIdx;
                  const isDone     = globalIdx < currentIndex;
                  const isCurrent  = globalIdx === currentIndex;

                  return (
                    <React.Fragment key={globalIdx}>
                      {/* Dot */}
                      <div
                        style={{
                          ...RS.dot,
                          backgroundColor: isDone
                            ? stage.color
                            : isCurrent
                            ? "#f1f5f9"
                            : "transparent",
                          borderColor: isDone || isCurrent
                            ? stage.color
                            : "rgba(255,255,255,0.12)",
                          boxShadow: isCurrent
                            ? `0 0 10px ${stage.color}70, 0 0 20px ${stage.color}30`
                            : isDone
                            ? `0 0 6px ${stage.color}40`
                            : "none",
                          transform: isCurrent ? "scale(1.25)" : "scale(1)",
                          transition: "all 0.35s ease",
                        }}
                      >
                        {isDone && (
                          <span style={{ fontSize: 8, color: "#0a0e1f", fontWeight: 900 }}>✓</span>
                        )}
                        {isCurrent && (
                          <span style={{ fontSize: 7, color: stage.color, fontWeight: 900 }}>●</span>
                        )}
                      </div>

                      {/* Connector line (not after last dot) */}
                      {dIdx < stageEnd - stageStart - 1 && (
                        <div
                          style={{
                            ...RS.connector,
                            backgroundColor: globalIdx < currentIndex - 1
                              ? stage.color
                              : "rgba(255,255,255,0.08)",
                            transition: "background-color 0.5s ease",
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Inter-stage connector */}
              {sIdx < stages.length - 1 && (
                <div style={RS.stageConnector} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={RS.progressBar}>
        <div
          style={{
            ...RS.progressFill,
            width: `${(currentIndex / Math.max(totalSteps - 1, 1)) * 100}%`,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <p style={RS.progressLabel}>
        {currentIndex} / {totalSteps} خطوة
      </p>
    </div>
  );
}

// ─── ToolRecommendation ──────────────────────────────────────
interface ToolRecommendationProps {
  tool: RecommendedTool;
  stageMeta: typeof STAGE_META[StageId];
  onNavigate?: (screen: string) => void;
}

function ToolRecommendation({ tool: t, stageMeta, onNavigate }: ToolRecommendationProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div style={{ ...RS.toolCard, borderColor: stageMeta.color + "30" }}>
      <div style={RS.toolHeader}>
        <span style={{ fontSize: 22 }}>{t.icon}</span>
        <div>
          <p style={{ ...RS.toolLabel, color: stageMeta.color }}>{t.label}</p>
          <p style={RS.toolReason}>{t.reason}</p>
        </div>
      </div>
      <div style={RS.toolActions}>
        <button
          style={{ ...RS.toolOpenBtn, backgroundColor: stageMeta.color }}
          onClick={() => onNavigate?.(t.toolId)}
        >
          افتح الأداة →
        </button>
        <button
          style={RS.toolDismissBtn}
          onClick={() => setDismissed(true)}
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
}

// ─── StepCard ────────────────────────────────────────────────
interface StepCardProps {
  question: string;
  deeperQuestion?: string;
  recommendedTool?: RecommendedTool;
  stageMeta: typeof STAGE_META[StageId];
  adaptiveDepth: ResponseDepth;
  onSubmit: (answer: string, durationMs: number) => void;
  onSkip: () => void;
  onNavigate?: (screen: string) => void;
  context?: MasaratContext;
}

function StepCard({
  question,
  deeperQuestion,
  recommendedTool,
  stageMeta,
  adaptiveDepth,
  onSubmit,
  onSkip,
  onNavigate,
  context,
}: StepCardProps) {
  const [answer, setAnswer]     = useState("");
  const [showDeeper, setShowDeeper] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const startRef = useRef(Date.now());

  // Reset on new question
  useEffect(() => {
    setAnswer("");
    setShowDeeper(false);
    setSubmitted(false);
    startRef.current = Date.now();
  }, [question]);

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || submitted) return;
    const duration = Date.now() - startRef.current;

    // Surface answer → show deeper question if available
    if (duration < SURFACE_THRESHOLD_MS && deeperQuestion && !showDeeper) {
      setShowDeeper(true);
      return;
    }

    setSubmitted(true);
    onSubmit(answer.trim(), duration);
  }, [answer, submitted, deeperQuestion, showDeeper, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) handleSubmit();
  };

  return (
    <div style={{ ...RS.stepCard, borderColor: stageMeta.color + "40" }}>
      {/* ── Context Support Message ── */}
      {context?.hints.supportMessage && (
        <div style={RS.supportMsg}>
          <p style={RS.supportText}>{context.hints.supportMessage}</p>
        </div>
      )}

      {/* ── Calming Tool (before question when distressed) ── */}
      {context?.hints.calmingToolFirst && recommendedTool && recommendedTool.timing === "before" && (
        <ToolRecommendation tool={recommendedTool} stageMeta={stageMeta} onNavigate={onNavigate} />
      )}

      {/* Stage badge */}
      <div style={{ ...RS.stageBadge, backgroundColor: stageMeta.color + "18", color: stageMeta.color }}>
        {stageMeta.icon} {stageMeta.label}
      </div>

      {/* Question */}
      <p style={RS.question}>
        {showDeeper && deeperQuestion ? deeperQuestion : question}
      </p>

      {showDeeper && (
        <p style={RS.deeperHint}>💡 خذ وقتك — السؤال ده يستاهل</p>
      )}

      {/* Answer textarea */}
      <textarea
        style={RS.textarea}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اكتب هنا... (Ctrl+Enter للإرسال)"
        rows={4}
        disabled={submitted}
        dir="rtl"
      />

      {/* Actions */}
      <div style={RS.actions}>
        <button
          style={{
            ...RS.submitBtn,
            backgroundColor: answer.trim() ? stageMeta.color : "rgba(255,255,255,0.06)",
            color: answer.trim() ? "#0a0e1f" : "#475569",
            cursor: answer.trim() && !submitted ? "pointer" : "default",
          }}
          onClick={handleSubmit}
          disabled={!answer.trim() || submitted}
        >
          {submitted ? "✓ تم" : "التالي →"}
        </button>

        <button style={RS.skipBtn} onClick={onSkip}>
          تخطى
        </button>
      </div>

      {adaptiveDepth === "surface" && !showDeeper && (
        <p style={RS.depthHint}>
          💬 ردودك السريعة تخلينا نسألك أعمق في بعض الأحيان
        </p>
      )}

      {/* Tool Recommendation — not calming (normal timing) */}
      {recommendedTool && recommendedTool.timing === "before" && !submitted && !context?.hints.calmingToolFirst && (
        <ToolRecommendation tool={recommendedTool} stageMeta={stageMeta} onNavigate={onNavigate} />
      )}
      {recommendedTool && recommendedTool.timing === "after" && submitted && (
        <ToolRecommendation tool={recommendedTool} stageMeta={stageMeta} onNavigate={onNavigate} />
      )}

      {/* ── Spiritual Anchor (Vertical Axis) ── */}
      {context?.hints.spiritualAnchor && context.resonance && (
        <div style={RS.spiritualAnchor}>
          <span style={{ fontSize: 16 }}>🌙</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            اتصالك: {context.resonance.label} ({Math.round(context.resonance.strength * 100)}%)
          </span>
        </div>
      )}

      {/* ── Khalwa Suggestion ── */}
      {context?.khalwa.suggested && (
        <div style={RS.khalwaSuggestion}>
          <span style={{ fontSize: 14 }}>🧘</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>خلوة مقترحة</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{context.khalwa.reason}</p>
          </div>
          {onNavigate && (
            <button
              style={RS.khalwaBtn}
              onClick={() => onNavigate("khalwa")}
            >
              ادخل خلوة
            </button>
          )}
        </div>
      )}

      {/* ── Niyya (Daily Intention) ── */}
      {context?.niyya.hasIntention && context.niyya.intention && (
        <div style={RS.niyyaBar}>
          <span style={{ fontSize: 13 }}>🎯</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            نيتك اليوم: <strong style={{ color: "#c4b5fd" }}>{context.niyya.intention}</strong>
          </span>
        </div>
      )}

      {/* ── Mithaq (Active Pledges) ── */}
      {context?.mithaq.hasPledges && (
        <div style={RS.mithaqBar}>
          <span style={{ fontSize: 13 }}>📜</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            ميثاقك: <strong style={{ color: "#fbbf24" }}>{context.mithaq.pledges[0]?.title}</strong>
            {context.mithaq.pledges.length > 1 && (
              <span style={{ color: "#64748b" }}> +{context.mithaq.pledges.length - 1}</span>
            )}
          </span>
        </div>
      )}

      {/* ── Qinaa (Mask Contrast) ── */}
      {context?.qinaa.hasData && context.qinaa.contrast > 20 && (
        <div style={RS.qinaaBar}>
          <span style={{ fontSize: 13 }}>🎭</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            أصالتك: <strong style={{ color: context.qinaa.overallAuthenticity > 60 ? "#10b981" : "#f59e0b" }}>{context.qinaa.overallAuthenticity}%</strong>
            {context.qinaa.mostMasked && (
              <span> · الأكثر قناعاً: <strong style={{ color: "#ef4444" }}>{context.qinaa.mostMasked}</strong></span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── InsightReveal ───────────────────────────────────────────
interface InsightRevealProps {
  insight: string;
  quranicAnchor?: string;
  stageMeta: typeof STAGE_META[StageId];
  onContinue: () => void;
}

function InsightReveal({ insight, quranicAnchor, stageMeta, onContinue }: InsightRevealProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        ...RS.insightWrapper,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {/* Glow orb */}
      <div style={{ ...RS.glowOrb, background: stageMeta.color + "30" }} />

      <span style={{ fontSize: 48, display: "block", textAlign: "center", marginBottom: 20 }}>
        {stageMeta.icon}
      </span>

      <h2 style={{ ...RS.insightTitle, color: stageMeta.color }}>
        مرحلة {stageMeta.label} اكتملت
      </h2>

      <div style={{ ...RS.insightCard, borderColor: stageMeta.color + "30" }}>
        <p style={RS.insightText}>"{insight}"</p>
      </div>

      {quranicAnchor && (
        <div style={RS.quranicCard}>
          <p style={RS.quranicLabel}>📖 من النص</p>
          <p style={RS.quranicText}>{quranicAnchor}</p>
        </div>
      )}

      <button
        style={{ ...RS.continueBtn, backgroundColor: stageMeta.color }}
        onClick={onContinue}
      >
        واصل الرحلة →
      </button>
    </div>
  );
}

// ─── CompletionScreen ─────────────────────────────────────────
interface CompletionScreenProps {
  pathName: string;
  onReset: () => void;
}

function CompletionScreen({ pathName, onReset }: CompletionScreenProps) {
  return (
    <div style={RS.completionWrapper}>
      <span style={{ fontSize: 64, display: "block", textAlign: "center" }}>🌟</span>
      <h2 style={RS.completionTitle}>رحلتك اكتملت</h2>
      <p style={RS.completionSubtitle}>
        مررت بالمواجهة، والتجلي، والقيادة — مسار{" "}
        <strong style={{ color: "#2dd4bf" }}>{pathName}</strong> لم يعد نظرية،
        هو الآن جزء من تجربتك.
      </p>

      <div style={RS.checkpointCard}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>
          ⏰ موعد المراجعة
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.7 }}>
          بعد 7 أيام ستُسألك المنصة: "هل اتغير شيء؟"
        </p>
      </div>

      <button style={RS.resetBtn} onClick={onReset}>
        🔄 ابدأ رحلة جديدة
      </button>
    </div>
  );
}

// ─── JourneyFlow (Main) ───────────────────────────────────────
interface JourneyFlowProps {
  pathName: string;
  pathColor: string;
  onNavigate?: (screen: string) => void;
  context?: MasaratContext;
}

export default function JourneyFlow({ pathName, pathColor, onNavigate, context }: JourneyFlowProps) {
  const {
    journeySteps,
    currentStepIndex,
    journeyStatus,
    adaptiveDepth,
    actions,
  } = useMasaratStore();

  const currentStep        = useMasaratStore(selectCurrentStep);
  const progress           = useMasaratStore(selectJourneyProgress);
  const completedStageIds  = useMasaratStore(selectCompletedStageIds);

  const stages = Object.values(STAGE_META);

  const handleSubmit = useCallback(
    (answer: string, durationMs: number) => {
      if (!currentStep) return;
      let depth: ResponseDepth = "medium";
      if (durationMs < SURFACE_THRESHOLD_MS) depth = "surface";
      else if (durationMs > DEEP_THRESHOLD_MS) depth = "deep";

      actions.advanceStep({
        stepId: currentStep.id,
        answer,
        depth,
        durationMs,
      });
    },
    [currentStep, actions]
  );

  const handleSkip = useCallback(() => {
    if (!currentStep) return;
    actions.skipStep(currentStep.id);
  }, [currentStep, actions]);

  // ── Complete ──
  if (journeyStatus === "complete") {
    return (
      <CompletionScreen pathName={pathName} onReset={actions.resetJourney} />
    );
  }

  // ── Stage Insight ──
  if (journeyStatus === "stage_insight") {
    // The step that just finished has the insight
    const prevStep = journeySteps[currentStepIndex - 1];
    if (!prevStep?.insight) {
      actions.completeStageInsight();
      return null;
    }
    const stageMeta = STAGE_META[prevStep.stageId];
    return (
      <div style={RS.pageContent}>
        <InsightReveal
          insight={prevStep.insight}
          quranicAnchor={prevStep.quranicAnchor}
          stageMeta={stageMeta}
          onContinue={actions.completeStageInsight}
        />
      </div>
    );
  }

  if (!currentStep) return null;

  const currentStageMeta = STAGE_META[currentStep.stageId];

  return (
    <div style={RS.pageContent}>
      {/* Roadmap */}
      <PathRoadmap
        totalSteps={journeySteps.length}
        currentIndex={currentStepIndex}
        stages={stages}
        completedStageIds={completedStageIds}
      />

      {/* Current step */}
      <StepCard
        key={currentStep.id}
        question={currentStep.question}
        deeperQuestion={currentStep.deeperQuestion}
        recommendedTool={currentStep.recommendedTool}
        stageMeta={currentStageMeta}
        adaptiveDepth={adaptiveDepth}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        onNavigate={onNavigate}
        context={context}
      />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const RS: Record<string, React.CSSProperties> = {
  pageContent: {
    padding: "20px",
  },

  // Roadmap
  roadmapWrapper: {
    marginBottom: 28,
  },
  stageRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 0,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stagePill: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    flex: 1,
    position: "relative" as const,
  },
  stageLabel: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 3,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  dotsRow: {
    display: "flex",
    alignItems: "center",
    gap: 0,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    zIndex: 1,
  },
  connector: {
    height: 2,
    width: 18,
    borderRadius: 1,
  },
  stageConnector: {
    position: "absolute" as const,
    top: "50%",
    right: 0,
    width: "100%",
    height: 2,
    background: "rgba(255,255,255,0.05)",
    zIndex: 0,
  },
  progressBar: {
    height: 3,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ef4444, #f59e0b, #2dd4bf)",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    opacity: 0.4,
    textAlign: "center" as const,
    margin: "6px 0 0",
  },

  // StepCard
  stepCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid",
    marginBottom: 16,
  },
  stageBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 16,
  },
  question: {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.65,
    margin: "0 0 16px",
    color: "#f1f5f9",
  },
  deeperHint: {
    fontSize: 12,
    color: "#f59e0b",
    margin: "0 0 12px",
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.2)",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e2e8f0",
    fontSize: 15,
    lineHeight: 1.6,
    resize: "none" as const,
    outline: "none",
    fontFamily: "'Tajawal', 'Inter', sans-serif",
    boxSizing: "border-box" as const,
    direction: "rtl",
  },
  actions: {
    display: "flex",
    gap: 10,
    marginTop: 14,
    alignItems: "center",
  },
  submitBtn: {
    flex: 1,
    padding: "13px 20px",
    borderRadius: 13,
    border: "none",
    fontSize: 15,
    fontWeight: 800,
    fontFamily: "'Tajawal', 'Inter', sans-serif",
    transition: "all 0.25s ease",
  },
  skipBtn: {
    padding: "13px 16px",
    borderRadius: 13,
    border: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "transparent",
    color: "#475569",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'Tajawal', 'Inter', sans-serif",
  },
  depthHint: {
    fontSize: 11,
    color: "#94a3b8",
    opacity: 0.6,
    marginTop: 10,
    textAlign: "center" as const,
  },

  // InsightReveal
  insightWrapper: {
    padding: "24px 20px",
    textAlign: "center" as const,
    position: "relative" as const,
    overflow: "hidden",
  },
  glowOrb: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 300,
    height: 300,
    borderRadius: "50%",
    filter: "blur(80px)",
    zIndex: 0,
    pointerEvents: "none" as const,
  },
  insightTitle: {
    fontSize: 22,
    fontWeight: 900,
    margin: "0 0 20px",
    position: "relative" as const,
    zIndex: 1,
  },
  insightCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid",
    marginBottom: 16,
    position: "relative" as const,
    zIndex: 1,
  },
  insightText: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.7,
    margin: 0,
    color: "#f1f5f9",
    fontStyle: "italic",
  },
  quranicCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(45,212,191,0.05)",
    border: "1px solid rgba(45,212,191,0.15)",
    marginBottom: 24,
    position: "relative" as const,
    zIndex: 1,
  },
  quranicLabel: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.6,
  },
  quranicText: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.7,
    color: "#2dd4bf",
  },
  continueBtn: {
    padding: "14px 32px",
    borderRadius: 14,
    border: "none",
    fontSize: 16,
    fontWeight: 900,
    color: "#0a0e1f",
    cursor: "pointer",
    fontFamily: "'Tajawal', 'Inter', sans-serif",
    position: "relative" as const,
    zIndex: 1,
  },

  // Completion
  completionWrapper: {
    padding: "32px 20px",
    textAlign: "center" as const,
  },
  completionTitle: {
    fontSize: 26,
    fontWeight: 900,
    margin: "16px 0 12px",
    background: "linear-gradient(135deg, #2dd4bf, #f59e0b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  completionSubtitle: {
    fontSize: 15,
    lineHeight: 1.7,
    opacity: 0.7,
    margin: "0 0 24px",
  },
  checkpointCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.06)",
    border: "1px solid rgba(245,158,11,0.15)",
    marginBottom: 24,
  },
  resetBtn: {
    padding: "14px 28px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Tajawal', 'Inter', sans-serif",
  },

  // ToolRecommendation
  toolCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid",
    backdropFilter: "blur(12px)",
  },
  toolHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  toolLabel: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
  },
  toolReason: {
    margin: "4px 0 0",
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.5,
  },
  toolActions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  toolOpenBtn: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: 11,
    border: "none",
    fontSize: 13,
    fontWeight: 800,
    color: "#0a0e1f",
    cursor: "pointer",
    fontFamily: "'Tajawal', 'Inter', sans-serif",
    transition: "all 0.2s ease",
  },
  toolDismissBtn: {
    padding: "10px 14px",
    borderRadius: 11,
    border: "1px solid rgba(255,255,255,0.06)",
    backgroundColor: "transparent",
    color: "#64748b",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Tajawal', 'Inter', sans-serif",
  },

  // Context-aware UI
  supportMsg: {
    padding: "12px 14px",
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.15)",
    marginBottom: 14,
  },
  supportText: {
    margin: 0,
    fontSize: 13,
    color: "#c4b5fd",
    lineHeight: 1.6,
    fontFamily: "'Tajawal', 'Inter', sans-serif",
  },
  spiritualAnchor: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  khalwaSuggestion: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    padding: "10px 14px",
    borderRadius: 12,
    backgroundColor: "rgba(167,139,250,0.06)",
    border: "1px solid rgba(167,139,250,0.12)",
  },
  khalwaBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "rgba(167,139,250,0.2)",
    color: "#c4b5fd",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Tajawal', 'Inter', sans-serif",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  },
  niyyaBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.04)",
    border: "1px solid rgba(99,102,241,0.08)",
  },
  mithaqBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "rgba(251,191,36,0.04)",
    border: "1px solid rgba(251,191,36,0.10)",
  },
  qinaaBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: "8px 12px",
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.04)",
    border: "1px solid rgba(239,68,68,0.08)",
  },
};
