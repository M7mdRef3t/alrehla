/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { usePWALogic, type BeforeInstallPromptEvent } from "../hooks/usePWALogic";

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
  const value = usePWALogic();

  return <PWAInstallContext.Provider value={value}>{children}</PWAInstallContext.Provider>;
}
