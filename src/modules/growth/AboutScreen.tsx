import { memo, useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Brain, Map, Zap, Heart, Shield, ArrowLeft, Lightbulb, Sparkles, Mouse } from "lucide-react";

// ── القيم الجوهرية ──
const VALUES = [
  {
    icon: Brain,
    title: "الوعي قبل التغيير",
    body: "نؤمن أن التغيير الحقيقي يبدأ من الداخل — لا من نصيحة خارجية. فهم نفسك هو الخطوة الأولى والأقوى.",
  },
  {
    icon: Map,
    title: "رحلتك فريدة",
    body: "لا يوجد قالب واحد يناسب الجميع. الرحلة تبني خريطة مخصصة لك — تختلف عن خريطة أي شخص آخر في العالم.",
  },
  {
    icon: Heart,
    title: "صدق بدون حكم",
    body: "مكان آمن لتكون صادقًا مع نفسك — بدون خوف من الحكم أو المقارنة. صُممت للمستخدم الذي يريد العمق لا السطحية.",
  },
  {
    icon: Zap,
    title: "أثر حقيقي قابل للقياس",
    body: "نقيس النجاح بالسلوك المتغير — لا بالكلمات الجميلة. كل محطة في الرحلة مربوطة بنتيجة ملموسة.",
  },
  {
    icon: Shield,
    title: "خصوصيتك مقدسة",
    body: "بياناتك لك وحدك. لا نبيع، لا نشارك، لا نوظّف تجربتك لاستهدافك. هذا ليس مجرد سياسة — هو موقف.",
  },
  {
    icon: Lightbulb,
    title: "علم نفس + تقنية",
    body: "نجمع أفضل ما في علم النفس الحديث مع قوة الذكاء الاصطناعي — لتجربة لا تشبه أي تطبيق رأيته من قبل.",
  },
];

// ── مكون الميثاق التفاعلي (Interactive Manifesto) ──
function ManifestoCard({ icon: Icon, title, body }: any) {
  const [isRevealed, setIsRevealed] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => {
      setIsRevealed(true);
    }, 400); // إظهار بعد 400ms من الضغط المطول
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setIsRevealed(false);
  };

  return (
    <motion.div
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      onContextMenu={(e) => e.preventDefault()}
      className="relative rounded-[32px] border border-white/5 bg-white/[0.02] p-8 overflow-hidden select-none cursor-pointer group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent transition-opacity duration-700 ${isRevealed ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[160px] text-center">
        <Icon className={`w-8 h-8 mb-4 transition-colors duration-500 ${isRevealed ? 'text-teal-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
        <h3 className={`font-black text-xl mb-2 transition-colors duration-500 ${isRevealed ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
          {title}
        </h3>
        
        <div className="overflow-hidden relative h-20 w-full mt-2">
          <AnimatePresence mode="wait">
            {!isRevealed ? (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600/50 font-mono tracking-widest uppercase"
              >
                [ اضغط مطولاً للفتح ]
              </motion.div>
            ) : (
              <motion.p
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 text-slate-300 text-sm leading-relaxed font-medium flex items-center justify-center"
              >
                {body}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

interface AboutScreenProps {
  onBack?: () => void;
  onStart?: () => void;
}

export const AboutScreen = memo(function AboutScreen({ onBack, onStart }: AboutScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 1. الضباب الحي (Sentient Fog)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const fogOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const fogBlur = useTransform(scrollYProgress, [0, 0.4], [30, 0]);

  // 2. تتبع زمن البقاء من أجل زر البداية الواعي
  useEffect(() => {
    const timer = setInterval(() => setTimeSpent(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. تتبع مؤشر الماوس لمرآة الإدراك
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1; // من -1 إلى 1
    const y = (e.clientY / window.innerHeight) * 2 - 1; 
    setMousePosition({ x, y });
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
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen bg-slate-950 overflow-hidden font-sans"
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

      {/* ── الضباب الحي (Sentient Fog) ── */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-40 bg-slate-950/90"
        style={{ 
          opacity: fogOpacity,
          backdropFilter: useTransform(fogBlur, b => `blur(${b}px)`)
        }}
      />

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        
        {/* Back */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={onBack}
            className="group flex items-center gap-3 text-slate-500 hover:text-slate-300 transition-colors mb-20 text-xs font-bold tracking-widest uppercase"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            تراجع عن المواجهة
          </motion.button>
        )}

        {/* ── Hero: مرآة الإدراك (Cognitive Mirror) ── */}
        <div className="relative min-h-[70vh] flex flex-col justify-center mb-40 text-center">
          
          {/* Reactive Blobs */}
          <motion.div 
            animate={{ 
              x: mousePosition.x * -60, 
              y: mousePosition.y * -60,
            }}
            transition={{ type: "spring", damping: 40, stiffness: 40 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] max-w-2xl aspect-square bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/5 bg-white/[0.02] text-slate-400 text-xs font-mono tracking-[0.2em] uppercase mb-12">
              <Sparkles className="w-3 h-3 text-teal-500" />
              مرآة الإدراك
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[100px] font-black text-white leading-[1.1] mb-12 tracking-tighter">
              نحن هنا لنريك
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-600">
                الحقيقة لا الرغبة
              </span>
            </h1>
            
            <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium">
              توقف عن البحث في الخارج.<br/> 
              الرحلة بُنيت لأن أكبر تحدي يواجهك هو الضياع في نفسك.
            </p>
          </motion.div>

          {/* ── Scroll Indicator ── */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50"
          >
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">اسحب للأسفل</span>
            <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center p-1">
              <motion.div 
                animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-1.5 h-2 bg-teal-500 rounded-full"
              />
            </div>
          </motion.div>
        </div>

        {/* ── إعلان الـ لا-تطبيق (Anti-App Declaration) ── */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-48 flex justify-center"
        >
          <div className="max-w-2xl text-center border-y border-white/5 py-16">
            <p className="text-slate-500 font-mono text-sm md:text-base leading-loose tracking-wide">
              هذا ليس تطبيقاً للإنتاجية.<br/>
              لن نرسل لك إشعارات تافهة لتشرب الماء أو تنام مبكراً.<br/>
              لقد بنينا <span className="text-slate-300">نظام تشغيل عاطفي</span> لتستعيد سيادتك،<br/> وليس لنحتجز انتباهك.
            </p>
          </div>
        </motion.div>

        {/* ── الميثاق الحي (Interactive Manifesto) ── */}
        <section className="mb-48">
           <div className="text-center mb-24">
             <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">مبادئ لا نتنازل عنها</h2>
             <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
               لا تقرأها فقط. اختبر عمقها.
             </p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {VALUES.map((val, i) => (
                <ManifestoCard key={i} {...val} />
              ))}
           </div>
        </section>

        {/* ── شهادة الصمت (The Silent Testimonial) ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-48"
        >
          <div className="rounded-[40px] bg-white/[0.01] border border-white/5 p-16 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
            
            <div className="flex items-center justify-center gap-6 mb-8">
               <div className="relative flex h-4 w-4">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-50"></span>
                 <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500/80"></span>
               </div>
               <span className="text-6xl md:text-8xl font-black text-white tracking-tighter opacity-90">٢٠٠٠</span>
            </div>
            
            <p className="text-slate-400 text-xl md:text-2xl font-medium max-w-lg mx-auto leading-relaxed">
              إنسان يواجهون حقيقتهم الآن في صمت.<br/>
              الرحلة شخصية، لكنك لست وحدك.
            </p>
          </div>
        </motion.section>

        {/* ── زر البداية الواعي (Pace-Aware CTA) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center pb-32 relative"
        >
          <div className="absolute left-1/2 -translate-x-1/2 -top-32 w-px h-24 bg-gradient-to-b from-transparent to-teal-500/50" />
          
          <button
            type="button"
            onClick={handleStart}
            className="group relative px-12 py-6 rounded-full bg-white/[0.03] border border-white/10 overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/[0.05] active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <span className="relative z-10 flex items-center gap-4 text-white font-bold text-lg md:text-xl">
              {ctaText}
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-2" />
            </span>
          </button>
        </motion.div>

      </div>
    </div>
  );
});
