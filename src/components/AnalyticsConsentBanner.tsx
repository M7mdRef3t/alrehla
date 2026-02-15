import { useEffect, useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent, trackEvent, AnalyticsEvents } from "../services/analytics";
import { isUserMode } from "../config/appEnv";
import { getFromLocalStorage, setInLocalStorage } from "../services/browserStorage";

const ANALYTICS_CONSENT_KEY = "dawayir-analytics-consent";
const ANALYTICS_BANNER_SNOOZE_KEY = "dawayir-analytics-banner-snooze-until";
const SNOOZE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const AnalyticsConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isUserMode) return; // only in user mode
    const savedConsent = getFromLocalStorage(ANALYTICS_CONSENT_KEY);
    if (savedConsent === "true" || savedConsent === "false") return;

    const snoozeUntil = parseInt(getFromLocalStorage(ANALYTICS_BANNER_SNOOZE_KEY) ?? "0", 10);
    if (Number.isFinite(snoozeUntil) && snoozeUntil > Date.now()) return;

    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 px-2">
      <div className="rounded-2xl border border-gray-200 bg-amber-50 p-3 shadow-lg">
        <div className="mb-2 text-sm text-slate-800">
          نستخدم أدوات قياس بسيطة لتحسين المنصة بدون جمع محتوىك الشخصي. هل توافق على التفعيل؟
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
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
            موافق الآن
          </button>
          <button
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-gray-50"
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
            لا أوافق
          </button>
          <button
            className="rounded-full border border-transparent px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            onClick={() => {
              setInLocalStorage(ANALYTICS_BANNER_SNOOZE_KEY, String(Date.now() + SNOOZE_DURATION_MS));
              setVisible(false);
            }}
          >
            اسألني لاحقًا
          </button>
        </div>
      </div>
    </div>
  );
};
