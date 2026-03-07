import type { FC } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Share2, X, Smartphone, Zap, Wifi } from "lucide-react";
import { usePWAInstall } from "../contexts/PWAInstallContext";

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
    isInAppBrowser
  } = ctx;

  if (!showAndroidBanner && !showIOSBanner) return null;

  return (
    <AnimatePresence>
      {showAndroidBanner && (
        <motion.div
          key="android-install"
          className="fixed left-1/2 -translate-x-1/2 z-[40] w-[min(92vw,26rem)] top-[calc(env(safe-area-inset-top)+3.25rem)]"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
        >
          <div className="relative rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 to-[var(--soft-teal)] backdrop-blur px-4 py-3 dark:border-blue-800/60 dark:from-slate-800/90 dark:to-[var(--soft-teal)]">
            <div
              className="absolute -top-2 right-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-50/95 dark:border-b-slate-800/90"
              aria-hidden="true"
            />
            <button
              onClick={dismissBanner}
              className="absolute top-2 left-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="إغا"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-[var(--soft-teal)] text-white">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  تطب ارحة أسرع أفض
                </p>
                <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">
                  ذا س تزا  اتجر  اختصار ضف اتطب شاشة ارئسة.
                </p>
                {isInAppBrowser && (
                  <p className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    أت داخ تصفح فسب/إستجرا. افتح ارابط ف Chrome ث اختر "إضافة إ اشاشة ارئسة".
                  </p>
                )}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <Zap className="h-3 w-3" />
                    <span>ص فر تجربة أسرع</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <Wifi className="h-3 w-3" />
                    <span>ع حت بد إترت</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  {installEvent ? (
                    <>
                      اضغط زر "إضافة شاشة ارئسة" ا تحت أ ف اائة اجابة.
                    </>
                  ) : (
                    <>
                      اضغط ع أة اتثبت ف شرط اعا باأع{" "}
                      <span className="inline-flex align-middle mx-0.5 text-blue-600 dark:text-blue-300">
                        <ArrowUpRight className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                      </span>
                      أ افتح ائة اتصفح اختر "إضافة شاشة ارئسة".
                    </>
                  )}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {installEvent && (
                    <button
                      type="button"
                      onClick={triggerInstall}
                      className="rounded-full bg-gradient-to-r from-blue-600 to-[var(--soft-teal)] text-white px-3 py-1.5 text-xs font-semibold hover:from-blue-700 hover:to-[var(--soft-teal)] transition-all"
                    >
                      إضافة شاشة ارئسة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {showIOSBanner && (
        <motion.div
          key="ios-install"
          className="fixed left-1/2 -translate-x-1/2 z-[40] w-[min(92vw,26rem)] top-[calc(env(safe-area-inset-top)+3.25rem)]"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
        >
          <div className="relative rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 to-[var(--soft-teal)] backdrop-blur px-4 py-3 dark:border-blue-800/60 dark:from-slate-800/90 dark:to-[var(--soft-teal)]">
            <button
              onClick={dismissBanner}
              className="absolute top-2 left-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="إغا"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-[var(--soft-teal)] text-white">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  تطب ارحة أسرع أفض
                </p>
                <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">
                  ذا س تزا  اتجر  اختصار ضف اتطب شاشة ارئسة.
                </p>
                {isInAppBrowser && (
                  <p className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    أت داخ تصفح فسب/إستجرا. افتح ارابط ف Safari ث اختر "إضافة إ اشاشة ارئسة".
                  </p>
                )}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <Zap className="h-3 w-3" />
                    <span>ص فر تجربة أسرع</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <Wifi className="h-3 w-3" />
                    <span>ع حت بد إترت</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  {isIPad ? "ع اآباد: " : ""}
                  اضغط زر اشارة
                  <span className="inline-flex items-center justify-center mx-1 align-middle text-blue-600 dark:text-blue-300">
                    <Share2 className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                  </span>
                  ث اختر "إضافة إ اشاشة ارئسة" عشا تح اتطب.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


