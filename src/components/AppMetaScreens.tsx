import { lazy } from "react";
import { type MirrorInsight } from "../services/mirrorLogic";

const EnterprisePortal = lazy(() => import("./enterprise/EnterprisePortal").then((m) => ({ default: m.EnterprisePortal })));
const GuiltCourt = lazy(() => import("./GuiltCourt").then((m) => ({ default: m.GuiltCourt })));
const DiplomaticCables = lazy(() => import("./DiplomaticCables").then((m) => ({ default: m.DiplomaticCables })));
const OracleCouncilDashboard = lazy(() =>
  import("./Oracle/OracleDashboard").then((m) => ({ default: m.OracleCouncilDashboard }))
);
const TheArmoryScreen = lazy(() => import("./TheArmoryScreen").then((m) => ({ default: m.TheArmoryScreen })));

type MetaScreen = "enterprise" | "guilt-court" | "diplomacy" | "oracle-dashboard" | "armory";

interface AppMetaScreensProps {
  screen: MetaScreen;
  authUserId: string | null | undefined;
  onNavigate: (screen: string) => void;
  onOpenMuteProtocol: () => void;
  onOpenCocoon: () => void;
  onOpenMirror: (insight: MirrorInsight) => void;
  onOpenConsciousnessArchive: () => void;
  onOpenTimeCapsule: () => void;
}

export function AppMetaScreens({
  screen,
  authUserId,
  onNavigate,
  onOpenMuteProtocol,
  onOpenCocoon,
  onOpenMirror,
  onOpenConsciousnessArchive,
  onOpenTimeCapsule
}: AppMetaScreensProps) {
  if (screen === "enterprise") {
    return <EnterprisePortal onBack={() => onNavigate("map")} />;
  }

  if (screen === "guilt-court") {
    return <GuiltCourt onBack={() => onNavigate("map")} />;
  }

  if (screen === "diplomacy") {
    return <DiplomaticCables onBack={() => onNavigate("map")} />;
  }

  if (screen === "oracle-dashboard" && authUserId) {
    return <OracleCouncilDashboard oracleId={authUserId} />;
  }

  if (screen === "armory") {
    return (
      <TheArmoryScreen
        onBack={() => onNavigate("landing")}
        onOpenMuteProtocol={onOpenMuteProtocol}
        onOpenCocoon={onOpenCocoon}
        onOpenMirror={() =>
          onOpenMirror({
            id: "manual-confront",
            type: "emotional_denial",
            title: "المواجهة الاختيارية",
            message: "أنت اخترت تفتح المراية الآن. هذه فرصة للصدق مع نفسك بدل الهروب.",
            question: "ما أكثر شيء تهرب منه الآن؟",
            severity: "firm"
          })
        }
        onOpenGuiltCourt={() => onNavigate("guilt-court")}
        onOpenConsciousnessArchive={onOpenConsciousnessArchive}
        onOpenTimeCapsule={onOpenTimeCapsule}
      />
    );
  }

  return null;
}
