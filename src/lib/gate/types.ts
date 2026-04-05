export interface GateState {
  sessionId: string;
  sourceArea?: string; // 'family' | 'partner' | 'work' | 'friend'
  email?: string;
  painPoint?: string;   // q1
  intent?: string;      // q2
  commitment?: string;  // q3
  step: 'layer1' | 'layer2' | 'handoff';
}
