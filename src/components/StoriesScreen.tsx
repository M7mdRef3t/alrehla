import { memo, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Star, Quote, ArrowLeft, TrendingUp, Users, Target, CheckCircle2 } from "lucide-react";

// ── بيانات قصص النجاح ──
const STORIES = [
  {
    id: "1",
    name: "سارة المنصوري",
    age: 29,
    city: "الرياض",
    category: "العلاقات",
    quote: "كنت عاجزة عن فهم نفسي في العلاقات. الرحلة ساعدتني أشوف الأنماط اللي كنت مكررّها بلا وعي.",
    outcome: "بعد ٤ أشهر، قدرت أبدأ علاقة صحية وأحدد حدودي بوضوح.",
    stars: 5,
    avatar: "س",
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "2",
    name: "خالد الزهراني",
    age: 34,
    city: "جدة",
    category: "الإنتاجية",
    quote: "كنت أعرف إن في مشكلة بالتسويف لكن ما كنت أعرف السبب الحقيقي. الخريطة كشّفت لي إن الخوف من الفشل هو الجذر.",
    outcome: "أنهيت مشروعي الجانبي اللي كان موقوف ٣ سنوات.",
    stars: 5,
    avatar: "خ",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "3",
    name: "نورة العتيبي",
    age: 26,
    city: "أبوظبي",
    category: "الثقة بالنفس",
    quote: "ما كنت أقدر أتخذ قرارات بدون موافقة الناس. الرحلة علمّتني أثق برؤيتي الداخلية.",
    outcome: "تركت وظيفتي وأسست مشروعي الخاص — وهذا أكبر قرار في حياتي.",
    stars: 5,
    avatar: "ن",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: "4",
    name: "محمد الشمري",
    age: 41,
    city: "الكويت",
    category: "القلق والتوتر",
    quote: "كنت أظن القلق جزء من شخصيتي. اكتشفت إنه رد فعل على مواقف محددة — وهذا غيّر كل شيء.",
    outcome: "نمط النوم تحسّن وتوقفت عن العلاج التقليدي بإشراف طبيب.",
    stars: 5,
    avatar: "م",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "5",
    name: "ريم الغامدي",
    age: 31,
    city: "الدوحة",
    category: "الهوية الشخصية",
    quote: "كنت أعيش الحياة اللي يتوقعها أهلي مني. بدأت أسأل: أنا مين فعلاً؟",
    outcome: "قدرت أخبر أهلي باختياراتي الحقيقية وأحافظ على علاقتهم في نفس الوقت.",
    stars: 5,
    avatar: "ر",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "6",
    name: "يوسف القحطاني",
    age: 38,
    city: "مسقط",
    category: "العمل والمهنة",
    quote: "كنت ناجح من الخارج لكن فاضي من الداخل. الرحلة ساعدتني أعيد تعريف النجاح بطريقتي.",
    outcome: "انتقلت لمجال يتوافق مع قيمي وأنا أسعد بكتير.",
    stars: 5,
    avatar: "ي",
    color: "from-green-500 to-teal-600",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

interface StoriesScreenProps {
  onBack?: () => void;
}

export const StoriesScreen = memo(function StoriesScreen({ onBack }: StoriesScreenProps) {
  return (
    <div
      className="min-h-screen w-full pt-12 pb-24 px-4 md:px-8 lg:px-16 overflow-x-hidden"
      dir="rtl"
      style={{ background: "radial-gradient(circle at 50% -20%, #1a1a2e 0%, #060b18 100%)" }}
    >
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl mx-auto text-center mb-24 relative"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-500 hover:text-teal-400 transition-all mb-12 text-sm font-medium"
          >
            <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-teal-500/30 group-hover:bg-teal-500/5 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            رجوع للمنصة
          </button>
        )}
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md mb-8"
        >
          <div className="flex -space-x-1.5 space-x-reverse">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-[#060b18] bg-teal-500 flex items-center justify-center text-[8px] font-bold text-white">
                {i === 3 ? "+1k" : ""}
              </div>
            ))}
          </div>
          <span className="text-slate-400 text-xs font-semibold mr-2">+٢,٤٠٠ رحلة تحول حقيقية</span>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tight">
          قصص من داخل 
          <br />
          <span className="relative inline-block mt-2">
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              مختبر الوعي الذاتي
            </span>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 rounded-full"
            />
          </span>
        </h1>
        
        <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
          ليسوا "مؤثرين" أو حملات إعلانية. هؤلاء بشر خاضوا المواجهة مع أنفسهم 
          ليخرجوا بنسخة أكثر صدقاً ووضوحاً.
        </p>
      </motion.div>

      {/* ── Dashboard of Impact ── */}
      <div className="max-w-5xl mx-auto mb-20 grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {[
          { icon: Users, label: "رحلات مكتملة", val: "٢,٤٢١" },
          { icon: TrendingUp, label: "تحسن ملموس", val: "٩٤٪" },
          { icon: Target, label: "أهداف محققة", val: "١٥,٨٠٠" },
          { icon: Star, label: "تقييم الرضا", val: "٤.٩/٥" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm"
          >
            <stat.icon className="w-5 h-5 text-teal-500/50 mb-3" />
            <div className="text-2xl font-black text-white mb-1">{stat.val}</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── قصص ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {STORIES.map((story) => (
          <motion.article
            key={story.id}
            variants={item}
            className="group relative rounded-2xl overflow-hidden
                       bg-white/[0.04] border border-white/[0.08]
                       hover:border-white/20 hover:bg-white/[0.07]
                       transition-all duration-300 p-6 flex flex-col gap-4"
          >
            {/* Category badge */}
            <div className={`inline-flex w-fit px-3 py-1 rounded-full bg-gradient-to-r ${story.color}
                             text-white text-[11px] font-bold`}>
              {story.category}
            </div>

            {/* Quote */}
            <div className="relative">
              <Quote className="w-6 h-6 text-white/10 absolute -top-1 -right-1" />
              <p className="text-slate-300 text-sm leading-relaxed pr-4">
                "{story.quote}"
              </p>
            </div>

            {/* Outcome */}
            <div className="rounded-xl bg-teal-500/[0.08] border border-teal-500/20 p-3">
              <p className="text-teal-300 text-xs leading-relaxed font-medium">
                ✦ {story.outcome}
              </p>
            </div>

            {/* Avatar + Name */}
            <div className="flex items-center gap-3 mt-auto pt-2 border-t border-white/[0.06]">
              <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${story.color}
                               flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {story.avatar}
              </span>
              <div>
                <p className="text-white text-sm font-semibold">{story.name}</p>
                <p className="text-slate-500 text-xs">{story.age} سنة · {story.city}</p>
              </div>
              <div className="mr-auto flex gap-0.5">
                {Array.from({ length: story.stars }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>

      {/* ── CTA ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center mt-32 relative py-20 px-8 rounded-[40px] overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(45,212,191,0.05) 0%, rgba(20,184,166,0.02) 100%)" }}
      >
        <div className="absolute inset-0 border border-teal-500/10 rounded-[40px]" />
        
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">قصتك هي البداية الحقيقية</h2>
        <p className="text-slate-400 mb-10 text-xl max-w-xl mx-auto leading-relaxed">
          انضم لآلاف الأشخاص الذين قرروا فهم عالمهم الداخلي ورسم خريطتهم الخاصة.
        </p>
        
        <button
          type="button"
          onClick={onBack}
          className="group relative px-12 py-5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black
                     shadow-[0_20px_50px_rgba(45,212,191,0.3)] hover:shadow-[0_25px_60px_rgba(45,212,191,0.5)]
                     transition-all active:scale-95 text-lg"
        >
          <span className="relative z-10 flex items-center gap-3">
             ابدأ رحلتك الآن
             <motion.span 
               animate={{ x: [0, 5, 0] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
             >
               →
             </motion.span>
          </span>
        </button>
      </motion.div>
    </div>
  );
});
