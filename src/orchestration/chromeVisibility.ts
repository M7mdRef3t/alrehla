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

  // WhatsApp FAB: يظهر دايماً ما دام مفيش modal أو admin أو sanctuary
  const showWhatsApp =
    !input.isAdminRoute &&
    !input.showAuthModal &&
    !input.isSanctuaryActive &&
    input.hasWhatsAppLink;

  return {
    showFloatingProfile: showBasicChrome,
    showFloatingWhatsApp: showWhatsApp,
    showMobileBottomNav: showAppChrome,
    showNudgeToast: !input.isLandingScreen && !input.isSanctuaryActive,
    showConsentBanner: !(input.isLandingScreen || input.showPulseCheck || input.showAuthModal || input.isSanctuaryActive)
  };
}
