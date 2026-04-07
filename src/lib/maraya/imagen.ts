import { logger } from "../../services/logger";
/**
 * Imagen Image Generation Service for Maraya
 * Adapted from the legacy Maraya image runtime.
 */

import { GoogleGenAI } from '@google/genai';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ai: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeStrategy: any = null;
let globalBackoffUntil = 0;

export function initImagen(apiKey: string) {
  ai = new GoogleGenAI({ apiKey });
}

function ensureInit() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');
    initImagen(key);
  }
}

const IMAGEN_DEFAULT_MODELS = ['imagen-4.0-generate-001', 'imagen-3.0-generate-002'];
const GEMINI_IMAGE_DEFAULT_MODELS = ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'];

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.map(v => (v || '').trim()).filter(Boolean))];
}

function shouldRetryWithAnotherModel(error: Error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('not found') || message.includes('unsupported') || message.includes('invalid argument') || message.includes('no image');
}

async function generateWithImagenModel(model: string, prompt: string) {
  const response = await ai.models.generateImages({
    model, prompt: `${prompt}, photorealistic, cinematic composition, ultra high quality`,
    config: { numberOfImages: 1, aspectRatio: '16:9' },
  });
  if (response.generatedImages && response.generatedImages.length > 0) {
    return { base64: response.generatedImages[0].image.imageBytes, mimeType: 'image/png' };
  }
  return null;
}

async function generateWithGeminiImageModel(model: string, prompt: string) {
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: `Create one cinematic 16:9 still image only. ${prompt}` }] }],
    config: { responseModalities: ['IMAGE'], temperature: 0.8 },
  });
  const parts = response?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const data = part?.inlineData?.data;
    if (data) return { base64: data, mimeType: part.inlineData?.mimeType || 'image/png' };
  }
  if (response?.data) return { base64: response.data, mimeType: 'image/png' };
  return null;
}

interface Strategy { type: 'imagen' | 'gemini-image'; model: string; }

function buildStrategyCandidates(): Strategy[] {
  const imagenModels = uniqueNonEmpty([process.env.IMAGEN_MODEL || '', ...IMAGEN_DEFAULT_MODELS]);
  const geminiImageModels = uniqueNonEmpty([process.env.GEMINI_IMAGE_MODEL || '', ...GEMINI_IMAGE_DEFAULT_MODELS]);
  return [
    ...imagenModels.map(model => ({ type: 'imagen' as const, model })),
    ...geminiImageModels.map(model => ({ type: 'gemini-image' as const, model })),
  ];
}

async function runStrategy(strategy: Strategy, prompt: string) {
  if (strategy.type === 'imagen') return generateWithImagenModel(strategy.model, prompt);
  return generateWithGeminiImageModel(strategy.model, prompt);
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export async function generateImage(prompt: string): Promise<GeneratedImage | null> {
  ensureInit();
  if (Date.now() < globalBackoffUntil) return null;

  try {
    const queue = buildStrategyCandidates();

    if (activeStrategy) {
      try {
        const image = await runStrategy(activeStrategy, prompt);
        if (image) return image;
      } catch (error) {
        if (!shouldRetryWithAnotherModel(error as Error)) throw error;
        activeStrategy = null;
      }
    }

    for (const strategy of queue) {
      try {
        const image = await runStrategy(strategy, prompt);
        if (image) { activeStrategy = strategy; return image; }
      } catch (error) {
        if (!shouldRetryWithAnotherModel(error as Error)) throw error;
      }
    }

    globalBackoffUntil = Date.now() + 60000;
    logger.error('[maraya-imagen] All image generation strategies failed');
    return null;
  } catch (error) {
    logger.error('[maraya-imagen] Image generation failed:', (error as Error).message);
    return null;
  }
}
