import { useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  HeartHandshake,
  BrainCircuit,
  Sparkles,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Target,
} from "lucide-react";

interface RelationshipAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = "test" | "results";

export const RelationshipAnalysisModal: FC<RelationshipAnalysisModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("test");

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
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 transition-all"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-slate-50 dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
             {/* Header Panel */}
             <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md relative z-20">
               {/* Ambient Glow */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 dark:bg-rose-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
               <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/5 dark:bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" />
               
               <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-800/50">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex gap-2 items-center mb-1">
                     <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-sm">
                       Insight Analyst
                     </span>
                     <span className="text-[10px] font-bold tracking-wider text-rose-600 dark:text-rose-400">
                       Relations Analysis Engine
                     </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {viewMode === "test" ? "اختبار تحليل العلاقات" : "نتائج تحليل العلاقة الشامل"}
                  </h2>
                </div>
              </div>
              
              <div className="flex items-center gap-2 relative z-10">
                {/* View Toggle */}
                <div className="bg-slate-200/40 dark:bg-slate-800/50 p-1 flex rounded-xl border border-app-border mr-4">
                  <button
                    onClick={() => setViewMode("test")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      viewMode === "test"
                        ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    الاختبار
                  </button>
                  <button
                    onClick={() => setViewMode("results")}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      viewMode === "results"
                        ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    النتائج
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
               
               <AnimatePresence mode="wait">
                 {/* -------------------- TEST MODE -------------------- */}
                 {viewMode === "test" && (
                   <motion.div
                     key="test-mode"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     transition={{ duration: 0.2 }}
                     className="absolute inset-0 p-6 md:p-10 flex flex-col items-center justify-center text-right bg-slate-50 dark:bg-slate-900"
                   >
                      <div className="w-full max-w-2xl mx-auto space-y-8">
                         
                         {/* Progress Bar */}
                         <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400">
                               <span>Test Progress</span>
                               <span className="text-rose-500">65% Completed</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-rose-400 to-violet-500 rounded-full w-[65%]" />
                            </div>
                         </div>

                         {/* Question Container */}
                         <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 dark:border-white/10 text-center">
                            <span className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-4 py-1.5 rounded-full text-xs font-bold mb-6">
                               <Sparkles className="w-3 h-3 text-violet-500" /> Question 12 of 30
                            </span>
                            
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-normal mb-6 text-center">
                               كيف تصف جودة تواصلك مع شريكك في أوقات الخلاف؟
                            </h1>
                            
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-10 text-center max-w-sm mx-auto leading-relaxed">
                               إجاباتك تساعد المحلل الذكي في تكوين رؤية شاملة حول ديناميكيات العلاقة. كن صادقاً مع نفسك.
                            </p>

                            {/* Response Options (Simulated) */}
                            <div className="space-y-3">
                               {[
                                  "نتوقف عن الحديث ونأخذ مساحة صامتة طويلاً",
                                  "نستطيع التعبير عن مشاعرنا ولكن بحدة وانفعال",
                                  "نحافظ على الاحترام ونحاول إيجاد أرضية مشتركة",
                                  "أتجنب الخلاف تماماً لإبقاء السلام"
                               ].map((option, idx) => (
                                  <button
                                    key={idx}
                                    className="w-full p-4 border border-slate-200 dark:border-white/10 hover:border-violet-400 rounded-2xl text-slate-900 dark:text-white font-bold text-sm bg-slate-50 dark:bg-slate-900/50 hover:bg-violet-50 dark:hover:bg-violet-900/10 hover:text-violet-700 dark:hover:text-violet-300 transition-all text-right shadow-sm"
                                  >
                                    {option}
                                  </button>
                               ))}
                            </div>
                         </div>

                         {/* Navigation Buttons */}
                         <div className="flex justify-between items-center px-4">
                            <button className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                               <ArrowRight className="w-4 h-4" /> السابق
                            </button>
                            <button 
                               onClick={() => setViewMode("results")}
                               className="flex items-center gap-2 text-sm font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 rounded-full hover:bg-violet-600 dark:hover:bg-violet-500 transition-colors shadow-lg"
                            >
                               التالي <ArrowLeft className="w-4 h-4" />
                            </button>
                         </div>

                      </div>
                   </motion.div>
                 )}

                 {/* -------------------- RESULTS MODE -------------------- */}
                 {viewMode === "results" && (
                   <motion.div
                     key="results-mode"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.2 }}
                     className="absolute inset-0 p-6 md:p-8 flex flex-col gap-8 text-right bg-slate-50 dark:bg-slate-900"
                   >
                      {/* Nav Bar Simulation */}
                      <div className="flex items-center justify-center gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
                         {["Analysis", "Growth", "History", "Community"].map((tab, idx) => (
                            <span key={idx} className={`text-xs font-bold uppercase tracking-wider px-3 py-1 ${idx === 0 ? "text-rose-600 dark:text-rose-400 border-b-2 border-rose-500" : "text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"}`}>
                               {tab}
                            </span>
                         ))}
                      </div>

                      {/* Main Summary Banner */}
                      <div className="bg-gradient-to-br from-violet-600 to-indigo-900 dark:from-violet-900 dark:to-slate-900 rounded-3xl p-8 md:p-10 shadow-xl border border-violet-500/20 text-white relative overflow-hidden flex flex-col items-center text-center">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                         <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                         
                         <Sparkles className="w-8 h-8 text-rose-300 mb-4" />
                         <h1 className="text-3xl md:text-4xl font-black mb-4">تحليل عميق للعلاقة</h1>
                         <p className="text-lg md:text-xl font-medium text-violet-50 max-w-2xl leading-relaxed opacity-90">
                            "أنت وشريكك تظهران انسجاماً استثنائياً في القيم الجوهرية والرؤية المستقبلية. هذا التوزيع يشير إلى علاقة مبنية على أسس متينة من الاحترام المتبادل."
                         </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         
                         {/* AI Insights Card */}
                         <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                               <BrainCircuit className="w-6 h-6 text-violet-500" /> رؤى الذكاء الاصطناعي
                            </h3>
                            
                            <div className="space-y-4">
                               {/* Insight 1 */}
                               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:border-violet-300 transition-colors">
                                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">ارتباط عاطفي عميق</h4>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                     تمتلكان قدرة فطرية على استشعار احتياجات بعضكما البعض قبل التعبير عنها لفظياً، مما يخلق بيئة من الأمان العاطفي الدائم.
                                  </p>
                               </div>

                               {/* Insight 2 */}
                               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:border-violet-300 transition-colors">
                                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">التعبير اللفظي المباشر</h4>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                     بينما الانسجام العاطفي عالٍ، قد يستفيد الطرفان من وضوح أكبر في التعبير عن الاحتياجات المادية واللوجستية لتجنب سوء الفهم.
                                  </p>
                               </div>

                               {/* Insight 3 */}
                               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:border-violet-300 transition-colors">
                                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">التوازن بين الاستقلال والتبعية</h4>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                     تحافظان على هويات فردية قوية مع الالتزام بالشراكة، وهو مفتاح طول أمد العلاقات الصحية في العصر الحديث.
                                  </p>
                               </div>
                            </div>
                         </div>

                         {/* Action Plan Card */}
                         <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                               <Target className="w-6 h-6 text-rose-500" /> خطة العمل المقترحة
                            </h3>

                            <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 rounded-3xl p-6 relative">
                               <ClipboardCheck className="absolute top-4 left-4 w-20 h-20 text-rose-500/5 dark:text-rose-900/20 -scale-x-100" />
                               
                               <div className="relative z-10 space-y-6 text-right">
                                  {/* Task 1 */}
                                  <div className="flex gap-4 items-start">
                                     <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0 mt-1">1</div>
                                     <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">جلسة "الوضوح الأسبوعية"</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                           تخصيص 30 دقيقة كل يوم جمعة لمناقشة المشاعر والاحتياجات دون مقاطعة.
                                        </p>
                                     </div>
                                  </div>
                                  
                                  {/* Task 2 */}
                                  <div className="flex gap-4 items-start">
                                     <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0 mt-1">2</div>
                                     <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">لغة تقدير جديدة</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                           التدرب على التعبير الصريح عن الامتنان لثلاثة أفعال بسيطة يقوم بها الشريك يومياً.
                                        </p>
                                     </div>
                                  </div>

                                  {/* Task 3 */}
                                  <div className="flex gap-4 items-start">
                                     <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0 mt-1">3</div>
                                     <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">مشروع مشترك جديد</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                           البدء في هواية أو نشاط لم يسبق لأي منكما تجربته لتعزيز روح الفريق والانتماء.
                                        </p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            {/* CTA Box */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                               <div className="text-right">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">هل أنت مستعد للمرحلة التالية؟</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">شارك النتائج المبدئية مع شريكك لتعزيز الحوار المفتوح.</p>
                                </div>
                                <button className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold text-sm w-full md:w-auto shrink-0 hover:scale-105 transition-transform shadow-md">
                                   تصدير التقرير
                                </button>
                            </div>

                         </div>
                      </div>

                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


