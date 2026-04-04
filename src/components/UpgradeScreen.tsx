import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles, BrainCircuit, X, Check, Lock, Star, Loader2 } from "lucide-react";
import { useAuthState } from "../state/authState";
import { TIER_PRICES_USD } from "../config/pricing";
import { PaymentCheckout } from "./PaymentCheckout";

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
    // This will be called when payment is confirmed
    // For now, the owner manually activates via the dashboard
    // In the future, webhooks will auto-activate
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
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]"
        dir="rtl"
      >
        {showCheckout ? (
          <div className="w-full">
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

        <div className="hidden md:flex flex-col justify-center items-center w-5/12 bg-gradient-to-b from-fuchsia-900/40 to-violet-900/40 border-l border-white/5 relative p-8 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-0 bottom-0 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -mb-32"
          />

          <Star className="w-16 h-16 text-fuchsia-400 mb-6 drop-shadow-[0_0_15px_rgba(232,121,249,0.5)]" />
          <h2 className="text-3xl font-black text-white mb-4">افتح المسار المتقدم داخل المنصة</h2>
          <p className="text-sm text-fuchsia-200 leading-relaxed max-w-xs">
            خذ أدوات أعمق وتحكم أكبر داخل نفس التجربة، من غير قفزات خارجية أو تغيير في المسار.
          </p>
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="text-center md:text-right mb-8 mt-6">
            <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center justify-center md:justify-start gap-2">
              <Lock className="w-4 h-4" /> المسار المتقدم
            </h3>
            <h1 className="text-2xl md:text-3xl font-black text-slate-100 mb-2">اختر مستوى السعة المناسب لك</h1>
            <p className="text-sm text-slate-400">لو محتاج سعة أعلى، ده مكانها. بدون تشويش في الفلو.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-6 rounded-2xl border ${tier === "free" ? "border-slate-500 bg-slate-800/50" : "border-slate-700 bg-slate-800/20"}`}>
              <h4 className="text-lg font-bold text-slate-300 mb-1">الأساسي</h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-white">مجانيًا</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>تتبع الدوائر الأساسية والمواقف</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>حساب طاقة النبضات اليومية</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>رادار مصاصي الطاقة (محدود)</span>
                </li>
              </ul>
              <button disabled className="w-full py-3 bg-slate-700/50 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed">
                {tier === "free" ? "باكتك الحالية" : "العودة للمستوى الأساسي"}
              </button>
            </div>

            <div className={`p-6 rounded-2xl border relative overflow-hidden ${tier === "pro" ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_20px_rgba(217,70,239,0.15)]" : "border-fuchsia-500/30 bg-slate-800 border-t-fuchsia-500"}`}>
              {tier === "pro" && (
                <div className="absolute top-0 right-0 bg-fuchsia-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                  مفعّل حاليًا
                </div>
              )}
              <h4 className="text-lg font-bold text-fuchsia-400 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> المسار المتقدم
              </h4>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-white">${TIER_PRICES_USD.premium.monthly}</span>
                <span className="text-sm text-slate-400">/ شهريًا</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <BrainCircuit className="w-4 h-4 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                  <span><strong>المعالج الذكي (The Oracle):</strong> تفكيك الأزمات السلوكية على مدار الساعة.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <Shield className="w-4 h-4 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                  <span><strong>محاكي الحدود (Boundaries Simulator):</strong> تدريب عملي للنجاة من استنزاف الطاقة.</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-300">
                  <Sparkles className="w-4 h-4 text-fuchsia-400 flex-shrink-0 mt-0.5" />
                  <span><strong>استوديو المحتوى (AI Studio):</strong> توليد سكربتات لا حصر لها لصناع المحتوى.</span>
                </li>
              </ul>

              {tier !== "pro" ? (
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-fuchsia-900/50 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {isUpgrading ? "جاري فتح المسار..." : "افتح المسار المتقدم الآن"}
                </button>
              ) : (
                <button className="w-full py-3 bg-fuchsia-500 text-white rounded-xl text-sm font-bold opacity-80 cursor-default">
                  أنت داخل المسار المتقدم بالفعل
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6 mt-auto">
            الرسوم، لو ظهرت، بتكون ضمن نفس المنصة. يمكن الإلغاء في أي وقت.
          </p>
        </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
