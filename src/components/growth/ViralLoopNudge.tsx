"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Gift, X, Sparkles, Heart, Zap } from "lucide-react";
import { 
  getReferralShareText, 
  getReferralRewardStatus, 
  getMyReferralLink 
} from "../../services/referralEngine";

interface ViralLoopNudgeProps {
  onClose?: () => void;
  forceShow?: boolean;
}

export function ViralLoopNudge({ onClose, forceShow = false }: ViralLoopNudgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  const [copied, setCopied] = useState(false);
  
  const status = getReferralRewardStatus();

  useEffect(() => {
    // Show nudge after a small delay if not forced
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, forceShow ? 0 : 5000);
    
    return () => clearTimeout(timer);
  }, [forceShow]);

  const handleShare = async () => {
    const text = getReferralShareText();
    const link = getMyReferralLink();

    try {
      if (navigator.share) {
        await navigator.share({
          title: "الرحلة — افهم حواراتك",
          text: text,
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(`${text}\n${link}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (e) {
      console.error("Share failed", e);
    }
  };

  if (!isVisible && !forceShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-6 left-6 md:left-auto md:w-80 z-[100]"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-500/30 bg-slate-900/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-fuchsia-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-indigo-500/20 blur-3xl rounded-full" />

            <button 
              onClick={() => { setIsVisible(false); onClose?.(); }}
              className="absolute top-4 left-4 p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/20"
              >
                <Gift className="w-8 h-8" />
              </motion.div>

              <div>
                <h3 className="text-lg font-black text-white leading-tight mb-1">شير النور، واكسب زمان! 🌙</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  باقي لك {status.nextRewardAt - status.count} وتوصل للمكافأة الجاية. 
                  كل واحد من حبايبك هيسجل بكودك، هتاخد عليه أسبوع بريميوم هدية.
                </p>
              </div>

              <div className="w-full space-y-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-fuchsia-900/20 uppercase tracking-widest"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? "تم النسخ بنجاح ✅" : "ابعت 'نداء' لحبايبك"}
                </motion.button>
                
                <p className="text-[10px] font-bold text-fuchsia-400/60 uppercase tracking-tighter flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" />
                  شير في الخير واعمل الواجب
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
