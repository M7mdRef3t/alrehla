import React, { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, FileText, BrainCircuit, Calendar, Search, Filter, ChevronDown, ArrowRight } from 'lucide-react';

interface PastSessionsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAST_SESSIONS = [
  {
    id: 1,
    title: 'فك النزاعات وفهم الانسحاب',
    date: '24 أكتوبر 2025',
    category: 'Conflict Resolution',
    summary: 'كشفت الجلسة عن نمط من الصمت الدفاعي أثناء محفزات التوتر العالي. تم تحقيق اختراق عند تحديد "حلقة الانسحاب" كآلية للحفاظ على الأمان، والتي تم تفسيرها خطأ على أنها لامبالاة. تقدم رئيسي في التعبير عن الاحتياجات بوضوح قبل الوصول للتشبع العاطفي.'
  },
  {
    id: 2,
    title: 'ورشة التعاطف العميق والمحاكاة',
    date: '21 أكتوبر 2025',
    category: 'Deep Empathy Workshop',
    summary: 'جلسة تعاونية ركزت على تقنيات المحاكاة العاطفية. أظهر المشاركون نجاحاً في إظهار التحقق العاطفي دون تقديم حلول فورية. سلطت الملاحظات الضوء على تحول كبير في النبرة من النبرة التحليلية إلى الرنين العاطفي أثناء تمرين الضعف المشترك.'
  },
  {
    id: 3,
    title: 'استشراف المستقبل العاطفي',
    date: '15 أكتوبر 2025',
    category: 'Future Pacing',
    summary: 'استكشاف البنية المعمارية للعلاقة طويلة الأجل. دار النقاش حول موازنة الاستقلال الفردي مع الرؤية المشتركة. رصد المحلل مؤشرات تفاؤل عالية خلال تمرين "توقع السنتين القادمتين". التركيز الموصى به للجلسة القادمة: وضع حدود عملية.'
  }
];

export const PastSessionsLogModal: FC<PastSessionsLogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl flex flex-col overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900 z-10">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <History className="w-6 h-6 text-indigo-400" />
                سجل الجلسات السابقة
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                راجع رحلتك العاطفية والاختراقات في العلاقات عبر جميع الجلسات المحللة.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Filters */}
            <div className="w-full md:w-64 bg-slate-800/30 border-l border-slate-800 p-6 shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar hidden md:flex">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ابحث في الجلسات..." 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-200 outline-none focus:border-indigo-500 transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Filter className="w-3 h-3" />
                  تصنيف الجلسات
                </h3>
                <div className="space-y-2">
                  {['الكل', 'Conflict Resolution', 'Deep Empathy Workshop', 'Future Pacing'].map((c, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${i === 0 ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 group-hover:border-indigo-400'}`}>
                        {i === 0 && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <span className={`text-sm ${i === 0 ? 'text-indigo-300 font-semibold' : 'text-slate-400 group-hover:text-slate-200'}`}>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-slate-400">
                  عرض <span className="font-bold text-white">3</span> من أصل <span className="font-bold text-white">42</span> جلسة
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition">
                  الأحدث أولاً <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {PAST_SESSIONS.map((session, index) => (
                  <motion.div 
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="p-5 border-b border-slate-700/50 bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                            {session.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {session.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900 w-fit px-3 py-1.5 rounded-lg border border-slate-700">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        {session.date}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold mb-3 text-sm">
                        <BrainCircuit className="w-4 h-4" />
                        الملخص الذكي (AI Summary Snippet)
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed border-r-2 border-indigo-500/30 pr-4 italic">
                        "{session.summary}"
                      </p>
                      
                      <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                        <div className="flex gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition">
                            <FileText className="w-3.5 h-3.5" /> التقرير الكامل
                          </button>
                        </div>
                        <button className="flex items-center gap-1 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition group/btn">
                          استمرار الاستكشاف <ArrowRight className="w-4 h-4 opacity-70 group-hover/btn:-translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                <p className="text-slate-500 text-sm mb-4">
                  استمر في استكشاف تاريخك لتحديد الاتجاهات العاطفية طويلة المدى والأنماط السلوكية المتكررة.
                </p>
                <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-bold rounded-xl transition">
                  تحميل الجلسات الأقدم
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
