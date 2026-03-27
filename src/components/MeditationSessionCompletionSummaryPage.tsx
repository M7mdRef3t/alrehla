import { useMemo, useState, type FC } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, RotateCcw, TimerReset, ChevronRight, BookOpen, MoonStar, Share2 } from "lucide-react";

type CompletionTone = "focus" | "recovery" | "sleep";
type RecommendationAction = "meditation" | "resources";

interface CompletionSnapshot {
  sessionTitle: string;
  sessionTone: CompletionTone;
  elapsedSeconds: number;
  smartTimerEnabled: boolean;
  smartTimerMinutes: number;
  wakeFadeMinutes: number;
}

interface RecommendationItem {
  title: string;
  description: string;
  icon: typeof MoonStar;
  action: RecommendationAction;
}

const SHARE_TITLE = "ملخص رحلتي مع Dawayir";

const STORAGE_KEY = "dawayir-meditation-completion-summary";

function readSnapshot(): CompletionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CompletionSnapshot>;
    if (!parsed.sessionTitle || !parsed.sessionTone) return null;
    return {
      sessionTitle: parsed.sessionTitle,
      sessionTone: parsed.sessionTone,
      elapsedSeconds: Math.max(0, Math.floor(parsed.elapsedSeconds ?? 0)),
      smartTimerEnabled: Boolean(parsed.smartTimerEnabled),
      smartTimerMinutes: Math.max(1, Math.floor(parsed.smartTimerMinutes ?? 30)),
      wakeFadeMinutes: Math.max(0, Math.floor(parsed.wakeFadeMinutes ?? 3))
    };
  } catch {
    return null;
  }
}

function toneLabel(tone: CompletionTone) {
  if (tone === "focus") return "تركيز";
  if (tone === "recovery") return "استرجاع";
  return "نوم";
}

function buildRecommendations(tone: CompletionTone): RecommendationItem[] {
  if (tone === "sleep") {
    return [
      {
        title: "استكمال النوم الهادئ",
        description: "جلسة أبطأ قليلاً لو كنت تريد تهدئة أعمق قبل النوم.",
        icon: MoonStar,
        action: "meditation"
      },
      {
        title: "مقالة عن تصفية الذهن",
        description: "اقرأ شيئًا قصيرًا قبل الإغلاق حتى تثبّت حالة الهدوء.",
        icon: BookOpen,
        action: "resources"
      }
    ];
  }

  if (tone === "recovery") {
    return [
      {
        title: "تعميق الهدوء",
        description: "جلسة قصيرة لاستكمال تنظيم الإيقاع بعد يوم مضغوط.",
        icon: MoonStar,
        action: "meditation"
      },
      {
        title: "مقالة عن الحفاظ على السلام الداخلي",
        description: "خطوات بسيطة لتثبيت الحالة بدل العودة السريعة للضوضاء.",
        icon: BookOpen,
        action: "resources"
      }
    ];
  }

  return [
    {
      title: "جلسة تركيز إضافية",
      description: "لو حابب تكمل الزخم، اختر جلسة أقصر لزيادة الصفاء.",
      icon: MoonStar,
      action: "meditation"
    },
    {
      title: "مقالة عن الحفاظ على الإيقاع",
      description: "مراجعة سريعة تساعدك تحافظ على هذا الوضوح بقية اليوم.",
      icon: BookOpen,
      action: "resources"
    }
  ];
}

interface MeditationSessionCompletionSummaryPageProps {
  onBack: () => void;
  onBackToTools: () => void;
  onStartMeditation: () => void;
  onOpenResources: () => void;
}

export const MeditationSessionCompletionSummaryPage: FC<MeditationSessionCompletionSummaryPageProps> = ({
  onBack,
  onBackToTools,
  onStartMeditation,
  onOpenResources
}) => {
  const snapshot = useMemo(() => readSnapshot(), []);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");
  const minutes = Math.max(1, Math.round((snapshot?.elapsedSeconds ?? 0) / 60));
  const insightPoints = Math.max(15, minutes * 5 + (snapshot?.sessionTone === "focus" ? 10 : snapshot?.sessionTone === "recovery" ? 15 : 20));
  const insightLevel = Math.max(1, Math.floor(insightPoints / 100) + 1);
  const insightProgress = insightPoints % 100;
  const recommendations = useMemo(() => buildRecommendations(snapshot?.sessionTone ?? "focus"), [snapshot?.sessionTone]);
  const shareText = snapshot
    ? `أكملت جلسة "${snapshot.sessionTitle}" لمدة ${minutes} دقيقة على Dawayir.\n\nهذا الإنجاز يعكس التزامًا حقيقيًا بلحظة هدوء وتركيز.`
    : "أكملت جلسة تأمل على Dawayir.\n\nهذا الإنجاز يعكس التزامًا حقيقيًا بلحظة هدوء وتركيز.";

  const handleShareAchievement = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: SHARE_TITLE,
          text: shareText
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

  return (
    <motion.main
      className="min-h-screen px-4 py-6 md:py-10"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: "linear-gradient(180deg, var(--space-void) 0%, var(--space-deep) 55%, var(--space-950) 100%)" }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="glass-button inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </button>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Session Completion Summary</p>
            <h1 className="text-xl font-black text-white sm:text-2xl md:text-3xl">ملخص إكمال الجلسة</h1>
          </div>
        </div>

        <section className="glass-heavy rounded-[2rem] p-5 md:p-7">
          <div className="text-right">
            <p className="text-sm font-semibold text-cyan-300">انتهت الجلسة بنجاح</p>
            <h2 className="mt-2 text-2xl font-black text-white">{snapshot?.sessionTitle ?? "جلسة تأمل"}</h2>
            <p className="mt-2 text-sm leading-7 text-white/65">
              هذا ملخص مستقل للجلسة المنتهية حتى تعود إليه لاحقًا أو تشاركه كمؤشر على التزامك.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="المدة" value={`${minutes} دقيقة`} />
            <SummaryStat label="النغمة" value={toneLabel(snapshot?.sessionTone ?? "focus")} />
            <SummaryStat label="Smart Timer" value={snapshot?.smartTimerEnabled ? `${snapshot.smartTimerMinutes} دقيقة` : "موقف"} />
            <SummaryStat label="Gentle Wake" value={snapshot?.wakeFadeMinutes ? `${snapshot.wakeFadeMinutes} دقائق` : "موقف"} />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-cyan-400/15 bg-cyan-400/8 p-4 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">الملخص</p>
            <p className="mt-2 text-sm leading-7 text-white/75">
              استمر الإيقاع الهادئ حتى النهاية، وتم إغلاق الجلسة بتدرج مناسب بدون قطع مفاجئ.
            </p>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/4 p-4 text-right">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Mood Shift</p>
                <h3 className="mt-1 text-base font-bold text-white">من القلق إلى الهدوء</h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                <Sparkles className="w-3.5 h-3.5" />
                Calm
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55">😟</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/12 text-cyan-100">🙂</div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/55">
              <span>القلق</span>
              <span>الهدوء</span>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-violet-400/15 bg-violet-400/8 p-4 text-right">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-violet-200/70">نقاط البصيرة</p>
                <h3 className="mt-1 text-base font-bold text-white">الانتقال نحو المسافر الواعي</h3>
              </div>
              <div className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold text-violet-100">
                Level {insightLevel}
              </div>
            </div>
            <div className="mt-4 flex items-end gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-violet-300/20 bg-black/20 text-center">
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

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-white">التوصيات التالية</h3>
              <span className="text-xs text-white/45">استمر بدون عناء</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendations.map((item) => {
                const Icon = item.icon;
                const handleClick = item.action === "meditation" ? onStartMeditation : onOpenResources;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={handleClick}
                    className="group rounded-[1.5rem] border border-white/10 bg-white/4 p-4 text-right transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          <ChevronRight className="w-4 h-4 text-white/35 transition-transform group-hover:-translate-x-0.5" />
                        </div>
                        <p className="mt-1 text-xs leading-6 text-white/60">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBackToTools}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <TimerReset className="w-4 h-4" />
              العودة للأدوات
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #38bdf8, #14b8a6)" }}
            >
              <RotateCcw className="w-4 h-4" />
              إعادة فتح المشغل
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareAchievement}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <Share2 className="w-4 h-4" />
            شارك هذا الملخص
          </button>
          <p className="mt-2 text-center text-xs text-white/45">
            {shareStatus === "shared"
              ? "تم تجهيز المشاركة"
              : shareStatus === "copied"
                ? "تم نسخ نص المشاركة"
                : "يمكنك مشاركة هذا الملخص أو نسخه بسرعة"}
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/45">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            {snapshot ? "تمت قراءة آخر ملخص محفوظ من المشغل" : "لا يوجد ملخص محفوظ حاليًا"}
          </div>
        </section>
      </div>
    </motion.main>
  );
};

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-3 text-right">
      <p className="text-[11px] text-white/50">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
