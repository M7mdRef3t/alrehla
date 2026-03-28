"use client";

import { Camera, Settings2 } from "lucide-react";
import type { LiveLanguage, LiveMode } from "../types";
import { PARITY_STRINGS } from "../parityContent";

interface LiveSetupScreenProps {
  language: LiveLanguage;
  mode: LiveMode;
  isConnecting: boolean;
  model: string;
  voice: string;
  nodeLabel?: string | null;
  onContinue: () => void;
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
  onContinue,
  onToggleLanguage,
  onToggleMode,
}: LiveSetupScreenProps) {
  const copy = PARITY_STRINGS[language];

  return (
    <div className="dawayir-setup-screen" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="dawayir-setup-card">
        <h2 data-view-heading="setup" tabIndex={-1}>
          {copy.setupTitle}
        </h2>
        <p style={{ marginTop: "10px" }}>{copy.setupBody}</p>

        <div className="dawayir-setup-toolbar">
          <button className={`icon-btn ${language === "ar" ? "active" : ""}`} type="button" onClick={() => onToggleLanguage("ar")}>
            Arabic
          </button>
          <button className={`icon-btn ${language === "en" ? "active" : ""}`} type="button" onClick={() => onToggleLanguage("en")}>
            English
          </button>
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
            <p>
              {model} • {voice}
              {nodeLabel ? ` • ${nodeLabel}` : ""}
            </p>
          </div>
        </div>

        <div className="dawayir-setup-actions" style={{ marginTop: "24px" }}>
          <button className="primary-btn" onClick={onContinue} disabled={isConnecting} type="button">
            {isConnecting
              ? language === "ar"
                ? "نجهّز الآن..."
                : "Preparing"
              : language === "ar"
                ? "تجهيز الكاميرا والصوت"
                : "Continue to pre-join"}
          </button>
          <div className="welcome-demo-helper">
            <Camera className="inline-block h-4 w-4" /> {copy.startHint}
          </div>
        </div>
      </div>
    </div>
  );
}
