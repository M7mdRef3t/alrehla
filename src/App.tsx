import { lazy, Suspense, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PWAInstallProvider } from "./contexts/PWAInstallContext";
import { AppExperienceShell } from "./components/app-shell/AppExperienceShell";
import { XpFloatProvider } from "./components/XpFloatProvider";
import { OfflineModeBanner } from "./components/OfflineModeBanner";
import { BadgeShareHost } from "./components/BadgeShareHost";
import { WELCOME_SEEN_KEY } from "./components/FirstTimeWelcomeFlow";
import { getFromLocalStorage, setInLocalStorage } from "./services/browserStorage";
import { scheduleStreakReminder, requestNotificationPermission } from "./services/useStreakReminder";
import { Bell, X } from "lucide-react";

const FirstTimeWelcomeFlow = lazy(() =>
  import("./components/FirstTimeWelcomeFlow").then(m => ({ default: m.FirstTimeWelcomeFlow }))
);

const NOTIF_BANNER_KEY = "alrehla_notif_banner_dismissed";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  useEffect(() => {
    // Show first-time flow if never seen
    const seen = getFromLocalStorage(WELCOME_SEEN_KEY);
    if (!seen) setShowWelcome(true);

    // Show notification permission banner if:
    // - Not yet granted, not explicitly denied, not dismissed before
    const dismissed = getFromLocalStorage(NOTIF_BANNER_KEY);
    if (
      !dismissed &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      // Delay 8s so it doesn't compete with welcome flow
      const t = setTimeout(() => setShowNotifBanner(true), 8000);
      return () => clearTimeout(t);
    }

    // Already granted → schedule immediately
    scheduleStreakReminder();
  }, []);

  async function handleAllowNotifs() {
    setShowNotifBanner(false);
    const perm = await requestNotificationPermission();
    if (perm === "granted") scheduleStreakReminder();
    setInLocalStorage(NOTIF_BANNER_KEY, "1");
  }

  function dismissNotifBanner() {
    setShowNotifBanner(false);
    setInLocalStorage(NOTIF_BANNER_KEY, "1");
  }

  return (
    <XpFloatProvider>
      <PWAInstallProvider>
        <AppExperienceShell />
        <OfflineModeBanner />
        <BadgeShareHost />

        {/* ── Streak Notification Permission Banner ── */}
        <AnimatePresence>
          {showNotifBanner && (
            <div style={{
              position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)",
              zIndex: 99100, display: "flex", alignItems: "center", gap: 12,
              padding: "14px 18px", borderRadius: 16, maxWidth: "calc(100vw - 40px)",
              background: "rgba(10,13,26,0.97)",
              border: "1px solid rgba(20,210,200,0.25)",
              boxShadow: "0 0 40px rgba(20,210,200,0.12), 0 8px 32px rgba(0,0,0,0.7)",
              backdropFilter: "blur(16px)",
              fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
              direction: "rtl",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "rgba(20,210,200,0.1)", border: "1px solid rgba(20,210,200,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bell size={16} style={{ color: "#14d2c8" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 900, color: "#fff" }}>
                  🔥 بقِ على تسلسلك
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  فعّل التذكير اليومي لحماية streak نشاطك
                </p>
              </div>
              <button
                onClick={() => void handleAllowNotifs()}
                style={{
                  padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#14d2c8,#0ea5e9)",
                  color: "#fff", fontSize: 12, fontWeight: 900, flexShrink: 0,
                }}
              >
                فعّل
              </button>
              <button onClick={dismissNotifBanner} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.3)", display: "flex", padding: 4,
              }}>
                <X size={14} />
              </button>
            </div>
          )}
        </AnimatePresence>

        {/* ── First-Time Welcome Flow ── */}
        <AnimatePresence>
          {showWelcome && (
            <Suspense fallback={null}>
              <FirstTimeWelcomeFlow onDone={() => setShowWelcome(false)} />
            </Suspense>
          )}
        </AnimatePresence>
      </PWAInstallProvider>
    </XpFloatProvider>
  );
}
