/**
 * Emotion and UI constants for Maraya.
 */

export const EMOTIONS = [
  {
    id: 'anxiety',
    label: 'قلق',
    label_en: 'Anxiety',
    icon: '◼',
    color: '#8B7355',
    gradient: 'linear-gradient(135deg, #2c2c2c 0%, #4a3728 100%)',
    particleColor: [139, 115, 85],
  },
  {
    id: 'confusion',
    label: 'حيرة',
    label_en: 'Confusion',
    icon: '◇',
    color: '#7B68EE',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #3d1f6d 100%)',
    particleColor: [123, 104, 238],
  },
  {
    id: 'nostalgia',
    label: 'حنين',
    label_en: 'Nostalgia',
    icon: '■',
    color: '#DAA520',
    gradient: 'linear-gradient(135deg, #3d2b1f 0%, #8b6914 100%)',
    particleColor: [218, 165, 32],
  },
  {
    id: 'hope',
    label: 'أمل',
    label_en: 'Hope',
    icon: '△',
    color: '#3CB371',
    gradient: 'linear-gradient(135deg, #0a2e1a 0%, #1f6d3d 100%)',
    particleColor: [60, 179, 113],
  },
  {
    id: 'loneliness',
    label: 'وحدة',
    label_en: 'Loneliness',
    icon: '○',
    color: '#4682B4',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1a3a5c 100%)',
    particleColor: [70, 130, 180],
  },
  {
    id: 'wonder',
    label: 'دهشة',
    label_en: 'Wonder',
    icon: '✦',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #1a1a0a 0%, #5c4a1a 100%)',
    particleColor: [255, 215, 0],
  },
];

export const STORY_MODES = [
  {
    id: 'judge_en',
    ui_language: 'en',
    label_en: 'Judge Mode (English)',
    label_ar: 'وضع التحكيم (إنجليزي)',
  },
  {
    id: 'ar_fusha',
    ui_language: 'ar',
    label_en: 'Arabic (Fusha)',
    label_ar: 'العربية الفصحى',
  },
  {
    id: 'ar_egyptian',
    ui_language: 'ar',
    label_en: 'Egyptian Colloquial',
    label_ar: 'عامية مصرية',
  },
  {
    id: 'ar_educational',
    ui_language: 'ar',
    label_en: 'Arabic (Educational)',
    label_ar: 'العربية التعليمية',
  },
];

export function getModeUiLanguage(modeId) {
  const mode = STORY_MODES.find((item) => item.id === modeId);
  return mode?.ui_language || 'en';
}

export function normalizeMode(mode) {
  const fallback = 'judge_en';
  return STORY_MODES.some((item) => item.id === mode) ? mode : fallback;
}

export const UI_COPY = {
  en: {
    title: 'Maraya',
    subtitle: 'What are you carrying today?',
    uploadSpace: 'Or... show me your space',
    modeLabel: 'Narrative Mode',
    musicLabel: 'Background Music',
    musicOn: 'On',
    musicOff: 'Off',
    voiceLabel: 'Narration Voice',
    voiceOn: 'On',
    voiceOff: 'Off',
    voiceUnavailable: 'Not supported in this browser',
    back: 'Back',
    uploadTitle: 'Show Me Your Space',
    uploadDesc: 'Upload a photo of your room or current space and I will read its mood.',
    uploadDrop: 'Drop an image here or click to upload',
    analyzingSpace: 'Maraya is reading your space...',
    loadingStory: 'Maraya is taking shape...',
    loadingNext: 'The next scene is taking shape...',
    loadingError: 'Failed to continue the story.',
    restart: 'Start a New Journey',
    reconnecting: 'Reconnecting...',
    sceneWord: 'Scene',
  },
  ar: {
    title: 'مرايا',
    subtitle: 'إيه اللي شايله في قلبك النهاردة؟',
    uploadSpace: 'أو... وريني مكانك',
    modeLabel: 'نمط السرد',
    musicLabel: 'الموسيقى الخلفية',
    musicOn: 'تشغيل',
    musicOff: 'إيقاف',
    voiceLabel: 'صوت السرد',
    voiceOn: 'تشغيل',
    voiceOff: 'إيقاف',
    voiceUnavailable: 'غير مدعوم في هذا المتصفح',
    back: 'رجوع',
    uploadTitle: 'وريني مكانك',
    uploadDesc: 'ارفع صورة لغرفتك أو مساحتك الحالية والمرايا هتقولك مود المكان إيه.',
    uploadDrop: 'اسحب الصورة هنا أو اضغط للاختيار',
    analyzingSpace: 'المرايا بتقرأ المكان...',
    loadingStory: 'المرايا بتتشكل...',
    loadingNext: 'المشهد اللي جاي بيتحضر...',
    loadingError: 'للاسف فيه مشكلة في تكملة القصة.',
    restart: 'ابدأ رحلة جديدة',
    reconnecting: 'بنحاول نوصل تاني...',
    sceneWord: 'المشهد',
  },
};

export const JUDGE_MODE_QUERY_PARAM = 'judge';

export const JUDGE_SAMPLE_WHISPERS = {
  en: 'I feel lost, but I want to find hope.',
  ar: 'أشعر بالضياع، لكنني أريد أن أصل إلى الأمل.',
};

export const JUDGE_WOW_STEPS = {
  en: [
    'Mirror listens',
    'Feeling becomes a world',
    'The story bends live',
    'You leave with proof',
  ],
  ar: [
    'المرآة تسمعك',
    'الإحساس يصير عالماً',
    'القصة تنعطف حيّاً',
    'تخرج بأثر ملموس',
  ],
};

export const JUDGE_HERO_COPY = {
  en: {
    heading: 'The emotional mirror that turns what you carry into a live cinematic story.',
    subheading: 'Start with a whisper. Bend the story live. Leave with something worth sharing.',
  },
  ar: {
    heading: 'المرآة العاطفية التي تحوّل ما تحمله داخلك إلى قصة سينمائية حية.',
    subheading: 'ابدأ بهمسة. غيّر القصة حيّاً. واخرج بأثر يستحق المشاركة.',
  },
};

export const JUDGE_POSITIONING_COPY = {
  en: 'Maraya is not a story generator. It is an emotional mirror that speaks in cinema.',
  ar: 'مرايا ليس مولّد قصص. إنه مرآة عاطفية تتكلم بلغة السينما.',
};

export const JUDGE_TALKING_POINTS = {
  en: [
    {
      title: 'Begins from emotion, not prompts',
      body: 'The experience starts from what the user feels, not from a menu of plot ideas.',
    },
    {
      title: 'Bends the scene live',
      body: 'Judges can redirect the tone inside the unfolding scene and watch the world respond in real time.',
    },
    {
      title: 'Leaves a lasting artifact',
      body: 'The journey ends with a map, reel, or shareable scene card instead of vanishing like a chat log.',
    },
  ],
  ar: [
    {
      title: 'يبدأ من الشعور لا من البرومبت',
      body: 'التجربة تبدأ مما يشعر به المستخدم، لا من قائمة أفكار جاهزة للحبكة.',
    },
    {
      title: 'يثني المشهد حيّاً',
      body: 'يمكن للمحكّمين تغيير نبرة المشهد أثناء انكشافه ومشاهدة العالم وهو يستجيب فوراً.',
    },
    {
      title: 'يترك أثراً يبقى',
      body: 'الرحلة تنتهي بخريطة أو Reel أو بطاقة قابلة للمشاركة بدلاً من أن تختفي كسجل محادثة.',
    },
  ],
};

export const AUDIO_MOOD_MAP = {
  ambient_calm: { file: 'calm.wav', label: 'Calm' },
  tense_drone: { file: 'tension.wav', label: 'Tension' },
  hopeful_strings: { file: 'hope.wav', label: 'Hope' },
  mysterious_wind: { file: 'mystery.wav', label: 'Mystery' },
  triumphant_rise: { file: 'triumph.wav', label: 'Triumph' },
};

export const APP_STATES = {
  LANDING: 'LANDING',
  LOADING: 'LOADING',
  STORY: 'STORY',
  ENDING: 'ENDING',
};
