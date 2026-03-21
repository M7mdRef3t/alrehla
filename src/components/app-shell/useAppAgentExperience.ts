import { useEffect, useMemo } from "react";
import { useEmergencyState } from "../../state/emergencyState";
import { useSwarmState } from "../../state/swarmState";
import { useMapState } from "../../state/mapState";
import { usePulseState } from "../../state/pulseState";
import type { FeatureFlagKey } from "../../config/features";
import type { AdviceCategory } from "../../data/adviceScripts";
import type { AppScreen } from "../../navigation/navigationMachine";
import { determineAutoPersona } from "../../agent/swarmLogic";

type AgentModule = typeof import("../../agent");

interface UseAppAgentExperienceParams {
  availableFeatures: Record<FeatureFlagKey, boolean>;
  screen: AppScreen;
  selectedNodeId: string | null;
  goalId: string;
  category: AdviceCategory;
  agentModule: AgentModule | null;
  adminPrompt?: string;
  navigateToScreen: (screen: AppScreen) => boolean;
  openOverlay: (overlay: "gym" | "baseline") => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setShowBreathing: (value: boolean) => void;
}

export function useAppAgentExperience({
  availableFeatures,
  screen,
  selectedNodeId,
  goalId,
  category,
  agentModule,
  adminPrompt,
  navigateToScreen,
  openOverlay,
  setSelectedNodeId,
  setShowBreathing
}: UseAppAgentExperienceParams) {
  const { activePersona, setActivePersona, manualOverride } = useSwarmState();
  const nodes = useMapState((s) => s.nodes);
  const lastPulse = usePulseState((s) => s.lastPulse);

  const agentContext = useMemo(
    () => ({
      nodesSummary: nodes.map((node) => ({ id: node.id, label: node.label, ring: node.ring })),
      availableFeatures,
      screen: screen as Exclude<AppScreen, "settings">,
      selectedNodeId,
      goalId,
      category,
      pulse: lastPulse,
      activePersona
    }),
    [activePersona, availableFeatures, category, goalId, lastPulse, nodes, screen, selectedNodeId]
  );

  useEffect(() => {
    if (manualOverride) return;
    const autoPersona = determineAutoPersona(agentContext);
    if (activePersona !== autoPersona) {
      setActivePersona(autoPersona);
    }
  }, [activePersona, agentContext, manualOverride, setActivePersona]);

  const agentSystemPrompt = useMemo(() => {
    if (!agentModule) return undefined;
    const basePrompt = agentModule.buildAgentSystemPrompt(agentContext);
    const adminTrimmed = adminPrompt?.trim();
    return adminTrimmed ? `${adminTrimmed}\n\n${basePrompt}` : basePrompt;
  }, [adminPrompt, agentContext, agentModule]);

  const agentActions = useMemo(() => {
    if (!agentModule) return undefined;

    return agentModule.createAgentActions({
      resolvePerson: (labelOrId) => agentModule.resolvePersonFromNodes(labelOrId, nodes),
      onNavigateBreathing: () => setShowBreathing(true),
      onNavigateGym: () => openOverlay("gym"),
      onNavigateMap: () => {
        void navigateToScreen("map");
      },
      onNavigateBaseline: () => openOverlay("baseline"),
      onNavigateEmergency: () => useEmergencyState.getState().open(),
      availableFeatures,
      onNavigatePerson: (nodeId) => {
        void navigateToScreen("map");
        setSelectedNodeId(nodeId);
      }
    });
  }, [agentModule, availableFeatures, navigateToScreen, nodes, openOverlay, setSelectedNodeId, setShowBreathing]);

  return {
    agentContext,
    agentSystemPrompt,
    agentActions
  };
}
