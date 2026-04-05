import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Library, BookOpen, Lock, Sparkles, Filter, Bookmark } from "lucide-react";
import { useAppOverlayState } from "../state/appOverlayState";

const MOCK_RESOURCES = [
  {
    id: 1,
    title: "هندسة الانتكاسات",
    category: "تحليل نفسي",
    isLocked: false,
    duration: "12 دقيقة",
    progress: 100,
    excerpt: "الخارطة التفصيلية لكيفية استغلال العقل لثغرات الإجهاد لإعادة بناء المسارات العصبية القديمة."
  },
  {
    id: 2,
    title: "صمت الدوبامين",
    category: "بروتوكول",
    isLocked: false,
    duration: "8 دقائق",
    progress: 45,
    excerpt: "كيف تعيد معايرة مستقبلات المتعة في الدماغ عبر الامتناع التكتيكي الموجه."
  },
  {
    id: 3,
    title: "مصفوفة الاستبدال",
    category: "استراتيجية",
    isLocked: true,
    duration: "15 دقيقة",
    progress: 0,
    excerpt: "مرحلة متقدمة: بناء عادات سيادية قادرة على إزاحة العادات التدميرية من الجذور."
  },
  {
    id: 4,
    title: "الهوية المنقسمة",
    category: "حالة الإدراك",
    isLocked: true,
    duration: "20 دقيقة",
    progress: 0,
    excerpt: "فهم الصراع الداخلي بين 'المراقب' و'المنفذ' أثناء نوبات الرغبة الملحة."
  }
];

const CATEGORIES = ["الكل", "بروتوكول", "عقلية", "تحليل نفسي", "استراتيجية"];

export function WisdomMatrixHub() {
  const closeOverlay = useAppOverlayState((s) => s.closeOverlay);
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filteredResources = MOCK_RESOURCES.filter(r => 
    activeCategory === "الكل" || r.category === activeCategory
  );

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(10, 15, 30, 0.85)" }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-slate-700/50 bg-slate-900/80 shadow-[0_30px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
      >
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header Section */}
        <div className="relative z-10 px-8 pt-8 pb-6 border-b border-slate-800/80 shrink-0 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] relative group">
              <div className="absolute -inset-1 bg-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <Library className="w-8 h-8 text-blue-400 relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight flex items-center gap-3">
                مصفوفة الحكمة
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                  مستوى الإدراك ٢
                </span>
              </h1>
              <p className="text-slate-400 text-sm font-medium">تتولد المعرفة والترسانة الفكرية بناءً على مستوى وعيك وتقدمك الحالي في مسار التأهيل.</p>
            </div>
          </div>
          
          <button
            onClick={() => closeOverlay("wisdomMatrix")}
            className="p-2.5 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-8 py-4 shrink-0 overflow-x-auto no-scrollbar relative z-10 border-b border-slate-800/50">
          <Filter className="w-4 h-4 text-slate-500 mr-2" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat 
                  ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="popLayout">
              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" layout>
                {filteredResources.map((resource, i) => (
                  <motion.div
                    key={resource.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 group ${
                      resource.isLocked 
                        ? "bg-slate-900/40 border-slate-800/50 opacity-75 grayscale-[30%]" 
                        : "bg-slate-800/40 hover:bg-slate-800/60 border-slate-700 hover:border-blue-500/30 cursor-pointer"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider ${
                        resource.isLocked ? "bg-slate-800 text-slate-500" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {resource.category}
                      </span>
                      
                      {resource.isLocked ? (
                        <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                          <Lock className="w-4 h-4 text-slate-500" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-lg bg-slate-800/40 group-hover:bg-blue-500/20 border border-slate-700 group-hover:border-blue-500/30 transition-colors">
                          <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                        </div>
                      )}
                    </div>
                    
                    <h3 className={`text-xl font-bold mb-2 ${resource.isLocked ? "text-slate-400" : "text-white group-hover:text-blue-50"}`}>
                      {resource.title}
                    </h3>
                    
                    <p className={`text-sm mb-6 line-clamp-2 ${resource.isLocked ? "text-slate-500" : "text-slate-400"}`}>
                      {resource.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        {resource.duration}
                      </span>
                      
                      {!resource.isLocked && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-blue-400">{resource.progress}%</span>
                          <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${resource.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      )}
                      {resource.isLocked && (
                        <span className="text-xs font-medium text-slate-600 bg-slate-800/80 px-2 py-1 rounded-md">يُفتح في المستوى ٣</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            
            {filteredResources.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                <Bookmark className="w-12 h-12 mb-4 opacity-20" />
                <p>لا توجد ملفات معرفية في هذا التصنيف حالياً</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
