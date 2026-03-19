"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LiveLanguage, TranscriptEntry } from "../types";

interface LiveTranscriptProps {
  entries: TranscriptEntry[];
  isVisible: boolean;
  onToggle: () => void;
  showToggle?: boolean;
  language?: LiveLanguage;
}

export default function LiveTranscript({
  entries,
  isVisible,
  onToggle,
  showToggle = true,
  language = "ar",
}: LiveTranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries, isVisible]);

  const lastAgentIndex = useMemo(
    () => (Array.isArray(entries) ? entries.findLastIndex((entry) => entry.role === "agent") : -1),
    [entries],
  );

  const speakerLabel = (role: TranscriptEntry["role"]) => {
    if (role === "agent") return "Dawayir";
    if (role === "user") return language === "ar" ? "أنت" : "You";
    return "System";
  };

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
        <div
          className="transcript-messages"
          id="live-transcript"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {entries.length === 0 && (
            <div className="transcript-entry">
              <span className="transcript-speaker">Live</span>
              <span className="transcript-text">
                {language === "ar" ? "ابدأ الكلام وسيظهر النص هنا." : "Start speaking and the transcript will appear here."}
              </span>
            </div>
          )}

          {entries.map((entry, index) => {
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
