import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Quote, Heart, Users, TrendingUp, Zap, Target, ShieldCheck } from "lucide-react";
import { LiveStatusBar } from "../shared/LiveStatusBar";
import type { LiveMetrics, TestimonialItem } from "../../architecture/landingLiveData";

const CARD = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1.25rem",
} as const;

type TestimonialsItem = { quote: string; author: string };

export const QuickPrioritySection: FC<{ stagger: Variants; item: Variants }> = ({ stagger, item }) => (
  <motion.section
    className="py-8 sm:py-10"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div variants={item} className="rounded-2xl border border-teal-500/20 bg-slate-900/45 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm sm:text-base font-bold text-white">ابدأ من هنا</h3>
        <span className="text-[10px] text-teal-300">أولوية التنفيذ</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {["1) حدّد هدف واحد", "2) نفّذ خطوة عملية", "3) راقب المؤشرات الحية"].map((step) => (
          <div key={step} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200">
            {step}
          </div>
        ))}
      </div>
    </motion.div>
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
  onExploreAll,
  onOpenRadar,
  onOpenCourt,
  onOpenPlaybooks
}) => (
  <motion.section
    className="py-12 sm:py-16"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div variants={item} className="flex items-center justify-between mb-6 px-2">
      <h2 className="text-xl sm:text-2xl font-bold">أهم مميزات المنصة</h2>
      <button
        type="button"
        onClick={onExploreAll}
        className="text-teal-400 text-sm font-medium hover:text-teal-300 transition-colors"
      >
        استكشف الكل
      </button>
    </motion.div>

    <div className="flex gap-4 overflow-x-auto pb-8 -mx-5 px-5 snap-x">
      <motion.div
        variants={item}
        className="snap-center shrink-0 w-[280px] sm:w-[320px] h-[400px] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, rgba(20, 184, 166, 0.1), rgba(15, 23, 42, 0.6))", border: "1px solid rgba(45,212,191,0.2)" }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Target className="w-24 h-24 text-teal-400" />
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wider text-teal-400 uppercase mb-2 block">رصد</span>
          <h3 className="text-2xl font-bold text-white mb-2">نظام الرادار</h3>
          <p className="text-sm text-slate-300">ارسم خريطة علاقاتك وحدد مصادر الاستنزاف بسرعة.</p>
        </div>
        <div className="w-full h-32 bg-teal-900/30 rounded-xl border border-teal-500/20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-teal-500/40 relative">
            <div className="absolute inset-0 border border-teal-500/20 rounded-full animate-ping" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-teal-400 rounded-full" />
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenRadar}
          className="mt-3 w-full rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-200 py-2 text-xs font-bold hover:bg-teal-500/30 transition-colors"
        >
          افتح نظام الرادار
        </button>
      </motion.div>

      <motion.div
        variants={item}
        className="snap-center shrink-0 w-[280px] sm:w-[320px] h-[400px] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.6))", border: "1px solid rgba(251,191,36,0.2)" }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <ShieldCheck className="w-24 h-24 text-amber-400" />
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase mb-2 block">حماية</span>
          <h3 className="text-2xl font-bold text-white mb-2">محكمة الذنب</h3>
          <p className="text-sm text-slate-300">اتخطى ذنب قول "لا" بمنطق دفاعي واضح وسهل التنفيذ.</p>
        </div>
        <div className="w-full h-32 bg-amber-900/20 rounded-xl border border-amber-500/20 flex items-center justify-center gap-4">
          <ShieldCheck className="w-12 h-12 text-amber-500" />
        </div>
        <button
          type="button"
          onClick={onOpenCourt}
          className="mt-3 w-full rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 py-2 text-xs font-bold hover:bg-amber-500/30 transition-colors"
        >
          افتح محكمة الذنب
        </button>
      </motion.div>

      <motion.div
        variants={item}
        className="snap-center shrink-0 w-[280px] sm:w-[320px] h-[400px] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, rgba(239, 68, 68, 0.1), rgba(15, 23, 42, 0.6))", border: "1px solid rgba(248,113,113,0.2)" }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Zap className="w-24 h-24 text-rose-400" />
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-wider text-rose-400 uppercase mb-2 block">تنفيذ</span>
          <h3 className="text-2xl font-bold text-white mb-2">كتيبات تكتيكية</h3>
          <p className="text-sm text-slate-300">خطط خطوة بخطوة للتعامل مع السيناريوهات المعقدة بثبات.</p>
        </div>
        <div className="w-full h-32 bg-rose-900/20 rounded-xl border border-rose-500/20 flex items-center justify-center">
          <div className="text-rose-400 font-mono text-xs p-2">[بروتوكول: فك الارتباط]<br />{">"} تنفيذ...</div>
        </div>
        <button
          type="button"
          onClick={onOpenPlaybooks}
          className="mt-3 w-full rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 py-2 text-xs font-bold hover:bg-rose-500/30 transition-colors"
        >
          افتح الكتيبات الآن
        </button>
      </motion.div>
    </div>
  </motion.section>
);

export const MetricsSection: FC<{ stagger: Variants; item: Variants; metricsState: { data: LiveMetrics; isLoading: boolean; lastUpdatedAt: number | null; mode: "live" | "fallback" } }> = ({ stagger, item, metricsState }) => {

  const cards = useMemo(() => ([
    { val: metricsState.data.activeUnits30d.toLocaleString("ar-EG"), label: "وحدة نشطة (30 يوم)", icon: Users },
    { val: `${metricsState.data.retentionRate30d.toLocaleString("ar-EG")}%`, label: "معدل الاستمرار", icon: TrendingUp },
    { val: metricsState.data.activity24h.toLocaleString("ar-EG"), label: "نشاط آخر 24 ساعة", icon: Zap }
  ]), [metricsState.data]);

  return (
    <motion.section
      className="py-10 sm:py-14"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <LiveStatusBar title="مؤشرات مباشرة من النظام" mode={metricsState.mode} isLoading={metricsState.isLoading} lastUpdatedAt={metricsState.lastUpdatedAt} />
      <div className="rounded-2xl p-6 sm:p-8 grid grid-cols-3 divide-x divide-white/[0.06] bg-slate-900/50 backdrop-blur-md border border-slate-700/50">
        {(metricsState.isLoading ? cards.map((s) => ({ ...s, val: "..." })) : cards).map((s, i) => (
          <motion.div key={i} className="flex flex-col items-center text-center px-2" variants={item}>
            <s.icon className="w-5 h-5 mb-2 text-slate-400" />
            <div className={`text-xl sm:text-2xl font-bold mb-1 text-white ${metricsState.isLoading ? "animate-pulse" : ""}`}>{s.val}</div>
            <p className="text-[11px] sm:text-[12px] tracking-wider font-semibold text-slate-500">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export const TestimonialsSection: FC<{ stagger: Variants; item: Variants; testimonials: TestimonialsItem[]; testimonialsState: { data: TestimonialItem[]; isLoading: boolean; lastUpdatedAt: number | null; mode: "live" | "fallback" } }> = ({ stagger, item, testimonials, testimonialsState }) => {
  const displayTestimonials = testimonialsState.data.length > 0 ? testimonialsState.data : testimonials;
  const isLive = testimonialsState.mode === "live";
  if (!displayTestimonials?.length) return null;
  return (
    <motion.section
      className="py-10 sm:py-14"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.p
        className="text-[13px] font-semibold tracking-wide text-center mb-2"
        style={{ color: "rgba(148,163,184,0.5)", letterSpacing: "0.05em" }}
        variants={item}
      >
        تجارب حقيقية
      </motion.p>
      <motion.h2 className="text-xl sm:text-2xl font-bold text-center mb-8" variants={item}>قالوا عن تجربتهم</motion.h2>
      <LiveStatusBar
        title="مصدر المراجعات"
        mode={isLive ? "live" : "fallback"}
        isLoading={testimonialsState.isLoading}
        lastUpdatedAt={testimonialsState.lastUpdatedAt}
      />

      <div className="space-y-4">
        {displayTestimonials.map((t, i) => (
          <motion.div key={i} className="rounded-2xl p-5 sm:p-6" style={CARD} variants={item}>
            <Quote className="w-5 h-5 mb-3" style={{ color: i === 0 ? "rgba(45,212,191,0.35)" : "rgba(251,191,36,0.35)" }} />
            <p className="text-[14px] sm:text-[15px] leading-[1.8] mb-4" style={{ color: "rgba(203,213,225,0.85)" }}>
              "{t.quote}"
            </p>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: i === 0 ? "rgba(45,212,191,0.12)" : "rgba(251,191,36,0.12)",
                  border: `1px solid ${i === 0 ? "rgba(45,212,191,0.25)" : "rgba(251,191,36,0.25)"}`
                }}
              >
                <Heart className="w-3 h-3" style={{ color: i === 0 ? "#2dd4bf" : "#fbbf24" }} />
              </div>
              <span className="text-[13px] font-medium" style={{ color: "rgba(148,163,184,0.6)" }}>{t.author}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export const FinalReadinessSection: FC<{ stagger: Variants; item: Variants; lastGoalLabel?: string | null; badgePulse?: boolean; LastGoalIcon?: FC<{ className?: string }> }> = ({
  stagger,
  item,
  lastGoalLabel,
  badgePulse,
  LastGoalIcon,
}) => (
  <motion.section
    className="py-16 sm:py-20 flex flex-col items-center text-center"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.h2 className="text-xl sm:text-2xl font-bold mb-3" variants={item}>جاهز لاستلام القيادة؟</motion.h2>
    <motion.p
      className="text-[14px] sm:text-[15px] mb-2 max-w-sm mx-auto"
      style={{ color: "rgba(148,163,184,0.75)", lineHeight: 1.75 }}
      variants={item}
    >
      الميدان في انتظار أوامرك... ابدأ المناورة من الزر الرئيسي بالأعلى.
    </motion.p>

    {lastGoalLabel && (
      <motion.div className="mt-6" variants={item}>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium ${badgePulse ? "animate-bounce" : ""}`}
          style={{
            background: "rgba(45,212,191,0.08)",
            border: "1px solid rgba(45,212,191,0.2)",
            color: "#2dd4bf"
          }}
        >
          {LastGoalIcon ? <LastGoalIcon className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
          آخر هدف: {lastGoalLabel}
        </span>
      </motion.div>
    )}
  </motion.section>
);
