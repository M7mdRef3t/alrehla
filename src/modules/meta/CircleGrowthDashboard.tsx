import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Target,
  Trophy,
  Flame,
  Activity,
  Heart,
  Lock,
  Unlock,
  Sparkles,
  Network,
  Zap,
} from "lucide-react";

interface CircleGrowthDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CircleGrowthDashboard: FC<CircleGrowthDashboardProps> = ({
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
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 transition-all"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white/90 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Panel */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 md:p-8 border-b border-teal-200/50 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 relative overflow-hidden">
               {/* Ambient Glow */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
               
               <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400 rounded-2xl shadow-inner border border-teal-200/50 dark:border-teal-800/50">
                  <Network className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex gap-2 items-center mb-1">
                     <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-sm">
                       Circle Analyst
                     </span>
                     <span className="text-[10px] font-bold tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1">
                       <Lock className="w-3 h-3" /> مساحة الدائرة المغلقة
                     </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    لوحة تتبع نمو الدائرة
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                    تعميق المهارات الاستبطانية (Deep Introspection) وبناء الرنين العاطفي المشترك.
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

              {/* Collective Resonance Banner */}
              <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-teal-500/30 text-teal-50 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity className="w-64 h-64" />
                 </div>
                 <div className="relative z-10 flex-1">
                    <div className="inline-flex items-center gap-2 bg-teal-500/20 backdrop-blur-sm border border-teal-400/30 px-4 py-1.5 rounded-full text-xs font-bold mb-4 text-teal-100 shadow-sm">
                      <Sparkles className="w-4 h-4 text-teal-300" /> الرنين الجماعي (Collective Resonance)
                    </div>
                    <p className="text-xl md:text-2xl font-medium text-white leading-relaxed pr-5 border-r-4 border-teal-400">
                      "دائرتك تعمل حالياً بتردد عالٍ من الشفافية العاطفية. أبلغ الأعضاء عن مستويات أعمق من الضعف (Vulnerability) والفهم المشترك خلال الـ 72 ساعة الماضية."
                    </p>
                 </div>
                 
                 {/* Core Circle Metrics */}
                 <div className="relative z-10 flex gap-4 md:flex-col shrink-0">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[140px]">
                       <p className="text-xs font-bold text-teal-200 mb-1">متوسط البصيرة</p>
                       <p className="text-4xl font-black text-white">14.2</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[140px]">
                       <p className="text-xs font-bold text-teal-200 mb-1">إجمالي الاكتشافات</p>
                       <p className="text-4xl font-black text-white">342</p>
                    </div>
                 </div>
              </div>

              {/* Two Column Layout for Challenges and Leaderboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 
                 {/* Right Column: Challenges (Takes 2 Columns) */}
                 <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-end mb-6">
                       <div>
                          <h3 className="text-xl font-black flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-1">
                            <Target className="w-6 h-6 text-teal-500" /> التحديات النشطة (Active Challenges)
                          </h3>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ماراثون التعاطف الجذري - أنجزتم <span className="font-bold text-teal-600 dark:text-teal-400">72%</span> من الوعي التراكمي.</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {/* Challenge 1 */}
                       <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm group hover:border-teal-400 dark:hover:border-teal-500 transition-all">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 text-orange-500 rounded-xl flex items-center justify-center mb-4">
                             <Flame className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">تأمل الاستمرارية اليومي</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                             أكمل 10 دقائق من الاستبطان الداخلي لـ 7 أيام متتالية لفتح مكافآت تآزر الدائرة.
                          </p>
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs font-bold text-slate-400">
                             <span>التقدم: 4/7 أيام</span>
                             <span className="text-teal-500 flex items-center gap-1"><Zap className="w-3 h-3" /> نشط الآن</span>
                          </div>
                       </div>

                       {/* Challenge 2 */}
                       <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm group hover:border-teal-400 dark:hover:border-teal-500 transition-all">
                          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 text-rose-500 rounded-xl flex items-center justify-center mb-4">
                             <Heart className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">التحقق المتبادل (Validation)</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                             تبادل رموز الصدق الفكري مع 3 أعضاء في الدائرة لتعميق الروابط العلايقية بينكم.
                          </p>
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs font-bold text-slate-400">
                             <span>التقدم: 1/3 أعضاء</span>
                             <span className="text-teal-500 flex items-center gap-1"><Zap className="w-3 h-3" /> نشط الآن</span>
                          </div>
                       </div>

                       {/* Challenge 3 */}
                       <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm group hover:border-teal-400 dark:hover:border-teal-500 transition-all">
                          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 rounded-xl flex items-center justify-center mb-4">
                             <Sparkles className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">الذات الخفية (The Hidden Self)</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                             حدد تحيزاً لاواعياً واحداً (Subconscious bias) وشارك هذا الاكتشاف بصدق في قناة الدائرة.
                          </p>
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs font-bold text-slate-400">
                             <span>مهمة مكتملة</span>
                             <span className="text-emerald-500">تم الإنجاز</span>
                          </div>
                       </div>

                       {/* Challenge 4 */}
                       <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 shadow-sm group hover:border-teal-400 dark:hover:border-teal-500 transition-all">
                          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 text-violet-500 rounded-xl flex items-center justify-center mb-4">
                             <Users className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">سباق الهشاشة (Vulnerability Sprint)</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                             شارك تحدياً شخصياً تواجهه في الوقت الحالي واطلب الدعم المعنوي بشفافية ومصارحة.
                          </p>
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs font-bold text-slate-400">
                             <span>قيد الانتظار</span>
                             <span>لم يبدأ بعد</span>
                          </div>
                       </div>
                    </div>
                    
                    {/* Activity Feed Banner */}
                    <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl flex items-center gap-4">
                       <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center font-bold">A</div>
                       <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Aria Chen <span className="text-slate-500 font-medium text-xs">شاركت بصيرة عميقة: "انعكاس المرآة"</span></p>
                       </div>
                       <button className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">عرض كل النشاطات</button>
                    </div>
                 </div>

                 {/* Left Column: Leaderboard & Vault */}
                 <div className="space-y-6">
                    {/* Leaderboard */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
                       <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100 mb-6">
                         <Trophy className="w-5 h-5 text-amber-500" /> لوحة شرف الدائرة
                       </h3>
                       
                       <div className="space-y-4">
                          {[
                             { name: "Elena Vance", lvl: "42", rank: "جد محترف (Grand Master)", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/40" },
                             { name: "Marcus Aris", lvl: "38", rank: "محلل نخبوي (Elite Analyst)", color: "text-slate-500", bg: "bg-slate-200 dark:bg-slate-700" },
                             { name: "Julian Chen", lvl: "36", rank: "محلل نخبوي (Elite Analyst)", color: "text-amber-700 dark:text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
                             { name: "Sasha Grey", lvl: "31", rank: "دليل مرشد (Senior Guide)", color: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
                          ].map((user, idx) => (
                             <div key={idx} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${user.bg} ${user.color}`}>
                                   {idx + 1}
                                </div>
                                <div className="flex-1">
                                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-0.5">{user.name}</h4>
                                   <p className="text-[10px] items-center text-slate-500 font-bold border border-slate-200 dark:border-slate-700 inline-block px-1.5 py-0.5 rounded-md text-nowrap">LVL {user.lvl} • {user.rank}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Rewards Vault */}
                    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white relative overflow-hidden">
                       <div className="absolute -bottom-10 -right-10 opacity-10">
                          <Lock className="w-40 h-40" />
                       </div>
                       <h3 className="text-lg font-bold flex items-center gap-2 mb-2 relative z-10">
                         <Lock className="w-4 h-4 text-cyan-400" /> الخزنة الجماعية
                       </h3>
                       <p className="text-xs text-slate-400 mb-6 font-medium relative z-10 leading-relaxed">
                          إنجازات حصرية يمكنك فتحها فقط من خلال الرصيد المشترك للوعي والنشاط في الدائرة.
                       </p>
                       
                       <div className="space-y-3 relative z-10">
                          <div className="flex justify-between items-center bg-slate-800/80 p-3 rounded-xl border border-teal-500/30">
                             <span className="text-sm font-bold text-teal-300">Echo Chamber Hero</span>
                             <Unlock className="w-4 h-4 text-teal-400" />
                          </div>
                          <div className="flex justify-between items-center bg-slate-800/80 p-3 rounded-xl border border-teal-500/30">
                             <span className="text-sm font-bold text-teal-300">Sync Soul</span>
                             <Unlock className="w-4 h-4 text-teal-400" />
                          </div>
                          <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                             <span className="text-sm font-medium text-slate-400">Mind Reader</span>
                             <Lock className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700 relative overflow-hidden">
                             <div className="absolute bottom-0 right-0 h-1 bg-amber-500 w-[90%]" />
                             <span className="text-sm font-medium text-slate-400">Elite Harmony</span>
                             <Lock className="w-4 h-4 text-slate-600" />
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
