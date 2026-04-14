export const FUNNEL_IDENTIFIER_KEYS = [
  "lead_id",
  "lead_source",
  "gateSessionId",
  "anonymous_id",
  "user_id",
  "phone_normalized"
] as const;

export type FunnelIdentifierKey = (typeof FUNNEL_IDENTIFIER_KEYS)[number];
export type FunnelIdentifiers = Partial<Record<FunnelIdentifierKey, string | null>>;

export const FUNNEL_IDENTIFIER_CAPTURE_KEYS = [...FUNNEL_IDENTIFIER_KEYS, "gate_session_id"] as const;
export type FunnelIdentifierCaptureKey = (typeof FUNNEL_IDENTIFIER_CAPTURE_KEYS)[number];

export type LeadLifecycleStatus =
  | "new"
  | "engaged"
  | "payment_requested"
  | "proof_received"
  | "activated"
  | "lost";

export type EvidenceRecord = {
  day: 0 | 1 | 2 | 3;
  actionDone: string;
  shiftNoticed: string | null;
  metricDelta: string | null;
};

export type DiagnosisObject = {
  state: string;
  rootTension: string;
  primaryPattern: string;
  firstStep: string;
  protocol: string;
  metricToTrack: string;
};

export function normalizePhoneForFunnel(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}
