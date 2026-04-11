import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles, BrainCircuit, X, Check, Lock, Star, Loader2, Zap } from "lucide-react";
import { useAuthState } from "@/domains/auth/store/auth.store";
import { TIER_PRICES_USD } from "@/config/pricing";
import { PaymentCheckout } from '@/modules/meta/PaymentCheckout';

interface UpgradeScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ isOpen, onClose }) => {
  const { tier } = useAuthState();
  const [isUpgrading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setShowCheckout(true);
  };

  const handlePaymentSuccess = async () => {
    setShowCheckout(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[550px]"
        dir="rtl"
      >
        {showCheckout ? (
          <div className="w-full relative">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 left-4 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <PaymentCheckout onClose={() => setShowCheckout(false)} onSuccess={handlePaymentSuccess} />
          </div>
        ) : (
          <>
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="hidden md:flex flex-col justify-center items-center w-5/12 bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border-l border-white/5 relative p-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 bottom-0 h-64 bg-amber-500/10 rounded-full blur-3xl -mb-32"
          />

          <Shield className="w-20 h-20 text-amber-400 mb-6 drop-shadow-[0_0_20px_rgba(245,166,35,0.4)]" />
          
          <div className="bg-red-500/20 text-red-300 text-[11px] font-black tracking-wide px-4 py-1.5 rounded-full mb-5 border border-red-500/30 animate-pulse flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            متبقي أماكن محدودة للدفعة الحالية
          </div>

          <h2 className="text-3xl font-black text-white mb-4 leading-tight">أوقف نزيف طاقتك الآن</h2>
          <p className="text-sm font-medium text-amber-100/70 leading-relaxed max-w-sm">
            المنصة مصممة مش عشان ترفهك، مصممة عشان تديك درع صلب تقدر تتعامل بيه مع الدجالين ودوائرك المستنزِفة.
          </p>
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
          <div className="text-center md:text-right mb-8 mt-2">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
              <Star className="w-4 h-4" /> الدفعة التأسيسية (Founding Cohort)
            </h3>
            <h1 className="text-2xl md:text-3xl font-black text-slate-100 mb-3">امتلك أدوات النجاة النفسية</h1>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              بانضمامك للدفعة التأسيسية، إنت بتأمن سعرك الحصري <strong className="text-white">مدى الحياة</strong> طالما اشتراكك شغال. الفرصة والسعر ده مش هيتكرروا بعد الإطلاق العام.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-6 rounded-2xl border ${tier === "free" ? "border-slate-500 bg-slate-800/40" : "border-slate-700/50 bg-slate-800/10"} relative`}>
              <h4 className="text-base font-bold text-slate-300 mb-1">الوضع الحالي (نزيف)</h4>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-2xl font-black text-white">مجاني</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                  <Check className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span>خريطة صماء (محدودة بـ 3 أشخاص فقط بيستنزفوك ومش عارف تعمل إيه)</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                  <Check className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                  <span>تتبع بدائي للدوائر بدون تدخل أو نصيحة احترافية للتعامل معاهم</span>
                </li>
              </ul>
              <button disabled className="w-full py-3 bg-slate-800/50 text-slate-500 rounded-xl text-xs font-bold border border-slate-700/50">
                {tier === "free" ? "باقتك الحالية المُقيدة" : "العودة للمستوى الأساسي"}
              </button>
            </div>

            <div className={`p-6 rounded-2xl border-2 relative overflow-hidden flex flex-col justify-between ${tier === "pro" ? "border-amber-500 bg-amber-500/10 shadow-[0_0_30px_rgba(245,166,35,0.15)]" : "border-amber-500/50 bg-slate-800 border-t-amber-500"}`}>
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-600 to-amber-500 text-black text-[10px] font-black px-4 py-1.5 rounded-bl-xl shadow-md">
                السعر التأسيسي المحمي
              </div>
              
              <div>
                <h4 className="text-lg font-black text-amber-400 mb-1 mt-2 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> درع التأسيس
                </h4>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-black text-white">${TIER_PRICES_USD.premium.monthly}</span>
                  <span className="text-sm font-medium text-amber-200/50">/ شهرياً </span>
                  <span className="text-[10px] text-amber-500 border border-amber-500/30 rounded px-1 ml-1">تثبيت للأبد</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3 text-xs text-slate-200">
                    <BrainCircuit className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span><strong>عقل محمد رسول الله (Oracle):</strong> تحليل وتفكيك أزماتك الفورية بدل ما تدفع ألوفات في استشارات غير مجدية.</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-slate-200">
                    <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span><strong>محاكي الحدود (Simulator):</strong> تدريب تكتيكي قاسٍ لتتعلم تقول "لأ" للدوائر السامة من غير إحساس بالذنب.</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs text-slate-200">
                    <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span><strong>استوديو المحتوى والتقارير:</strong> تقارير لا محدودة، وصناعة السكربتات المخصصة بالـ AI.</span>
                  </li>
                </ul>
              </div>

              {tier !== "pro" ? (
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl text-[13px] font-black transition-all shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 mt-auto"
                >
                  {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  {isUpgrading ? "جاري تجهيز الدرع..." : "انضم للدفعة التأسيسية وأوقف النزيف"}
                </button>
              ) : (
                <button className="w-full py-3.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-xl text-[13px] font-black cursor-default mt-auto">
                  أنت محمي داخل الدفعة التأسيسية
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] font-medium text-slate-500 mt-6 pb-2">
            الدفع آمن ومحمي، يتم تجديد الاشتراك تلقائياً ويمكنك إلغاؤه في أي وقت بنقرة واحدة.
          </p>
        </div>
          </>
        )}
      </motion.div>
    </div>
  );
};


