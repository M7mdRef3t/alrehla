<<<<<<< HEAD
=======
/* eslint-disable @typescript-eslint/no-unused-vars */
>>>>>>> feat/sovereign-final-stabilization
/**
 * Domain: Notifications — Service
 *
 * نقطة تجميع لأحداث الإشعارات عبر الـ EventBus.
 * الـ push notifications تُرسل من الـ server — هذا الـ service للـ in-app.
 */

import { eventBus } from "@/shared/events";
import type { Notification, NotificationType } from "../types";

const inAppQueue: Notification[] = [];

export const notificationsService = {
  /**
   * إصدار إشعار in-app
   */
  notify(notification: Omit<Notification, "id" | "sentAt" | "isRead">): void {
    const full: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      sentAt: new Date().toISOString(),
      isRead: false,
    };
    inAppQueue.push(full);
    // Emit للـ UI
    eventBus.emit("analytics:event", {
      name: "notification_shown",
      properties: { type: notification.type, channel: notification.channel },
    });
  },

  /**
   * جلب الإشعارات غير المقروءة
   */
  getUnread(): Notification[] {
    return inAppQueue.filter((n) => !n.isRead);
  },

  /**
   * تعليم إشعار كمقروء
   */
  markRead(id: string): void {
    const notif = inAppQueue.find((n) => n.id === id);
    if (notif) notif.isRead = true;
  },

  /**
   * تنظيف القائمة
   */
  clear(): void {
    inAppQueue.splice(0, inAppQueue.length);
  },

  getCount(): number {
    return inAppQueue.filter((n) => !n.isRead).length;
  },

  /**
   * إشعار مخصص لنوع achievement
   */
  notifyAchievement(name: string, icon: string): void {
    notificationsService.notify({
      userId: "",
      type: "achievement_unlocked",
      channel: "in_app",
      priority: "medium",
      title: `🏆 ${icon} ${name}`,
      body: "أنجزت إنجازًا جديدًا! استمر.",
    });
  },

  /**
   * إشعار تحذير streak
   */
  notifyStreakWarning(streak: number): void {
    notificationsService.notify({
      userId: "",
      type: "streak_warning",
      channel: "in_app",
      priority: "high",
      title: "⚠️ سلسلتك في خطر!",
      body: `لم تسجّل نشاطاً منذ أمس — سلسلتك الحالية ${streak} يوم.`,
    });
  },
};
