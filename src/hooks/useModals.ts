import { useState, useEffect, useCallback } from "react";
import { isAdminPath, subscribePopstate } from "@/services/navigation";

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
  const [isAdminRoute, setIsAdminRoute] = useState(() => isAdminPath());

  // Handle route changes for admin route detection
  useEffect(() => {
    const handler = () => setIsAdminRoute(isAdminPath());
    return subscribePopstate(handler);
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
