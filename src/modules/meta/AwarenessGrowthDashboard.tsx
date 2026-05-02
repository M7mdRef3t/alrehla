import { useEffect, useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BrainCircuit,
  LineChart,
  MessageSquare,
  Workflow,
  Zap as Sparkles,
  GitMerge,
  Eye,
  HeartPulse,
  Quote,
  ShieldCheck,
} from "lucide-react";

import { useAuthState } from "@/domains/auth/store/auth.store";
import { fetchOverviewStats } from "@/services/admin/adminAnalytics";
import type { OverviewStats } from "@/services/admin/adminTypes";
import { ProductId } from "@/types/ecosystem";

interface AwarenessGrowthDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}


export const AwarenessGrowthDashboard: FC<AwarenessGrowthDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const { ecosystemData, displayName } = useAuthState();
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchOverviewStats().then(data => {
        if (data) setStats(data);
      }).catch(console.error);
    }
  }, [isOpen]);
  
  // Extract vector from analytics or fallback to ecosystemData or defaults
  const vector = ecosystemData?.awareness_vector || [60, 40, 55, 45, 30, 50];
  const activeSatellites = ecosystemData?.active_satellites || ["alrehla"];
  
  // Dynamic metrics mapped from OverviewStats
  const avgMood = stats?.avgMood ?? 0;
  const moodScale = avgMood > 10 ? avgMood : avgMood * 10; // Handle 0-10 vs 0-100 scales
  
  const emotional = stats ? moodScale : vector[0] || 0;
  const awareness = stats ? Math.max(0, 100 - (stats.awarenessGap?.gapPercent || 50)) : vector[1] || 0;
  const empathy = stats ? Math.min(100, (stats.conversionHealth?.addPersonDoneShowOnMap || 0) * 5 + 40) : vector[2] || 0;
  const flexibility = stats ? Math.max(0, 100 - (stats.verificationGapIndex || 40)) : vector[3] || 0;
  const conflict = stats ? Math.min(100, (stats.taskFriction?.length || 0) * 15 + 20) : vector[4] || 0;
  const communication = stats ? Math.min(100, (stats.flowStats?.addPersonCompletionRate || 50)) : vector[5] || 0;

  const currentPhase = activeSatellites.length > 3 ? "تكامل (Integration)" : activeSatellites.length > 1 ? "تعميق (Deepening)" : "بداية (Awakening)";

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
            className="absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70 transition-all"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 relative overflow-hidden">
               {/* Ambient Glow */}
               <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" />
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/4" />
               
               <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner border border-indigo-200/50 dark:border-indigo-700/30">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex gap-2 items-center mb-1">
                     <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-sm">
                       Insight Landscape
                     </span>
                      <span className="text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> المرحلة: {currentPhase}
                      </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    خريطة نمو الوعي التراكمية
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    نظرة شاملة على تطور أبعاد الوعي الذاتي والذكاء العاطفي (EQ) عبر الزمن.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-3 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500 transition-colors relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar text-right">

              {/* AI Synthesis Banner */}
              <section>
                 <div className="bg-gradient-to-l from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-500/30 text-indigo-50 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <Workflow className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 flex-1">
                       <div className="inline-flex items-center gap-2 bg-indigo-500/20 backdrop-blur-sm border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold mb-4 text-indigo-200">
                         <Sparkles className="w-3 h-3" /> ملخص الوعي الاصطناعي المركزي
                       </div>
                        <p className="text-xl sm:text-2xl font-medium text-white leading-relaxed italic pr-4 border-r-4 border-indigo-500">
                          "{displayName || "أيها المسافر"}، أنت حالياً في مرحلة <strong className="text-indigo-300 font-black">{currentPhase}</strong>. 
                          {awareness > 50 
                            ? " لقد أظهرت نمواً ملحوظاً في الوعي الذاتي. " 
                            : " رحلتك في الاستكشاف بدأت تؤتي ثمارها. "}
                          {flexibility < 40 
                            ? "التركيز القادم سيكون على تعزيز 'المرونة النفسية' في مواقف الضغط." 
                            : "استمر في تعزيز روابط التواصل العميقة."}"
                        </p>
                    </div>
                 </div>
              </section>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Insight Points */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                     <div>
                         <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">مستوى الوعي</p>
                         <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{Math.round(awareness)}%</p>
                     </div>
                     <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500">
                        <Eye className="w-6 h-6" />
                     </div>
                  </div>
                  {/* Empathy Score */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                     <div>
                         <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الذكاء العاطفي (EQ)</p>
                         <p className="text-3xl font-black text-rose-500 dark:text-rose-400">{Math.round(empathy)}%</p>
                     </div>
                     <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-500">
                        <HeartPulse className="w-6 h-6" />
                     </div>
                  </div>
                  {/* Emotional Resilience */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                     <div>
                         <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">المرونة النفسية</p>
                         <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400">
                           {Math.round(flexibility)}%
                         </p>
                     </div>
                     <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500">
                        <ShieldCheck className="w-6 h-6" />
                     </div>
                  </div>
               </div>

               {/* Flex Layout for Linguistic Analysis and Timeline */}
               <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                 
                 {/* Right Column (Timeline - Takes 3 Cols) */}
                 <div className="lg:col-span-3 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-6">
                      <LineChart className="w-5 h-5 text-teal-500" /> الخط الزمني للاكتشافات (Discovery Timeline)
                    </h3>
                    
                    <div className="relative border-r-2 border-slate-200 dark:border-slate-700 pr-6 space-y-8 pb-4">
                       
                       {(stats?.topScenarios && stats.topScenarios.length > 0) ? (
                         stats.topScenarios.slice(0, 4).map((scenario, index) => {
                           const colors = [
                             { bg: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", hover: "hover:border-teal-400 dark:hover:border-teal-500" },
                             { bg: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", hover: "hover:border-sky-400 dark:hover:border-sky-500" },
                             { bg: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", hover: "hover:border-indigo-400 dark:hover:border-indigo-500" },
                             { bg: "bg-violet-500", text: "text-violet-800 dark:text-violet-300", hover: "hover:border-violet-400 dark:hover:border-violet-500" }
                           ];
                           const c = colors[index % colors.length];
                           const isCurrent = index === 0;

                           return (
                             <div key={index} className="relative">
                                {isCurrent ? (
                                  <div className={`absolute -right-[39px] ${c.bg} w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg`}>
                                     <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                  </div>
                                ) : (
                                  <div className={`absolute -right-[35px] ${c.bg} w-4 h-4 rounded-full border-4 border-white dark:border-slate-900`} />
                                )}
                                <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm ${c.hover} transition-colors group`}>
                                   <div className="flex justify-between items-center mb-2">
                                      <h4 className={`font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:${c.text.split(' ')[0]} dark:group-hover:${c.text.split(' ')[1]} transition-colors`}>
                                         {scenario.label}
                                      </h4>
                                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                         {isCurrent ? "الآن المباشر" : `نسبة الظهور: ${Math.round(scenario.percentage || scenario.count || 0)}%`}
                                      </span>
                                   </div>
                                   <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                      تم رصد هذا النمط بشكل ملحوظ في تفاعلاتك الأخيرة، مما يدل على نقطة ارتكاز في تطورك المعرفي الحالي.
                                   </p>
                                </div>
                             </div>
                           );
                         })
                       ) : (
                         <>
                           {/* Timeline Item 1 */}
                           <div className="relative">
                              <div className="absolute -right-[35px] bg-teal-500 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900" />
                              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:border-teal-400 dark:hover:border-teal-500 transition-colors group">
                                 <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                       اكتشاف الروابط و "الاعتماد العاطفي"
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">١٥ سبتمبر ٢٠٢٣</span>
                                 </div>
                                 <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                    تم تحديد وفهم جذور اختراق الحدود الشخصية وعلاقتها بالديناميكيات المخزنة من مرحلة الطفولة وتأثير توقعات الوالدين.
                                 </p>
                              </div>
                           </div>


                           {/* Timeline Item 2 */}
                           <div className="relative">
                              <div className="absolute -right-[35px] bg-sky-500 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900" />
                              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:border-sky-400 dark:hover:border-sky-500 transition-colors group">
                                 <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                       الارتباط الآمن واستقرار الانفعالات
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">٢ نوفمبر ٢٠٢٣</span>
                                 </div>
                                 <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                    أول مرة تشعر فيها بالأمان الكامل في التعبير عن الاحتياجات بصدق. سجلت السجلات خلو 14 يوماً متواصلة من أية استجابات انسحابية Avoidant.
                                 </p>
                              </div>
                           </div>

                           {/* Timeline Item 3 */}
                           <div className="relative">
                              <div className="absolute -right-[35px] bg-indigo-500 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900" />
                              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group">
                                 <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                       تفكيك مساحات "الظل"
                                    </h4>
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">٢٠ ديسمبر ٢٠٢٣</span>
                                 </div>
                                 <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                    مواجهة الجوانب المرفوضة من الشخصية بوعي تام ورسم أول "خريطة صراع داخلي" بوضوح لمعرفة بؤر الاحتكاك.
                                 </p>
                              </div>
                           </div>

                           {/* Timeline Item 4 (Current) */}
                           <div className="relative">
                              <div className="absolute -right-[39px] bg-violet-500 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg shadow-violet-500/50">
                                 <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              </div>
                              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 p-5 rounded-2xl shadow-md">
                                 <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-lg text-violet-800 dark:text-violet-300">
                                       التكامل الكلي
                                    </h4>
                                    <span className="text-xs font-bold text-violet-500 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-2 py-1 rounded-md">الآن المباشر</span>
                                 </div>
                                 <p className="text-sm text-violet-700 dark:text-violet-200 font-medium leading-relaxed">
                                    إغلاق القنوات الهروبية وبداية مرحلة جديدة من السلام الداخلي والشجاعة المعرفية المستقرة.
                                 </p>
                              </div>
                           </div>
                         </>
                       )}

                    </div>
                 </div>

                 {/* Left Column (Linguistics & Focus Constraints - Takes 2 Cols) */}
                 <div className="lg:col-span-2 space-y-6">
                    {/* Linguistic Pattern Modul */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                       <Quote className="absolute top-4 left-4 w-24 h-24 text-slate-200/50 dark:text-slate-700/30 -scale-x-100" />
                       <div className="relative z-10">
                          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-4">
                            <MessageSquare className="w-5 h-5 text-sky-500" /> الأنماط اللغوية المستخرجة (AI)
                          </h3>
                          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm mb-4">
                             <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">الكلمة الرائجة المركزية:</span>
                                <span className="text-sm font-black bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-md">
                                  "{stats?.topScenarios?.[0]?.label || "حدود"}"
                                </span>
                             </div>
                             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                "لقد ظهرت كلمة <strong className="text-slate-700 dark:text-slate-200">{stats?.topScenarios?.[0]?.label || "الحدود"}</strong> بشكل متكرر بنسبة <strong className="text-emerald-500">+{Math.round(stats?.topScenarios?.[0]?.percentage || 42)}%</strong> في سجلات الجلسات الأخيرة مقارنة بالماضي، مما يدل بقوة على تحول إدراكي واعٍ وممنهج نحو وضع سياسات 'الحفظ الذاتي' (Self-Preservation) ضمن بيئتك."
                             </p>
                          </div>
                      </div>
                    </div>

                    {/* EQ vs IQ comparison */}
                    <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl" />
                       <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
                       
                       <div className="relative z-10">
                          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-100 mb-4">
                            <GitMerge className="w-5 h-5 text-rose-400" /> تطور الـ EQ مقابل الـ IQ
                          </h3>
                           <div className="space-y-4">
                              <p className="text-sm text-slate-300 leading-relaxed font-medium mb-4">
                                {conflict < 40 
                                  ? "صراعاتك الداخلية في تراجع، مما يفسح المجال لاستيعاب أعمق لنوايا الآخرين." 
                                  : "هناك بعض الصراعات الداخلية النشطة التي تتطلب انتباهاً في مرحلة 'الظل'."}
                              </p>
                              
                              {/* Progress Bars */}
                              <div className="space-y-3">
                                 <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                       <span>التحليل المنطقي (IQ Mode)</span>
                                       <span>{Math.round(awareness)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-slate-600 rounded-full transition-all duration-1000" style={{ width: `${Math.round(awareness)}%` }} />
                                    </div>
                                 </div>
                                 <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                                       <span className="text-rose-400">الاستيعاب العاطفي (EQ Mode)</span>
                                       <span className="text-rose-400">{Math.round(empathy)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${Math.round(empathy)}%` }} />
                                    </div>
                                 </div>
                              </div>
                           </div>
                       </div>
                    </div>
                    
                 </div>
              </div>


            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
