import { initMonitoring } from "@/services/monitoring";
import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import { AppExperienceShell } from "@/modules/meta/app-shell/AppExperienceShell";
import "@/core/synapse/LeadershipOverseer"; // 👁️ Initialize Neural Overseer
import "@/shared/platform/platformWiring"; // 🧠 Initialize Platform Neural Wiring
import { initEventEffects } from "@/shared/events"; // ⚡ Initialize EventBus Side-Effects

initMonitoring();
initEventEffects();

export default function App({ onExitToLanding }: { onExitToLanding?: () => void }) {
  return (
    <PWAInstallProvider>
      <AppExperienceShell onExitToLanding={onExitToLanding} />
    </PWAInstallProvider>
  );
}
