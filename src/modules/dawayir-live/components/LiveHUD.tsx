"use client";

import type { FormEvent } from "react";
import { ArrowRight, Camera, CameraOff, Eye, History, Hand, Link2, MessageSquareText, Mic, MicOff, PenLine, Record, Send, Sparkles, Smile, X } from "lucide-react";
import { motion } from "framer-motion";
import type { CognitiveMetrics, JourneyStage, LiveLanguage, LiveSessionSummary, SessionStatus, TruthContract } from "../types";

interface LiveHUDProps {
  language: LiveLanguage;
  status: SessionStatus;
  isMicActive: boolean;
  isAgentSpeaking: boolean;
  isTranscriptVisible: boolean;
  metrics: CognitiveMetrics;
  journeyStage: JourneyStage;
  whyNowLine: string | null;
  latestTruthContract: TruthContract | null;
  latestSummary?: LiveSessionSummary | null;
  composer: string;
  onComposerChange: (value: string) => void;
  onSendText: () => void;
  onToggleTranscript: () => void;
  onToggleMic: () => void;
  onToggleCamera?: () => void;
  onToggleHandRaise?: () => void;
  onCycleReaction?: () => void;
  onToggleWhiteboard?: () => void;
  onSelectWhiteboardTool?: (tool: "pen" | "shape" | "eraser") => void;
  onPinNote?: () => void;
  onToggleRecording?: () => void;
  notesDraft: string;
  onNotesDraftChange: (value: string) => void;
  onToggleSilentMirror: () => void;
  onEndSession: () => void;
  onOpenHistory: () => void;
  onShare: () => void;
  onBack: () => void;
  showBreathingGuide?: boolean;
  isSilentMirrorMode?: boolean;
  isCameraActive?: boolean;
  isHandRaised?: boolean;
  currentReaction?: string | null;
  isWhiteboardOpen?: boolean;
  pinnedNote?: string;
  whiteboardTool?: "pen" | "shape" | "eraser";
  isRecording?: boolean;
  recordSeconds?: number;
  transcriptCount?: number;
  transcriptTab?: "notes" | "transcript" | "summary";
  onChangeTranscriptTab?: (tab: "notes" | "transcript" | "summary") => void;
  transcriptQuery?: string;
  onTranscriptQueryChange?: (value: string) => void;
  isVoiceSearchListening?: boolean;
  onToggleVoiceSearch?: () => void;
}

const STAGE_ORDER: JourneyStage[] = ["Overwhelmed", "Focus", "Clarity"];

const COPY = {
  ar: {
    brandName: "Dawayir",
    brandSub: "دوائر حية",
    whyNow: "ليه دلوقتي",
    latestTruth: "آخر Truth Contract",
    truthFallback: "كل جلسة تنتهي بوعد واحد واضح بدل الإغراق في النصائح.",
    equilibrium: "التوازن",
    overload: "الضغط",
    clarity: "الوضوح",
    speaking: "دواير تتكلم الآن",
    listening: "المجال يسمعك",
    idle: "المجال ثابت وينتظر الإشارة التالية",
    transcript: "المحادثة",
    micOn: "الميك مفتوح",
    micOff: "الميك مغلق",
    silentMirror: "مرآة صامتة",
    silentMirrorOn: "الدوائر بتتكلم، والذكاء صامت",
    endSession: "إنهاء الجلسة",
    commandLabel: "اكتب لو تريد أن توجه الجلسة بالنص",
    commandPlaceholder: "اكتب ما تريد قوله لو لم تستخدم الميكروفون...",
    send: "إرسال",
    settle: "إعادة تنظيم",
    liveMeter: "نبض المجال",
    stages: {
      Overwhelmed: "١. التشوش",
      Focus: "٢. التركيز",
      Clarity: "٣. الوضوح",
    },
  },
  en: {
    brandName: "Dawayir",
    brandSub: "Live Mirror",
    whyNow: "Why Now",
    latestTruth: "Latest Truth Contract",
    truthFallback: "Each session should leave one clear promise instead of more noise.",
    equilibrium: "Equilibrium",
    overload: "Overload",
    clarity: "Clarity",
    speaking: "Dawayir is speaking",
    listening: "The field is listening",
    idle: "The field is calm and waiting",
    transcript: "Transcript",
    micOn: "Mic On",
    micOff: "Mic Off",
    silentMirror: "Silent Mirror",
    silentMirrorOn: "Circles speak, AI stays silent",
    endSession: "End Session",
    commandLabel: "Type if you want to steer the session with text",
    commandPlaceholder: "Type what you want to say if you are not using the microphone...",
    send: "Send",
    settle: "Regulate",
    liveMeter: "Field pulse",
    stages: {
      Overwhelmed: "1. Overwhelmed",
      Focus: "2. Focus",
      Clarity: "3. Clarity",
    },
  },
} as const;

function getStatusTone(status: SessionStatus, isAgentSpeaking: boolean) {
  if (isAgentSpeaking || status === "speaking") return "speaking";
  if (status === "connected") return "connected";
  if (status === "connecting" || status === "bootstrapping" || status === "setup") return "connecting";
  if (status === "error") return "error";
  return "disconnected";
}

function getStatusText(status: SessionStatus, isAgentSpeaking: boolean, language: LiveLanguage) {
  if (language === "ar") {
    if (isAgentSpeaking || status === "speaking") return "صوتك يُترجم الآن";
    if (status === "connected") return "المجال متصل";
    if (status === "connecting" || status === "bootstrapping" || status === "setup") return "جارٍ التوصيل";
    if (status === "error") return "تعذر الاتصال";
    return "غير متصل";
  }

  if (isAgentSpeaking || status === "speaking") return "Reflecting in real time";
  if (status === "connected") return "Live and connected";
  if (status === "connecting" || status === "bootstrapping" || status === "setup") return "Connecting";
  if (status === "error") return "Connection failed";
  return "Disconnected";
}

function metricValue(value: number, signed = false) {
  const normalized = signed ? value * 100 : Math.max(0, value) * 100;
  const rounded = Math.round(normalized);
  if (!signed) return `${rounded}%`;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

export default function LiveHUD({
  language,
  status,
  isMicActive,
  isAgentSpeaking,
  isTranscriptVisible,
  metrics,
  journeyStage,
  whyNowLine,
  latestTruthContract,
  latestSummary = null,
  composer,
  onComposerChange,
  onSendText,
  onToggleTranscript,
  onToggleMic,
  onToggleCamera,
  onToggleHandRaise,
  onCycleReaction,
  onToggleWhiteboard,
  onSelectWhiteboardTool,
  onPinNote,
  onToggleRecording,
  notesDraft,
  onNotesDraftChange,
  onToggleSilentMirror,
  onEndSession,
  onOpenHistory,
  onShare,
  onBack,
  showBreathingGuide = false,
  isSilentMirrorMode = false,
  isCameraActive = true,
  isHandRaised = false,
  currentReaction = null,
  isWhiteboardOpen = false,
  pinnedNote = "",
  whiteboardTool = "pen",
  isRecording = false,
  recordSeconds = 0,
  transcriptCount = 0,
  transcriptTab = "notes",
  onChangeTranscriptTab,
  transcriptQuery = "",
  onTranscriptQueryChange,
  isVoiceSearchListening = false,
  onToggleVoiceSearch,
}: LiveHUDProps) {
  const copy = COPY[language];
  const statusTone = getStatusTone(status, isAgentSpeaking);
  const truthAction = latestTruthContract?.promises?.[0] || latestTruthContract?.reminder || copy.truthFallback;
  const truthAnchor = latestTruthContract?.reminder || latestTruthContract?.avoidPatterns?.[0] || null;
  const canToggleMic = status === "connected" || status === "speaking";
  const pulseState = isAgentSpeaking ? "agent" : isMicActive ? "user" : "silent";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSendText();
  };

  const formatRecordTime = (seconds: number) => {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  };

  const summaryTopics = latestSummary?.breakthroughs?.length
    ? latestSummary.breakthroughs.slice(0, 3)
    : [
        language === "ar" ? "التوازن والضغط والوضوح" : "Equilibrium, overload, and clarity",
        language === "ar" ? "الاستماع النشط" : "Active listening",
        language === "ar" ? "أنماط النزاع" : "Conflict patterns",
      ];
  const summaryInsights = latestSummary?.headline
    ? [latestSummary.headline, ...(latestSummary.nextMoves?.slice(0, 2) ?? [])]
    : [
        language === "ar"
          ? "الملخص الذكي سيظهر هنا من الجلسة الفعلية."
          : "The live AI summary will appear here from the actual session.",
        language === "ar" ? "ثبّت ملاحظة واحدة للعودة إليها لاحقًا." : "Pin one note to revisit later.",
      ];

  return (
    <>
      <aside className="overlay live-panel" role="complementary" aria-label={language === "ar" ? "لوحة الجلسة" : "Live session panel"}>
        <div className="brand-header">
          <div className="brand-logo-row">
            <div className="brand-stack">
              <button type="button" className="live-back-btn" onClick={onBack} aria-label={language === "ar" ? "رجوع" : "Back"}>
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="brand-mark" aria-hidden="true">
                <span className="brand-mark-circle brand-mark-1" />
                <span className="brand-mark-circle brand-mark-2" />
                <span className="brand-mark-circle brand-mark-3" />
              </div>
              <div>
                <div className="brand-name">{copy.brandName}</div>
                <div className="brand-arabic">{copy.brandSub}</div>
              </div>
            </div>

            <div className="header-actions">
              <button
                type="button"
                className={`live-record-btn ${isRecording ? "active" : ""}`}
                onClick={onToggleRecording}
                disabled={!onToggleRecording}
                aria-pressed={isRecording}
              >
                <Record className="h-4 w-4" />
                <span>{isRecording ? "Recording" : language === "ar" ? "تسجيل" : "Record"}</span>
                {isRecording && <span className="hud-state-badge">{formatRecordTime(recordSeconds)}</span>}
              </button>
              <button type="button" className="live-icon-btn" onClick={onOpenHistory} aria-label={language === "ar" ? "السجل" : "History"}>
                <History className="h-4 w-4" />
              </button>
              <button type="button" className="live-icon-btn" onClick={onShare} aria-label={language === "ar" ? "مشاركة" : "Share"}>
                <Link2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={`status-badge ${statusTone}`}>
            <span className="dot" />
            {getStatusText(status, isAgentSpeaking, language)}
          </div>

          <div className={`ai-state-bar ${statusTone}`}>
            <div className="wave" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <span>{isAgentSpeaking ? copy.speaking : isMicActive ? copy.listening : copy.idle}</span>
            <div className={`live-state-meter ${pulseState}`} aria-hidden="true">
              <span className="mic-level-dot" />
              <span className="mic-level-dot" />
              <span className="mic-level-dot" />
            </div>
          </div>

          {showBreathingGuide && (
            <div className="live-guidance-pill">
              <Sparkles className="h-4 w-4" />
              <span>{copy.settle}</span>
            </div>
          )}

          <div className="timeline-overlay">
            {STAGE_ORDER.map((stage) => {
              const isCompleted = STAGE_ORDER.indexOf(journeyStage) > STAGE_ORDER.indexOf(stage);
              const isActive = journeyStage === stage;
              return (
                <div key={stage} className={`timeline-node ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}>
                  <div className="node-dot" />
                  <span className="node-label">{copy.stages[stage]}</span>
                </div>
              );
            })}
          </div>

          {(whyNowLine || truthAction) && (
            <motion.div
              className={`why-now-line ${journeyStage.toLowerCase()}`}
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="why-now-label">{copy.whyNow}</div>
              {whyNowLine || truthAction}
            </motion.div>
          )}

          <div className="truth-contract-live-card">
            <div className="truth-contract-label">{copy.latestTruth}</div>
            <div className="truth-contract-action">{truthAction}</div>
            {truthAnchor && <div className="truth-contract-anchor">{truthAnchor}</div>}
          </div>
        </div>

        <div className="section">
          <div className="notes-tabs">
            {(["notes", "transcript", "summary"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`notes-tab ${transcriptTab === tab ? "active" : ""}`}
                onClick={() => onChangeTranscriptTab?.(tab)}
                disabled={!onChangeTranscriptTab}
              >
                {tab === "notes" ? (language === "ar" ? "Shared Notes" : "Shared Notes") : tab === "transcript" ? (language === "ar" ? "Live Transcript" : "Live Transcript") : (language === "ar" ? "AI Summary" : "AI Summary")}
                {tab === "transcript" && transcriptCount > 0 && (
                  <span className="notes-tab-badge">{transcriptCount}</span>
                )}
              </button>
            ))}
          </div>
          {transcriptTab === "notes" && (
            <>
              <div className="command-section-head">
                <PenLine className="h-4 w-4" />
                <span>{language === "ar" ? "ملاحظات مشتركة" : "Shared Notes"}</span>
              </div>
          <textarea
            className="shared-notes-input"
            value={notesDraft}
            onChange={(event) => onNotesDraftChange(event.target.value)}
            placeholder={language === "ar" ? "دوّن أهم نقطة هنا..." : "Write the key insight here..."}
            dir={language === "ar" ? "rtl" : "ltr"}
            rows={4}
          />
          <div className="shared-notes-footer">
            <span>{language === "ar" ? "يحفظ محليًا أثناء الجلسة" : "Saved locally during the session"}</span>
            <div className="shared-notes-actions">
              <button type="button" className={`prejoin-pill-link whiteboard-toggle ${isWhiteboardOpen ? "active" : ""}`} onClick={onToggleWhiteboard} disabled={!onToggleWhiteboard}>
                <PenLine className="h-4 w-4" />
                {language === "ar" ? "السبورة" : "Whiteboard"}
              </button>
              <button type="button" className="prejoin-pill-link whiteboard-toggle" onClick={onPinNote} disabled={!onPinNote || !notesDraft.trim()}>
                {language === "ar" ? "تثبيت" : "Pin note"}
              </button>
            </div>
          </div>
          {notesDraft.trim() && (
            <div className="shared-notes-pin-card">
              <div className="shared-notes-pin-label">{language === "ar" ? "ملاحظة مثبتة" : "Pinned note"}</div>
              <div className="shared-notes-pin-text">{pinnedNote.trim() || notesDraft.trim()}</div>
            </div>
          )}
          {isWhiteboardOpen && (
            <div className="shared-whiteboard-shell" aria-label={language === "ar" ? "السبورة التشاركية" : "Shared whiteboard"}>
              <div className="command-section-head">
                <PenLine className="h-4 w-4" />
                <span>{language === "ar" ? "السبورة التشاركية" : "Shared Whiteboard"}</span>
              </div>
              <div className="shared-whiteboard-canvas">
                <div className="shared-whiteboard-tools">
                  <button type="button" className={`shared-tool ${whiteboardTool === "pen" ? "active" : ""}`} onClick={() => onSelectWhiteboardTool?.("pen")}>
                    {language === "ar" ? "قلم" : "Pen"}
                  </button>
                  <button type="button" className={`shared-tool ${whiteboardTool === "shape" ? "active" : ""}`} onClick={() => onSelectWhiteboardTool?.("shape")}>
                    {language === "ar" ? "أشكال" : "Shapes"}
                  </button>
                  <button type="button" className={`shared-tool ${whiteboardTool === "eraser" ? "active" : ""}`} onClick={() => onSelectWhiteboardTool?.("eraser")}>
                    {language === "ar" ? "ممحاة" : "Erase"}
                  </button>
                </div>
                <div className="shared-whiteboard-note">
                  {language === "ar"
                    ? "تخيل هنا خطوطًا وأشكالًا سريعة داخل الجلسة."
                    : "Imagine quick lines and shapes drawn live in the session."}
                </div>
              </div>
            </div>
          )}
            </>
          )}
          {transcriptTab === "transcript" && (
            <div className="shared-transcript-preview">
              <div className="command-section-head">
                <MessageSquareText className="h-4 w-4" />
                <span>{language === "ar" ? "نسخ الحوار المباشر" : "Live Transcript"}</span>
              </div>
              <div className="shared-transcript-summary">
                <strong>{latestSummary?.headline || (language === "ar" ? "ملخص سريع" : "Quick summary")}</strong>
                <div>
                  {latestSummary?.nextMoves?.[0] ||
                    (language === "ar"
                      ? "ثبّت ملاحظة واحدة وراجعها لاحقًا."
                      : "Pin one note and revisit it later.")}
                </div>
              </div>
              <div className="shared-transcript-search">
                <input
                  type="search"
                  className="shared-transcript-input"
                  value={transcriptQuery}
                  onChange={(event) => onTranscriptQueryChange?.(event.target.value)}
                  placeholder={language === "ar" ? "ابحث داخل الحوار..." : "Search the transcript..."}
                  dir={language === "ar" ? "rtl" : "ltr"}
                />
                <button type="button" className={`shared-transcript-voice ${isVoiceSearchListening ? "active" : ""}`} onClick={onToggleVoiceSearch} disabled={!onToggleVoiceSearch}>
                  {isVoiceSearchListening ? "🎙" : "🎤"}
                </button>
              </div>
              <div className="shared-transcript-summary">
                {language === "ar"
                  ? "السجل المباشر يظهر هنا مع أسماء المتحدثين والطوابع الزمنية."
                  : "The live session log appears here with speaker names and timestamps."}
              </div>
            </div>
          )}
          {transcriptTab === "summary" && (
            <div className="shared-ai-summary">
              <div className="command-section-head">
                <Sparkles className="h-4 w-4" />
                <span>{language === "ar" ? "تلخيص الذكاء الاصطناعي" : "AI Summary"}</span>
              </div>
              <div className="shared-ai-summary-callout">
                {latestSummary?.headline || (language === "ar" ? "الملخص الذكي مأخوذ من الجلسة نفسها." : "The summary is pulled from the live session itself.")}
              </div>
              <div className="shared-ai-summary-grid">
                <div className="shared-ai-summary-panel">
                  <div className="shared-ai-summary-panel-title">{language === "ar" ? "المواضيع الرئيسية" : "Main topics"}</div>
                  <ul className="shared-ai-summary-list">
                    {summaryTopics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                </div>
                <div className="shared-ai-summary-panel">
                  <div className="shared-ai-summary-panel-title">{language === "ar" ? "الرؤى الجوهرية" : "Key insights"}</div>
                  <ul className="shared-ai-summary-list">
                    {summaryInsights.map((insight) => (
                      <li key={insight}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <ul className="ai-summary-list">
                <li>{language === "ar" ? "الخطوات القادمة: ثبّت ملاحظة واحدة وراجعها لاحقًا." : "Next steps: pin one note and revisit it later."}</li>
              </ul>
              <div className="ai-summary-keywords">
                {(latestSummary?.breakthroughs?.length
                  ? latestSummary.breakthroughs.slice(0, 3)
                  : ["Emotional resilience", "Active listening", "Conflict patterns"]
                ).map((keyword) => (
                  <span key={keyword} className="ai-summary-keyword">{keyword}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="section">
          <div className="cognitive-metrics-overlay">
            <div className="metric-item">
              <span className="metric-label">{copy.equilibrium}</span>
              <span className="metric-value">{metricValue(metrics.equilibriumScore)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{copy.overload}</span>
              <span className="metric-value negative">{metricValue(metrics.overloadIndex)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{copy.clarity}</span>
              <span className={`metric-value ${metrics.clarityDelta >= 0 ? "positive" : "negative"}`}>
                {metricValue(metrics.clarityDelta, true)}
              </span>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="command-section-head">
            <Sparkles className="h-4 w-4" />
            <span>{copy.commandLabel}</span>
          </div>
          <form className="command-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="command-input"
              value={composer}
              onChange={(event) => onComposerChange(event.target.value)}
              placeholder={copy.commandPlaceholder}
              dir={language === "ar" ? "rtl" : "ltr"}
            />
            <button type="submit" className="command-send-btn" disabled={!composer.trim()}>
              <Send className="h-4 w-4" />
              {copy.send}
            </button>
          </form>
        </div>
      </aside>

      <div className="breathing-hud">
        <button type="button" className={`secondary ds-btn hud-btn ${isTranscriptVisible ? "active" : ""}`} onClick={onToggleTranscript}>
          <MessageSquareText className="h-4 w-4" />
          {copy.transcript}
        </button>
        <button
          type="button"
          className={`secondary ds-btn hud-btn ${isMicActive ? "active" : ""}`}
          onClick={onToggleMic}
          disabled={!canToggleMic}
        >
          {isMicActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {isMicActive ? copy.micOn : copy.micOff}
        </button>
        <button
          type="button"
          className={`secondary ds-btn hud-btn ${isCameraActive ? "active" : ""}`}
          onClick={onToggleCamera}
          aria-pressed={isCameraActive}
          disabled={!onToggleCamera}
        >
          {isCameraActive ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
          {language === "ar" ? (isCameraActive ? "الكاميرا" : "الكاميرا مطفأة") : isCameraActive ? "Camera On" : "Camera Off"}
        </button>
        <button
          type="button"
          className={`secondary ds-btn hud-btn ${isHandRaised ? "active hand-raised" : ""}`}
          onClick={onToggleHandRaise}
          aria-pressed={isHandRaised}
          disabled={!onToggleHandRaise}
        >
          <Hand className="h-4 w-4" />
          {language === "ar" ? "رفع اليد" : "Raise Hand"}
          {isHandRaised && <span className="hud-state-badge">{language === "ar" ? "مفعل" : "On"}</span>}
        </button>
        <button
          type="button"
          className={`secondary ds-btn hud-btn ${currentReaction ? "active reaction" : ""}`}
          onClick={onCycleReaction}
          aria-pressed={Boolean(currentReaction)}
          disabled={!onCycleReaction}
        >
          <Smile className="h-4 w-4" />
          {currentReaction || (language === "ar" ? "رد فعل" : "Reaction")}
          {currentReaction && <span className="hud-state-badge">{currentReaction}</span>}
        </button>
        <button
          type="button"
          className={`secondary ds-btn hud-btn ${isWhiteboardOpen ? "active" : ""}`}
          onClick={onToggleWhiteboard}
          disabled={!onToggleWhiteboard}
        >
          <PenLine className="h-4 w-4" />
          {language === "ar" ? "سبورة" : "Board"}
        </button>
        <button
          type="button"
          className={`secondary ds-btn hud-btn ${isSilentMirrorMode ? "active silent-mirror" : ""}`}
          onClick={onToggleSilentMirror}
          aria-pressed={isSilentMirrorMode}
        >
          <Eye className="h-4 w-4" />
          {copy.silentMirror}
        </button>
        <div className="hud-pulse-pill" aria-label={copy.liveMeter}>
          <span>{copy.liveMeter}</span>
          <div className={`live-state-meter compact ${pulseState}`} aria-hidden="true">
            <span className="mic-level-dot" />
            <span className="mic-level-dot" />
            <span className="mic-level-dot" />
          </div>
        </div>
        <button type="button" className="secondary ds-btn disconnect-btn hud-btn" onClick={onEndSession}>
          <X className="h-4 w-4" />
          {copy.endSession}
        </button>
      </div>

      {isSilentMirrorMode && <div className="silent-mirror-overlay">{copy.silentMirrorOn}</div>}
    </>
  );
}
