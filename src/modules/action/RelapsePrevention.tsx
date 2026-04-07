import type { FC } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, Zap, HeartOff } from "lucide-react";

interface RelapsePreventionProps {
  displayName: string;
  category: string;
}

export const RelapsePrevention: FC<RelapsePreventionProps> = ({
  displayName,
  category: _category
}) => {
  const warningSigns = [
    {
      title: "التبرير اللاإرادي",
      description: "لما تبدأ تقول 'هو أكيد تعبان' أو 'أنا اللي ضغطت عليه' عشان تمحي غلطه.",
      icon: <HeartOff className="w-4 h-4 text-red-500" />
    },
    {
      title: "إهمال التعب الجسدي",
      description: "لما تتجاهل الصداع أو ضربات القلب السريعة قبل ما تقابل الشخص ده.",
      icon: <Zap className="w-4 h-4 text-amber-500" />
    },
    {
      title: "الرغبة في 'الإصلاح'",
      description: "لما توهم نفسك إنك المرة دي هتقدر تخليه يفهم أو يتغير.",
      icon: <AlertTriangle className="w-4 h-4 text-orange-500" />
    }
  ];

  const emergencySteps = [
    "انسحب فوراً من الموقف (روح الحمام، اعمل مكالمة وهمية).",
    "فكر نفسك بـ 3 أعراض جسدية حسيت بيها المرة اللي فاتت.",
    "اقرأ 'جمل الحدود' اللي جهزتها في مكتبة الجمل.",
    "كلم صديق آمن (الدرع البشري) يحكي لك الحقيقة من برا."
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-r-4 border-amber-500 pr-4">
        <div className="p-2 bg-amber-100 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">حائط الصد: منع الانتكاسة</h3>
          <p className="text-xs text-slate-500">إزاي تعرف إنك بدأت ترجع للنمط القديم مع {displayName}؟</p>
        </div>
      </div>

      {/* Warning Signs */}
      <div className="grid grid-cols-1 gap-3">
        <p className="text-xs font-bold text-slate-700 mb-1">🚨 علامات الخطر المبكرة:</p>
        {warningSigns.map((sign, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              {sign.icon}
              <h4 className="text-sm font-bold text-slate-900">{sign.title}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pr-6">
              {sign.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Emergency Plan */}
      <div className="p-5 bg-linear-to-br from-slate-900 to-indigo-900 text-white rounded-3xl shadow-xl relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 -translate-y-12" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-indigo-300" />
            <h4 className="text-sm font-bold">خطة الطوارئ النفسية</h4>
          </div>
          
          <div className="space-y-3">
            {emergencySteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {index + 1}
                </span>
                <p className="text-xs text-indigo-50 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Encouragement */}
      <div className="text-center py-4 px-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <p className="text-xs text-emerald-800 italic">
          "الوعي بالعلامات دي هو نص المسافة للتعافي.. إنت دلوقتي أقوى بكتير من الأول."
        </p>
      </div>
    </div>
  );
};
