import { useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Map,
  Target,
  Clock,
  BookOpen,
  History,
  HelpCircle,
  Lock,
  CheckCircle2,
  Circle,
  Brain,
  ShieldAlert,
  Activity,
  PlayCircle,
  Headphones,
  Compass,
  Volume2,
} from "lucide-react";
import { therapeuticVoice } from "../services/voiceSynthesis";

interface RecoveryPathwaysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecoveryPathwaysModal: FC<RecoveryPathwaysModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("roadmap");

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 bg-slate-900/70 dark:bg-slate-950/80 transition-all"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl h-[88vh] flex flex-col bg-slate-50 dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Panel */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-50/80 dark:bg-emerald-950/20 backdrop-blur-md relative z-20">
               {/* Ambient Glow */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
               
               <div className="flex items-center gap-5 relative z-10">
                <div className="p-3.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex gap-2 items-center mb-1.5">
                     <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-sm">
                       Ethereal Analyst
                     </span>
                     <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                       Phase: Introspection
                     </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    خارطة طريق التغيير السلوكي
                  </h2>
                </div>
              </div>
              
              <div className="flex items-center relative z-10">
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
               {/* Left Navigation Sidebar (desktop) */}
               <div className="hidden md:flex flex-col w-64 bg-white/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  {[
                     { id: "analysis", label: "التحليل النفسي", icon: Brain },
                     { id: "roadmap", label: "خارطة الطريق", icon: Map },
                     { id: "goals", label: "الأهداف السلوكية", icon: Target },
                     { id: "plan", label: "خطة العمل", icon: Clock },
                     { id: "library", label: "المكتبة", icon: BookOpen },
                     { id: "history", label: "السجل", icon: History },
                     { id: "support", label: "الدعم والمساعدة", icon: HelpCircle },
                     { id: "privacy", label: "الخصوصية", icon: Lock },
                  ].map((item) => {
                     const Icon = item.icon;
                     const isActive = activeTab === item.id;
                     return (
                        <button
                           key={item.id}
                           onClick={() => setActiveTab(item.id)}
                           className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-right w-full ${
                              isActive 
                                 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" 
                                 : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                           }`}
                        >
                           <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                           {item.label}
                        </button>
                     );
                  })}
               </div>

               {/* Main Scrollable Content */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50 text-right">
                  
                  {activeTab === "roadmap" && (
                     <div className="max-w-4xl mx-auto space-y-10 mb-10">
                        {/* Intro Banner */}
                        <div className="bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                           <div className="absolute right-0 top-0 w-2 h-full bg-emerald-400" />
                           <div className="flex-1">
                              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-3">مسار التطور المخصص لـ 12 أسبوعاً</h3>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                 تطور شخصي مبني على جلسة الاستبطان العميقة الخاصة بك. ننتقل بأسلوب استراتيجي من مجرد "التعرف على ظلال الوعي" إلى "دمج الأنماط السلوكية الجديدة" في حياتك اليومية.
                              </p>
                           </div>
                           <button 
                              onClick={() => therapeuticVoice.playTherapeuticVoice("أهلاً بك يا صديقي في مسار التعافي المخصص. لا تستعجل، خذ نفساً عميقاً، وابدأ بالتعرف على محفزاتك ببطء، نحن هنا لدعمك.")}
                              className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-100/50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-2xl font-bold transition-all"
                           >
                               <Volume2 className="w-5 h-5" />
                               <span className="text-sm">اسْتَمِع للإرشاد الروحي</span>
                           </button>
                        </div>

                        {/* Transformation Timeline */}
                        <div className="space-y-6 relative">
                           <div className="absolute top-8 bottom-8 right-6 w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                           
                           {[
                              { 
                                 weeks: "أسابيع 1 - 4", 
                                 title: "التعرف على المحفزات", 
                                 desc: "تحديد المحفزات الأساسية ومراقبة الاستجابات الجسدية (Somatic responses) بصورة مباشرة في بيئة العمل والعلاقات المتوترة.",
                                 color: "text-rose-500", 
                                 bg: "bg-rose-100 dark:bg-rose-900/30",
                                 border: "border-rose-200 dark:border-rose-800" 
                              },
                              { 
                                 weeks: "أسابيع 5 - 8", 
                                 title: "إعادة الضبط ورسم الحدود", 
                                 desc: "تطبيق أدوات ونصوص وضع الحدود (Boundary-setting scripts) وإجراء إعادة ضبط فسيولوجية متعمدة أثناء لحظات الطغيان.",
                                 color: "text-amber-500", 
                                 bg: "bg-amber-100 dark:bg-amber-900/30",
                                 border: "border-amber-200 dark:border-amber-800" 
                              },
                              { 
                                 weeks: "أسابيع 9 - 12", 
                                 title: "الاستدامة والاندماج", 
                                 desc: "استدامة التغيير السلوكي من خلال التجارب الاجتماعية المدروسة والانعكاس المجتمعي الإيجابي مع الدوائر الآمنة.",
                                 color: "text-emerald-500", 
                                 bg: "bg-emerald-100 dark:bg-emerald-900/30",
                                 border: "border-emerald-200 dark:border-emerald-800" 
                              }
                           ].map((phase, idx) => (
                              <div key={idx} className="flex gap-6 items-start relative z-10">
                                 <div className={`w-12 h-12 rounded-full ${phase.bg} border-4 border-slate-50 dark:border-slate-900 flex flex-col items-center justify-center shrink-0`}>
                                    <span className={`text-[10px] font-black ${phase.color}`}>{idx + 1}</span>
                                 </div>
                                 <div className={`flex-1 bg-white dark:bg-slate-800 border ${phase.border} p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow`}>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                                       <span className={`text-xs font-black uppercase tracking-wider ${phase.color} bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg w-fit`}>{phase.weeks}</span>
                                       <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{phase.title}</h4>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{phase.desc}</p>
                                 </div>
                              </div>
                           ))}
                        </div>

                        {/* Core Objectives Section */}
                        <div className="space-y-6">
                           <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                              <Target className="w-6 h-6 text-emerald-500" /> الأهداف السلوكية الجوهرية (Core Objectives)
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-slate-100 dark:bg-slate-800/80 p-5 rounded-2xl">
                                 <Brain className="w-6 h-6 text-violet-500 mb-3" />
                                 <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">تحديد المحفزات اللاواعية</h4>
                                 <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">رسم التفاعلات التلقائية الموروثة من أنماط الطفولة وإدراكها أثناء التواصل الاجتماعي.</p>
                              </div>
                              <div className="bg-slate-100 dark:bg-slate-800/80 p-5 rounded-2xl">
                                 <ShieldAlert className="w-6 h-6 text-rose-500 mb-3" />
                                 <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">تحسين مهارات رسم الحدود</h4>
                                 <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">الحد من دوافع إرضاء الآخرين (People-pleasing) عبر التدرب على نصوص الرفض الحيادي.</p>
                              </div>
                              <div className="bg-slate-100 dark:bg-slate-800/80 p-5 rounded-2xl">
                                 <Activity className="w-6 h-6 text-cyan-500 mb-3" />
                                 <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">تعزيز الوعي الجسدي</h4>
                                 <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">تطوير حواس (Interoception) لالتقاط التوتر الجسدي قبل أن يتبلور كطغيان وإرهاق إدراكي.</p>
                              </div>
                           </div>
                        </div>

                        {/* Week 1 Actionable Checklist */}
                        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden text-white shadow-xl">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl" />
                           
                           <h3 className="text-xl font-black flex items-center gap-3 mb-6 relative z-10">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" /> قائمة مهام الأسبوع الأول
                           </h3>
                           
                           <div className="space-y-4 relative z-10">
                              {[
                                 { title: "التأمل اليقظ اليومي (5 دقائق)", desc: "التركيز على التنفس الحجابي المريح قبل جميع اجتماعات العمل.", done: true },
                                 { title: "تدوين الاستجابات العاطفية", desc: "تسجيل 3 أوقات شعرت فيها بالـ 'استنزاف' أو 'الاستفزاز' خلال الأسبوع.", done: false },
                                 { title: "تحديد مرساة الأمان (Safe Anchor)", desc: "اختيار غرض مادي ملموس للتمسك به لإعادة التوازن أثناء التوتر.", done: false },
                                 { title: "تجربة قول (لا)", desc: "رفض طلب واحد غير أساسي خلال هذا الأسبوع دون تقديم أي تبريرات أو اعتذار مفرط.", done: false },
                              ].map((task, idx) => (
                                 <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-slate-800 ${task.done ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-slate-800/50 border-slate-700'}`}>
                                    {task.done ? (
                                       <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                                    ) : (
                                       <Circle className="w-6 h-6 text-slate-600 shrink-0" />
                                    )}
                                    <div>
                                       <h4 className={`font-bold text-sm mb-1 ${task.done ? 'text-emerald-400 line-through opacity-80' : 'text-slate-100'}`}>{task.title}</h4>
                                       <p className={`text-xs font-medium ${task.done ? 'text-slate-500 opacity-80' : 'text-slate-400'}`}>{task.desc}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>

                           <div className="mt-8 bg-black/30 border border-slate-700 rounded-2xl p-5 relative z-10">
                              <p className="font-bold text-sm text-slate-200 mb-2">💡 رأي الخبير (Expert Insight):</p>
                              <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                                 "تتنشط اللدونة العصبية (Neuroplasticity) بشكل كبير عندما نعطل الأنماط الأوتوماتيكية في البيئات منخفضة المخاطر والمحفزات، لذا ابدأ خطواتك ببطء وتأنٍ."
                              </p>
                           </div>
                        </div>

                        {/* Recommended Resources (Footer Banner) */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                           <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">مصادر مخصصة لك هذا الأسبوع:</p>
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">الجلسة القادمة ستتعمق في "مرآة الجسد والعقل". سنكتشف كيف يؤشر وضع جسدك إشارات العقل.</p>
                              <div className="flex gap-4">
                                 <button className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:shadow-md transition-shadow dark:text-slate-200">
                                    <BookOpen className="w-4 h-4 text-emerald-600" /> مقال لغة الجسد
                                 </button>
                                 <button className="flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md transition-all">
                                    <Headphones className="w-4 h-4" /> بودكاست إعادة الضبط (10د)
                                 </button>
                              </div>
                           </div>
                           <PlayCircle className="w-16 h-16 text-emerald-200 dark:text-emerald-900/40 hidden lg:block" />
                        </div>
                     </div>
                  )}

                  {activeTab !== "roadmap" && (
                     <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                         <Map className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                         <p className="text-lg font-bold text-slate-500 dark:text-slate-400">جاري تطوير هذا القسم</p>
                         <p className="text-sm font-medium text-slate-400 mt-2">يرجى العودة إلى شاشة "خارطة الطريق"</p>
                     </div>
                  )}
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
