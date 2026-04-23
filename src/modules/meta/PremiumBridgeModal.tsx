import type { FC } from "react";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Zap as Sparkles, Lock } from "lucide-react";
import { useMapState } from '@/modules/map/dawayirIndex';
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";
import { useEffect, useState } from "react";
import { trackEvent, AnalyticsEvents } from "@/services/analytics";
import { PaymentCheckout } from "./PaymentCheckout";

export const PremiumBridgeModal: FC = () => {
  const isOpen = useAppOverlayState((s) => s.flags.premiumBridge);
  const setOverlay = useAppOverlayState((s) => s.setOverlay);
  const nodes = useMapState((s) => s.nodes);
  const [showCheckout, setShowCheckout] = useState(false);

  const stats = useMemo(() => {
    const total = nodes.length;
    const red = nodes.filter((n) => n.ring === "red").length;
    const amber = nodes.filter((n) => n.ring === "yellow").length;
    return { total, red, amber };
  }, [nodes]);

  useEffect(() => {
    if (isOpen) {
      trackEvent(AnalyticsEvents.PREMIUM_UPGRADE_VIEWED, {
        total_nodes: stats.total,
        red_nodes: stats.red,
        amber_nodes: stats.amber,
        bypassConsent: true // Essential P0 marketing event
      });
    }
  }, [isOpen, stats]);

  const handleStartRecovery = () => {
    setShowCheckout(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 select-none" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900 shadow-2xl"
          style={{
            background: "radial-gradient(circle at top right, rgba(20,184,166,0.15), transparent 40%), #0f172a"
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-teal-400/40 to-transparent" />

          {showCheckout ? (
            <PaymentCheckout onClose={() => setShowCheckout(false)} onSuccess={() => setOverlay("premiumBridge", false)} />
          ) : (
            <div className="p-8 pt-10">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full" />
                <div className="relative w-20 h-20 rounded-3xl bg-linear-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/10 rotate-3">
                  <ShieldCheck className="w-10 h-10 text-slate-950 -rotate-3" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </motion.div>
              </div>

              <h2 className="text-3xl font-black text-white leading-tight">
                خريطتك بقت أوضح.. <br />
                وده وقت تكمل من جوه
              </h2>

              <p className="mt-4 text-slate-300 text-lg leading-relaxed max-w-xs">
                انتهت المرحلة الأولى بنجاح. رصدنا <span className="text-white font-bold">{stats.total} علاقة</span>،
                واللي جاي بيتبني من نفس الخريطة.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-3xl border border-white/5 bg-white/[0.03] space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">المنطقة الحمراء</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-rose-400">{stats.red}</span>
                  <span className="text-xs text-slate-400">علاقات مستنزفة</span>
                </div>
              </div>
              <div className="p-4 rounded-3xl border border-white/5 bg-white/[0.03] space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">جاهز للتحول</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-amber-400">{stats.amber}</span>
                  <span className="text-xs text-slate-400">تحتاج وعي أكبر</span>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <button
                onClick={handleStartRecovery}
                className="group relative w-full flex items-center justify-between p-5 rounded-[2rem] bg-teal-400 hover:bg-teal-300 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950/10 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-slate-950" />
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-950">افتح مساحتك الخاصة الآن 🚀</p>
                    <p className="text-xs text-slate-800/70 font-bold">باقة المسار المتقدم لتعافي كامل وعميق</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-950/40 group-hover:translate-x-[-4px] transition-transform" />
              </button>
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-500 leading-relaxed px-6">
              بإتمام الدفع، هيتم رفع حظر الدخول فوراً وفتح تحليلات "المعالج الذكي" لتفكيك شفرات خريطتك.
            </p>
          </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
