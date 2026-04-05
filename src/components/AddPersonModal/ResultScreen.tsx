import type { FC } from "react";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Info, Target, BookOpen, Sparkles, ShieldAlert } from "lucide-react";
import type { FeelingAnswers } from "../FeelingCheck";
import type { RealityAnswers } from "../RealityCheck";
import type { QuickAnswer2 } from "../../utils/suggestInitialRing";
import type { PersonGender } from "../../utils/resultScreenAI";
import { buildResultTemplateFromAnswers } from "../../utils/resultScreenTemplates";
import { realityScoreToRing } from "../../utils/realityScore";
import { useMapState } from "../../state/mapState";
import { trackEvent, AnalyticsEvents } from "../../services/analytics";
import type { AdviceCategory } from "../../data/adviceScripts";
import type { AdviceZone } from "../../data/adviceScripts";
import { emergencyCopy } from "../../copy/emergency";
import { recordFlowEvent, recordPathStartedOnce } from "../../services/journeyTracking";
import { useSyncState } from "../../state/syncState";
import { isUserMode } from "../../config/appEnv";
import { SovereigntySnapshotCard } from "../SovereigntySnapshotCard";
import { deriveSovereigntySnapshot } from "../../utils/sovereigntySnapshot";
import { BoundaryEvidenceCard } from "../BoundaryEvidenceCard";
import { deriveBoundaryEvidence } from "../../utils/boundaryEvidence";
import { PressureSentenceCard } from "../PressureSentenceCard";
import { derivePressureSentence } from "../../utils/pressureSentence";
import { GenerationalEchoCard } from "../GenerationalEchoCard";
import { RecoveryRoadmap } from "../RecoveryRoadmap";
import { SuggestedPlacement } from "../SuggestedPlacement";
import { deriveGenerationalEcho } from "../../utils/generationalEcho";
import { PersonalizedTraining } from "../PersonalizedTraining";
import { SymptomsChecklist } from "../SymptomsChecklist";
import { BoundaryScriptsLibrary } from "../BoundaryScriptsLibrary";

interface ResultScreenProps {
  personLabel: string;
  personTitle?: string;
  personName?: string;
  personGender?: PersonGender;
  score: number;
  summaryOnly?: boolean;
  addedNodeId?: string;
  onClose?: (openNodeId?: string) => void;
  onOpenMission?: (nodeId: string) => void;
  onOpenEmergency?: () => void;
  realityAnswers?: RealityAnswers;
  feelingAnswers?: FeelingAnswers;
  isEmergency?: boolean;
  safetyAnswer?: QuickAnswer2;
  forcedGate?: boolean;
  category?: AdviceCategory;
}

export const ResultScreen: FC<ResultScreenProps> = ({
  personLabel,
  personTitle,
  personName,
  personGender,
  score,
  summaryOnly = false,
  addedNodeId,
  onClose,
  onOpenMission,
  onOpenEmergency,
  realityAnswers,
  feelingAnswers,
  isEmergency,
  safetyAnswer,
  forcedGate = false,
  category = "general"
}) => {
  const [showTraining, setShowTraining] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [showRealityPopup, setShowRealityPopup] = useState(false);
  const [showDopaminePopup, setShowDopaminePopup] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [ctaStatus, setCtaStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diagnosis" | "roadmap" | "tools">("diagnosis");

  const displayName = useMemo(() => {
    const name = personName?.trim();
    const title = personTitle?.trim();
    if (name) return name;
    if (title) return title;
    return personLabel;
  }, [personTitle, personName, personLabel]);

  const result = useMemo(() => buildResultTemplateFromAnswers({
    score,
    feelingAnswers,
    realityAnswers,
    isEmergency,
    safetyAnswer,
    personGender
  }), [score, feelingAnswers, realityAnswers, isEmergency, safetyAnswer, personGender]);
  const isEmotionalPrisoner = result.scenarioKey === "emotional_prisoner";

  const derivedRing = useMemo(
    () => (realityAnswers ? realityScoreToRing(realityAnswers) : "green"),
    [realityAnswers]
  );
  
  const nodes = useMapState((s) => s.nodes);
  const updateNodeSymptoms = useMapState((s) => s.updateNodeSymptoms);
  const setRecoveryPlanOpenWith = useMapState((s) => s.setRecoveryPlanOpenWith);
  const startMission = useMapState((s) => s.startMission);

  const addedNode = useMemo(() => 
    addedNodeId ? nodes.find((n) => n.id === addedNodeId) : undefined
  , [nodes, addedNodeId]);

  const missionProgress = addedNode?.missionProgress;
  const activeRing = addedNode?.ring ?? derivedRing;
  const detachmentReasons = addedNode?.recoveryProgress?.detachmentReasons;

  const mapSyncStatus = useSyncState((s) => s.status);
  const totalSteps = result.steps.length;
  
  const completedSteps = useMemo(() => {
    const checked = new Set(missionProgress?.checkedSteps ?? []);
    return result.steps.reduce((acc, _, index) => acc + (checked.has(index) ? 1 : 0), 0);
  }, [missionProgress?.checkedSteps, result.steps]);

  const isMissionStarted = Boolean(missionProgress?.startedAt);
  const isMissionCompleted = Boolean(missionProgress?.isCompleted);
  
  const missionButtonLabel = isMissionCompleted
    ? "الخطوة اتقفلت"
    : isMissionStarted
      ? "كمّل الخطوة"
      : "ابدأ الخطوة";

  const shortPromiseBody = useMemo(() => {
    const trimmed = result.promise_body.trim();
    if (trimmed.length <= 120) return trimmed;
    return `${trimmed.slice(0, 120).trim()}...`;
  }, [result.promise_body]);

  const normalizedObstacles = useMemo(
    () =>
      result.obstacles.map((item) => ({
        ...item,
        solution: item.solution.replace("Euphoric Recall", "استدعاء الذكريات الوردية")
      })),
    [result.obstacles]
  );

  const sovereigntySnapshot = useMemo(() => deriveSovereigntySnapshot({
    displayName,
    ring: activeRing,
    node: addedNode ?? null,
    isEmotionalPrisoner,
    completedSteps,
    totalSteps
  }), [activeRing, addedNode, completedSteps, displayName, isEmotionalPrisoner, totalSteps]);

  const boundaryEvidence = useMemo(() => 
    addedNode ? deriveBoundaryEvidence(addedNode, displayName) : null
  , [addedNode, displayName]);

  const pressureSentence = useMemo(() => 
    addedNode ? derivePressureSentence({ displayName, ring: activeRing, node: addedNode }) : null
  , [activeRing, addedNode, displayName]);

  const generationalEcho = useMemo(() => 
    addedNode ? deriveGenerationalEcho(addedNode, nodes) : null
  , [addedNode, nodes]);

  const shareText = useMemo(() => {
    const lines = [
      `نتيجتي مع ${displayName}: ${isEmotionalPrisoner ? result.state_label : result.title}`,
      `الهدف: ${result.goal_label}`,
      `الخطوة الحالية: ${result.mission_label} — ${result.mission_goal}`
    ];
    return lines.join("\n");
  }, [displayName, isEmotionalPrisoner, result.goal_label, result.mission_goal, result.mission_label, result.state_label, result.title]);

  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const isForcedCtaMode = isUserMode && forcedGate;
  const shouldShowMapSyncBanner = mapSyncStatus === "error";
  const mapSyncBannerText = "تعذر الحفظ السحابي مؤقتًا. هنحاول تلقائيًا عند فتح التطبيق.";

  const startMissionAndTrack = (nodeId: string) => {
    const node = useMapState.getState().nodes.find((item) => item.id === nodeId);
    if (!node) return;
    if (!node.missionProgress?.startedAt) startMission(nodeId);
    const pathId = node.recoveryProgress?.pathId ?? (node.ring === "red" ? "path_protection" : node.ring === "green" ? "path_deepening" : "path_negotiation");
    recordPathStartedOnce({ nodeId, pathId, zone: node.ring, relationshipRole: personTitle?.trim() || undefined });
  };

  const handleOpenTraumaRecoveryPath = () => {
    if (!addedNodeId) return;
    setRecoveryPlanOpenWith({ focusTraumaInheritance: true, preselectedNodeId: addedNodeId });
    onClose?.();
  };

  const handleShareResult = async () => {
    setShareStatus(null);
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const shareData = { title: `نتيجة ${displayName}`, text: shareText, url: typeof window !== "undefined" ? window.location.origin : undefined };
    try {
      if (nav && typeof nav.share === "function") {
        await nav.share(shareData);
        setShareStatus("تمت المشاركة بنجاح.");
        return;
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(shareText);
        setShareStatus("تم نسخ النتيجة. الصقها في أي تطبيق.");
        return;
      }
      setShareStatus("المشاركة غير متاحة على جهازك الآن.");
    } catch {
      setShareStatus("تعذر تنفيذ المشاركة الآن. جرّب مرة أخرى.");
    }
  };

  const handleDownloadShareImage = async () => {
    if (!shareCardRef.current) return;
    setShareBusy(true);
    setShareStatus(null);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(shareCardRef.current, { backgroundColor: "#010314", scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `alrehla-result-${Date.now()}.png`;
      link.click();
      setShareStatus("تم تحميل صورة النتيجة.");
    } catch {
      setShareStatus("تعذر تحميل صورة النتيجة الآن.");
    } finally {
      setShareBusy(false);
    }
  };

  const singularReferenceText = useMemo(() => {
    if (personGender === "female") return "بتكلميها";
    if (personGender === "male") return "بتكلمه";
    return "بتكلمي الشخص ده";
  }, [personGender]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-start overflow-y-auto px-4 py-12 md:py-20 bg-slate-950/90 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl space-y-8"
      >
        {/* Tabs Header */}
        <div className="flex bg-white/5 rounded-2xl p-1 mb-8 border border-white/10 shrink-0 shadow-xl">
          {[
            { id: "diagnosis", label: "التشخيص", icon: "👁️" },
            { id: "roadmap", label: "الخريطة", icon: "🗺️" },
            { id: "tools", label: "المفاهيم والعدة", icon: "🎒" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "diagnosis" | "roadmap" | "tools")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-black transition-all ${activeTab === tab.id ? "bg-slate-900 border border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
            >
              <span className="text-lg opacity-80">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        {/* التشخيص (Snapshot) هو أول شيء يظهر */}
        {activeTab === "diagnosis" && (
<>
<div ref={shareCardRef} className="p-8 rounded-3xl bg-slate-950 border border-white/10 mb-8 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent) pointer-events-none" />
          
          <h2 className="text-3xl font-black text-white mb-6 flex items-center justify-center gap-4">
            <span className="tracking-tight">
              {isEmotionalPrisoner ? `تشخيص المدار: ${result.state_label}` : result.title}
            </span>
            <span
              className="inline-flex items-center justify-center rounded-lg bg-teal-500/20 px-3 py-1 text-[9px] font-black text-teal-400 tracking-[0.2em] uppercase border border-teal-500/30 shadow-inner"
              title="نسخة ثابتة"
            >
              SNAPSHOT
            </span>
          </h2>
          {isEmotionalPrisoner && (
            <p className="mb-8 text-base text-slate-300 leading-relaxed text-center font-medium max-w-2xl mx-auto opacity-90">
              جسمك حر.. بس عقلك لسه متعلق. أنت دلوقتي مش في نفس المكان، لكن التفكير لسه ماسكك. بتصحى وتنام وأنت {singularReferenceText} في خيالك وبتدافع عن نفسك في محاكمات جوه دماغك.
            </p>
          )}
          <div className="flex flex-col items-center gap-5 text-center relative z-10">
            {isEmotionalPrisoner ? (
              <p className="text-xs font-black text-amber-400 uppercase tracking-[0.15em] bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
                التركيز الآن: <span className="text-white ml-1">{result.goal_label}</span>
              </p>
            ) : (
              <p className="text-xs font-black text-teal-400 uppercase tracking-[0.15em] bg-teal-400/10 px-4 py-1.5 rounded-full border border-teal-400/20">
                الحالة: <span className="text-white ml-1">{result.state_label}</span>
              </p>
            )}
            <p className="max-w-xl text-base text-slate-400 leading-relaxed font-medium italic opacity-80 border-r-2 border-white/10 pr-6 py-2">
              "{shortPromiseBody}"
            </p>
            <div className="mt-6 px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-base font-black text-white shadow-2xl backdrop-blur-md">
              <span className="opacity-50 text-xs uppercase tracking-widest ml-2">{result.mission_label}</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-teal-400">{result.mission_goal}</span>
            </div>
          </div>
        </div>

        
</>
)}
{activeTab === "tools" && isEmotionalPrisoner && !summaryOnly && (
          <div className="rounded-3xl bg-slate-900/40 border border-white/10 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-700" />
             <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                   <ShieldAlert className="w-9 h-9 text-indigo-400" />
                </div>
                <div className="text-right">
                  <h4 className="text-xl font-black text-white">أعراض بتحصل معاك مع {displayName}؟</h4>
                  <p className="text-sm text-slate-400 font-medium mt-1">اختار كل اللي ينطبق عليك للوصول لأدق خطة تعافي</p>
                </div>
             </div>
            <SymptomsChecklist
              ring={activeRing}
              personLabel={displayName}
              selectedSymptoms={addedNode?.analysis?.selectedSymptoms ?? []}
              onSymptomsChange={(ids) => addedNode && updateNodeSymptoms(addedNode.id, ids)}
            />
          </div>
        )}

        {activeTab === "roadmap" && addedNode && (
          <div className="mb-6">
            <RecoveryRoadmap
              personLabel={displayName}
              hasAnalysis={Boolean(score > 0 || feelingAnswers || addedNode.analysis)}
              hasSelectedSymptoms={Boolean(addedNode.analysis?.selectedSymptoms && addedNode.analysis.selectedSymptoms.length > 0)}
              hasWrittenSituations={Boolean(addedNode.recoveryProgress?.situationLogs && addedNode.recoveryProgress.situationLogs.length > 0)}
              hasCompletedTraining={addedNode.hasCompletedTraining}
              completedRecoverySteps={addedNode.recoveryProgress?.completedSteps?.length ?? 0}
              totalRecoverySteps={totalSteps}
              journeyStartDate={addedNode.journeyStartDate}
            />
          </div>
        )}

        {activeTab === "roadmap" && addedNode && (
          <div className="mb-6">
            <SuggestedPlacement
              currentRing={activeRing}
              personLabel={displayName}
              category={category}
              selectedSymptoms={addedNode.analysis?.selectedSymptoms}
            />
          </div>
        )}

        {activeTab === "roadmap" && addedNode && (addedNode.analysis?.selectedSymptoms?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-linear-to-br from-teal-600/80 to-cyan-700/80 backdrop-blur-2xl border border-teal-400/30 shadow-[0_20px_50px_-15px_rgba(20,184,166,0.3)] relative overflow-hidden"
          >
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute -top-10 -left-10 w-40 h-40 bg-white blur-[60px] rounded-full" 
            />
            
            <div className="flex items-center gap-5 mb-6 relative z-10 text-right">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                <Target className="w-9 h-9 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-white">تدريب المواجهة المخصص</h4>
                <p className="text-sm text-teal-100/80 font-medium">خطوات عملية لمواجهة {displayName} بناءً على أعراضك</p>
              </div>
            </div>
            
            <p className="text-base leading-relaxed mb-8 text-teal-50 font-medium text-right relative z-10">
              هنحطك في مواقف حقيقية ونشوف هتتعامل إزاي. التدريب ده هو اللي هيبني "عضلة الحدود" عشان تقدر تحمي نفسك في الواقع.
            </p>
            
            <button
              onClick={() => setShowTraining(true)}
              data-variant="primary"
              data-size="lg"
              className="ds-button w-full relative z-10"
            >
              ابدأ التدريب الآن
              <Sparkles className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {activeTab === "diagnosis" && summaryOnly && sovereigntySnapshot && (
          <SovereigntySnapshotCard snapshot={sovereigntySnapshot} />
        )}
        {activeTab === "diagnosis" && summaryOnly && pressureSentence && (
          <PressureSentenceCard snapshot={pressureSentence} />
        )}
        {activeTab === "diagnosis" && summaryOnly && boundaryEvidence && (
          <BoundaryEvidenceCard evidence={boundaryEvidence} />
        )}
        {activeTab === "tools" && summaryOnly && generationalEcho && (
          <div className="p-1 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <GenerationalEchoCard
              snapshot={generationalEcho}
              onOpenRecoveryPath={handleOpenTraumaRecoveryPath}
            />
          </div>
        )}

        {!summaryOnly && (
          <>
            {activeTab === "diagnosis" && (<>
            <div className="p-8 rounded-3xl bg-blue-950/20 border border-blue-500/20 backdrop-blur-xl text-right mb-8 shadow-2xl transition-all hover:bg-blue-950/30">
              <h3 className="text-lg font-black text-blue-300 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-xl">🔍</span> 
                {result.understanding_title}
              </h3>
              <p className="text-base text-slate-300 leading-relaxed font-medium">
                {result.understanding_body}
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-violet-950/20 border border-violet-500/20 backdrop-blur-xl text-right mb-8 shadow-2xl transition-all hover:bg-violet-950/30">
              <h3 className="text-lg font-black text-violet-300 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-xl">✨</span>
                {result.explanation_title}
              </h3>
              <p className="text-base text-slate-300 leading-relaxed font-medium">{result.explanation_body}</p>
            </div>

            </>)}
            {activeTab === "tools" && (<>
            <div className="p-8 rounded-3xl bg-amber-950/10 border border-amber-500/20 backdrop-blur-xl text-right mb-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-all duration-700" />
              <h3 className="text-xl font-black text-amber-400 mb-6 flex items-center gap-4 relative z-10">
                <span className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl shadow-inner border border-amber-500/30">🎒</span> 
                أدواتك المطلوبة
              </h3>
              <ul className="space-y-4 text-base text-slate-200 relative z-10">
                {result.requirements.map((item, index) => {
                  const isReality = item.title.includes("ملف القضية") || item.title.includes("قائمة الواقع");
                  const isDopamine = item.title.includes("بديل الدوبامين");
                  return (
                    <li key={`${item.title}-${index}`} className="group rounded-2xl bg-white/[0.02] px-6 py-5 border border-white/5 flex items-start justify-between gap-5 transition-all hover:bg-white/[0.05] hover:border-white/10">
                      <span className="font-medium leading-relaxed">
                        <span className="font-black text-amber-400 block mb-1.5 text-lg">{item.title}</span>{" "}
                        <span className="opacity-80">{item.detail}</span>
                      </span>
                      {(isReality || isDopamine) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isReality) setShowRealityPopup((v) => !v);
                            else setShowDopaminePopup((v) => !v);
                          }}
                          className="shrink-0 rounded-xl p-2.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all border border-amber-500/20 shadow-lg active:scale-90"
                          title={isReality ? "قائمة الواقع" : "بديل الدوبامين"}
                        >
                          <Info className="w-6 h-6" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {showRealityPopup && (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/40 backdrop-blur-2xl p-6 text-right text-base text-amber-100 shadow-2xl relative z-20">
                  <p className="font-black text-amber-300 mb-3 text-lg">قائمة الواقع (ملف القضية الحقيقي)</p>
                  {detachmentReasons && detachmentReasons.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2 font-medium">
                      {detachmentReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-medium leading-relaxed opacity-90">ورقة مكتوب فيها «ليه بعدت عنهم؟» — تكتبها في خطة التعافي (مرساة الواقع) وتقرأها وقت الضعف لتثبيت عقلك.</p>
                  )}
                  <button type="button" onClick={() => setShowRealityPopup(false)} className="mt-4 text-sm font-black text-amber-400 hover:text-amber-300 underline underline-offset-4">إغلاق التلميح</button>
                </div>
              )}
              {showDopaminePopup && (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/40 backdrop-blur-2xl p-6 text-right text-base text-amber-100 shadow-2xl relative z-20">
                  <p className="font-black text-amber-300 mb-3 text-lg">بديل الدوبامين</p>
                  <p className="font-medium leading-relaxed opacity-90">نشاط ممتع جاهز فوراً لما الفكرة تهاجمك — مثلاً: مشي، مكالمة صديق، لعبة، أو أي شيء يخلّيك تركز في الحاضر وتكسر حلقة التفكير.</p>
                  <button type="button" onClick={() => setShowDopaminePopup(false)} className="mt-4 text-sm font-black text-amber-400 hover:text-amber-300 underline underline-offset-4">إغلاق التلميح</button>
                </div>
              )}
            </div>

            </>)}
            {activeTab === "roadmap" && (<>
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all hover:bg-white/[0.04]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none" />
              <div className="flex flex-col gap-2 text-right">
                <span className="text-xl font-black text-white">لو جاهز، ابدأ خطوتك</span>
                <span className="text-sm text-slate-400 font-medium">تقدر تتابع التنفيذ والخطوات في شاشة مستقلة مخصصة.</span>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  data-variant={isMissionCompleted ? "secondary" : "primary"}
                  data-size="lg"
                  disabled={!addedNodeId}
                  onClick={() => {
                    if (!addedNodeId) return;
                    if (!isMissionStarted) startMission(addedNodeId);
                    onOpenMission?.(addedNodeId);
                  }}
                  className="ds-button w-full sm:w-auto px-10"
                >
                  {missionButtonLabel}
                </button>
                {!isMissionCompleted && isMissionStarted ? (
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-black text-emerald-400 tracking-widest uppercase">
                      التقدم: {completedSteps}/{totalSteps}
                    </span>
                    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                          className="h-full bg-emerald-400" 
                          initial={{ width: 0 }}
                          animate={{ width: `${(completedSteps/totalSteps)*100}%` }}
                       />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/20 backdrop-blur-xl text-right mb-8 shadow-2xl transition-all hover:bg-emerald-950/30">
              <h3 className="text-lg font-black text-emerald-300 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl">🗺️</span> 
                خطة الخطوة الأولى
              </h3>
              <ol className="space-y-4 text-base text-slate-200">
                {result.steps.map((step, index) => (
                  <li key={`${step}-${index}`} className="flex items-center gap-4 group">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-black text-emerald-400 group-hover:bg-emerald-500/40 transition-colors">
                       {index + 1}
                    </span>
                    <span className="font-medium text-slate-300 group-hover:text-white transition-colors">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            </>)}
            {activeTab === "tools" && (<>
            <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/20 backdrop-blur-xl text-right mb-8 shadow-2xl relative overflow-hidden transition-all hover:bg-rose-950/30">
               <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-500/5 blur-3xl" />
              <h3 className="text-lg font-black text-rose-300 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-xl">⚠️</span> 
                التحديات المتوقعة
              </h3>
              <ul className="space-y-4">
                {normalizedObstacles.map((item, index) => {
                  const solutionHasReality = item.solution.includes("ملف القضية الحقيقي") || item.solution.includes("قائمة الواقع");
                  return (
                    <li key={`${item.title}-${index}`} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 transition-colors hover:bg-white/[0.05]">
                      <span className="font-black text-rose-400 block mb-2">{item.title}:</span>{" "}
                      <span className="text-base text-slate-300 font-medium leading-relaxed">
                        {solutionHasReality ? (
                          <>
                            {item.solution.includes("ملف القضية الحقيقي")
                              ? (() => {
                                const [before, after] = item.solution.split("ملف القضية الحقيقي");
                                return (
                                  <>
                                    {before}
                                    <button
                                      type="button"
                                      onClick={() => setShowRealityPopup((v) => !v)}
                                      className="text-rose-400 font-black border-b border-rose-400/30 hover:text-rose-300 transition-colors"
                                    >
                                      ملف القضية الحقيقي
                                    </button>
                                    {after}
                                  </>
                                );
                              })()
                              : (() => {
                                const [before, after] = item.solution.split("قائمة الواقع");
                                return (
                                  <>
                                    {before}
                                    <button
                                      type="button"
                                      onClick={() => setShowRealityPopup((v) => !v)}
                                      className="text-rose-400 font-black border-b border-rose-400/30 hover:text-rose-300 transition-colors"
                                    >
                                      قائمة الواقع
                                    </button>
                                    {after}
                                  </>
                                );
                              })()}
                          </>
                        ) : (
                          item.solution
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            </>)}
            {activeTab === "diagnosis" && (<>
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl text-right mb-8 shadow-2xl relative overflow-hidden group transition-all hover:bg-white/[0.04]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />
              <h3 className="text-lg font-black text-indigo-300 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xl">🎯</span> 
                {result.suggested_zone_title}
              </h3>
              <p className="text-xl font-black text-white mb-3 tracking-tight">{result.suggested_zone_label}</p>
              <p className="text-base text-slate-400 font-medium leading-relaxed mb-6">
                {result.suggested_zone_body}
              </p>
              <button
                onClick={() => setShowScripts(true)}
                className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all shadow-xl backdrop-blur-md active:scale-[0.98]"
              >
                <BookOpen className="w-6 h-6 text-indigo-400" />
                الموسوعة: جمل جاهزة للرد على {displayName}
              </button>
            </div>
            </>)}
          </>
        )}

      {summaryOnly && onClose && (
        <div className="flex flex-col gap-3">
          {!isForcedCtaMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => void handleShareResult()}
                  data-variant="ghost"
                  data-size="md"
                  className="ds-button w-full"
                >
                  مشاركة النتيجة
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadShareImage()}
                  data-variant="ghost"
                  data-size="md"
                  disabled={shareBusy}
                  className="ds-button w-full"
                >
                  {shareBusy ? "جارٍ تجهيز الصورة..." : "تحميل صورة النتيجة"}
                </button>
            </div>
          )}
          {shareStatus && (
            <p className="text-xs text-slate-400 text-center font-medium">{shareStatus}</p>
          )}
          {ctaStatus && (
            <p className="text-xs text-amber-400 text-center font-black">{ctaStatus}</p>
          )}
          {shouldShowMapSyncBanner && (
            <p className="text-xs text-amber-400 text-center font-black">{mapSyncBannerText}</p>
          )}
          {isEmergency && (
            <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-6 text-right mb-4 backdrop-blur-xl overflow-hidden relative shadow-2xl">
               <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl" />
              <p className="text-lg font-black text-rose-300 mb-2 relative z-10">سلامتك أولاً</p>
              <p className="text-sm text-slate-300 leading-relaxed mb-4 relative z-10">
                الشخص اتضاف في المدار الأحمر. لو محتاج تتكلم مع حد الآن:
              </p>
              {emergencyCopy.supportLines.length > 0 && (
                <ul className="space-y-3 mb-6 relative z-10">
                  {emergencyCopy.supportLines.map((line) => (
                    <li key={line.phone} className="flex items-center justify-end gap-3 rounded-xl bg-white/5 py-3 px-4 border border-white/5">
                      <a
                        href={`tel:${line.phone}`}
                        className="text-rose-400 font-black hover:text-rose-300 underline underline-offset-4"
                      >
                        {line.phone}
                      </a>
                      <span className="text-slate-300 text-xs font-bold">{line.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              {onOpenEmergency && (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.EMERGENCY_OPENED, { source: "result_screen" });
                    onOpenEmergency();
                  }}
                  className="w-full rounded-2xl bg-rose-600 text-white px-6 py-4 text-base font-black hover:bg-rose-500 active:scale-[0.98] transition-all shadow-xl shadow-rose-950/40 relative z-10"
                >
                  غرفة الطوارئ — تنفس ودعم
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            data-variant="primary"
            data-size="lg"
            onClick={() => {
              if (!addedNodeId) {
                recordFlowEvent("add_person_start_path_blocked_missing_node", {
                  meta: { reason: "missing_added_node_id" }
                });
                setCtaStatus("جاري تحضير البيانات...");
                return;
              }
              setCtaStatus(null);
              recordFlowEvent("add_person_start_path_clicked", { meta: { nodeId: addedNodeId } });
              startMissionAndTrack(addedNodeId);
              onOpenMission?.(addedNodeId);
              onClose();
            }}
            className="ds-button w-full"
          >
            افتح رحلة {displayName}
          </button>
          {isForcedCtaMode ? (
            <p className="text-xs text-slate-500 text-center mt-2 font-black tracking-widest uppercase">
              الخطوة التالية الإلزامية: ابدأ المسار الآن.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onClose(addedNodeId)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-black text-slate-300 hover:bg-white/10 hover:text-white transition-all shadow-xl active:scale-[0.98]"
            >
              ضيف على الخريطة
            </button>
          )}
        </div>
      )}

      {showTraining && addedNode && (
        <PersonalizedTraining
          personLabel={displayName}
          selectedSymptoms={addedNode.analysis?.selectedSymptoms ?? []}
          ring={activeRing}
          goalId={addedNode.goalId ?? "unknown"}
          onClose={() => setShowTraining(false)}
          onComplete={() => {
            setShowTraining(false);
          }}
        />
      )}

      {showScripts && addedNode && (
        <BoundaryScriptsLibrary
          isOpen={showScripts}
          onClose={() => setShowScripts(false)}
          ring={activeRing as AdviceZone}
          category={category}
          personLabel={displayName}
        />
      )}
      </motion.div>
    </div>
  );
};
