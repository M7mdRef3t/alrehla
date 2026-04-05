"use client";

import { useEffect, useMemo, useState } from "react";
import { HeartHandshake, Link2, Search, Share2, ShieldCheck, Sparkles, Users2 } from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { createLiveShare, getLiveSession, grantLiveAccess, listLiveSessions } from "../api";
import type { LiveSessionArtifactRecord, LiveSessionDetail, LiveSessionRecord } from "../types";

function sortSessionsByRecent(list: LiveSessionRecord[]) {
  return [...list].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
}

function findArtifact(artifacts: LiveSessionArtifactRecord[], type: string) {
  return artifacts.find((artifact) => artifact.artifact_type === type);
}

function coerceString(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function coerceStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function formatPercent(value: number | null | undefined) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

export default function LiveCouplePage() {
  const [sessions, setSessions] = useState<LiveSessionRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<LiveSessionDetail | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isGranting, setIsGranting] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "active">("all");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  useEffect(() => {
    void listLiveSessions()
      .then((result) => {
        const recent = sortSessionsByRecent(result.sessions);
        setSessions(result.sessions);
        setSelectedId(recent[0]?.id ?? null);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "AUTH_REQUIRED"));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }

    void getLiveSession(selectedId)
      .then((detail) => {
        setSelectedDetail(detail);
        setShareUrl(null);
      })
      .catch(() => setSelectedDetail(null));
  }, [selectedId]);

  const recentSessions = useMemo(() => sortSessionsByRecent(sessions), [sessions]);
  const filteredSessions = useMemo(() => {
    return recentSessions.filter((session) => {
      const matchesStatus =
        statusFilter === "all" ? true : statusFilter === "completed" ? session.status === "completed" : session.status !== "completed";
      const haystack = [session.title, session.summary?.headline, session.mode, session.status].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = query.trim().length === 0 ? true : haystack.includes(query.trim().toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [query, recentSessions, statusFilter]);

  useEffect(() => {
    if (!selectedId && filteredSessions[0]) {
      setSelectedId(filteredSessions[0].id);
      return;
    }

    if (selectedId && filteredSessions.length > 0 && !filteredSessions.some((session) => session.id === selectedId)) {
      setSelectedId(filteredSessions[0].id);
    }
  }, [filteredSessions, selectedId]);

  const accessRoles = useMemo(() => selectedDetail?.access.map((entry) => entry.access_role) ?? [], [selectedDetail]);
  const truthContract = useMemo(() => findArtifact(selectedDetail?.artifacts ?? [], "truth_contract")?.content ?? null, [selectedDetail]);
  const loopRecall = useMemo(() => findArtifact(selectedDetail?.artifacts ?? [], "loop_recall")?.content ?? null, [selectedDetail]);
  const summary = selectedDetail?.session.summary ?? null;
  const tensions = coerceStringArray(summary?.tensions);
  const nextMoves = coerceStringArray(summary?.nextMoves);

  return (
    <div className="memory-bank-shell min-h-screen px-4 py-10 text-white">
      <div className="mx-auto max-w-[92rem]">
        <div className="memory-bank-topbar">
          <div className="memory-bank-hero">
            <span className="presentation-badge">Couple Mode</span>
            <h1>مشاركة الجلسة مع شريك</h1>
            <p>
              نسخة أقرب لتجربة الأصل في الترتيب: اختر جلسة محفوظة، راجع ما سيظهر للشريك، ثم امنحه partner access داخل نفس
              المنصة بدون نسخ session جديدة أو flow خارجي.
            </p>
          </div>

          <button type="button" className="primary-btn memory-bank-primary-btn" onClick={() => assignUrl("/dawayir-live")}>
            ارجع إلى الجلسة الحية
          </button>
        </div>

        {message && (
          <div className="memory-bank-alert">
            {message === "AUTH_REQUIRED"
              ? "يجب تسجيل الدخول أولاً لإدارة Couple Mode ومنح الشريك صلاحية الوصول."
              : message}
          </div>
        )}

        <div className="memory-bank-stats">
          <article className="memory-stat-card">
            <span>Sessions</span>
            <strong>{sessions.length}</strong>
            <small>كل الجلسات الشخصية التي يمكن تحويلها إلى مساحة مشاركة ثنائية.</small>
          </article>

          <article className="memory-stat-card">
            <span>Partner Access</span>
            <strong>{accessRoles.filter((role) => role === "partner").length}</strong>
            <small>عدد المشاركين الحاليين على الجلسة المختارة.</small>
          </article>

          <article className="memory-stat-card">
            <span>Artifacts Shared</span>
            <strong>{selectedDetail?.artifacts.length ?? 0}</strong>
            <small>Replay, summary, truth contract, and exports all stay attached to the same session.</small>
          </article>

          <article className="memory-stat-card">
            <span>Status</span>
            <strong>{selectedDetail?.session.status ?? "idle"}</strong>
            <small>الشريك لا يرى إلا هذه الجلسة وما مُنح له عليها.</small>
          </article>
        </div>

        <div className="memory-bank-grid">
          <aside className="memory-bank-roster">
            <div className="memory-bank-roster-head coach-roster-head">
              <div>
                <h2>جلسات قابلة للمشاركة</h2>
                <p>اختر الجلسة التي تريد فتحها بينك وبين الشريك. نفس الـ replay والـ summary سيظلان داخل نفس الجلسة.</p>
              </div>

              <div className="couple-roster-toolbar">
                <label className="memory-bank-search">
                  <Search className="h-4 w-4" />
                  <input id="couple-session-query" name="sessionQuery" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بعنوان أو headline" />
                </label>

                <div className="coach-toolbar-filters">
                  {[
                    { id: "all", label: "All" },
                    { id: "completed", label: "Completed" },
                    { id: "active", label: "Active" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`couple-filter-btn ${statusFilter === filter.id ? "active" : ""}`}
                      onClick={() => setStatusFilter(filter.id as "all" | "completed" | "active")}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
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
                      <h3>{session.title || "جلسة Dawayir Live"}</h3>
                    </div>
                    <span className="memory-session-status">{session.status}</span>
                  </div>
                  <p>{session.summary?.headline || "لا يوجد headline محفوظ حتى الآن."}</p>
                  <div className="memory-session-meta">
                    <span>{new Date(session.updated_at).toLocaleDateString("ar-EG")}</span>
                    <span>{formatPercent(session.metrics?.clarityDelta)} clarity</span>
                  </div>
                </button>
              ))}

              {filteredSessions.length === 0 && !message && (
                <div className="dashboard-empty-state">
                  لا توجد جلسات مطابقة لهذا الفلتر الآن. أكمل جلسة واحدة على الأقل قبل فتح Couple Mode.
                </div>
              )}
            </div>
          </aside>

          <section className="dashboard-view-shell">
            {!selectedDetail && (
              <div className="dashboard-empty-state dashboard-empty-state-large">
                اختر جلسة من اليسار لمعاينة ما سيتم مشاركته مع الشريك.
              </div>
            )}

            {selectedDetail && (
              <>
                <div className="presentation-toolbar">
                  <div className="presentation-toolbar-copy">
                    <span className="presentation-badge">Partner Invite</span>
                    <h2>{selectedDetail.session.title || "جلسة Dawayir Live"}</h2>
                    <p>{selectedDetail.session.summary?.headline || "هذه الجلسة جاهزة للمشاركة مع partner access من داخل المنصة."}</p>
                    <div className="presentation-meta-row">
                      <span>
                        <Users2 className="inline h-4 w-4" /> الوصول الحالي: {accessRoles.join(" • ") || "owner"}
                      </span>
                      <span>
                        <ShieldCheck className="inline h-4 w-4" /> نفس الجلسة، بدون نسخ منفصلة
                      </span>
                    </div>
                  </div>
                </div>

                <div className="presentation-overview-grid">
                  <article className="presentation-primary-card">
                    <span className="presentation-card-kicker">What The Partner Sees</span>
                    <h3>نفس الذاكرة، نفس الـ replay، نفس الـ artifacts</h3>
                    <p>
                      الشريك يرى هذه الجلسة فقط، مع الـ summary والـ replay وTruth Contract والـ artifacts المرتبطة بها. لا يتم
                      إنشاء session جديدة أو نسخ بيانات.
                    </p>
                    <div className="presentation-mini-list">
                      <span>Replay</span>
                      <span>Summary</span>
                      <span>Truth Contract</span>
                      <span>Loop Recall</span>
                    </div>
                  </article>

                  <article className="presentation-secondary-card">
                    <div className="presentation-secondary-head">
                      <span>Invite Partner</span>
                      <HeartHandshake className="h-4 w-4" />
                    </div>
                    <label className="memory-bank-search" style={{ marginTop: "12px" }}>
                      <Link2 className="h-4 w-4" />
                      <input id="partner-email" name="partnerEmail" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="partner@example.com" />
                    </label>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ marginTop: "14px", width: "100%" }}
                      disabled={!selectedDetail.session.id || !email.trim() || isGranting}
                      onClick={async () => {
                        setIsGranting(true);
                        const result = await grantLiveAccess(selectedDetail.session.id, {
                          role: "partner",
                          email: email.trim(),
                        }).catch((err) => {
                          setMessage(err instanceof Error ? err.message : "grant_failed");
                          return null;
                        });
                        setIsGranting(false);

                        if (result?.access) {
                          setMessage("تم منح Partner Access بنجاح.");
                          setEmail("");
                          const refreshed = await getLiveSession(selectedDetail.session.id).catch(() => null);
                          if (refreshed) setSelectedDetail(refreshed);
                        }
                      }}
                    >
                      {isGranting ? "جارٍ منح الصلاحية..." : "Grant Partner Access"}
                    </button>
                  </article>

                  <article className="presentation-secondary-card">
                    <div className="presentation-secondary-head">
                      <span>Share Surface</span>
                      <Share2 className="h-4 w-4" />
                    </div>
                    <button
                      type="button"
                      className="primary-btn complete-action-btn complete-action-secondary"
                      style={{ marginTop: "12px", width: "100%" }}
                      disabled={isCreatingShare}
                      onClick={async () => {
                        setIsCreatingShare(true);
                        const result = await createLiveShare(selectedDetail.session.id).catch(() => null);
                        setIsCreatingShare(false);
                        setShareUrl(result?.url ?? null);
                      }}
                    >
                      {isCreatingShare ? "Preparing..." : "Create Judge Share"}
                    </button>
                    {shareUrl && (
                      <a href={shareUrl} target="_blank" rel="noreferrer" className="couple-share-url">
                        {shareUrl}
                      </a>
                    )}
                  </article>

                  <article className="presentation-secondary-card">
                    <div className="presentation-secondary-head">
                      <span>Access Roster</span>
                      <Users2 className="h-4 w-4" />
                    </div>
                    <div className="couple-access-list">
                      {selectedDetail.access.map((entry) => (
                        <div key={entry.id} className="couple-access-item">
                          <strong>{entry.access_role}</strong>
                          <small>{new Date(entry.created_at).toLocaleDateString("ar-EG")}</small>
                        </div>
                      ))}
                      {selectedDetail.access.length === 0 && (
                        <div className="couple-access-item">
                          <strong>owner</strong>
                          <small>default</small>
                        </div>
                      )}
                    </div>
                  </article>
                </div>

                <div className="couple-preview-grid">
                  <article className="couple-preview-card">
                    <span className="presentation-section-kicker">Truth Contract</span>
                    <h3>{coerceString(truthContract?.reminder, "No saved reminder yet.")}</h3>
                    <div className="presentation-mini-list">
                      {coerceStringArray(truthContract?.promises).slice(0, 3).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </article>

                  <article className="couple-preview-card">
                    <span className="presentation-section-kicker">Loop Recall</span>
                    <h3>{coerceString(loopRecall?.title, "Saved interruption pattern")}</h3>
                    <div className="complete-grid-three">
                      <div className="complete-subcard">
                        <div className="complete-subcard-label">Trigger</div>
                        <div className="complete-subcard-value">{coerceString(loopRecall?.trigger)}</div>
                      </div>
                      <div className="complete-subcard">
                        <div className="complete-subcard-label">Interrupt</div>
                        <div className="complete-subcard-value">{coerceString(loopRecall?.interruption)}</div>
                      </div>
                      <div className="complete-subcard">
                        <div className="complete-subcard-label">Reward</div>
                        <div className="complete-subcard-value">{coerceString(loopRecall?.reward)}</div>
                      </div>
                    </div>
                  </article>

                  <article className="couple-preview-card">
                    <span className="presentation-section-kicker">Tensions</span>
                    <h3>{summary?.headline || "No stored headline yet."}</h3>
                    <div className="presentation-mini-list">
                      {tensions.length > 0 ? tensions.map((item) => <span key={item}>{item}</span>) : <span>No saved tensions</span>}
                    </div>
                  </article>

                  <article className="couple-preview-card">
                    <span className="presentation-section-kicker">Next Moves</span>
                    <h3>
                      <Sparkles className="inline h-4 w-4" /> {formatPercent(selectedDetail.session.metrics?.clarityDelta)} clarity shift
                    </h3>
                    <div className="presentation-mini-list">
                      {nextMoves.length > 0 ? nextMoves.map((item) => <span key={item}>{item}</span>) : <span>No next moves saved</span>}
                    </div>
                  </article>
                </div>

                <div className="presentation-section">
                  <div className="presentation-section-header">
                    <div>
                      <span className="presentation-section-kicker">Rules</span>
                      <h3>ما الذي يحدث بعد منح الوصول</h3>
                    </div>
                  </div>
                  <div className="presentation-highlight-list">
                    <article className="presentation-highlight-card cyan">
                      <span>Single Session</span>
                      <p>الـ partner يدخل على نفس session id بدل إنشاء نسخة مستقلة أو route منفصل للبيانات.</p>
                    </article>
                    <article className="presentation-highlight-card gold">
                      <span>Shared Outputs</span>
                      <p>الـ replay والـ summary والـ truth contract والـ artifacts تظل مربوطة بنفس الجلسة.</p>
                    </article>
                    <article className="presentation-highlight-card violet">
                      <span>Scoped Access</span>
                      <p>الشريك لا يرى جلسات أخرى؛ فقط الجلسة التي منحته لها عبر access role = partner.</p>
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
