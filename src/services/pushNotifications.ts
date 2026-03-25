/**
 * Push Notification Service
 * Handles browser push notification permission + subscription.
 * Uses the Web Notifications API (works out-of-the-box, no Service Worker needed for simple notifications).
 */

export type NotificationPermission = "default" | "granted" | "denied";

/**
 * Returns the current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission as NotificationPermission;
}

/**
 * Request notification permission from the browser.
 * Returns the final permission status.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

/**
 * Show a browser notification.
 * Silently fails if permission is not granted.
 */
export function showNotification(
  title: string,
  options: NotificationOptions & { onClick?: () => void } = {}
): void {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const { onClick, ...notifOptions } = options;

  const notif = new Notification(title, {
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    lang: "ar",
    dir: "rtl",
    ...notifOptions,
  });

  if (onClick) {
    notif.addEventListener("click", () => {
      onClick();
      notif.close();
    });
  }
}

/**
 * Hook-friendly helper: request permission and show a greeting notification.
 * Call this after a meaningful user action (never on page load).
 */
export async function enableNotificationsWithPrompt(): Promise<NotificationPermission> {
  const permission = await requestNotificationPermission();
  if (permission === "granted") {
    showNotification("الرحلة 🌙", {
      body: "ستصلك إشعارات عن رحلتك ومهامك القادمة.",
      tag: "alrehla-welcome",
    });
  }
  return permission;
}

/**
 * Convenience function for journey milestone notifications.
 */
export function notifyJourneyMilestone(message: string, onClick?: () => void): void {
  showNotification("الرحلة 🎯", {
    body: message,
    tag: "journey-milestone",
    requireInteraction: false,
    onClick,
  });
}

/**
 * Notify about a new insight or recommendation.
 */
export function notifyInsight(insight: string, onClick?: () => void): void {
  showNotification("رؤية جديدة ✨", {
    body: insight,
    tag: "journey-insight",
    onClick,
  });
}
