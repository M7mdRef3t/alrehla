"use client";

import { GraduationCap, History, Settings2, Users } from "lucide-react";
import type { LiveLanguage, LiveMode } from "../types";
import { PARITY_STRINGS } from "../parityContent";

interface LiveSetupScreenProps {
  language: LiveLanguage;
  mode: LiveMode;
  isConnecting: boolean;
  model: string;
  voice: string;
  nodeLabel?: string | null;
  onStartSession: () => void;
  onOpenHistory: () => void;
  onOpenCouple: () => void;
  onOpenTeacher: () => void;
  onToggleLanguage: (language: LiveLanguage) => void;
  onToggleMode: (mode: LiveMode) => void;
}

export default function LiveSetupScreen({
  language,
  mode,
  isConnecting,
  model,
  voice,
  nodeLabel,
  onStartSession,
  onOpenHistory,
  onOpenCouple,
  onOpenTeacher,
  onToggleLanguage,
  onToggleMode,
}: LiveSetupScreenProps) {
  const copy = PARITY_STRINGS[language];

  return (
    <div className="dawayir-setup-screen" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="dawayir-setup-card">
        <h2 data-view-heading="setup" tabIndex={-1}>{copy.setupTitle}</h2>
        <p style={{ marginTop: "10px" }}>{copy.setupBody}</p>

        <div className="dawayir-setup-toolbar">
          <button className={`icon-btn ${language === "ar" ? "active" : ""}`} type="button" onClick={() => onToggleLanguage("ar")}>عربي</button>
          <button className={`icon-btn ${language === "en" ? "active" : ""}`} type="button" onClick={() => onToggleLanguage("en")}>English</button>
          <button className={`icon-btn ${mode === "standard" ? "active" : ""}`} type="button" onClick={() => onToggleMode("standard")}>
            {language === "ar" ? "فردية" : "Standard"}
          </button>
          <button className={`icon-btn ${mode === "hybrid" ? "active" : ""}`} type="button" onClick={() => onToggleMode("hybrid")}>
            {language === "ar" ? "معمّقة" : "Hybrid"}
          </button>
          <button className="icon-btn" type="button">
            <Settings2 className="inline-block h-4 w-4" /> {copy.settingsTitle}
          </button>
        </div>

        <div className="dawayir-setup-grid">
          <div className="dawayir-setup-link">
            <strong>{language === "ar" ? "محرك الجلسة" : "Session runtime"}</strong>
            <p>{model} • {voice}{nodeLabel ? ` • ${nodeLabel}` : ""}</p>
          </div>
          <button className="dawayir-setup-link" type="button" onClick={onOpenHistory}>
            <strong><History className="inline-block h-4 w-4" /> {copy.historyTitle}</strong>
            <p>{copy.historyBody}</p>
          </button>
          <button className="dawayir-setup-link" type="button" onClick={onOpenCouple}>
            <strong><Users className="inline-block h-4 w-4" /> {copy.coupleTitle}</strong>
            <p>{copy.coupleBody}</p>
          </button>
          <button className="dawayir-setup-link" type="button" onClick={onOpenTeacher}>
            <strong><GraduationCap className="inline-block h-4 w-4" /> {copy.teacherTitle}</strong>
            <p>{copy.teacherBody}</p>
          </button>
        </div>

        <div className="dawayir-setup-actions" style={{ marginTop: "24px" }}>
          <button className="primary-btn" onClick={onStartSession} disabled={isConnecting} type="button">
            {isConnecting ? (language === "ar" ? "بنوصل دلوقتي" : "Connecting") : copy.enterSpace}
          </button>
          <div className="welcome-demo-helper">{copy.startHint}</div>
        </div>
      </div>
    </div>
  );
}
