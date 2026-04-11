import { initMonitoring } from "@/services/monitoring";
import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import { AppExperienceShell } from "@/modules/meta/app-shell/AppExperienceShell";
import "@/core/synapse/SovereignOverseer"; // 👁️ Initialize Neural Overseer

initMonitoring();

export default function App({ onExitToLanding }: { onExitToLanding?: () => void }) {
  return (
    <PWAInstallProvider>
      <AppExperienceShell onExitToLanding={onExitToLanding} />
    </PWAInstallProvider>
  );
}

