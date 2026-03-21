import { PWAInstallProvider } from "./contexts/PWAInstallContext";
import { AppExperienceShell } from "./components/app-shell/AppExperienceShell";

export default function App() {
  return (
    <PWAInstallProvider>
      <AppExperienceShell />
    </PWAInstallProvider>
  );
}
