import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Ticket, Download, Zap as Sparkles, User, Calendar, Award, Loader2 } from "lucide-react";
// html2canvas loaded on-demand inside handleDownloadImage to avoid bundle bloat

interface BoardingPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string | null;
  joinDate?: string;
  userId?: string;
  poeticState?: string;
}

const SHIMMER_ANIMATION = `
@keyframes shimmer {
  0% { transform: translateX(-100%) rotate(25deg); opacity: 0; }
  20% { opacity: 0.3; }
  50% { transform: translateX(100%) rotate(25deg); opacity: 0.3; }
  100% { transform: translateX(200%) rotate(25deg); opacity: 0; }
}
`;

export const BoardingPassModal: FC<BoardingPassModalProps> = ({ isOpen, onClose, userName, joinDate, userId, poeticState }) => {
  const [mounted, setMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    }
  }, [isOpen]);

  const handleDownloadImage = async () => {
    if (!ticketRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      
      // Wait a tiny bit for any animations to settle
      await new Promise(r => setTimeout(r, 100));

      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Dawayir-Founding-Member-${userName || 'Pass'}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("[BoardingPass] Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const displayDate = joinDate || new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const serialNumber = userId ? userId.slice(0, 8).toUpperCase() : "FOUNDER-001";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-[2.5rem] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Sparks */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-10 left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 md:p-12 text-center relative z-10">
            <motion.div 
               initial={{ y: -10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6"
            >
              <Award className="w-3 h-3" />
              وصول عضوية تأسيسية
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight"
            >
              أهلاً بك في <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">الطليعة</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-slate-400 text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed"
            >
              إنت الآن جزء من الدفعة التأسيسية لمنصة دوائر. رحلتك نحو القيادة النفسية والوعي الكامل بدأت رسمياً.
            </motion.p>

            {/* The Ticket / Boarding Pass Visual */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.6 }}
              className="relative mx-auto max-w-lg"
            >
              {/* Wrapper to handle rounded edges and bg during capture */}
              <div 
                ref={ticketRef} 
                className="bg-slate-900 rounded-[2.2rem] p-px bg-gradient-to-br from-amber-500/50 via-amber-200/30 to-amber-600/50 shadow-[0_0_40px_rgba(245,158,11,0.2)]"
              >
                <style>{SHIMMER_ANIMATION}</style>
                <div className="bg-slate-950 rounded-[2.1rem] p-6 md:p-8 text-right relative overflow-hidden group">
                  {/* Gold Foil Shimmer */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div 
                      className="absolute inset-0 w-1/2 h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      style={{ animation: 'shimmer 4s infinite linear', top: '-50%' }}
                    />
                  </div>
                  {/* Stamp */}
                  <div className="absolute top-4 left-4 opacity-10 rotate-[-15deg] scale-150 group-hover:scale-[1.6] transition-transform duration-700">
                     <ShieldCheck className="w-24 h-24 text-amber-400" />
                  </div>

                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">الرقم التسلسلي</p>
                      <p className="text-sm font-mono text-amber-500/80">{serialNumber}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">حامل البطاقة</p>
                      <div className="flex items-center gap-3 justify-end">
                        <p className="text-xl md:text-2xl font-black text-slate-100">{userName || "مُحارب الوعي"}</p>
                        <User className="w-5 h-5 text-amber-400/60" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-amber-500/20 pt-6">
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">الرتبة</p>
                          <div className="flex items-center gap-2 justify-end text-amber-400 font-bold">
                             <span className="text-xs">عضو تأسيسي</span>
                             <Sparkles className="w-3 h-3" />
                          </div>
                       </div>
                       <div className="text-left">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">تاريخ الإصدار</p>
                          <div className="flex items-center gap-2 text-slate-300 font-bold">
                             <Calendar className="w-3 h-3" />
                             <span className="text-xs font-mono">{displayDate}</span>
                          </div>
                       </div>
                    </div>

                    {poeticState && (
                      <div className="mt-6 border-t border-amber-500/10 pt-4 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">الحالة الخاصة</p>
                        <div className="inline-block px-4 py-1 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="text-sm font-black text-amber-200">{poeticState}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Perforated Line Decoration */}
                  <div className="absolute bottom-16 left-0 w-full border-t border-dashed border-amber-500/20" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <button
                onClick={onClose}
                className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-2xl font-black transition-all shadow-xl shadow-amber-900/40 w-full max-w-xs scale-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                انطلق للمركز
              </button>
              
              <button
                onClick={handleDownloadImage}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 text-slate-400 hover:text-amber-400 text-sm font-bold transition-all p-2 rounded-xl hover:bg-amber-500/5 group"
              >
                {isDownloading ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 group-hover:animate-bounce" />
                )}
                <span>تحميل بطاقة العضوية</span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
