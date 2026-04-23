'use client';

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
  Zap as Sparkles,
  Wand2,
} from "lucide-react";
import { assignUrl } from "@/services/navigation";
import { fetchJourneyPaths } from "@/services/admin/adminSettings";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { getDawayirLiveLaunchHref, getDawayirLivePath } from "@/utils/dawayirLiveJourney";
import { createLiveShare, getLiveSession, listLiveSessions } from "../api";
import type {
  CircleNode,
  LiveLanguage,
  LiveSessionArtifactRecord,
  LiveSessionDetail,
  LiveSessionRecord,
} from '../types';

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

interface HighlightMoment {
  id: string;
  label: string;
  body: string;
  meta?: string;
  tone: HighlightTone;
}

const FALLBACK_LABELS = {
  ar: { 1: "الوعي", 2: "العلم", 3: "الحقيقة" },
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
              ? "صوت المرآة"
              : "Mirror Voice"
            : lang === "ar"
              ? "صوتك"
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

export default function LiveHistoryPage() {
  const journeyPaths = useAdminState((state) => state.journeyPaths);
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<LiveSessionDetail | null>(null);
  const [compareDetail, setCompareDetail] = useState<LiveSessionDetail | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [error, setError] = useState<string | null>(null);
  const livePath = useMemo(() => getDawayirLivePath(journeyPaths), [journeyPaths]);

  useEffect(() => {
    let cancelled = false;
    void fetchJourneyPaths().then((paths) => {
      if (!cancelled && paths) {
        useAdminState.getState().setJourneyPaths(paths);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
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
      return title.includes(query);
    });

    if (sortBy === "name") {
      return [...list].sort((left, right) => (left.title || "").localeCompare(right.title || ""));
    }

    return sortSessionsByRecent(list);
  }, [search, sessions, sortBy]);

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
    : "—";

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
    (isArabic ? "المرآة سجّلت لحظة وضوح تستحق أن تُعاد." : "The mirror captured a moment worth replaying.");

  const judgeSignals = [
    {
      label: "Clarity Shift",
      value: formatDeltaPercent(currentMetrics?.clarityDelta),
      tone: "violet",
      note: previousMetrics
        ? `${formatDeltaPercent((currentMetrics?.clarityDelta ?? 0) - (previousMetrics?.clarityDelta ?? 0))} vs previous`
        : isArabic
          ? "أول جلسة محفوظة للمقارنة."
          : "First saved session for comparison.",
    },
    {
      label: "Equilibrium",
      value: formatPercent(currentMetrics?.equilibriumScore),
      tone: "emerald",
      note: snapshot?.journeyStage || (isArabic ? "بدون stage محفوظ" : "No stage captured"),
    },
    {
      label: "Truth Contract",
      value: `${asStringArray(truthContract?.promises).length}`,
      tone: "cyan",
      note:
        typeof truthContract?.reminder === "string"
          ? truthContract.reminder
          : isArabic
            ? "لم يتم إنشاء reminder بعد."
            : "No reminder yet.",
    },
    {
      label: "Artifacts",
      value: `${selectedDetail?.artifacts.length ?? 0}`,
      tone: "gold",
      note: isArabic ? "جاهزة للمشاركة والعرض." : "Ready for sharing and review.",
    },
  ];

  const diffMetrics = [
    {
      label: "Clarity Δ",
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
    selectedDetail?.access.map((entry) => entry.access_role).join(" • ") || (isArabic ? "owner" : "owner");

  return (
    <div className="memory-bank-shell min-h-screen text-app-foreground">
      <div className="mx-auto max-w-[92rem] px-4 py-10">
        <div className="memory-bank-topbar">
          <div className="memory-bank-hero">
            <span className="presentation-badge">Memory Bank</span>
            <h1>{isArabic ? "بنك الذاكرة" : "Memory Bank"}</h1>
            <p>
              {isArabic
                ? "نسخة أقرب إلى DashboardView الأصلي: أرشيف الجلسات على اليسار، وPresentation OS على اليمين مع Replay وHighlight Reel وJudge Mode وCross-Session Diff."
                : "A closer DashboardView parity: archived sessions on the left, with Presentation OS on the right for Replay, Highlight Reel, Judge Mode, and Cross-Session Diff."}
            </p>
          </div>

          <button
            type="button"
            className="primary-btn memory-bank-primary-btn"
            onClick={() => assignUrl(getDawayirLiveLaunchHref(livePath, { surface: "history-return" }))}
          >
            {isArabic ? "ابدأ جلسة جديدة" : "Start New Session"}
          </button>
        </div>

        {error && (
          <div className="memory-bank-alert">
            {error === "AUTH_REQUIRED"
              ? isArabic
                ? "يجب تسجيل الدخول لعرض بنك الذاكرة والجلسات المحفوظة."
                : "You need to sign in to view the memory bank and saved sessions."
              : error}
          </div>
        )}

        <div className="memory-bank-stats">
          <article className="memory-stat-card">
            <span>{isArabic ? "الجلسات المحفوظة" : "Saved Sessions"}</span>
            <strong>{sessions.length}</strong>
            <small>{isArabic ? "كل الجلسات القابلة للعرض وإعادة التشغيل." : "All sessions available for playback and review."}</small>
          </article>

          <article className="memory-stat-card">
            <span>{isArabic ? "متوسط الوضوح" : "Average Clarity"}</span>
            <strong>{avgClarity >= 0 ? "+" : ""}{avgClarity}%</strong>
            <TrendSparkline values={trendValues} />
          </article>

          <article className="memory-stat-card">
            <span>{isArabic ? "الجلسات المكتملة" : "Completed Sessions"}</span>
            <strong>{completedCount}</strong>
            <small>{isArabic ? `آخر تحديث ${latestDate}` : `Latest update ${latestDate}`}</small>
          </article>

          <article className="memory-stat-card">
            <span>{isArabic ? "العروض الجاهزة" : "Judge-Ready Shares"}</span>
            <strong>{sharedCount}</strong>
            <small>{isArabic ? "جاهزة للمشاركة كدليل أو ملخص." : "Ready to share as proof or summary."}</small>
          </article>
        </div>

        <div className="memory-bank-grid">
          <aside className="memory-bank-roster">
            <div className="memory-bank-roster-head">
              <h2>{isArabic ? "أرشيف الجلسات" : "Session Archive"}</h2>
              <p>{isArabic ? "اختَر جلسة لتفعيل Presentation OS." : "Choose a session to activate the Presentation OS."}</p>
            </div>

            <div className="memory-bank-roster-controls">
              <label className="memory-bank-search">
                <Search className="h-4 w-4" />
                <input
                  id="live-history-search"
                  name="liveHistorySearch"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={isArabic ? "ابحث في بنك الذاكرة..." : "Search the memory bank..."}
                />
              </label>

              <select id="live-history-sort" name="liveHistorySort" value={sortBy} onChange={(event) => setSortBy(event.target.value as "recent" | "name")}>
                <option value="recent">{isArabic ? "الأحدث" : "Most recent"}</option>
                <option value="name">{isArabic ? "الاسم" : "Name"}</option>
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
                      <span className="memory-session-mode">{session.mode}</span>
                      <h3>{session.title || (isArabic ? "جلسة دواير لايف" : "Dawayir Live Session")}</h3>
                    </div>
                    <span className="memory-session-status">{session.status}</span>
                  </div>

                  <p>{session.summary?.headline || (isArabic ? "لا يوجد headline محفوظ بعد." : "No headline saved yet.")}</p>

                  <div className="memory-session-meta">
                    <span><Clock3 className="h-4 w-4" /> {new Date(session.updated_at).toLocaleString(isArabic ? "ar-EG" : "en-US")}</span>
                    <span>{formatDeltaPercent(session.metrics?.clarityDelta)}</span>
                  </div>
                </button>
              ))}

              {filteredSessions.length === 0 && !error && (
                <div className="dashboard-empty-state">
                  {isArabic ? "لا توجد جلسات مطابقة للبحث الحالي." : "No sessions match the current search."}
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
                    ? "سجّل الدخول أولاً لعرض Memory Bank الكامل وتفاصيل الجلسات."
                    : "Sign in first to access the full memory bank and session details."
                  : isArabic
                    ? "اختَر جلسة من اليسار لعرض الـ Replay والـ artifacts والتفاصيل الدقيقة."
                    : "Choose a session from the left to inspect replay, artifacts, and fine-grained detail."}
              </div>
            )}

            {selectedDetail && (
              <>
                <div className="presentation-toolbar">
                  <div className="presentation-toolbar-copy">
                    <span className="presentation-badge">Presentation OS</span>
                    <h2>{selectedDetail.session.title || (isArabic ? "جلسة دواير لايف" : "Dawayir Live Session")}</h2>
                    <p>
                      {summary?.headline ||
                        (isArabic
                          ? "جلسة محفوظة مع replay وartifacts ومقارنة عبر الزمن."
                          : "A preserved session with replay, artifacts, and cross-session comparison.")}
                    </p>
                    <div className="presentation-meta-row">
                      <span>{isArabic ? "الوصول" : "Access"}: {activeAccessRoles}</span>
                      <span>{isArabic ? "آخر تحديث" : "Updated"}: {new Date(selectedDetail.session.updated_at).toLocaleString(isArabic ? "ar-EG" : "en-US")}</span>
                    </div>
                  </div>

                  <div className="presentation-toolbar-actions">
                    <button
                      type="button"
                      className={`replay-control-btn ${demoRouteActive ?"active" : ""}`}
                      onClick={() => setDemoRouteActive((value) => !value)}
                    >
                      <GalleryVerticalEnd className="h-4 w-4" />
                      {demoRouteActive ? (isArabic ? "إيقاف العرض" : "Stop Demo") : "Demo Route"}
                    </button>

                    <button
                      type="button"
                      className={`replay-control-btn ${judgeMode ?"active" : ""}`}
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
                      className={`presentation-step-btn ${demoRouteStep === index ?"active" : ""}`}
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
                      <h3>{summary?.title || selectedDetail.session.title || (isArabic ? "جلسة دواير لايف" : "Dawayir Live Session")}</h3>
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
                          <span>Clarity Δ</span>
                          <strong>{formatDeltaPercent(currentMetrics?.clarityDelta)}</strong>
                        </div>
                      </div>
                    </article>

                    <article className="presentation-secondary-card">
                      <div className="presentation-secondary-head">
                        <span>{isArabic ? "التذكير الحي" : "Live Reminder"}</span>
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <p className="presentation-secondary-quote">
                        {typeof truthContract?.reminder === "string"
                          ? truthContract.reminder
                          : snapshot?.whyNowLine || (isArabic ? "لا يوجد reminder محفوظ بعد." : "No reminder captured yet.")}
                      </p>
                      <div className="presentation-mini-list">
                        {asStringArray(truthContract?.promises).slice(0, 2).map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                        {!asStringArray(truthContract?.promises).length && (
                          <span>{isArabic ? "لم يتم إنشاء Truth Contract بعد." : "Truth contract not generated yet."}</span>
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
                            ? "لا يوجد loop recall محفوظ بعد."
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
                      <h3>{isArabic ? "لقطة الجلسة الأخيرة" : "Latest Session Snapshot"}</h3>
                    </div>
                    <button
                      type="button"
                      className="replay-control-btn"
                      onClick={() => assignUrl(`/dawayir-live/replay/${selectedDetail.session.id}`)}
                    >
                      <PlayCircle className="h-4 w-4" />
                      {isArabic ? "افتح الـ Replay الكامل" : "Open Full Replay"}
                    </button>
                  </div>

                  <div className="history-replay-grid">
                    <div className="history-replay-canvas">
                      <svg viewBox="0 0 100 100" aria-label={isArabic ? "لقطة الدوائر" : "Circle snapshot"}>
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
                          const radius = 6 + (((Number(circle.radius) || 50) - 30) / 70) * 10;
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
                      <p>{snapshot?.whyNowLine || (isArabic ? "لا يوجد why now محفوظ بعد." : "No why now line captured yet.")}</p>
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
                      <h3>{isArabic ? "أهم اللقطات التي تستحق الإعادة" : "Moments That Deserve Another Look"}</h3>
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
                        {isArabic ? "لم تُحفظ highlights كافية بعد لهذه الجلسة." : "Not enough highlights have been captured for this session yet."}
                      </div>
                    )}
                  </div>
                </section>

                <section ref={signatureRef} className={`presentation-section ${demoRouteStep === 3 ? "is-demo-active" : ""}`}>
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Signature Moment</span>
                      <h3>{isArabic ? "الجملة التي تلخّص المشهد كله" : "The Line That Summarizes the Whole Scene"}</h3>
                    </div>
                  </div>

                  <article className="signature-moment-card">
                    <blockquote>{signatureLine}</blockquote>
                    <div className="signature-moment-footer">
                      <div>
                        <span>{isArabic ? "Next Move" : "Next Move"}</span>
                        <strong>{summary?.nextMoves?.[0] || (isArabic ? "لا توجد خطوة محفوظة بعد." : "No next move saved yet.")}</strong>
                      </div>
                      <Wand2 className="h-5 w-5" />
                    </div>
                  </article>
                </section>

                <section ref={judgeRef} className={`presentation-section ${demoRouteStep === 4 ? "is-demo-active" : ""}`}>
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Judge Mode</span>
                      <h3>{isArabic ? "بطاقات إثبات جاهزة للمراجعة والعرض" : "Proof Cards Ready for Review and Sharing"}</h3>
                    </div>
                    <button type="button" className="replay-control-btn export" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                      {isArabic ? "افتح Judge Share" : "Open Judge Share"}
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
                            <strong>{isArabic ? "لا توجد artifacts بعد" : "No artifacts yet"}</strong>
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
                      <h3>{isArabic ? "المقارنة مع الجلسة السابقة" : "Comparison Against the Previous Session"}</h3>
                    </div>
                    {compareCandidate && (
                      <span className="presentation-compare-badge">
                        <GitCompareArrows className="h-4 w-4" />
                        {compareCandidate.title || (isArabic ? "الجلسة السابقة" : "Previous session")}
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
                        ? "لا توجد جلسة أقدم جاهزة للمقارنة بعد. أكمل جلستين على الأقل لفتح Cross-Session Diff."
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
