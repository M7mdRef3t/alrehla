/**
 * رسالة — Risala Store
 *
 * Anonymous messages between travelers: أرسل / استقبل / زجاجة البحر
 * Send encouragement → Receive from stranger → Random bottle
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type MessageTone =
  | "encouragement" // تشجيع
  | "wisdom"        // حكمة
  | "empathy"       // تعاطف
  | "gratitude"     // امتنان
  | "hope"          // أمل
  | "strength";     // قوة

export type TravelerStage =
  | "beginning"     // بداية الطريق
  | "struggling"    // في صراع
  | "growing"       // ينمو
  | "healing"       // يتعافى
  | "searching"     // يبحث
  | "transforming"; // يتحوّل

export interface RisalaMessage {
  id: string;
  createdAt: number;
  content: string;
  tone: MessageTone;
  senderStage: TravelerStage;
  targetStage: TravelerStage | "anyone"; // to whom
  isBottle: boolean; // random bottle mode
  isSent: boolean;   // user sent this
  isRead: boolean;
  reaction?: "heart" | "star" | "prayer" | "tear";
}

export interface RisalaState {
  sentMessages: RisalaMessage[];
  receivedMessages: RisalaMessage[];
  myStage: TravelerStage;
  bottlesSent: number;
  bottlesReceived: number;

  // Actions
  setMyStage: (stage: TravelerStage) => void;
  sendMessage: (data: {
    content: string;
    tone: MessageTone;
    targetStage: TravelerStage | "anyone";
    isBottle: boolean;
  }) => void;
  receiveRandomMessage: () => RisalaMessage;
  receiveBottle: () => RisalaMessage;
  markRead: (id: string) => void;
  reactToMessage: (id: string, reaction: "heart" | "star" | "prayer" | "tear") => void;

  // Getters
  getSentCount: () => number;
  getReceivedCount: () => number;
  getUnreadCount: () => number;
  getToneStats: () => Record<MessageTone, number>;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const TONE_META: Record<MessageTone, { label: string; emoji: string; color: string }> = {
  encouragement: { label: "تشجيع",  emoji: "💪", color: "#f59e0b" },
  wisdom:        { label: "حكمة",   emoji: "🦉", color: "#8b5cf6" },
  empathy:       { label: "تعاطف",  emoji: "🤗", color: "#ec4899" },
  gratitude:     { label: "امتنان", emoji: "🙏", color: "#10b981" },
  hope:          { label: "أمل",    emoji: "🌅", color: "#06b6d4" },
  strength:      { label: "قوة",    emoji: "🔥", color: "#ef4444" },
};

export const STAGE_META: Record<TravelerStage, { label: string; emoji: string; color: string }> = {
  beginning:    { label: "بداية الطريق",  emoji: "🌱", color: "#10b981" },
  struggling:   { label: "في صراع",       emoji: "⛈️", color: "#ef4444" },
  growing:      { label: "ينمو",          emoji: "🌿", color: "#84cc16" },
  healing:      { label: "يتعافى",        emoji: "🩹", color: "#f472b6" },
  searching:    { label: "يبحث",          emoji: "🔭", color: "#6366f1" },
  transforming: { label: "يتحوّل",        emoji: "🦋", color: "#a855f7" },
};

export const REACTION_META: Record<string, { emoji: string; label: string }> = {
  heart:  { emoji: "❤️", label: "قلب" },
  star:   { emoji: "⭐", label: "نجمة" },
  prayer: { emoji: "🤲", label: "دعاء" },
  tear:   { emoji: "🥺", label: "تأثر" },
};

/* ═══════════════════════════════════════════ */
/*         SEED MESSAGES POOL                 */
/* ═══════════════════════════════════════════ */

const SEED_POOL: Omit<RisalaMessage, "id" | "createdAt" | "isSent" | "isRead" | "reaction">[] = [
  { content: "مهما شعرت بالوحدة — تذكّر أن هناك مسافر مثلك يمشي نفس الطريق الآن", tone: "empathy", senderStage: "healing", targetStage: "struggling", isBottle: false },
  { content: "الخطوة الأولى هي الأصعب. لكنك أخذتها بالفعل بمجرد أنك هنا", tone: "encouragement", senderStage: "growing", targetStage: "beginning", isBottle: false },
  { content: "السقوط ليس نهاية — السقوط هو اللحظة التي يبدأ فيها الوعي", tone: "wisdom", senderStage: "transforming", targetStage: "struggling", isBottle: false },
  { content: "أنا ممتن إنك موجود. وجودك يعني أن أحداً ما قرر أن يحاول", tone: "gratitude", senderStage: "healing", targetStage: "anyone", isBottle: false },
  { content: "الألم الذي تمر به الآن سيصبح حكمة تساعد بها غيرك يوماً ما", tone: "hope", senderStage: "transforming", targetStage: "struggling", isBottle: true },
  { content: "لا تقارن رحلتك برحلة أحد. أنت تمشي بسرعتك — وهذا كافي", tone: "strength", senderStage: "growing", targetStage: "beginning", isBottle: false },
  { content: "التغيير الحقيقي بطيء وهادئ. لا تنخدع بالضجيج", tone: "wisdom", senderStage: "transforming", targetStage: "growing", isBottle: true },
  { content: "أتمنى لك لحظة صفاء اليوم — لحظة واحدة تكفي لتذكيرك بمن أنت حقاً", tone: "hope", senderStage: "healing", targetStage: "anyone", isBottle: true },
  { content: "قوتك ليست في أنك لا تسقط — قوتك في أنك تقوم كل مرة", tone: "strength", senderStage: "growing", targetStage: "struggling", isBottle: false },
  { content: "سامحت نفسي اليوم. وأتمنى لك أن تسامح نفسك أيضاً", tone: "empathy", senderStage: "healing", targetStage: "anyone", isBottle: true },
  { content: "أنت أقوى مما تظن. وأدري هذي جملة سمعتها كثير — بس صدّقني هالمرة", tone: "encouragement", senderStage: "transforming", targetStage: "struggling", isBottle: false },
  { content: "الرحلة مش سباق. خذ نفَس. اشرب ماء. وكمّل بهدوء", tone: "empathy", senderStage: "growing", targetStage: "anyone", isBottle: true },
];

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useRisalaState = create<RisalaState>()(
  persist(
    (set, get) => ({
      sentMessages: [],
      receivedMessages: [],
      myStage: "beginning",
      bottlesSent: 0,
      bottlesReceived: 0,

      setMyStage: (stage) => set({ myStage: stage }),

      sendMessage: (data) => {
        const msg: RisalaMessage = {
          id: genId(),
          createdAt: Date.now(),
          content: data.content,
          tone: data.tone,
          senderStage: get().myStage,
          targetStage: data.targetStage,
          isBottle: data.isBottle,
          isSent: true,
          isRead: true,
        };
        set((s) => ({
          sentMessages: [msg, ...s.sentMessages],
          bottlesSent: data.isBottle ? s.bottlesSent + 1 : s.bottlesSent,
        }));
      },

      receiveRandomMessage: () => {
        const stage = get().myStage;
        const pool = SEED_POOL.filter(
          (m) => m.targetStage === "anyone" || m.targetStage === stage
        );
        const seed = pickRandom(pool.length > 0 ? pool : SEED_POOL);
        const msg: RisalaMessage = {
          ...seed,
          id: genId(),
          createdAt: Date.now() - Math.floor(Math.random() * 86400000),
          isSent: false,
          isRead: false,
        };
        set((s) => ({ receivedMessages: [msg, ...s.receivedMessages] }));
        return msg;
      },

      receiveBottle: () => {
        const bottles = SEED_POOL.filter((m) => m.isBottle);
        const seed = pickRandom(bottles);
        const msg: RisalaMessage = {
          ...seed,
          id: genId(),
          createdAt: Date.now() - Math.floor(Math.random() * 172800000),
          isSent: false,
          isRead: false,
        };
        set((s) => ({
          receivedMessages: [msg, ...s.receivedMessages],
          bottlesReceived: s.bottlesReceived + 1,
        }));
        return msg;
      },

      markRead: (id) => {
        set((s) => ({
          receivedMessages: s.receivedMessages.map((m) =>
            m.id === id ? { ...m, isRead: true } : m
          ),
        }));
      },

      reactToMessage: (id, reaction) => {
        set((s) => ({
          receivedMessages: s.receivedMessages.map((m) =>
            m.id === id ? { ...m, reaction } : m
          ),
        }));
      },

      // Getters
      getSentCount: () => get().sentMessages.length,
      getReceivedCount: () => get().receivedMessages.length,
      getUnreadCount: () => get().receivedMessages.filter((m) => !m.isRead).length,
      getToneStats: () => {
        const stats: Record<MessageTone, number> = {
          encouragement: 0, wisdom: 0, empathy: 0, gratitude: 0, hope: 0, strength: 0,
        };
        get().sentMessages.forEach((m) => { stats[m.tone]++; });
        return stats;
      },
    }),
    { name: "alrehla-risala", storage: zustandIdbStorage }
  )
);
