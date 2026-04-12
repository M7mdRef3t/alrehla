/**
 * 🌙 Evening Nudge Hook
 * ========================
 * يفحص آخر اليوم (بعد الساعة 8م) إذا المستخدم
 * لم يكمل مراجعة المساء — يظهر reminder بسيط.
 *
 * يُستخدم في TodayView عشان يكون Nudge داخلي
 * بدون تدخل في نظام الإشعارات الخارجي.
 */

import { useState, useEffect, useCallback } from "react";
import { useRitualState } from "@/domains/journey/store/ritual.store";

const NUDGE_DISMISSED_KEY = "alrehla-evening-nudge-dismissed";

interface EveningNudgeState {
  shouldShow: boolean;
  dismiss: () => void;
  openReview: () => void;
}

/**
 * Hook يراقب الوقت ويقرر إذا يظهر الـ nudge
 * @param onOpenEveningReview - callback لفتح EveningReview modal
 */
export function useEveningNudge(onOpenEveningReview?: () => void): EveningNudgeState {
  const [shouldShow, setShouldShow] = useState(false);
  const getTodayPlan = useRitualState((s) => s.getTodayPlan);

  useEffect(() => {
    function checkIfShouldNudge() {
      const hour = new Date().getHours();

      // فقط بعد الساعة 8م (20:00) وقبل منتصف الليل
      if (hour < 20 || hour >= 24) {
        setShouldShow(false);
        return;
      }

      // فحص إذا تم تجاهل الـ nudge اليوم
      const today = new Date().toISOString().slice(0, 10);
      const dismissed = localStorage.getItem(NUDGE_DISMISSED_KEY);
      if (dismissed === today) {
        setShouldShow(false);
        return;
      }

      // فحص إذا المستخدم كمّل المراجعة
      const todayPlan = getTodayPlan();
      if (todayPlan?.eveningReflection) {
        setShouldShow(false);
        return;
      }

      // كل الشروط اتحققت — اظهر الـ nudge
      setShouldShow(true);
    }

    checkIfShouldNudge();

    // فحص كل دقيقتين
    const interval = setInterval(checkIfShouldNudge, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getTodayPlan]);

  const dismiss = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(NUDGE_DISMISSED_KEY, today);
    setShouldShow(false);
  }, []);

  const openReview = useCallback(() => {
    onOpenEveningReview?.();
    setShouldShow(false);
  }, [onOpenEveningReview]);

  return { shouldShow, dismiss, openReview };
}
