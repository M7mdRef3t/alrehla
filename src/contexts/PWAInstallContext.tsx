/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getFromLocalStorage, setInLocalStorage } from "../services/browserStorage";
import { getWindowOrNull } from "../services/clientRuntime";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneDisplay(): boolean {
  const windowRef = getWindowOrNull();
  if (!windowRef) return false;
  const nav = windowRef.navigator as Navigator & { standalone?: boolean };
  return windowRef.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isLikelyInAppBrowser(ua: string): boolean {
  return /(FBAN|FBAV|Instagram|Line|TikTok|Snapchat|wv)/i.test(ua);
}

function showInstallInstructions(options: {
  isAndroid: boolean;
  isIOS: boolean;
  isInAppBrowser: boolean;
}) {
  const windowRef = getWindowOrNull();
  if (!windowRef) return;

  if (options.isInAppBrowser) {
    windowRef.alert('متصفح التطبيق الحالي لا يدعم التثبيت مباشرة. افتح الصفحة في Chrome أو Safari ثم اختر "إضافة إلى الشاشة الرئيسية".');
    return;
  }

  if (options.isAndroid) {
    windowRef.alert('على Android: افتح قائمة المتصفح ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home screen).');
    return;
  }

  if (options.isIOS) {
    windowRef.alert('على iPhone/iPad: اضغط زر المشاركة ثم اختر "إضافة إلى الشاشة الرئيسية".');
    return;
  }

  windowRef.alert('على Chrome أو Edge من الكمبيوتر: افتح قائمة المتصفح ثم اختر "Install app" أو "تثبيت التطبيق".');
}

interface PWAInstallContextValue {
  canShowInstallButton: boolean;
  triggerInstall: () => Promise<void>;
  hasInstallPrompt: boolean;
  showInstallHint: () => void;
  showAndroidBanner: boolean;
  showIOSBanner: boolean;
  dismissBanner: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  isIPad: boolean;
  isInAppBrowser: boolean;
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
  const [hasMounted, setHasMounted] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [forceShowHint, setForceShowHint] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const stored = getFromLocalStorage("install-banner-dismissed");
    if (!stored) return;
    const ts = parseInt(stored, 10);
    const week = 7 * 24 * 60 * 60 * 1000;
    setDismissed(Date.now() - ts < week);
  }, []);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    const nav = windowRef.navigator;
    const ua = nav.userAgent ?? "";
    const iPadOS = nav.platform === "MacIntel" && nav.maxTouchPoints > 1;
    const iPadUA = /iPad/.test(ua);
    const iPhoneIPod = /iPhone|iPod/.test(ua);

    setIsIPad(iPadUA || iPadOS);
    setIsIOS(iPhoneIPod || iPadUA || iPadOS);
    setIsAndroid(/Android/i.test(ua));
    setIsInAppBrowser(isLikelyInAppBrowser(ua));
    setIsTouchDevice("ontouchstart" in windowRef || nav.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    const update = () => setIsStandalone(isStandaloneDisplay());
    update();
    const media = windowRef.matchMedia("(display-mode: standalone)");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;

    const handler = (event: Event) => {
      if (isStandaloneDisplay()) return;
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    windowRef.addEventListener("beforeinstallprompt", handler);
    return () => windowRef.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;
    if (!isTouchDevice && !windowRef.matchMedia("(max-width: 768px)").matches) return;
    if (isStandalone) return;
    const timer = windowRef.setTimeout(() => setIsVisible(true), 800);
    return () => windowRef.clearTimeout(timer);
  }, [isTouchDevice, isStandalone]);

  useEffect(() => {
    const windowRef = getWindowOrNull();
    if (!windowRef) return;

    const handler = () => {
      setIsVisible(false);
      setInstallEvent(null);
      setIsStandalone(true);
    };

    windowRef.addEventListener("appinstalled", handler);
    return () => windowRef.removeEventListener("appinstalled", handler);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!installEvent) {
      setDismissed(false);
      setForceShowHint(true);
      setIsVisible(true);
      showInstallInstructions({ isAndroid, isIOS, isInAppBrowser });
      return;
    }

    await installEvent.prompt();
    try {
      await installEvent.userChoice;
    } catch {
      // ignore
    }
    setInstallEvent(null);
  }, [installEvent, isAndroid, isIOS, isInAppBrowser]);

  const showInstallHint = useCallback(() => {
    setDismissed(false);
    setForceShowHint(true);
    setIsVisible(true);

    if (!installEvent) {
      showInstallInstructions({ isAndroid, isIOS, isInAppBrowser });
    }
  }, [installEvent, isAndroid, isIOS, isInAppBrowser]);

  const dismissBanner = useCallback(() => {
    setDismissed(true);
    setForceShowHint(false);
    if (getWindowOrNull()) {
      setInLocalStorage("install-banner-dismissed", Date.now().toString());
    }
  }, []);

  const windowRef = hasMounted ? getWindowOrNull() : null;
  const hasInstallPrompt = Boolean(installEvent);
  const canShowInstallButton = hasMounted && !isStandalone;
  const canRenderBanner =
    hasMounted && !dismissed && (isTouchDevice || (windowRef?.matchMedia("(max-width: 768px)").matches ?? false));
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
    isInAppBrowser,
    installEvent
  };

  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
}
