import React, { useState, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Globe,
  TrendingUp,
  MessageCircle,
  Medal,
  Quote,
  Sparkles,
  Users,
  Award,
  BookOpen,
  BrainCircuit,
} from "lucide-react";

interface CommunityImpactDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityImpactDashboard: FC<CommunityImpactDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTravelers, setActiveTravelers] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    // Generate a pseudo-random number based on current time (always between 380 and 450)
    const updatePulse = () => {
       const base = 400;
       const variance = Math.floor((Date.now() / 60000) % 50) - 20; // -20 to +30 based on minute
       const fastJitter = Math.floor(Math.random() * 5) - 2; // small rapid shifts
       setActiveTravelers(base + variance + fastJitter);
    };
    
    updatePulse();
    const interval = setInterval(updatePulse, 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

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
            className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 md:p-8 border-b border-orange-200/30 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-950/20 relative overflow-hidden">
               {/* Ambient Glow */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 dark:bg-orange-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
               
               <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-2xl shadow-inner border border-orange-200/50 dark:border-orange-800/30">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex gap-2 items-center mb-1">
                     <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-sm">
                       Ripple Effect
                     </span>
                     <span className="text-[10px] font-bold tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                       <TrendingUp className="w-3 h-3" /> التقرير الشهري للتأثير
                     </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    إحصائيات التأثير المجتمعي الشاملة
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                     قياس صدى استبصاراتك النفسية ومساهمتك الفكرية في إلهام الآخرين.
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

            {/* THE ANONYMOUS GLOBAL PULSE BANNER */}
            <div className="w-full bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-center gap-3">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </span>
               <p className="text-xs font-bold text-slate-300">
                  <span className="text-emerald-400 mx-1">{activeTravelers}</span> 
                  مسافر مجهول ينظمون فوضاهم الإدراكية في الملاذ الآن. لست وحدك في مسارك.
               </p>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar text-right">

              {/* Core Metrics Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Total Reach */}
                 <div className="bg-gradient-to-tr from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-transform">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex items-start justify-between">
                       <div>
                          <div className="inline-flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-sm">
                             <TrendingUp className="w-3 h-3" /> ارتفاع بنسبة 12%
                          </div>
                          <p className="text-5xl font-black mb-2 shadow-sm text-transparent bg-clip-text bg-gradient-to-b from-white to-orange-100 drop-shadow-sm">10,480</p>
                          <p className="text-orange-100 font-bold text-lg">حياة تم الوصول إليها</p>
                       </div>
                       <Users className="w-12 h-12 text-white/50" />
                    </div>
                 </div>

                 {/* Seeds Sown */}
                 <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-transform">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
                    <div className="relative z-10 flex items-start justify-between">
                       <div>
                          <div className="inline-flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full text-xs font-bold mb-4 border border-slate-700 text-slate-300">
                             <BookOpen className="w-3 h-3" /> سلاسل فكرية نشطة
                          </div>
                          <p className="text-5xl font-black mb-2 text-white">450<span className="text-2xl text-slate-500 font-bold">/500</span></p>
                          <p className="text-slate-400 font-bold text-lg">بذور وعي تم زرعها (Seeds Sown)</p>
                       </div>
                       <Sparkles className="w-12 h-12 text-slate-700 group-hover:text-amber-400 transition-colors duration-500" />
                    </div>
                 </div>
              </div>

              {/* Milestones & Badges Grid */}
              <div className="space-y-4">
                 <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                   <Medal className="w-5 h-5 text-amber-500" /> أوسمة التأثير والإنجازات
                 </h3>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Badge 1 */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3">
                       <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-400 dark:border-zinc-500 shadow-sm relative">
                          <Medal className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">الفئة الفضية</h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-1">تجاوز 10 آلاف حياة</p>
                       </div>
                    </div>
                    {/* Badge 2 */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden">
                       <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center border-2 border-amber-400 dark:border-amber-500 shadow-sm">
                          <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">أعلى 1% استعطاف</h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-1">إجماع مجتمعي عالمي</p>
                       </div>
                    </div>
                    {/* Badge 3 */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3">
                       <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/50 rounded-full flex items-center justify-center border-2 border-sky-400 dark:border-sky-500 shadow-sm">
                          <BrainCircuit className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">مهندس البصيرة</h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-1">زراعة 500 حبة وعي</p>
                       </div>
                    </div>
                    {/* Badge 4 */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3">
                       <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center border-2 border-purple-400 dark:border-purple-500 shadow-sm">
                          <Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">محفز ثقافي</h4>
                          <p className="text-[10px] text-slate-500 font-medium mt-1">الوصول لـ 38 دولة (الهدف 50)</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Flex Layout for Top Insights and Community Echoes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 
                 {/* Right Column: Top Resonance Insights */}
                 <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-2">
                      <Sparkles className="w-5 h-5 text-orange-500" /> البصائر الأكثر صدى (Aha! Moments)
                    </h3>
                    
                    <div className="space-y-4">
                       {/* Insight 1 */}
                       <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 relative group">
                          <Quote className="absolute top-4 left-4 w-12 h-12 text-slate-100 dark:text-slate-700/50 -scale-x-100 group-hover:text-orange-50 dark:group-hover:text-orange-900/20 transition-colors" />
                          <h4 className="text-sm font-black text-orange-600 dark:text-orange-400 mb-3 block relative z-10">مفارقة الهشاشة (The Vulnerability Paradox)</h4>
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed relative z-10 italic">
                             "القوة الحقيقية ليست في غياب الضعف، بل في الشجاعة للكشف عنه داخل مساحاتنا الآمنة."
                          </p>
                       </div>

                       {/* Insight 2 */}
                       <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 relative group">
                          <Quote className="absolute top-4 left-4 w-12 h-12 text-slate-100 dark:text-slate-700/50 -scale-x-100 group-hover:text-orange-50 dark:group-hover:text-orange-900/20 transition-colors" />
                          <h4 className="text-sm font-black text-orange-600 dark:text-orange-400 mb-3 block relative z-10">أنماط الصدى الإدراكي</h4>
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed relative z-10 italic">
                             "غالباً ما نبحث عن شركاء يعكسون ماضينا غير المحسوم، آملين في نهاية مختلفة هذه المرة."
                          </p>
                       </div>

                       {/* Insight 3 */}
                       <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 relative group">
                          <Quote className="absolute top-4 left-4 w-12 h-12 text-slate-100 dark:text-slate-700/50 -scale-x-100 group-hover:text-orange-50 dark:group-hover:text-orange-900/20 transition-colors" />
                          <h4 className="text-sm font-black text-orange-600 dark:text-orange-400 mb-3 block relative z-10">وضوح الأجداد (Ancestral Clarity)</h4>
                          <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed relative z-10 italic">
                             "تحديد 'صمت الجدات' يكسر الحلقات المفرغة الموروثة لبنات اليوم."
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Left Column: Community Echoes */}
                 <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-2">
                      <MessageCircle className="w-5 h-5 text-indigo-500" /> أصداء المجتمع (Community Echoes)
                    </h3>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 hidden-scrollbar space-y-2 relative">
                        {/* Echo 1 */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">M</div>
                                 <div>
                                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Marcus Thorne</h5>
                                    <span className="text-[10px] text-slate-400">منذ ٣ أيام</span>
                                 </div>
                              </div>
                           </div>
                           <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                              "استبصارك حول 'ازدواجية الخوف' غيّر حرفياً وجهة نظري تجاه التحول الوظيفي الذي أمر به. شكراً لك على هذا الوضوح."
                           </p>
                        </div>

                        {/* Echo 2 */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center font-bold">E</div>
                                 <div>
                                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Elena Sofia</h5>
                                    <span className="text-[10px] text-slate-400">منذ أسبوع</span>
                                 </div>
                              </div>
                           </div>
                           <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                              "أصبحت تأملاتك طقسي الصباحي المفضل. كلماتك هي 'البذور' التي تساعد أفكاري الخاصة على التفتح يومياً."
                           </p>
                        </div>

                        {/* Echo 3 */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold">A</div>
                                 <div>
                                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dr. Aris Varma</h5>
                                    <span className="text-[10px] text-slate-400">منذ أسبوعين</span>
                                 </div>
                              </div>
                           </div>
                           <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                              "دقة البيانات هنا تضاهي بامتياز عمق التجربة الإنسانية. طريقة ثورية حقيقية لتتبع التأثير العاطفي على الآخرين."
                           </p>
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
