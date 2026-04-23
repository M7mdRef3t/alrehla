"use client";

import { memo, useState, lazy, Suspense, type ComponentProps } from "react";
import { type AppScreen } from "@/navigation/navigationMachine";
import { AppStartScreens } from "../AppStartScreens";
import { AppJourneyScreens } from "../AppJourneyScreens";
import { AppMetaScreens } from "../AppMetaScreens";
import { StoriesScreen } from "../../growth/StoriesScreen";
import { AboutScreen } from "../../growth/AboutScreen";
import { RelationshipInsightsDashboard } from "../../exploration/RelationshipInsightsDashboard";
import { QuizzesHub } from "../../growth/QuizzesHub";
import { BehavioralAnalysisHub } from "../../exploration/BehavioralAnalysisHub";
import { ResourcesCenter } from "../../growth/ResourcesCenter";
import type { ResourceTab } from "../../growth/ResourcesCenter";
import { UserProfile } from "../UserProfile";
import { SanctuaryDashboard } from "../SanctuaryDashboard";
import { DawayirPlayground } from "../../social/DawayirPlayground";
import { AwarenessSkeleton } from "../AwarenessSkeleton";

const CommandCenter = lazy(() => import("../../lifeOS/CommandCenter"));
const MarayaApp = lazy(() => import("../../maraya/MarayaApp"));
const SessionIntakeScreen = lazy(() => import("../../sessions/SessionIntakeScreen").then(m => ({ default: m.SessionIntakeScreen })));
const AtmosferaExperience = lazy(() => import("../../atmosfera/AtmosferaExperience"));
const MasaratScreen = lazy(() => import("../../masarat/MasaratScreen"));
const SessionOSConsole = lazy(() => import("../../sessions/SessionOSConsole"));
const BaseeraScreen = lazy(() => import("../../baseera/BaseeraScreen"));
const WatheeqaScreen = lazy(() => import("../../watheeqa/WatheeqaScreen"));
const MizanScreen = lazy(() => import("../../mizan/MizanScreen"));
const RifaqScreen = lazy(() => import("../../rifaq/RifaqScreen"));
const MurshidScreen = lazy(() => import("../../murshid/MurshidScreen"));
const TaqrirScreen = lazy(() => import("../../taqrir/TaqrirScreen"));
const BawsalaScreen = lazy(() => import("../../bawsala/BawsalaScreen"));
const RiwayaScreen = lazy(() => import("../../riwaya/RiwayaScreen"));
const NadhirScreen = lazy(() => import("../../nadhir/NadhirScreen"));
const WirdScreen = lazy(() => import("../../wird/WirdScreen"));
const MarkazScreen = lazy(() => import("../../markaz/MarkazScreen"));
const SadaScreen = lazy(() => import("../../sada/SadaScreen"));
const HafizScreen = lazy(() => import("../../hafiz/HafizScreen"));
const MirahScreen = lazy(() => import("../../mirah/MirahScreen"));
const SijilScreen = lazy(() => import("../../sijil/SijilScreen"));
const NabaScreen = lazy(() => import("../../naba/NabaScreen"));
const MithaqScreen = lazy(() => import("../../mithaq/MithaqScreen"));
const SullamScreen = lazy(() => import("../../sullam/SullamScreen"));
const BathraScreen = lazy(() => import("../../bathra/BathraScreen"));
const ObservatoryScreen = lazy(() => import("../../observatory/ObservatoryScreen").then(m => ({ default: m.ObservatoryScreen })));
const WasiyyaScreen = lazy(() => import("../../wasiyya/WasiyyaScreen"));
const KhalwaScreen = lazy(() => import("../../khalwa/KhalwaScreen"));
const EcosystemHub = lazy(() => import("../../ecosystem/EcosystemHub"));
const TazkiyaScreen = lazy(() => import("../../tazkiya/TazkiyaScreen"));
const JisrScreen = lazy(() => import("../../jisr/JisrScreen"));
const RisalaScreen = lazy(() => import("../../risala/RisalaScreen"));
const ShahadaScreen = lazy(() => import("../../shahada/ShahadaScreen"));
const WarshaScreen = lazy(() => import("../../warsha/WarshaScreen"));
const KanzScreen = lazy(() => import("../../kanz/KanzScreen"));
const QalbScreen = lazy(() => import("../../qalb/QalbScreen"));
const AtharScreen = lazy(() => import("../../athar/AtharScreen"));
const RafiqScreen = lazy(() => import("../../rafiq/RafiqScreen"));
const NiyyaScreen = lazy(() => import("../../niyya/NiyyaScreen"));
const SamtScreen = lazy(() => import("../../samt/SamtScreen"));
const JathrScreen = lazy(() => import("../../jathr/JathrScreen"));
const KharitaScreen = lazy(() => import("../../kharita/KharitaScreen"));
const RuyaScreen = lazy(() => import("../../ruya/RuyaScreen"));
const RayaScreen = lazy(() => import("../../raya/RayaScreen"));
const YawmiyyatScreen = lazy(() => import("../../yawmiyyat/YawmiyyatScreen"));
const QinaaScreen = lazy(() => import("../../qinaa/QinaaScreen"));
const NabdScreen = lazy(() => import("../../nabd/NabdScreen"));
const RaseedScreen = lazy(() => import("../../raseed/RaseedScreen"));
const DawraScreen = lazy(() => import("../../dawra/DawraScreen"));
const ZillScreen = lazy(() => import("../../zill/ZillScreen"));
const SilaScreen = lazy(() => import("../../sila/SilaScreen"));



import { PageShell } from "./PageShell";


type StartScreensProps = ComponentProps<typeof AppStartScreens>;
type JourneyScreensProps = ComponentProps<typeof AppJourneyScreens>;
type MetaScreensProps = ComponentProps<typeof AppMetaScreens>;

interface AppMainExperienceContentProps {
  screen: AppScreen;
  authUserId: MetaScreensProps["authUserId"];
  ownerInstallRequestNonce: StartScreensProps["ownerInstallRequestNonce"];
  onOwnerInstallRequestHandled: StartScreensProps["onOwnerInstallRequestHandled"];
  welcome: StartScreensProps["welcome"];
  onClearWelcome: StartScreensProps["onClearWelcome"];
  category: StartScreensProps["category"];
  goalId: StartScreensProps["goalId"];
  selectedNodeId: StartScreensProps["selectedNodeId"];
  pulseMode: StartScreensProps["pulseMode"];
  pulseInsight: StartScreensProps["pulseInsight"];
  isLowPulseCocoonSuppressed: StartScreensProps["isLowPulseCocoonSuppressed"];
  canUseBasicDiagnosis: StartScreensProps["canUseBasicDiagnosis"];
  challengeTarget: StartScreensProps["challengeTarget"];
  challengeLabel: StartScreensProps["challengeLabel"];
  nextStepDecision: StartScreensProps["nextStepDecision"];
  hideBottomDock: StartScreensProps["hideBottomDock"];
  toolsBackScreen: JourneyScreensProps["toolsBackScreen"];
  missionNodeId: JourneyScreensProps["missionNodeId"];
  canUseMap: JourneyScreensProps["canUseMap"];
  availableFeatures: JourneyScreensProps["availableFeatures"];
  onStartJourney: StartScreensProps["onStartJourney"];
  onOpenSurvey: StartScreensProps["onOpenSurvey"];
  onGoalBack: StartScreensProps["onGoalBack"];
  onGoalSelected: StartScreensProps["onGoalSelected"];
  onSurveyComplete: StartScreensProps["onSurveyComplete"];
  onSelectNode: StartScreensProps["onSelectNode"];
  onOpenBreathing: StartScreensProps["onOpenBreathing"];
  onOpenMission: StartScreensProps["onOpenMission"];
  onOpenMissionFromAddPerson: StartScreensProps["onOpenMissionFromAddPerson"];
  onOpenCocoon: StartScreensProps["onOpenCocoon"];
  onOpenNoise: StartScreensProps["onOpenNoise"];
  onFeatureLocked: StartScreensProps["onFeatureLocked"];
  onTakeNextStep: StartScreensProps["onTakeNextStep"];
  onRefreshNextStep: StartScreensProps["onRefreshNextStep"];
  onOpenPulse: StartScreensProps["onOpenPulse"];
  onOpenLibrary: StartScreensProps["onOpenLibrary"];
  onOpenProfile: StartScreensProps["onOpenProfile"];
  onNavigate: JourneyScreensProps["onNavigate"];
  onOpenDawayir: JourneyScreensProps["onOpenDawayir"];
  onOpenDawayirSetup: JourneyScreensProps["onOpenDawayirSetup"];
  onOpenGoal: JourneyScreensProps["onOpenGoal"];
  onOpenMuteProtocol: MetaScreensProps["onOpenMuteProtocol"];
  onOpenMirror: MetaScreensProps["onOpenMirror"];
  onOpenConsciousnessArchive: MetaScreensProps["onOpenConsciousnessArchive"];
  onOpenTimeCapsule: MetaScreensProps["onOpenTimeCapsule"];
  onDiagnosisComplete?: StartScreensProps["onDiagnosisComplete"];
}

export const AppMainExperienceContent = memo(function AppMainExperienceContent({
  screen,
  authUserId,
  ownerInstallRequestNonce,
  onOwnerInstallRequestHandled,
  welcome,
  onClearWelcome,
  category,
  goalId,
  selectedNodeId,
  pulseMode,
  pulseInsight,
  isLowPulseCocoonSuppressed,
  canUseBasicDiagnosis,
  challengeTarget,
  challengeLabel,
  nextStepDecision,
  hideBottomDock,
  toolsBackScreen,
  missionNodeId,
  canUseMap,
  availableFeatures,
  onStartJourney,
  onOpenSurvey,
  onGoalBack,
  onGoalSelected,
  onSurveyComplete,
  onSelectNode,
  onOpenBreathing,
  onOpenMission,
  onOpenMissionFromAddPerson,
  onOpenCocoon,
  onOpenNoise,
  onFeatureLocked,
  onTakeNextStep,
  onRefreshNextStep,
  onOpenPulse,
  onOpenLibrary,
  onOpenProfile,
  onNavigate,
  onOpenDawayir,
  onOpenDawayirSetup,
  onOpenGoal,
  onOpenMuteProtocol,
  onOpenMirror,
  onOpenConsciousnessArchive,
  onOpenTimeCapsule,
  onDiagnosisComplete,
}: AppMainExperienceContentProps) {
  // State for deep-linking from BehavioralHub to ResourcesCenter
  const [resourceDeepLink, setResourceDeepLink] = useState<{ tab: ResourceTab; search: string } | null>(null);

  if (screen === "landing" || screen === "goal" || screen === "survey" || screen === "map" || screen === "protocol" || screen === "diagnosis") {
    return (
      <AppStartScreens
        screen={screen}
        ownerInstallRequestNonce={ownerInstallRequestNonce}
        onOwnerInstallRequestHandled={onOwnerInstallRequestHandled}
        welcome={welcome}
        onClearWelcome={onClearWelcome}
        category={category}
        goalId={goalId}
        selectedNodeId={selectedNodeId}
        pulseMode={pulseMode}
        pulseInsight={pulseInsight}
        isLowPulseCocoonSuppressed={isLowPulseCocoonSuppressed}
        canUseBasicDiagnosis={canUseBasicDiagnosis}
        challengeTarget={challengeTarget}
        challengeLabel={challengeLabel}
        nextStepDecision={nextStepDecision}
        hideBottomDock={hideBottomDock}
        onStartJourney={onStartJourney}
        onOpenSurvey={onOpenSurvey}
        onGoalBack={onGoalBack}
        onGoalSelected={onGoalSelected}
        onSurveyComplete={onSurveyComplete}
        onSelectNode={onSelectNode}
        onOpenBreathing={onOpenBreathing}
        onOpenMission={onOpenMission}
        onOpenMissionFromAddPerson={onOpenMissionFromAddPerson}
        onOpenCocoon={onOpenCocoon}
        onOpenNoise={onOpenNoise}
        onFeatureLocked={onFeatureLocked}
        onTakeNextStep={onTakeNextStep}
        onRefreshNextStep={onRefreshNextStep}
        onOpenPulse={onOpenPulse}
        onOpenLibrary={onOpenLibrary}
        onOpenProfile={onOpenProfile}
        onNavigate={(s) => onNavigate?.(s as Parameters<typeof onNavigate>[0])}
        onDiagnosisComplete={onDiagnosisComplete}
      />
    );
  }

  if (
    screen === "tools" ||
    screen === "settings" ||
    screen === "guided" ||
    screen === "mission" ||
    screen === "exit-scripts" ||
    screen === "grounding"
  ) {
    return (
      <Suspense fallback={<AwarenessSkeleton />}>
        <AppJourneyScreens
          screen={screen}
          toolsBackScreen={toolsBackScreen}
          missionNodeId={missionNodeId}
          canUseMap={canUseMap}
          availableFeatures={availableFeatures}
          nextStepDecision={nextStepDecision}
          onNavigate={onNavigate}
          onOpenDawayir={onOpenDawayir}
          onOpenDawayirSetup={onOpenDawayirSetup}
          onFeatureLocked={onFeatureLocked}
          onOpenGoal={onOpenGoal}
          onTakeNextStep={onTakeNextStep}
          onRefreshNextStep={onRefreshNextStep}
        />
      </Suspense>
    );
  }

  if (
    screen === "enterprise" ||
    screen === "guilt-court" ||
    screen === "diplomacy" ||
    screen === "oracle-dashboard" ||
    screen === "armory"
  ) {
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <AppMetaScreens
          screen={screen}
          authUserId={authUserId}
          onNavigate={onNavigate}
          onOpenMuteProtocol={onOpenMuteProtocol}
          onOpenCocoon={onOpenCocoon}
          onOpenMirror={onOpenMirror}
          onOpenConsciousnessArchive={onOpenConsciousnessArchive}
          onOpenTimeCapsule={onOpenTimeCapsule}
        />
      </PageShell>
    );
  }

  if (screen === "stories") {
    return (
      <PageShell headerMode="none" tabBarVisible={false}>
        <StoriesScreen
          onBack={() => onNavigate?.("landing" as AppScreen)}
        />
      </PageShell>
    );
  }

  if (screen === "about") {
    return (
      <PageShell headerMode="none" tabBarVisible={false}>
        <AboutScreen
          onBack={() => onNavigate?.("landing" as AppScreen)}
          onStart={() => onStartJourney?.()}
        />
      </PageShell>
    );
  }

  if (screen === "insights") {
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <RelationshipInsightsDashboard
          onBack={() => onNavigate?.("landing" as AppScreen)}
          onGoToQuizzes={() => onNavigate?.("quizzes" as AppScreen)}
        />
      </PageShell>
    );
  }

  if (screen === "profile") {
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <UserProfile
          onBack={() => onNavigate?.("landing" as AppScreen)}
        />
      </PageShell>
    );
  }

  if (screen === "quizzes") {
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <QuizzesHub
          onBack={() => onNavigate?.("landing" as AppScreen)}
        />
      </PageShell>
    );
  }

  if (screen === "behavioral-analysis") {
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <BehavioralAnalysisHub
          onBack={() => onNavigate?.("landing" as AppScreen)}
          onNavigateToResources={(tab, search) => {
            setResourceDeepLink({ tab, search });
            onNavigate?.("resources" as AppScreen);
          }}
        />
      </PageShell>
    );
  }

  if (screen === "resources") {
    const link = resourceDeepLink;
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <ResourcesCenter
          onBack={() => { setResourceDeepLink(null); onNavigate?.("landing" as AppScreen); }}
          initialTab={link?.tab}
          initialSearch={link?.search}
        />
      </PageShell>
    );
  }

  if (screen === "sanctuary") {
    return (
      <PageShell headerMode="standard" tabBarVisible={true} breadcrumbVisible={true}>
        <SanctuaryDashboard
          onNavigate={(s) => onNavigate?.(s as any)}
          onOpenBreathing={() => onOpenBreathing?.()}
        />
      </PageShell>
    );
  }

  if (screen === "life-os") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
          <CommandCenter
            onBack={() => onNavigate?.("landing" as AppScreen)}
            onOpenLibrary={onOpenLibrary}
          />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "dawayir") {
    return (
      <PageShell headerMode="standard" tabBarVisible={true}>
        <DawayirPlayground
          onBack={() => onNavigate?.("landing" as AppScreen)}
        />
      </PageShell>
    );
  }

  if (screen === "maraya") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
          <MarayaApp />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "session-intake") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#030308" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <SessionIntakeScreen
            onBack={() => onNavigate?.("landing" as AppScreen)}
          />
        </Suspense>
      </PageShell>
    );
  }
  if (screen === "atmosfera") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0e1f" }}><div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>}>
          <AtmosferaExperience />
        </Suspense>
      </PageShell>
    );
  }
  if (screen === "masarat") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0e1f" }}><div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>}>
          <MasaratScreen />
        </Suspense>
      </PageShell>
    );
  }
  if (screen === "session-console") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0e1f" }}><div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>}>
          <SessionOSConsole />
        </Suspense>
      </PageShell>
    );
  }
  if (screen === "baseera") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0a1a" }}><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>}>
          <BaseeraScreen />
        </Suspense>
      </PageShell>
    );
  }
  if (screen === "watheeqa") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0a1a" }}><div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>}>
          <WatheeqaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "mizan") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0a1a" }}><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
          <MizanScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "rifaq") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0a1a" }}><div className="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" /></div>}>
          <RifaqScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "murshid") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#070b1a" }}><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
          <MurshidScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "taqrir") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0a1a" }}><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>}>
          <TaqrirScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "bawsala") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#070b1a" }}><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>}>
          <BawsalaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "riwaya") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0a1a" }}><div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>}>
          <RiwayaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "nadhir") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0508" }}><div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>}>
          <NadhirScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "wird") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0a12" }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>}>
          <WirdScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "markaz") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#060812" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <MarkazScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "sada") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#080a14" }}><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>}>
          <SadaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "hafiz") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0612" }}><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>}>
          <HafizScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "mirah") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0c0616" }}><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>}>
          <MirahScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "sijil") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#060a10" }}><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
          <SijilScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "naba") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#080612" }}><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>}>
          <NabaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "mithaq") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0c0810" }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>}>
          <MithaqScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "sullam") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#080c06" }}><div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin" /></div>}>
          <SullamScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "bathra") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#061208" }}><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
          <BathraScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "observatory") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#020617" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <ObservatoryScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "wasiyya") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0c0a06" }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>}>
          <WasiyyaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "khalwa") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0616" }}><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
          <KhalwaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "ecosystem-hub") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <EcosystemHub onNavigate={(s) => onNavigate?.(s as any)} />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "tazkiya") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#08061a" }}><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
          <TazkiyaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "jisr") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
          <JisrScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "risala") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>}>
          <RisalaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "shahada") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>}>
          <ShahadaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "warsha") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>}>
          <WarshaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "kanz") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>}>
          <KanzScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "qalb") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" /></div>}>
          <QalbScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "athar") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
          <AtharScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "rafiq") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <RafiqScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "niyya") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <NiyyaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "samt") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /></div>}>
          <SamtScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "jathr") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
          <JathrScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "kharita") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>}>
          <KharitaScreen onNavigate={onNavigate} />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "ruya") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#0a0616" }}><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>}>
          <RuyaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "raya") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <RayaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "yawmiyyat") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>}>
          <YawmiyyatScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "qinaa") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>}>
          <QinaaScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "nabd") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>}>
          <NabdScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "raseed") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>}>
          <RaseedScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "dawra") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <DawraScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "zill") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}>
          <ZillScreen />
        </Suspense>
      </PageShell>
    );
  }

  if (screen === "sila") {
    return (
      <PageShell headerMode="none" tabBarVisible={true}>
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center" style={{ background: "#050510" }}><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
          <SilaScreen />
        </Suspense>
      </PageShell>
    );
  }

  return null;
});

