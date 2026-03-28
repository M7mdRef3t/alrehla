/**
 * useStreakReminder.ts
 * ────────────────────
 * يجدوِل إشعار push يومي "الساعة 8 مساءً" يذكّر المستخدم بالنشاط اليومي.
 * يُستدعى مرة واحدة بعد منح إذن الإشعارات.
 */

import { loadStreak } from "./streakSystem";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";

const REMINDER_KEY = "alrehla_streak_reminder_tag";
const DAILY_HOUR = 20; // 8 PM

/** هل يدعم المتصفح الإشعارات وService Worker؟ */
export function canScheduleReminder(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    Notification.permission === "granted"
  );
}

/** طلب إذن الإشعارات — يجب استدعاؤه من تفاعل المستخدم */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

/** حساب التأخير (ms) حتى الـ 8 مساءً القادمة */
function msUntilNextReminder(): number {
  const now = new Date();
  const next = new Date();
  next.setHours(DAILY_HOUR, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** إظهار إشعار فوري (لاختبار أو تذكير فوري) */
function showStreakNotification() {
  const streak = loadStreak();
  const days = streak.currentStreak;
  const title = days > 0
    ? `🔥 تسلسلك ${days} يوم — لا تكسره!`
    : "🌱 ابدأ تسلسلك اليومي";
  const body = days > 0
    ? "سجّل نشاطاً واحداً اليوم للحفاظ على تسلسلك في الرحلة."
    : "دقيقة واحدة تكفي — افتح المنصة وسجّل حالتك اليوم.";

  try {
    const options: NotificationOptions & { renotify?: boolean } = {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: REMINDER_KEY,
      renotify: true,
    };
    new Notification(title, options);
  } catch {
    // silently ignore in unsupported environments
  }
}

let _timerId: ReturnType<typeof setTimeout> | null = null;

/**
 * جدوِل تذكير الـ streak اليومي.
 * آمن للاستدعاء أكثر من مرة — يلغي الجدولة القديمة.
 */
export function scheduleStreakReminder(): void {
  if (!canScheduleReminder()) return;

  // لا تُجدوِل إذا سجّل المستخدم نشاطاً اليوم
  const streak = loadStreak();
  const today = new Date().toISOString().split("T")[0];
  if (streak.lastActiveDate === today) return;

  // إلغاء أي جدولة سابقة
  if (_timerId !== null) clearTimeout(_timerId);

  const delay = msUntilNextReminder();
  _timerId = setTimeout(() => {
    showStreakNotification();
    // إعادة الجدولة للغد
    _timerId = null;
    scheduleStreakReminder();
  }, delay);

  setInLocalStorage("alrehla_streak_reminder_scheduled", new Date().toISOString());
}

/** تذكير فوري للاختبار (من إعدادات الإشعارات) */
export function testStreakReminder(): void {
  showStreakNotification();
}

/** إلغاء الجدولة (عند تسجيل الخروج) */
export function cancelStreakReminder(): void {
  if (_timerId !== null) {
    clearTimeout(_timerId);
    _timerId = null;
  }
}
