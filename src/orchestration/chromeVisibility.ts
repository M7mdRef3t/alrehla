export interface LandingChromeInput {
  isAdminRoute: boolean;
  showAuthModal: boolean;
  showPulseCheck: boolean;
  isLandingScreen: boolean;
  hasWhatsAppLink: boolean;
  isSanctuaryActive: boolean;
}

export interface LandingChromeVisibility {
  showFloatingProfile: boolean;
  showFloatingWhatsApp: boolean;
  showMobileBottomNav: boolean;
  showNudgeToast: boolean;
  showConsentBanner: boolean;
}

export function resolveLandingChromeVisibility(input: LandingChromeInput): LandingChromeVisibility {
  const showAppChrome =
    !input.isAdminRoute &&
    !input.showAuthModal &&
    !input.showPulseCheck &&
    !input.isLandingScreen &&
    !input.isSanctuaryActive;
  const showBasicChrome =
    !input.isAdminRoute &&
    !input.showAuthModal &&
    !input.showPulseCheck &&
    !input.isSanctuaryActive;

  return {
    showFloatingProfile: showBasicChrome,
    showFloatingWhatsApp: showAppChrome && input.hasWhatsAppLink,
    showMobileBottomNav: showAppChrome,
    showNudgeToast: !input.isLandingScreen && !input.isSanctuaryActive,
    showConsentBanner: !(input.isLandingScreen || input.showPulseCheck || input.showAuthModal || input.isSanctuaryActive)
  };
}
