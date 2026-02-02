/**
 * خدمة الإشعارات
 * تدير إرسال الإشعارات المحلية للمستخدم
 */
import { getSmartDailyReminder, getSmartInactiveReminder } from "./smartReminders";

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

// مفتاح حفظ إعدادات الإشعارات
const NOTIFICATION_SETTINGS_KEY = "dawayir-notification-settings";
const LAST_ACTIVITY_KEY = "dawayir-last-activity";

// الإشعارات المتاحة
export const NOTIFICATION_TYPES = {
  DAILY_REMINDER: "daily-reminder",
  INACTIVE_REMINDER: "inactive-reminder",
  EXERCISE_COMPLETE: "exercise-complete",
  STEP_REMINDER: "step-reminder"
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/**
 * التحقق من دعم الإشعارات
 */
export function isNotificationSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

/**
 * الحصول على حالة الإذن الحالية
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
}

/**
 * طلب إذن الإشعارات من المستخدم
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error("الإشعارات غير مدعومة في هذا المتصفح");
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * إرسال إشعار محلي
 */
export async function sendNotification(options: NotificationOptions): Promise<Notification | null> {
  if (!isNotificationSupported()) return null;
  
  if (Notification.permission !== "granted") {
    console.warn("لم يتم منح إذن الإشعارات");
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/icons/icon-192x192.png",
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      data: options.data
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error("فشل في إرسال الإشعار:", error);
    return null;
  }
}

/**
 * الإشعارات المعرّفة مسبقاً
 */
export const PRESET_NOTIFICATIONS: Record<NotificationType, NotificationOptions> = {
  [NOTIFICATION_TYPES.DAILY_REMINDER]: {
    title: "وقت فحص مشاعرك 💚",
    body: "خُد دقيقة وشوف خريطتك. إزاي حاسس النهاردة؟",
    tag: "daily-reminder"
  },
  [NOTIFICATION_TYPES.INACTIVE_REMINDER]: {
    title: "وحشتنا! 👋",
    body: "محتاجين نشوف خريطتك. تعالى نكمّل رحلتك.",
    tag: "inactive-reminder"
  },
  [NOTIFICATION_TYPES.EXERCISE_COMPLETE]: {
    title: "أحسنت! 🎉",
    body: "كملت التمرين بنجاح. استمر في التقدم!",
    tag: "exercise-complete"
  },
  [NOTIFICATION_TYPES.STEP_REMINDER]: {
    title: "عندك خطوات متبقية ⏰",
    body: "في خطوات في خطة التعافي مستنياك. خُد دقيقة وكملها.",
    tag: "step-reminder"
  }
};

/**
 * إرسال إشعار مُعرّف مسبقاً
 */
export async function sendPresetNotification(type: NotificationType): Promise<Notification | null> {
  const options = PRESET_NOTIFICATIONS[type];
  return sendNotification(options);
}

/**
 * حفظ إعدادات الإشعارات
 */
export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // "HH:MM"
  inactiveReminder: boolean;
  inactiveReminderDays: number;
  exerciseComplete: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  dailyReminderTime: "20:00",
  inactiveReminder: true,
  inactiveReminderDays: 3,
  exerciseComplete: true
};

export function loadNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("فشل في تحميل إعدادات الإشعارات:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("فشل في حفظ إعدادات الإشعارات:", error);
  }
}

/**
 * تسجيل آخر نشاط للمستخدم
 */
export function recordActivity(): void {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

/**
 * الحصول على آخر وقت نشاط
 */
export function getLastActivity(): number | null {
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
  return stored ? parseInt(stored, 10) : null;
}

/**
 * حساب عدد الأيام منذ آخر نشاط
 */
export function getDaysSinceLastActivity(): number | null {
  const lastActivity = getLastActivity();
  if (!lastActivity) return null;
  
  const now = Date.now();
  const diffMs = now - lastActivity;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * التحقق وإرسال إشعار عدم النشاط — تذكير مخصص حسب التقدم
 */
export async function checkAndSendInactiveReminder(): Promise<void> {
  const settings = loadNotificationSettings();
  
  if (!settings.enabled || !settings.inactiveReminder) return;
  
  const daysSinceActivity = getDaysSinceLastActivity();
  
  if (daysSinceActivity !== null && daysSinceActivity >= settings.inactiveReminderDays) {
    const { title, body } = getSmartInactiveReminder();
    await sendNotification({
      title,
      body,
      tag: "inactive-reminder"
    });
  }
}

/**
 * إرسال تذكير يومي مخصص حسب التقدم
 */
export async function sendSmartDailyReminder(): Promise<Notification | null> {
  const settings = loadNotificationSettings();
  if (!settings.enabled || !settings.dailyReminder) return null;
  const { title, body } = getSmartDailyReminder();
  return sendNotification({
    title,
    body,
    tag: "daily-reminder"
  });
}
