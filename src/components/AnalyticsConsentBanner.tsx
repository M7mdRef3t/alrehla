import { useEffect, useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent, trackEvent, AnalyticsEvents } from "../services/analytics";
import { isUserMode } from "../config/appEnv";

export const AnalyticsConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isUserMode) return; // only in user mode
    const consent = getAnalyticsConsent();
    // show banner if consent not set (null/false)
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 z-50">
      <div className="max-w-2xl mx-auto bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
        <div className="flex-1 text-sm text-slate-800 dark:text-slate-200">
          نستخدم أدوات قياس لتطوير المنصة وتحسين التجربة. هل تسمح بتشغيل أدوات الإحصاء (مؤقتًا)؟
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full bg-teal-600 text-white px-4 py-2 text-sm font-semibold hover:bg-teal-700"
            onClick={() => {
              setAnalyticsConsent(true);
              // trigger analytics event after consent
              try {
                trackEvent(AnalyticsEvents.CONSENT_GIVEN);
              } catch {
                // ignore analytics failures in UI flow
              }
              setVisible(false);
            }}
          >
            أوافق
          </button>
          <button
            className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() => {
              setAnalyticsConsent(false);
              try {
                trackEvent(AnalyticsEvents.CONSENT_DENIED);
              } catch {
                // ignore analytics failures in UI flow
              }
              setVisible(false);
            }}
          >
            ارفض
          </button>
        </div>
      </div>
    </div>
  );
};
