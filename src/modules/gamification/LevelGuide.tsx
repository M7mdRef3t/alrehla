import { Info, Shield, Flame, Trophy, MinusCircle, Snowflake, Eye, Waves } from "lucide-react";

export function LevelGuide() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-4 pb-12 space-y-8" dir="rtl">
      {/* Intro */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-400" />
          كيف تنمو أجنحتك؟
        </h3>
        <p className="text-sm font-medium text-white/60 leading-relaxed">
          الأجنحة في "الرحلة" ليست مجرد أرقام، هي رمز لقدرتك على <strong>التحليق فوق أنماطك القديمة</strong> ورؤية حياتك بوضوح "عين حورس". 
          كلما زاد وعيك وتفاعلك الصادق مع مداراتك، كلما امتدت أجنحتك لتشمل آفاقاً أوسع من السلام والسيطرة.
        </p>
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-bold">
          لفرد أجنحتك والاستعداد للتحليق الأول (من الجناح ١ للـ ٢)، تحتاج ٢٠٠ نقطة وعي. وكل مرحلة جديدة تطلب جهداً أعمق (زيادة ٥٠ نقطة عن الجناح السابق).
        </div>
      </div>

      {/* How to earn points */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white px-2">كيف تقوي أجنحتك؟</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:border-cyan-500/30 transition-colors">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Snowflake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">تجميد النزيف الطاقي</h4>
              <p className="text-xs text-white/50 mb-2">تأخذ مسافة واعية (تجميد) من علاقة مستنزفة.</p>
              <div className="text-xs font-black text-cyan-400">+٦٠ نقطة</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:border-blue-500/30 transition-colors">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">ذوبان الجليد الواعي</h4>
              <p className="text-xs text-white/50 mb-2">إعادة تواصل صحي بعد رصد وفهم حقيقي.</p>
              <div className="text-xs font-black text-blue-400">+٤٠ نقطة</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">تفعيل الدروع السيادية</h4>
              <p className="text-xs text-white/50 mb-2">تحديد حدود واضحة تمنع الاختراق أو الاستنزاف.</p>
              <div className="text-xs font-black text-emerald-400">+٣٠ نقطة</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:border-purple-500/30 transition-colors">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">رصد "العين الثالثة"</h4>
              <p className="text-xs text-white/50 mb-2">ملاحظة نمط مكرر في سلوكك أو علاقاتك بوعي.</p>
              <div className="text-xs font-black text-purple-400">+٢٠ نقطة</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4 md:col-span-2 hover:border-orange-500/30 transition-colors">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">زخم الصقر المسافر</h4>
              <p className="text-xs text-white/50 mb-2">الالتزام اليومي برحلتك يبني عضلات أجنحة قوية لا تنكسر.</p>
              <div className="flex gap-4">
                <div className="text-xs font-black text-orange-400">٧ أيام متتالية: +١٠٠ نقطة</div>
                <div className="text-xs font-black text-amber-400">٣٠ يوم متتالي: +٥٠٠ نقطة</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Penalties */}
      <div className="p-6 rounded-3xl bg-rose-500/[0.02] border border-rose-500/10 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl -mr-12 -mt-12" />
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 shrink-0">
          <MinusCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-black text-rose-300 mb-2">ضريبة الانقطاع (نزيف النقاط)</h3>
          <p className="text-sm font-medium text-white/60 leading-relaxed mb-2">
            الرحلة تتطلب استمراراً. لو انقطعت <strong>أكثر من يوم</strong>، تبدأ أجنحتك في الضعف تدريجياً (خصم ١٠ نقاط يومياً).
            الغياب الطويل قد يجعلك تهبط من مرحلة أجنحة عليا لمرحلة أقل حتى تستعيد توازنك.
          </p>
        </div>
      </div>

      {/* Ranks */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white px-2">مقامات التحليق</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["صقر ناشئ", "كشاف الآفاق", "ملازم التعافي", "قائد الحدود", "رائد الاستقرار", "حكيم المدارات", "عميد السلام", "سيد الرحلة"].map((rank) => (
            <div key={rank} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center gap-2 group hover:bg-white/[0.05] transition-all duration-300 hover:scale-105">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-colors">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-white/80">{rank}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
