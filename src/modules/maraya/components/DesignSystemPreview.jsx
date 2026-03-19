import React from 'react';
import BrandMark from './BrandMark.jsx';

const colors = [
  ['Primary BG', 'var(--color-bg-primary)'],
  ['Secondary BG', 'var(--color-bg-secondary)'],
  ['Glass', 'var(--color-surface-glass)'],
  ['Gold', 'var(--color-accent-gold)'],
  ['Cyan', 'var(--color-accent-cyan)'],
  ['Emerald', 'var(--color-accent-emerald)'],
  ['Rose', 'var(--color-accent-rose)'],
  ['Violet', 'var(--color-accent-violet)'],
];

const emotions = [
  ['Joy', 'var(--color-emotion-joy)'],
  ['Sadness', 'var(--color-emotion-sadness)'],
  ['Anger', 'var(--color-emotion-anger)'],
  ['Fear', 'var(--color-emotion-fear)'],
  ['Love', 'var(--color-emotion-love)'],
  ['Hope', 'var(--color-emotion-hope)'],
];

export default function DesignSystemPreview() {
  return (
    <main className="ds-preview" dir="ltr">
      <section className="ds-preview__hero glass-card">
        <BrandMark className="ds-preview__brand" withWordmark />
        <p className="ds-preview__eyebrow">Maraya Design System</p>
        <h1 className="ds-preview__title">Living tokens, glass surfaces, cinematic UI.</h1>
        <p className="ds-preview__lede">
          Reference page for the Maraya visual language. This preview is intentionally tied to the
          runtime CSS tokens used by the app.
        </p>
        <div className="ds-preview__actions">
          <button type="button" className="ds-btn ds-btn--primary">Start Journey</button>
          <button type="button" className="ds-btn ds-btn--secondary">Secondary Action</button>
          <button type="button" className="ds-btn ds-btn--ghost">Ghost Action</button>
        </div>
      </section>

      <section className="ds-preview__section">
        <div className="ds-preview__section-head">
          <h2>Color Tokens</h2>
          <p>Core semantic colors pulled from the Maraya token layer.</p>
        </div>
        <div className="ds-swatch-grid">
          {colors.map(([label, value]) => (
            <article key={label} className="ds-swatch glass-card">
              <div className="ds-swatch__chip" style={{ background: value }} />
              <h3>{label}</h3>
              <code>{value}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="ds-preview__section">
        <div className="ds-preview__section-head">
          <h2>Emotion Surfaces</h2>
          <p>Interaction colors intended for mood, redirect cues, and landing choices.</p>
        </div>
        <div className="ds-emotion-grid">
          {emotions.map(([label, value]) => (
            <button
              key={label}
              type="button"
              className="ds-emotion-card"
              style={{
                '--emotion-color': value,
              }}
            >
              <span className="ds-emotion-card__label">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="ds-preview__section ds-preview__section--split">
        <div className="glass-card ds-panel">
          <div className="ds-badge">Narration</div>
          <h2 className="ds-panel__title">Cinematic text block</h2>
          <p className="ds-panel__copy">
            The mirrors respond in layers, not all at once. Surfaces shift first, language follows,
            and only then does choice become visible.
          </p>
          <div className="choice-buttons choice-buttons--visible">
            <button type="button" className="choice-button">
              <span className="choice-button__text">Lean into the brighter corridor.</span>
              <span className="choice-button__arrow">→</span>
            </button>
            <button type="button" className="choice-button">
              <span className="choice-button__text">Hold still and listen to the room.</span>
              <span className="choice-button__arrow">→</span>
            </button>
          </div>
        </div>

        <div className="glass-card ds-panel">
          <div className="live-redirect-bar">
            <button type="button" className="live-redirect-btn">🔥</button>
            <button type="button" className="live-redirect-btn">✨</button>
            <button type="button" className="live-redirect-btn">😱</button>
            <button type="button" className="live-redirect-btn">🎬</button>
          </div>
          <div className="audio-hud ds-audio-hud-demo">
            <button type="button" className="audio-hud__btn audio-hud__btn--on">Music: On</button>
            <button type="button" className="audio-hud__btn">Voice: Off</button>
          </div>
          <div className="transcript ds-transcript-demo">
            <div className="transcript__content">
              <div className="transcript__bubble transcript__bubble--narration">
                <span className="transcript__label">Narration</span>
                <span className="transcript__text">The room breathes before the story begins.</span>
              </div>
              <div className="transcript__bubble transcript__bubble--visual">
                <span className="transcript__label">Visual</span>
                <span className="transcript__text">Soft emerald light cuts through the glass.</span>
              </div>
              <div className="transcript__bubble transcript__bubble--reflection">
                <span className="transcript__label">Reflection</span>
                <span className="transcript__text">Not every mirror shows the same truth.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


