import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Quote, Heart, Users, TrendingUp, Zap, Target, ShieldCheck, ChevronLeft, Activity } from "lucide-react";
import { LiveStatusBar } from "../shared/LiveStatusBar";
import type { LiveMetrics, TestimonialItem } from "../../architecture/landingLiveData";
import { isUserMode } from "../../config/appEnv";

const CARD = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1.25rem",
} as const;

type TestimonialsItem = { quote: string; author: string };

export const QuickPrioritySection: FC<{ stagger: Variants; item: Variants }> = ({ stagger, item }) => (
  <motion.section
    className="phi-section"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <motion.div variants={item} className="phi-card rounded-2xl border border-teal-500/20 bg-slate-900/45 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/[0.03] to-teal-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          مركز البدء التكتيكي
        </h3>
        <span className="text-[10px] text-teal-300 font-black tracking-widest uppercase font-mono">STATUS: READY</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 relative z-10">
        {[
          { step: "01", text: "حدّد إحداثيات الهدف", color: "text-teal-400" },
          { step: "02", text: "نفّذ مناورة ميدانية", color: "text-[var(--color-primary)]" },
          { step: "03", text: "مراقبة الرادار الحي", color: "text-purple-400" }
        ].map((s) => (
          <div key={s.step} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3 group/item hover:bg-white/10 transition-colors hover:border-teal-500/30">
            <span className={`text-xs font-black ${s.color} opacity-40 group-hover/item:opacity-100 transition-opacity font-mono`}>{s.step}</span>
            <span className="text-xs font-semibold text-slate-200">{s.text}</span>
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
    <motion.div variants={item} className="text-center mb-10 px-2 leading-tight">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/5 mb-3">
        <Zap className="w-3 h-3 text-[var(--color-primary)]" />
        <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">خوارزمية التعافي</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">رحلة الـ 4 خطوات لتأمين حدودك</h2>
      <p className="text-slate-400 text-sm max-w-[45ch] mx-auto leading-relaxed">من الرصد الأولي حتى التنفيذ الميداني.. رحلة متكاملة لاستعادة السيطرة.</p>
    </motion.div>

    <div className="relative">
      {/* Connection Line Desktop */}
      <div className="hidden lg:block absolute top-[140px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent z-0" />

      <div className="flex gap-6 overflow-x-auto pb-8 -mx-5 px-5 snap-x no-scrollbar relative z-10">
        {/* Step 1: Radar */}
        <motion.div
          variants={item}
          className="snap-center shrink-0 w-[286px] sm:w-[320px] min-h-[440px] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-500"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(45,212,191,0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target className="w-32 h-32 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-black border border-teal-500/30">1</span>
              <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase">الرصد الأول</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 leading-tight">نظام الرادار</h3>
            <p className="text-sm text-slate-300 leading-[1.8]">ارسم خريطة علاقاتك وحدد مصادر الاستنزاف بسرعة البرق.</p>
          </div>
          <div className="w-full h-32 bg-teal-900/10 rounded-2xl border border-teal-500/10 flex items-center justify-center relative group-hover:border-teal-500/30 transition-colors">
            <div className="w-16 h-16 rounded-full border border-teal-500/20 relative">
              <div className="absolute inset-0 border border-teal-500/20 rounded-full animate-ping" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-teal-400 rounded-full" />
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRadar}
            className="mt-3 w-full rounded-xl bg-teal-500 text-slate-950 py-3 text-xs font-black hover:bg-teal-400 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            تفعيل الرادار الآن
            <ChevronLeft className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Step 2: Analysis (Oracle) */}
        <motion.div
          variants={item}
          className="snap-center shrink-0 w-[286px] sm:w-[320px] min-h-[440px] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-500"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(139, 92, 246, 0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-32 h-32 text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] text-xs font-black border border-[var(--color-primary)]">2</span>
              <span className="text-[10px] font-bold tracking-widest text-[var(--color-primary)] uppercase">تحليل الثغرات</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 leading-tight">أوراكل السيادة</h3>
            <p className="text-sm text-slate-300 leading-[1.8]">حلل الروابط النفسية واكتشف لماذا يتم اختراق حدودك دائماً.</p>
          </div>
          <div className="w-full h-32 bg-[var(--color-primary)]/10 rounded-2xl border border-[var(--color-primary)] flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1.5 bg-[var(--color-primary)]/40 rounded-full animate-pulse" style={{ height: `${20 + (i * 15)}%`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <div className="text-[10px] text-center text-[var(--color-primary)] font-medium">سيتم التفعيل تلقائياً عند بناء الخريطة</div>
        </motion.div>

        {/* Step 3: Action (Court) */}
        <motion.div
          variants={item}
          className="snap-center shrink-0 w-[286px] sm:w-[320px] min-h-[440px] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-500"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(251, 191, 36, 0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-32 h-32 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-black border border-amber-500/30">3</span>
              <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">حسم القرار</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 leading-tight">محكمة الإحداثيات</h3>
            <p className="text-sm text-slate-300 leading-[1.8]">تخطى ذنب قول "لا" بمنطق دفاعي صلب ومقنع لذاتك أولاً.</p>
          </div>
          <div className="w-full h-32 bg-amber-900/10 rounded-2xl border border-amber-500/10 flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-amber-500/40" />
          </div>
          <button
            type="button"
            onClick={onOpenCourt}
            className="mt-3 w-full rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 py-3 text-xs font-black hover:bg-amber-500/20 transition-all"
          >
            محاكمة علاقة حالياً
          </button>
        </motion.div>

        {/* Step 4: Execution (Playbooks) */}
        <motion.div
          variants={item}
          className="snap-center shrink-0 w-[286px] sm:w-[320px] min-h-[440px] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-500"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(244, 63, 94, 0.2)",
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.5)"
          }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="w-32 h-32 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-black border border-rose-500/30">4</span>
              <span className="text-[10px] font-bold tracking-widest text-rose-400 uppercase font-mono">EXECUTION_CORE</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 leading-tight">كتيبات المناورة</h3>
            <p className="text-sm text-slate-300 leading-[1.8]">نصوص جاهزة وخطط تكتيكية للتعامل مع السيناريوهات المعقدة.</p>
          </div>
          <div className="w-full h-32 bg-rose-900/10 rounded-2xl border border-rose-500/10 flex items-center justify-center font-mono text-[10px] text-rose-400/60 p-4 leading-relaxed overflow-hidden relative group-hover:border-rose-500/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/[0.02] to-transparent animate-scan pointer-events-none" />
            <pre className="whitespace-pre-wrap">
              {"{ protocol: 'DETACHMENT' }\n[1] Analyze tone...\n[2] Execute bounceback..."}
            </pre>
          </div>
          <button
            type="button"
            onClick={onOpenPlaybooks}
            className="mt-3 w-full rounded-xl bg-white/5 border border-white/10 text-slate-300 py-3 text-xs font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            استعراض التكتيكات
          </button>
        </motion.div>
      </div>
    </div>
  </motion.section>
);

export const MetricsSection: FC<{ stagger: Variants; item: Variants; metricsState: { data: LiveMetrics; isLoading: boolean; lastUpdatedAt: number | null; mode: "live" | "fallback" } }> = ({ stagger, item, metricsState }) => {
  const isFallback = metricsState.mode === "fallback";
  const showModeBadge = !isUserMode;
  const showFallbackHint = isFallback;

  const cards = useMemo(() => ([
    { val: isFallback ? "غير متاح" : metricsState.data.activeUnits30d.toLocaleString("ar-EG"), label: "وحدات ميدانية نشطة", icon: Users, color: "text-teal-400" },
    { val: isFallback ? "غير متاح" : `${metricsState.data.retentionRate30d.toLocaleString("ar-EG")}%`, label: "ثبات قتالي استراتيجي", icon: TrendingUp, color: "text-[var(--color-primary)]" },
    { val: isFallback ? "غير متاح" : metricsState.data.activity24h.toLocaleString("ar-EG"), label: "نشاط الميدان (24 ساعة)", icon: Zap, color: "text-rose-400" }
  ]), [isFallback, metricsState.data]);

  return (
    <motion.section
      className="phi-section"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      <div className="rounded-[2.5rem] p-8 sm:p-12 overflow-hidden relative"
        style={{ background: "rgba(15, 23, 42, 0.4)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent opacity-30" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <LiveStatusBar
              title="مؤشرات النظام الحية"
              mode={metricsState.mode}
              isLoading={metricsState.isLoading}
              lastUpdatedAt={metricsState.lastUpdatedAt}
              showModeBadge={showModeBadge}
            />
            {showFallbackHint && (
              <p className="mt-2 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-200">
                البيانات اللحظية غير متاحة حالياً
              </p>
            )}
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-4 mb-4 leading-tight">مجتمع من القادة يستعيدون سيادتهم</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">نحن لا نبني مجرد تطبيق، بل غرفة عمليات عالمية لإدارة الوعي وحماية الطاقة النفسية.</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex -space-x-3 rtl:space-x-reverse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-teal-500 flex items-center justify-center text-[10px] font-black text-slate-950">١٠</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(metricsState.isLoading ? cards.map((s) => ({ ...s, val: "..." })) : cards).map((s, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all hover:translate-x-[-8px] rtl:hover:translate-x-[8px]"
                variants={item}
              >
                <div className={`w-14 h-14 rounded-2xl bg-slate-900/50 flex items-center justify-center border border-white/10 group-hover:border-${s.color.split('-')[1]}-500/30 transition-colors`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <div className={`text-2xl sm:text-3xl font-black text-white ${metricsState.isLoading ? "" : ""}`}>
                    {metricsState.isLoading ? (
                      <div className="h-8 w-20 bg-white/10 rounded-lg animate-pulse" />
                    ) : (
                      s.val
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export const TestimonialsSection: FC<{ stagger: Variants; item: Variants; testimonials: TestimonialsItem[]; testimonialsState: { data: TestimonialItem[]; isLoading: boolean; lastUpdatedAt: number | null; mode: "live" | "fallback" } }> = ({ stagger, item, testimonials: _testimonials, testimonialsState }) => {
  const displayTestimonials = testimonialsState.data;
  const isLive = testimonialsState.mode === "live";
  const isFallback = testimonialsState.mode === "fallback";
  const showModeBadge = !isUserMode;
  const showFallbackHint = isFallback;

  if (!displayTestimonials?.length) {
    return (
      <motion.section className="phi-section" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
        <motion.div variants={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <LiveStatusBar
            title="مصدر المراجعات"
            mode={isLive ? "live" : "fallback"}
            isLoading={testimonialsState.isLoading}
            lastUpdatedAt={testimonialsState.lastUpdatedAt}
            showModeBadge={showModeBadge}
          />
          <p className="mt-3 text-sm text-slate-400">المراجعات اللحظية غير متاحة حالياً.</p>
        </motion.div>
      </motion.section>
    );
  }

  return (
    <motion.section
      className="phi-section"
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.p
        className="text-[13px] font-bold tracking-[0.2em] text-center mb-2 leading-relaxed uppercase text-teal-400"
        variants={item}
      >
        سجلات انتصار القادة
      </motion.p>
      <motion.h2 className="text-2xl sm:text-3xl font-black text-center mb-8 leading-tight text-white" variants={item}>تقارير قادة الميدان</motion.h2>

      <div className="mb-8">
        <LiveStatusBar
          title="مصدر المراجعات"
          mode={isLive ? "live" : "fallback"}
          isLoading={testimonialsState.isLoading}
          lastUpdatedAt={testimonialsState.lastUpdatedAt}
          showModeBadge={showModeBadge}
        />
        {showFallbackHint && (
          <p className="mt-2 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-200">
            المراجعات اللحظية غير متاحة حالياً
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTestimonials.map((t, i) => (
          <motion.div key={i} className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between" style={CARD} variants={item}>
            <div>
              <Quote className="w-8 h-8 mb-6 opacity-20 text-teal-400" />
              <p className="text-[15px] sm:text-[16px] leading-[1.85] mb-8 text-slate-300 font-medium">
                "{t.quote}"
              </p>
            </div>
            <div className="flex items-center gap-3 pt-6 border-t border-white/5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 border border-white/10">
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <span className="text-sm font-bold text-white block leading-none mb-1">{t.author}</span>
                <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">سيناريو تطويري</span>
              </div>
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
    className="phi-section flex flex-col items-center text-center"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
  >
    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-500 to-[var(--color-primary)] p-px mb-8">
      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
        <Zap className="w-8 h-8 text-white animate-pulse" />
      </div>
    </div>
    <motion.h2 className="text-2xl sm:text-4xl font-black mb-4 leading-tight text-white" variants={item}>جاهز لتفعيل البروتوكول؟</motion.h2>
    <motion.p
      className="text-lg sm:text-xl mb-10 max-w-[35ch] mx-auto text-slate-400 font-medium"
      style={{ lineHeight: 1.8 }}
      variants={item}
    >
      الميدان ينتظر إشارتك... استعد لبناء أول قاعدة في خريطة وعيك الجديد.
    </motion.p>

    {lastGoalLabel && (
      <motion.div className="mb-12" variants={item}>
        <div
          className={`inline-flex items-center gap-3 rounded-2xl px-6 py-4 border backdrop-blur-md ${badgePulse ? "animate-bounce" : ""}`}
          style={{
            background: "rgba(45,212,191,0.05)",
            borderColor: "rgba(45,212,191,0.2)",
            color: "#99f6e4"
          }}
        >
          {LastGoalIcon ? <LastGoalIcon className="w-5 h-5 text-teal-400" /> : <Target className="w-5 h-5 text-teal-400" />}
          <div className="text-right">
            <span className="text-[10px] block opacity-50 font-bold uppercase tracking-widest">آخر إحداثيات مرصودة</span>
            <span className="text-sm font-black tracking-tight">{lastGoalLabel}</span>
          </div>
        </div>
      </motion.div>
    )}
  </motion.section>
);






