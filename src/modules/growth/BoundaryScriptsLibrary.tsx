import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, MessageSquare } from "lucide-react";
import { useState } from "react";
import { adviceDatabase, type AdviceZone, type AdviceCategory } from "@/data/adviceScripts";

interface BoundaryScriptsLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  ring: AdviceZone;
  category: AdviceCategory;
  personLabel: string;
}

export const BoundaryScriptsLibrary: FC<BoundaryScriptsLibraryProps> = ({
  isOpen,
  onClose,
  ring,
  category,
  personLabel
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const advice = adviceDatabase[ring][category];
  const scripts = advice.scripts;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="p-6 bg-linear-to-br from-indigo-600 to-violet-700 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-2 justify-end">
              <h3 className="text-xl font-bold">مكتبة جمل الحدود</h3>
              <div className="p-2 bg-white/20 rounded-xl">
                 <MessageSquare className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-indigo-100 text-right">
              جمل جاهزة للاستخدام مع <span className="font-bold">{personLabel}</span> لحماية مساحتك
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-4">
               <p className="text-xs font-bold text-indigo-900 mb-1 text-right italic">💡 نصيحة سريعة:</p>
               <p className="text-xs text-indigo-800 leading-relaxed text-right">
                 الجمل دي أدوات في إيدك. اختار اللي يناسب صوتك، والهدف مش القسوة لكن الوضوح.
               </p>
            </div>

            <div className="space-y-3">
              {scripts.map((script, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <p className="text-right text-slate-800 text-sm leading-relaxed mb-3 font-medium">
                    {script}
                  </p>
                  
                  <div className="flex justify-start">
                    <button
                      onClick={() => handleCopy(script, index)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                        copiedIndex === index 
                          ? "bg-green-100 text-green-700" 
                          : "bg-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white"
                      }`}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3" />
                          تم النسخ
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          نسخ الجملة
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {scripts.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>لا توجد جمل مخصصة لهذه الفئة حالياً.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold shadow-lg active:scale-95 transition-all"
            >
              فهمت
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
