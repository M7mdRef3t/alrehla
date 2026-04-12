/**
 * Domain: Notifications — Public API
 */

export type {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  Notification,
  NotificationPreferences,
} from "./types";

export { notificationsService } from "./services/notifications.service";
