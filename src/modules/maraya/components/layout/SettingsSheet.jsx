import React, { useEffect, useMemo, useRef, useState } from 'react';
import useFocusTrap from '../../hooks/useFocusTrap.js';

const DETENTS = ['peek', 'medium', 'full'];
const DETENT_TRANSLATE = {
  full: 0,
  medium: 28,
  peek: 56,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nearestDetent(translatePercent) {
  let best = 'medium';
  let bestDistance = Number.POSITIVE_INFINITY;

  DETENTS.forEach((detent) => {
    const distance = Math.abs(translatePercent - DETENT_TRANSLATE[detent]);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = detent;
    }
  });

  return best;
}

export default function SettingsSheet({
  open,
  uiLanguage = 'ar',
  musicEnabled,
  voiceEnabled,
  onToggleMusic,
  onToggleVoice,
  narrationSpeed,
  onNarrationSpeedChange,
  biometricsEnabled,
  onToggleBiometrics,
  spatialModeEnabled,
  onToggleSpatialMode,
  onClose,
  onReset,
}) {
  const [detent, setDetent] = useState(() => {
    const stored = localStorage.getItem('maraya_settings_detent');
    return DETENTS.includes(stored) ? stored : 'medium';
  });
  const [dragPercent, setDragPercent] = useState(null);
  const dragStateRef = useRef({ dragging: false, startY: 0, startTranslate: 0 });
  const panelRef = useRef(null);

  const isEn = uiLanguage === 'en';
  useFocusTrap(open, panelRef);
  const t = useMemo(() => ({
    title: isEn ? 'Settings' : 'الإعدادات',
    music: isEn ? 'Background Music' : 'الموسيقى الخلفية',
    voice: isEn ? 'Narration Voice' : 'صوت الراوية',
    speed: isEn ? 'Narration Speed' : 'سرعة السرد',
    speedHint: isEn ? 'Live preview affects upcoming narration blocks.' : 'المعاينة الحية تؤثر على الكتل السردية القادمة.',
    biometrics: isEn ? 'Biometric Sync (HealthKit/Oura)' : 'المزامنة الحيوية (HealthKit/Oura)',
    spatial: isEn ? 'Spatial Computing (VisionOS)' : 'العرض الشمولي للواقع المختلط',
    close: isEn ? 'Close' : 'إغلاق',
    slow: isEn ? 'Slow' : 'أبطأ',
    fast: isEn ? 'Fast' : 'أسرع',
    on: isEn ? 'On' : 'تشغيل',
    off: isEn ? 'Off' : 'إيقاف',
    peek: isEn ? 'Peek' : 'مصغّر',
    medium: isEn ? 'Medium' : 'متوسط',
    full: isEn ? 'Full' : 'كامل',
    reset: isEn ? 'Reset Settings' : 'إعادة ضبط الإعدادات',
  }), [isEn]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setDragPercent(null);
    }
  }, [open]);

  useEffect(() => {
    localStorage.setItem('maraya_settings_detent', detent);
  }, [detent]);

  if (!open) return null;

  const currentTranslate = dragPercent == null ? DETENT_TRANSLATE[detent] : dragPercent;

  const beginDrag = (clientY) => {
    dragStateRef.current = {
      dragging: true,
      startY: clientY,
      startTranslate: DETENT_TRANSLATE[detent],
    };
    setDragPercent(DETENT_TRANSLATE[detent]);
  };

  const updateDrag = (clientY) => {
    if (!dragStateRef.current.dragging) return;
    const deltaPx = clientY - dragStateRef.current.startY;
    const viewport = window.innerHeight || 900;
    const deltaPercent = (deltaPx / viewport) * 100;
    const next = clamp(dragStateRef.current.startTranslate + deltaPercent, 0, 70);
    setDragPercent(next);
  };

  const finishDrag = () => {
    if (!dragStateRef.current.dragging) return;
    const translate = dragPercent == null ? DETENT_TRANSLATE[detent] : dragPercent;
    const snapped = nearestDetent(translate);
    setDetent(snapped);
    setDragPercent(null);
    dragStateRef.current.dragging = false;
  };

  return (
    <div className="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-sheet-title">
      <button
        type="button"
        className="settings-sheet__backdrop"
        aria-label={t.close}
        onClick={onClose}
      />

      <section
        ref={panelRef}
        className={`settings-sheet__panel glass-card settings-sheet__panel--${detent}`}
        style={{ transform: `translateY(${currentTranslate}%)` }}
      >
        <button
          type="button"
          className="settings-sheet__detent"
          aria-label={isEn ? 'Drag to resize settings' : 'اسحب لتغيير ارتفاع الإعدادات'}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            beginDrag(event.clientY);
          }}
          onPointerMove={(event) => updateDrag(event.clientY)}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        />

        <div className="settings-sheet__detent-buttons" role="group" aria-label={isEn ? 'Panel size' : 'حجم اللوحة'}>
          <button type="button" className={`settings-sheet__detent-btn ${detent === 'peek' ? 'is-active' : ''}`} onClick={() => setDetent('peek')}>{t.peek}</button>
          <button type="button" className={`settings-sheet__detent-btn ${detent === 'medium' ? 'is-active' : ''}`} onClick={() => setDetent('medium')}>{t.medium}</button>
          <button type="button" className={`settings-sheet__detent-btn ${detent === 'full' ? 'is-active' : ''}`} onClick={() => setDetent('full')}>{t.full}</button>
        </div>

        <header className="settings-sheet__header">
          <h2 id="settings-sheet-title">{t.title}</h2>
          <button type="button" className="ds-btn ds-btn--ghost" onClick={onClose}>
            {t.close}
          </button>
        </header>

        <div className="settings-sheet__group" role="group" aria-label={t.music}>
          <span className="settings-sheet__label">{t.music}</span>
          <button
            type="button"
            role="switch"
            aria-checked={musicEnabled}
            className={`settings-sheet__switch ${musicEnabled ? 'settings-sheet__switch--on' : ''}`}
            onClick={onToggleMusic}
          >
            {musicEnabled ? t.on : t.off}
          </button>
        </div>

        <div className="settings-sheet__group" role="group" aria-label={t.voice}>
          <span className="settings-sheet__label">{t.voice}</span>
          <button
            type="button"
            role="switch"
            aria-checked={voiceEnabled}
            className={`settings-sheet__switch ${voiceEnabled ? 'settings-sheet__switch--on' : ''}`}
            onClick={onToggleVoice}
          >
            {voiceEnabled ? t.on : t.off}
          </button>
        </div>

        <div className="settings-sheet__group" role="group" aria-label={t.biometrics}>
          <span className="settings-sheet__label">{t.biometrics}</span>
          <button
            type="button"
            role="switch"
            aria-checked={biometricsEnabled}
            className={`settings-sheet__switch ${biometricsEnabled ? 'settings-sheet__switch--on' : ''}`}
            onClick={onToggleBiometrics}
          >
            {biometricsEnabled ? t.on : t.off}
          </button>
        </div>

        <div className="settings-sheet__group" role="group" aria-label={t.spatial}>
          <span className="settings-sheet__label">{t.spatial}</span>
          <button
            type="button"
            role="switch"
            aria-checked={spatialModeEnabled}
            className={`settings-sheet__switch ${spatialModeEnabled ? 'settings-sheet__switch--on' : ''}`}
            onClick={onToggleSpatialMode}
          >
            {spatialModeEnabled ? t.on : t.off}
          </button>
        </div>

        <div className="settings-sheet__slider">
          <label htmlFor="narration-speed" className="settings-sheet__label">
            {t.speed}
          </label>
          <div className="settings-sheet__range">
            <span>{t.slow}</span>
            <input
              id="narration-speed"
              type="range"
              min="20"
              max="90"
              step="1"
              value={narrationSpeed}
              aria-valuemin={20}
              aria-valuemax={90}
              aria-valuenow={narrationSpeed}
              onChange={(e) => onNarrationSpeedChange(Number(e.target.value))}
            />
            <span>{t.fast}</span>
          </div>
          <p className="settings-sheet__hint">
            {t.speedHint} ({narrationSpeed}ms)
          </p>
        </div>

        <footer className="settings-sheet__footer">
          <button type="button" className="ds-btn ds-btn--ghost settings-sheet__reset" onClick={onReset}>
            {t.reset}
          </button>
        </footer>
      </section>
    </div>
  );
}
