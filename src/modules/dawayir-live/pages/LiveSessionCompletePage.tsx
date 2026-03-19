"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { BadgeCheck, Clock3, Download, Gem, Link2, RotateCcw, Share2, Wind } from "lucide-react";
import { assignUrl } from "../../../services/navigation";
import { createLiveShare, getLiveSession } from "../api";
import CognitiveWeatherSummary from "../components/CognitiveWeatherSummary";
import JourneyTimeline from "../components/JourneyTimeline";
import MirrorSentence from "../components/MirrorSentence";
import SandMandala from "../components/SandMandala";
import WeeklyPatternCard from "../components/WeeklyPatternCard";
import type { LiveSessionArtifactRecord, LiveSessionDetail, LiveSessionSummary } from "../types";
import { saveSessionSummary } from "../utils/sessionHistory";

function findArtifact(artifacts: LiveSessionArtifactRecord[], type: string) {
  return artifacts.find((artifact) => artifact.artifact_type === type);
}

function truthContractStorageKey(sessionId: string) {
  return `dawayir-live-truth-contract:${sessionId}`;
}

function sessionHistorySavedKey(sessionId: string) {
  return `dawayir-live-history-saved:${sessionId}`;
}

function getJourneyPath(detail: LiveSessionDetail | null) {
  const frames = [...(detail?.replayFrames ?? [])].sort((left, right) => (left.seq || 0) - (right.seq || 0));
  return frames
    .map((frame) => {
      const dominant = [...(frame.frame.circles ?? [])].sort((left, right) => right.radius - left.radius)[0];
      return Number(dominant?.id) || 1;
    })
    .filter(Boolean);
}

function coerceString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function coerceStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function createCopy(isArabic: boolean) {
  return isArabic
    ? {
        authTitle: "ابدأ بعد تسجيل الدخول",
        openFailed: "تعذر فتح ملخص الجلسة",
        authBody: "لا يمكن عرض شاشة الإنهاء إلا من داخل حسابك لأن الجلسة مرتبطة بالذاكرة والـ artifacts.",
        loading: "جاري تحميل الجلسة...",
        backToMemoryBank: "الرجوع إلى بنك الذاكرة",
        seenArc: "شفت نفسك",
        clarityArc: "الوضوح",
        readyArc: "جاهز",
        sessionFallback: "جلسة دواير لايف",
        completeHeading: "أنت أوضح دلوقتي",
        storedHeadline: "جلستك خلصت، والمشهد الذي ظهر فيها محفوظ الآن داخل بنك الذاكرة.",
        sessionHeadline: "الجلسة انتهت، والمشهد الذي ظهر فيها أصبح أوضح الآن.",
        equilibrium: "التوازن النهائي",
        overload: "مستوى الضغط",
        clarity: "نسبة الوضوح",
        truthContract: "Truth Contract",
        truthReminderFallback: "ارجع لهذه اللحظة عندما يعود التشوش.",
        truthDone: "تم التنفيذ",
        truthAction: "نفذتها",
        exporting: "جارٍ الاستخراج...",
        sharing: "جارٍ تجهيز الصورة...",
        insightDocument: "وثيقة البصيرة (PDF)",
        newSession: "جلسة جديدة",
        memoryBank: "بنك الذاكرة",
        shareLink: "رابط المشاركة",
        loopRecall: "Loop Recall",
        trigger: "المحفز",
        interrupt: "المقاطعة",
        reward: "المكافأة",
        breakthroughs: "الاختراقات",
        nextMoves: "الخطوات القادمة",
        artifacts: "Artifacts",
        timeUp: "انتهى الوقت",
        judgeShare: "Judge Share",
        shareInsight: "شارك بصيرتك",
        shareCopied: "تم نسخ البصيرة كصورة.",
        shareDownloaded: "تم تجهيز صورة البصيرة للتحميل.",
        shareUnavailable: "تعذر تجهيز صورة البصيرة حالياً.",
        releaseAction: "التخلي",
        releaseWaiting: "انفخ في الميكروفون أو اضغط مرة ثانية",
        releaseFallback: "يمكنك الضغط مرة ثانية لإكمال التخلي.",
        releaseInProgress: "جارٍ التخلي...",
        disclaimer: "دواير أداة بصيرة ذاتية وليست بديلاً عن الدعم المهني.",
      }
    : {
        authTitle: "Start after signing in",
        openFailed: "Could not open the session summary",
        authBody: "Session Complete can only be opened from your account because the session is tied to memory and artifacts.",
        loading: "Loading session...",
        backToMemoryBank: "Back to Memory Bank",
        seenArc: "You were seen",
        clarityArc: "Clarity",
        readyArc: "Ready",
        sessionFallback: "Dawayir Live Session",
        completeHeading: "You are clearer now",
        storedHeadline: "Your session is complete, and the revealed pattern is saved in Memory Bank.",
        sessionHeadline: "The session ended, and the pattern it revealed is clearer now.",
        equilibrium: "Final equilibrium",
        overload: "Load level",
        clarity: "Clarity delta",
        truthContract: "Truth Contract",
        truthReminderFallback: "Return to this moment when the noise comes back.",
        truthDone: "Completed",
        truthAction: "I did this step",
        exporting: "Exporting...",
        sharing: "Preparing image...",
        insightDocument: "Insight Document (PDF)",
        newSession: "New Session",
        memoryBank: "Memory Bank",
        shareLink: "Share link",
        loopRecall: "Loop Recall",
        trigger: "Trigger",
        interrupt: "Interrupt",
        reward: "Reward",
        breakthroughs: "Breakthroughs",
        nextMoves: "Next Moves",
        artifacts: "Artifacts",
        timeUp: "Time is up",
        judgeShare: "Judge Share",
        shareInsight: "Share Insight",
        shareCopied: "Insight copied as an image.",
        shareDownloaded: "Insight image is ready to download.",
        shareUnavailable: "Could not prepare the insight image right now.",
        releaseAction: "Detach",
        releaseWaiting: "Blow into the mic or tap again",
        releaseFallback: "Tap again to complete the detachment.",
        releaseInProgress: "Detaching...",
        disclaimer: "Dawayir is a self-insight tool and not a substitute for professional support.",
      };
}

function sectionItems(summary: LiveSessionSummary | null, key: "breakthroughs" | "nextMoves") {
  return Array.isArray(summary?.[key]) ? summary[key] : [];
}

export default function LiveSessionCompletePage({ sessionId }: { sessionId: string }) {
  const [detail, setDetail] = useState<LiveSessionDetail | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSharingInsight, setIsSharingInsight] = useState(false);
  const [truthMarkedDone, setTruthMarkedDone] = useState(false);
  const [truthCountdown, setTruthCountdown] = useState("");
  const [truthIsUrgent, setTruthIsUrgent] = useState(false);
  const [isWaitingForRelease, setIsWaitingForRelease] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const blowFrameRef = useRef<number | null>(null);
  const blowStreakRef = useRef(0);

  useEffect(() => {
    void getLiveSession(sessionId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "complete_failed"));
  }, [sessionId]);

  const summary = useMemo(() => detail?.session.summary ?? null, [detail]);
  const truthArtifact = useMemo(() => findArtifact(detail?.artifacts ?? [], "truth_contract"), [detail]);
  const loopRecallArtifact = useMemo(() => findArtifact(detail?.artifacts ?? [], "loop_recall"), [detail]);
  const metrics = detail?.session.metrics;
  const isArabic = detail?.session.language === "ar";
  const language = isArabic ? "ar" : "en";
  const copy = useMemo(() => createCopy(isArabic), [isArabic]);

  const journeyPath = useMemo(() => getJourneyPath(detail), [detail]);
  const transitionCount = useMemo(() => {
    if (journeyPath.length <= 1) return 0;
    let count = 0;
    for (let index = 1; index < journeyPath.length; index += 1) {
      if (journeyPath[index] !== journeyPath[index - 1]) count += 1;
    }
    return count;
  }, [journeyPath]);

  const dominantNodeId = useMemo(() => {
    const latestFrame = [...(detail?.replayFrames ?? [])].sort((left, right) => (left.seq || 0) - (right.seq || 0)).at(-1);
    const dominant = [...(latestFrame?.frame.circles ?? [])].sort((left, right) => right.radius - left.radius)[0];
    return Number(dominant?.id) || 1;
  }, [detail]);

  const sessionDurationMs = useMemo(() => {
    if (!detail?.session.started_at) return 0;
    const started = new Date(detail.session.started_at).getTime();
    const ended = detail.session.ended_at ? new Date(detail.session.ended_at).getTime() : new Date(detail.session.updated_at).getTime();
    return Math.max(0, ended - started);
  }, [detail]);

  const truthContract = truthArtifact?.content ?? null;
  const loopRecall = loopRecallArtifact?.content ?? null;
  const sessionTitle = summary?.title || detail?.session.title || copy.sessionFallback;
  const headline = summary?.headline || copy.sessionHeadline;
  const breakthroughs = sectionItems(summary, "breakthroughs");
  const nextMoves = sectionItems(summary, "nextMoves");
  const truthPromises = coerceStringArray(truthContract?.promises);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTruthMarkedDone(window.localStorage.getItem(truthContractStorageKey(sessionId)) === "done");
  }, [sessionId]);

  useEffect(() => {
    if (!detail || typeof window === "undefined") return;
    const key = sessionHistorySavedKey(sessionId);
    if (window.localStorage.getItem(key) === "saved") return;

    saveSessionSummary({
      dominantNodeId,
      clarityDelta: metrics?.clarityDelta ?? 0,
      overloadIndex: metrics?.overloadIndex ?? 0,
      transitionCount,
    });
    window.localStorage.setItem(key, "saved");
  }, [detail, dominantNodeId, metrics?.clarityDelta, metrics?.overloadIndex, sessionId, transitionCount]);

  useEffect(() => {
    if (!truthArtifact?.created_at || truthMarkedDone) {
      setTruthCountdown("");
      setTruthIsUrgent(false);
      return;
    }

    const updateCountdown = () => {
      const created = new Date(truthArtifact.created_at).getTime();
      const deadline = created + 24 * 60 * 60 * 1000;
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setTruthCountdown(copy.timeUp);
        setTruthIsUrgent(true);
        return;
      }

      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
      setTruthCountdown(`${hours}h ${String(minutes).padStart(2, "0")}m`);
      setTruthIsUrgent(remaining < 4 * 60 * 60 * 1000);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 60_000);
    return () => window.clearInterval(timer);
  }, [copy.timeUp, truthArtifact?.created_at, truthMarkedDone]);

  useEffect(() => {
    if (!isWaitingForRelease || isReleasing || typeof window === "undefined") return undefined;

    let isActive = true;
    let stream: MediaStream | null = null;
    blowStreakRef.current = 0;

    const cleanup = () => {
      if (blowFrameRef.current) {
        window.cancelAnimationFrame(blowFrameRef.current);
        blowFrameRef.current = null;
      }

      stream?.getTracks().forEach((track) => track.stop());
      stream = null;

      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };

    const fallbackTimer = window.setTimeout(() => {
      if (!isActive) return;
      setIsWaitingForRelease(false);
      setIsReleasing(true);
    }, 5000);

    const startListening = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isActive || !stream) return;

        const audioContext = new window.AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const detectBlow = () => {
          if (!isActive) return;

          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let index = 0; index < 10; index += 1) {
            sum += data[index] ?? 0;
          }

          const average = sum / 10;
          if (average > 145) {
            blowStreakRef.current += 1;
          } else {
            blowStreakRef.current = Math.max(0, blowStreakRef.current - 2);
          }

          if (blowStreakRef.current > 18) {
            setIsWaitingForRelease(false);
            setIsReleasing(true);
            return;
          }

          blowFrameRef.current = window.requestAnimationFrame(detectBlow);
        };

        detectBlow();
      } catch {
        setShareNotice(copy.releaseFallback);
      }
    };

    void startListening();

    return () => {
      isActive = false;
      window.clearTimeout(fallbackTimer);
      cleanup();
    };
  }, [copy.releaseFallback, isReleasing, isWaitingForRelease]);

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    printRef.current.classList.add("complete-card--exporting");

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: "#060618",
        windowWidth: 1000,
        logging: false,
        useCORS: true,
      });

      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(image, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dawayir-insight-${sessionId}.pdf`);
    } catch (exportError) {
      console.error("Failed to export PDF", exportError);
    } finally {
      printRef.current.classList.remove("complete-card--exporting");
      setIsExporting(false);
    }
  };

  const handleShareInsight = async () => {
    if (!printRef.current) return;

    setIsSharingInsight(true);
    setShareNotice(null);

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: "#060618",
        windowWidth: 1000,
        logging: false,
        useCORS: true,
      });

      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error("INSIGHT_BLOB_FAILED");

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        const file = new File([blob], `dawayir-insight-${sessionId}.png`, { type: "image/png" });
        const shareData: ShareData = { title: sessionTitle, files: [file] };

        if (!navigator.canShare || navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            return;
          } catch (shareError) {
            if (shareError instanceof DOMException && shareError.name === "AbortError") {
              return;
            }
          }
        }
      }

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setShareNotice(copy.shareCopied);
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `dawayir-insight-${sessionId}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
      setShareNotice(copy.shareDownloaded);
    } catch (shareError) {
      console.error("Failed to share insight", shareError);
      setShareNotice(copy.shareUnavailable);
    } finally {
      setIsSharingInsight(false);
    }
  };

  const handleTruthAction = () => {
    setTruthMarkedDone(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(truthContractStorageKey(sessionId), "done");
    }
  };

  const handleRelease = () => {
    if (isReleasing) return;
    if (isWaitingForRelease) {
      setIsWaitingForRelease(false);
      setIsReleasing(true);
      return;
    }

    setShareNotice(null);
    setIsWaitingForRelease(true);
  };

  const handleJudgeShare = async () => {
    const result = await createLiveShare(sessionId).catch(() => null);
    setShareUrl(result?.url ?? null);
    if (!result?.url) {
      setShareNotice(copy.shareUnavailable);
    }
  };

  if (error) {
    return (
      <div className="complete-overlay min-h-screen px-4 py-12 text-white">
        <div className="complete-card mx-auto text-center">
          <h1 className="complete-title">{error === "AUTH_REQUIRED" ? copy.authTitle : copy.openFailed}</h1>
          <p className="complete-subtitle">{error === "AUTH_REQUIRED" ? copy.authBody : error}</p>
          <div className="complete-actions-row">
            <button className="primary-btn complete-action-btn" onClick={() => assignUrl("/dawayir-live/history")}>
              {copy.backToMemoryBank}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return <div className="min-h-screen bg-slate-950 p-8 text-white">{copy.loading}</div>;
  }

  return (
    <div className="complete-screen complete-overlay min-h-screen px-4 py-10 text-white">
      <SandMandala targetRef={printRef} isActive={isReleasing} onComplete={() => assignUrl("/dawayir-live")} />

      <div ref={printRef} className={`complete-card mx-auto ${isReleasing ? "complete-card--releasing" : ""}`}>
        <div className="success-icon-container">
          <div className="pdf-logo-mark">
            <svg width="40" height="40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--ds-gold-400, #ffd166)" strokeWidth="1" strokeDasharray="5,5" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="var(--ds-cyan-500, #38b2d8)" strokeWidth="2" />
              <circle cx="50" cy="50" r="5" fill="#9b59b6" />
            </svg>
          </div>
          <svg aria-hidden="true" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--ds-green-500, #00ff94)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className="complete-title" data-view-heading="complete" tabIndex={-1}>
          {copy.completeHeading}
        </h1>
        <p className="complete-session-name">{sessionTitle}</p>

        <div className="sc-arc-seen">
          <div className="sc-arc-label" aria-hidden="true">
            {copy.seenArc}
          </div>
          <div className="mirror-sentence-container">
            <MirrorSentence journeyPath={journeyPath} transitionCount={transitionCount} language={language} />
            <p className="complete-subtitle complete-subtitle-tight">{headline}</p>
          </div>
          <p className="complete-subtitle">{summary?.headline || copy.storedHeadline}</p>
        </div>

        <div className="sc-arc-clear">
          <div className="sc-arc-label" aria-hidden="true">
            {copy.clarityArc}
          </div>

          <JourneyTimeline
            journeyPath={journeyPath}
            transitionCount={transitionCount}
            sessionDurationMs={sessionDurationMs}
            language={language}
          />

          <div className="complete-stats-table">
            <div className="complete-stat-row complete-stat-row-divider">
              <span className="complete-stat-label">{copy.equilibrium}</span>
              <span className="complete-stat-value complete-stat-success">{Math.round((metrics?.equilibriumScore ?? 0) * 100)}%</span>
            </div>
            <div className="complete-stat-row complete-stat-row-divider">
              <span className="complete-stat-label">{copy.overload}</span>
              <span className="complete-stat-value complete-stat-info">{Math.round((metrics?.overloadIndex ?? 0) * 100)}%</span>
            </div>
            <div className="complete-stat-row">
              <span className="complete-stat-label">{copy.clarity}</span>
              <span className={`complete-stat-value ${(metrics?.clarityDelta ?? 0) >= 0 ? "complete-stat-success" : "complete-stat-magenta"}`}>
                {formatPercent(metrics?.clarityDelta ?? 0)}
              </span>
            </div>
          </div>

          <CognitiveWeatherSummary
            dominantNodeId={dominantNodeId}
            clarityDelta={metrics?.clarityDelta ?? 0}
            overloadIndex={metrics?.overloadIndex ?? 0}
            language={language}
          />

          {truthContract && (
            <div className={`session-action-card ${truthIsUrgent && !truthMarkedDone ? "session-action-card--urgent" : ""}`}>
              <div className="sac-header">
                <span className="sac-icon" aria-hidden="true">
                  <Gem size={16} />
                </span>
                <span className="sac-title">{copy.truthContract}</span>
                {truthMarkedDone && (
                  <span className="sac-badge newly-completed">
                    <BadgeCheck size={14} /> {copy.truthDone}
                  </span>
                )}
                {!truthMarkedDone && truthCountdown && (
                  <span className={`sac-countdown ${truthIsUrgent ? "sac-countdown--urgent" : ""}`}>
                    <Clock3 size={14} /> {truthCountdown}
                  </span>
                )}
              </div>

              <p className="sac-body">{coerceString(truthContract.reminder, copy.truthReminderFallback)}</p>

              <div className="complete-pill-list">
                {truthPromises.map((item) => (
                  <div key={item} className="complete-pill-card">
                    {item}
                  </div>
                ))}
              </div>

              {!truthMarkedDone && (
                <button className="primary-btn complete-action-btn" style={{ marginTop: "14px" }} onClick={handleTruthAction}>
                  {copy.truthAction}
                </button>
              )}
            </div>
          )}

          {loopRecall && (
            <div className="complete-section-card">
              <p className="complete-section-kicker">{copy.loopRecall}</p>
              <div className="complete-grid-three">
                <div className="complete-subcard">
                  <div className="complete-subcard-label">{copy.trigger}</div>
                  <div className="complete-subcard-value">{coerceString(loopRecall.trigger)}</div>
                </div>
                <div className="complete-subcard">
                  <div className="complete-subcard-label">{copy.interrupt}</div>
                  <div className="complete-subcard-value">{coerceString(loopRecall.interruption)}</div>
                </div>
                <div className="complete-subcard">
                  <div className="complete-subcard-label">{copy.reward}</div>
                  <div className="complete-subcard-value">{coerceString(loopRecall.reward)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="complete-section-card">
            <p className="complete-section-kicker">{copy.breakthroughs}</p>
            <div className="complete-stack-list">
              {breakthroughs.map((item) => (
                <div key={item} className="complete-subcard">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="complete-section-card">
            <p className="complete-section-kicker">{copy.nextMoves}</p>
            <div className="complete-stack-list">
              {nextMoves.map((item) => (
                <div key={item} className="complete-subcard">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <WeeklyPatternCard language={language} />
        </div>

        <div className="sc-arc-ready complete-ready-arc">
          <div className="sc-arc-label" aria-hidden="true">
            {copy.readyArc}
          </div>

          <div className="complete-actions-row">
            <div className="complete-primary-row">
              <button className="primary-btn complete-action-btn" onClick={() => assignUrl("/dawayir-live")}>
                {copy.newSession}
              </button>
              <button className="primary-btn complete-action-btn complete-action-secondary" onClick={() => assignUrl("/dawayir-live/history")}>
                {copy.memoryBank}
              </button>
            </div>

            <div className="complete-primary-row">
              <button className="primary-btn complete-action-btn complete-action-secondary" onClick={() => assignUrl(`/dawayir-live/replay/${sessionId}`)}>
                <RotateCcw className="inline-block h-4 w-4" /> Replay
              </button>
              <button className="primary-btn complete-action-btn complete-action-secondary" onClick={handleJudgeShare}>
                <Link2 className="inline-block h-4 w-4" /> {copy.judgeShare}
              </button>
            </div>

            <div className="complete-primary-row">
              <button className="primary-btn complete-action-btn complete-action-secondary" onClick={handleExportPdf} disabled={isExporting}>
                <Download className="inline-block h-4 w-4" /> {isExporting ? copy.exporting : copy.insightDocument}
              </button>
              <button className="primary-btn complete-action-btn complete-action-secondary" onClick={handleShareInsight} disabled={isSharingInsight}>
                <Share2 className="inline-block h-4 w-4" /> {isSharingInsight ? copy.sharing : copy.shareInsight}
              </button>
            </div>

            <button
              className={`primary-btn complete-action-btn complete-action-secondary ${isWaitingForRelease ? "listening-for-release" : ""}`}
              onClick={handleRelease}
            >
              <Wind className="inline-block h-4 w-4" />{" "}
              {isReleasing ? copy.releaseInProgress : isWaitingForRelease ? copy.releaseWaiting : copy.releaseAction}
            </button>
          </div>

          {(shareUrl || shareNotice) && (
            <div className="complete-share-banner">
              {shareNotice && <div>{shareNotice}</div>}
              {shareUrl && (
                <div>
                  {copy.shareLink}:{" "}
                  <a href={shareUrl} className="underline" target="_blank" rel="noreferrer">
                    {shareUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="complete-section-card">
            <p className="complete-section-kicker">{copy.artifacts}</p>
            <div className="complete-artifact-grid">
              {detail.artifacts.map((artifact) => (
                <div key={artifact.id} className="complete-subcard">
                  <div className="complete-artifact-title">{artifact.title || artifact.artifact_type}</div>
                  <div className="complete-subcard-label">{artifact.artifact_type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="complete-disclaimer">{copy.disclaimer}</div>
    </div>
  );
}
