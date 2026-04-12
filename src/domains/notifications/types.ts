/**
 * Domain: Notifications — Types
 */

export type NotificationChannel = "push" | "in_app" | "email" | "telegram" | "whatsapp";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type NotificationType =
  | "session_reminder"
  | "achievement_unlocked"
  | "streak_warning"
  | "journey_nudge"
  | "ai_insight"
  | "system"
  | "marketing";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  sentAt: string;
  readAt?: string;
}

export interface NotificationPreferences {
  userId: string;
  enabledChannels: NotificationChannel[];
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string;
  enabledTypes: NotificationType[];
}
