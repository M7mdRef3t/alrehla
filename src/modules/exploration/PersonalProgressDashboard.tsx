import { useState, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LineChart,
  CalendarDays,
  Target,
  Sparkles,
  BrainCircuit,
  Activity,
  Users,
  Award,
  History,
  Info,
  Medal as MedalIcon
} from "lucide-react";

import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { ACHIEVEMENTS } from "@/data/achievements";

interface PersonalProgressDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "monthly" | "annual";

export const PersonalProgressDashboard: FC<PersonalProgressDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("monthly");
  const { unlockedIds } = useAchievementState();

  const unlockedAchievements = ACHIEVEMENTS.filter((a) =>
    unlockedIds.includes(a.id)
  );

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
            <div className="flex-shrink-0 flex items-center justify-between p-6 md:p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900/80">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-2xl shadow-inner border border-violet-200/50 dark:border-violet-700/30">
                  <LineChart className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    لوحة تتبع التقدم
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Ethereal Analyst — Mapping your cognitive evolution
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-3 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex justify-center p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20">
              <div className="inline-flex bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setActiveTab("monthly")}
                  className={`relative px-6 py-2.5 text-sm font-bold transition-colors ${
                    activeTab === "monthly"
                      ? "text-slate-800 dark:text-slate-100"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {activeTab === "monthly" && (
                    <motion.div
                      layoutId="activeTabProgress"
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    التحليل الشهري
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("annual")}
                  className={`relative px-6 py-2.5 text-sm font-bold transition-colors ${
                    activeTab === "annual"
                      ? "text-slate-800 dark:text-slate-100"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {activeTab === "annual" && (
                    <motion.div
                      layoutId="activeTabProgress"
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    مراجعة التطور السنوية
                  </span>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                
                {/* --- MONTHLY VIEW --- */}
                {activeTab === "monthly" && (
                  <motion.div
                    key="monthly"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-30 dark:opacity-20 pointer-events-none">
                        <Activity className="w-24 h-24 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                        أداء واعد!
                      </h3>
                      <p className="text-emerald-700 dark:text-emerald-400 max-w-2xl">
                        أنت تتفوق على أداء الشهر الماضي بنسبة 12%. الذكاء العاطفي وثبات العادات يمثلان أقوى ركائز تفوقك في هذه الدورة.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Milestones */}
                      <section className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                          <MedalIcon className="w-5 h-5 text-amber-500" /> المحطات المُنجزة
                        </h4>
                        {unlockedAchievements.length > 0 ? (
                          <ul className="space-y-4">
                            {unlockedAchievements.slice(0, 5).map((achievement) => (
                              <li key={achievement.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center shrink-0 text-xl">
                                  {achievement.icon}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{achievement.title}</p>
                                  <p className="text-xs text-slate-500">{achievement.description}</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-6">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                              <MedalIcon className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">لا يوجد أوسمة حتى الآن</p>
                            <p className="text-xs text-slate-500 mt-1">استمر في استكشاف رحلتك لفتح إنجازاتك الأولى.</p>
                          </div>
                        )}
                      </section>

                      {/* AI Growth Insights */}
                      <section className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                          <BrainCircuit className="w-5 h-5 text-indigo-500" /> تحليل النمو البصري
                        </h4>
                        <div className="space-y-4 flex-1">
                          <div className="border-r-4 border-indigo-500 pr-4">
                            <h5 className="font-bold text-indigo-700 dark:text-indigo-400 text-sm mb-1">التركيز الصباحي</h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                              "نشاطك الذهني وتركيزك أعلى بنسبة 34% بين 7 و 9 صباحاً. أنت أكثر ثباتًا في العادات المعقدة خلال هذا الوقت."
                            </p>
                          </div>
                          <div className="border-r-4 border-rose-500 pr-4">
                            <h5 className="font-bold text-rose-700 dark:text-rose-400 text-sm mb-1">نمط الطاقة الاجتماعية</h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                              "تشير بيانات منتصف الأسبوع إلى انخفاض في المرونة الاجتماعية. ضع في اعتبارك جدولة مهام التركيز العميق أيام الأربعاء."
                            </p>
                          </div>
                        </div>
                        <button className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 py-3 rounded-xl font-bold transition-colors">
                          <Info className="w-4 h-4" /> عرض التقرير النصف شهري مفصلاً
                        </button>
                      </section>
                    </div>
                  </motion.div>
                )}

                {/* --- ANNUAL VIEW --- */}
                {activeTab === "annual" && (
                  <motion.div
                    key="annual"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                     {/* Stats Header */}
                     <div className="grid grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-gradient-to-b from-teal-50 to-white dark:from-teal-900/30 dark:to-slate-800 rounded-2xl p-6 text-center border border-teal-100 dark:border-teal-800/50 shadow-sm">
                          <p className="text-teal-600 dark:text-teal-400 font-black text-4xl block mb-2">88%</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">مؤشر التطور الشامل</p>
                        </div>
                        <div className="bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-900/30 dark:to-slate-800 rounded-2xl p-6 text-center border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                          <p className="text-indigo-600 dark:text-indigo-400 font-black text-4xl block mb-2">156</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">جلسة مكتملة</p>
                        </div>
                        <div className="bg-gradient-to-b from-violet-50 to-white dark:from-violet-900/30 dark:to-slate-800 rounded-2xl p-6 text-center border border-violet-100 dark:border-violet-800/50 shadow-sm">
                          <p className="text-violet-600 dark:text-violet-400 font-black text-4xl block mb-2">24k</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">نقاط الاستبصار</p>
                        </div>
                     </div>

                     {/* AI Sentiment */}
                     <div className="bg-slate-800 dark:bg-slate-900 rounded-2xl p-6 md:p-8 text-center relative shadow-lg">
                        <Award className="w-12 h-12 text-slate-600 dark:text-slate-700 absolute top-4 right-4 opacity-50" />
                        <h4 className="text-slate-300 text-sm font-bold mb-4">انعكاس الذكاء الاصطناعي على عامك</h4>
                        <p className="text-lg md:text-xl font-medium text-white leading-loose max-w-3xl mx-auto italic">
                           "عام 2024 كان رحلة التحول من رد الفعل التلقائي إلى الوعي الكامل. لقد أظهرت مرونة استثنائية في مواجهة التحديات العاطفية، حيث تطورت لغة حوارك الداخلي لتصبح أكثر تعاطفاً ودقة."
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-xs font-bold ring-1 ring-indigo-500/50">
                          <Sparkles className="w-3 h-3" /> تم الوصول لمرحلة: الوعي الواعي
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Dynamic Relationship */}
                        <section className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                             <Users className="w-5 h-5 text-teal-500" /> ديناميكيات العلاقات 2024
                          </h4>
                          <div className="space-y-5">
                            <div>
                               <div className="flex justify-between text-sm mb-1">
                                 <span className="font-bold text-slate-700 dark:text-slate-300">الشريك الداعم</span>
                                 <span className="text-teal-600 dark:text-teal-400 font-bold">استقرار مرتفع</span>
                               </div>
                               <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-500 w-[92%] rounded-full" />
                               </div>
                            </div>
                            <div>
                               <div className="flex justify-between text-sm mb-1">
                                 <span className="font-bold text-slate-700 dark:text-slate-300">الأصدقاء المقربون</span>
                                 <span className="text-indigo-600 dark:text-indigo-400 font-bold">نمو تدريجي</span>
                               </div>
                               <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 w-[75%] rounded-full" />
                               </div>
                            </div>
                            <div>
                               <div className="flex justify-between text-sm mb-1">
                                 <span className="font-bold text-slate-700 dark:text-slate-300">العائلة</span>
                                 <span className="text-rose-600 dark:text-rose-400 font-bold">ارتباط وثيق بحذر</span>
                               </div>
                               <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500 w-[60%] rounded-full" />
                               </div>
                            </div>
                            <p className="mt-4 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg leading-relaxed">
                              ملاحظة: شهد الربع الثالث زيادة ملحوظة في عمق التواصل مع دائرة "الشريك" نتيجة ممارسة تمارين الإصغاء النشط.
                            </p>
                          </div>
                        </section>

                        {/* Timeline */}
                        <section className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative">
                          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                             <History className="w-5 h-5 text-indigo-500" /> الجدول الزمني للقفزات الإدراكية
                          </h4>
                          <div className="relative border-r-2 border-indigo-100 dark:border-slate-700 pr-4 space-y-6">
                            
                             <div className="relative">
                               <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -right-[23px] top-1.5 ring-4 ring-indigo-50 dark:ring-slate-800" />
                               <span className="text-xs font-bold text-indigo-500 mb-1 block">مارس</span>
                               <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">اكتشاف النمط — (أول آها!)</h5>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">فهم أعمق لجذور القلق في المواقف الاجتماعية الصعبة.</p>
                             </div>

                             <div className="relative">
                               <div className="absolute w-3 h-3 bg-teal-500 rounded-full -right-[23px] top-1.5 ring-4 ring-teal-50 dark:ring-slate-800" />
                               <span className="text-xs font-bold text-teal-500 mb-1 block">يونيو</span>
                               <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">ثبات الوعي — اجتياز الأزمة</h5>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تطبيق تقنيات التنفس بنجاح تام خلال صدمة ضغط بيئة العمل.</p>
                             </div>

                             <div className="relative">
                               <div className="absolute w-3 h-3 bg-rose-500 rounded-full -right-[23px] top-1.5 ring-4 ring-rose-50 dark:ring-slate-800" />
                               <span className="text-xs font-bold text-rose-500 mb-1 block">سبتمبر</span>
                               <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">إعادة الاتصال العاطفي</h5>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ترميم علاقة قديمة مع صديق باستخدام مهارات الحوار المتزن بنجاح.</p>
                             </div>

                             <div className="relative">
                               <div className="absolute w-3 h-3 bg-amber-500 rounded-full -right-[23px] top-1.5 ring-4 ring-amber-50 dark:ring-slate-800" />
                               <span className="text-xs font-bold text-amber-500 mb-1 block">ديسمبر</span>
                               <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm">التحول الكامل والمتكامل</h5>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">الوصول لمعدل نمو 88% وتحديد أهداف طموحة وواضحة لعام 2025.</p>
                             </div>
                             
                          </div>
                        </section>
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
