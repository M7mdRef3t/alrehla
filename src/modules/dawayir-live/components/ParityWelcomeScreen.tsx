'use client';

import { useEffect, useState } from "react";
import type { LiveLanguage, VoiceTattooMeta } from '../types';
import { PARITY_STRINGS } from "../parityContent";
import { playVoiceTattoo } from '@/modules/dawayir-live/utils/voiceTattoo';

interface ParityWelcomeScreenProps {
  language: LiveLanguage;
  isTransitioningToSetup: boolean;
  isLaunching: boolean;
  voiceTattoo: VoiceTattooMeta;
  onEnterSetup: () => void;
  onSetLanguage: (language: LiveLanguage) => void;
  onGoToCouple: () => void;
  onGoToTeacher: () => void;
}

export default function ParityWelcomeScreen({
  language,
  isTransitioningToSetup,
  isLaunching,
  voiceTattoo,
  onEnterSetup,
  onSetLanguage,
  onGoToCouple,
  onGoToTeacher,
}: ParityWelcomeScreenProps) {
  const copy = PARITY_STRINGS[language];
  const [tattooNotice, setTattooNotice] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handlePlayTattoo = async () => {
    const played = await playVoiceTattoo();
    setTattooNotice(
      played
        ? language === "ar"
          ? "صوتك من آخر لحظة وضوح عاد الآن."
          : "Your last clarity moment is playing now."
        : language === "ar"
          ? "تعذر تشغيل لحظة الوضوح الآن."
          : "Could not play the clarity moment right now.",
    );
  };

  return (
    <div className={`welcome-screen ${isTransitioningToSetup ? "exiting" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
      <h2 className="visually-hidden" data-view-heading="welcome" tabIndex={-1}>
        {copy.viewHeadings.welcome}
      </h2>

      <div className="welcome-cosmos" aria-hidden="true">
        <div className="welcome-nebula welcome-nebula-1" />
        <div className="welcome-nebula welcome-nebula-2" />
        <div className="welcome-nebula welcome-nebula-3" />
      </div>

      <div className="welcome-particles" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, index) => (
          <div
            key={index}
            className="welcome-particle"
            style={{
              left: `${3 + ((index * 3.2) % 92)}%`,
              top: `${5 + ((index * 5.7) % 88)}%`,
              animationDelay: `${(index * 0.35).toFixed(2)}s`,
              animationDuration: `${3 + (index % 4) * 0.8}s`,
              width: `${1.5 + (index % 4)}px`,
              height: `${1.5 + (index % 4)}px`,
            }}
          />
        ))}
      </div>

      <div className="welcome-sacred-ring" aria-hidden="true">
        <div className="welcome-ring-inner" />
      </div>

      <div className="welcome-orbs" aria-hidden="true">
        <div className="welcome-orb welcome-orb-1" />
        <div className="welcome-orb welcome-orb-2" />
        <div className="welcome-orb welcome-orb-3" />
      </div>

      <div className="welcome-logo-mark ds-slide-up-fade" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none">
          <circle cx="34" cy="52" r="20" fill="rgba(255,209,102,0.18)" stroke="rgba(255,209,102,0.5)" />
          <circle cx="50" cy="66" r="22" fill="rgba(56,178,216,0.18)" stroke="rgba(56,178,216,0.5)" />
          <circle cx="66" cy="50" r="21" fill="rgba(46,204,113,0.18)" stroke="rgba(46,204,113,0.5)" />
        </svg>
      </div>

      <div className="brand-name-large ds-slide-up-fade">{copy.brandName}</div>
      <div className="brand-subtitle ds-slide-up-fade-delay">{copy.brandSub}</div>
      <div className="brand-hook ds-slide-up-fade-delay">{copy.brandHook}</div>

      <div className="welcome-trinity ds-slide-up-fade-delay" aria-hidden="true">
        <div className="wt-circle wt-awareness" />
        <div className="wt-circle wt-knowledge" />
        <div className="wt-circle wt-truth" />
        <div className="wt-glow" />
      </div>

      <div className="welcome-question ds-slide-up-fade-delay-more">{copy.welcomeQuestion}</div>

      {hasMounted && voiceTattoo.hasTattoo && (
        <button type="button" className="voice-tattoo-card ds-slide-up-fade-delay-more" onClick={handlePlayTattoo}>
          <span className="voice-tattoo-icon" aria-hidden="true">
            🌙
          </span>
          <span className="voice-tattoo-copy">
            <strong>{language === "ar" ? "لحظة وضوحك الأخيرة" : "Your last clarity moment"}</strong>
            <span>
              {voiceTattoo.whyNowLine ||
                (language === "ar" ? "اضغط لتسمع صوتك في آخر لحظة صفاء." : "Tap to hear your voice from the last clarity shift.")}
            </span>
          </span>
        </button>
      )}

      <div className="welcome-cta-wrap ds-slide-up-fade-delay-more">
        <div className="welcome-cta-stack">
          <button
            className="primary-btn welcome-cta welcome-demo-cta"
            data-testid="start-session-btn"
            onClick={onEnterSetup}
            disabled={isLaunching}
          >
            {copy.enterSpace}
          </button>
          <button className="welcome-secondary-cta" onClick={onGoToCouple} type="button">
            {language === "ar" ? "👥 جلسة مشتركة" : "👥 Couple Mode"}
          </button>
          <button className="welcome-secondary-cta" onClick={onGoToTeacher} type="button">
            {language === "ar" ? "🎓 لوحة المعلم" : "🎓 Teacher"}
          </button>
          <div className="welcome-demo-helper">
            {language === "ar"
              ? "مسار بصري وسلوكي أقرب إلى الأصل، لكنه مربوط بحساب المنصة و Supabase."
              : "A visually closer parity pass, now wired into the platform and Supabase."}
          </div>
          {tattooNotice && <div className="voice-tattoo-notice">{tattooNotice}</div>}
        </div>
      </div>

      <div className="lang-toggle-container ds-slide-up-fade-delay-more">
        <button type="button" className={`icon-btn ${language === "ar" ? "active" : ""}`} onClick={() => onSetLanguage("ar")}>
          عربي
        </button>
        <button type="button" className={`icon-btn ${language === "en" ? "active" : ""}`} onClick={() => onSetLanguage("en")}>
          English
        </button>
      </div>
    </div>
  );
}
