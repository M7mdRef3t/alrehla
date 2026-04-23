/**
 * نبع Store — Nab'a: Daily Inspiration
 *
 * Manages daily inspiration cards, favorites, streaks, and history.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type InspirationKind = "quote" | "question" | "challenge" | "wisdom" | "exercise";

export interface InspirationCard {
  id: string;
  kind: InspirationKind;
  text: string;
  author?: string;
  emoji: string;
  favorited: boolean;
  seenAt: number;
}

interface NabaState {
  todayCard: InspirationCard | null;
  history: InspirationCard[];
  favorites: InspirationCard[];
  streak: number;
  lastSeenDate: string | null;

  generateToday: () => void;
  shuffle: () => InspirationCard;
  toggleFavorite: (id: string) => void;
}

/* ═══════════════════════════════════════════ */
/*            CONTENT LIBRARY                 */
/* ═══════════════════════════════════════════ */

interface RawInspiration {
  kind: InspirationKind;
  text: string;
  author?: string;
  emoji: string;
}

const LIBRARY: RawInspiration[] = [
  // Quotes
  { kind: "quote", text: "الذي لا يعرف إلى أين يذهب، كل الطرق تأخذه إلى لا مكان.", author: "كيسنجر", emoji: "🧭" },
  { kind: "quote", text: "السر ليس في البحث عن الكمال — بل في البحث عن ما يكفي.", emoji: "💎" },
  { kind: "quote", text: "لا تقارن بدايتك بنهاية شخص آخر.", emoji: "🌱" },
  { kind: "quote", text: "الشجاعة ليست غياب الخوف — بل القرار بأن شيئاً آخر أهم.", author: "أمبروز ريدمون", emoji: "🦁" },
  { kind: "quote", text: "كل صباح نولد من جديد. ما نفعله اليوم هو ما يهم.", author: "بوذا", emoji: "🌅" },
  { kind: "quote", text: "الراحة التي تأتي بعد المقاومة — أعمق من أي راحة أخرى.", emoji: "🏔️" },
  { kind: "quote", text: "أنت لست أفكارك. أنت الفضاء الذي تتحرك فيه.", emoji: "✨" },
  { kind: "quote", text: "الأمان الحقيقي ليس في البقاء — بل في معرفة أنك تستطيع المغادرة.", emoji: "🚪" },
  { kind: "quote", text: "لا أحد يستطيع أن يؤذيك بدون إذنك.", author: "غاندي", emoji: "🛡️" },
  { kind: "quote", text: "ما تقاومه — يستمر. ما تقبله — يتحول.", author: "كارل يونغ", emoji: "🔄" },
  { kind: "quote", text: "التغيير الحقيقي يبدأ عندما تتوقف عن إقناع نفسك بأن كل شيء بخير.", emoji: "💡" },
  { kind: "quote", text: "الأشخاص الذين يخافون من الوحدة — لم يجربوا أن يكونوا مع أنفسهم.", emoji: "🌙" },

  // Questions
  { kind: "question", text: "ما الشيء الذي تعرفه عن نفسك — لكن تتجاهله؟", emoji: "🪞" },
  { kind: "question", text: "لو كنت تنصح صديقك — ماذا ستقول له الآن؟", emoji: "💬" },
  { kind: "question", text: "ما أكثر شيء يستهلك طاقتك — بدون أن يعطيك شيئاً بالمقابل؟", emoji: "⚡" },
  { kind: "question", text: "ما اللحظة الأخيرة التي حسيت فيها إنك حقيقي 100%؟", emoji: "💜" },
  { kind: "question", text: "لو تقدر تغيّر عادة واحدة بس — أيها ستختار؟", emoji: "🔧" },
  { kind: "question", text: "من الشخص اللي يستحق أن تتصل فيه اليوم — ولماذا؟", emoji: "📞" },
  { kind: "question", text: "ما الشيء اللي تخاف منه — لكن تعرف إنه لازم تواجهه؟", emoji: "🎭" },
  { kind: "question", text: "أين ستكون بعد 3 سنوات لو استمريت بنفس الطريقة؟", emoji: "🔮" },

  // Challenges
  { kind: "challenge", text: "اليوم — اكتب 3 أشياء أنت ممتن لها. بصدق.", emoji: "🙏" },
  { kind: "challenge", text: "امشِ 10 دقائق بدون هاتف. فقط أنت والطريق.", emoji: "🚶" },
  { kind: "challenge", text: "أرسل رسالة شكر لشخص لم تشكره من قبل.", emoji: "💌" },
  { kind: "challenge", text: "اقضِ 5 دقائق في صمت تام — فقط تنفس.", emoji: "🧘" },
  { kind: "challenge", text: "اكتب ورقة بخط يدك لنفسك بعد سنة.", emoji: "✍️" },
  { kind: "challenge", text: "تخلّى عن شكوى واحدة اليوم — وراقب ما يحصل.", emoji: "🤐" },
  { kind: "challenge", text: "اعترف بخطأ واحد — لنفسك فقط. بصدق.", emoji: "🪶" },

  // Wisdom
  { kind: "wisdom", text: "العلاقة الصحية لا تحتاج إثبات — تحتاج سلام.", emoji: "🕊️" },
  { kind: "wisdom", text: "أحياناً أفضل قرار — هو عدم اتخاذ قرار الآن.", emoji: "⏸️" },
  { kind: "wisdom", text: "الحب الحقيقي لا يطلب منك أن تتغير — يطلب منك أن تنمو.", emoji: "🌳" },
  { kind: "wisdom", text: "الناس لا تتذكر ما قلت — تتذكر كيف جعلتها تشعر.", emoji: "❤️" },
  { kind: "wisdom", text: "الحدود ليست جدران — الحدود أبواب تفتحها لمن يستحق.", emoji: "🚪" },
  { kind: "wisdom", text: "لن تحصل على حياة جديدة بعقلية قديمة.", emoji: "🧠" },

  // Exercises
  { kind: "exercise", text: "أغمض عينيك — تنفس 4 ثوانٍ، أمسك 4، أخرج 4. كرر 3 مرات.", emoji: "🌬️" },
  { kind: "exercise", text: "ضع يدك على قلبك — قل: أنا بخير. أنا آمن. أنا كافي.", emoji: "🫀" },
  { kind: "exercise", text: "اكتب 5 أشياء تراها الآن. 4 أصوات تسمعها. 3 أشياء تلمسها. 2 تشمها. 1 تتذوقها.", emoji: "🌈" },
  { kind: "exercise", text: "أعد تسمية مشاعرك الآن بدقة — ليس 'زعلان'، بل ماذا بالضبط؟", emoji: "📝" },
];

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickRandom(): RawInspiration {
  return LIBRARY[Math.floor(Math.random() * LIBRARY.length)];
}

function toCard(raw: RawInspiration): InspirationCard {
  return {
    id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...raw,
    favorited: false,
    seenAt: Date.now(),
  };
}

export const useNabaState = create<NabaState>()(
  persist(
    (set, get) => ({
      todayCard: null,
      history: [],
      favorites: [],
      streak: 0,
      lastSeenDate: null,

      generateToday: () => {
        const key = todayKey();
        const state = get();
        if (state.lastSeenDate === key && state.todayCard) return;

        // Streak logic
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
        const newStreak = state.lastSeenDate === yKey ? state.streak + 1 : state.lastSeenDate === key ? state.streak : 1;

        const card = toCard(pickRandom());
        set({
          todayCard: card,
          history: [card, ...state.history].slice(0, 100),
          streak: newStreak,
          lastSeenDate: key,
        });
      },

      shuffle: () => {
        const card = toCard(pickRandom());
        set((s) => ({
          history: [card, ...s.history].slice(0, 100),
        }));
        return card;
      },

      toggleFavorite: (id) => {
        set((s) => {
          const updated = [...s.history].map((c) =>
            c.id === id ? { ...c, favorited: !c.favorited } : c
          );
          const todayCard = s.todayCard?.id === id
            ? { ...s.todayCard, favorited: !s.todayCard.favorited }
            : s.todayCard;
          return {
            history: updated,
            todayCard,
            favorites: updated.filter((c) => c.favorited),
          };
        });
      },
    }),
    { name: "alrehla-naba", storage: zustandIdbStorage }
  )
);
