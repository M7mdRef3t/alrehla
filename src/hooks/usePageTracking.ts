import { useEffect } from "react";
import { trackPageView } from "../services/analytics";

/**
 * Hook لتتبع الصفحات تلقائياً
 */
export function usePageTracking(pageName: string): void {
  useEffect(() => {
    trackPageView(pageName);
  }, [pageName]);
}
