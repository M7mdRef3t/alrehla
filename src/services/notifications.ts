import { logger } from "../services/logger";
/**
 * خدمة الإشعارات
 * تدير إرسال الإشعارات المحلية للمستخدم
 */
import { getSmartDailyReminder, getSmartInactiveReminder } from "./smartReminders";
import { getItem, setItem, getJSON, setJSON } from "./secureStore";

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

export type MissionReminderStrategy = "next" | "random" | "last" | "cycle";

// مفتاح حفظ إعدادات الإشعارات
const NOTIFICATION_SETTINGS_KEY = "dawayir-notification-settings";
const LAST_ACTIVITY_KEY = "dawayir-last-activity";

// الإشعارات المتاحة
export const NOTIFICATION_TYPES = {
  DAILY_REMINDER: "daily-reminder",
  INACTIVE_REMINDER: "inactive-reminder",
  EXERCISE_COMPLETE: "exercise-complete",
  STEP_REMINDER: "step-reminder",
  MISSION_REMINDER: "mission-reminder",
  /** رحلة — إشعارات دواير الجديدة */
  MAP_REVISIT: "map-revisit",
  WEEKLY_GRATITUDE: "weekly-gratitude",
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
    logger.error("فشل في إرسال الإشعارات:", error);
    return null;
  }
}

/**
 * الإشعارات المُعرّفة مسبقًا
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
    body: "في مهام ميدان مستنياك. خُد دقيقة وكمّلها.",
    tag: "step-reminder"
  },
  [NOTIFICATION_TYPES.MISSION_REMINDER]: {
    title: "مهمتك مستنياك 🎯",
    body: "عندك مهمة نشطة. خصّص دقيقة وكمّل خطوة النهاردة.",
    tag: "mission-reminder"
  },
  /** رحلة — إشعارات دواير الجديدة */
  [NOTIFICATION_TYPES.MAP_REVISIT]: {
    title: "لسه فاكر خريطتك؟",
    body: "التعافي مش سحر، هو متابعة واعية للي بيحصل جوانا. ادخل شوف خريطتك النهاردة — يمكن محتاج تحرك حد من مكانه؟",
    tag: "map-revisit"
  },
  [NOTIFICATION_TYPES.WEEKLY_GRATITUDE]: {
    title: "الرحلة مستمرة..",
    body: "بقالك أسبوع بتهتم بدوايرك. ده لوحده إنجاز — التعافي مش سحر، هو المتابعة الواعية دي.",
    tag: "weekly-gratitude"
  }
};

/**
 * إرسال إشعار مُعرّف مسبقًا
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
  missionReminder: boolean;
  missionReminderStrategy: MissionReminderStrategy;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyReminder: true,
  dailyReminderTime: "20:00",
  inactiveReminder: true,
  inactiveReminderDays: 3,
  exerciseComplete: true,
  missionReminder: true,
  missionReminderStrategy: "next"
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await getJSON<Partial<NotificationSettings>>(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...stored };
    }
  } catch (error) {
    logger.error("فشل في تحميل إعدادات الإشعارات:", error);
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  void setJSON(NOTIFICATION_SETTINGS_KEY, settings);
}

/**
 * تسجيل آخر نشاط للمستخدم
 */
export function recordActivity(): void {
  void setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

/**
 * الحصول على آخر وقت نشاط
 */
export async function getLastActivity(): Promise<number | null> {
  const stored = await getItem(LAST_ACTIVITY_KEY);
  return stored ? parseInt(stored, 10) : null;
}

/**
 * حساب عدد الأيام منذ آخر نشاط
 */
export async function getDaysSinceLastActivity(): Promise<number | null> {
  const lastActivity = await getLastActivity();
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
  const settings = await loadNotificationSettings();

  if (!settings.enabled || !settings.inactiveReminder) return;

  const daysSinceActivity = await getDaysSinceLastActivity();

  if (daysSinceActivity !== null && daysSinceActivity >= settings.inactiveReminderDays) {
    const { title, body } = await getSmartInactiveReminder();
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
  const settings = await loadNotificationSettings();
  if (!settings.enabled || !settings.dailyReminder) return null;
  const { title, body } = await getSmartDailyReminder();
  return sendNotification({
    title,
    body,
    tag: "daily-reminder"
  });
}

/* ══════════════════════════════════════════
   إشعار الامتنان الأسبوعي — Weekly Gratitude
   يُرسل مرة كل 7 أيام لو الإذن ممنوح
   ══════════════════════════════════════════ */

const WEEKLY_GRATITUDE_KEY = "dawayir-weekly-gratitude-last-sent";

/**
 * يفحص إذا مضى أسبوع من آخر إرسال وبيبعت الإشعار لو الشروط اتحققت
 */
export async function checkAndSendWeeklyGratitude(): Promise<void> {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const lastSentRaw = localStorage.getItem(WEEKLY_GRATITUDE_KEY);
  const lastSent = lastSentRaw ? parseInt(lastSentRaw, 10) : 0;
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (now - lastSent < sevenDays) return;

  localStorage.setItem(WEEKLY_GRATITUDE_KEY, String(now));
  await sendPresetNotification(NOTIFICATION_TYPES.WEEKLY_GRATITUDE);
}

/**
 * يفحص إذا المستخدم مرجعش من أكتر من 24 ساعة وبيبعت إشعار المراجعة
 */
export async function checkAndSendMapRevisit(): Promise<void> {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const lastActivityRaw = localStorage.getItem("dawayir-last-activity");
  if (!lastActivityRaw) return;

  const lastActivity = parseInt(lastActivityRaw, 10);
  const hoursGone = (Date.now() - lastActivity) / (1000 * 60 * 60);

  // بس لو بين 22 و48 ساعة (مش أكتر عشان ميبقاش زعيق)
  if (hoursGone < 22 || hoursGone > 48) return;

  await sendPresetNotification(NOTIFICATION_TYPES.MAP_REVISIT);
}
