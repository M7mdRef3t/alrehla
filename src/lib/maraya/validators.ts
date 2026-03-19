/**
 * Validators for Maraya
 * Ported from maraya-storyteller/server/validators.js
 */

import { STYLE_MAP } from './storytellerPrompts';

export function validateEmotion(emotion: string): string {
  if (!emotion || typeof emotion !== 'string') return 'hope';
  const normalized = emotion.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(STYLE_MAP, normalized) ? normalized : 'hope';
}

export function validateChoiceText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();
  if (cleaned.length > 200) cleaned = cleaned.substring(0, 200);
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  return cleaned;
}

export function validateBase64(data: string): boolean {
  if (!data || typeof data !== 'string') return false;
  const trimmed = data.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(trimmed);
}
