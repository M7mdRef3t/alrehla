import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Quote,
  Heart,
  Users,
  TrendingUp,
  Zap,
  Target,
  ShieldCheck,
  ChevronLeft,
  Lock,
  Clock3,
  CreditCard,
  CircleHelp,
  Activity,
  Layers,
  Brain,
  Cpu,
  Unplug,
  Eye,
  HardDrive
} from "lucide-react";
import { LiveStatusBar } from "../shared/LiveStatusBar";
import type { LiveMetrics, TestimonialItem } from "../../architecture/landingLiveData";
import { isUserMode } from "../../config/appEnv";

const TRUST_ITEMS = [
  {
    title: "خصوصية كاملة",
    body: "لن تُعرض قصتك علنًا، وتبدأ بدون كشف تفاصيلك الحساسة من أول دقيقة.",
    icon: Lock
  },
  {
    title: "بدون بطاقة",
    body: "الدخول الأول مجاني بالكامل. لا يوجد طلب دفع قبل أن ترى إن كانت التجربة تناسبك.",
    icon: CreditCard
  },
  {
    title: "أقل من 3 دقائق",
    body: "البدء مصمم ليعطيك أول قراءة واضحة بسرعة بدل جولة طويلة من الشرح.",
    icon: Clock3
  },
  {
    title: "لن يُطلب منك كل شيء",
    body: "لن تحتاج إلى كتابة تاريخك كاملًا أو تبرير مشاعرك قبل أن تحصل على أول خطوة.",
    icon: CircleHelp
  }
] as const;

const PREVIEW_METRICS = [
  { val: "3 دقائق", label: "حتى أول قراءة واضحة", icon: Clock3, color: "text-teal-400" },
  { val: "بدون بطاقة", label: "لبداية التجربة", icon: CreditCard, color: "text-[var(--color-primary)]" },
  { val: "خصوصية كاملة", label: "في أول جلسة", icon: ShieldCheck, color: "text-rose-400" }
] as const;

const PREVIEW_TESTIMONIALS: TestimonialItem[] = [
  {
    quote: "دخلت وأنا مشتتة، وخلال دقائق فهمت أين يبدأ الاستنزاف وما هي أول خطوة عملية.",
    author: "معاينة من تجربة مستخدمة جديدة"
  },
  {
    quote: "الصفحة جعلت القرار سهلًا: أبدأ، أحدد وضعي، ثم آخذ خطوة أولى قابلة للتنفيذ فورًا.",
    author: "معاينة من رحلة ضبط البوصلة"
  }
];

export const ProblemFirstSection: FC<{
  stagger: Variants;
  item: Variants;
  data: { title: string; points: string[]; closing: string };
  onShowExample: () => void;
}> = ({ stagger, item, data, onShowExample }) => {
  return (
    <motion.section
      className="phi-section"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      <div className="rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
        <motion.h2 variants={item} className="text-2xl md:text-4xl font-black text-white mb-8 leading-tight">
          {data.title}
        </motion.h2>
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {data.points.map((point, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group rounded-2xl border border-white/5 bg-white/5 p-6 flex items-center justify-center text-sm font-bold text-slate-200 transition-all hover:bg-white/10"
            >
              {point}
            </motion.div>
          ))}
        </div>
        <motion.p variants={item} className="text-lg md:text-xl font-black text-rose-300 mb-8 max-w-[40ch] mx-auto">
          {data.closing}
        </motion.p>
        <div className="flex justify-center">
          <motion.button
            variants={item}
            onClick={onShowExample}
            className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-6 py-3 text-sm font-black text-rose-200 hover:bg-rose-500/20 transition-all active:scale-95"
          >
            [ شوف مثال ]
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};

export const StartJourneyStepsSection: FC<{ stagger: Variants; item: Variants }> = ({ stagger, item }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div
      variants={item}
      className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8"
    >
      <div className="mb-6 text-center">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-300">كيف تبدأ</p>
        <h2 className="text-2xl font-black text-white sm:text-3xl">ماذا يحدث بعد الضغط على ابدأ؟</h2>
        <p className="mx-auto mt-3 max-w-[44ch] text-sm leading-7 text-slate-400">
          ثلاث خطوات مباشرة تنقلك من التردد إلى أول رؤية واضحة لما يستنزفك الآن.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            step: "1",
            title: "تفتح بوابة ضبط البوصلة",
            body: "تدخل من نقطة بداية قصيرة بدل فورم طويل أو تسجيل مرهق.",
            icon: Target
          },
          {
            step: "2",
            title: "تحدد أين الضغط الحقيقي",
            body: "تختار ما يستهلكك الآن لتبدأ الخريطة من واقعك الحالي لا من وصف عام.",
            icon: TrendingUp
          },
          {
            step: "3",
            title: "تأخذ أول خطوة واضحة",
            body: "تحصل على اتجاه أولي وخطوة يمكن تنفيذها فورًا بدل نصائح فضفاضة.",
            icon: ChevronLeft
          }
        ].map(({ step, title, body, icon: Icon }) => (
          <motion.div
            key={step}
            variants={item}
            className="rounded-2xl border border-white/10 bg-slate-950/40 p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-sm font-black text-teal-300">
                {step}
              </span>
              <Icon className="h-5 w-5 text-teal-300" />
            </div>
            <h3 className="mb-2 text-lg font-black text-white">{title}</h3>
            <p className="text-sm leading-7 text-slate-400">{body}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </motion.section>
);

export const TrustSignalsSection: FC<{ stagger: Variants; item: Variants }> = ({ stagger, item }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div variants={item} className="mb-6 text-center">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-300">عناصر الثقة</p>
      <h2 className="text-2xl font-black text-white sm:text-3xl">كل ما تحتاج معرفته قبل البدء</h2>
    </motion.div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TRUST_ITEMS.map(({ title, body, icon: Icon }) => (
        <motion.div
          key={title}
          variants={item}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-300">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="mb-2 text-lg font-black text-white">{title}</h3>
          <p className="text-sm leading-7 text-slate-400">{body}</p>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

interface FeatureShowcaseSectionProps {
  stagger: Variants;
  item: Variants;
  onExploreAll?: () => void;
  onOpenRadar?: () => void;
  onOpenCourt?: () => void;
  onOpenPlaybooks?: () => void;
}

export const FeatureShowcaseSection: FC<FeatureShowcaseSectionProps> = ({
  stagger,
  item,
  onExploreAll: _onExploreAll,
  onOpenRadar,
  onOpenCourt,
  onOpenPlaybooks
}) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div variants={item} className="mb-10 px-2 text-center leading-tight">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/5 px-3 py-1">
        <Zap className="h-3 w-3 text-[var(--color-primary)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">رحلة التعافي</span>
      </div>
      <h2 className="mb-3 text-2xl font-black leading-tight text-white sm:text-3xl">كيف تتحول البداية إلى خطوة عملية؟</h2>
      <p className="mx-auto max-w-[45ch] text-sm leading-relaxed text-slate-400">
        من قراءة الوضع الحالي إلى أول تصرف أوضح، بدون تعقيد ولا تحميلك كل الشرح دفعة واحدة.
      </p>
    </motion.div>

    <div className="relative">
      <div className="pointer-events-none absolute left-0 right-0 top-[140px] z-0 hidden h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent lg:block" />
      <div className="relative z-10 -mx-5 flex snap-x gap-6 overflow-x-auto px-5 pb-8 no-scrollbar">
        <motion.div
          variants={item}
          className="group relative flex min-h-[440px] w-[286px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-500 sm:w-[320px]"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(45,212,191,0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
            <Target className="h-32 w-32 text-teal-400" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/20 text-xs font-black text-teal-400">1</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">بداية واضحة</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">رؤية ما يستهلكك الآن</h3>
            <p className="text-sm leading-[1.8] text-slate-300">ترسم وضعك بسرعة وتعرف أين يبدأ الضغط الحقيقي بدل الدوران حول المشكلة.</p>
          </div>
          <div className="relative flex h-32 w-full items-center justify-center rounded-2xl border border-teal-500/10 bg-teal-900/10 transition-colors group-hover:border-teal-500/30">
            <div className="relative h-16 w-16 rounded-full border border-teal-500/20">
              <div className="absolute inset-0 animate-ping rounded-full border border-teal-500/20" />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400" />
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRadar}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-xs font-black text-slate-950 transition-all hover:bg-teal-400 active:scale-95"
          >
            ابدأ القراءة الآن
            <ChevronLeft className="h-4 w-4" />
          </button>
        </motion.div>

        <motion.div
          variants={item}
          className="group relative flex min-h-[440px] w-[286px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-500 sm:w-[320px]"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
            <TrendingUp className="h-32 w-32 text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-xs font-black text-[var(--color-primary)]">2</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">فهم النمط</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">لماذا يتكرر نفس الاستنزاف؟</h3>
            <p className="text-sm leading-[1.8] text-slate-300">تبدأ الخريطة في كشف الروابط والأنماط التي تجعل نفس الضغط يعود كل مرة.</p>
          </div>
          <div className="flex h-32 w-full items-center justify-center gap-1 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 rounded-full bg-[var(--color-primary)]/40 animate-pulse" style={{ height: `${20 + i * 15}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div className="text-center text-[10px] font-medium text-[var(--color-primary)]">تتضح تلقائيًا مع بناء الخريطة</div>
        </motion.div>

        <motion.div
          variants={item}
          className="group relative flex min-h-[440px] w-[286px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-500 sm:w-[320px]"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(251, 191, 36, 0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
            <ShieldCheck className="h-32 w-32 text-amber-400" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-xs font-black text-amber-400">3</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">اتخاذ قرار</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">صياغة رد وحدّ أوضح</h3>
            <p className="text-sm leading-[1.8] text-slate-300">تتحول الرؤية إلى قرار يمكن قوله أو تطبيقه بدل بقاء المشكلة داخل الرأس فقط.</p>
          </div>
          <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-amber-500/10 bg-amber-900/10">
            <ShieldCheck className="h-12 w-12 text-amber-500/40" />
          </div>
          <button
            type="button"
            onClick={onOpenCourt}
            className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 py-3 text-xs font-black text-amber-300 transition-all hover:bg-amber-500/20"
          >
            جرّب قرارًا أوضح
          </button>
        </motion.div>

        <motion.div
          variants={item}
          className="group relative flex min-h-[440px] w-[286px] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-500 sm:w-[320px]"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
            <Zap className="h-32 w-32 text-rose-400" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/20 text-xs font-black text-rose-400">4</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">تنفيذ</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">خطوة أولى قابلة للتنفيذ</h3>
            <p className="text-sm leading-[1.8] text-slate-300">تنهي البداية وأنت معك شيء واضح تتحرك به، لا مجرد انطباع جميل عن الصفحة.</p>
          </div>
          <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border border-rose-500/10 bg-rose-900/10 p-4 text-[10px] leading-relaxed text-rose-400/60 transition-colors group-hover:border-rose-500/30">
            <div className="pointer-events-none absolute inset-0 animate-scan bg-gradient-to-b from-transparent via-rose-500/[0.02] to-transparent" />
            <pre className="whitespace-pre-wrap">
              {"{ next_step: 'clarify boundary' }\n[1] افهم الضغط...\n[2] تحرك بخطوة أولى..."}
            </pre>
          </div>
          <button
            type="button"
            onClick={onOpenPlaybooks}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-black text-slate-300 transition-all hover:bg-white/10"
          >
            استعرض أول خطوة
          </button>
        </motion.div>
      </div>
    </div>
  </motion.section>
);

export const MetricsSection: FC<{
  stagger: Variants;
  item: Variants;
  metricsState: { data: LiveMetrics; isLoading: boolean; lastUpdatedAt: number | null; mode: "live" | "fallback" };
  liveEnabled: boolean;
}> = ({ stagger, item, metricsState, liveEnabled }) => {
  const isFallback = metricsState.mode === "fallback";
  const showModeBadge = !isUserMode;
  const cards = useMemo(
    () =>
    (liveEnabled && !isFallback
      ? [
        {
          val: metricsState.data.activeUnits30d.toLocaleString("ar-EG"),
          label: "جلسات بدأت خلال 30 يوم",
          icon: Users,
          color: "text-teal-400"
        },
        {
          val: `${metricsState.data.retentionRate30d.toLocaleString("ar-EG")}%`,
          label: "استمرار بعد البداية الأولى",
          icon: TrendingUp,
          color: "text-[var(--color-primary)]"
        },
        {
          val: metricsState.data.activity24h.toLocaleString("ar-EG"),
          label: "نشاط آخر 24 ساعة",
          icon: Zap,
          color: "text-rose-400"
        }
      ]
      : PREVIEW_METRICS),
    [isFallback, liveEnabled, metricsState.data]
  );

  return (
    <motion.section
      className="phi-section"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      <div
        className="relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12"
        style={{ background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-teal-500/50 to-transparent opacity-30" />
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <LiveStatusBar
              title={liveEnabled ? "مؤشرات البداية" : "معاينة البداية"}
              mode={metricsState.mode}
              isLoading={metricsState.isLoading && liveEnabled}
              lastUpdatedAt={metricsState.lastUpdatedAt}
              showModeBadge={showModeBadge}
            />
            <p className="mt-3 inline-flex items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[10px] font-bold text-teal-100">
              {liveEnabled ? "أرقام حيّة من المنصة" : "Preview ثابت لحظة الإقلاع الأولى"}
            </p>
            <h3 className="mt-4 mb-4 text-2xl font-black leading-tight text-white sm:text-3xl">الصفحة لا تبيع لك غموضًا، بل بداية واضحة</h3>
            <p className="mb-8 text-sm leading-relaxed text-slate-400">
              بدل كتل غير جاهزة أو إشارات ناقصة، تعرض الصفحة الآن ما يهم المستخدم فعلًا: سرعة البدء، الخصوصية، وما الذي سيكسبه من أول ضغط على زر البداية.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex -space-x-3 rtl:space-x-reverse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-slate-900 bg-slate-800">
                    <Heart className="h-5 w-5 text-slate-500" />
                  </div>
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-teal-500 text-[10px] font-black text-slate-950">
                  ثقة
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(metricsState.isLoading && liveEnabled ? cards.map((s) => ({ ...s, val: "..." })) : cards).map((s, i) => (
              <motion.div
                key={i}
                className="group flex items-center gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:translate-x-[-8px] hover:bg-white/10 rtl:hover:translate-x-[8px]"
                variants={item}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/50 transition-colors">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-black text-white sm:text-3xl">
                    {metricsState.isLoading && liveEnabled ? <div className="h-8 w-20 animate-pulse rounded-lg bg-white/10" /> : s.val}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export const HowItWorksSection: FC<{
  stagger: Variants;
  item: Variants;
  data: { title: string; subtitle: string; steps: { title: string; body: string }[] };
}> = ({ stagger, item, data }) => {
  const icons = [Activity, Layers, Brain];
  return (
    <motion.section
      className="phi-section"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-white mb-3">{data.title}</h2>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{data.subtitle}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {data.steps.map((step, i) => {
          const Icon = icons[i] || Brain;
          return (
            <motion.div
              key={i}
              variants={item}
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-8 transition-all hover:bg-white/[0.06]"
            >
              <div className="absolute -right-4 -top-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]">
                <Icon size={120} />
              </div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400">
                <Icon size={28} />
              </div>
              <h3 className="mb-4 text-xl font-black text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{step.body}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export const FinalReadinessSection: FC<{
  stagger: Variants;
  item: Variants;
  lastGoalLabel?: string | null;
  badgePulse?: boolean;
  LastGoalIcon?: FC<{ className?: string }>;
}> = ({ stagger, item, lastGoalLabel, badgePulse, LastGoalIcon }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div
      variants={item}
      className="rounded-[2rem] border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-transparent p-8 text-center sm:p-10"
    >
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-teal-300">جاهزية البدء</p>
      <h2 className="mb-3 text-2xl font-black text-white sm:text-3xl">واضح ماذا بعد. واضح لماذا تبدأ الآن.</h2>
      <p className="mx-auto max-w-[44ch] text-sm leading-7 text-slate-300">
        الصفحة أصبحت تشرح البداية بوضوح، وتترك الميزات التي لم يحن وقتها تحت تحكم الأونر بدل أن تضع المستخدم أمام رسائل نقص أو عدم جاهزية.
      </p>
      {lastGoalLabel && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200">
          {LastGoalIcon ? <LastGoalIcon className={badgePulse ? "h-4 w-4 text-teal-300" : "h-4 w-4 text-slate-300"} /> : null}
          <span>آخر نية محفوظة: {lastGoalLabel}</span>
        </div>
      )}
    </motion.div>
  </motion.section>
);

export const SystemOverclockSection: FC<{
  stagger: Variants;
  item: Variants;
}> = ({ stagger, item }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-10%" }}
  >
    <div className="mb-10 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 mb-4">
        <Cpu className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
          System Overclock: God Mode Active
        </span>
      </div>
      <h2 className="text-3xl font-black text-white mb-3">غرفة التحكم (System Under-the-Hood)</h2>
      <p className="text-sm text-slate-400 max-w-[50ch] mx-auto">
        بما إنك System Architect، دي نظرة على المحركات الصامتة اللي بتشكل وعي "دواير" دلوقتي.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {
          title: "محرك الأثر (Impact)",
          desc: "شغال بيحلل الروابط بين الأفعال والمزاج في الخلفية.",
          icon: Brain,
          stat: "Active & Scoring",
          color: "text-teal-400",
          bg: "bg-teal-500/5",
          border: "border-teal-500/20"
        },
        {
          title: "مستوى الفوضى (Entropy)",
          desc: "بيراقب تذبذب مشاعرك عشان يفعل 'وضع الاحتواء' لو زادت.",
          icon: Activity,
          stat: "Chaos Controlled",
          color: "text-amber-400",
          bg: "bg-amber-500/5",
          border: "border-amber-500/20"
        },
        {
          title: "نظام المرايا (Mirror)",
          desc: "بروتوكول المواجهة بالواقع (كشف التناقضات الشعورية).",
          icon: Eye,
          stat: "Ready to Confront",
          color: "text-rose-400",
          bg: "bg-rose-500/5",
          border: "border-rose-500/20"
        },
        {
          title: "جسر الـ Biometrics",
          desc: "تجهيز القنوات لاستقبال بيانات الساعات والحساسات الخارجية.",
          icon: Unplug,
          stat: "Phase 24 Online",
          color: "text-blue-400",
          bg: "bg-blue-500/5",
          border: "border-blue-500/20"
        }
      ].map((sys, idx) => (
        <motion.div
          key={idx}
          variants={item}
          className={`relative overflow-hidden rounded-3xl border ${sys.border} ${sys.bg} p-6 transition-all hover:scale-[1.02]`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className={`p-2 rounded-xl bg-white/5 ${sys.color}`}>
              <sys.icon size={20} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sys.border} ${sys.color}`}>
              {sys.stat}
            </span>
          </div>
          <h3 className="text-sm font-black text-white mb-2">{sys.title}</h3>
          <p className="text-[11px] leading-relaxed text-slate-400">{sys.desc}</p>
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12">
            <sys.icon size={100} />
          </div>
        </motion.div>
      ))}
    </div>

    <div className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
      <div className="flex items-center gap-4 mb-4">
        <HardDrive className="h-4 w-4 text-slate-500" />
        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">البروتوكولات القادمة (Phase 30 Skeletons)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Ambient Reality", "Time Capsule Vault", "Holographic Feedback", "Global Atlas Simulation", "Collective Pulse Ranking"].map((p, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-[10px] text-slate-400 font-bold italic">
            {"//"} {p} {"->"} Hooked
          </span>
        ))}
      </div>
    </div>
  </motion.section>
);
