"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, Pause, Play, RotateCcw } from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { getLiveSession } from "../api";
import type { CircleNode, LiveLanguage, LiveReplayFrameRecord, LiveSessionDetail } from "../types";

const NODE_POSITIONS = {
  1: { x: 24, y: 66 },
  2: { x: 50, y: 70 },
  3: { x: 76, y: 34 },
};

const DEFAULT_LABELS = {
  ar: { 1: "الوعي", 2: "العلم", 3: "الحقيقة" },
  en: { 1: "Awareness", 2: "Knowledge", 3: "Truth" },
} as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function formatDuration(ms: number, lang: LiveLanguage) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (lang === "ar") {
    return minutes > 0 ? `${minutes}د ${seconds}ث` : `${seconds}ث`;
  }
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function metricPercent(value: number | undefined) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function sortFrames(frames: LiveReplayFrameRecord[]) {
  return [...frames].sort((left, right) => (left.seq || 0) - (right.seq || 0));
}

function buildStepTiming(frames: LiveReplayFrameRecord[]) {
  if (frames.length === 0) return [];
  const firstTimestamp = frames[0].created_at ? new Date(frames[0].created_at).getTime() : 0;
  return frames.map((frame, index) => {
    const timestamp = frame.created_at ? new Date(frame.created_at).getTime() : 0;
    const derived = firstTimestamp ? Math.max(0, timestamp - firstTimestamp) : index * 900;
    return {
      ...frame,
      atMs: derived,
    };
  });
}

async function exportReplayJson(sessionId: string, frames: Array<LiveReplayFrameRecord & { atMs: number }>) {
  const payload = {
    sessionId,
    exportedAt: new Date().toISOString(),
    steps: frames.map((frame) => ({
      seq: frame.seq,
      atMs: frame.atMs,
      frame: frame.frame,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `dawayir-replay-${sessionId}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function LiveReplayPage({ sessionId }: { sessionId: string }) {
  const [detail, setDetail] = useState<LiveSessionDetail | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    void getLiveSession(sessionId)
      .then((result) => {
        setDetail(result);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "replay_failed"));
  }, [sessionId]);

  const lang = (detail?.session.language || "ar") as LiveLanguage;

  const frames = useMemo(() => buildStepTiming(sortFrames(detail?.replayFrames || [])), [detail?.replayFrames]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(frames.length > 1);
  }, [frames]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1 || currentIndex >= frames.length - 1) return undefined;
    const currentStep = frames[currentIndex];
    const nextStep = frames[currentIndex + 1];
    const rawDelay = Math.max(800, (nextStep?.atMs || 0) - (currentStep?.atMs || 0));
    const delayMs = clamp(Math.round(rawDelay * 0.55), 700, 1800);
    const timer = window.setTimeout(() => {
      setCurrentIndex((index) => Math.min(index + 1, frames.length - 1));
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [currentIndex, frames, isPlaying]);

  useEffect(() => {
    if (currentIndex >= frames.length - 1) {
      setIsPlaying(false);
    }
  }, [currentIndex, frames.length]);

  const currentStep = frames[currentIndex] || null;
  const currentFrame = currentStep?.frame || null;

  const nodes = useMemo(() => {
    const labels = DEFAULT_LABELS[lang] || DEFAULT_LABELS.en;
    const byId = new Map((currentFrame?.circles || []).map((node) => [Number(node.id), node]));
    return [1, 2, 3].map((id) => {
      const node = byId.get(id) as CircleNode | undefined;
      return {
        id,
        label: node?.label || labels[id as 1 | 2 | 3],
        radius: clamp(Number(node?.radius) || 60, 30, 100),
        color:
          typeof node?.color === "string"
            ? node.color
            : id === 1
              ? "#38B2D8"
              : id === 2
                ? "#2ECC71"
                : "#9B59B6",
        ...NODE_POSITIONS[id as 1 | 2 | 3],
      };
    });
  }, [currentFrame?.circles, lang]);

  const focusId = useMemo(
    () => currentFrame?.circles?.slice().sort((a, b) => b.radius - a.radius)[0]?.id ?? null,
    [currentFrame?.circles],
  );

  const progress = frames.length > 1 ? currentIndex / (frames.length - 1) : 1;
  const totalDurationMs = frames[frames.length - 1]?.atMs || 0;
  const replayReason =
    currentFrame?.whyNowLine ||
    currentFrame?.circles?.slice().sort((a, b) => b.radius - a.radius)[0]?.reason ||
    (lang === "ar" ? "لا يوجد وصف محفوظ لهذه اللحظة." : "No reason captured for this moment.");

  const replayTags = [
    detail?.session.mode || "standard",
    currentFrame?.journeyStage || "Overwhelmed",
    currentFrame?.spawnedTopics?.length ? `${currentFrame.spawnedTopics.length} topics` : lang === "ar" ? "بدون Topics" : "No topics",
  ];

  const handleTogglePlayback = () => {
    if (frames.length <= 1) return;
    if (currentIndex >= frames.length - 1) {
      setCurrentIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((value) => !value);
  };

  const handleExport = async () => {
    if (!frames.length || isExporting) return;
    setIsExporting(true);
    try {
      await exportReplayJson(sessionId, frames);
    } finally {
      setIsExporting(false);
    }
  };

  if (error) {
    return (
      <div className="complete-overlay min-h-screen px-4 py-12 text-white">
        <div className="complete-card mx-auto text-center">
          <h1 className="complete-title">{error === "AUTH_REQUIRED" ? "ابدأ بعد تسجيل الدخول" : "تعذر فتح إعادة الجلسة"}</h1>
          <p className="complete-subtitle">
            {error === "AUTH_REQUIRED"
              ? "لا يمكن عرض Replay إلا من داخل حسابك لأن الجلسة مرتبطة بالذاكرة والـ artifacts."
              : error}
          </p>
          <div className="complete-actions-row">
            <button className="primary-btn complete-action-btn" onClick={() => assignUrl("/dawayir-live/history")}>
              الرجوع إلى بنك الذاكرة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!detail || !currentFrame) {
    return <div className="min-h-screen bg-slate-950 p-8 text-white">Loading replay...</div>;
  }

  return (
    <div className="replay-page-shell min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="replay-page-topbar">
          <button
            type="button"
            className="live-icon-btn replay-back-btn"
            onClick={() => assignUrl("/dawayir-live/history")}
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="replay-page-hero">
            <span className="presentation-badge">{lang === "ar" ? "Replay" : "Replay"}</span>
            <h1>{detail.session.title || (lang === "ar" ? "إعادة الجلسة" : "Session Replay")}</h1>
            <p>
              {lang === "ar"
                ? `اتسجل ${frames.length} لحظة خلال ${formatDuration(totalDurationMs, lang)} ويمكنك الرجوع لأي نقطة بدقة.`
                : `${frames.length} captured moments across ${formatDuration(totalDurationMs, lang)} and you can jump to any point precisely.`}
            </p>
          </div>
        </div>

        <section className="session-replay-section">
          <div className="session-replay-header">
            <div>
              <h3>{lang === "ar" ? "إعادة الجلسة" : "Session Replay"}</h3>
              <p>
                {lang === "ar"
                  ? `الخطوة ${currentIndex + 1} من ${frames.length}`
                  : `Step ${currentIndex + 1} of ${frames.length}`}
              </p>
            </div>

            <div className="presentation-toolbar-actions">
              <button className="replay-control-btn export" onClick={handleExport} disabled={isExporting}>
                <Download className="h-4 w-4" />
                {isExporting ? (lang === "ar" ? "جاري التصدير..." : "Exporting...") : lang === "ar" ? "نزّل Replay" : "Export Replay"}
              </button>
              <button className="replay-control-btn" onClick={handleTogglePlayback}>
                {isPlaying ? <Pause className="h-4 w-4" /> : currentIndex >= frames.length - 1 ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying
                  ? lang === "ar"
                    ? "إيقاف"
                    : "Pause"
                  : currentIndex >= frames.length - 1
                    ? lang === "ar"
                      ? "أعد من البداية"
                      : "Replay"
                    : lang === "ar"
                      ? "تشغيل"
                      : "Play"}
              </button>
            </div>
          </div>

          <div className="session-replay-shell">
            <div className="session-replay-canvas">
              <svg viewBox="0 0 100 100" className="session-replay-svg" aria-label={lang === "ar" ? "إعادة تمثيل الدوائر" : "Circle replay canvas"}>
                <defs>
                  <filter id="replayGlow">
                    <feGaussianBlur stdDeviation="2.4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[1].x} y2={nodes[1].y} className="replay-link" />
                <line x1={nodes[1].x} y1={nodes[1].y} x2={nodes[2].x} y2={nodes[2].y} className="replay-link" />
                <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[2].x} y2={nodes[2].y} className="replay-link replay-link-faint" />

                {nodes.map((node) => {
                  const safeRadius = Number.isFinite(node.radius) ? node.radius : 50;
                  const svgRadius = 6 + ((safeRadius - 30) / 70) * 11;
                  const isFocused = Number(focusId) === node.id;
                  return (
                    <g key={node.id} className={`replay-node ${isFocused ? "focused" : ""}`} style={{ ["--replay-color" as string]: node.color }}>
                      <circle cx={node.x} cy={node.y} r={svgRadius + 2.2} className="replay-node-glow" />
                      <circle cx={node.x} cy={node.y} r={svgRadius} className="replay-node-core" filter="url(#replayGlow)" />
                      <circle cx={node.x - (svgRadius * 0.32)} cy={node.y - (svgRadius * 0.32)} r={Math.max(1.4, svgRadius * 0.18)} className="replay-node-shine" />
                      <text x={node.x} y={node.y + 0.8} className="replay-node-label">{node.label}</text>
                    </g>
                  );
                })}
              </svg>

              <div className="session-replay-progress">
                <div className="session-replay-progress-bar" style={{ transform: `scaleX(${progress || 0})` }} />
              </div>

              <input
                type="range"
                min={0}
                max={Math.max(0, frames.length - 1)}
                value={currentIndex}
                onChange={(event) => {
                  setCurrentIndex(Number(event.target.value));
                  setIsPlaying(false);
                }}
                className="replay-range-input"
              />
            </div>

            <div className="session-replay-inspector">
              <div className="session-replay-meta">
                <span>{lang === "ar" ? `الخطوة ${currentIndex + 1}/${frames.length}` : `Step ${currentIndex + 1}/${frames.length}`}</span>
                <strong>{formatDuration(currentStep?.atMs || 0, lang)}</strong>
              </div>

              <p className="session-replay-reason">{replayReason}</p>

              <div className="session-replay-tags">
                {replayTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="session-replay-metrics">
                <div>
                  <small>{lang === "ar" ? "التوازن" : "Equilibrium"}</small>
                  <strong>{metricPercent(currentFrame.metrics?.equilibriumScore)}</strong>
                </div>
                <div>
                  <small>{lang === "ar" ? "الضغط" : "Overload"}</small>
                  <strong>{metricPercent(currentFrame.metrics?.overloadIndex)}</strong>
                </div>
                <div>
                  <small>{lang === "ar" ? "الوضوح" : "Clarity"}</small>
                  <strong>{metricPercent(currentFrame.metrics?.clarityDelta)}</strong>
                </div>
              </div>

              <div className="replay-side-card">
                <div className="replay-side-label">{lang === "ar" ? "Journey Stage" : "Journey Stage"}</div>
                <div className="replay-side-value">{currentFrame.journeyStage}</div>
              </div>

              <div className="replay-side-card">
                <div className="replay-side-label">{lang === "ar" ? "Topics" : "Topics"}</div>
                <div className="replay-side-list">
                  {currentFrame.spawnedTopics.length === 0
                    ? <span>{lang === "ar" ? "لا توجد مواضيع مرسومة هنا." : "No mapped topics at this step."}</span>
                    : currentFrame.spawnedTopics.slice(0, 4).map((topic) => <span key={topic.id}>{topic.topic}</span>)}
                </div>
              </div>

              <div className="session-replay-timeline">
                {frames.map((step, index) => (
                  <button
                    key={`${step.seq}-${index}`}
                    type="button"
                    className={`session-replay-dot ${index === currentIndex ? "is-active" : ""}`}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsPlaying(false);
                    }}
                    title={`${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
