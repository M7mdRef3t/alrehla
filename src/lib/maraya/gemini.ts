/**
 * Gemini Structured Output Service for Maraya
 * Adapted from the legacy Maraya Gemini runtime.
 */

import { GoogleGenAI } from '@google/genai';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ai: any = null;

function getTimeoutMs() {
  const value = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS || 15000);
  return Number.isFinite(value) && value > 0 ? value : 15000;
}

function getMaxRetries() {
  const value = Number(process.env.GEMINI_MAX_RETRIES || 2);
  return Number.isFinite(value) && value >= 0 ? value : 2;
}

export function initGemini(apiKey: string) {
  ai = new GoogleGenAI({ apiKey });
}

function ensureInit() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');
    initGemini(key);
  }
}

const AUDIO_MOOD_ENUM = ['ambient_calm', 'tense_drone', 'hopeful_strings', 'mysterious_wind', 'triumphant_rise'];
const INTERLEAVED_KIND_ENUM = ['narration', 'visual', 'reflection'];
const GEMINI_TEXT_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

const SCENE_SCHEMA = {
  type: 'object' as const,
  properties: {
    scenes: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          scene_id: { type: 'string' as const },
          narration_ar: { type: 'string' as const },
          image_prompt: { type: 'string' as const },
          audio_mood: { type: 'string' as const, enum: AUDIO_MOOD_ENUM },
          carried_artifact: { type: 'string' as const },
          symbolic_anchor: { type: 'string' as const },
          ritual_phase: { type: 'string' as const, enum: ['invocation', 'reflection', 'becoming'] },
          mythic_echo: { type: 'string' as const },
          interleaved_blocks: {
            type: 'array' as const, minItems: 2, maxItems: 5,
            items: {
              type: 'object' as const,
              properties: {
                kind: { type: 'string' as const, enum: INTERLEAVED_KIND_ENUM },
                text_ar: { type: 'string' as const },
              },
              required: ['kind', 'text_ar'],
            },
          },
          choices: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                text_ar: { type: 'string' as const },
                emotion_shift: { type: 'string' as const },
              },
              required: ['text_ar', 'emotion_shift'],
            },
          },
        },
        required: ['scene_id', 'narration_ar', 'image_prompt', 'audio_mood', 'interleaved_blocks', 'choices'],
      },
    },
  },
  required: ['scenes'],
};

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map(v => (v || '').trim()).filter(Boolean))];
}

function isModelUnavailableError(error: Error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('no longer available') || message.includes('not found') || message.includes('unsupported') || message.includes('invalid model');
}

function isRetryableGeminiError(error: Error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('timeout') || message.includes('timed out') || message.includes('deadline') || message.includes('429') || message.includes('quota') || message.includes('rate limit') || message.includes('temporarily unavailable') || message.includes('service unavailable') || message.includes('internal error') || message.includes('econnreset') || message.includes('fetch failed') || message.includes('network');
}

async function wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runWithTimeout(task: () => Promise<any>, timeoutMs: number, purpose: string, model: string) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      task(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Gemini ${purpose} timed out after ${timeoutMs}ms on model ${model}`)), timeoutMs); }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

function getTextModelCandidates() {
  return uniqueNonEmpty([process.env.GEMINI_TEXT_MODEL || '', ...GEMINI_TEXT_FALLBACK_MODELS]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateContentWithModelFallback({ contents, config, purpose }: { contents: any[]; config: any; purpose: string }) {
  ensureInit();
  const models = getTextModelCandidates();
  const timeoutMs = getTimeoutMs();
  const maxRetries = getMaxRetries();
  if (models.length === 0) throw new Error('No Gemini text models configured');

  const errors: Error[] = [];
  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await runWithTimeout(() => ai.models.generateContent({ model, contents, config }), timeoutMs, purpose, model);
      } catch (error: unknown) {
        const err = error as Error;
        const isRetryable = isRetryableGeminiError(err);
        const canRetry = isRetryable && attempt < maxRetries;
        if (canRetry) { await wait(250 * (attempt + 1)); continue; }
        errors.push(err);
        break;
      }
    }
  }
  const fatalError = errors.find(e => !isModelUnavailableError(e));
  if (fatalError) throw fatalError;
  throw errors[errors.length - 1] || new Error('No available Gemini text model');
}

export interface MarayaScene {
  scene_id: string;
  narration_ar: string;
  image_prompt: string;
  audio_mood: string;
  carried_artifact: string;
  symbolic_anchor: string;
  ritual_phase: string;
  mythic_echo: string;
  interleaved_blocks: { kind: string; text_ar: string }[];
  choices: { text_ar: string; emotion_shift: string }[];
}

function normalizeInterleavedBlocks(scene: Record<string, unknown>, outputMode: string) {
  const isEnglish = outputMode === 'judge_en';
  const blocks = Array.isArray(scene.interleaved_blocks) ? scene.interleaved_blocks : [];
  const normalized = blocks.map((block: Record<string, unknown>) => {
    if (!block || typeof block !== 'object') return null;
    const kind = INTERLEAVED_KIND_ENUM.includes(block.kind as string) ? block.kind as string : 'narration';
    const text = typeof block.text_ar === 'string' ? (block.text_ar as string).trim() : '';
    if (!text) return null;
    return { kind, text_ar: text };
  }).filter(Boolean).slice(0, 5);
  if (normalized.length > 0) return normalized;

  const narration = typeof scene.narration_ar === 'string' ? (scene.narration_ar as string).trim() : '';
  if (!narration) return [];
  if (isEnglish) {
    return [{ kind: 'narration', text_ar: narration }, { kind: 'visual', text_ar: 'The image forms around you as the light shifts slowly.' }, { kind: 'reflection', text_ar: 'Pause for a moment, then choose the path that calls to you.' }];
  }
  return [{ kind: 'narration', text_ar: narration }, { kind: 'visual', text_ar: 'تتشكل الصورة حولك بينما يتبدل الضوء ببطء.' }, { kind: 'reflection', text_ar: 'توقف لحظة، ثم اختر المسار الذي يليق بقلبك.' }];
}

function normalizeScene(scene: Record<string, unknown>, index: number, outputMode: string): MarayaScene | null {
  if (!scene || typeof scene !== 'object') return null;
  const isEnglish = outputMode === 'judge_en';
  const sceneId = typeof scene.scene_id === 'string' && (scene.scene_id as string).trim() ? (scene.scene_id as string).trim() : `scene_${index + 1}`;
  const defaultNarration = isEnglish ? 'The scene takes shape in silence, as if the walls are catching their breath.' : 'يتشكل المشهد بصمت، كأن الجدران تستعيد أنفاسها.';
  const narration = typeof scene.narration_ar === 'string' && (scene.narration_ar as string).trim() ? (scene.narration_ar as string).trim() : defaultNarration;
  const imagePrompt = typeof scene.image_prompt === 'string' && (scene.image_prompt as string).trim() ? (scene.image_prompt as string).trim() : 'cinematic interior architecture, atmospheric lighting, 16:9 composition';
  const audioMood = AUDIO_MOOD_ENUM.includes(scene.audio_mood as string) ? scene.audio_mood as string : 'ambient_calm';

  const choices = Array.isArray(scene.choices) ? (scene.choices as Record<string, unknown>[]).map(c => {
    if (!c || typeof c !== 'object') return null;
    const textAr = typeof c.text_ar === 'string' ? (c.text_ar as string).trim() : '';
    if (!textAr) return null;
    const emotionShift = typeof c.emotion_shift === 'string' && (c.emotion_shift as string).trim() ? (c.emotion_shift as string).trim() : 'hope';
    return { text_ar: textAr, emotion_shift: emotionShift };
  }).filter(Boolean) as { text_ar: string; emotion_shift: string }[] : [];

  return {
    scene_id: sceneId, narration_ar: narration, image_prompt: imagePrompt, audio_mood: audioMood,
    carried_artifact: typeof scene.carried_artifact === 'string' ? (scene.carried_artifact as string).trim() : '',
    symbolic_anchor: typeof scene.symbolic_anchor === 'string' ? (scene.symbolic_anchor as string).trim() : '',
    ritual_phase: typeof scene.ritual_phase === 'string' ? (scene.ritual_phase as string).trim() : '',
    mythic_echo: typeof scene.mythic_echo === 'string' ? (scene.mythic_echo as string).trim() : '',
    interleaved_blocks: normalizeInterleavedBlocks(scene, outputMode) as { kind: string; text_ar: string }[],
    choices,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateScenes(systemPrompt: string, conversationHistory: any[], outputMode = 'ar_fusha'): Promise<MarayaScene[]> {
  const response = await generateContentWithModelFallback({
    purpose: 'scene generation',
    contents: conversationHistory,
    config: { systemInstruction: systemPrompt, responseMimeType: 'application/json', responseSchema: SCENE_SCHEMA, temperature: 0.9, topP: 0.95 },
  });
  const text = response.text;
  const parsed = JSON.parse(text);
  const rawScenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  return rawScenes.map((scene: Record<string, unknown>, index: number) => normalizeScene(scene, index, outputMode)).filter(Boolean) as MarayaScene[];
}

export interface SpaceAnalysis {
  detected_emotion: string;
  space_reading: string;
  mythic_reading: string;
}

export async function analyzeSpace(systemPrompt: string, imageBase64: string, mimeType: string): Promise<SpaceAnalysis> {
  const response = await generateContentWithModelFallback({
    purpose: 'space analysis',
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } }, { text: 'حلّل هذا المكان.' }] }],
    config: { systemInstruction: systemPrompt, responseMimeType: 'application/json', temperature: 0.7 },
  });
  const text = response.text;
  const payload = JSON.parse(text);
  const detectedEmotion = typeof payload.detected_emotion === 'string' && payload.detected_emotion.trim() ? payload.detected_emotion.trim() : 'hope';
  const spaceReading = typeof payload.space_reading === 'string' ? payload.space_reading.trim() : '';
  const mythicReading = (typeof payload.mythic_reading === 'string' ? payload.mythic_reading.trim() : '') || spaceReading;
  return { detected_emotion: detectedEmotion, space_reading: spaceReading, mythic_reading: mythicReading };
}
