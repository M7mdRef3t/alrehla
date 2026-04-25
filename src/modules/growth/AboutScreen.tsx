import { memo, useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Brain, Map, Zap, Heart, Shield, ArrowLeft, Lightbulb, Zap as Sparkles } from "lucide-react";

// ── القيم الجوهرية للرحلة ──
const NARRATIVE_STEPS = [
  {
    icon: Brain,
    title: "الوعي يسبق الخريطة",
    body: "لا يمكن السفر نحو وجهة دون معرفة أين تقف. التغيير الحقيقي يبدأ من الداخل — لا من نصيحة خارجية معلبة. فهم نفسك هو بوصلتك الأولى والأقوى.",
  },
  {
    icon: Map,
    title: "رحلتك لا تشبه أحداً",
    body: "لا نؤمن بالقوالب الجاهزة التي تناسب الجميع. أنت مسافر فريد، والرحلة تبني خريطة تفاعلية مخصصة لك — تختلف في مساراتها عن خريطة أي إنسان آخر في هذا العالم.",
  },
  {
    icon: Heart,
    title: "مواجهة صادقة، بلا أحكام",
    body: "خلقنا فضاءً آمناً لتكون صادقاً مع أعمق مخاوفك — بعيداً عن ضجيج المقارنة والمثالية المزيفة. هذا المكان صُمم للباحثين عن العمق، لا عن القشور.",
  },
  {
    icon: Zap,
    title: "أثر نقيسه بواقعك",
    body: "لا نقيس النجاح بالكلمات المنمقة بل بالسلوك الذي يتغير في واقعك. كل محطة في رحلتك مربوطة بنتيجة حقيقية، نلمسها معك.",
  },
  {
    icon: Shield,
    title: "حرمتك مقدسة",
    body: "خريطتك لك وحدك. نحن لا نبيع أسرارك، لا نشاركها، ولا نوظف ضعفك لاستهدافك إعلانياً. في نظامنا السيادي، هذا ليس مجرد سياسة.. هو عقيدة.",
  },
  {
    icon: Lightbulb,
    title: "أصالة الإنسان وذكاء الآلة",
    body: "ننسج أعمق مفاهيم علم النفس والفلسفة مع قدرات الذكاء الاصطناعي — لنمنحك رفيق طريق لا يشبه أي أداة رقمية رأيتها من قبل.",
  },
];

interface AboutScreenProps {
  onBack?: () => void;
  onStart?: () => void;
}

export const AboutScreen = memo(function AboutScreen({ onBack, onStart }: AboutScreenProps) {
  const [timeSpent, setTimeSpent] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 40, stiffness: 40 });
  const smoothY = useSpring(mouseY, { damping: 40, stiffness: 40 });

  // 1. الضباب الحي (Sentient Fog)
  const { scrollYProgress } = useScroll();

  const fogOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const fogBlur = useTransform(scrollYProgress, [0, 0.2], [40, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // 2. تتبع زمن البقاء من أجل زر البداية الواعي
  useEffect(() => {
    const timer = setInterval(() => setTimeSpent(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. تتبع مؤشر الماوس لمرآة الإدراك
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1; // من -1 إلى 1
    const y = (e.clientY / window.innerHeight) * 2 - 1; 
    mouseX.set(x * -80);
    mouseY.set(y * -80);
  };

  // 4. خروج الفراغ (Void Exit)
  const handleStart = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onStart) onStart();
    }, 2000); 
  };

  // ديناميكية زر الحث بناءً على وقت القراءة
  const ctaText = timeSpent < 30 
    ? "الرحلة تحتاج صبراً.. خذ نفساً وابدأ" 
    : "لقد أخذت وقتك.. أنت جاهز للرحلة";

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative w-full bg-[#03050a] overflow-x-hidden font-sans selection:bg-teal-500/30 selection:text-teal-200"
    >
      {/* ── خروج الفراغ (Void Exit Overlay) ── */}
      <AnimatePresence>
        {isExiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
             <motion.p
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1, transition: { delay: 0.5, duration: 1 } }}
               className="text-teal-500/80 font-mono tracking-[0.4em] text-sm md:text-base uppercase"
             >
               الرحلة بدأت...
             </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reactive Blobs (Background) ── */}
      <motion.div 
        style={{ x: smoothX, y: smoothY }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-3xl aspect-square bg-teal-500/10 rounded-full blur-[140px] pointer-events-none z-0"
      />

      {/* ── الضباب الحي (Sentient Fog) ── */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-10 bg-[#03050a]/60"
        style={{ 
          opacity: fogOpacity,
          backdropFilter: useTransform(fogBlur, b => `blur(${b}px)`)
        }}
      />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-30">
        
        {/* Back */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={onBack}
            className="group fixed top-10 right-6 md:right-10 flex items-center gap-3 text-slate-500 hover:text-white transition-colors z-50 text-xs font-bold tracking-widest uppercase bg-[#03050a]/50 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            العودة للمركز
          </motion.button>
        )}

        {/* ── Hero: مرآة الإدراك (Cognitive Mirror) ── */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative min-h-[90vh] flex flex-col justify-center mb-20 text-center"
        >
          
          {/* Removed Reactive Blobs from here as they are now in the background */}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/5 bg-white/[0.02] text-teal-400 text-xs font-bold tracking-[0.2em] shadow-[0_0_20px_rgba(20,184,166,0.1)] mb-12">
              <Sparkles className="w-3.5 h-3.5" />
              أكثر من مجرد مساحة
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[110px] font-black text-white leading-[1.1] mb-10 tracking-tighter drop-shadow-lg">
              نحن هنا لنريك
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-teal-200 to-teal-700">
                الحقيقة لا الرغبة
              </span>
            </h1>
            
            <p className="text-slate-400 text-xl md:text-3xl max-w-2xl mx-auto leading-relaxed font-medium">
              توقف عن البحث في الخارج.<br/> 
              الرحلة بُنيت لأن أكبر تحدي يواجهك هو الضياع في ذاتك.
            </p>
          </motion.div>

        </motion.div>

        {/* ── Scroll Indicator ── */}
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-50 pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-[10px] text-teal-500/70 font-mono tracking-widest uppercase">اغص أعمق</span>
            <div className="w-6 h-10 border-2 border-teal-500/30 rounded-full flex justify-center p-1">
              <motion.div 
                animate={{ y: [0, 16, 0], opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-1.5 h-2.5 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.6)]"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* ── إعلان الـ لا-تطبيق (Anti-App Declaration) ── */}
        <div className="min-h-screen flex items-center justify-center py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-900/5 to-transparent pointer-events-none" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true, margin: "-20%" }}
            className="max-w-3xl text-center"
          >
            <p className="text-white text-2xl md:text-5xl leading-[1.6] md:leading-[1.6] font-black tracking-tight drop-shadow-xl">
              <span className="text-slate-500">هذا ليس تطبيقاً للإنتاجية.</span><br/><br/>
              لن نرسل لك إشعارات تافهة لتشرب الماء أو تنام مبكراً.<br/><br/>
              لقد بنينا <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">نظام تشغيل عاطفي</span> لتستعيد قيادتك، وليس لنحتجز انتباهك.
            </p>
          </motion.div>
        </div>

        {/* ── Scrollytelling Narrative (The Path) ── */}
        <section className="relative py-32 mb-32">
           <div className="text-center mb-32 sticky top-20 z-0 opacity-20 pointer-events-none">
             <h2 className="text-[120px] md:text-[200px] font-black text-white tracking-tighter leading-none">الميثاق</h2>
           </div>
           
           <div className="relative z-10 flex flex-col gap-[30vh]">
              {NARRATIVE_STEPS.map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: true, margin: "-20%" }}
                  className={`flex flex-col md:flex-row items-center gap-12 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className="flex-1 text-center md:text-right w-full">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-8 mx-auto md:mx-0 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                      <step.icon className="w-8 h-8 md:w-10 md:h-10 text-teal-400" />
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium">
                      {step.body}
                    </p>
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
           </div>
        </section>

        {/* ── شهادة الصمت (The Silent Testimonial) ── */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          className="min-h-screen flex items-center justify-center"
        >
          <div className="w-full rounded-[48px] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.08] p-16 md:p-32 text-center relative overflow-hidden group shadow-[0_0_50px_rgba(20,184,166,0.05)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] mix-blend-overlay" />
            
            <div className="flex flex-col items-center justify-center gap-6 mb-12 relative z-10">
               <div className="relative flex h-6 w-6">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-40"></span>
                 <span className="relative inline-flex rounded-full h-6 w-6 bg-teal-500/80 shadow-[0_0_20px_rgba(20,184,166,0.5)]"></span>
               </div>
               <span className="text-[80px] md:text-[140px] font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                 ٢٠٠٠+
               </span>
            </div>
            
            <p className="text-slate-300 text-2xl md:text-4xl font-bold max-w-3xl mx-auto leading-relaxed relative z-10">
              إنسان يواجهون حقيقتهم في صمت.<br/>
              <span className="text-slate-500 mt-4 block">أنت تسافر بمفردك، لكنك لست وحدك.</span>
            </p>
          </div>
        </motion.section>

        {/* ── زر البداية الواعي (Pace-Aware CTA) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center py-40 relative flex flex-col items-center"
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-32 bg-gradient-to-b from-teal-500/50 to-transparent" />
          
          <button
            type="button"
            onClick={handleStart}
            className="group relative px-12 md:px-16 py-6 md:py-8 rounded-[40px] bg-white/[0.03] border border-white/10 overflow-hidden transition-all duration-500 hover:scale-105 hover:bg-white/[0.05] active:scale-95 hover:shadow-[0_0_50px_rgba(20,184,166,0.2)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <span className="relative z-10 flex items-center justify-center gap-4 text-white font-black text-xl md:text-2xl">
              {ctaText}
              <ArrowLeft className="w-6 h-6 transition-transform duration-500 group-hover:-translate-x-3 text-teal-400" />
            </span>
          </button>
        </motion.div>

      </div>
    </div>
  );
});
