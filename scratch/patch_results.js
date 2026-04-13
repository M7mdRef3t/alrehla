const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'modules', 'meta', 'OnboardingFlow.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldResultsScreen = `const StepResultsScreen: FC<{
  userName?: string;
  result?: DerivedOnboardingResult | null;
  plan?: DynamicRecoveryPlan | null;
  onComplete: () => void;
}> = ({ userName, result, plan, onComplete }) => {
  const displayName = userName ? \`يا \${userName}\` : "";
  const patternLabel = result?.dominantPattern || (plan?.primaryPattern ? (PATTERN_TYPE_LABELS[plan.primaryPattern] || "نمط سلوكي") : "نمط استنزاف عام");
  const protocolLabel = result?.protocolLabel || (plan?.ring === "red" ? PATH_NAMES["path_protection"] : plan?.ring === "yellow" ? PATH_NAMES["path_negotiation"] : PATH_NAMES["path_deepening"]);
  const week1 = plan?.steps.find((s) => s.week === 1);

  return (
    <div className="flex flex-col gap-6 w-full py-2 text-right">
      <div className="space-y-2 text-center">
        <ShieldCheck className="w-10 h-10 text-teal-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">دي أول نتيجة واضحة {displayName}</h2>
        <p className="text-xs text-slate-400">{result?.routeReason || "تم تحليل خريطتك لتحديد أسرع مسار لأول خطوة عملية."}</p>
      </div>

      <div className="space-y-4">
        {result?.contextNote ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-teal-300">
              {result.contextLabel || "Context"}
            </div>
            <p className="text-xs leading-relaxed text-slate-300">{result.contextNote}</p>
          </div>
        ) : null}

        <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 shadow-[0_0_15px_rgba(45,212,191,0.05)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">النتيجة المرصودة</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/10 text-teal-300 border border-teal-400/20">{protocolLabel}</span>
          </div>
          <p className="text-lg font-bold text-white mb-1">{patternLabel}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed italic">{result?.insightLine || "دي أول قراءة تشغيلية للخريطة، مش مجرد انطباع عام."}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-center">
            <div className="text-[10px] text-slate-500">أحمر</div>
            <div className="text-lg font-black text-rose-300">{result?.redCount ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
            <div className="text-[10px] text-slate-500">أصفر</div>
            <div className="text-lg font-black text-amber-300">{result?.yellowCount ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <div className="text-[10px] text-slate-500">أخضر</div>
            <div className="text-lg font-black text-emerald-300">{result?.greenCount ?? 0}</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3">
            <Target className="w-5 h-5 text-teal-500/40" />
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">هدفك الأول</span>
              <h4 className="text-md font-bold text-white mt-1">{week1?.title || "تحديد الحدود"}</h4>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {week1?.goal || "ابدأ بوضع ٤ علاقات أساسية على الخريطة لتفهم الفرق بين الاستنزاف والنمو."}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onComplete}
          className="w-full rounded-2xl py-4 bg-teal-400 text-zinc-900 font-extrabold ob-btn-tap shadow-[0_4px_25px_rgba(45,212,191,0.3)]"
        >
          دخول الملاذ ←
        </button>
      </div>
    </div>
  );
};`;

const newResultsScreen = `const StepResultsScreen: FC<{
  diagnosis: TransformationDiagnosis;
  onComplete: () => void;
}> = ({ diagnosis, onComplete }) => {
  return (
    <div className="flex flex-col gap-6 w-full py-2 text-right">
      <div className="space-y-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-teal-500/30">
           <ShieldCheck className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">رؤيتك السيادية جاهزة!</h2>
        <p className="text-xs text-slate-400">تم تحليل مسارك وفك شفرات الطاقة في رحلتك.</p>
      </div>

      <div className="space-y-4">
        {/* Poetic State Card */}
        <div className="p-5 rounded-3xl border border-teal-500/30 bg-teal-500/10 shadow-[0_0_30px_rgba(45,212,191,0.1)] relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-50"></div>
           <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.2em]">الحالة الروحية</span>
              <div className="px-2 py-1 rounded-md bg-teal-400/20 text-[10px] font-bold text-teal-200 border border-teal-400/20">
                {diagnosis.protocol}
              </div>
           </div>
           <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-teal-300 transition-colors">
             {diagnosis.state}
           </h3>
           <p className="text-sm text-slate-300 leading-relaxed italic">
             "{diagnosis.interpretation}"
           </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center">
            <div className="text-[9px] font-bold text-rose-500 mb-1 uppercase tracking-widest">نزيف</div>
            <div className="text-xl font-black text-white">{diagnosis.metrics.redCount}</div>
          </div>
          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
            <div className="text-[9px] font-bold text-amber-500 mb-1 uppercase tracking-widest">حذر</div>
            <div className="text-xl font-black text-white">{diagnosis.metrics.yellowCount}</div>
          </div>
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center">
            <div className="text-[9px] font-bold text-emerald-500 mb-1 uppercase tracking-widest">نمو</div>
            <div className="text-xl font-black text-white">{diagnosis.metrics.greenCount}</div>
          </div>
        </div>

        {/* Pledge Card (Commitment Loop) */}
        <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 relative group">
           <div className="absolute -top-3 -right-3 w-12 h-12 bg-teal-500/20 rounded-full blur-xl group-hover:bg-teal-500/40 transition-all opacity-50"></div>
           <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">عهد المسافر</span>
           </div>
           <p className="text-md font-bold text-slate-100 leading-relaxed mb-4">
             {diagnosis.pledge}
           </p>
           <div className="flex items-center gap-2 text-[10px] text-teal-400 font-bold border-t border-white/5 pt-4">
              <Zap className="w-3 h-3" />
              <span>أنت الآن في منطقة السيادة الذاتية</span>
           </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={onComplete}
          className="w-full rounded-2xl py-4.5 bg-gradient-to-r from-teal-500 to-teal-400 text-zinc-950 font-black ob-btn-tap shadow-[0_10px_30px_rgba(45,212,191,0.3)] hover:shadow-[0_15px_40px_rgba(45,212,191,0.4)] transition-all flex items-center justify-center gap-2 group"
        >
          دخول الملاذ السيادي
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform rotate-180" />
        </button>
      </div>
    </div>
  );
};`;

// Note: I'll use a very specific replacement for the StepResultsScreen component.
// Since the encoding might be slightly different, I'll use regex that handles non-ascii if possible,
// or I'll just replace based on the component structure.

// Actually, I'll use a Node script to replace it to be 100% safe.
content = content.replace(/const StepResultsScreen: FC<[\s\S]*?};/m, newResultsScreen);

fs.writeFileSync(filePath, content);
console.log('StepResultsScreen updated with Poetic Diagnosis and Pledge.');
