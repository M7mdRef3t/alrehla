import React, { useEffect, useMemo, useState } from 'react';
import BrandMark from '../BrandMark.jsx';
import KineticText from '../ui/KineticText.jsx';
import { getRitualPhases } from '../../utils/transformation.js';

export default function LoadingMirror({
  statusText,
  uiLanguage = 'ar',
  whisperText = '',
  whisperReflection = '',
  spaceReading = '',
  spaceMyth = '',
}) {
  const isEn = uiLanguage === 'en';
  const ritualPhases = useMemo(() => getRitualPhases(uiLanguage), [uiLanguage]);
  const fallbackMessages = useMemo(
    () => (
      isEn
        ? [
          'The ritual is opening around your feeling...',
          'The mirror is listening beneath the words...',
          'Your next cinematic shape is becoming visible...',
        ]
        : [
          'تبدأ الطقوس الآن حول ما تحمله...',
          'تنصت المرآة إلى ما تحت الكلمات...',
          'يتشكل إيقاعك السينمائي التالي الآن...',
        ]
    ),
    [isEn],
  );

  const [messageIndex, setMessageIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % fallbackMessages.length);
    }, 2200);
    const timeoutTimer = setTimeout(() => {
      setTimedOut(true);
    }, 30000);

    return () => {
      clearInterval(messageTimer);
      clearTimeout(timeoutTimer);
    };
  }, [fallbackMessages.length]);

  const activePhaseIndex = messageIndex % ritualPhases.length;
  const activePhase = ritualPhases[activePhaseIndex];
  const visibleMessage = statusText || activePhase?.text || fallbackMessages[messageIndex];
  const timeoutText = isEn
    ? 'This is taking longer than usual. Please retry if needed.'
    : 'الأمر أطول من المعتاد. حاول مرة أخرى إذا لزم.';
  const whisperLabel = isEn ? 'The mirror heard' : 'المرآة سمعت';
  const ritualLabel = isEn ? 'Ritual Sequence' : 'تسلسل الطقس';
  const cadenceLabel = isEn ? 'Session taking shape' : 'الجلسة تتشكل';
  const reflectionSource = whisperReflection || spaceMyth || spaceReading || '';
  const phaseCalligraphy = activePhase?.label || '';

  return (
    <section
      className="loading-mirror"
      role="status"
      aria-live="polite"
      aria-label={isEn ? 'Opening ritual' : 'بدء الطقس'}
    >
      <BrandMark className="loading-mirror__brand" compact />

      <div className="loading-mirror__ritual">
        <p className="loading-mirror__ritual-label">{ritualLabel}</p>
        <div className="loading-mirror__ritual-steps" aria-label={ritualLabel}>
          {ritualPhases.map((phase, index) => (
            <div
              key={phase.id}
              className={`loading-mirror__ritual-step ${index === activePhaseIndex ? 'loading-mirror__ritual-step--active' : ''}`}
            >
              <span className="loading-mirror__ritual-index">0{index + 1}</span>
              <span className="loading-mirror__ritual-name">{phase.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="loading-mirror__orb">
        <div className="loading-mirror__orb-inner" />
        <div className="loading-mirror__orb-reflection" />
      </div>

      {phaseCalligraphy && (
        <div className="loading-mirror__phase-calligraphy" aria-hidden="true">
          <KineticText
            as="p"
            text={phaseCalligraphy}
            uiLanguage={uiLanguage}
            className="loading-mirror__phase-calligraphy-text"
            surface="ritual"
            emphasis="intense"
          />
        </div>
      )}

      <p className="loading-mirror__cadence">{cadenceLabel}</p>
      <p className="loading-mirror__text">{visibleMessage}</p>

      {(whisperText || reflectionSource) && (
        <div className="loading-mirror__echo">
          <p className="loading-mirror__echo-label">{whisperLabel}</p>
          {whisperText && <p className="loading-mirror__echo-quote">"{whisperText}"</p>}
          {reflectionSource && (
            uiLanguage === 'ar' ? (
              <KineticText
                as="p"
                text={reflectionSource}
                uiLanguage={uiLanguage}
                className="loading-mirror__echo-text"
                surface="ritual"
                emphasis="soft"
              />
            ) : (
              <p className="loading-mirror__echo-text">{reflectionSource}</p>
            )
          )}
        </div>
      )}

      {timedOut && (
        <p className="loading-mirror__timeout" role="alert">
          {timeoutText}
        </p>
      )}
    </section>
  );
}
