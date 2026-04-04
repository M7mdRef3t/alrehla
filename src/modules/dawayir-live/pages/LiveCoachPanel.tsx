"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, PlayCircle, ScanSearch, Search, Share2, ShieldCheck, Sparkles, Users2 } from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { createLiveShare, getLiveSession, listCoachLiveSessions } from "../api";
import type { LiveSessionArtifactRecord, LiveSessionDetail, LiveSessionRecord } from "../types";

type StatusFilter = "all" | "completed" | "active";

function sortSessionsByRecent(list: LiveSessionRecord[]) {
  return [...list].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function getArtifactContent<T extends Record<string, unknown>>(
  artifacts: LiveSessionArtifactRecord[],
  artifactType: LiveSessionArtifactRecord["artifact_type"],
) {
  const artifact = artifacts.find((entry) => entry.artifact_type === artifactType);
  return artifact?.content && typeof artifact.content === "object" ? (artifact.content as T) : null;
}

function formatPercent(value?: number) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function formatDeltaPercent(value?: number) {
  const numeric = Math.round((value ?? 0) * 100);
  return `${numeric >= 0 ? "+" : ""}${numeric}%`;
}

function normalizeStatus(status: string) {
  if (status === "completed") return "completed";
  if (status === "active" || status === "connected") return "active";
  return "idle";
}

export default function LiveCoachPanel() {
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<LiveSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    void listCoachLiveSessions()
      .then((result) => {
        const recent = sortSessionsByRecent(result.sessions);
        setSessions(recent);
        setSelectedId(recent[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "coach_live_failed"));
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

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const statusMatches = statusFilter === "all" ? true : normalizeStatus(session.status) === statusFilter;
      if (!statusMatches) return false;

      if (!query) return true;

      const haystacks = [session.title, session.summary?.headline, session.mode, session.status]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.toLowerCase());

      return haystacks.some((value) => value.includes(query));
    });
  }, [search, sessions, statusFilter]);

  const completedCount = sessions.filter((session) => session.status === "completed").length;
  const activeCount = sessions.filter((session) => normalizeStatus(session.status) === "active").length;
  const avgClarity = useMemo(() => {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((total, session) => total + (session.metrics?.clarityDelta ?? 0), 0);
    return Math.round((sum / sessions.length) * 100);
  }, [sessions]);

  const truthContract = useMemo(
    () => getArtifactContent<{ promises?: unknown; reminder?: unknown }>(selectedDetail?.artifacts ?? [], "truth_contract"),
    [selectedDetail],
  );
  const loopRecall = useMemo(
    () =>
      getArtifactContent<{ trigger?: unknown; interruption?: unknown; reward?: unknown }>(
        selectedDetail?.artifacts ?? [],
        "loop_recall",
      ),
    [selectedDetail],
  );

  const accessRoles = useMemo(() => selectedDetail?.access.map((entry) => entry.access_role) ?? [], [selectedDetail]);
  const truthPromises = asStringArray(truthContract?.promises);
  const breakthroughs = selectedDetail?.session.summary?.breakthroughs ?? [];
  const nextMoves = selectedDetail?.session.summary?.nextMoves ?? [];
  const tensions = selectedDetail?.session.summary?.tensions ?? [];

  return (
    <div className="coach-panel-shell min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-[92rem]">
        <div className="coach-hero">
          <div>
            <span className="presentation-badge">Coach Dashboard</span>
            <h1>جلسات Dawayir Live المشتركة معك</h1>
            <p>
              نسخة أقرب للوحة المعلم الأصلية: roster حي، preview أعمق للـ insight، ومسارات مباشرة إلى replay وsummary
              وjudge share من نفس session.
            </p>
          </div>
          <button type="button" className="primary-btn" onClick={() => assignUrl("/dawayir-live/history")}>
            افتح بنك الذاكرة
          </button>
        </div>

        {error && (
          <div className="memory-bank-alert">
            {error === "AUTH_REQUIRED" ? "يجب أن تسجل الدخول بحساب coach لعرض هذه الجلسات." : error}
          </div>
        )}

        <div className="coach-stats-grid">
          <div className="coach-stat-card">
            <span>Shared Sessions</span>
            <strong>{sessions.length}</strong>
          </div>
          <div className="coach-stat-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div className="coach-stat-card">
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="coach-stat-card">
            <span>Avg Clarity</span>
            <strong>{avgClarity >= 0 ? "+" : ""}{avgClarity}%</strong>
          </div>
        </div>

        <div className="coach-toolbar">
          <label className="memory-bank-search">
            <Search className="h-4 w-4" />
            <input
              id="live-coach-search"
              name="liveCoachSearch"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث بالعنوان أو الحالة أو الـ headline"
            />
          </label>

          <div className="coach-toolbar-filters">
            {([
              { id: "all", label: "الكل" },
              { id: "completed", label: "Completed" },
              { id: "active", label: "Active" },
            ] as const).map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`presentation-step-btn ${statusFilter === filter.id ? "active" : ""}`}
                onClick={() => setStatusFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="coach-grid">
          <section className="coach-roster">
            <div className="coach-roster-head">
              <h2>Shared Roster</h2>
              <p>اختر الجلسة التي تريد مراجعتها. كل preview هنا مبني على نفس artifacts المحفوظة داخل الجلسة.</p>
            </div>

            {filteredSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedId(session.id)}
                className={`coach-session-card ${selectedId === session.id ? "is-active" : ""}`}
              >
                <div className="coach-session-head">
                  <span>{session.mode}</span>
                  <span className="coach-session-status">{session.status}</span>
                </div>
                <h2>{session.title || "جلسة Dawayir Live"}</h2>
                <p>{session.summary?.headline || "لا يوجد headline محفوظ حتى الآن."}</p>
                <div className="coach-session-meta">
                  <span>{new Date(session.updated_at).toLocaleDateString("ar-EG")}</span>
                  <span>{formatPercent(session.metrics?.equilibriumScore)} eq</span>
                </div>
              </button>
            ))}

            {filteredSessions.length === 0 && !error && (
              <div className="coach-empty-state">
                لا توجد جلسات مطابقة للبحث أو الفلترة الحالية.
              </div>
            )}
          </section>

          <section className="coach-preview">
            {!selectedDetail && (
              <div className="coach-empty-state coach-preview-empty">
                اختر جلسة من القائمة لعرض التفاصيل.
              </div>
            )}

            {selectedDetail && (
              <>
                <div className="coach-preview-header">
                  <div>
                    <span className="presentation-badge">Session Insight</span>
                    <h2>{selectedDetail.session.title || "جلسة Dawayir Live"}</h2>
                    <p>{selectedDetail.session.summary?.headline || "لا يوجد summary محفوظ بعد."}</p>
                    <div className="presentation-meta-row">
                      <span><Users2 className="inline h-4 w-4" /> الوصول الحالي: {accessRoles.join(" • ") || "coach"}</span>
                      <span><ShieldCheck className="inline h-4 w-4" /> {selectedDetail.session.status}</span>
                    </div>
                  </div>
                </div>

                <div className="coach-preview-actions">
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
                    <Eye className="h-4 w-4" />
                    Summary
                  </button>
                  <button
                    type="button"
                    className="replay-control-btn export"
                    onClick={async () => {
                      const result = await createLiveShare(selectedDetail.session.id).catch(() => null);
                      if (result?.url) {
                        window.open(result.url, "_blank", "noopener,noreferrer");
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Judge Share
                  </button>
                </div>

                <div className="coach-preview-stats">
                  <div className="coach-stat-mini">
                    <small>Equilibrium</small>
                    <strong>{formatPercent(selectedDetail.session.metrics?.equilibriumScore)}</strong>
                  </div>
                  <div className="coach-stat-mini">
                    <small>Overload</small>
                    <strong>{formatPercent(selectedDetail.session.metrics?.overloadIndex)}</strong>
                  </div>
                  <div className="coach-stat-mini">
                    <small>Clarity Delta</small>
                    <strong>{formatDeltaPercent(selectedDetail.session.metrics?.clarityDelta)}</strong>
                  </div>
                </div>

                <div className="presentation-overview-grid coach-presentation-grid">
                  <article className="presentation-primary-card">
                    <span className="presentation-card-kicker">Coach Lens</span>
                    <h3>{selectedDetail.session.summary?.headline || "لقطة الجلسة الأساسية محفوظة هنا."}</h3>
                    <p>
                      استخدم هذه البطاقة كـ fast read قبل فتح replay أو complete. هي تلخص ما خرجت به الجلسة، وما يحتاج
                      متابعة في اللقاء القادم.
                    </p>
                    <div className="presentation-mini-list">
                      <span>{selectedDetail.session.mode}</span>
                      <span>{selectedDetail.session.language}</span>
                      <span>{selectedDetail.artifacts.length} artifacts</span>
                      <span>{selectedDetail.events.length} events</span>
                    </div>
                  </article>

                  <article className="presentation-secondary-card">
                    <div className="presentation-secondary-head">
                      <span>Truth Contract</span>
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="coach-chip-stack" style={{ marginTop: "12px" }}>
                      {truthPromises.slice(0, 4).map((item) => (
                        <div key={item} className="coach-insight-chip">{item}</div>
                      ))}
                      {truthPromises.length === 0 && (
                        <div className="coach-insight-chip muted">لا يوجد truth contract محفوظ لهذه الجلسة.</div>
                      )}
                    </div>
                  </article>

                  <article className="presentation-secondary-card">
                    <div className="presentation-secondary-head">
                      <span>Access</span>
                      <Users2 className="h-4 w-4" />
                    </div>
                    <div className="presentation-mini-list" style={{ marginTop: "12px" }}>
                      {accessRoles.map((role, index) => (
                        <span key={`${role}-${index}`}>{role}</span>
                      ))}
                      {accessRoles.length === 0 && <span>coach</span>}
                    </div>
                  </article>
                </div>

                <div className="presentation-section">
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Highlights</span>
                      <h3>Breakthroughs and next moves</h3>
                    </div>
                  </div>
                  <div className="presentation-highlight-list">
                    <article className="presentation-highlight-card gold">
                      <span>Breakthroughs</span>
                      <div className="coach-chip-stack" style={{ marginTop: "12px" }}>
                        {breakthroughs.slice(0, 4).map((item) => (
                          <div key={item} className="coach-insight-chip">{item}</div>
                        ))}
                        {breakthroughs.length === 0 && <div className="coach-insight-chip muted">لا توجد breakthroughs محفوظة.</div>}
                      </div>
                    </article>
                    <article className="presentation-highlight-card cyan">
                      <span>Next Moves</span>
                      <div className="coach-chip-stack" style={{ marginTop: "12px" }}>
                        {nextMoves.slice(0, 4).map((item) => (
                          <div key={item} className="coach-insight-chip">{item}</div>
                        ))}
                        {nextMoves.length === 0 && <div className="coach-insight-chip muted">لا توجد next moves محفوظة.</div>}
                      </div>
                    </article>
                    <article className="presentation-highlight-card violet">
                      <span>Tensions</span>
                      <div className="coach-chip-stack" style={{ marginTop: "12px" }}>
                        {tensions.slice(0, 4).map((item) => (
                          <div key={item} className="coach-insight-chip">{item}</div>
                        ))}
                        {tensions.length === 0 && <div className="coach-insight-chip muted">لا توجد tensions محفوظة.</div>}
                      </div>
                    </article>
                  </div>
                </div>

                <div className="presentation-section">
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Review Pack</span>
                      <h3>Loop recall and saved artifacts</h3>
                    </div>
                  </div>

                  <div className="coach-review-grid">
                    <article className="presentation-secondary-card">
                      <div className="presentation-secondary-head">
                        <span><ScanSearch className="inline h-4 w-4" /> Loop Recall</span>
                      </div>
                      <div className="coach-chip-stack" style={{ marginTop: "12px" }}>
                        <div className="coach-insight-chip"><strong>Trigger:</strong> {typeof loopRecall?.trigger === "string" ? loopRecall.trigger : "—"}</div>
                        <div className="coach-insight-chip"><strong>Interrupt:</strong> {typeof loopRecall?.interruption === "string" ? loopRecall.interruption : "—"}</div>
                        <div className="coach-insight-chip"><strong>Reward:</strong> {typeof loopRecall?.reward === "string" ? loopRecall.reward : "—"}</div>
                      </div>
                    </article>

                    <article className="presentation-secondary-card">
                      <div className="presentation-secondary-head">
                        <span>Artifacts</span>
                        <Eye className="h-4 w-4" />
                      </div>
                      <div className="coach-artifact-grid" style={{ marginTop: "12px" }}>
                        {selectedDetail.artifacts.slice(0, 8).map((artifact) => (
                          <div key={artifact.id} className="coach-artifact-card">
                            <strong>{artifact.title || artifact.artifact_type}</strong>
                            <span>{artifact.artifact_type}</span>
                          </div>
                        ))}
                        {selectedDetail.artifacts.length === 0 && (
                          <div className="coach-artifact-card empty">لا توجد artifacts ظاهرة بعد.</div>
                        )}
                      </div>
                    </article>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
