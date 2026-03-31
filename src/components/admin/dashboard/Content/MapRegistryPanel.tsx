import { FC } from "react";
import { 
  Rocket, 
  Orbit, 
  Map, 
  History, 
  GitBranch, 
  Eye, 
  ChevronLeft,
  Terminal,
  Brain
} from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

interface MapArchitecture {
  id: string;
  name: string;
  codename: string;
  icon: React.ElementType;
  color: string;
  description: string;
  purpose: string;
  flowParams: string[];
}

const ARCHITECTURES: MapArchitecture[] = [
  {
    id: "core-map",
    name: "الخريطة الرئيسية (Core Awareness Board)",
    codename: "CoreMapScreen / MapCanvas",
    icon: Orbit,
    color: "emerald",
    description: "الدماغ الحقيقية والمعقل الأساسي للمنصة. الخريطة الديناميكية اللي بترسم الدواير كلها حواليك في مدارات (آمن - متعب - ضاغط)، وبيطلعله فيها كل التدخلات الآلية (AI Facilitator).",
    purpose: "Operational Dashboard - مساحة القيادة الخاصة بالمشتركين والمتابعة اليومية.",
    flowParams: ["Onboarding Complete", "Core Hub ➔ '/map'", "Interact w/ Nodes"]
  },
  {
    id: "diagnostic-funnel",
    name: "خريطة التشخيص المبدئي (Diagnostic Funnel)",
    codename: "DawayirApp / CanvasComponent",
    icon: Rocket,
    color: "amber",
    description: "الخريطة الخفيفة اللي بتظهر للمستخدم الجديد في نهاية الـ Landing Page بعد ما يجاوب الاختبار السريع. بتبني مسار أولي صدمي (Symptom-to-Root) قدام عينه.",
    purpose: "Conversion Engine - حافز للشراء وتوليد ليدز (Lead Generation) بقوة.",
    flowParams: ["Landing Page", "Pulse Check Quiz ➔ '/dawayir'", "Checkout Gate"]
  },
  {
    id: "history-map",
    name: "خريطة التاريخ الروحي (Consciousness History)",
    codename: "ConsciousnessHistoryMap",
    icon: History,
    color: "purple",
    description: "خريطة تتبعية (Time-machine) بترصد شكل وعي المستخدم وعلاقاته في الماضي.. الدواير الحمراء اللي بقت خضراء والعكس.",
    purpose: "Retention & Reflection - قياس تطور ونمو المستخدم الروحي على مدار الشهور.",
    flowParams: ["Core Hub", "Top Nav 'أرشيف الوعي'", "Timeline Interaction"]
  },
  {
    id: "recovery-roadmap",
    name: "خريطة التدخل الحي (Live Admin Canvas)",
    codename: "LiveAdminPanel",
    icon: Eye,
    color: "rose",
    description: "لوحة تحكم خفية للمديرين فقط، بتراقب نشاط اللايف، المستخدمين الحاليين في الـ Funnel، والجلسات اللي بتحصل في الريال تايم (Real Time).",
    purpose: "Sovereign Oversite - للتدخل وقت الجلسة أو المراقبة الاستراتيجية للرحلات الحية.",
    flowParams: ["Admin Auth", "Live URL ➔ '/live'", "Observer Mode"]
  },
  {
    id: "relational-models",
    name: "خرائط الرؤية المكانية (Alternative Layouts)",
    codename: "ForestView / FamilyTreeView",
    icon: GitBranch,
    color: "indigo",
    description: "نفس بيانات الخريطة الأساسية بس مرسومة بشكل خطي ومختلف (غابة / شجرة عائلة) لتوضيح الجذور العائلية وتشابك العلاقات.",
    purpose: "Cognitive Shifting - مساعدة المستخدم يشوف وضعه من منظور كلاسيكي بديل.",
    flowParams: ["Core Hub", "Layout Switcher Icon", "Toggle Geometry"]
  },
  {
    id: "recovery-roadmap",
    name: "مصفوفة مسار التعافي (Recovery Matrix)",
    codename: "RecoveryRoadmap",
    icon: Map,
    color: "teal",
    description: "بورد (Board) بيترسم بعد التشخيص، بيحط خطة علاجية تفاعلية بخطوات مدروسة يبني بيها حدوده التلقائية ويتدرب عليها.",
    purpose: "Actionable Path - وضع خطوات عملية لتحفيز الالتزام (Gamification).",
    flowParams: ["Diagnostic Canvas", "Post-Checkout / Map Action", "Progress Steps"]
  }
];

export const MapRegistryPanel: FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20" dir="rtl">
      
      {/* Header */}
      <div className="relative group overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-[#0B0F19] p-8 shadow-[0_0_40px_rgba(16,185,129,0.05)] ring-1 ring-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-slate-900 to-emerald-900/40 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Brain className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">دليل الخرائط المعمارية</h2>
              <p className="text-emerald-400/80 font-bold uppercase tracking-widest text-xs mt-1.5 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Sovereign Map Registry
              </p>
            </div>
          </div>
          <div className="text-left bg-slate-950/50 px-6 py-4 rounded-2xl border border-white/5 shadow-inner">
            <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-sm" dir="rtl">
              هذا الدليل يوثق جميع الخرائط البصرية في المنصة، معماريتها التقنية، والمسار الوظيفي (Flow) الخاص بها من أول دخول العميل حتى الاستقرار.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Maps */}
      <div className="grid gap-6 md:grid-cols-2">
        {ARCHITECTURES.map((arch, idx) => {
          const Icon = arch.icon;
          const colorStyles = {
            emerald: "text-emerald-400 border-emerald-500/30 from-emerald-500/10 to-transparent",
            amber: "text-amber-400 border-amber-500/30 from-amber-500/10 to-transparent",
            purple: "text-purple-400 border-purple-500/30 from-purple-500/10 to-transparent",
            rose: "text-rose-400 border-rose-500/30 from-rose-500/10 to-transparent",
            indigo: "text-indigo-400 border-indigo-500/30 from-indigo-500/10 to-transparent",
            teal: "text-teal-400 border-teal-500/30 from-teal-500/10 to-transparent",
          }[arch.color];

          const badgeStyles = {
            emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
            amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
            purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
            rose: "bg-rose-500/10 text-rose-300 border-rose-500/20",
            indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
            teal: "bg-teal-500/10 text-teal-300 border-teal-500/20",
          }[arch.color];

          return (
            <div 
              key={idx} 
              className="group flex flex-col rounded-[2rem] border border-slate-700/50 bg-[#0B0F19] overflow-hidden hover:border-slate-600 transition-all duration-300 shadow-xl"
            >
              {/* Card Header */}
              <div className={`p-6 border-b border-slate-800/80 bg-gradient-to-br ${colorStyles} flex items-start gap-4`}>
                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-slate-950/50 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-lg font-black text-white">{arch.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest border ${badgeStyles}`}>
                      {arch.codename}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col space-y-6 bg-gradient-to-b from-[#0B0F19] to-[#04060A]">
                
                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-[11px] uppercase tracking-widest text-slate-500 font-black">التوصيف التقني</h4>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {arch.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] uppercase tracking-widest text-slate-500 font-black">الهدف الاستراتيجي</h4>
                  <p className="text-[13px] text-slate-400 font-medium">
                    {arch.purpose}
                  </p>
                </div>

                <div className="flex-1" />

                {/* Flow Path */}
                <div className="pt-4 border-t border-slate-800/50">
                  <h4 className="text-[11px] uppercase tracking-widest text-slate-500 font-black mb-4">مسار التدفق (Flow Trace)</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {arch.flowParams.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-center gap-2">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono flex items-center shadow-inner">
                          {step}
                        </div>
                        {stepIdx < arch.flowParams.length - 1 && (
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
