import React, { useEffect, useMemo, useRef } from 'react';
import { buildTransformationSummary, toDisplayEmotionLabel } from '../../utils/transformation.js';
import KineticText from '../ui/KineticText.jsx';

const EMOTION_POSITIONS = {
  hope: { y: 0.15, color: '#5effb3', label: { en: 'Hope', ar: 'أمل' } },
  wonder: { y: 0.25, color: '#ffd700', label: { en: 'Wonder', ar: 'دهشة' } },
  nostalgia: { y: 0.4, color: '#daa520', label: { en: 'Nostalgia', ar: 'حنين' } },
  confusion: { y: 0.55, color: '#7b68ee', label: { en: 'Confusion', ar: 'حيرة' } },
  anxiety: { y: 0.7, color: '#8b7355', label: { en: 'Anxiety', ar: 'قلق' } },
  loneliness: { y: 0.85, color: '#4682b4', label: { en: 'Loneliness', ar: 'وحدة' } },
};

function getEmotionY(emotion, height) {
  const pos = EMOTION_POSITIONS[emotion];
  return pos ? pos.y * height : 0.5 * height;
}

function getEmotionColor(emotion) {
  return EMOTION_POSITIONS[emotion]?.color || '#ffffff';
}

function collectMythicTrail(storyMoments = []) {
  const trail = [];
  const seen = new Set();

  for (const moment of storyMoments) {
    const candidates = [moment?.symbolicAnchor, moment?.carriedArtifact];

    for (const candidate of candidates) {
      const value = String(candidate || '').trim();
      if (!value || seen.has(value)) continue;
      seen.add(value);
      trail.push(value);
      if (trail.length >= 4) return trail;
    }
  }

  return trail;
}

export default function EmotionJourneyMap({
  journey = [],
  uiLanguage = 'en',
  storyMoments = [],
  endingMessage = '',
  summary = null,
}) {
  const canvasRef = useRef(null);
  const resolvedSummary = useMemo(
    () => summary || buildTransformationSummary({
      emotionJourney: journey,
      storyMoments,
      endingMessage,
      uiLanguage,
    }),
    [endingMessage, journey, storyMoments, summary, uiLanguage],
  );
  const mythicTrail = useMemo(() => collectMythicTrail(storyMoments), [storyMoments]);
  const shouldRenderCanvas = Array.isArray(journey) && journey.length >= 2;
  const turningPoints = Array.isArray(resolvedSummary.turningPoints) ? resolvedSummary.turningPoints : [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldRenderCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const padding = 30;
    const plotW = w - padding * 2;
    const plotH = h - padding * 2;

    Object.entries(EMOTION_POSITIONS).forEach(([key, val]) => {
      const y = padding + val.y * plotH;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = uiLanguage === 'en' ? 'right' : 'left';
      const labelX = uiLanguage === 'en' ? padding - 6 : w - padding + 6;
      ctx.fillText(val.label[uiLanguage] || val.label.en, labelX, y + 3);
    });

    const points = journey.map((emotion, i) => ({
      x: padding + (i / (journey.length - 1)) * plotW,
      y: padding + getEmotionY(emotion, plotH),
      color: getEmotionColor(emotion),
      emotion,
    }));

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < points.length - 1; i += 1) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      grad.addColorStop(0, p1.color);
      grad.addColorStop(1, p2.color);
      ctx.strokeStyle = grad;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      const cpX = (p1.x + p2.x) / 2;
      ctx.bezierCurveTo(cpX, p1.y, cpX, p2.y, p2.x, p2.y);
      ctx.stroke();
    }

    points.forEach((point, index) => {
      const glowGrad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 12);
      glowGrad.addColorStop(0, `${point.color}40`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, index === 0 || index === points.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${index + 1}`, point.x, point.y + 18);
    });
  }, [journey, shouldRenderCanvas, uiLanguage]);

  const title = uiLanguage === 'en' ? 'Your Catharsis Map' : 'خريطة التحوّل';
  const startLabel = toDisplayEmotionLabel(resolvedSummary.fromEmotion, uiLanguage);
  const finalLabel = toDisplayEmotionLabel(resolvedSummary.toEmotion, uiLanguage);
  const startTitle = uiLanguage === 'en' ? 'Start' : 'البداية';
  const endTitle = uiLanguage === 'en' ? 'Arrival' : 'النهاية';
  const turnTitle = uiLanguage === 'en' ? 'Turning Points' : 'نقاط التحوّل';
  const mythicTitle = uiLanguage === 'en' ? 'Mythic Thread' : 'الخيط الأسطوري';
  const finalLineTitle = uiLanguage === 'en' ? 'Final Line' : 'الخاتمة';
  const noTurnsLabel = uiLanguage === 'en' ? 'The shift stayed quiet and direct.' : 'كان التحوّل هادئًا ومباشرًا.';
  const mythicLine = String(resolvedSummary.mythicLine || '').trim();
  const mythicFallback = uiLanguage === 'en'
    ? 'The symbols gathered into one inner legend.'
    : 'تجمّعت الرموز لتصنع أسطورة داخلية واحدة.';

  return (
    <div className="emotion-journey-map" style={{ animation: 'fadeInUp 1s var(--ease-spring)' }}>
      <div className="emotion-journey-map__header">
        <h3 className="emotion-journey-map__title">{title}</h3>
        <p className="emotion-journey-map__summary">{resolvedSummary.arcLine}</p>
      </div>

      <div className="emotion-journey-map__stats">
        <article className="emotion-journey-map__stat">
          <p className="emotion-journey-map__stat-label">{startTitle}</p>
          <p className="emotion-journey-map__stat-value">{startLabel}</p>
        </article>
        <article className="emotion-journey-map__stat">
          <p className="emotion-journey-map__stat-label">{endTitle}</p>
          <p className="emotion-journey-map__stat-value">{finalLabel}</p>
        </article>
      </div>

      {shouldRenderCanvas && (
        <canvas
          ref={canvasRef}
          className="emotion-journey-map__canvas"
          style={{ width: '100%', height: '160px' }}
        />
      )}

      <div className="emotion-journey-map__details">
        {(mythicLine || mythicTrail.length > 0) && (
          <div className="emotion-journey-map__mythic">
            <p className="emotion-journey-map__detail-label">{mythicTitle}</p>
            <div className="emotion-journey-map__mythic-shell">
              {mythicLine ? (
                <KineticText
                  as="p"
                  text={mythicLine}
                  uiLanguage={uiLanguage}
                  className="emotion-journey-map__mythic-line"
                  surface="journey"
                  emphasis="intense"
                />
              ) : (
                <p className="emotion-journey-map__mythic-line emotion-journey-map__mythic-line--static">
                  {mythicFallback}
                </p>
              )}

              {mythicTrail.length > 0 && (
                <div className="emotion-journey-map__thread" aria-label={mythicTitle}>
                  {mythicTrail.map((item, index) => (
                    <React.Fragment key={item}>
                      <span className="emotion-journey-map__thread-node">{item}</span>
                      {index < mythicTrail.length - 1 && (
                        <span className="emotion-journey-map__thread-link" aria-hidden="true">✦</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="emotion-journey-map__turns">
          <p className="emotion-journey-map__detail-label">{turnTitle}</p>
          <div className="emotion-journey-map__chips">
            {turningPoints.length > 0 ? turningPoints.map((point) => (
              <span key={`${point.kind}-${point.label}`} className="emotion-journey-map__chip">
                {point.label}
              </span>
            )) : (
              <span className="emotion-journey-map__chip emotion-journey-map__chip--muted">
                {noTurnsLabel}
              </span>
            )}
          </div>
        </div>

        <div className="emotion-journey-map__finale">
          <p className="emotion-journey-map__detail-label">{finalLineTitle}</p>
          <p className="emotion-journey-map__final-line">{resolvedSummary.finalLine}</p>
        </div>
      </div>
    </div>
  );
}
