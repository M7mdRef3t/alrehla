import type { FC } from "react";
import { motion } from "framer-motion";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { Zap as Sparkles, Brain, Zap, Target, Lock, Compass, ArrowLeft } from "lucide-react";

const STATE_META = {
  overloaded: {
    title: "حالة: ضبابية وتشوش",
    description: "رادار المشهد بيقول إن دماغك شايلة تفاصيل كتير متبعثرة. إنت محتاج تفضي المساحة دي عشان تقدر تاخد قرارك.",
    icon: Brain,
    color: "#F87171",
    protocol: "clarity"
  },
  triggered: {
    title: "حالة: اشتباك ساخن",
    description: "المعطيات بتشير لاشتباك وموقف متأزم. جسمك في حالة دفاع دلوقتي، ومحتاجين نهديه ونستعيد الهدوء عشان تدير الموقف.",
    icon: Zap,
    color: "#FB7185",
    protocol: "grounding"
  },
  stuck: {
    title: "حالة: قرار معلق",
    description: "الخريطة ثابتة.. حركتك مقيدة. المشكلة مش كسل، المشكلة في رؤية المسار. هنبدأ بتفكيك المشهد لخطوات تكتيكية.",
    icon: Lock,
    color: "#FBBF24",
    protocol: "momentum"
  },
  avoiding: {
    title: "حالة: انسحاب تكتيكي",
    description: "في محاور صراع كتير إنت بتنسحب منها. رسم الحدود بدقة هو اللي هيديك السيطرة عشان تقدر تواجه بشروطك.",
    icon: Target,
    color: "#A78BFA",
    protocol: "boundaries"
  },
  confused: {
    title: "حالة: افتقاد الرؤية",
    description: "الخيوط داخلة في بعضها. إنت محتاج بوصلة ترتب الأولويات وتعرفك الموقف الحالي للبدء في اتخاذ قراراتك.",
    icon: Compass,
    color: "#60A5FA",
    protocol: "clarity"
  },
  ready: {
    title: "حالة: استعداد للحسم",
    description: "الخريطة واضحة ونفسك طويل. وقت التنفيذ جه عشان نحول الاستراتيجية لنتائج فعلية على الأرض.",
    icon: Sparkles,
    color: "#34D399",
    protocol: "momentum"
  }
};

export const ReflectionOutput: FC<{ onStartProtocol: () => void }> = ({ onStartProtocol }) => {
  const detectedState = useJourneyState((s) => s.detectedState) || "confused";
  const setActiveProtocol = useJourneyState((s) => s.setActiveProtocol);
  const meta = STATE_META[detectedState];
  const Icon = meta.icon;

  const handleStart = () => {
      setActiveProtocol(meta.protocol as any);
      onStartProtocol();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl"
      dir="rtl"
    >
      <motion.div 
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-2xl"
      >
        {/* Ambient Glow */}
        <div 
            className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20"
            style={{ background: meta.color }}
        />

        <div className="relative z-10">
            <div 
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
            >
                <Icon size={40} style={{ color: meta.color }} />
            </div>

            <h2 className="text-2xl font-black text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
                {meta.title}
            </h2>

            <p className="text-white/60 text-lg leading-relaxed mb-10">
                {meta.description}
            </p>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-shadow"
                style={{ 
                    background: `linear-gradient(135deg, ${meta.color}, #1e1e2e)`,
                    color: "white",
                    boxShadow: `0 10px 20px ${meta.color}20`
                }}
            >
                بدء خطة استعادة الزمام
                <ArrowLeft size={20} />
            </motion.button>
            
            <p className="mt-4 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
                TRANSFORMATION ENGINE v2.0
            </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
