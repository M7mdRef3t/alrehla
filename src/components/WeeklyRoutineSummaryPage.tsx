import { useState, type FC } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Users, Heart, Trophy, Share2 } from "lucide-react";
import { useMapState } from "../state/mapState";
import { usePulseState } from "../state/pulseState";
import { useJourneyState } from "../state/journeyState";
import { loadStreak } from "../services/streakSystem";

interface WeeklyRoutineSummaryPageProps {
  onBack: () => void;
  onShare?: () => void;
}

const SHARE_TITLE = "ملخص رحلتي مع Dawayir";

const MOTIVATIONAL = [
  "الاستمرار هو السر. كل يوم بتفتح التطبيق هو فوز.",
  "التعافي مش سباق — هو وعي يومي. وأنت واعي.",
  "كل نبضة سجلتها دي شجاعة حقيقية.",
  "أنت بتكتب قصة تستحق تتروى.",
  "اللي حصل مش في يوم واحد — هو في الأيام المتراكمة زي دي.",
];

export const WeeklyRoutineSummaryPage: FC<WeeklyRoutineSummaryPageProps> = ({
  onBack,
  onShare,
}) => {
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");
  const nodes = useMapState((s) => s.nodes);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const journeyStartedAt = useJourneyState((s) => s.journeyStartedAt);
  const streak = loadStreak();

  const activeNodes = nodes.filter((n) => !n.isNodeArchived);
  const greenNodes = activeNodes.filter((n) => n.ring === "green").length;

  const journeyDays = journeyStartedAt
    ? Math.floor((Date.now() - journeyStartedAt) / (1000 * 60 * 60 * 24))
    : 0;

  const motivation = MOTIVATIONAL[journeyDays % MOTIVATIONAL.length];
  const pulseCount = lastPulse ? 1 : 0;
  const shareText = `هذا ملخص أسبوعي لروتيني على Dawayir:\n- streak: ${streak.currentStreak} يوم\n- الدوائر النشطة: ${activeNodes.length}\n- العلاقات الآمنة: ${greenNodes}\n\nأستمر خطوة بخطوة نحو هدوء أوضح واتساق أكبر.`;
  const insightPoints = Math.max(35, streak.currentStreak * 12 + activeNodes.length * 3 + greenNodes * 5);
  const insightLevel = Math.max(1, Math.floor(insightPoints / 100) + 1);
  const insightProgress = insightPoints % 100;

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: SHARE_TITLE,
          text: shareText,
        });
        setShareStatus("shared");
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setShareStatus("copied");
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareStatus("copied");
      } catch {
        window.alert(shareText);
      }
    }
  };

  const stats = [
    { icon: <Flame className="w-5 h-5 text-orange-400" />, value: streak.currentStreak, label: "يوم streak", color: "rgba(251,146,60,0.15)", border: "rgba(251,146,60,0.25)" },
    { icon: <Users className="w-5 h-5 text-teal-400" />, value: activeNodes.length, label: "في دوايرك", color: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.22)" },
    { icon: <Heart className="w-5 h-5 text-rose-400" />, value: greenNodes, label: "علاقة آمنة", color: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.22)" },
    { icon: <Trophy className="w-5 h-5 text-amber-400" />, value: journeyDays, label: "يوم في الرحلة", color: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.22)" },
  ];

  return (
    <main
      className="min-h-screen px-4 py-6 md:py-10"
      dir="rtl"
      style={{ background: "linear-gradient(180deg, var(--space-void) 0%, var(--space-deep) 55%, var(--space-950) 100%)" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{ color: "var(--brand-white)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </button>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.28em] text-white/55">ملخص الإحصائيات الأسبوعية</p>
            <h1 className="text-xl font-black text-white sm:text-2xl">ملخص روتينك الأسبوعي</h1>
          </div>
        </div>

        <section className="glass-card rounded-[2rem] p-5 md:p-6">
          <div className="text-center">
            <div className="mb-3 text-4xl">🌟</div>
            <p className="text-sm text-white/65">أنت هنا بعد {journeyDays} يوم من بداية الرحلة.</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="rounded-2xl p-4 text-center"
                style={{ background: stat.color, border: `1px solid ${stat.border}` }}
              >
                <div className="mb-2 flex justify-center">{stat.icon}</div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="mt-1 text-[10px] text-white/55">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl p-4 text-center" style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.12)" }}>
            <p className="text-sm font-medium leading-relaxed text-white/80">"{motivation}"</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl p-4 glass" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">النشاط</p>
              <p className="mt-2 text-lg font-black text-white">{pulseCount}</p>
              <p className="mt-1 text-xs leading-6 text-white/60">آخر نبضة مسجلة داخل الرحلة.</p>
            </div>
            <div className="rounded-2xl p-4 glass" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs uppercase tracking-[0.24em] text-white/55">الاستمرارية</p>
              <p className="mt-2 text-lg font-black text-white">{streak.currentStreak}</p>
              <p className="mt-1 text-xs leading-6 text-white/60">عدد الأيام المتتالية الحالية.</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl p-4 glass" style={{ borderColor: "rgba(167,139,250,0.15)", background: "rgba(167,139,250,0.08)" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.24em] text-violet-200/70">نقاط البصيرة</p>
                <h3 className="mt-1 text-base font-bold text-white">الانتقال نحو المسافر الواعي</h3>
              </div>
              <div className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
                Level {insightLevel}
              </div>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <div className="flex h-18 w-18 items-center justify-center rounded-full border border-violet-300/20 bg-black/20 text-center px-3 py-3">
                <div>
                  <p className="text-lg font-black text-white">{insightPoints}</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Total</p>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">أنت الآن على بعد {100 - insightProgress} نقطة فقط من رتبة <span className="text-cyan-200">المسافر الواعي</span>.</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300"
                    style={{ width: `${Math.max(8, insightProgress)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-white/55">
                  <span>Level {insightLevel}</span>
                  <span>{insightProgress}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5"
              style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)", color: "rgba(45,212,191,0.95)" }}
            >
              <Share2 className="w-4 h-4" />
              شارك هذا الملخص
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white/75 transition-transform hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              رجوع للمنصة
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-white/45">
            {shareStatus === "shared"
              ? "تم تجهيز المشاركة"
              : shareStatus === "copied"
                ? "تم نسخ نص المشاركة"
                : "يمكنك مشاركة هذا الملخص أو نسخه بسرعة"}
          </p>
        </section>
      </div>
    </main>
  );
};
