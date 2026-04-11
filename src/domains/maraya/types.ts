/**
 * Domain: Maraya (Mirror/Reflection) — Types
 */

export type MirrrorSessionType =
  | "daily_reflection"
  | "deep_dive"
  | "pattern_scan"
  | "emotional_audit"
  | "decision_mirror";

export interface MirrrorSession {
  id: string;
  userId: string;
  type: MirrrorSessionType;
  prompt: string;
  response: string;
  insights?: string[];
  moodBefore?: number;
  moodAfter?: number;
  createdAt: string;
}

export interface ReflectionPattern {
  id: string;
  userId: string;
  pattern: string;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  relatedEmotions: string[];
}
