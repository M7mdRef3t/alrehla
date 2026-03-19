import React, { useMemo, useState } from 'react';
import './SceneImage.css';

export default function SceneImage({ src, alt, emotionId = 'hope' }) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const liveText = useMemo(() => (loaded && alt ? `Scene image ready: ${alt}` : ''), [loaded, alt]);

  return (
    <div className="scene-image-wrapper">
      {!loaded && !hasError && <div className="scene-image-skeleton" aria-hidden="true" />}

      {!hasError && (
        <img
          className={`scene-image ${loaded ? 'scene-image--loaded' : ''}`}
          src={src}
          alt={alt || ''}
          loading="lazy"
          decoding="async"
          style={{ '--scene-emotion-color': `var(--color-emotion-${emotionId}, #78c8ff)` }}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      <span className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {liveText}
      </span>
    </div>
  );
}
