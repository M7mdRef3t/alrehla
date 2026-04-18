import { useEffect } from "react";
import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import { AppExperienceShell } from "@/modules/meta/app-shell/AppExperienceShell";

export default function App({ onExitToLanding }: { onExitToLanding?: () => void }) {
  useEffect(() => {
    void import("@/services/monitoring").then(({ initMonitoring }) => {
      initMonitoring();
    });

    void import("@/core/synapse/SovereignOverseer");
  }, []);

  return (
    <PWAInstallProvider>
      <AppExperienceShell onExitToLanding={onExitToLanding} />
    </PWAInstallProvider>
  );
}
