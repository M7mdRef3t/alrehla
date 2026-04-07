import type { FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, X, Zap, Wifi, Download, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/contexts/PWAInstallContext";

const BENEFITS = [
  { icon: Zap, label: "سرعة فائقة دون تحميل" },
  { icon: Wifi, label: "يعمل بدون إنترنت" },
  { icon: Smartphone, label: "تجربة تطبيق حقيقي" },
];

export const InstallHintBanner: FC = () => {
  const ctx = usePWAInstall();
  if (!ctx) return null;

  const {
    showAndroidBanner,
    showIOSBanner,
    dismissBanner,
    installEvent,
    triggerInstall,
    isIPad,
    isInAppBrowser,
  } = ctx;

  if (!showAndroidBanner && !showIOSBanner) return null;

  return (
    <AnimatePresence>
      {(showAndroidBanner || showIOSBanner) && (
        <motion.div
          key="install-banner"
          className="fixed left-1/2 -translate-x-1/2 z-[40] w-[min(92vw,28rem)]
                     top-[calc(env(safe-area-inset-top)+3.5rem)]"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          dir="rtl"
        >
          {/* Backdrop + border glow */}
          <div className="relative rounded-3xl overflow-hidden
                          border border-teal-500/30
                          bg-slate-900/95 backdrop-blur-xl
                          shadow-[0_24px_64px_rgba(0,0,0,0.7),0_0_0_1px_rgba(45,212,191,0.1)]">

            {/* Top accent line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-teal-500/0 via-teal-400 to-teal-500/0" />

            <div className="p-5">
              {/* Close Button */}
              <button
                onClick={dismissBanner}
                className="absolute top-3.5 left-3.5 w-7 h-7 rounded-full bg-white/5
                           flex items-center justify-center
                           text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                aria-label="إغلاق"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600
                                flex items-center justify-center shrink-0 shadow-[0_8px_16px_rgba(45,212,191,0.3)]">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-base leading-tight">
                    احصل على تطبيق الرحلة
                  </p>
                  <p className="text-teal-400 text-xs font-semibold mt-0.5">
                    مجاني — بدون متجر تطبيقات
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {BENEFITS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-white/[0.04]
                               border border-white/[0.06] text-center"
                  >
                    <Icon className="h-4 w-4 text-teal-400" />
                    <span className="text-[10px] text-slate-400 leading-tight font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Instruction / in-app browser warning */}
              {isInAppBrowser && (
                <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400 text-sm mt-0.5">⚠️</span>
                  <p className="text-amber-300 text-xs leading-relaxed font-medium">
                    أنت داخل متصفح فيسبوك/إنستجرام.
                    افتح الرابط في {showIOSBanner ? "Safari" : "Chrome"} أولاً.
                  </p>
                </div>
              )}

              {showIOSBanner && !isInAppBrowser && (
                <p className="text-slate-400 text-xs leading-relaxed mb-4">
                  {isIPad ? "على الآيباد: " : "على iPhone: "}
                  اضغط زر المشاركة{" "}
                  <Share2 className="inline h-3.5 w-3.5 text-teal-400 animate-pulse" aria-hidden />
                  {" "}في أسفل المتصفح، ثم اختر «إضافة إلى الشاشة الرئيسية»
                </p>
              )}

              {showAndroidBanner && !isInAppBrowser && !installEvent && (
                <p className="text-slate-400 text-xs leading-relaxed mb-4">
                  اضغط على أيقونة التثبيت في شريط العنوان أو افتح قائمة المتصفح
                  واختر «إضافة إلى الشاشة الرئيسية».
                </p>
              )}

              {/* CTA button — only Android with native prompt */}
              {installEvent && showAndroidBanner && (
                <button
                  type="button"
                  onClick={triggerInstall}
                  className="w-full py-3 rounded-2xl font-black text-sm text-slate-950
                             bg-gradient-to-r from-teal-400 to-emerald-400
                             hover:from-teal-300 hover:to-emerald-300
                             shadow-[0_8px_24px_rgba(45,212,191,0.3)]
                             hover:shadow-[0_12px_32px_rgba(45,212,191,0.5)]
                             transition-all active:scale-95"
                >
                  إضافة إلى الشاشة الرئيسية
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
