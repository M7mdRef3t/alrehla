/**
 * Quick Path Service — المسار السريع
 * ═══════════════════════════════════════════════
 * Bridge: Pure crisis logic from @alrehla/masarat SDK.
 * AI enhancement (Gemini) + localStorage stay here.
 */

import { geminiClient } from "./geminiClient";
import {
  getStaticQuickPath,
  SITUATION_LABELS as SDK_SITUATION_LABELS,
  SITUATION_ICONS as SDK_SITUATION_ICONS,
} from "@alrehla/masarat";
import type {
  QuickPathSituation,
  QuickPathResult,
  QuickPathHistoryEntry,
} from "@alrehla/masarat";

// Re-export types for platform consumers
export type { QuickPathSituation, QuickPathResult, QuickPathHistoryEntry };
export const SITUATION_LABELS = SDK_SITUATION_LABELS;
export const SITUATION_ICONS = SDK_SITUATION_ICONS;

// ─── Local Storage ──────────────────────────────────────

const getFromLocalStorage = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const setInLocalStorage = (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
};

const QUICK_PATH_HISTORY_KEY = "dawayir-quick-path-history";
const MAX_HISTORY = 10;

// ─── AI-Enhanced Generation ─────────────────────────────

export async function generateQuickPath(
    situation: QuickPathSituation,
    context?: string
): Promise<QuickPathResult> {
    // Use SDK for static result
    const staticResult = getStaticQuickPath(situation);

    // If no context or AI unavailable, return static
    if (!context || !geminiClient.isAvailable()) {
        saveToHistory(staticResult);
        return staticResult;
    }

    // Get vertical resonance for context
    let resonanceContext = '';
    try {
      const { useHafizState, getVerticalResonanceState } = require('@/modules/hafiz/store/hafiz.store');
      const resonance = getVerticalResonanceState(useHafizState.getState().memories);
      resonanceContext = `\nالاتصال الروحي: ${resonance.label} (${Math.round(resonance.strength * 100)}%)`;
    } catch { /* fallback */ }

    const prompt = `
أنت جارفيس (Jarvis)، المستشار التكتيكي في منصة "الرحلة". المستخدم في موقف صعب الآن ويحتاج مساعدة فورية.

الموقف: ${SITUATION_LABELS[situation]}
السياق: "${context}"${resonanceContext}

◈ قاعدة المحور الرأسي: كل أزمة بشرية = فرصة لإعادة الاتصال بالمصدر. البشر "مرايات".

اكتب جملة خروج واحدة فقط (بالعامية المصرية) تناسب هذا الموقف بالضبط.
الجملة يجب أن:
- تكون قصيرة (أقل من 15 كلمة)
- تحفظ كرامة المستخدم
- لا تحتاج تبرير
- تفتح باب للخروج بدون صراع

رد بـ JSON فقط:
{
  "exitPhrase": "الجملة بين علامات تنصيص",
  "breathingCue": "تذكير تنفس قصير (جملة واحدة)",
  "followUpAction": "خطوة تالية اختيارية (جملة واحدة)"
}
`;

    try {
        const result = await geminiClient.generateJSON<{
            exitPhrase: string;
            breathingCue: string;
            followUpAction: string;
        }>(prompt);

        if (result?.exitPhrase) {
            const enhanced: QuickPathResult = {
                ...result,
                situation,
                timestamp: Date.now(),
            };
            saveToHistory(enhanced);
            return enhanced;
        }
    } catch {
        // Fallback to static
    }

    saveToHistory(staticResult);
    return staticResult;
}

// ─── History Management ─────────────────────────────────

function saveToHistory(result: QuickPathResult): void {
    const entry: QuickPathHistoryEntry = {
        situation: result.situation,
        exitPhrase: result.exitPhrase,
        timestamp: result.timestamp,
    };

    const raw = getFromLocalStorage(QUICK_PATH_HISTORY_KEY);
    const history: QuickPathHistoryEntry[] = raw ? JSON.parse(raw) : [];
    const updated = [entry, ...history].slice(0, MAX_HISTORY);
    setInLocalStorage(QUICK_PATH_HISTORY_KEY, JSON.stringify(updated));
}

export function getQuickPathHistory(): QuickPathHistoryEntry[] {
    const raw = getFromLocalStorage(QUICK_PATH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
}
