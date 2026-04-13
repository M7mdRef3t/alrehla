/**
 * Domain: Sessions — Types
 * 
 * كل الـ types الخاصة بـ Session OS في مكان واحد.
 */

// ─── Intake ────────────────────────────────────────────

export type IntakeStep = "welcome" | "basic" | "reason" | "context" | "safety" | "success";

export interface IntakeFormData {
  // Basic info
  name: string;
  phone: string;
  email: string;
  country: string;
  birthDate: string;
  preferredContact: string;

  // Reason
  requestReason: string;
  urgencyReason: string;
  biggestChallenge: string;

  // Context
  previousSessions: string;
  specificPersonOrSituation: string;
  impactScore: number;
  durationOfProblem: string;

  // Safety
  crisisFlag: boolean;
  medicalFlag: string;
  sessionGoalType: string;
}

// ─── Session Request ───────────────────────────────────

export type SessionRequestStatus =
  | "prep_pending"
  | "needs_manual_review"
  | "brief_generated"
  | "approved"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface SessionRequest {
  id: string;
  clientId: string;
  status: SessionRequestStatus;
  requestReason: string;
  urgencyReason: string;
  biggestChallenge: string;
  previousSessions: string;
  specificPersonOrSituation: string;
  impactScore: number;
  durationOfProblem: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AI Brief ──────────────────────────────────────────

export interface SessionBriefInput {
  intake: {
    requestReason: string;
    urgencyReason: string;
    biggestChallenge: string;
    durationOfProblem: string;
    sessionGoalType: string;
  };
  prep?: {
    story: string;
    attemptsBefore: string;
    currentImpact: string;
    desiredOutcome: string;
    dominantEmotions: string;
  };
}

export interface AIExtractedBrief {
  visible_problem: string;
  emotional_signal: string;
  hidden_need: string;
  expected_goal: string;
  first_hypothesis: string;
  session_boundaries: string;
}

// ─── Client ────────────────────────────────────────────

export interface SessionClient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  country?: string;
  birthDate?: string;
  preferredContact: string;
}

// ─── Triage ────────────────────────────────────────────

export interface TriageResult {
  requestId: string;
  safetyCrisisFlag: boolean;
  sessionGoalType: string;
  urgencyScore: number;
}
