import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CalendarDays,
  Target,
  Sparkles,
  MessageSquareHeart,
  MoonStar,
  Brain,
  Headphones,
  BookOpen,
  ActivitySquare,
  Gift,
  CheckCircle2
} from "lucide-react";

interface WeeklyActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyActionPlanModal: FC<WeeklyActionPlanModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [completedDays, setCompletedDays] = useState<number[]>([1, 2]); // Mon, Tue mock completed

  const toggleDay = (dayIndex: number) => {
    setCompletedDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const weekSchedule = [
    { day: "الاثنين", label: "Deep Sync", color: "indigo" },
    { day: "الثلاثاء", label: "Shared Meditation", color: "teal" },
    { day: "الأربعاء", label: "Rest Day", color: "slate" },
    { day: "الخميس", label: "Nature Walk", color: "emerald" },
    { day: "الجمعة", label: "Soul Dinner", color: "rose" },
    { day: "السبت", label: "Challenge", color: "amber", highlight: true },
    { day: "الأحد", label: "Reflect", color: "violet" },
  ];

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
            <div className="flex-shrink-0 flex items-center justify-between p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner border border-indigo-200/50 dark:border-indigo-700/30">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    خطة العمل الأسبوعية
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Your Harmony Path & Weekend Challenge
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-3 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar text-right">
              
              {/* Path Insight Message */}
              <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border-r-4 border-indigo-500 border-y border-l border-y-slate-200 border-l-slate-200 dark:border-y-slate-700 dark:border-l-slate-700 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">مسار التناغم الخاص بك</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  هذا الأسبوع، يصل صدى علاقتك ونموك إلى آفاق جديدة. لقد تعزز توافقك المشترك وتقبلك للقيم الأساسية بنسبة 12% منذ يوم الإثنين. استمر في هذا التدفق.
                </p>
              </div>

              {/* Weekly Flow Grid */}
              <section>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                  <Target className="w-5 h-5 text-teal-500" /> التدفق الأسبوعي (Weekly Flow)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {weekSchedule.map((item, idx) => {
                    const isCompleted = completedDays.includes(idx);
                    return (
                      <div 
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`cursor-pointer relative overflow-hidden flex flex-col p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                          isCompleted
                            ? `border-${item.color}-500 bg-${item.color}-50 dark:bg-${item.color}-900/30`
                            : item.highlight
                              ? `border-amber-400 bg-amber-50/50 dark:bg-amber-900/20`
                              : `border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/80`
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                           <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                              isCompleted 
                                ? `bg-${item.color}-100 dark:bg-${item.color}-900/60 text-${item.color}-700 dark:text-${item.color}-300` 
                                : `bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`
                           }`}>
                             {item.day}
                           </span>
                           {isCompleted && <CheckCircle2 className={`w-4 h-4 text-${item.color}-500`} />}
                        </div>
                        <span className={`font-bold text-sm ${
                           isCompleted ? `text-${item.color}-700 dark:text-${item.color}-400` : `text-slate-700 dark:text-slate-300`
                        }`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Middle Section: Resonance & Challenge */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Resonance Log */}
                <section className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-100">
                    <MessageSquareHeart className="w-5 h-5 text-rose-500" /> سجل الوعي (Resonance Log)
                  </h3>
                  <div className="space-y-4 flex-1">
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl rounded-tr-sm border border-rose-100 dark:border-rose-900/40 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                      "لقد أحببت المشية في الطبيعة اليوم. صمتنا معاً كان بمثابة حوار عميق ومطمئن."
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm">
                      "أتفق معك. شعرت بأنني مسموع تماماً عندما كنا نتناقش حول خطط السفر القادمة بكل هدوء."
                    </div>
                  </div>
                </section>

                {/* Star Gazing & Deep Talk Challenge */}
                <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 shadow-xl border border-indigo-800/50 group">
                  <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
                    <MoonStar className="w-32 h-32 text-indigo-300" />
                  </div>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full mb-4 shadow-lg shadow-amber-500/20">
                      <Sparkles className="w-3 h-3" /> تحدي نهاية الأسبوع
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">مراقبة النجوم والحديث العميق</h3>
                    <p className="text-indigo-200 leading-relaxed max-w-sm font-medium mb-6">
                      اهرب من أضواء المدينة المشتتة. اقضِ ليلة السبت تحت النجوم مع التركيز على "أسئلة اللانهاية" المقدمة من الذكاء الاصطناعي لكشف أعماق أفكارك وأفكار شريكك.
                    </p>
                    
                    {/* Unlockable Rewards */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                      <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-amber-400" /> مكافآت قابلة للفتح (Unlockable Rewards)
                      </h4>
                      <div className="flex flex-wrap gap-3">
                         <span className="flex items-center gap-2 bg-indigo-500/30 text-indigo-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-400/30">
                           <span className="text-emerald-400">+50</span> نقاط بصيرة (Insights)
                         </span>
                         <span className="flex items-center gap-2 bg-rose-500/30 text-rose-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-400/30">
                           طاقة قرب عالية (High Closeness)
                         </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* AI NEXT STEPS */}
              <section>
                 <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-100">
                   <Brain className="w-5 h-5 text-violet-500" /> خطواتك الأمثل للمرحلة القادمة (AI Optimized)
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-violet-400 dark:hover:border-violet-600 transition-colors cursor-pointer group">
                       <ActivitySquare className="w-6 h-6 text-violet-500 mb-3 group-hover:scale-110 transition-transform" />
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">الفن التعاوني</h4>
                       <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
                         ممارسة مُوصى بها بشدة بناءً على مستويات المزامنة الإبداعية الحالية بينكما.
                       </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-teal-400 dark:hover:border-teal-600 transition-colors cursor-pointer group">
                       <Headphones className="w-6 h-6 text-teal-500 mb-3 group-hover:scale-110 transition-transform" />
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">مختبر الإصغاء النشط</h4>
                       <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
                         تمرين موجه مدته 15 دقيقة لتحسين القدرة على فك شيفرة المشاعر الكامنة واستيعابها.
                       </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-amber-400 dark:hover:border-amber-600 transition-colors cursor-pointer group">
                       <BookOpen className="w-6 h-6 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">دفتر الامتنان المشترك</h4>
                       <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
                         تبادل يوميات الامتنان المكتوبة الليلة لتشهد التأثير الصامت والإيجابي الذي تصنعه.
                       </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-sky-400 dark:hover:border-sky-600 transition-colors cursor-pointer group">
                       <Sparkles className="w-6 h-6 text-sky-500 mb-3 group-hover:scale-110 transition-transform" />
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">فحص طاقة المزاج (Vibe Check)</h4>
                       <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug">
                         فحص مزاجي سريع لمواءمة توقعات الطاقة والراحة لديكما خلال أيام عطلة نهاية الأسبوع.
                       </p>
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
