import type { FC } from "react";
import { Book, Brain, Shield, Info, Sparkles, Navigation } from "lucide-react";
import { motion } from "framer-motion";

const DICTIONARY_TERMS = [
  {
    id: "oracle",
    title: "The Oracle (الأوراكل)",
    icon: <Brain className="w-6 h-6 text-indigo-400" />,
    description: "العقل المدبر ومحلل النظم الخبير الخاص بالمنصة.",
    points: [
      "يدير الميزانيات التسويقية والعمليات المالية.",
      "يحلل جودة العملاء المحتملين (Leads) ويوجههم.",
      "يقدم استراتيجيات تدخل ذكية وقرارات تسعير عاطفية."
    ]
  },
  {
    id: "sovereign",
<<<<<<< HEAD
    title: "Sovereign (السيادة / التحكم السيادي)",
=======
    title: "Private (التحكم الخاص)",
>>>>>>> feat/sovereign-final-stabilization
    icon: <Shield className="w-6 h-6 text-amber-400" />,
    description: "مؤشر ونظام يتحكم في استقلالية المستخدم والنظام.",
    points: [
      "مؤشر السيادة الشخصية (Sovereignty Score): يقيس نضج وعي المستخدم وتحرره من الضغوط.",
<<<<<<< HEAD
      "نظام التحكم السيادي (Sovereign Control): واجهة تحكم متقدمة تمنح المالك استقلالية كاملة في اتخاذ القرارات من خلال Sovereign Orchestrator."
=======
      "نظام التحكم الخاص (Private Control): واجهة تحكم متقدمة تمنح المالك استقلالية كاملة في اتخاذ القرارات من خلال رحلته."
>>>>>>> feat/sovereign-final-stabilization
    ]
  },
  {
    id: "resonance",
    title: "Resonance (الرنين / التناغم)",
    icon: <Sparkles className="w-6 h-6 text-teal-400" />,
    description: "مقياس التوافق بين وعي المستخدم وحالته مع النظام.",
    points: [
      "يتغير لون الواجهة ونبضها بناءً على درجة الرنين (Harmony, Stable, Friction, Crisis).",
      "يعكس مدى استفادة المستخدم من رحلة التعافي."
    ]
  },
  {
    id: "journey",
    title: "The Journey (الرحلة)",
    icon: <Navigation className="w-6 h-6 text-blue-400" />,
    description: "رحلة حياة الإنسان نفسها في هذه الدنيا، وليست مجرد أداة.",
    points: [
      "تتغير وتتطور بحسب اختيارات المستخدم وتفاعله مع المنصة.",
      "تحتوي على المحطات والتحديات التي تشكل الوعي."
    ]
  }
];

export const DictionaryPanel: FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto p-4 lg:p-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/50 flex items-center justify-center">
          <Book className="w-6 h-6 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">قاموس الرحلة</h1>
<<<<<<< HEAD
          <p className="text-sm text-slate-400 font-bold mt-1">توضيح المصطلحات والمفاهيم السيادية المركزية للمنصة</p>
=======
          <p className="text-sm text-slate-400 font-bold mt-1">توضيح المصطلحات والمفاهيم الخاصة المركزية للمنصة</p>
>>>>>>> feat/sovereign-final-stabilization
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DICTIONARY_TERMS.map((term, index) => (
          <motion.div
            key={term.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 shadow-inner">
                {term.icon}
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">{term.title}</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {term.description}
            </p>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Info className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">الدلالة الوظيفية</span>
              </div>
              <ul className="space-y-2">
                {term.points.map((point, i) => (
                  <li key={i} className="text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                    <span className="text-teal-500 mt-1">&bull;</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
