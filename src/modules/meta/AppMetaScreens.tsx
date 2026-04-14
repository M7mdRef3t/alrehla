import { lazy, Suspense } from "react";
import { AwarenessSkeleton } from "./AwarenessSkeleton";
import { type MirrorInsight } from "@/services/mirrorLogic";


const EnterprisePortal = lazy(() => import("./enterprise/EnterprisePortal").then((m) => ({ default: m.EnterprisePortal })));
const GuiltCourt = lazy(() => import('@/modules/action/GuiltCourt').then((m) => ({ default: m.GuiltCourt })));
const DiplomaticCables = lazy(() => import("@/components/DiplomaticCables").then((m) => ({ default: m.DiplomaticCables })));
const OracleCouncilDashboard = lazy(() =>
  import("@/components/Oracle/OracleDashboard").then((m) => ({ default: m.OracleCouncilDashboard }))
);
const TheArmoryScreen = lazy(() => import('@/modules/action/TheArmoryScreen').then((m) => ({ default: m.TheArmoryScreen })));


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
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
        <EnterprisePortal onBack={() => onNavigate("map")} />
      </Suspense>
    );
  }

  if (screen === "guilt-court") {
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
        <GuiltCourt onBack={() => onNavigate("map")} />
      </Suspense>
    );
  }

  if (screen === "diplomacy") {
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
        <DiplomaticCables onBack={() => onNavigate("map")} />
      </Suspense>
    );
  }

  if (screen === "oracle-dashboard" && authUserId) {
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
        <OracleCouncilDashboard oracleId={authUserId} />
      </Suspense>
    );
  }

  if (screen === "armory") {
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
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
      </Suspense>
    );
  }

  return null;
}
