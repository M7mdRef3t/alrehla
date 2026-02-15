/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isLikelyInAppBrowser(ua: string): boolean {
  return /(FBAN|FBAV|Instagram|Line|TikTok|Snapchat|wv)/i.test(ua);
}

interface PWAInstallContextValue {
  canShowInstallButton: boolean;
  triggerInstall: () => Promise<void>;
  hasInstallPrompt: boolean;
  showInstallHint: () => void;
  /** للبانر: هل نعرض رسالة أندرويد */
  showAndroidBanner: boolean;
  /** للبانر: هل نعرض رسالة iOS */
  showIOSBanner: boolean;
  dismissBanner: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  isIPad: boolean;
  installEvent: BeforeInstallPromptEvent | null;
}

const PWAInstallContext = createContext<PWAInstallContextValue | null>(null);

export function usePWAInstall(): PWAInstallContextValue | null {
  return useContext(PWAInstallContext);
}

interface PWAInstallProviderProps {
  children: ReactNode;
}

export function PWAInstallProvider({ children }: PWAInstallProviderProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("install-banner-dismissed");
    if (!stored) return false;
    const ts = parseInt(stored, 10);
    const week = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - ts < week;
  });
  const [forceShowHint, setForceShowHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = window.navigator;
    const ua = nav.userAgent ?? "";
    const iPadOS = nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
    const iPadUA = /iPad/.test(ua);
    const iPhoneIPod = /iPhone|iPod/.test(ua);
    setIsIPad(iPadUA || iPadOS);
    setIsIOS(iPhoneIPod || iPadUA || iPadOS);
    setIsAndroid(/Android/i.test(ua));
    setIsTouchDevice("ontouchstart" in window || nav.maxTouchPoints > 0);
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
      const isTouchNow = "ontouchstart" in window || window.navigator.maxTouchPoints > 0;
      if ((!isMobileNow && !isTouchNow) || isStandaloneDisplay()) return;
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isTouchDevice && !window.matchMedia("(max-width: 768px)").matches) return;
    if (isStandalone) return;
    const t = window.setTimeout(() => setIsVisible(true), 800);
    return () => window.clearTimeout(t);
  }, [isTouchDevice, isStandalone]);

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

  const triggerInstall = useCallback(async () => {
    if (!installEvent) {
      setDismissed(false);
      setForceShowHint(true);
      setIsVisible(true);
      if (typeof window !== "undefined") {
        const ua = window.navigator.userAgent ?? "";
        if (isLikelyInAppBrowser(ua)) {
          window.alert('هذا المتصفح لا يدعم تثبيت التطبيق مباشرة. افتح الصفحة في Chrome أو Safari ثم جرّب "تثبيت التطبيق".');
        } else if (isAndroid) {
          window.alert('لو لم تظهر نافذة التثبيت: افتح قائمة المتصفح ثم اختر "تثبيت التطبيق" أو "Add to Home screen".');
        } else if (isIOS) {
          window.alert('لتثبيت التطبيق على iPhone/iPad: اضغط زر المشاركة ثم "إضافة إلى الشاشة الرئيسية".');
        }
      }
      return;
    }
    await installEvent.prompt();
    try {
      await installEvent.userChoice;
    } catch {
      // ignore
    }
    setInstallEvent(null);
  }, [installEvent, isAndroid, isIOS]);

  const showInstallHint = useCallback(() => {
    setDismissed(false);
    setForceShowHint(true);
    setIsVisible(true);
    if (typeof window !== "undefined" && !installEvent && isIOS) {
      window.alert("لتثبيت التطبيق على الآيفون/الآيباد: افتح زر المشاركة ⋯ ثم اختر \"إضافة إلى الشاشة الرئيسية\".");
    }
  }, [installEvent, isIOS]);

  const dismissBanner = useCallback(() => {
    setDismissed(true);
    setForceShowHint(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("install-banner-dismissed", Date.now().toString());
    }
  }, []);

  /** موبايل + تابلت: شاشة حتى 1024px أو جهاز لمس (يغطي التابلت أفقي وعمودي) */
  const canShowInstallButton =
    !isStandalone && typeof window !== "undefined" && (window.matchMedia("(max-width: 1024px)").matches || isTouchDevice);
  const hasInstallPrompt = Boolean(installEvent);
  const canRenderBanner = !dismissed && (isTouchDevice || (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches));
  const showAndroidBanner = canRenderBanner && (forceShowHint || isVisible) && isAndroid;
  const showIOSBanner = canRenderBanner && (forceShowHint || isVisible) && isIOS;

  const value: PWAInstallContextValue = {
    canShowInstallButton,
    triggerInstall,
    hasInstallPrompt,
    showInstallHint,
    showAndroidBanner,
    showIOSBanner,
    dismissBanner,
    isIOS,
    isAndroid,
    isIPad,
    installEvent
  };

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
}
