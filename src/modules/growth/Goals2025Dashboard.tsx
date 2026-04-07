import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Rocket, 
  Network, 
  Settings2, 
  Brain, 
  MonitorOff,
  Activity,
  CheckCircle2,
  Circle,
  Trophy
} from "lucide-react";

interface Goals2025DashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Goals2025Dashboard: FC<Goals2025DashboardProps> = ({
  isOpen,
  onClose,
}) => {
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
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 transition-all"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-indigo-600 to-teal-500 dark:from-indigo-400 dark:to-teal-300">
                    لوحة أهداف عام 2025
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    نموذج التطور المدمج بين الذكاء الاستراتيجي والمرونة العاطفية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-3 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar">
              
              {/* Transformation Readiness */}
              <section className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      مؤشر جاهزية التحول
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      يعكس هذا المؤشر مدى استعدادك الذهني والنفسي للبدء في الأهداف الجديدة بناءً على مسارك التحليلي لعام 2024.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-lg border-4 border-indigo-50 dark:border-slate-700">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-slate-100 dark:text-slate-700"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray="351.858"
                          strokeDashoffset={351.858 - (85 / 100) * 351.858}
                          strokeLinecap="round"
                          className="text-indigo-500 dark:text-indigo-400 transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-3xl font-black text-slate-800 dark:text-white">85</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2025 Growth Pillars */}
              <section>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-teal-500" />
                  ركائز النمو لعام 2025
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Pillar 1 */}
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center mb-4">
                      <Network className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">الذكاء الاجتماعي</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      تعميق الروابط الإنسانية من خلال تحليل لغة الجسد والنوايا غير المعلنة بدقة عالية.
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center mb-4">
                      <Brain className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">الحضور الذهني</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      تحقيق حالة من الصفاء الذهني العميق عبر تقنيات التأمل المتقدمة والتركيز اللحظي.
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center mb-4">
                      <MonitorOff className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">التوازن الرقمي</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      خلق فجوات زمنية متعمدة بعيدة عن الشاشات لتعزيز الوعي الذاتي والاتصال المباشر بالواقع.
                    </p>
                  </div>
                </div>
              </section>

              {/* Quarterly Goals Map */}
              <section>
                <div className="flex items-center justify-between xl:mb-8 mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-indigo-500" />
                    خارطة الأهداف الربع سنوية
                  </h3>
                </div>

                <div className="space-y-4">
                  
                  {/* Goal 1 */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">إعادة الهيكلة وتصفية العادات</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تصفية العادات السلبية وبناء روتين "الانسيابية" الجديد.</p>
                      </div>
                      <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-full">
                        الربع الأول
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                        <span className="text-sm font-medium line-through opacity-70">تفعيل نظام التتبع للروتين اليومي</span>
                      </div>
                    </div>
                  </div>

                  {/* Goal 2 */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">التفوق العاطفي المتقدم</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">إتمام دبلوم الذكاء العاطفي المتقدم وتطبيقه على المواقف الضاغطة.</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full">
                        الربع الثاني
                      </span>
                    </div>
                  </div>

                  {/* Goal 3 */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">توسيع الأثر والقيادة</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تطبيق مهارات القيادة الرحيمة واستيعاب الفروق الفردية في بيئة العمل.</p>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                        الربع الثالث
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                        <span className="text-sm font-medium">البدء في برامج الإرشاد الشخصي للزملاء المتأخرين</span>
                      </div>
                    </div>
                  </div>

                  {/* Goal 4 */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">الاستشفاء الجماعي السنوي</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تنظيم أو الالتحاق برحلة الاستشفاء الجماعي السنوية للتعافي المشترك.</p>
                      </div>
                      <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-full">
                        الربع الرابع
                      </span>
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
