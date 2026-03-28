"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Expand,
  GalleryVerticalEnd,
  GitCompareArrows,
  PlayCircle,
  ScanSearch,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { createLiveShare, getLiveSession, listLiveSessions } from "../api";
import type {
  CircleNode,
  LiveLanguage,
  LiveSessionArtifactRecord,
  LiveSessionDetail,
  LiveSessionRecord,
} from "../types";

type TruthContractPayload = {
  promises?: unknown;
  reminder?: unknown;
};

type LoopRecallPayload = {
  trigger?: unknown;
  interruption?: unknown;
  reward?: unknown;
};

type HighlightTone = "cyan" | "gold" | "violet";

type SessionModeFilter = "all" | "standard" | "demo" | "hybrid" | "couple";
type SessionStatusFilter = "all" | "completed" | "active" | "error";
type SessionPeriodFilter = "all" | "30d" | "90d" | "365d";

interface HighlightMoment {
  id: string;
  label: string;
  body: string;
  meta?: string;
  tone: HighlightTone;
}

const FALLBACK_LABELS = {
  ar: { 1: "Ø§Ù„ÙˆØ¹ÙŠ", 2: "Ø§Ù„Ø¹Ù„Ù…", 3: "Ø§Ù„Ø­Ù‚ÙŠÙ‚Ø©" },
  en: { 1: "Awareness", 2: "Knowledge", 3: "Truth" },
} as const;

function sortSessionsByRecent(list: LiveSessionRecord[]) {
  return [...list].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
}

function formatPercent(value: number | undefined) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function formatDeltaPercent(value: number | undefined) {
  const numeric = Math.round((Number(value) || 0) * 100);
  return `${numeric >= 0 ? "+" : ""}${numeric}%`;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function getArtifactContent<T extends Record<string, unknown>>(
  artifacts: LiveSessionArtifactRecord[],
  artifactType: LiveSessionArtifactRecord["artifact_type"],
) {
  const artifact = artifacts.find((entry) => entry.artifact_type === artifactType);
  return artifact?.content && typeof artifact.content === "object" ? (artifact.content as T) : null;
}

function getLatestSnapshot(detail: LiveSessionDetail | null) {
  if (!detail?.replayFrames?.length) return null;
  const sorted = [...detail.replayFrames].sort((left, right) => (left.seq || 0) - (right.seq || 0));
  return sorted[sorted.length - 1]?.frame ?? null;
}

function extractTranscriptText(payload: Record<string, unknown>) {
  if (typeof payload.text === "string") return payload.text;
  if (typeof payload.transcript === "string") return payload.transcript;
  if (typeof payload.message === "string") return payload.message;
  if (payload.entry && typeof payload.entry === "object") {
    const entry = payload.entry as Record<string, unknown>;
    if (typeof entry.text === "string") return entry.text;
  }
  return null;
}

function buildHighlightMoments(detail: LiveSessionDetail | null, lang: LiveLanguage): HighlightMoment[] {
  if (!detail) return [];

  const summary = detail.session.summary;
  const breakthroughs = (summary?.breakthroughs ?? []).slice(0, 2).map((item, index) => ({
    id: `breakthrough-${index}`,
    label: "Breakthrough",
    body: item,
    tone: "gold" as const,
  }));

  const transcriptMoments: HighlightMoment[] = [];
  detail.events
    .filter((event) => event.event_type === "transcript")
    .forEach((event, index) => {
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      const text = extractTranscriptText(payload);
      if (!text || text.trim().length < 18 || transcriptMoments.length >= 2) {
        return;
      }

      transcriptMoments.push({
        id: `transcript-${index}`,
        label:
          event.actor === "agent"
            ? lang === "ar"
              ? "ØµÙˆØª Ø§Ù„Ù…Ø±Ø¢Ø©"
              : "Mirror Voice"
            : lang === "ar"
              ? "ØµÙˆØªÙƒ"
              : "Your Voice",
        body: text.trim(),
        meta:
          typeof payload.timestamp === "number"
            ? new Date(payload.timestamp).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US")
            : undefined,
        tone: event.actor === "agent" ? "cyan" : "violet",
      });
    });

  const snapshot = getLatestSnapshot(detail);
  const whyNow = typeof snapshot?.whyNowLine === "string" && snapshot.whyNowLine.trim().length > 0
    ? [{ id: "why-now", label: "Why Now", body: snapshot.whyNowLine.trim(), tone: "cyan" as const }]
    : [];

  return [...breakthroughs, ...transcriptMoments, ...whyNow].slice(0, 5);
}

function buildCircleDiffs(
  currentCircles: CircleNode[] | undefined,
  previousCircles: CircleNode[] | undefined,
  lang: LiveLanguage,
) {
  const labels = FALLBACK_LABELS[lang] ?? FALLBACK_LABELS.en;
  const currentMap = new Map((currentCircles ?? []).map((circle) => [Number(circle.id), circle]));
  const previousMap = new Map((previousCircles ?? []).map((circle) => [Number(circle.id), circle]));

  return [1, 2, 3].map((id) => {
    const current = currentMap.get(id);
    const previous = previousMap.get(id);
    const radius = Number(current?.radius) || 0;
    const previousRadius = Number(previous?.radius) || 0;
    return {
      id,
      label: current?.label || previous?.label || labels[id as 1 | 2 | 3],
      color: current?.color || previous?.color || (id === 1 ? "#38B2D8" : id === 2 ? "#2ECC71" : "#9B59B6"),
      current: radius,
      previous: previousRadius,
      delta: radius - previousRadius,
    };
  });
}

function TrendSparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="memory-sparkline-empty">No multi-session trend yet.</div>;
  }

  const width = 220;
  const height = 64;
  const padding = 8;
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, -1);
  const range = Math.max(1, maxValue - minValue);
  const step = (width - padding * 2) / Math.max(1, values.length - 1);
  const path = values
    .map((value, index) => {
      const x = padding + step * index;
      const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="memory-sparkline" aria-hidden="true">
      <path d={path} className="memory-sparkline-path" />
    </svg>
  );
}

function getModeLabel(mode: string, isArabic: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    standard: { ar: "ÙØ±Ø¯ÙŠØ©", en: "Individual" },
    demo: { ar: "ØªØ¬Ø±ÙŠØ¨ÙŠØ©", en: "Demo" },
    hybrid: { ar: "Ù‡Ø¬ÙŠÙ†Ø©", en: "Hybrid" },
    couple: { ar: "Ø¬Ù…Ø§Ø¹ÙŠØ©", en: "Couple" },
  };
  const entry = labels[mode];
  return entry ? (isArabic ? entry.ar : entry.en) : mode;
}

function isWithinPeriod(updatedAt: string, period: SessionPeriodFilter) {
  if (period === "all") return true;
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(updatedAt).getTime() >= threshold;
}

export default function LiveHistoryPage() {
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<LiveSessionDetail | null>(null);
  const [compareDetail, setCompareDetail] = useState<LiveSessionDetail | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [modeFilter, setModeFilter] = useState<SessionModeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<SessionPeriodFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [judgeMode, setJudgeMode] = useState(false);
  const [presentationFullscreen, setPresentationFullscreen] = useState(false);
  const [demoRouteActive, setDemoRouteActive] = useState(false);
  const [demoRouteStep, setDemoRouteStep] = useState(-1);

  const presentationRootRef = useRef<HTMLDivElement | null>(null);
  const overviewRef = useRef<HTMLElement | null>(null);
  const replayRef = useRef<HTMLElement | null>(null);
  const highlightRef = useRef<HTMLElement | null>(null);
  const signatureRef = useRef<HTMLElement | null>(null);
  const judgeRef = useRef<HTMLElement | null>(null);
  const diffRef = useRef<HTMLElement | null>(null);
  const demoTimersRef = useRef<number[]>([]);

  useEffect(() => {
    void listLiveSessions()
      .then((result) => {
        const recent = sortSessionsByRecent(result.sessions);
        setSessions(result.sessions);
        setSelectedId(recent[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "history_failed"));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }

    void getLiveSession(selectedId)
      .then(setSelectedDetail)
      .catch(() => setSelectedDetail(null));
  }, [selectedId]);

  const recentSessions = useMemo(() => sortSessionsByRecent(sessions), [sessions]);
  const compareCandidate = useMemo(() => {
    if (!selectedId) return null;
    const selectedIndex = recentSessions.findIndex((session) => session.id === selectedId);
    if (selectedIndex === -1) return recentSessions[1] ?? null;
    return recentSessions[selectedIndex + 1] ?? null;
  }, [recentSessions, selectedId]);

  useEffect(() => {
    if (!compareCandidate?.id || compareCandidate.id === selectedId) {
      setCompareDetail(null);
      return;
    }

    void getLiveSession(compareCandidate.id)
      .then(setCompareDetail)
      .catch(() => setCompareDetail(null));
  }, [compareCandidate?.id, selectedId]);

  useEffect(() => {
    const handleFullscreenChange = () => setPresentationFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = sessions.filter((session) => {
      const title = `${session.title || ""} ${session.summary?.headline || ""}`.toLowerCase();
      const matchesQuery = title.includes(query);
      const matchesMode = modeFilter === "all" || session.mode === modeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? session.status !== "completed" && session.status !== "error"
          : session.status === statusFilter);
      const matchesPeriod = isWithinPeriod(session.updated_at, periodFilter);
      return matchesQuery && matchesMode && matchesStatus && matchesPeriod;
    });

    if (sortBy === "name") {
      return [...list].sort((left, right) => (left.title || "").localeCompare(right.title || ""));
    }

    return sortSessionsByRecent(list);
  }, [modeFilter, periodFilter, search, sessions, sortBy, statusFilter]);

  const lang = (selectedDetail?.session.language || compareDetail?.session.language || "ar") as LiveLanguage;
  const isArabic = lang === "ar";

  const presentationSteps = useMemo(
    () => [
      { key: "overview", label: "Overview", ref: overviewRef },
      { key: "replay", label: "Replay", ref: replayRef },
      { key: "highlight", label: "Highlight Reel", ref: highlightRef },
      { key: "signature", label: "Signature Moment", ref: signatureRef },
      { key: "judge", label: "Judge Mode", ref: judgeRef },
      { key: "diff", label: "Cross-Session Diff", ref: diffRef },
    ],
    [],
  );

  useEffect(() => {
    demoTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    demoTimersRef.current = [];

    if (!demoRouteActive || !selectedDetail) {
      if (!demoRouteActive) setDemoRouteStep(-1);
      return;
    }

    presentationSteps.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        setDemoRouteStep(index);
        step.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, index * 1700);
      demoTimersRef.current.push(timer);
    });

    const endTimer = window.setTimeout(() => {
      setDemoRouteActive(false);
      setDemoRouteStep(-1);
    }, presentationSteps.length * 1700 + 400);
    demoTimersRef.current.push(endTimer);

    return () => {
      demoTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      demoTimersRef.current = [];
    };
  }, [demoRouteActive, presentationSteps, selectedDetail]);

  const avgClarity = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((total, session) => total + (session.metrics?.clarityDelta ?? 0), 0);
    return Math.round((sum / sessions.length) * 100);
  }, [sessions]);

  const trendValues = useMemo(
    () => recentSessions.slice(0, 8).reverse().map((session) => Math.round((session.metrics?.clarityDelta ?? 0) * 100)),
    [recentSessions],
  );

  const completedCount = sessions.filter((session) => session.status === "completed").length;
  const sharedCount = sessions.filter((session) => session.status === "completed").length;
  const latestDate = recentSessions[0]?.updated_at
    ? new Date(recentSessions[0].updated_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "â€”";

  const snapshot = useMemo(() => getLatestSnapshot(selectedDetail), [selectedDetail]);
  const compareSnapshot = useMemo(() => getLatestSnapshot(compareDetail), [compareDetail]);
  const truthContract = useMemo(
    () => getArtifactContent<TruthContractPayload>(selectedDetail?.artifacts ?? [], "truth_contract"),
    [selectedDetail?.artifacts],
  );
  const loopRecall = useMemo(
    () => getArtifactContent<LoopRecallPayload>(selectedDetail?.artifacts ?? [], "loop_recall"),
    [selectedDetail?.artifacts],
  );
  const highlightMoments = useMemo(() => buildHighlightMoments(selectedDetail, lang), [lang, selectedDetail]);
  const circleDiffs = useMemo(
    () => buildCircleDiffs(snapshot?.circles, compareSnapshot?.circles, lang),
    [compareSnapshot?.circles, lang, snapshot?.circles],
  );

  const currentMetrics = selectedDetail?.session.metrics ?? snapshot?.metrics ?? null;
  const previousMetrics = compareDetail?.session.metrics ?? compareSnapshot?.metrics ?? null;
  const summary = selectedDetail?.session.summary ?? null;
  const signatureLine =
    summary?.headline ||
    (typeof truthContract?.reminder === "string" ? truthContract.reminder : null) ||
    snapshot?.whyNowLine ||
    (isArabic ? "Ø§Ù„Ù…Ø±Ø¢Ø© Ø³Ø¬Ù‘Ù„Øª Ù„Ø­Ø¸Ø© ÙˆØ¶ÙˆØ­ ØªØ³ØªØ­Ù‚ Ø£Ù† ØªÙØ¹Ø§Ø¯." : "The mirror captured a moment worth replaying.");

  const judgeSignals = [
    {
      label: "Clarity Shift",
      value: formatDeltaPercent(currentMetrics?.clarityDelta),
      tone: "violet",
      note: previousMetrics
        ? `${formatDeltaPercent((currentMetrics?.clarityDelta ?? 0) - (previousMetrics?.clarityDelta ?? 0))} vs previous`
        : isArabic
          ? "Ø£ÙˆÙ„ Ø¬Ù„Ø³Ø© Ù…Ø­ÙÙˆØ¸Ø© Ù„Ù„Ù…Ù‚Ø§Ø±Ù†Ø©."
          : "First saved session for comparison.",
    },
    {
      label: "Equilibrium",
      value: formatPercent(currentMetrics?.equilibriumScore),
      tone: "emerald",
      note: snapshot?.journeyStage || (isArabic ? "Ø¨Ø¯ÙˆÙ† stage Ù…Ø­ÙÙˆØ¸" : "No stage captured"),
    },
    {
      label: "Truth Contract",
      value: `${asStringArray(truthContract?.promises).length}`,
      tone: "cyan",
      note:
        typeof truthContract?.reminder === "string"
          ? truthContract.reminder
          : isArabic
            ? "Ù„Ù… ÙŠØªÙ… Ø¥Ù†Ø´Ø§Ø¡ reminder Ø¨Ø¹Ø¯."
            : "No reminder yet.",
    },
    {
      label: "Artifacts",
      value: `${selectedDetail?.artifacts.length ?? 0}`,
      tone: "gold",
      note: isArabic ? "Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ© ÙˆØ§Ù„Ø¹Ø±Ø¶." : "Ready for sharing and review.",
    },
  ];

  const diffMetrics = [
    {
      label: "Clarity Î”",
      current: formatDeltaPercent(currentMetrics?.clarityDelta),
      previous: formatDeltaPercent(previousMetrics?.clarityDelta),
      delta: Math.round(((currentMetrics?.clarityDelta ?? 0) - (previousMetrics?.clarityDelta ?? 0)) * 100),
    },
    {
      label: "Equilibrium",
      current: formatPercent(currentMetrics?.equilibriumScore),
      previous: formatPercent(previousMetrics?.equilibriumScore),
      delta: Math.round(((currentMetrics?.equilibriumScore ?? 0) - (previousMetrics?.equilibriumScore ?? 0)) * 100),
    },
    {
      label: "Overload",
      current: formatPercent(currentMetrics?.overloadIndex),
      previous: formatPercent(previousMetrics?.overloadIndex),
      delta: Math.round(((currentMetrics?.overloadIndex ?? 0) - (previousMetrics?.overloadIndex ?? 0)) * 100),
    },
  ];

  const archiveInsights = useMemo(() => {
    const totalHours = sessions.reduce((total, session) => {
      const minutes = Number((session as LiveSessionRecord & { session_duration_minutes?: number }).session_duration_minutes ?? 0) || 0;
      return total + minutes / 60;
    }, 0);

    const insightPoints = sessions.reduce((total, session) => {
      const clarity = Number(session.metrics?.clarityDelta ?? 0) || 0;
      const equilibrium = Number(session.metrics?.equilibriumScore ?? 0) || 0;
      return total + Math.round((clarity + equilibrium) * 120);
    }, 0);

    const bestLift = recentSessions.reduce((best, session) => {
      const lift = Number(session.metrics?.clarityDelta ?? 0) || 0;
      return Math.max(best, lift);
    }, 0);

    const latestSession = recentSessions[0];

    return {
      totalHours: totalHours.toFixed(1),
      insightPoints,
      bestLift: Math.round(bestLift * 100),
      latestSessionLabel: latestSession
        ? `${latestSession.title || (isArabic ? "Ø¬Ù„Ø³Ø© Ø¯ÙˆØ§ÙŠØ± Ù„Ø§ÙŠÙ" : "Dawayir Live Session")} â€¢ ${new Date(latestSession.updated_at).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
            month: "short",
            day: "numeric",
          })}`
        : isArabic
          ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø§Øª Ù…Ø­ÙÙˆØ¸Ø© Ø¨Ø¹Ø¯"
          : "No sessions saved yet",
    };
  }, [isArabic, recentSessions, sessions]);

  const handleToggleFullscreen = async () => {
    if (!presentationRootRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }
    await presentationRootRef.current.requestFullscreen().catch(() => undefined);
  };

  const handleShare = async () => {
    if (!selectedDetail) return;
    const result = await createLiveShare(selectedDetail.session.id).catch(() => null);
    if (result?.url) {
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
  };

  const activeAccessRoles =
    selectedDetail?.access.map((entry) => entry.access_role).join(" â€¢ ") || (isArabic ? "owner" : "owner");

  return (
    <div className="memory-bank-shell min-h-screen text-white">
      <div className="mx-auto max-w-[92rem] px-4 py-10">
        <div className="memory-bank-topbar">
          <div className="memory-bank-hero">
            <span className="presentation-badge">Memory Bank</span>
            <h1>{isArabic ? "Ø¨Ù†Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø©" : "Memory Bank"}</h1>
            <p>
              {isArabic
                ? "Ù†Ø³Ø®Ø© Ø£Ù‚Ø±Ø¨ Ø¥Ù„Ù‰ DashboardView Ø§Ù„Ø£ØµÙ„ÙŠ: Ø£Ø±Ø´ÙŠÙ Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ø¹Ù„Ù‰ Ø§Ù„ÙŠØ³Ø§Ø±ØŒ ÙˆPresentation OS Ø¹Ù„Ù‰ Ø§Ù„ÙŠÙ…ÙŠÙ† Ù…Ø¹ Replay ÙˆHighlight Reel ÙˆJudge Mode ÙˆCross-Session Diff."
                : "A closer DashboardView parity: archived sessions on the left, with Presentation OS on the right for Replay, Highlight Reel, Judge Mode, and Cross-Session Diff."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="primary-btn memory-bank-primary-btn rounded-full px-5 py-2.5 transition-transform hover:-translate-y-0.5" onClick={() => assignUrl("/dawayir-live")}>
              {isArabic ? "Ø§Ø¨Ø¯Ø£ Ø¬Ù„Ø³Ø© Ø¬Ø¯ÙŠØ¯Ø©" : "Start New Session"}
            </button>
            <button
              type="button"
              className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-100 transition-transform hover:-translate-y-0.5"
              onClick={() => assignUrl("/dawayir-live/annual-report")}
            >
              {isArabic ? "خطة النمو 2025" : "Growth Plan 2025"}
            </button>
          </div>
          <p className="mt-2 text-sm text-white/55">
            {isArabic ? "يمكنك بدء جلسة جديدة أو فتح خطة النمو السنوية المبنية على أرشيفك." : "You can start a new session or open your annual growth plan built from the archive."}
          </p>
        </div>

        {error && (
          <div className="memory-bank-alert">
            {error === "AUTH_REQUIRED"
              ? isArabic
                ? "ÙŠØ¬Ø¨ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù„Ø¹Ø±Ø¶ Ø¨Ù†Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø© ÙˆØ§Ù„Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©."
                : "You need to sign in to view the memory bank and saved sessions."
              : error}
          </div>
        )}

        <div className="memory-bank-stats">
          <article className="memory-stat-card">
            <span>{isArabic ? "Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©" : "Saved Sessions"}</span>
            <strong>{sessions.length}</strong>
            <small>{isArabic ? "ÙƒÙ„ Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ø¹Ø±Ø¶ ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ´ØºÙŠÙ„." : "All sessions available for playback and review."}</small>
          </article>

          <article className="memory-stat-card">
            <span>{isArabic ? "Ù…ØªÙˆØ³Ø· Ø§Ù„ÙˆØ¶ÙˆØ­" : "Average Clarity"}</span>
            <strong>{avgClarity >= 0 ? "+" : ""}{avgClarity}%</strong>
            <TrendSparkline values={trendValues} />
          </article>

          <article className="memory-stat-card">
            <span>{isArabic ? "Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ù…ÙƒØªÙ…Ù„Ø©" : "Completed Sessions"}</span>
            <strong>{completedCount}</strong>
            <small>{isArabic ? `Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ« ${latestDate}` : `Latest update ${latestDate}`}</small>
          </article>

          <article className="memory-stat-card">
            <span>{isArabic ? "Ø§Ù„Ø¹Ø±ÙˆØ¶ Ø§Ù„Ø¬Ø§Ù‡Ø²Ø©" : "Judge-Ready Shares"}</span>
            <strong>{sharedCount}</strong>
            <small>{isArabic ? "Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ù…Ø´Ø§Ø±ÙƒØ© ÙƒØ¯Ù„ÙŠÙ„ Ø£Ùˆ Ù…Ù„Ø®Øµ." : "Ready to share as proof or summary."}</small>
          </article>
        </div>

        <section className="memory-bank-insights">
          <div className="memory-bank-section-head">
            <div>
              <span className="presentation-section-kicker">{isArabic ? "Ø±Ø¤Ù‰ Ù…Ø¬Ù…Ø¹Ø©" : "Aggregated Insights"}</span>
              <h2>{isArabic ? "Ù…Ø³Ø§Ø± Ù†Ù…ÙˆÙƒ Ø¹Ø¨Ø± Ø§Ù„Ø²Ù…Ù†" : "Your growth path over time"}</h2>
            </div>
            <p>{isArabic ? "Ù…Ù„Ø®Øµ Ø³Ø±ÙŠØ¹ Ù„Ø¢Ø®Ø± Ø§Ù„ØªØ­ÙˆÙ„Ø§Øª Ø¯Ø§Ø®Ù„ Ø§Ù„Ø£Ø±Ø´ÙŠÙ." : "A quick summary of what the archive already knows."}</p>
          </div>

          <div className="memory-bank-insights-layout">
            <div className="memory-bank-insight-grid">
              <article className="memory-insight-card">
                <span>{isArabic ? "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¬Ù„Ø³Ø§Øª" : "Total Sessions"}</span>
                <strong>{sessions.length}</strong>
                <small>{isArabic ? "ÙƒÙ„ Ø§Ù„Ø¬Ù„Ø³Ø§Øª Ø§Ù„Ù…ØªØ§Ø­Ø© Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©." : "All sessions available for review."}</small>
              </article>
              <article className="memory-insight-card">
                <span>{isArabic ? "Ø³Ø§Ø¹Ø§Øª Ø§Ù„ØªØ£Ù…Ù„" : "Meditation Hours"}</span>
                <strong>{archiveInsights.totalHours}</strong>
                <small>{isArabic ? "Ù…Ø¬Ù…Ø¹Ø© Ù…Ù† Ø¬Ù„Ø³Ø§ØªÙƒ Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©." : "Accumulated from your saved sessions."}</small>
              </article>
              <article className="memory-insight-card">
                <span>{isArabic ? "Ù†Ù‚Ø§Ø· Ø§Ù„Ø¨ØµÙŠØ±Ø©" : "Insight Points"}</span>
                <strong>{archiveInsights.insightPoints}</strong>
                <small>{isArabic ? "ØªÙ‚Ø±ÙŠØ¨Ù‹Ø§ Ø¨Ø­Ø³Ø¨ Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„ÙˆØ¶ÙˆØ­ ÙˆØ§Ù„Ø§ØªØ²Ø§Ù†." : "Estimated from clarity and equilibrium signals."}</small>
              </article>
              <article className="memory-insight-card">
                <span>{isArabic ? "Ø£Ø­Ø¯Ø« Ø¬Ù„Ø³Ø©" : "Latest Session"}</span>
                <strong>{archiveInsights.latestSessionLabel}</strong>
                <small>{isArabic ? "Ø¢Ø®Ø± Ù„Ø­Ø¸Ø© Ù…Ø­ÙÙˆØ¸Ø© Ø¯Ø§Ø®Ù„ Ø§Ù„Ø£Ø±Ø´ÙŠÙ." : "The most recent saved moment in the archive."}</small>
              </article>
            </div>

            <aside className="memory-emotional-panel">
              <div className="memory-emotional-panel-head">
                <span className="presentation-section-kicker">
                  {isArabic ? "ØªØ·ÙˆØ± Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø¹Ø§Ø·ÙÙŠ" : "Emotional Intelligence Trend"}
                </span>
                <h3>{isArabic ? "ÙƒÙŠÙ ØªØ¨Ø¯Ù‘Ù„ Ø£Ø¯Ø§Ø¤Ùƒ Ø¹Ø¨Ø± Ø§Ù„Ø¬Ù„Ø³Ø§Øª" : "How your pattern evolved across sessions"}</h3>
              </div>

              <ul className="memory-emotional-points">
                <li>
                  <strong>{archiveInsights.bestLift}%</strong>
                  <span>
                    {isArabic
                      ? "Ø£ÙØ¶Ù„ Ù‚ÙØ²Ø© ÙÙŠ Ø§Ù„ÙˆØ¶ÙˆØ­ Ø¯Ø§Ø®Ù„ Ø¬Ù„Ø³Ø© ÙˆØ§Ø­Ø¯Ø©ØŒ ÙˆØªØ¸Ù‡Ø± Ø£ÙŠÙ† ÙƒØ§Ù† Ø§Ù„ØªØ­ÙˆÙ„ Ø§Ù„Ø£Ù‚ÙˆÙ‰."
                      : "Your strongest single-session clarity lift, showing where the biggest shift happened."}
                  </span>
                </li>
                <li>
                  <strong>
                    {Math.max(0, Math.round((currentMetrics?.equilibriumScore ?? 0) * 100))}
                  </strong>
                  <span>
                    {isArabic
                      ? "Ù…Ø¤Ø´Ø± Ø§Ù„Ø§ØªØ²Ø§Ù† ÙÙŠ Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„Ù…ÙØªÙˆØ­Ø© Ø§Ù„Ø¢Ù†ØŒ Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ù…Ø§ Ù‚Ø¨Ù„Ù‡ ÙˆÙ…Ø§ Ø¨Ø¹Ø¯Ù‡."
                      : "The equilibrium score in the selected session, useful for before/after comparison."}
                  </span>
                </li>
                <li>
                  <strong>
                    {Math.max(0, Math.round((previousMetrics?.clarityDelta ?? 0) * 100))}
                  </strong>
                  <span>
                    {isArabic
                      ? "Ø§Ù„Ù…Ø¤Ø´Ø± Ø§Ù„Ø³Ø§Ø¨Ù‚ ÙŠÙˆØ¶Ø­ Ù…Ø³Ø§Ø± Ø§Ù„ØªÙƒØ±Ø§Ø±: Ù‡Ù„ Ø§Ù„ØªØ­Ø³Ù† Ø«Ø§Ø¨Øª Ø£Ù… Ù…Ø±ØªØ¨Ø· Ø¨Ù„Ø­Ø¸Ø§Øª Ø¨Ø¹ÙŠÙ†Ù‡Ø§."
                      : "The previous marker helps show whether progress is steady or session-specific."}
                  </span>
                </li>
              </ul>

              <div className="memory-emotional-footer">
                <p>
                  {isArabic
                    ? "Ù‡Ø°Ø§ Ø§Ù„Ø´Ø±ÙŠØ· Ù„Ø§ ÙŠØ²Ø¹Ù… Ø§Ù„ØªØ´Ø®ÙŠØµØ› Ù‡Ùˆ Ù‚Ø±Ø§Ø¡Ø© ØªØ§Ø±ÙŠØ®ÙŠØ© Ù„Ù…Ø§ ØªØ­Ø³Ù‘Ù† Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ø§Ù„Ø£Ø±Ø´ÙŠÙ."
                    : "This panel is not a diagnosis; it is a historical read of what actually improved in the archive."}
                </p>
              </div>
            </aside>
          </div>
        </section>

        <div className="memory-bank-grid">
          <aside className="memory-bank-roster">
            <div className="memory-bank-roster-head">
              <h2>{isArabic ? "Ø£Ø±Ø´ÙŠÙ Ø§Ù„Ø¬Ù„Ø³Ø§Øª" : "Session Archive"}</h2>
              <p>{isArabic ? "Ø§Ø®ØªÙŽØ± Ø¬Ù„Ø³Ø© Ù„ØªÙØ¹ÙŠÙ„ Presentation OS." : "Choose a session to activate the Presentation OS."}</p>
            </div>

            <div className="memory-bank-roster-controls">
              <label className="memory-bank-search">
                <Search className="h-4 w-4" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={isArabic ? "Ø§Ø¨Ø­Ø« ÙÙŠ Ø¨Ù†Ùƒ Ø§Ù„Ø°Ø§ÙƒØ±Ø©..." : "Search the memory bank..."}
                />
              </label>

              <div className="memory-bank-filter-row">
                <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value as SessionModeFilter)}>
                  <option value="all">{isArabic ? "ÙƒÙ„ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹" : "All types"}</option>
                  <option value="standard">{isArabic ? "ÙØ±Ø¯ÙŠØ©" : "Individual"}</option>
                  <option value="demo">{isArabic ? "ØªØ¬Ø±ÙŠØ¨ÙŠØ©" : "Demo"}</option>
                  <option value="hybrid">{isArabic ? "Ù‡Ø¬ÙŠÙ†Ø©" : "Hybrid"}</option>
                  <option value="couple">{isArabic ? "Ø¬Ù…Ø§Ø¹ÙŠØ©" : "Couple"}</option>
                </select>

                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SessionStatusFilter)}>
                  <option value="all">{isArabic ? "ÙƒÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª" : "All statuses"}</option>
                  <option value="completed">{isArabic ? "Ù…ÙƒØªÙ…Ù„Ø©" : "Completed"}</option>
                  <option value="active">{isArabic ? "Ù†Ø´Ø·Ø©" : "Active"}</option>
                  <option value="error">{isArabic ? "Ø£Ø®Ø·Ø§Ø¡" : "Errors"}</option>
                </select>

                <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value as SessionPeriodFilter)}>
                  <option value="all">{isArabic ? "ÙƒÙ„ Ø§Ù„ÙØªØ±Ø§Øª" : "All time"}</option>
                  <option value="30d">{isArabic ? "Ø¢Ø®Ø± 30 ÙŠÙˆÙ…" : "Last 30 days"}</option>
                  <option value="90d">{isArabic ? "Ø¢Ø®Ø± 90 ÙŠÙˆÙ…" : "Last 90 days"}</option>
                  <option value="365d">{isArabic ? "Ø¢Ø®Ø± Ø³Ù†Ø©" : "Last year"}</option>
                </select>
              </div>

              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as "recent" | "name")}>
                <option value="recent">{isArabic ? "Ø§Ù„Ø£Ø­Ø¯Ø«" : "Most recent"}</option>
                <option value="name">{isArabic ? "Ø§Ù„Ø§Ø³Ù…" : "Name"}</option>
              </select>
            </div>

            <div className="memory-bank-roster-list">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedId(session.id)}
                  className={`memory-session-card ${selectedId === session.id ? "active" : ""}`}
                >
                  <div className="memory-session-card-row">
                    <div>
                      <span className="memory-session-mode">{getModeLabel(session.mode, isArabic)}</span>
                      <h3>{session.title || (isArabic ? "Ø¬Ù„Ø³Ø© Ø¯ÙˆØ§ÙŠØ± Ù„Ø§ÙŠÙ" : "Dawayir Live Session")}</h3>
                    </div>
                    <span className="memory-session-status">{session.status}</span>
                  </div>

                  <p>{session.summary?.headline || (isArabic ? "Ù„Ø§ ÙŠÙˆØ¬Ø¯ headline Ù…Ø­ÙÙˆØ¸ Ø¨Ø¹Ø¯." : "No headline saved yet.")}</p>

                  <div className="memory-session-meta">
                    <span><Clock3 className="h-4 w-4" /> {new Date(session.updated_at).toLocaleString(isArabic ? "ar-EG" : "en-US")}</span>
                    <span>{formatDeltaPercent(session.metrics?.clarityDelta)}</span>
                  </div>
                </button>
              ))}

              {filteredSessions.length === 0 && !error && (
                <div className="dashboard-empty-state">
                  {isArabic ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø§Øª Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ù„Ø¨Ø­Ø« Ø§Ù„Ø­Ø§Ù„ÙŠ." : "No sessions match the current search."}
                </div>
              )}
            </div>
          </aside>

          <div
            ref={presentationRootRef}
            className={`dashboard-view-shell ${judgeMode ? "judge-mode-active" : ""} ${presentationFullscreen ? "presentation-fullscreen" : ""}`}
          >
            {!selectedDetail && (
              <div className="dashboard-empty-state dashboard-empty-state-large">
                {error === "AUTH_REQUIRED"
                  ? isArabic
                    ? "Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£ÙˆÙ„Ø§Ù‹ Ù„Ø¹Ø±Ø¶ Memory Bank Ø§Ù„ÙƒØ§Ù…Ù„ ÙˆØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¬Ù„Ø³Ø§Øª."
                    : "Sign in first to access the full memory bank and session details."
                  : isArabic
                    ? "Ø§Ø®ØªÙŽØ± Ø¬Ù„Ø³Ø© Ù…Ù† Ø§Ù„ÙŠØ³Ø§Ø± Ù„Ø¹Ø±Ø¶ Ø§Ù„Ù€ Replay ÙˆØ§Ù„Ù€ artifacts ÙˆØ§Ù„ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¯Ù‚ÙŠÙ‚Ø©."
                    : "Choose a session from the left to inspect replay, artifacts, and fine-grained detail."}
              </div>
            )}

            {selectedDetail && (
              <>
                <div className="presentation-toolbar">
                  <div className="presentation-toolbar-copy">
                    <span className="presentation-badge">Presentation OS</span>
                    <h2>{selectedDetail.session.title || (isArabic ? "Ø¬Ù„Ø³Ø© Ø¯ÙˆØ§ÙŠØ± Ù„Ø§ÙŠÙ" : "Dawayir Live Session")}</h2>
                    <p>
                      {summary?.headline ||
                        (isArabic
                          ? "Ø¬Ù„Ø³Ø© Ù…Ø­ÙÙˆØ¸Ø© Ù…Ø¹ replay Ùˆartifacts ÙˆÙ…Ù‚Ø§Ø±Ù†Ø© Ø¹Ø¨Ø± Ø§Ù„Ø²Ù…Ù†."
                          : "A preserved session with replay, artifacts, and cross-session comparison.")}
                    </p>
                    <div className="presentation-meta-row">
                      <span>{isArabic ? "Ø§Ù„ÙˆØµÙˆÙ„" : "Access"}: {activeAccessRoles}</span>
                      <span>{isArabic ? "Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«" : "Updated"}: {new Date(selectedDetail.session.updated_at).toLocaleString(isArabic ? "ar-EG" : "en-US")}</span>
                    </div>
                  </div>

                  <div className="presentation-toolbar-actions">
                    <button
                      type="button"
                      className={`replay-control-btn ${demoRouteActive ? "active" : ""}`}
                      onClick={() => setDemoRouteActive((value) => !value)}
                    >
                      <GalleryVerticalEnd className="h-4 w-4" />
                      {demoRouteActive ? (isArabic ? "Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ø¹Ø±Ø¶" : "Stop Demo") : "Demo Route"}
                    </button>

                    <button
                      type="button"
                      className={`replay-control-btn ${judgeMode ? "active" : ""}`}
                      onClick={() => setJudgeMode((value) => !value)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Judge Mode
                    </button>

                    <button type="button" className="replay-control-btn" onClick={handleToggleFullscreen}>
                      <Expand className="h-4 w-4" />
                      Fullscreen
                    </button>

                    <button
                      type="button"
                      className="replay-control-btn"
                      onClick={() => assignUrl(`/dawayir-live/replay/${selectedDetail.session.id}`)}
                    >
                      <PlayCircle className="h-4 w-4" />
                      Replay
                    </button>

                    <button
                      type="button"
                      className="replay-control-btn"
                      onClick={() => assignUrl(`/dawayir-live/complete/${selectedDetail.session.id}`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Summary
                    </button>

                    <button type="button" className="replay-control-btn export" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                      Judge Share
                    </button>
                  </div>
                </div>

                <div className="presentation-toolbar-stepper">
                  {presentationSteps.map((step, index) => (
                    <button
                      key={step.key}
                      type="button"
                      className={`presentation-step-btn ${demoRouteStep === index ? "active" : ""}`}
                      onClick={() => {
                        setDemoRouteStep(index);
                        step.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>

                <section ref={overviewRef} className={`presentation-section ${demoRouteStep === 0 ? "is-demo-active" : ""}`}>
                  <div className="presentation-overview-grid">
                    <article className="presentation-primary-card">
                      <span className="presentation-card-kicker">Session Insight</span>
                      <h3>{summary?.title || selectedDetail.session.title || (isArabic ? "Ø¬Ù„Ø³Ø© Ø¯ÙˆØ§ÙŠØ± Ù„Ø§ÙŠÙ" : "Dawayir Live Session")}</h3>
                      <p>{summary?.headline || signatureLine}</p>

                      <div className="presentation-metric-grid">
                        <div className="presentation-metric-card">
                          <span>Equilibrium</span>
                          <strong>{formatPercent(currentMetrics?.equilibriumScore)}</strong>
                        </div>
                        <div className="presentation-metric-card">
                          <span>Overload</span>
                          <strong>{formatPercent(currentMetrics?.overloadIndex)}</strong>
                        </div>
                        <div className="presentation-metric-card">
                          <span>Clarity Î”</span>
                          <strong>{formatDeltaPercent(currentMetrics?.clarityDelta)}</strong>
                        </div>
                      </div>
                    </article>

                    <article className="presentation-secondary-card">
                      <div className="presentation-secondary-head">
                        <span>{isArabic ? "Ø§Ù„ØªØ°ÙƒÙŠØ± Ø§Ù„Ø­ÙŠ" : "Live Reminder"}</span>
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <p className="presentation-secondary-quote">
                        {typeof truthContract?.reminder === "string"
                          ? truthContract.reminder
                          : snapshot?.whyNowLine || (isArabic ? "Ù„Ø§ ÙŠÙˆØ¬Ø¯ reminder Ù…Ø­ÙÙˆØ¸ Ø¨Ø¹Ø¯." : "No reminder captured yet.")}
                      </p>
                      <div className="presentation-mini-list">
                        {asStringArray(truthContract?.promises).slice(0, 2).map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                        {!asStringArray(truthContract?.promises).length && (
                          <span>{isArabic ? "Ù„Ù… ÙŠØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Truth Contract Ø¨Ø¹Ø¯." : "Truth contract not generated yet."}</span>
                        )}
                      </div>
                    </article>

                    <article className="presentation-secondary-card">
                      <div className="presentation-secondary-head">
                        <span>Loop Recall</span>
                        <ScanSearch className="h-4 w-4" />
                      </div>
                      <p className="presentation-secondary-quote">
                        {typeof loopRecall?.trigger === "string"
                          ? loopRecall.trigger
                          : isArabic
                            ? "Ù„Ø§ ÙŠÙˆØ¬Ø¯ loop recall Ù…Ø­ÙÙˆØ¸ Ø¨Ø¹Ø¯."
                            : "No loop recall saved yet."}
                      </p>
                      <div className="presentation-mini-list">
                        {typeof loopRecall?.interruption === "string" && <span>{loopRecall.interruption}</span>}
                        {typeof loopRecall?.reward === "string" && <span>{loopRecall.reward}</span>}
                      </div>
                    </article>
                  </div>
                </section>

                <section ref={replayRef} className={`presentation-section ${demoRouteStep === 1 ? "is-demo-active" : ""}`}>
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Replay</span>
                      <h3>{isArabic ? "Ù„Ù‚Ø·Ø© Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„Ø£Ø®ÙŠØ±Ø©" : "Latest Session Snapshot"}</h3>
                    </div>
                    <button
                      type="button"
                      className="replay-control-btn"
                      onClick={() => assignUrl(`/dawayir-live/replay/${selectedDetail.session.id}`)}
                    >
                      <PlayCircle className="h-4 w-4" />
                      {isArabic ? "Ø§ÙØªØ­ Ø§Ù„Ù€ Replay Ø§Ù„ÙƒØ§Ù…Ù„" : "Open Full Replay"}
                    </button>
                  </div>

                  <div className="history-replay-grid">
                    <div className="history-replay-canvas">
                      <svg viewBox="0 0 100 100" aria-label={isArabic ? "Ù„Ù‚Ø·Ø© Ø§Ù„Ø¯ÙˆØ§Ø¦Ø±" : "Circle snapshot"}>
                        <defs>
                          <filter id="historyReplayGlow">
                            <feGaussianBlur stdDeviation="2.4" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                        </defs>
                        <line x1="25" y1="65" x2="50" y2="72" className="replay-link" />
                        <line x1="50" y1="72" x2="76" y2="34" className="replay-link" />
                        <line x1="25" y1="65" x2="76" y2="34" className="replay-link replay-link-faint" />

                        {(snapshot?.circles ?? []).slice(0, 3).map((circle, index) => {
                          const positions = [
                            { x: 25, y: 65 },
                            { x: 50, y: 72 },
                            { x: 76, y: 34 },
                          ][index];
                          const safeRadius = Number.isFinite(circle.radius) ? Number(circle.radius) : 50;
                          const radius = 6 + (((safeRadius) - 30) / 70) * 10;
                          return (
                            <g key={circle.id} style={{ ["--replay-color" as string]: circle.color || "#38B2D8" }}>
                              <circle cx={positions.x} cy={positions.y} r={radius + 2} className="replay-node-glow" />
                              <circle cx={positions.x} cy={positions.y} r={radius} className="replay-node-core" filter="url(#historyReplayGlow)" />
                              <text x={positions.x} y={positions.y + 1} className="replay-node-label">
                                {circle.label || FALLBACK_LABELS[lang][circle.id as 1 | 2 | 3]}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="history-replay-copy">
                      <p>{snapshot?.whyNowLine || (isArabic ? "Ù„Ø§ ÙŠÙˆØ¬Ø¯ why now Ù…Ø­ÙÙˆØ¸ Ø¨Ø¹Ø¯." : "No why now line captured yet.")}</p>
                      <div className="presentation-mini-list">
                        {(summary?.tensions ?? []).slice(0, 3).map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                        {(snapshot?.spawnedTopics ?? []).slice(0, 2).map((item) => (
                          <span key={item.id}>{item.topic}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section ref={highlightRef} className={`presentation-section ${demoRouteStep === 2 ? "is-demo-active" : ""}`}>
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Highlight Reel</span>
                      <h3>{isArabic ? "Ø£Ù‡Ù… Ø§Ù„Ù„Ù‚Ø·Ø§Øª Ø§Ù„ØªÙŠ ØªØ³ØªØ­Ù‚ Ø§Ù„Ø¥Ø¹Ø§Ø¯Ø©" : "Moments That Deserve Another Look"}</h3>
                    </div>
                  </div>

                  <div className="presentation-highlight-list">
                    {highlightMoments.map((moment) => (
                      <article key={moment.id} className={`presentation-highlight-card ${moment.tone}`}>
                        <span>{moment.label}</span>
                        <p>{moment.body}</p>
                        {moment.meta && <small>{moment.meta}</small>}
                      </article>
                    ))}

                    {highlightMoments.length === 0 && (
                      <div className="dashboard-empty-state">
                        {isArabic ? "Ù„Ù… ØªÙØ­ÙØ¸ highlights ÙƒØ§ÙÙŠØ© Ø¨Ø¹Ø¯ Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø¬Ù„Ø³Ø©." : "Not enough highlights have been captured for this session yet."}
                      </div>
                    )}
                  </div>
                </section>

                <section ref={signatureRef} className={`presentation-section ${demoRouteStep === 3 ? "is-demo-active" : ""}`}>
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Signature Moment</span>
                      <h3>{isArabic ? "Ø§Ù„Ø¬Ù…Ù„Ø© Ø§Ù„ØªÙŠ ØªÙ„Ø®Ù‘Øµ Ø§Ù„Ù…Ø´Ù‡Ø¯ ÙƒÙ„Ù‡" : "The Line That Summarizes the Whole Scene"}</h3>
                    </div>
                  </div>

                  <article className="signature-moment-card">
                    <blockquote>{signatureLine}</blockquote>
                    <div className="signature-moment-footer">
                      <div>
                        <span>{isArabic ? "Next Move" : "Next Move"}</span>
                        <strong>{summary?.nextMoves?.[0] || (isArabic ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø®Ø·ÙˆØ© Ù…Ø­ÙÙˆØ¸Ø© Ø¨Ø¹Ø¯." : "No next move saved yet.")}</strong>
                      </div>
                      <Wand2 className="h-5 w-5" />
                    </div>
                  </article>
                </section>

                <section ref={judgeRef} className={`presentation-section ${demoRouteStep === 4 ? "is-demo-active" : ""}`}>
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Judge Mode</span>
                      <h3>{isArabic ? "Ø¨Ø·Ø§Ù‚Ø§Øª Ø¥Ø«Ø¨Ø§Øª Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© ÙˆØ§Ù„Ø¹Ø±Ø¶" : "Proof Cards Ready for Review and Sharing"}</h3>
                    </div>
                    <button type="button" className="replay-control-btn export" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                      {isArabic ? "Ø§ÙØªØ­ Judge Share" : "Open Judge Share"}
                    </button>
                  </div>

                  <div className="judge-mode-grid">
                    {judgeSignals.map((signal) => (
                      <article key={signal.label} className={`judge-proof-card tone-${signal.tone}`}>
                        <span>{signal.label}</span>
                        <strong>{signal.value}</strong>
                        <p>{signal.note}</p>
                      </article>
                    ))}

                    <article className="judge-proof-card tone-cyan judge-proof-card-wide">
                      <span>Artifacts</span>
                      <div className="judge-artifact-grid">
                        {selectedDetail.artifacts.slice(0, 4).map((artifact) => (
                          <div key={artifact.id} className="judge-artifact-chip">
                            <strong>{artifact.title || artifact.artifact_type}</strong>
                            <small>{artifact.artifact_type}</small>
                          </div>
                        ))}
                        {selectedDetail.artifacts.length === 0 && (
                          <div className="judge-artifact-chip">
                            <strong>{isArabic ? "Ù„Ø§ ØªÙˆØ¬Ø¯ artifacts Ø¨Ø¹Ø¯" : "No artifacts yet"}</strong>
                          </div>
                        )}
                      </div>
                    </article>
                  </div>
                </section>

                <section ref={diffRef} className={`presentation-section ${demoRouteStep === 5 ? "is-demo-active" : ""}`}>
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Cross-Session Diff</span>
                      <h3>{isArabic ? "Ø§Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ù…Ø¹ Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©" : "Comparison Against the Previous Session"}</h3>
                    </div>
                    {compareCandidate && (
                      <span className="presentation-compare-badge">
                        <GitCompareArrows className="h-4 w-4" />
                        {compareCandidate.title || (isArabic ? "Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©" : "Previous session")}
                      </span>
                    )}
                  </div>

                  {compareDetail ? (
                    <div className="session-diff-shell">
                      <div className="session-diff-grid">
                        {diffMetrics.map((metric) => (
                          <article key={metric.label} className="session-diff-card">
                            <span>{metric.label}</span>
                            <div className="session-diff-values">
                              <strong>{metric.current}</strong>
                              <small>{metric.previous}</small>
                            </div>
                            <p>{metric.delta >= 0 ? "+" : ""}{metric.delta}%</p>
                          </article>
                        ))}
                      </div>

                      <div className="session-diff-circle-grid">
                        {circleDiffs.map((circle) => (
                          <article key={circle.id} className="session-diff-circle-card">
                            <div className="session-diff-circle-head">
                              <span className="session-diff-circle-dot" style={{ backgroundColor: circle.color }} />
                              <strong>{circle.label}</strong>
                            </div>
                            <div className="session-diff-circle-values">
                              <span>{Math.round(circle.current)}</span>
                              <small>{Math.round(circle.previous)}</small>
                            </div>
                            <p>{circle.delta >= 0 ? "+" : ""}{Math.round(circle.delta)}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="dashboard-empty-state">
                      {isArabic
                        ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¬Ù„Ø³Ø© Ø£Ù‚Ø¯Ù… Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø¹Ø¯. Ø£ÙƒÙ…Ù„ Ø¬Ù„Ø³ØªÙŠÙ† Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„ Ù„ÙØªØ­ Cross-Session Diff."
                        : "No older session is available to compare yet. Complete at least two sessions to unlock Cross-Session Diff."}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


