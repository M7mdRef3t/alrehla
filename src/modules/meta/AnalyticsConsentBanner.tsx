import { useEffect, useState } from "react";
import { setAnalyticsConsent, trackEvent, AnalyticsEvents } from "@/services/analytics";
import { isUserMode } from "@/config/appEnv";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";

const ANALYTICS_CONSENT_KEY = "dawayir-analytics-consent";
const ANALYTICS_BANNER_SNOOZE_KEY = "dawayir-analytics-banner-snooze-until";
const SNOOZE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface AnalyticsConsentBannerProps {
  suppressed?: boolean;
}

export const AnalyticsConsentBanner = ({ suppressed = false }: AnalyticsConsentBannerProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isUserMode || suppressed) {
      setVisible(false);
      return;
    }

    const savedConsent = getFromLocalStorage(ANALYTICS_CONSENT_KEY);
    if (savedConsent === "true" || savedConsent === "false") {
      setVisible(false);
      return;
    }

    const snoozeUntil = parseInt(getFromLocalStorage(ANALYTICS_BANNER_SNOOZE_KEY) ?? "0", 10);
    if (Number.isFinite(snoozeUntil) && snoozeUntil > Date.now()) {
      setVisible(false);
      return;
    }

    setVisible(true);
  }, [suppressed]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-4 left-1/2 z-[70] w-[min(44rem,calc(100vw-1rem))] -translate-x-1/2 px-2">
      <div className="rounded-2xl border border-white/15 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
        <div className="mb-2 text-sm leading-relaxed text-slate-200">
          نستخدم أدوات قياس بسيطة لتحسين المنصة بدون جمع محتواك الشخصي. هل توافق على التفعيل؟
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-500"
            onClick={() => {
              setAnalyticsConsent(true);
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
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/10"
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
            className="rounded-full border border-transparent px-4 py-1.5 text-sm text-slate-300 hover:bg-white/10"
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
