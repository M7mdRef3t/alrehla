import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamificationState } from "../state/gamificationState";
import { useAchievementState } from "../state/achievementState";
import {
  X,
  BookOpen,
  Quote,
  Medal,
  Library,
  Target,
  Sparkles,
  BookMarked,
  Flame,
  Award,
  FastForward,
  Bookmark,
  CheckCircle2
} from "lucide-react";

interface MonthlyReadingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyReadingPlanModal: FC<MonthlyReadingPlanModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { level, rank } = useGamificationState();
  const { unlockedIds } = useAchievementState();

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
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white/85 dark:bg-slate-900/85 backdrop-blur-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
               <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner border border-emerald-200/50 dark:border-emerald-700/30">
                  <Library className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex gap-2 items-center mb-1">
                     <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-sm">
                       {rank}
                     </span>
                     <span className="text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                       <Sparkles className="w-3 h-3" /> Insight Level {level}
                     </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    خطة القراءة الشهرية
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    رحلتك الفكرية — نحو وعي إدراكي أعمق
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
              
              {/* Today's Focus */}
              <section>
                 <div className="bg-gradient-to-l from-emerald-600 to-teal-500 dark:from-emerald-900/80 dark:to-teal-900/80 rounded-2xl p-6 shadow-lg border border-emerald-400 dark:border-emerald-600/50 text-emerald-50 relative overflow-hidden flex items-center justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Target className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                       <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold mb-3">
                         <Target className="w-3 h-3" /> تركيز اليوم (Today's Focus)
                       </div>
                       <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                         اقرأ الفصل الثامن: تأثير المرآة
                         <span className="block text-lg font-medium text-emerald-100 opacity-90 mt-1">
                           من كتاب: عِلم الروابط العاطفية
                         </span>
                       </h3>
                    </div>
                     <div className="hidden sm:flex relative z-10 p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                        <BookOpen className="w-10 h-10 text-emerald-50" />
                     </div>
                 </div>
              </section>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 
                 {/* Current Shelf */}
                 <section className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-2">
                      <BookMarked className="w-5 h-5 text-indigo-500" /> جدول القراءة الحالي
                    </h3>
                    
                    {/* Book 1 */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm group hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex gap-4">
                       <div className="w-16 h-20 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg shrink-0 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/50">
                          <BookOpen className="w-8 h-8 text-indigo-500" />
                       </div>
                       <div className="flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">علم الروابط العاطفية</h4>
                          <p className="text-xs text-slate-500 mb-3">د. آريس ڤين (Dr. Aris Vane)</p>
                          <div className="bg-indigo-50 dark:bg-slate-700/50 p-2 rounded-lg inline-flex text-xs font-bold text-indigo-700 dark:text-indigo-400 items-center gap-2 w-full">
                             <Bookmark className="w-4 h-4" /> الموقف الحالي: الفصل 12 — المسارات العصبية
                          </div>
                       </div>
                    </div>

                    {/* Book 2 */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm group hover:border-teal-400 dark:hover:border-teal-600 transition-all flex gap-4">
                       <div className="w-16 h-20 bg-teal-100 dark:bg-teal-900/40 rounded-lg shrink-0 flex items-center justify-center border border-teal-200 dark:border-teal-800/50">
                          <BookOpen className="w-8 h-8 text-teal-500" />
                       </div>
                       <div className="flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">ذكاء التواصل</h4>
                          <p className="text-xs text-slate-500 mb-3">إيلينا غلاس (Elena Glass)</p>
                          <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg inline-flex text-xs font-bold text-teal-700 dark:text-teal-400 items-center gap-2 w-full">
                             <Bookmark className="w-4 h-4" /> الموقف الحالي: الفصل 4 — الصمت وما وراء النص
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Focus & Insights */}
                 <section className="space-y-6">
                    {/* Daily Reflection */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-inner relative">
                       <Quote className="absolute top-4 right-4 w-12 h-12 text-slate-200 dark:text-slate-700" />
                       <div className="relative z-10">
                          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-1">
                             <Sparkles className="w-5 h-5 text-amber-500" /> التأمل الفكري اليومي
                          </h3>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mb-4">اليوم، 09:42 ص</span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium text-lg italic pr-4 border-r-4 border-amber-400">
                            "مفهوم 'الانعكاس العاطفي المريء' يساعد على تفسير سبب شعوري بالإرهاق التام بعد الاجتماعات مع الأشخاص السلبيين. أنا أمتص القلق منهم بدون أن أفعل نظام الفلترة الداخلي."
                          </p>
                       </div>
                    </div>

                    {/* Upcoming Next */}
                    <div>
                       <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-4">
                         <FastForward className="w-5 h-5 text-sky-500" /> القادم في مسارك
                       </h3>
                       <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                           <div className="min-w-[200px] bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-xl p-4 shrink-0">
                               <p className="text-xs text-sky-600 dark:text-sky-400 font-bold mb-1">يبدأ خلال 4 أيام</p>
                               <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">الفن الدقيق للإصغاء</h5>
                           </div>
                           <div className="min-w-[200px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 shrink-0">
                               <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">يبدأ خلال 12 يوم</p>
                               <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">تفكيك أنماط التعلق</h5>
                           </div>
                       </div>
                    </div>
                 </section>

              </div>

               {/* Milestones Horizontal Row */}
               <section className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-6">
                    <Medal className="w-5 h-5 text-rose-500" /> محطات النجاح والإنجاز
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {/* Milestone 1 */}
                     <div className={`bg-white dark:bg-slate-800 border ${unlockedIds.length > 0 ? "border-emerald-500/50" : "border-slate-200 dark:border-slate-700"} rounded-xl p-4 flex items-center gap-4`}>
                        <div className={`w-12 h-12 ${unlockedIds.length > 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"} rounded-full flex items-center justify-center shrink-0`}>
                           <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">أول خطوة عميقة</h4>
                           <p className="text-xs text-slate-500 mt-1">{unlockedIds.length > 0 ? "مكتملة" : "ابدأ أول نشاط"}</p>
                        </div>
                     </div>
                     {/* Milestone 2 */}
                     <div className={`bg-white dark:bg-slate-800 border ${level >= 5 ? "border-amber-400/50" : "border-slate-200 dark:border-slate-700"} rounded-xl p-4 flex items-center gap-4 relative overflow-hidden`}>
                        <div className="absolute bottom-0 left-0 h-1 bg-amber-400 transition-all" style={{ width: `${Math.min(100, (level / 5) * 100)}%` }} />
                        <div className={`w-12 h-12 ${level >= 5 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"} rounded-full flex items-center justify-center shrink-0`}>
                           <Flame className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">الوعي المترابط</h4>
                           <p className="text-xs text-slate-500 mt-1">المستوى 5 - تقدم: {level}/5</p>
                        </div>
                     </div>
                     {/* Milestone 3 */}
                     <div className={`bg-slate-50 dark:bg-slate-900 border ${level >= 15 ? "border-indigo-500/50" : "border-slate-200 dark:border-slate-800 border-dashed"} rounded-xl p-4 flex items-center gap-4 ${level >= 15 ? "opacity-100" : "opacity-70"}`}>
                        <div className={`w-12 h-12 ${level >= 15 ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"} rounded-full flex items-center justify-center shrink-0`}>
                           <Award className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">الغواص العميق</h4>
                           <p className="text-xs text-slate-500 mt-1">{level >= 15 ? "تم الفتح" : "الوصول للمستوى 15"}</p>
                        </div>
                     </div>
                  </div>
               </section>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
