import { lazy, Suspense, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { PWAInstallProvider } from "./contexts/PWAInstallContext";
import { AppExperienceShell } from "./components/app-shell/AppExperienceShell";
import { XpFloatProvider } from "./components/XpFloatProvider";
import { OfflineModeBanner } from "./components/OfflineModeBanner";
import { WELCOME_SEEN_KEY } from "./components/FirstTimeWelcomeFlow";
import { getFromLocalStorage } from "./services/browserStorage";
import { scheduleStreakReminder } from "./services/useStreakReminder";

const FirstTimeWelcomeFlow = lazy(() =>
  import("./components/FirstTimeWelcomeFlow").then(m => ({ default: m.FirstTimeWelcomeFlow }))
);

export default function App() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show first-time flow if never seen
    const seen = getFromLocalStorage(WELCOME_SEEN_KEY);
    if (!seen) setShowWelcome(true);
    // Schedule daily streak reminder if permission already granted
    scheduleStreakReminder();
  }, []);

  return (
    <XpFloatProvider>
      <PWAInstallProvider>
        <AppExperienceShell />
        <OfflineModeBanner />
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
