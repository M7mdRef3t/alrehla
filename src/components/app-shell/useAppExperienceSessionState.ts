import { useAppAuthRecovery } from "./useAppAuthRecovery";
import { useFeaturePreviewSession } from "./useFeaturePreviewSession";
import { useAppPageMetadata } from "./useAppPageMetadata";
import { useAppUiStatePersistence } from "./useAppUiStatePersistence";
import { useAppStartupOnboarding } from "./useAppStartupOnboarding";
import { useAppSessionToasts } from "./useAppSessionToasts";
import { useAppJourneySignals } from "./useAppJourneySignals";
import { useAppMissionReminderNotifications } from "./useAppMissionReminderNotifications";

interface UseAppExperienceSessionStateParams {
  uiPersistence: Parameters<typeof useAppUiStatePersistence>[0];
  missionNotifications: Omit<Parameters<typeof useAppMissionReminderNotifications>[0], "hasActiveMission">;
  startupOnboarding: Parameters<typeof useAppStartupOnboarding>[0];
  authRecovery: Parameters<typeof useAppAuthRecovery>[0];
  metadataScreen: Parameters<typeof useAppPageMetadata>[0];
  featurePreview: Parameters<typeof useFeaturePreviewSession>[0];
}

export function useAppExperienceSessionState({
  uiPersistence,
  missionNotifications,
  startupOnboarding,
  authRecovery,
  metadataScreen,
  featurePreview
}: UseAppExperienceSessionStateParams) {
  useAppUiStatePersistence(uiPersistence);
  const toastState = useAppSessionToasts();
  const journeyState = useAppJourneySignals();
  useAppMissionReminderNotifications({
    ...missionNotifications,
    hasActiveMission: journeyState.hasActiveMission
  });
  const startupState = useAppStartupOnboarding(startupOnboarding);
  const authState = useAppAuthRecovery(authRecovery);
  useAppPageMetadata(metadataScreen);
  const previewState = useFeaturePreviewSession(featurePreview);

  return {
    ...toastState,
    ...journeyState,
    ...startupState,
    ...authState,
    ...previewState
  };
}
