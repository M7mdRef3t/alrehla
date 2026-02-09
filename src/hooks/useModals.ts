import { useState, useEffect, useCallback } from "react";

/**
 * Hook to manage modal states for various overlays
 * Consolidates modal logic in one place for easier maintenance
 */
export function useModals() {
  const [showCocoon, setShowCocoon] = useState(false);
  const [showNoiseSilencingPulse, setShowNoiseSilencingPulse] = useState(false);
  const [pendingCocoonAfterNoise, setPendingCocoonAfterNoise] = useState(false);
  const [themeBeforePulse, setThemeBeforePulse] = useState<"light" | "dark" | "system" | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname.startsWith("/admin") : false
  );

  // Handle route changes for admin route detection
  useEffect(() => {
    const handler = () =>
      setIsAdminRoute(window.location.pathname.startsWith("/admin"));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const toggleCocoon = useCallback(() => {
    setShowCocoon((prev) => !prev);
  }, []);

  const toggleNoiseSilencing = useCallback(() => {
    setShowNoiseSilencingPulse((prev) => !prev);
  }, []);

  const toggleAuthModal = useCallback(() => {
    setShowAuthModal((prev) => !prev);
  }, []);

  const toggleDataManagement = useCallback(() => {
    setShowDataManagement((prev) => !prev);
  }, []);

  return {
    // State
    showCocoon,
    showNoiseSilencingPulse,
    pendingCocoonAfterNoise,
    themeBeforePulse,
    showAuthModal,
    showDataManagement,
    isAdminRoute,
    // Setters
    setShowCocoon,
    setShowNoiseSilencingPulse,
    setPendingCocoonAfterNoise,
    setThemeBeforePulse,
    setShowAuthModal,
    setShowDataManagement,
    setIsAdminRoute,
    // Togglers
    toggleCocoon,
    toggleNoiseSilencing,
    toggleAuthModal,
    toggleDataManagement
  };
}
