"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveLanguage, TranscriptEntry } from '../types';

interface SacredPauseOverlayProps {
  language: LiveLanguage;
  isLive: boolean;
  isAgentSpeaking: boolean;
  transcript: TranscriptEntry[];
}

export default function SacredPauseOverlay({
  language,
  isLive,
  isAgentSpeaking,
  transcript,
}: SacredPauseOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [depth, setDepth] = useState(0);
  const dismissedUntilRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deepenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastTranscriptAt = transcript.length > 0 ? transcript[transcript.length - 1]?.timestamp ?? 0 : 0;

  useEffect(() => {
    if (!isLive) {
      setVisible(false);
      setDepth(0);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (deepenTimerRef.current) clearInterval(deepenTimerRef.current);
      return undefined;
    }

    if (Date.now() < dismissedUntilRef.current) return undefined;

    const silenceCandidate = !isAgentSpeaking && transcript.length > 0;
    if (!silenceCandidate) {
      setVisible(false);
      setDepth(0);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (deepenTimerRef.current) clearInterval(deepenTimerRef.current);
      return undefined;
    }

    const remaining = Math.max(0, 5000 - (Date.now() - lastTranscriptAt));
    silenceTimerRef.current = setTimeout(() => {
      setVisible(true);
      setDepth(0.25);
      if (deepenTimerRef.current) clearInterval(deepenTimerRef.current);
      deepenTimerRef.current = setInterval(() => {
        setDepth((current) => Math.min(1, current + 0.08));
      }, 500);
    }, remaining);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isAgentSpeaking, isLive, lastTranscriptAt, transcript.length]);

  useEffect(() => {
    if (isAgentSpeaking && visible) {
      setVisible(false);
      setDepth(0);
      if (deepenTimerRef.current) clearInterval(deepenTimerRef.current);
    }
  }, [isAgentSpeaking, visible]);

  if (!visible) return null;

  const messages =
    language === "ar"
      ? [
          "السكوت جزء من الرحلة",
          "مش لازم تقول حاجة دلوقتي",
          "اللي جواك بيأخذ وقته",
          "كل واحد يحتاج لحظة مثل هذه",
          "مش لازم تعرف... عشان تحس",
        ]
      : [
          "Silence is part of the journey",
          "You do not need to say anything right now",
          "What is inside is taking its time",
          "Everyone needs a moment like this",
          "You do not need to know to feel",
        ];

  const messageIndex = Math.min(Math.floor(depth * messages.length), messages.length - 1);

  return (
    <div className="sacred-pause-overlay" aria-live="polite">
      <div className="sacred-pause-card" style={{ opacity: 0.75 + depth * 0.25 }}>
        <button
          type="button"
          className="overlay-dismiss-btn"
          onClick={() => {
            dismissedUntilRef.current = Date.now() + 15000;
            setVisible(false);
            setDepth(0);
            if (deepenTimerRef.current) clearInterval(deepenTimerRef.current);
          }}
          aria-label={language === "ar" ? "إغلاق" : "Close"}
        >
          ×
        </button>

        <div className="sacred-orbs" aria-hidden="true">
          <div className="sacred-orb sacred-orb-awareness" />
          <div className="sacred-orb sacred-orb-knowledge" />
          <div className="sacred-orb sacred-orb-truth" />
        </div>

        <p className="sacred-pause-main">...</p>
        <p className="sacred-pause-sub">{messages[messageIndex]}</p>
      </div>
    </div>
  );
}
