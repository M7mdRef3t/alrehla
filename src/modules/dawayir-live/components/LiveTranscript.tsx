"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LiveLanguage, LiveSessionSummary, TranscriptEntry } from "../types";

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  isVisible: boolean;
  onToggle: () => void;
  showToggle?: boolean;
  language?: LiveLanguage;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  isVoiceSearchListening?: boolean;
  onToggleVoiceSearch?: () => void;
  latestSummary?: LiveSessionSummary | null;
  latestTranscriptLine?: string | null;
}

export default function LiveTranscript({
  entries,
  isVisible,
  onToggle,
  showToggle = true,
  language = "ar",
  searchQuery = "",
  onSearchQueryChange,
  isVoiceSearchListening = false,
  onToggleVoiceSearch,
  latestSummary = null,
  latestTranscriptLine = null,
}: LiveTranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries, isVisible]);

  const filteredEntries = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return entries;
    return entries.filter((entry) => entry.text.toLowerCase().includes(normalized));
  }, [entries, searchQuery]);

  const lastAgentIndex = useMemo(
    () => (Array.isArray(filteredEntries) ? filteredEntries.findLastIndex((entry) => entry.role === "agent") : -1),
    [filteredEntries],
  );

  const speakerLabel = (role: TranscriptEntry["role"]) => {
    if (role === "agent") return "Dawayir";
    if (role === "user") return language === "ar" ? "أنت" : "You";
    return "System";
  };

  const summaryTopics = latestSummary?.breakthroughs?.length
    ? latestSummary.breakthroughs.slice(0, 3)
    : [
        language === "ar" ? "التوازن والضغط والوضوح" : "Equilibrium, overload, and clarity",
        language === "ar" ? "الاستماع النشط" : "Active listening",
        language === "ar" ? "أنماط النزاع" : "Conflict patterns",
      ];
  const summaryMoves = latestSummary?.nextMoves?.length
    ? latestSummary.nextMoves.slice(0, 2)
    : [
        language === "ar" ? "ثبّت ملاحظة واحدة" : "Pin one note",
        language === "ar" ? "راجعها لاحقًا" : "Revisit it later",
      ];

  return (
    <section
      className={`transcript-container ${isVisible ? "open" : "closed"} ${showToggle ? "" : "no-toggle"}`.trim()}
      aria-label="Live transcript"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {showToggle && (
        <button
          className="transcript-toggle-btn"
          onClick={onToggle}
          aria-expanded={isVisible}
          aria-controls="live-transcript"
          title={
            isVisible
              ? language === "ar"
                ? "إخفاء المحادثة"
                : "Hide transcript"
              : language === "ar"
                ? "إظهار المحادثة"
                : "Show transcript"
          }
        >
          {language === "ar" ? (isVisible ? "◌ المحادثة" : "◎ المحادثة") : isVisible ? "◌ Transcript" : "◎ Transcript"}
        </button>
      )}

      <div className="transcript-overlay" style={{ display: isVisible ? "block" : "none" }}>
        <div className="transcript-summary-strip">
          <div className="transcript-summary-strip__label">
            {language === "ar" ? "ملخص سريع" : "Quick summary"}
          </div>
          <div className="transcript-summary-strip__body">
            {latestSummary?.headline || (language === "ar" ? "الملخص الآني سيظهر هنا من الجلسة نفسها." : "The live summary will appear here from the current session.")}
          </div>
          <div className="transcript-summary-strip__live-line">
            {latestTranscriptLine ||
              (language === "ar"
                ? "آخر سطر مسجل سيظهر هنا."
                : "The latest captured line will appear here.")}
          </div>
          <div className="transcript-summary-strip__chips">
            {summaryTopics.map((item) => (
              <span key={item} className="transcript-summary-chip">
                {item}
              </span>
            ))}
            {summaryMoves.map((item) => (
              <span key={item} className="transcript-summary-chip transcript-summary-chip--soft">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="transcript-search-row">
          <input
            className="transcript-search-input"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange?.(event.target.value)}
            placeholder={language === "ar" ? "ابحث داخل الحوار..." : "Search the transcript..."}
            dir={language === "ar" ? "rtl" : "ltr"}
          />
          <button
            type="button"
            className={`transcript-voice-search ${isVoiceSearchListening ? "active" : ""}`}
            onClick={onToggleVoiceSearch}
            disabled={!onToggleVoiceSearch}
          >
            {isVoiceSearchListening ? "🎙" : "🎤"}
          </button>
        </div>
        <div
          className="transcript-messages"
          id="live-transcript"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {filteredEntries.length === 0 && (
            <div className="transcript-entry">
              <span className="transcript-speaker">Live</span>
              <span className="transcript-text">
                {language === "ar" ? "ابدأ الكلام وسيظهر النص هنا." : "Start speaking and the transcript will appear here."}
              </span>
            </div>
          )}

          {filteredEntries.map((entry, index) => {
            const isAgent = entry.role === "agent";
            const isLastAgent = isAgent && index === lastAgentIndex;
            return (
              <div
                key={`${entry.timestamp}-${index}`}
                className={`transcript-entry transcript-${entry.role}`}
                style={{
                  borderLeft: entry.role === "user" ? `2px solid ${entry.color || "rgba(255,209,102,0.45)"}` : undefined,
                  borderRight: isAgent ? `2px solid ${entry.color || "rgba(56,178,216,0.45)"}` : undefined,
                  background: entry.color ? `${entry.color}12` : undefined,
                  textShadow: isLastAgent ? `0 0 10px ${entry.color || "rgba(56,178,216,0.36)"}` : undefined,
                }}
              >
                <span className="transcript-speaker">{speakerLabel(entry.role)}</span>
                <span className="transcript-time">
                  {new Date(entry.timestamp).toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="transcript-text">{entry.text}</span>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>
    </section>
  );
}
