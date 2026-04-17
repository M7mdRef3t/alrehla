import { create } from 'zustand';

export type IsolationLevel = 'none' | 'light' | 'deep' | 'absolute';

export interface EphemeralThought {
  id: string;
  text: string;
  timestamp: number;
}

interface SanctuaryState {
  // Void Protocol State (Faraday Cage)
  isVoidProtocolActive: boolean;
  isolationLevel: IsolationLevel;
  
  // The Whisper Pad (Ephemeral thoughts that vanish)
  ephemeralThoughts: EphemeralThought[];
  
  // Actions
  activateVoidProtocol: (level?: IsolationLevel) => void;
  deactivateVoidProtocol: () => void;
  
  // Thought Handlers
  addEphemeralThought: (text: string) => void;
  removeEphemeralThought: (id: string) => void;
  clearAllThoughts: () => void;
}

export const useSanctuaryState = create<SanctuaryState>((set) => ({
  isVoidProtocolActive: false,
  isolationLevel: 'none',
  ephemeralThoughts: [],
  
  activateVoidProtocol: (level = 'deep') => set({ 
    isVoidProtocolActive: true, 
    isolationLevel: level 
  }),
  
  deactivateVoidProtocol: () => set({ 
    isVoidProtocolActive: false, 
    isolationLevel: 'none',
    ephemeralThoughts: [] // Crucial: clear on exit
  }),
  
  addEphemeralThought: (text: string) => set((state) => ({
    ephemeralThoughts: [
      ...state.ephemeralThoughts,
      { id: Math.random().toString(36).substr(2, 9), text, timestamp: Date.now() }
    ]
  })),
  
  removeEphemeralThought: (id: string) => set((state) => ({
    ephemeralThoughts: state.ephemeralThoughts.filter(t => t.id !== id)
  })),
  
  clearAllThoughts: () => set({ ephemeralThoughts: [] })
}));
