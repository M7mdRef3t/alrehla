import { PWAInstallProvider } from "@/contexts/PWAInstallContext";
import { AppExperienceShell } from "@/modules/meta/app-shell/AppExperienceShell";

export default function App({ onExitToLanding }: { onExitToLanding?: () => void }) {
  return (
    <PWAInstallProvider>
      <AppExperienceShell onExitToLanding={onExitToLanding} />
    </PWAInstallProvider>
  );
}
