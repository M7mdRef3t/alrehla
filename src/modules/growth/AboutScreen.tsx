import { memo } from "react";
import { motion, Variants } from "framer-motion";
import { Brain, Map, Zap, Heart, Shield, ArrowLeft, CheckCircle2, Lightbulb, Sparkles, Compass } from "lucide-react";

// ── القيم الجوهرية ──
const VALUES = [
  {
    icon: Brain,
    title: "الوعي قبل التغيير",
    body: "نؤمن أن التغيير الحقيقي يبدأ من داخل — لا من نصيحة خارجية. فهم نفسك هو الخطوة الأولى والأقوى.",
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    icon: Map,
    title: "رحلتك فريدة",
    body: "لا يوجد قالب واحد يناسب الجميع. الرحلة تبني خريطة مخصصة لك — تختلف عن خريطة أي شخص آخر في العالم.",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: Heart,
    title: "صدق بدون حكم",
    body: "مكان آمن لتكون صادقًا مع نفسك — بدون خوف من الحكم أو المقارنة. تصمم للمستخدم الذي يريد العمق لا السطحية.",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: Zap,
    title: "أثر حقيقي قابل للقياس",
    body: "نقيس النجاح بالسلوك المتغير — لا بالكلمات الجميلة. كل محطة في الرحلة مربوطة بنتيجة ملموسة.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Shield,
    title: "خصوصيتك مقدسة",
    body: "بياناتك لك وحدك. لا نبيع، لا نشارك، لا نوظّف تجربتك لاستهدافك. هذا ليس مجرد سياسة — هو موقف.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Lightbulb,
    title: "علم نفس + تقنية",
    body: "نجمع أفضل ما في علم النفس الحديث مع قوة الذكاء الاصطناعي — لتجربة لا تشبه أي تطبيق رأيته من قبل.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
];

// ── مميزات فريدة ──
const DIFFERENTIATORS = [
  "خريطة علاقاتك الحقيقية — مرئية وتفاعلية",
  "ذكاء اصطناعي يفهم السياق الثقافي العربي",
  "أنماط سلوكية لا تراها إلا بعد أسابيع من التأمل",
  "خطة تعافٍ مخصصة تتطور مع رحلتك",
  "تجربة عاطفية لا تُنسى",
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: "easeOut" },
  }),
};

interface AboutScreenProps {
  onBack?: () => void;
  onStart?: () => void;
}

export const AboutScreen = memo(function AboutScreen({ onBack, onStart }: AboutScreenProps) {
  return (
    <div className="relative w-full">

      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-10 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </motion.button>
        )}

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-32 relative"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black tracking-[0.3em] uppercase mb-8"
          >
            <Sparkles className="w-3 h-3" />
            فلسفة الرحلة
          </motion.div>
          
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[1.05] mb-10 tracking-tighter">
            الوعي الذاتي 
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              ليس مجرد ميزة
            </span>
          </h1>
          
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
            بنينا "الرحلة" لأننا نؤمن أن أكبر تحدي يواجه الإنسان هو "الضياع في نفسه". 
            نحن هنا لنعطيك المرآة التي تريك الحقيقة، لا الرغبة.
          </p>
          
          {/* Decorative Elements */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-violet-500/10 blur-[120px] rounded-full pointer-events-none" />
        </motion.div>

        {/* ── Founder's Vision ── */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32 relative"
        >
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
             <div className="lg:col-span-7 space-y-6">
               <h2 className="text-3xl font-black text-white flex items-center gap-3">
                 <Compass className="w-8 h-8 text-teal-400" />
                 رؤية المؤسس
               </h2>
               <div className="space-y-4 text-slate-300 text-lg leading-relaxed font-medium italic opacity-90">
                 <p>"الرحلة بدأت بسؤال واحد: لماذا نملك كل هذه التطبيقات ولكننا لا زلنا نشعر بالانفصال عن جوهرنا؟"</p>
                 <p>"أردنا بناء نظام تشغيل للوعي. تطبيق لا يخبرك ماذا تفعل، بل يساعدك أن ترى لماذا تفعل ما تفعل. الرحلة هي مسيرتك أنت، ونحن مجرد رفاق الطريق الذين يملكون الخريطة."</p>
               </div>
               <div className="flex items-center gap-4 pt-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-teal-400 font-black">
                    MR
                  </div>
                  <div>
                    <p className="text-white font-bold">محمد رفعت</p>
                    <p className="text-slate-500 text-xs">مؤسس ومعماري الرحلة</p>
                  </div>
               </div>
             </div>
             <div className="lg:col-span-5 relative group">
               <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="relative aspect-square rounded-[40px] bg-white/[0.03] border border-white/[0.06] overflow-hidden flex items-center justify-center p-8 backdrop-blur-3xl">
                  <div className="w-full h-full border border-teal-500/20 rounded-[32px] flex items-center justify-center relative">
                    <Brain className="w-32 h-32 text-teal-500/20 absolute animate-pulse" />
                    <div className="text-center z-10 px-6">
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-4">Architecture of Mind</p>
                      <h3 className="text-white text-xl font-black">نظام تشغيل عاطفي متكامل</h3>
                    </div>
                  </div>
               </div>
             </div>
           </div>
        </motion.section>

        {/* ── مميزات فريدة ── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-20"
        >
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" />
              ما يجعل الرحلة مختلفة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DIFFERENTIATORS.map((item, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                >
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  </span>
                  <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── القيم ── */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">مبادئ لا نتنازل عنها</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
              الرحلة بُنيت على أسس صلبة تضمن لك الأمان، الصدق، والنتائج.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ icon: Icon, title, body, color, bg }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                className={`group relative rounded-[32px] border p-8 ${bg} backdrop-blur-xl overflow-hidden`}
              >
                {/* Hover state decorations */}
                <div className={`absolute -bottom-10 -right-10 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${color.replace('text', 'bg')}`} />
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/[0.04] mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <h3 className="text-white font-black text-xl mb-3 tracking-tight">{title}</h3>
                <p className="text-slate-400 text-base leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── الأرقام ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { number: "+٢٠٠٠", label: "مستخدم نشط" },
            { number: "٩٣٪",  label: "أبلغوا بتحسّن ملموس" },
            { number: "٤.٩",   label: "متوسط التقييم" },
            { number: "٨",     label: "دول عربية" },
          ].map(({ number, label }) => (
            <div
              key={label}
              className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 text-center"
            >
              <p className="text-3xl font-black text-white mb-1">{number}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          ))}
        </motion.section>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-center"
        >
          <p className="text-slate-400 mb-6 text-lg">جاهز تبدأ رحلتك الحقيقية؟</p>
          <button
            type="button"
            onClick={onStart}
            className="px-10 py-4 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500
                       hover:from-teal-400 hover:to-emerald-400
                       text-slate-900 font-bold text-base
                       shadow-[0_0_32px_rgba(45,212,191,0.4)] hover:shadow-[0_0_48px_rgba(45,212,191,0.6)]
                       transition-all active:scale-95"
          >
            ابدأ الآن — مجاناً
          </button>
        </motion.div>
      </div>
    </div>
  );
});

