import { Info, Shield, Flame, Trophy, MinusCircle, Snowflake, Eye, Waves } from "lucide-react";

export function LevelGuide() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-4 pb-12 space-y-8" dir="rtl">
      {/* Intro */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-400" />
          كيف تعمل المستويات؟
        </h3>
        <p className="text-sm font-medium text-white/60 leading-relaxed">
          نظام المستويات مبني على <strong>نقاط الخبرة (نقاط)</strong> اللي بتجمعها من تفاعلك الحقيقي والواعي مع رحلتك على المنصة.
          عشان تطلع من المستوى ١ للمستوى ٢، محتاج تجمع ٢٠٠ نقطة. وكل مستوى جديد بيطلب ٥٠ نقطة زيادة عن اللي قبله (المستوى ٣ محتاج ٢٥٠، وهكذا).
        </p>
      </div>

      {/* How to earn points */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white px-2">كيف تكسب النقاط؟</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
              <Snowflake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">تجميد علاقة مستنزفة</h4>
              <p className="text-xs text-white/50 mb-2">تأخذ مسافة واعية لحماية طاقتك.</p>
              <div className="text-xs font-black text-cyan-400">+٦٠ نقطة</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">ذوبان واعي</h4>
              <p className="text-xs text-white/50 mb-2">إعادة علاقة بشكل صحي وواعي.</p>
              <div className="text-xs font-black text-blue-400">+٤٠ نقطة</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">وضع حدود سيادية</h4>
              <p className="text-xs text-white/50 mb-2">تحديد مساحتك وحمايتها بوضوح.</p>
              <div className="text-xs font-black text-emerald-400">+٣٠ نقطة</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">رصد نمط مكرر</h4>
              <p className="text-xs text-white/50 mb-2">ملاحظة أفعالك المتكررة بوعي.</p>
              <div className="text-xs font-black text-purple-400">+٢٠ نقطة</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-4 md:col-span-2">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">الاستمرار اليومي</h4>
              <p className="text-xs text-white/50 mb-2">التزامك برحلتك كل يوم بيبني زخم قوي.</p>
              <div className="flex gap-4">
                <div className="text-xs font-black text-orange-400">٧ أيام متتالية: +١٠٠ نقطة</div>
                <div className="text-xs font-black text-amber-400">٣٠ يوم متتالي: +٥٠٠ نقطة</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Penalties */}
      <div className="p-6 rounded-3xl bg-rose-500/[0.02] border border-rose-500/10 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 shrink-0">
          <MinusCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-black text-rose-300 mb-2">ضريبة الغياب (فقدان النقاط)</h3>
          <p className="text-sm font-medium text-white/60 leading-relaxed mb-2">
            لو غبت يوم واحد عادي، لكن لو غبت <strong>أكثر من يوم</strong>، بيتم خصم ١٠ نقاط عن كل يوم غياب.
            الغياب المستمر ممكن يقلل إجمالي نقاطك، مما قد يؤدي إلى نزولك في المستوى والرتبة.
          </p>
        </div>
      </div>

      {/* Ranks */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white px-2">الرتب والألقاب</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["مستطلع جَدِيد", "كشاف ميداني", "ملازم تعافي", "نقيب حدود", "رائد استقرار", "عقيد حكمة", "عميد سلام", "مارشال الدواير"].map((rank) => (
            <div key={rank} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center gap-2 group hover:bg-white/[0.05] transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-amber-400 group-hover:bg-amber-400/10 transition-colors">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white/80">{rank}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
