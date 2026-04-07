"use client";

import type { FormEvent } from "react";
import { ArrowRight, Eye, History, Link2, MessageSquareText, Mic, MicOff, Send, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import type { CognitiveMetrics, JourneyStage, LiveLanguage, SessionStatus, TruthContract } from '../types';

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
  composer: string;
  onComposerChange: (value: string) => void;
  onSendText: () => void;
  onToggleTranscript: () => void;
  onToggleMic: () => void;
  onToggleSilentMirror: () => void;
  onEndSession: () => void;
  onOpenHistory: () => void;
  onShare: () => void;
  onBack: () => void;
  showBreathingGuide?: boolean;
  isSilentMirrorMode?: boolean;
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
  composer,
  onComposerChange,
  onSendText,
  onToggleTranscript,
  onToggleMic,
  onToggleSilentMirror,
  onEndSession,
  onOpenHistory,
  onShare,
  onBack,
  showBreathingGuide = false,
  isSilentMirrorMode = false,
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
              id="live-hud-composer"
              name="liveHudComposer"
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
