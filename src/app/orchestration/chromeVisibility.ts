export interface LandingChromeInput {
  isAdminRoute: boolean;
  showAuthModal: boolean;
  showPulseCheck: boolean;
  isLandingScreen: boolean;
  hasWhatsAppLink: boolean;
}

export interface LandingChromeVisibility {
  showFloatingProfile: boolean;
  showFloatingWhatsApp: boolean;
  showMobileBottomNav: boolean;
  showNudgeToast: boolean;
  showConsentBanner: boolean;
}

export function resolveLandingChromeVisibility(input: LandingChromeInput): LandingChromeVisibility {
  const showAppChrome = !input.isAdminRoute && !input.showAuthModal && !input.showPulseCheck && !input.isLandingScreen;

  return {
    showFloatingProfile: showAppChrome,
    showFloatingWhatsApp: showAppChrome && input.hasWhatsAppLink,
    showMobileBottomNav: showAppChrome,
    showNudgeToast: !input.isLandingScreen,
    showConsentBanner: !(input.isLandingScreen || input.showPulseCheck || input.showAuthModal)
  };
}
