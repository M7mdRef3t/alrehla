import { useEffect } from "react";
import { analyticsService } from "@/domains/analytics";

/**
 * Hook لتتبع الصفحات تلقائياً
 */
export function usePageTracking(pageName: string): void {
  useEffect(() => {
    analyticsService.trackPage(pageName);
  }, [pageName]);
}
