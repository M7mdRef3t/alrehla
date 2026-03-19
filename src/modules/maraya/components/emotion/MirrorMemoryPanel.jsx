import React from 'react';
import { toDisplayEmotionLabel } from '../../utils/transformation.js';

function formatJourneyLabel(journey, uiLanguage) {
  const date = journey?.endedAt ? new Date(journey.endedAt) : null;
  const day = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(uiLanguage === 'en' ? 'en-US' : 'ar-EG', {
      month: 'short',
      day: 'numeric',
    })
    : '';

  const emotion = toDisplayEmotionLabel(
    journey?.seedEmotion || journey?.finalEmotion || 'hope',
    uiLanguage,
  );
  const secret = journey?.secretEndingKey ? ` • ${journey.secretEndingKey.toUpperCase()}` : '';
  return [day, emotion, secret].filter(Boolean).join(' ');
}

export default function MirrorMemoryPanel({ snapshot, uiLanguage = 'en' }) {
  if (!snapshot || snapshot.rememberedCount < 1) return null;

  const isEn = uiLanguage === 'en';
  const title = isEn ? 'The Mirror Remembers' : 'المرآة تتذكر';
  const subtitle = isEn
    ? `Your recurring arc spans ${snapshot.rememberedCount} remembered journey${snapshot.rememberedCount === 1 ? '' : 's'}.`
    : `يمتد قوسك المتكرر عبر ${snapshot.rememberedCount} رحلة محفوظة في المرآة.`;
  const dominantSignature = snapshot.signature?.dominantEmotion
    ? toDisplayEmotionLabel(snapshot.signature.dominantEmotion, uiLanguage)
    : '';
  const lastTransformation = snapshot.lastTransformation?.fromEmotion && snapshot.lastTransformation?.toEmotion
    ? `${toDisplayEmotionLabel(snapshot.lastTransformation.fromEmotion, uiLanguage)} → ${toDisplayEmotionLabel(snapshot.lastTransformation.toEmotion, uiLanguage)}`
    : '';
  const recurringSymbols = Array.isArray(snapshot.recurringSymbols) ? snapshot.recurringSymbols.slice(0, 3) : [];
  const arcLine = String(snapshot.arcSummary?.recentArc || '').trim();
  const mythicReading = String(snapshot.arcSummary?.lastMythicReading || '').trim();

  return (
    <section className="mirror-memory-panel" aria-label={title}>
      <div className="mirror-memory-panel__header">
        <p className="mirror-memory-panel__eyebrow">{title}</p>
        <p className="mirror-memory-panel__subtitle">{subtitle}</p>
      </div>

      <div className="mirror-memory-panel__summary-grid">
        {lastTransformation && (
          <article className="mirror-memory-panel__summary-card">
            <p className="mirror-memory-panel__summary-label">
              {isEn ? 'Last Transformation' : 'آخر تحوّل'}
            </p>
            <p className="mirror-memory-panel__summary-value">{lastTransformation}</p>
          </article>
        )}

        {dominantSignature && (
          <article className="mirror-memory-panel__summary-card">
            <p className="mirror-memory-panel__summary-label">
              {isEn ? 'Dominant Signature' : 'البصمة الغالبة'}
            </p>
            <p className="mirror-memory-panel__summary-value">{dominantSignature}</p>
          </article>
        )}
      </div>

      {(arcLine || mythicReading) && (
        <div className="mirror-memory-panel__arc">
          {arcLine && <p className="mirror-memory-panel__arc-line">{arcLine}</p>}
          {mythicReading && <p className="mirror-memory-panel__arc-line mirror-memory-panel__arc-line--secondary">{mythicReading}</p>}
        </div>
      )}

      {recurringSymbols.length > 0 && (
        <div className="mirror-memory-panel__symbols">
          <p className="mirror-memory-panel__summary-label">
            {isEn ? 'Recurring Symbols' : 'الرموز المتكررة'}
          </p>
          <div className="mirror-memory-panel__chips">
            {recurringSymbols.map((symbol) => (
              <span key={symbol} className="mirror-memory-panel__chip">{symbol}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mirror-memory-panel__list">
        {(snapshot.recentJourneys || []).slice(0, 3).map((journey) => (
          <article key={journey.id} className="mirror-memory-panel__card">
            <p className="mirror-memory-panel__meta">{formatJourneyLabel(journey, uiLanguage)}</p>
            <p className="mirror-memory-panel__excerpt">
              {journey.lastTransformation?.line || journey.endingMessage || journey.summary || journey.whisperText}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
