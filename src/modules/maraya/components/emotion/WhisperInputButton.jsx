import React from 'react';

export default function WhisperInputButton({
  uiLanguage = 'en',
  isSupported = false,
  isListening = false,
  transcript = '',
  error = '',
  disabled = false,
  onStart,
  onStop,
}) {
  const label = uiLanguage === 'en'
    ? (isListening ? 'Listening...' : 'Whisper to Maraya')
    : (isListening ? 'أسمعك الآن...' : 'اهمس لمرايا');

  const helperText = error
    || transcript
    || (uiLanguage === 'en'
      ? 'Start with a feeling in your own words instead of picking a card.'
      : 'ابدأ بجملة تشبه إحساسك بدل اختيار بطاقة.');

  return (
    <div className={`whisper-starter ${disabled ? 'whisper-starter--disabled' : ''}`}>
      <button
        type="button"
        className={`whisper-starter__button ${isListening ?'whisper-starter__button--active' : ''}`}
        onClick={isListening ? onStop : onStart}
        disabled={disabled || !isSupported}
        aria-pressed={isListening}
      >
        <span className="whisper-starter__icon">{isListening ? '●' : '◌'}</span>
        <span>{label}</span>
      </button>
      <p className={`whisper-starter__helper ${error ? 'whisper-starter__helper--error' : ''}`}>
        {isSupported
          ? helperText
          : (uiLanguage === 'en'
            ? 'Voice whisper start is unavailable in this browser.'
            : 'البداية الصوتية غير متاحة في هذا المتصفح.')}
      </p>
    </div>
  );
}
