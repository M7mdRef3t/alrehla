import type { FC } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Download, Share2 } from "lucide-react";

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
  const isMobile = useMediaMatch("(max-width: 768px)");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

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
      const isStandaloneNow = isStandaloneDisplay();
      if (!isMobileNow || isStandaloneNow) return;
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMobile || isStandalone) return;
    if (!isAndroid || isIOS) return;

    const t = window.setTimeout(() => setIsVisible(true), 800);
    return () => window.clearTimeout(t);
  }, [isMobile, isStandalone, isAndroid, isIOS]);

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

  const canRender = isMobile && !isStandalone;
  const showAndroidPrompt = isVisible && canRender && isAndroid && !isIOS;
  const showIOSHint = canRender && isIOS;
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
          <div className="relative rounded-2xl border border-emerald-200 bg-emerald-50/95 backdrop-blur px-4 py-3 shadow-xl dark:border-emerald-900/60 dark:bg-slate-900/90">
            <div
              className="absolute -top-2 right-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-emerald-50/95 dark:border-b-slate-900/90"
              aria-hidden="true"
            />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  ثبّت الرحلة كتطبيق
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1">
                  {installEvent ? (
                    <>
                      هتلاقي أيقونة التثبيت في شريط العنوان بالأعلى{" "}
                      <span className="inline-flex align-middle mx-0.5 text-emerald-700 dark:text-emerald-200">
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      اضغطها عشان تضيف المنصة على موبايلك.
                    </>
                  ) : (
                    <>
                      لو ظهرت أيقونة التثبيت في شريط العنوان بالأعلى{" "}
                      <span className="inline-flex align-middle mx-0.5 text-emerald-700 dark:text-emerald-200">
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      اضغطها. ولو مش ظاهرة: افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية".
                    </>
                  )}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {installEvent && (
                    <button
                      type="button"
                      onClick={triggerInstall}
                      className="rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      تثبيت الآن
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
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 backdrop-blur px-4 py-3 shadow-xl dark:border-emerald-900/60 dark:bg-slate-900/90">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  ثبّت الرحلة على الآيفون
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1">
                  {isIPad ? "على الآيباد: " : ""}
                  اضغط زر المشاركة
                  <span className="inline-flex items-center justify-center mx-1 align-middle text-emerald-700 dark:text-emerald-200">
                    <Share2 className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  ثم «إضافة إلى الشاشة الرئيسية».
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
