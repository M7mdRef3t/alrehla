import { useMemo, useState } from "react";
import { useNotificationState } from "@/domains/notifications/store/notification.store";
import { useEmergencyState } from "@/domains/admin/store/emergency.store";
import { useJourneyProgress } from "@/domains/journey";
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { useThemeState } from "@/domains/consciousness/store/theme.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import type { FeatureFlagKey } from "@/config/features";
import { runtimeEnv } from "@/config/runtimeEnv";
import { useAppShellNavigationState } from '@/modules/map/dawayirIndex';
import { useAppOverlayState, useOverlayFlag } from "@/domains/consciousness/store/overlay.store";
import { useGamification } from "@/domains/gamification";

type AgentModule = typeof import('@/agent');
const DEFAULT_WHATSAPP_CONTACT = "0201023050092";

function normalizeArabicDigits(value: string) {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

function normalizeWhatsAppPhone(rawPhone: string) {
  let digits = normalizeArabicDigits(rawPhone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("020")) digits = digits.slice(1);
  if (digits.startsWith("0") && digits.length === 11) digits = `20${digits.slice(1)}`;
  if (digits.startsWith("2") && digits.length === 12) return digits;
  if (digits.startsWith("20")) return digits;
  return digits;
}

export function useAppShellBootstrapState() {
  const screen = useAppShellNavigationState((s) => s.screen);
  const setScreen = useAppShellNavigationState((s) => s.setScreen);
  const isLandingScreen = screen === "landing";

  const category = useAppShellNavigationState((s) => s.category);
  const setCategory = useAppShellNavigationState((s) => s.setCategory);
  const goalId = useAppShellNavigationState((s) => s.goalId);
  const setGoalId = useAppShellNavigationState((s) => s.setGoalId);
  const selectedNodeId = useAppShellNavigationState((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppShellNavigationState((s) => s.setSelectedNodeId);
  const missionNodeId = useAppShellNavigationState((s) => s.missionNodeId);
  const setMissionNodeId = useAppShellNavigationState((s) => s.setMissionNodeId);
  const toolsBackScreen = useAppShellNavigationState((s) => s.toolsBackScreen);
  const setToolsBackScreen = useAppShellNavigationState((s) => s.setToolsBackScreen);

  const openAppOverlay = useAppOverlayState((s) => s.openOverlay);
  const closeAppOverlay = useAppOverlayState((s) => s.closeOverlay);
  const setAppOverlay = useAppOverlayState((s) => s.setOverlay);
  const libraryOpen = useAppOverlayState((s) => s.flags.library);

  const [showBreathing, setShowBreathing] = useOverlayFlag("breathing");
  const [showCocoon, setShowCocoon] = useOverlayFlag("cocoon");
  const [showAuthModal, setShowAuthModal] = useOverlayFlag("authModal");
  const [showSystemOverclockPanel, setShowSystemOverclockPanel] = useOverlayFlag("systemOverclockPanel");

  const [agentModule, setAgentModule] = useState<AgentModule | null>(null);
  const [lockedFeature, setLockedFeature] = useState<FeatureFlagKey | null>(null);
  const [ownerInstallRequestNonce, setOwnerInstallRequestNonce] = useState(0);

  const whatsAppNumber = runtimeEnv.whatsappContactNumber || DEFAULT_WHATSAPP_CONTACT;
  const whatsAppLink = useMemo(() => {
    const normalized = normalizeWhatsAppPhone(whatsAppNumber);
    return normalized ? `https://wa.me/${normalized}` : null;
  }, [whatsAppNumber]);

  const notificationSettings = useNotificationState((s) => s.settings);
  const notificationPermission = useNotificationState((s) => s.permission);
  const notificationSupported = useNotificationState((s) => s.isSupported);
  const isEmergencyOpen = useEmergencyState((s) => s.isOpen);
  const storedGoalId = useJourneyProgress().goalId;
  const consumeLandingIntent = useJourneyProgress().consumeLandingIntent;
  const storedCategory = useJourneyProgress().category;
  const lastGoalById = useJourneyProgress().lastGoalById;
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const theme = useThemeState((s) => s.theme);
  const setTheme = useThemeState((s) => s.setTheme);
  const snoozedUntil = usePulseState((s) => s.snoozedUntil);
  const logPulse = usePulseState((s) => s.logPulse);
  const snoozeNotifications = usePulseState((s) => s.snoozeNotifications);
  
  const { recordActivity, completeDailyQuest } = useGamification();

  return {
    screen,
    setScreen,
    isLandingScreen,
    category,
    setCategory,
    goalId,
    setGoalId,
    selectedNodeId,
    setSelectedNodeId,
    missionNodeId,
    setMissionNodeId,
    toolsBackScreen,
    setToolsBackScreen,
    openAppOverlay,
    closeAppOverlay,
    setAppOverlay,
    libraryOpen,
    showBreathing,
    setShowBreathing,
    showCocoon,
    setShowCocoon,
    showAuthModal,
    setShowAuthModal,
    showSystemOverclockPanel,
    setShowSystemOverclockPanel,
    agentModule,
    setAgentModule,
    lockedFeature,
    setLockedFeature,
    ownerInstallRequestNonce,
    setOwnerInstallRequestNonce,
    whatsAppLink,
    notificationSettings,
    notificationPermission,
    notificationSupported,
    isEmergencyOpen,
    storedGoalId,
    consumeLandingIntent,
    storedCategory,
    lastGoalById,
    lastNewAchievementId,
    theme,
    setTheme,
    snoozedUntil,
    logPulse,
    snoozeNotifications,
    setAuthIntent: useAppOverlayState((s) => s.setAuthIntent),
    recordActivity,
    completeDailyQuest
  };
}
