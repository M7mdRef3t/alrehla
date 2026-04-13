/**
 * Neural Event Types — تصنيفات الإشارات العصبية 🧠
 * ===================================================
 * بدلاً من ربط كل جزء بالآخر مباشرتاً، سيتم إرسال إشارات عبر الشبكة العصبية.
 * أي جزء من التطبيق يمكنه سماع الإشارات والتصرف بناءً عليها.
 */

export type NeuralOrigin = 
  | "DAWAYIR_MAP"
  | "MARAYA_SESSION"
  | "SYSTEM_OVERSEER"
  | "MARKETING_OPS"
  | "EMERGENCY_BUTTON"
  | "SESSION_INTAKE";

export type NeuralEventType =
  // Map Changes
  | "NODE_SHIFTED_INWARD"
  | "NODE_SHIFTED_OUTWARD"
  | "VAMPIRE_DETECTED"
  // Emotional States
  | "STRESS_SPIKED"
  | "CATHARSIS_REACHED"
  // System State
  | "LOCKDOWN_INITIATED"
  | "LOCKDOWN_LIFTED"
  // Marketing/Growth
  | "NEW_COHORT_JOINED"
  | "MARKETING_CAMPAIGN_TRIGGER";

export interface NeuralPayload {
  nodeId?: string;
  sourceContext?: string;
  value?: any;
  message?: string;
  [key: string]: any;
}

export interface NeuralEvent {
  id: string; // Unique ID for deduplication
  type: NeuralEventType;
  origin: NeuralOrigin;
  intensity: number; // 0.0 to 1.0 (How critical is this event?)
  timestamp: number;
  payload?: NeuralPayload;
}
