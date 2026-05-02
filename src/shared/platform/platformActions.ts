/**
 * platformActions.ts
 * ══════════════════════════════════════════════════
 * الأفعال المركزية — الكتابة العابرة للأدوات.
 *
 * أي module يقدر يعمل:
 *   import { actions } from "@/shared/platform";
 *   actions.logActivity({ source: "khalwa", action: "completed" });
 *   actions.grantXp("khalwa:session", "peace", 10, "أكملت خلوة");
 */

import { eventBus } from "@/shared/events/bus";

// ── Lazy store access ──

function getStore(path: string, hook: string) {
  try {
    const mod = require(path);
    return mod[hook]?.getState?.() ?? null;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════
//                    WRITE ACTIONS
// ═══════════════════════════════════════════════════════════

/**
 * 📋 يسجل نشاط في السجل المركزي (Sijil)
 */
function logActivity(event: { source: string; action: string; meta?: Record<string, unknown> }): void {
  const sijil = getStore("@/modules/sijil/store/sijil.store", "useSijilState");
  if (!sijil?.addEvent) return;
  try { sijil.addEvent(event); } catch { /* silent */ }
}

/**
 * 📔 يسجل في اليوميات (Yawmiyyat)
 */
function logToJournal(entry: { type: string; content: string; mood?: string | null; tags?: string[] }): void {
  const yawmiyyat = getStore("@/modules/yawmiyyat/store/yawmiyyat.store", "useYawmiyyatState");
  if (!yawmiyyat?.addEntry) return;
  try { yawmiyyat.addEntry(entry); } catch { /* silent */ }
}

/**
 * 💰 يمنح XP في الرصيد (Raseed)
 */
function grantXp(source: string, dimension: string, amount: number, label: string): void {
  const raseed = getStore("@/modules/raseed/store/raseed.store", "useRaseedState");
  if (!raseed?.addXp) return;
  try { raseed.addXp(source, dimension, amount, label); } catch { /* silent */ }
}

/**
 * 📊 يسجل أثر (Athar)
 */
function logImpact(content: string, category: string, emoji?: string, meta?: Record<string, unknown>): void {
  const athar = getStore("@/modules/athar/store/athar.store", "useAtharState");
  if (!athar?.addEntry) return;
  try { athar.addEntry({ content, category, emoji, meta }); } catch { /* silent */ }
}

/**
 * 💎 يضيف جوهرة للكنز (Kanz)
 */
function addGem(content: string, category: string, source: string): void {
  const kanz = getStore("@/modules/kanz/store/kanz.store", "useKanzState");
  if (!kanz?.addGem) return;
  try { kanz.addGem({ content, category, source }); } catch { /* silent */ }
}

/**
 * 📡 يبث حدث عبر EventBus
 */
function emitEvent(name: string, payload: Record<string, unknown>): void {
  try {
    eventBus.emit(`custom:${name}` as `custom:${string}`, payload);
  } catch { /* silent */ }
}

/**
 * 📔+📋 يسجل نشاط في كل مكان — Journal + Sijil + optional Impact
 */
function logEverywhere(event: {
  source: string;
  action: string;
  content: string;
  tags?: string[];
  impactCategory?: string;
  impactEmoji?: string;
}): void {
  logActivity({ source: event.source, action: event.action, meta: { tags: event.tags } });
  logToJournal({ type: "milestone", content: event.content, tags: event.tags ?? [event.source] });
  if (event.impactCategory) {
    logImpact(event.content, event.impactCategory, event.impactEmoji);
  }
}

// ═══════════════════════════════════════════════════════════
//                    PUBLIC API
// ═══════════════════════════════════════════════════════════

export const actions = {
  logActivity,
  logToJournal,
  grantXp,
  logImpact,
  addGem,
  emitEvent,
  logEverywhere,
};
