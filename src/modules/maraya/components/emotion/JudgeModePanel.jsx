import React from 'react';
import {
  JUDGE_POSITIONING_COPY,
  JUDGE_SAMPLE_WHISPERS,
  JUDGE_TALKING_POINTS,
  JUDGE_WOW_STEPS,
} from '../../utils/constants.js';

function toDisplayEmotionLabel(emotion, uiLanguage) {
  const labels = {
    anxiety: { en: 'anxiety', ar: 'القلق' },
    confusion: { en: 'confusion', ar: 'الحيرة' },
    nostalgia: { en: 'nostalgia', ar: 'الحنين' },
    hope: { en: 'hope', ar: 'الأمل' },
    loneliness: { en: 'loneliness', ar: 'الوحدة' },
    wonder: { en: 'wonder', ar: 'الدهشة' },
  };
  const normalized = String(emotion || '').trim().toLowerCase();
  const match = labels[normalized];
  if (!match) {
    return normalized || (uiLanguage === 'en' ? 'feeling' : 'شعور');
  }
  return uiLanguage === 'en' ? match.en : match.ar;
}

function getEmotionColor(emotion) {
  const colors = {
    anxiety: '#8b7355',
    confusion: '#7b68ee',
    nostalgia: '#daa520',
    hope: '#5effb3',
    loneliness: '#4682b4',
    wonder: '#ffd700',
  };
  return colors[String(emotion || '').trim().toLowerCase()] || '#5effb3';
}

function buildJudgeMemoryRecall(snapshot, uiLanguage) {
  if (!snapshot?.rememberedCount) {
    if (uiLanguage === 'en') {
      return {
        eyebrow: 'Memory Recall',
        title: 'Tonight the mirror will remember whether you turn confusion into hope.',
        body: 'On the next run, Judge Mode opens with your last transformation instead of a blank slate.',
        accentFrom: getEmotionColor('confusion'),
        accentTo: getEmotionColor('hope'),
      };
    }

    return {
      eyebrow: 'استدعاء الذاكرة',
      title: 'الليلة ستتذكر المرآة إن كنت ستحوّل الحيرة إلى أمل.',
      body: 'في العودة التالية سيبدأ مسار التحكيم بآخر تحوّل عشته، لا من صفحةٍ فارغة.',
      accentFrom: getEmotionColor('confusion'),
      accentTo: getEmotionColor('hope'),
    };
  }

  const recentJourney = snapshot.recentJourneys?.[0];
  const seedEmotion = recentJourney?.seedEmotion || snapshot.signature?.dominantEmotion || 'hope';
  const finalEmotion = recentJourney?.finalEmotion || recentJourney?.seedEmotion || 'wonder';
  const fromEmotion = toDisplayEmotionLabel(
    seedEmotion,
    uiLanguage,
  );
  const toEmotion = toDisplayEmotionLabel(
    finalEmotion,
    uiLanguage,
  );

  if (uiLanguage === 'en') {
    return {
      eyebrow: 'Memory Recall',
      title: `The mirror still remembers your last turn from ${fromEmotion} to ${toEmotion}.`,
      body: recentJourney?.endingMessage
        || 'Judges see the memory before the new whisper starts, so the product feels personal immediately.',
      accentFrom: getEmotionColor(seedEmotion),
      accentTo: getEmotionColor(finalEmotion),
    };
  }

  return {
    eyebrow: 'استدعاء الذاكرة',
    title: `المرآة ما زالت تتذكر كيف تحولت من ${fromEmotion} إلى ${toEmotion}.`,
    body: recentJourney?.endingMessage
      || 'يرى المحكّمون الذاكرة قبل بدء الهمسة الجديدة، فيشعرون أن التجربة شخصية من اللحظة الأولى.',
    accentFrom: getEmotionColor(seedEmotion),
    accentTo: getEmotionColor(finalEmotion),
  };
}

function buildJudgeMemoryRecallRich(snapshot, uiLanguage) {
  const base = buildJudgeMemoryRecall(snapshot, uiLanguage);
  if (!snapshot?.rememberedCount) {
    return { ...base, quote: '' };
  }

  const recentJourney = snapshot.recentJourneys?.[0];
  const seedEmotion = recentJourney?.seedEmotion || snapshot.signature?.dominantEmotion || 'hope';
  const finalEmotion = recentJourney?.finalEmotion || recentJourney?.seedEmotion || 'wonder';
  const fromEmotion = toDisplayEmotionLabel(seedEmotion, uiLanguage);
  const toEmotion = toDisplayEmotionLabel(finalEmotion, uiLanguage);
  const whisperQuote = String(recentJourney?.whisperText || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

  if (!whisperQuote) {
    return { ...base, quote: '' };
  }

  if (uiLanguage === 'en') {
    return {
      ...base,
      title: `You whispered "${whisperQuote}" and the mirror carried it from ${fromEmotion} to ${toEmotion}.`,
      quote: whisperQuote,
    };
  }

  return {
    ...base,
    quote: whisperQuote,
  };
}

export default function JudgeModePanel({
  uiLanguage = 'en',
  whisperSupported = false,
  disabled = false,
  mirrorMemory = null,
  onStartJudgeJourney,
  onStartLiveWhisper,
}) {
  const copy = uiLanguage === 'en'
    ? {
      eyebrow: 'Judge Rail',
      title: 'Show the core wow in one guided path.',
      body: 'Start with a curated emotional whisper, reveal a cinematic scene, then bend the story live while the judges watch.',
      proofTitle: 'Why judges will remember it',
      primary: 'Start Guided Judge Journey',
      secondary: 'Use Live Whisper Instead',
      promptLabel: 'Sample opening',
      micNote: 'If the microphone stalls, the guided journey still starts instantly.',
    }
    : {
      eyebrow: 'مسار التحكيم',
      title: 'أظهر جوهر الإبهار في مسار واحد موجّه.',
      body: 'ابدأ بهمسة عاطفية جاهزة، اكشف مشهداً سينمائياً، ثم غيّر القصة حيّاً أمام المحكّمين.',
      proofTitle: 'لماذا سيتذكره المحكّمون',
      primary: 'ابدأ الرحلة الموجّهة للمحكّمين',
      secondary: 'استخدم الهمس الحي بدلاً من ذلك',
      promptLabel: 'الافتتاحية الجاهزة',
      micNote: 'إذا تعطّل الميكروفون، تبدأ الرحلة الموجّهة فوراً بدون انتظار.',
    };

  const samplePrompt = uiLanguage === 'en' ? JUDGE_SAMPLE_WHISPERS.en : JUDGE_SAMPLE_WHISPERS.ar;
  const steps = JUDGE_WOW_STEPS[uiLanguage] || JUDGE_WOW_STEPS.en;
  const positioning = JUDGE_POSITIONING_COPY[uiLanguage] || JUDGE_POSITIONING_COPY.en;
  const talkingPoints = JUDGE_TALKING_POINTS[uiLanguage] || JUDGE_TALKING_POINTS.en;
  const memoryRecall = buildJudgeMemoryRecallRich(mirrorMemory, uiLanguage);

  return (
    <section className="judge-mode-panel" aria-label={copy.eyebrow}>
      <div className="judge-mode-panel__header">
        <p className="judge-mode-panel__eyebrow">{copy.eyebrow}</p>
        <h2 className="judge-mode-panel__title">{copy.title}</h2>
        <p className="judge-mode-panel__body">{copy.body}</p>
        <p className="judge-mode-panel__positioning">{positioning}</p>
      </div>

      {memoryRecall && (
        <div
          className="judge-mode-panel__memory-callout"
          style={{
            '--judge-memory-from': memoryRecall.accentFrom,
            '--judge-memory-to': memoryRecall.accentTo,
          }}
        >
          <p className="judge-mode-panel__memory-eyebrow">{memoryRecall.eyebrow}</p>
          <p className="judge-mode-panel__memory-title">{memoryRecall.title}</p>
          {memoryRecall.quote && (
            <p className="judge-mode-panel__memory-quote">"{memoryRecall.quote}"</p>
          )}
          <p className="judge-mode-panel__memory-body">{memoryRecall.body}</p>
        </div>
      )}

      <div className="judge-mode-panel__steps" aria-label={uiLanguage === 'en' ? 'Judge wow steps' : 'خطوات الإبهار'}>
        {steps.map((step, index) => (
          <span key={step} className="judge-mode-panel__step">
            <strong>{index + 1}</strong>
            <span>{step}</span>
          </span>
        ))}
      </div>

      <div className="judge-mode-panel__prompt">
        <span className="judge-mode-panel__prompt-label">{copy.promptLabel}</span>
        <p className="judge-mode-panel__prompt-text">{samplePrompt}</p>
      </div>

      <div className="judge-mode-panel__proof">
        <p className="judge-mode-panel__proof-title">{copy.proofTitle || 'Why judges will remember it'}</p>
        <div className="judge-mode-panel__proof-grid">
          {talkingPoints.map((point) => (
            <article key={point.title} className="judge-mode-panel__proof-card">
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="judge-mode-panel__actions">
        <button
          type="button"
          className="judge-mode-panel__button judge-mode-panel__button--primary"
          onClick={onStartJudgeJourney}
          disabled={disabled}
        >
          {copy.primary}
        </button>

        <button
          type="button"
          className="judge-mode-panel__button judge-mode-panel__button--ghost"
          onClick={onStartLiveWhisper}
          disabled={disabled || !whisperSupported}
        >
          {copy.secondary}
        </button>
      </div>

      <p className="judge-mode-panel__note">{copy.micNote}</p>
    </section>
  );
}
