/**
 * Alrehla Ecosystem Shared Types
 * -----------------------------
 * These types define the structure of the "Shared User Object" stored in the profiles table.
 * Every satellite (Dawayir, Masarat, etc.) should use these to update the user's global state.
 */

export type ProductId = 'alrehla' | 'dawayir' | 'masarat' | 'sessions' | 'atmosfera';

export interface EcosystemData {
  /** 
   * A numerical vector representing the user's cognitive state.
   * [Emotional, Awareness, Empathy, Flexibility, Conflict, Communication]
   */
  awareness_vector?: number[];
  
  /** Global sovereignty score (0-100) */
  sovereignty_score?: number;
  
  /** List of products the user has interacted with */
  active_satellites?: ProductId[];
  
  /** Current active session context */
  current_context?: {
    last_product: ProductId;
    state: string;
    timestamp: string;
  };

  /** Specific metrics per satellite */
  satellite_metrics?: {
    dawayir?: {
      map_count: number;
      diagnosis_level: 'stable' | 'caution' | 'chaos';
      last_diagnosis_at: string;
    };
    masarat?: {
      active_paths: string[];
      total_evidence: number;
    };
    atmosfera?: {
      dominant_state: string;
      regulation_streak: number;
    };
  };

  /** Global milestones achieved across the journey */
  milestones?: string[];

  /** User privacy and security preferences */
  privacy_prefs?: {
    analyticsEnabled: boolean;
    crashReportsEnabled: boolean;
    partnerShareEnabled: boolean;
    profileVisible: boolean;
    communityAnonymous: boolean;
    hideFromSearch: boolean;
    twoFactorEnabled: boolean;
    biometricHintShown: boolean;
  };

  /** Preferred visual theme */
  theme_pref?: 'light' | 'dark' | 'system';

  /** Notification settings */
  notification_settings?: {
    enabled: boolean;
    dailyReminder: boolean;
    dailyReminderTime: string;
    inactiveReminder: boolean;
    inactiveReminderDays: number;
    exerciseComplete: boolean;
    missionReminder: boolean;
    missionReminderStrategy: "next" | "random" | "last" | "cycle";
  };
}

export interface SatelliteSnapshot {
  productId: ProductId;
  data: Partial<EcosystemData>;
  timestamp: string;
}
