const EMOTION_LABELS = {
  anxiety: { en: 'anxiety', ar: 'القلق' },
  confusion: { en: 'confusion', ar: 'الحيرة' },
  nostalgia: { en: 'nostalgia', ar: 'الحنين' },
  hope: { en: 'hope', ar: 'الأمل' },
  loneliness: { en: 'loneliness', ar: 'الوحدة' },
  wonder: { en: 'wonder', ar: 'الدهشة' },
};

const RITUAL_PHASES = {
  en: [
    {
      id: 'invocation',
      label: 'Invocation',
      text: 'The ritual opens gently around what you are carrying.',
    },
    {
      id: 'reflection',
      label: 'Reflection',
      text: 'The mirror listens for the contour beneath the words.',
    },
    {
      id: 'becoming',
      label: 'Becoming',
      text: 'A new shape is forming from the feeling itself.',
    },
  ],
  ar: [
    {
      id: 'invocation',
      label: 'الاستحضار',
      text: 'تبدأ الطقوس بهدوء حول ما تحمله داخلك.',
    },
    {
      id: 'reflection',
      label: 'الانعكاس',
      text: 'تنصت المرآة إلى الشكل المختبئ تحت الكلمات.',
    },
    {
      id: 'becoming',
      label: 'التشكّل',
      text: 'شكل جديد يتكوّن الآن من الشعور نفسه.',
    },
  ],
};

function normalizeEmotion(emotion) {
  return String(emotion || '').trim().toLowerCase();
}

export function toDisplayEmotionLabel(emotion, uiLanguage = 'en') {
  const normalized = normalizeEmotion(emotion);
  const match = EMOTION_LABELS[normalized];
  if (!match) {
    return normalized || (uiLanguage === 'en' ? 'feeling' : 'شعور');
  }
  return uiLanguage === 'en' ? match.en : match.ar;
}

function uniqueJourney(journey = []) {
  const compact = [];

  for (const emotion of journey) {
    const normalized = normalizeEmotion(emotion);
    if (!normalized) continue;
    if (compact[compact.length - 1] === normalized) continue;
    compact.push(normalized);
  }

  return compact;
}

function pickMiddleEmotions(journey = []) {
  if (journey.length <= 2) return [];
  return journey.slice(1, -1).slice(0, 2);
}

function buildArcLine({ fromLabel, middleLabels, toLabel, uiLanguage }) {
  if (uiLanguage === 'en') {
    if (middleLabels.length > 0) {
      return `It opened in ${fromLabel}, moved through ${middleLabels.join(' and ')}, and settled in ${toLabel}.`;
    }
    return `It opened in ${fromLabel} and settled in ${toLabel}.`;
  }

  if (middleLabels.length > 0) {
    return `بدأت الرحلة من ${fromLabel}، وعبرت عبر ${middleLabels.join(' و')}, ثم استقرت عند ${toLabel}.`;
  }

  return `بدأت الرحلة من ${fromLabel} واستقرت عند ${toLabel}.`;
}

function buildAfterglowLine({ uiLanguage, whisperText, spaceReading, spaceMyth, endingMessage }) {
  if (uiLanguage === 'en') {
    if (whisperText) {
      return 'The whisper that opened this ritual is still glowing inside the ending.';
    }
    if (spaceMyth) {
      return 'The room now lingers as a myth your inner map can return to.';
    }
    if (spaceReading) {
      return 'The room that opened the ritual now lives inside your inner map.';
    }
    if (endingMessage) {
      return 'The mirror keeps this change warm for one more quiet breath.';
    }
    return 'Stay with the shift for one more quiet breath.';
  }

  if (whisperText) {
    return 'الهمسة التي فتحت هذا الطقس ما زالت تتوهج داخل الخاتمة.';
  }
  if (spaceMyth) {
    return 'صار المكان الآن أسطورة صغيرة تستطيع خريطتك الداخلية أن تعود إليها.';
  }
  if (spaceReading) {
    return 'المكان الذي فتح الطقس صار الآن جزءاً من خريطتك الداخلية.';
  }
  if (endingMessage) {
    return 'تُبقي المرآة هذا التحول دافئاً لنفَسٍ هادئ أخير.';
  }
  return 'ابقَ مع هذا التحول لنفَسٍ هادئٍ أخير.';
}

function extractTurningPoints({ emotionJourney = [], storyMoments = [], uiLanguage = 'en' }) {
  const compactJourney = uniqueJourney(emotionJourney);
  const middleEmotions = pickMiddleEmotions(compactJourney);
  const anchors = [];

  for (const emotion of middleEmotions) {
    anchors.push({
      kind: 'emotion',
      label: toDisplayEmotionLabel(emotion, uiLanguage),
    });
  }

  for (const moment of storyMoments) {
    const text = String(moment?.symbolicAnchor || moment?.carriedArtifact || '').trim();
    if (!text) continue;
    if (anchors.some((item) => item.label === text)) continue;
    anchors.push({ kind: 'symbol', label: text });
    if (anchors.length >= 3) break;
  }

  return anchors.slice(0, 3);
}

export function getRitualPhases(uiLanguage = 'en') {
  return uiLanguage === 'en' ? RITUAL_PHASES.en : RITUAL_PHASES.ar;
}

export function buildTransformationSummary({
  emotionJourney = [],
  endingMessage = '',
  whisperText = '',
  spaceReading = '',
  spaceMyth = '',
  storyMoments = [],
  uiLanguage = 'en',
} = {}) {
  const compactJourney = uniqueJourney(emotionJourney);
  const firstEmotion = compactJourney[0] || normalizeEmotion(emotionJourney[0]) || 'hope';
  const lastEmotion = compactJourney[compactJourney.length - 1] || normalizeEmotion(emotionJourney[emotionJourney.length - 1]) || firstEmotion;
  const fromLabel = toDisplayEmotionLabel(firstEmotion, uiLanguage);
  const toLabel = toDisplayEmotionLabel(lastEmotion, uiLanguage);
  const middleLabels = pickMiddleEmotions(compactJourney).map((emotion) => toDisplayEmotionLabel(emotion, uiLanguage));
  const transformationLine = uiLanguage === 'en'
    ? `From ${fromLabel} to ${toLabel}`
    : `من ${fromLabel} إلى ${toLabel}`;
  const proofLine = uiLanguage === 'en'
    ? `What entered as ${fromLabel} left as ${toLabel}.`
    : `ما دخل كـ${fromLabel} خرج كـ${toLabel}.`;
  const proofTitle = uiLanguage === 'en'
    ? 'Proof of Transformation'
    : 'أثر التحول';
  const finalLine = String(endingMessage || '').trim() || (
    uiLanguage === 'en'
      ? 'The ritual closed, but the mirror kept the shape of the shift.'
      : 'انغلق الطقس، لكن المرآة احتفظت بشكل هذا التحول.'
  );

  return {
    fromEmotion: firstEmotion,
    toEmotion: lastEmotion,
    fromLabel,
    toLabel,
    transformationLine,
    proofTitle,
    proofLine,
    arcLine: buildArcLine({ fromLabel, middleLabels, toLabel, uiLanguage }),
    afterglowLine: buildAfterglowLine({ uiLanguage, whisperText, spaceReading, spaceMyth, endingMessage }),
    finalLine,
    mythicLine: spaceMyth || spaceReading || '',
    originLine: whisperText || spaceMyth || spaceReading || '',
    turningPoints: extractTurningPoints({ emotionJourney, storyMoments, uiLanguage }),
  };
}
