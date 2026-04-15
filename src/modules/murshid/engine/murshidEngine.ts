/**
 * مرشد Engine — Murshid: الذكاء الموجّه
 *
 * Rule-based intelligence engine that reads ALL platform stores
 * and generates personalized insights, nudges, celebrations, and predictions.
 * 
 * Reads from: Pulse, Gamification, Map, History, Predictive, Journal, Rifaq
 */

import { usePulseState, type PulseMood } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useConsciousnessHistory } from "@/domains/consciousness/store/history.store";
import { usePredictiveState } from "@/domains/consciousness/store/predictive.store";
import { useMapState } from "@/modules/map/dawayirIndex";
import { useDailyJournalState } from "@/domains/journey/store/journal.store";
import { useRifaqState } from "@/modules/rifaq/store/rifaq.store";

/* ═══════════════════════════════════════════ */
/*                  TYPES                     */
/* ═══════════════════════════════════════════ */

export type InsightType = "daily" | "nudge" | "celebration" | "prediction" | "warning" | "pattern";

export interface MurshidInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  emoji: string;
  color: string;
  source: string; // Which engine/store generated this
  priority: number; // 1-10, higher = more important
  actionLabel?: string;
  actionScreen?: string;
  timestamp: number;
}

/* ═══════════════════════════════════════════ */
/*             MOOD WEIGHTS                   */
/* ═══════════════════════════════════════════ */

const MOOD_POSITIVITY: Record<PulseMood, number> = {
  bright: 10, hopeful: 8, calm: 7,
  anxious: 3, tense: 3, sad: 2,
  angry: 1, overwhelmed: 1,
};

/* ═══════════════════════════════════════════ */
/*          INSIGHT GENERATORS                */
/* ═══════════════════════════════════════════ */

function generatePulseInsights(): MurshidInsight[] {
  const insights: MurshidInsight[] = [];
  const logs = usePulseState.getState().logs ?? [];
  if (logs.length === 0) return [];

  const recent = logs.slice(0, 7);
  const energies = recent.map((p) => p.energy);
  const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;

  // Energy drop pattern
  const dropping = energies.length >= 3 && energies[0] < energies[1] && energies[1] < energies[2];
  if (dropping) {
    insights.push({
      id: "pulse-energy-drop", type: "nudge", priority: 8,
      title: "طاقتك في انخفاض",
      message: `طاقتك نزلت 3 أيام متتالية (${energies.slice(0, 3).join(" → ")}). جسمك بيقولك حاجة — جرّب تمرين تأريض أو اكتب في وثيقة عن اللي بيحصل.`,
      emoji: "⚡", color: "#f97316", source: "Pulse",
      actionLabel: "افتح أتموسفيرا", actionScreen: "atmosfera",
      timestamp: Date.now(),
    });
  }

  // Low energy alert
  if (avgEnergy < 4) {
    insights.push({
      id: "pulse-low-energy", type: "warning", priority: 9,
      title: "طاقتك منخفضة جداً",
      message: `متوسط طاقتك ${avgEnergy.toFixed(1)}/10 — ده أقل من المعتاد. الأولوية دلوقتي: راحة، نوم، وتواصل مع شخص آمن.`,
      emoji: "🔋", color: "#ef4444", source: "Pulse",
      actionLabel: "سجّل نبضة", actionScreen: "landing",
      timestamp: Date.now(),
    });
  }

  // Mood stability check
  const moods = recent.map((p) => p.mood);
  const uniqueMoods = new Set(moods);
  if (uniqueMoods.size >= 4 && recent.length >= 5) {
    insights.push({
      id: "pulse-mood-volatile", type: "pattern", priority: 6,
      title: "مزاجك متقلّب",
      message: `سجّلت ${uniqueMoods.size} حالات مزاجية مختلفة في ${recent.length} أيام. التقلب طبيعي — لكن لو حاسس إنه مش مسيطر، وثيقة ممكن تساعدك تفهم الأنماط.`,
      emoji: "🎭", color: "#a855f7", source: "Pulse",
      actionLabel: "اكتب في وثيقة", actionScreen: "watheeqa",
      timestamp: Date.now(),
    });
  }

  // Positive streak
  const positiveCount = recent.filter((p) => MOOD_POSITIVITY[p.mood] >= 7).length;
  if (positiveCount >= 5) {
    insights.push({
      id: "pulse-positive-streak", type: "celebration", priority: 7,
      title: "أسبوع إيجابي! 🌟",
      message: `${positiveCount} من آخر ${recent.length} نبضات كانت إيجابية. أنت في مسار ممتاز — خلّي الزخم ده يستمر.`,
      emoji: "☀️", color: "#10b981", source: "Pulse",
      timestamp: Date.now(),
    });
  }

  return insights;
}

function generateGamificationInsights(): MurshidInsight[] {
  const insights: MurshidInsight[] = [];
  const { xp, level, streak, badges } = useGamificationState.getState();

  // Streak milestones
  if (streak === 7) {
    insights.push({
      id: "gam-week-streak", type: "celebration", priority: 8,
      title: "أسبوع كامل! 🔥",
      message: "7 أيام متواصلة — ده مش عادي. أنت أثبتّ إن الالتزام ممكن. الأسبوع الجاي بيستنّاك.",
      emoji: "🔥", color: "#ef4444", source: "Tajmeed",
      timestamp: Date.now(),
    });
  } else if (streak === 30) {
    insights.push({
      id: "gam-month-streak", type: "celebration", priority: 10,
      title: "شهر كامل! 👑",
      message: "30 يوم متواصل. أنت من الـ 1% اللي وصلوا لهنا. ده مستوى التزام استثنائي.",
      emoji: "👑", color: "#f59e0b", source: "Tajmeed",
      timestamp: Date.now(),
    });
  }

  // Level up nudge
  const progress = useGamificationState.getState().getLevelProgress();
  if (progress.progress >= 0.85 && progress.progress < 1) {
    const remaining = progress.requiredForLevel - progress.xpInCurrent;
    insights.push({
      id: "gam-almost-levelup", type: "nudge", priority: 7,
      title: "قريب من المستوى الجديد!",
      message: `باقي ${remaining} XP فقط للمستوى ${level + 1}. سجّل نبضة أو اكتب تدوينة وهتوصل.`,
      emoji: "⬆️", color: "#a855f7", source: "Tajmeed",
      actionLabel: "سجّل نبضة", actionScreen: "landing",
      timestamp: Date.now(),
    });
  }

  // No streak warning
  if (streak === 0 && xp > 100) {
    insights.push({
      id: "gam-broken-streak", type: "nudge", priority: 6,
      title: "الـ Streak انكسر",
      message: "مفيش نشاط أمس. Streak بتاعك رجع صفر — لكن مش لازم يفضل كده. ابدأ النهارده من جديد.",
      emoji: "💔", color: "#64748b", source: "Tajmeed",
      actionLabel: "ابدأ من جديد", actionScreen: "landing",
      timestamp: Date.now(),
    });
  }

  // Badge achievements
  if (badges.length > 0) {
    const latest = badges[badges.length - 1];
    const daysSince = (Date.now() - latest.earnedAt) / 86400000;
    if (daysSince < 1) {
      insights.push({
        id: "gam-new-badge", type: "celebration", priority: 7,
        title: `وسام جديد: ${latest.name}`,
        message: `${latest.description} — كل وسام هو محطة في رحلتك.`,
        emoji: latest.icon, color: "#fbbf24", source: "Tajmeed",
        timestamp: Date.now(),
      });
    }
  }

  return insights;
}

function generateRelationshipInsights(): MurshidInsight[] {
  const insights: MurshidInsight[] = [];
  const nodes = useMapState.getState().nodes ?? [];
  const active = nodes.filter((n: any) => !n.isNodeArchived);

  if (active.length === 0) return [];

  const red = active.filter((n: any) => n.ring === "red").length;
  const green = active.filter((n: any) => n.ring === "green").length;
  const total = active.length;

  // Too many red relationships
  if (red >= 3) {
    insights.push({
      id: "rel-too-many-red", type: "warning", priority: 9,
      title: "3 علاقات سامة أو أكتر",
      message: `عندك ${red} علاقة في الحلقة الحمراء من ${total}. ده بيأثر على طاقتك وصحتك. فكّر: هل محتاج تجمّد واحدة منهم؟`,
      emoji: "🔴", color: "#ef4444", source: "Dawayir",
      actionLabel: "افتح الخريطة", actionScreen: "dawayir",
      timestamp: Date.now(),
    });
  }

  // Healthy ratio celebration
  if (total >= 5 && green / total >= 0.7) {
    insights.push({
      id: "rel-healthy-ratio", type: "celebration", priority: 6,
      title: "علاقاتك صحية! 💚",
      message: `${Math.round((green / total) * 100)}% من علاقاتك في الحلقة الخضراء. ده مؤشر قوي على بيئة اجتماعية سليمة.`,
      emoji: "💚", color: "#10b981", source: "Dawayir",
      timestamp: Date.now(),
    });
  }

  // Red > Green imbalance
  if (red > green && total >= 3) {
    insights.push({
      id: "rel-imbalance", type: "pattern", priority: 8,
      title: "العلاقات السامة أكتر من الآمنة",
      message: `${red} سامة vs ${green} آمنة. بيئتك الاجتماعية تحت ضغط. الأولوية: حدود أوضح أو تقليل تعرّض.`,
      emoji: "⚖️", color: "#f97316", source: "Dawayir",
      actionLabel: "راجع الخريطة", actionScreen: "dawayir",
      timestamp: Date.now(),
    });
  }

  return insights;
}

function generatePredictiveInsights(): MurshidInsight[] {
  const insights: MurshidInsight[] = [];
  const { crashProbability, isSurvivalMode, forecast } = usePredictiveState.getState();

  if (crashProbability > 0.7) {
    insights.push({
      id: "pred-high-crash", type: "warning", priority: 10,
      title: "⚠️ إنذار عالي",
      message: `احتمال الانهيار ${Math.round(crashProbability * 100)}%. النظام شايف ضغط كبير. خذ استراحة، تواصل مع شخص آمن، وسجّل حالتك.`,
      emoji: "🚨", color: "#ef4444", source: "Predictive Engine",
      actionLabel: "تمرين تأريض", actionScreen: "atmosfera",
      timestamp: Date.now(),
    });
  } else if (crashProbability > 0.4) {
    insights.push({
      id: "pred-moderate-crash", type: "nudge", priority: 7,
      title: "ضغط متوسط",
      message: `احتمال الانهيار ${Math.round(crashProbability * 100)}%. مش خطر — لكن خلّي بالك. يوم راحة ممكن يفرق كتير.`,
      emoji: "⚡", color: "#fbbf24", source: "Predictive Engine",
      timestamp: Date.now(),
    });
  }

  if (isSurvivalMode) {
    insights.push({
      id: "pred-survival", type: "warning", priority: 10,
      title: "وضع البقاء نشط",
      message: "النظام فعّل وضع البقاء تلقائياً — ده معناه إن المؤشرات عالية. الأولوية: سلامتك أولاً.",
      emoji: "🛡️", color: "#ef4444", source: "Predictive Engine",
      timestamp: Date.now(),
    });
  }

  return insights;
}

function generateJournalInsights(): MurshidInsight[] {
  const insights: MurshidInsight[] = [];
  const entries = useDailyJournalState.getState().entries ?? [];
  const written = entries.filter((e) => e.answer.length > 0);

  if (written.length === 0 && usePulseState.getState().logs.length > 5) {
    insights.push({
      id: "journal-not-started", type: "nudge", priority: 5,
      title: "ما بدأتش التوثيق بعد",
      message: "عندك بيانات نبض لكن ما كتبتش ولا تدوينة. الكتابة بتكشف أنماط النبض مش بيكشفها. جرّب.",
      emoji: "📝", color: "#fb923c", source: "Watheeqa",
      actionLabel: "اكتب الآن", actionScreen: "watheeqa",
      timestamp: Date.now(),
    });
  }

  // Consistent journaling celebration
  if (written.length >= 10) {
    insights.push({
      id: "journal-consistent", type: "celebration", priority: 5,
      title: `${written.length} تدوينة! 📖`,
      message: `كتبت ${written.length} تدوينة — ده أرشيف ثمين لرحلتك. كل كلمة بتبني وعي أعمق.`,
      emoji: "📖", color: "#10b981", source: "Watheeqa",
      timestamp: Date.now(),
    });
  }

  return insights;
}

function generateSocialInsights(): MurshidInsight[] {
  const insights: MurshidInsight[] = [];
  const { buddies } = useRifaqState.getState();
  const active = buddies.filter((b) => b.status === "active");

  if (active.length === 0 && useGamificationState.getState().level >= 3) {
    insights.push({
      id: "social-no-rifaq", type: "nudge", priority: 4,
      title: "لسه ما أضفتش رفيق",
      message: "الرحلة أسهل مع رفيق. اكتشف مسافر بنفس هدفك أو ادعُ شخص تعرفه.",
      emoji: "🤝", color: "#ec4899", source: "Rifaq",
      actionLabel: "اكتشف رفاق", actionScreen: "rifaq",
      timestamp: Date.now(),
    });
  }

  if (active.length >= 3) {
    insights.push({
      id: "social-good-network", type: "celebration", priority: 5,
      title: "شبكة دعم قوية! 👥",
      message: `عندك ${active.length} رفاق نشطين — ده بيأثر إيجابياً على استمراريتك في الرحلة.`,
      emoji: "👥", color: "#ec4899", source: "Rifaq",
      timestamp: Date.now(),
    });
  }

  return insights;
}

function generateDailyInsight(): MurshidInsight {
  const hour = new Date().getHours();
  const logs = usePulseState.getState().logs ?? [];
  const streak = useGamificationState.getState().streak;

  const morningMessages = [
    "صباح جديد — فرصة تبدأ الإنطلاق من جديد. سجّل نبضك وابدأ يومك بوعي.",
    "كل يوم هو محطة جديدة في رحلتك. إيه اللي تحب تحققه النهارده؟",
    "الصباح هو أنقى لحظة — استغلها تسجّل حالتك قبل ما الضوضاء تبدأ.",
  ];
  const eveningMessages = [
    "يومك خلص — أو كاد. خذ لحظة تراجع: إيه اللي مشي كويس؟",
    "قبل ما تنام — سجّل حاجة واحدة أنت ممتن ليها النهارده.",
    "المساء وقت التأمل. اكتب في وثيقة واختم يومك بسلام.",
  ];

  const pool = hour < 14 ? morningMessages : eveningMessages;
  const msg = pool[Math.floor(Math.random() * pool.length)];

  let contextual = "";
  if (streak >= 7) contextual = ` (${streak} يوم متواصل — خلّي الزخم!)`;
  else if (logs.length > 0 && logs[0].energy < 4) contextual = " (طاقتك كانت منخفضة — خذها بهدوء النهارده.)";

  return {
    id: "daily-insight",
    type: "daily",
    title: hour < 14 ? "رسالة الصباح" : "رسالة المساء",
    message: msg + contextual,
    emoji: hour < 14 ? "🌅" : "🌙",
    color: hour < 14 ? "#fbbf24" : "#8b5cf6",
    source: "Murshid",
    priority: 3,
    timestamp: Date.now(),
  };
}

/* ═══════════════════════════════════════════ */
/*             PUBLIC API                     */
/* ═══════════════════════════════════════════ */

export function generateAllInsights(): MurshidInsight[] {
  const all = [
    generateDailyInsight(),
    ...generatePulseInsights(),
    ...generateGamificationInsights(),
    ...generateRelationshipInsights(),
    ...generatePredictiveInsights(),
    ...generateJournalInsights(),
    ...generateSocialInsights(),
  ];

  // Sort by priority (highest first), then by type
  return all.sort((a, b) => b.priority - a.priority);
}
