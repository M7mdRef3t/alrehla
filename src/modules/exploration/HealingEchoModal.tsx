import { logger } from "@/services/logger";
import React, { useState, useRef, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, X, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";
import { calculateEntropy } from "@/services/predictiveEngine";
import { useToastState } from "@/domains/dawayir/store/toast.store";

interface HealingEchoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealingEchoModal: FC<HealingEchoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [entropyData, setEntropyData] = useState({ score: 50, state: "FLUX" });
  
  useEffect(() => {
    if (isOpen) {
      const evaluation = calculateEntropy();
      setEntropyData({
        score: Math.round(evaluation.entropyScore),
        state: evaluation.state
      });
    }
  }, [isOpen]);

  const getGradientColors = () => {
    const score = entropyData.score;
    if (score >= 80) return "from-rose-950 via-violet-950 to-indigo-950";
    if (score >= 50) return "from-amber-950 via-orange-900 to-rose-950";
    return "from-emerald-950 via-teal-950 to-cyan-950";
  };

  const getRandomPoeticQuote = () => {
    const score = entropyData.score;
    if (score >= 80) {
      return [
        "وراء كل عاصفة إدراكية، يقبع هدوء ينتظر أن تكتشفه.",
        "الفوضى ليست ضعفاً، إنها المادة الخام لوعي جديد.",
        "أحيانًا يكون الانهيار هو مجرد مسار لبناء حدود أقوى."
      ][Math.floor(Math.random() * 3)];
    }
    if (score >= 50) {
      return [
        "التذبذب هو نبض التغيير؛ اسمح له بالمرور عبرك.",
        "أنت في مرحلة العبور، وكل خطوة تعيد تشكيل وعيك.",
        "لحظات الضبابية هي مسارقات النظر نحو النسخة القادمة منك."
      ][Math.floor(Math.random() * 3)];
    }
    return [
      "الهدوء الجسدي يصنع المعجزات الإدراكية.",
      "لقد بنيت ملاذك، وأصبح النبض مستقراً.",
      "الصفاء ليس غياب المشاكل، بل هو القدرة على توجيهها."
    ][Math.floor(Math.random() * 3)];
  };

  const handleCapture = async (share: boolean) => {
    if (!printRef.current) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 3, // High resolution for social media
        useCORS: true,
        backgroundColor: "#020617", // slate-950 fallback
      });

      const elementUrl = canvas.toDataURL("image/jpeg", 0.9);

      if (share && navigator.share) {
        // Convert base64 to blob for sharing
        const blob = await (await fetch(elementUrl)).blob();
        const file = new File([blob], "healing-echo.jpg", { type: "image/jpeg" });
        await navigator.share({
          title: "صدى التعافي - Dawayir",
          text: "نبض من الملاذ الإدراكي.",
          files: [file]
        });
      } else {
        // Fallback to Download
        const link = document.createElement("a");
        link.download = `dawayir-echo-${Date.now()}.jpg`;
        link.href = elementUrl;
        link.click();
      }
      
      useToastState.getState().showToast(
         share ? "تم فتح نافذة المشاركة بنجاح." : "تم حفظ الصدى في جهازك بنجاح.", 
         "success"
      );
    } catch (e) {
      logger.error(e);
      useToastState.getState().showToast("عذراً، حدث خطأ أثناء التقاط الصدى.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="absolute inset-0 bg-slate-950/80 transition-all"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50 relative z-20">
               <div className="flex gap-2 items-center text-slate-100 font-bold">
                 <Sparkles className="w-5 h-5 text-emerald-400" />
                 <span>صدى التعافي</span>
               </div>
               <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
            </div>

            {/* ART GENERATOR AREA TO RECORD */}
            <div className="p-6 md:p-8 shrink-0 bg-slate-950 flex flex-col items-center justify-center">
                {/* Ensure square or tall ratio for Instagram */}
                <div 
                   ref={printRef}
                   className={`w-full aspect-[4/5] rounded-[2rem] bg-gradient-to-br ${getGradientColors()} relative overflow-hidden flex flex-col justify-between p-8 text-white shadow-inner m-auto border border-white/5`}
                >
                    {/* Organic glow overlays for deep immersion */}
                    <div className="absolute top-0 right-0 w-full h-full bg-black/40" />
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50 mix-blend-overlay" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl opacity-50 mix-blend-overlay" />
                    
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

                    {/* Content */}
                    <div className="relative z-10 w-full text-center mt-4">
                       <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-[10px] font-black tracking-widest text-white/80 uppercase mb-8 shadow-sm">
                          Cognitive Resonance // مستوى الفوضى: {entropyData.score}%
                       </span>
                    </div>

                    <div className="relative z-10 flex-1 flex items-center justify-center">
                        <p className="text-2xl font-black text-center leading-[1.6] tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 drop-shadow-lg">
                           "{getRandomPoeticQuote()}"
                        </p>
                    </div>

                    <div className="relative z-10 w-full mt-4 flex items-center justify-between border-t border-white/20 pt-5">
                       <div className="flex flex-col text-right">
                          <span className="text-xs font-bold text-white tracking-widest uppercase">The Sanctuary</span>
                          <span className="text-[9px] font-medium text-white/50 tracking-wider">Dawayir OS v2</span>
                       </div>
                       
                       <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center bg-white/10 backdrop-blur-sm">
                          <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" />
                       </div>
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-3">
               <button
                  onClick={() => handleCapture(true)}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-3.5 px-6 rounded-2xl transition-all disabled:opacity-50"
               >
                  <Share2 className="w-5 h-5" />
                  <span>مشاركة كقصة (Share Story)</span>
               </button>
               
               <button
                  onClick={() => handleCapture(false)}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold py-3.5 px-6 rounded-2xl transition-all disabled:opacity-50"
               >
                  <Download className="w-5 h-5" />
                  <span>حفظ في الجهاز</span>
               </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
