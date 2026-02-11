import type { FC } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Download, Share2, X, Smartphone, Zap, Wifi } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const useMediaMatch = (query: string, fallback = false) => {
  const [matches, setMatches] = useState(fallback);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
};

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
};

export const InstallHintBanner: FC = () => {
  const isMobile = useMediaMatch("(max-width: 768px)", true); // fallback to true for SSR
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = window.navigator;
    const ua = nav.userAgent ?? "";
    const iPadOS = nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
    const iPadUA = /iPad/.test(ua);
    const iPhoneIPod = /iPhone|iPod/.test(ua);
    const isPad = iPadUA || iPadOS;
    setIsIPad(isPad);
    setIsIOS(iPhoneIPod || isPad);
    setIsAndroid(/Android/i.test(ua));
    setIsTouchDevice('ontouchstart' in window || nav.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setIsStandalone(isStandaloneDisplay());
    update();
    const media = window.matchMedia("(display-mode: standalone)");

    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const isMobileNow = window.matchMedia("(max-width: 768px)").matches;
      const isTouchNow = 'ontouchstart' in window || window.navigator.maxTouchPoints > 0;
      const isStandaloneNow = isStandaloneDisplay();
      if ((!isMobileNow && !isTouchNow) || isStandaloneNow) return;
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((!isMobile && !isTouchDevice) || isStandalone) return;

    const t = window.setTimeout(() => setIsVisible(true), 800);
    return () => window.clearTimeout(t);
  }, [isMobile, isTouchDevice, isStandalone]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setIsVisible(false);
      setInstallEvent(null);
      setIsStandalone(true);
    };

    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  const triggerInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    try {
      await installEvent.userChoice;
    } catch {
      // Ignore prompt errors to avoid blocking the UI.
    }
    setInstallEvent(null);
    // Keep banner visible until app is actually installed (appinstalled event).
  };

  const canRender = (isMobile || isTouchDevice) && !isStandalone && !dismissed;
  const showAndroidPrompt = isVisible && canRender && isAndroid;
  const showIOSHint = canRender && isIOS;
  
  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage to not show again for a while
    if (typeof window !== "undefined") {
      localStorage.setItem("install-banner-dismissed", Date.now().toString());
    }
  };

  // Check if previously dismissed (don't show for 7 days)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem("install-banner-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < weekInMs) {
        setDismissed(true);
      } else {
        localStorage.removeItem("install-banner-dismissed");
      }
    }
  }, []);
  
  if (!showAndroidPrompt && !showIOSHint) return null;

  return (
    <AnimatePresence>
      {showAndroidPrompt && (
        <motion.div
          key="android-install"
          className="fixed right-4 z-[40] w-[min(92vw,26rem)] top-[calc(env(safe-area-inset-top)+0.75rem)]"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
        >
          <div className="relative rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50/95 backdrop-blur px-4 py-3 dark:border-blue-800/60 dark:from-slate-800/90 dark:to-indigo-900/90">
            <div
              className="absolute -top-2 right-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-50/95 dark:border-b-slate-800/90"
              aria-hidden="true"
            />
            <button
              onClick={handleDismiss}
              className="absolute top-2 left-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  تطبيق الرحلة أسرع وأفضل
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <Zap className="h-3 w-3" />
                    <span>وصول فوري وتجربة أسرع</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <Wifi className="h-3 w-3" />
                    <span>يعمل حتى بدون إنترنت</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  {installEvent ? (
                    <>
                      اضغط على زر التثبيت اللي ظهر في الأعلى{" "}
                      <span className="inline-flex align-middle mx-0.5 text-blue-600 dark:text-blue-300">
                        <ArrowUpRight className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                      </span>
                      عشان تحمل التطبيق.
                    </>
                  ) : (
                    <>
                      اضغط على أيقونة التثبيت في شريط العنوان بالأعلى{" "}
                      <span className="inline-flex align-middle mx-0.5 text-blue-600 dark:text-blue-300">
                        <ArrowUpRight className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                      </span>
                      أو افتح قائمة المتصفح واختر "تثبيت التطبيق".
                    </>
                  )}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {installEvent && (
                    <button
                      type="button"
                      onClick={triggerInstall}
                      className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                    >
                      تحميل التطبيق
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {showIOSHint && (
        <motion.div
          key="ios-install"
          className="fixed left-1/2 -translate-x-1/2 z-[40] w-[min(92vw,26rem)] top-[calc(env(safe-area-inset-top)+0.75rem)]"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
        >
          <div className="relative rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50/95 backdrop-blur px-4 py-3 dark:border-blue-800/60 dark:from-slate-800/90 dark:to-indigo-900/90">
            <button
              onClick={handleDismiss}
              className="absolute top-2 left-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  تطبيق الرحلة أسرع وأفضل
                </p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <Zap className="h-3 w-3" />
                    <span>وصول فوري وتجربة أسرع</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <Wifi className="h-3 w-3" />
                    <span>يعمل حتى بدون إنترنت</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  {isIPad ? "على الآيباد: " : ""}
                  اضغط زر المشاركة
                  <span className="inline-flex items-center justify-center mx-1 align-middle text-blue-600 dark:text-blue-300">
                    <Share2 className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                  </span>
                  ثم اختر "إضافة إلى الشاشة الرئيسية" عشان تحمل التطبيق.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
