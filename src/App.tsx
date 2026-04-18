import { initMonitoring } from "@/services/monitoring";
import { performanceTracker } from "@/services/PerformanceTracker";
import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import { AppExperienceShell } from "@/modules/meta/app-shell/AppExperienceShell";
import "@/core/synapse/SovereignOverseer"; // 👁️ Initialize Neural Overseer

initMonitoring();
performanceTracker.init();

export default function App({ onExitToLanding }: { onExitToLanding?: () => void }) {
  return (
    <PWAInstallProvider>
      <AppExperienceShell onExitToLanding={onExitToLanding} />
    </PWAInstallProvider>
  );
}
