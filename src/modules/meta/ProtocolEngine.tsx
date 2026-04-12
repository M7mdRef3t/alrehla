import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { CheckCircle2, Circle, ArrowLeft, ArrowRight, Shield, Zap, Eye, Rocket } from "lucide-react";

interface ProtocolDay {
    title: string;
    action: string;
    description: string;
}

interface Protocol {
    id: string;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    days: ProtocolDay[];
}

export const PROTOCOLS: Record<string, Protocol> = {
  clarity: {
    id: "clarity",
    title: "بروتوكول الوضوح",
    subtitle: "فك التشوش وبداية الرؤية الحقيقية.",
    icon: Eye,
    color: "#60A5FA",
    days: [
        { title: "اليوم الأول: التفريغ الكامل", action: "Brain Dump", description: "هات ورقة وقلم واكتب كل فتفوتة شاغلة بالك، من أول مشكلة الشغل لحد لون الشراب. فضي دماغك تماماً عشان الرؤية توضح." },
        { title: "اليوم الثاني: فرز الفوضى", action: "Naming the Chaos", description: "بص على اللي كتبته، وسمي كل حاجة باسمها الحقيقي. افصل بين (اللي في إيدك تغيره) و (اللي شايل همه ع الفاضي)." },
        { title: "اليوم الثالث: الرفض الذكي", action: "Strategic No", description: "اختار ٣ حاجات -تاسكات أو التزامات- هتقولهم 'لأ' النهاردة عشان تشتري راحة بالك وتفتح مساحة للي يهمك فعلاً." }
    ]
  },
  grounding: {
    id: "grounding",
    title: "بروتوكول التثبيت",
    subtitle: "الرجوع للجسم والهدوء وقت العاصفة.",
    icon: Shield,
    color: "#FB7185",
    days: [
        { title: "اليوم الأول: مرساة الحواس", action: "Sensory Anchors", description: "٥ دقايق بس.. شم ريحة قهوة، المس ملمس قماش، اسمع صوت بعيد. رجع عقلك لجسمك دلوقتي." },
        { title: "اليوم الثاني: المنطقة الآمنة", action: "Safe Mapping", description: "حدد مكان أو نشاط بيطمنك (حتى لو كوباية شاي في البلكونة). كرر النشاط ده النهاردة بتركيز كامل." },
        { title: "اليوم الثالث: تنظيم المشاعر", action: "Flow Regulation", description: "راقب التقلبات اللي جواك كأنك بتتفرج على فيلم. متتحركش بناءً عليها، بس سيبها تمر بسلام." }
    ]
  },
  boundaries: {
    id: "boundaries",
    title: "بروتوكول الحدود",
    subtitle: "حماية طاقتك وترميم حصونك النفسية.",
    icon: Zap,
    color: "#A78BFA",
    days: [
        { title: "اليوم الأول: كشف تسريب الطاقة", action: "Leakage Audit", description: "لاحظ مين أو إيه اللي بيمص طاقتك وبيهدك. حدد بالظبط الـ 'خرم' اللي في حدودك فين." },
        { title: "اليوم الثاني: كلمة السر (لأ)", action: "Drafting the No", description: "اكتب الجملة اللي هتحمي بيها نفسك المرة الجاية. مش لازم تكون هجومية، بس لازم تكون واضحة." },
        { title: "اليوم الثالث: التنفيذ الناعم", action: "Soft Power", description: "طبق حد واحد 'صغير' النهاردة. استأذن بدري، ارفض مكالمة، أو قول مش مناسبني. من غير تأنيب ضمير." }
    ]
  },
  momentum: {
    id: "momentum",
    title: "بروتوكول الزخم",
    subtitle: "كسر حالة التجميد وبداية الحركة.",
    icon: Rocket,
    color: "#34D399",
    days: [
        { title: "اليوم الأول: نصر مجهري", action: "Micro-Win", description: "اعمل حاجة تخلص في دقيقتين بس. غسل كوباية، ترتيب درج، أو مكالمة مؤجلة. المهم تتحرك." },
        { title: "اليوم الثاني: تجميع المكاسب", action: "Habit Stacking", description: "اربط الفعل الجديد بحاجة بتعملها كل يوم. ابنِ فوق أرض صلبة عشان متعطلش تاني." },
        { title: "اليوم الثالث: استمرارية الحركة", action: "Consistent Flow", description: "خطط لبكرة بناءً على حركة النهاردة. السر مش في السرعة، السر في إنك متوقفش." }
    ]
  }
};

export const ProtocolEngine: FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const activeProtocolId = useJourneyState((s) => s.activeProtocol) || "clarity";
  const protocol = PROTOCOLS[activeProtocolId];
  const [currentDay, setCurrentDay] = useState(0);
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const toggleDay = (idx: number) => {
    setCompletedDays(prev => 
        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-5 py-10" dir="rtl">
        {/* Header */}
        <div className="mb-12 text-center">
            <div 
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
                style={{ background: `${protocol.color}15`, border: `1px solid ${protocol.color}30` }}
            >
                <protocol.icon size={40} style={{ color: protocol.color }} />
            </div>
            <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                {protocol.title}
            </h1>
            <p className="text-white/40 text-lg uppercase tracking-widest">{protocol.subtitle}</p>
        </div>

        {/* Days List */}
        <div className="space-y-4">
            {protocol.days.map((day, i) => {
                const isCompleted = completedDays.includes(i);
                return (
                    <motion.div
                        key={i}
                        layout
                        onClick={() => toggleDay(i)}
                        className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                            isCompleted ? "bg-white/5 border-white/10 opacity-70" : "bg-white/5 border-white/20 shadow-xl"
                        }`}
                        whileHover={{ scale: 1.01 }}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-1 rounded-full ${isCompleted ? "text-teal-400" : "text-white/20"}`}>
                                {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-lg font-bold ${isCompleted ? "text-white/50 line-through" : "text-white"}`}>
                                    {day.title}
                                </h3>
                                <div className="text-teal-400 font-black text-xs uppercase tracking-tighter mb-2">
                                    {day.action}
                                </div>
                                <p className={`text-sm leading-relaxed ${isCompleted ? "text-white/20" : "text-white/60"}`}>
                                    {day.description}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>

        {/* Action Bar */}
        <div className="mt-12 flex flex-col items-center gap-6">
            <button 
                onClick={onFinish}
                className="w-full py-5 rounded-[2rem] font-bold text-white transition-all bg-gradient-to-r from-teal-600 to-purple-600 shadow-lg shadow-teal-900/40 hover:scale-[1.02]"
            >
                تسجيل التقدم وحفظ الرحلة
            </button>
            <p className="text-[10px] text-white/30 text-center max-w-xs">
                إنت بدأت رحلة التغيير الحقيقية. كمل الـ ٣ أيام دول، وهتلاقي الخريطة اللي عملتها بتنور طريقك بشكل مختلف.
            </p>
        </div>
    </div>
  );
};
