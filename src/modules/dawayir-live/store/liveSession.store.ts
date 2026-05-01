import { create } from 'zustand';
import type { SessionStatus, TruthContract } from '../types';

export interface LiveSessionState {
  sessionId: string | null;
  activeNodeId: string | null;
  status: SessionStatus;
  latestTruthContract: TruthContract | null;
  isAgentSpeaking: boolean;
  
  // Actions
  setSessionId: (id: string | null) => void;
  setActiveNodeId: (nodeId: string | null) => void;
  setStatus: (status: SessionStatus) => void;
  setTruthContract: (contract: TruthContract | null) => void;
  setAgentSpeaking: (isSpeaking: boolean) => void;
  reset: () => void;
}

export const useLiveSessionStore = create<LiveSessionState>((set) => ({
  sessionId: null,
  activeNodeId: null,
  status: 'idle',
  latestTruthContract: null,
  isAgentSpeaking: false,

  setSessionId: (sessionId) => set({ sessionId }),
  setActiveNodeId: (activeNodeId) => set({ activeNodeId }),
  setStatus: (status) => set({ status }),
  setTruthContract: (latestTruthContract) => set({ latestTruthContract }),
  setAgentSpeaking: (isAgentSpeaking) => set({ isAgentSpeaking }),
  reset: () => set({
    sessionId: null,
    activeNodeId: null,
    status: 'idle',
    latestTruthContract: null,
    isAgentSpeaking: false
  })
}));
