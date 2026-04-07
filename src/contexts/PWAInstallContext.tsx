/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { runtimeEnv } from "../config/runtimeEnv";
import { getFromLocalStorage, setInLocalStorage } from "../services/browserStorage";
import { getWindowOrNull } from "../services/clientRuntime";
import { BeforeInstallPromptEvent, isStandaloneDisplay, isLikelyInAppBrowser, showInstallInstructions } from "../utils/pwa";

export interface PWAInstallContextValue {
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

export function usePWAInstallLogic(): PWAInstallContextValue {
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
    if (runtimeEnv.isDev) return;
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
    if (runtimeEnv.isDev) return;
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
      if (!runtimeEnv.isDev) {
        setDismissed(false);
        setForceShowHint(true);
        setIsVisible(true);
        showInstallInstructions({ isAndroid, isIOS, isInAppBrowser });
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
  }, [installEvent, isAndroid, isIOS, isInAppBrowser]);

  const showInstallHint = useCallback(() => {
    if (runtimeEnv.isDev) return;
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

  return {
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
}

export interface PWAInstallProviderProps {
  children: ReactNode;
}

export function PWAInstallProvider({ children }: PWAInstallProviderProps) {
  const value = usePWAInstallLogic();
  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
}
