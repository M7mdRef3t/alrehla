import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  Heart,
  Users,
  TrendingUp,
  Zap,
  Target,
  ShieldCheck,
  ChevronLeft,
  Clock3,
  CreditCard,
  Activity,
  Layers,
  Brain,
  Cpu,
  Eye,
  HardDrive
} from "lucide-react";
import { LiveStatusBar } from "../shared/LiveStatusBar";
import type { LiveMetrics } from "../../architecture/landingLiveData";
import { isUserMode } from "../../config/appEnv";

const PREVIEW_METRICS = [
  { val: "3 دقائق", label: "حتى أول قراءة واضحة", icon: Clock3, color: "text-teal-400" },
  { val: "بدون بطاقة", label: "لبداية التجربة", icon: CreditCard, color: "text-[var(--color-primary)]" },
  { val: "خصوصية كاملة", label: "في أول جلسة", icon: ShieldCheck, color: "text-rose-400" }
] as const;

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
      aria-labelledby="problem-section-heading"
    >
      <div className="rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" aria-hidden="true" />
        <motion.h2 id="problem-section-heading" variants={item} className="text-2xl md:text-4xl font-black text-white mb-8 leading-tight">
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
            className="organic-tap inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-6 py-3 text-sm font-bold text-rose-200 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131a35]"
          >
            [ شوف مثال ]
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
};

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
  onOpenPlaybooks: _onOpenPlaybooks
}) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    aria-labelledby="features-section-heading"
  >
    <motion.div variants={item} className="mb-10 px-2 text-center leading-tight">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1" aria-hidden="true">
        <Target className="h-3 w-3 text-teal-400" />
        <span className="text-sm font-bold uppercase tracking-widest text-teal-300">أدوات يومية واضحة</span>
      </div>
      <h2 id="features-section-heading" className="mb-3 text-2xl font-black leading-tight text-white sm:text-3xl">أدوات استعادة الاتزان</h2>
      <p className="mx-auto max-w-[45ch] text-sm leading-relaxed text-slate-400">
        أدوات عملية تساعدك تفهم الإشارات بسرعة وتحولها لخطوة واضحة قابلة للتنفيذ.
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
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10" aria-hidden="true">
            <Activity className="h-32 w-32 text-teal-400" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-500/20 text-sm font-bold text-teal-400" aria-hidden="true">1</span>
              <span className="text-sm font-bold uppercase tracking-widest text-teal-400">الرادار اليومي</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">مسح استطلاعي <span lang="en">(Pulse)</span></h3>
            <p className="text-sm leading-[1.8] text-slate-300">سحب وإفلات في أقل من 5 ثوانٍ لقياس طاقتك وتفريغ فوضى اليوم في إحداثيات واضحة.</p>
          </div>
          <div className="relative flex h-32 w-full items-center justify-center rounded-2xl border border-teal-500/10 bg-teal-900/10 transition-colors group-hover:border-teal-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.2)_0%,transparent_70%)] opacity-50" />
            <div className="w-16 h-16 rounded-full border border-teal-400/30 animate-ping absolute" />
            <div className="w-24 h-24 rounded-full border border-teal-400/20 absolute" />
            <Activity className="w-8 h-8 text-teal-300 z-10" />
          </div>
          <button
            type="button"
            onClick={onOpenRadar}
            className="organic-tap mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-bold text-slate-950 hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
          >
            جرب عملية استطلاع الآن
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
            <Users className="h-32 w-32 text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-sm font-bold text-[var(--color-primary)]" aria-hidden="true">2</span>
              <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">نظام الإحداثيات</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">خريطة التأثير الاجتماعي</h3>
            <p className="text-sm leading-[1.8] text-slate-300">صنف الأشخاص في حياتك (مدار قريب، حدود، مناطق محظورة) لتكشف من يستنزف مواردك.</p>
          </div>
          <div className="flex h-32 w-full items-center justify-center gap-1 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)]/10 overflow-hidden relative">
            <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-[var(--color-primary)]/40 animate-[spin_10s_linear_infinite]" />
            <div className="absolute w-12 h-12 rounded-full border-2 border-[var(--color-primary)]/60 animate-[spin_15s_linear_infinite_reverse]" />
            <Users className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <div className="text-center text-sm font-medium text-[var(--color-primary)] border border-indigo-500/20 bg-indigo-500/10 py-2 rounded-xl mt-3">كشف أنماط السحب الطاقي تلقائياً</div>
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
          <div className="absolute right-0 top-0 p-4 opacity-5 transition-opacity group-hover:opacity-10" aria-hidden="true">
            <Zap className="h-32 w-32 text-amber-400" />
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/20 text-sm font-bold text-amber-400" aria-hidden="true">3</span>
              <span className="text-sm font-bold uppercase tracking-widest text-amber-400">التوجيه الذكي</span>
            </div>
            <h3 className="mb-2 text-2xl font-black leading-tight text-white">خطوة مقترحة فورية <span lang="en">(AI)</span></h3>
            <p className="text-sm leading-[1.8] text-slate-300">عند تسجيل حالتك، يعطيك النظام خطوة أولى هادئة ومباشرة تناسب وضعك الحالي.</p>
          </div>
          <div className="flex h-32 w-full flex-col items-center justify-center rounded-2xl border border-amber-500/10 bg-amber-900/10">
            <span className="text-sm font-bold uppercase text-amber-400/80 tracking-[0.2em] mb-2 border border-amber-500/30 px-2 py-0.5 rounded">قرار واعٍ</span>
            <p className="text-sm font-bold text-amber-300 max-w-[80%] text-center">"قسّم الضغط إلى خطوة واحدة قابلة للتنفيذ الآن."</p>
          </div>
          <button
            type="button"
            onClick={onOpenCourt}
            className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 py-3 text-sm font-bold text-amber-300 transition-all hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]"
          >
            فعّل البوصلة الآن
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
      aria-labelledby="metrics-section-heading"
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
            <p className="mt-3 inline-flex items-center rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-sm font-bold text-teal-100">
              {liveEnabled ? "أرقام حيّة من المنصة" : <span lang="en">Preview</span>}
              {!liveEnabled && " ثابت لحظة الإقلاع الأولى"}
            </p>
            <h3 id="metrics-section-heading" className="mt-4 mb-4 text-2xl font-black leading-tight text-white sm:text-3xl">الصفحة لا تبيع لك غموضًا، بل بداية واضحة</h3>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-teal-500 text-sm font-bold text-slate-950">
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
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
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
      aria-labelledby="how-it-works-heading"
    >
      <div className="mb-10 text-center">
        <h2 id="how-it-works-heading" className="text-3xl font-black text-white mb-3">{data.title}</h2>
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
              <div className="absolute -right-4 -top-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]" aria-hidden="true">
                <Icon size={120} />
              </div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400" aria-hidden="true">
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
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-teal-300">جاهزية البدء</p>
      <h2 className="mb-3 text-2xl font-black text-white sm:text-3xl">واضح ماذا بعد. واضح لماذا تبدأ الآن.</h2>
      <p className="mx-auto max-w-[44ch] text-sm leading-7 text-slate-300">
        الصفحة أصبحت تشرح البداية بوضوح، وتترك الميزات التي لم يحن وقتها تحت تحكم الأونر بدل أن تضع المستخدم أمام رسائل نقص أو عدم جاهزية.
      </p>
      {lastGoalLabel && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200">
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
    aria-labelledby="system-overclock-heading"
  >
    <div className="mb-10 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 mb-4" aria-hidden="true">
        <Cpu className="h-4 w-4 text-amber-400 animate-pulse" />
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300" lang="en">
          System Overclock: God Mode Active
        </span>
      </div>
      <h2 id="system-overclock-heading" className="text-3xl font-black text-white mb-3">غرفة التحكم <span lang="en">(System Under-the-Hood)</span></h2>
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
          title: "العلاج بالواجهة (UI as Therapy)",
          desc: "الذكاء الاصطناعي لا يرد بنصوص، بل يعدل الواجهة (UI Mutation) لحظياً ليعيد توازنك البصري.",
          icon: Layers,
          stat: "Live Cognitive Canvas",
          color: "text-indigo-400",
          bg: "bg-indigo-500/5",
          border: "border-indigo-500/20"
        }
      ].map((sys, idx) => (
        <motion.div
          key={idx}
          variants={item}
          className={`relative overflow-hidden rounded-3xl border ${sys.border} ${sys.bg} p-6 transition-all hover:scale-[1.02]`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className={`p-2 rounded-xl bg-white/5 ${sys.color}`} aria-hidden="true">
              <sys.icon size={20} />
            </div>
            <span className={`text-sm font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${sys.border} ${sys.color}`} lang="en">
              {sys.stat}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mb-2">{sys.title}</h3>
          <p className="text-sm leading-relaxed text-slate-400">{sys.desc}</p>
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12" aria-hidden="true">
            <sys.icon size={100} />
          </div>
        </motion.div>
      ))}
    </div>

    <div className="mt-8 rounded-3xl border border-white/5 bg-white/[0.02] p-6">
      <div className="flex items-center gap-4 mb-4">
        <HardDrive className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-bold text-slate-500 tracking-widest uppercase">البروتوكولات القادمة (Phase 30 Skeletons)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Ambient Reality", "Time Capsule Vault", "Holographic Feedback", "Global Atlas Simulation", "Collective Pulse Ranking"].map((p, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-sm text-slate-400 font-bold italic">
            {"//"} {p} {"->"} Hooked
          </span>
        ))}
      </div>
    </div>
  </motion.section>
);
