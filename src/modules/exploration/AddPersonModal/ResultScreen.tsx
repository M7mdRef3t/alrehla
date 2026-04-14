import type { FC } from "react";
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Info, Target, BookOpen, Sparkles, ShieldAlert, Share2, Download } from "lucide-react";
import type { FeelingAnswers } from "../FeelingCheck";
import type { RealityAnswers } from "../RealityCheck";
import type { QuickAnswer2 } from "@/utils/suggestInitialRing";
import type { PersonGender } from "@/utils/resultScreenAI";
import { buildResultTemplateFromAnswers } from "@/utils/resultScreenTemplates";
import { realityScoreToRing } from "@/utils/realityScore";
import { useMapState } from '@/modules/map/dawayirIndex';
import { trackEvent, AnalyticsEvents } from "@/services/analytics";
import type { AdviceCategory } from "@/data/adviceScripts";
import type { AdviceZone } from "@/data/adviceScripts";
import { emergencyCopy } from "@/copy/emergency";
import { recordFlowEvent, recordPathStartedOnce } from "@/services/journeyTracking";
import { useSyncState } from "@/domains/journey/store/sync.store";
import { isUserMode } from "@/config/appEnv";
import { SovereigntySnapshotCard } from "../SovereigntySnapshotCard";
import { deriveSovereigntySnapshot } from "@/utils/sovereigntySnapshot";
import { BoundaryEvidenceCard } from "../BoundaryEvidenceCard";
import { deriveBoundaryEvidence } from "@/utils/boundaryEvidence";
import { PressureSentenceCard } from "../PressureSentenceCard";
import { derivePressureSentence } from "@/utils/pressureSentence";
import { GenerationalEchoCard } from "../GenerationalEchoCard";
import { RecoveryRoadmap } from "../../action/RecoveryRoadmap";

import { SuggestedPlacement } from "../SuggestedPlacement";
import { deriveGenerationalEcho } from "@/utils/generationalEcho";
import { PersonalizedTraining } from "../PersonalizedTraining";
import { SymptomsChecklist } from "../SymptomsChecklist";
import { BoundaryScriptsLibrary } from "../../growth/BoundaryScriptsLibrary";


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
    personGender,
    category
  }), [score, feelingAnswers, realityAnswers, isEmergency, safetyAnswer, personGender, category]);
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
    ? "✅ أنجزت المهمة"
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
    addedNode ? derivePressureSentence({ 
      displayName, 
      ring: activeRing, 
      node: addedNode,
      scenarioKey: result.scenarioKey
    }) : null
  , [activeRing, addedNode, displayName, result.scenarioKey]);

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
  const mapSyncBannerText = "تعذر الحفظ السحابي مؤقتًا. هنحاول تلقائيًا عند العودة للرحلة.";

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

  // ==========================================
  // RENDER: DIAGNOSIS TAB
  // ==========================================
  const renderDiagnosisTab = () => (
    <div className="flex flex-col gap-10 w-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
      
      {/* Cinematic Verdict Section */}
      <div ref={shareCardRef} className="text-center relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col items-center"
        >
          {/* Sovereignty Gauge - High Fidelity */}
          <div className="relative w-64 h-32 mb-8 overflow-hidden">
             <svg className="w-full h-full transform" viewBox="0 0 100 50">
               {/* Background Arc */}
               <path 
                 d="M 10 50 A 40 40 0 0 1 90 50" 
                 fill="none" 
                 stroke="rgba(255,255,255,0.05)" 
                 strokeWidth="8" 
                 strokeLinecap="round"
               />
               {/* Filled Arc */}
               <motion.path 
                 initial={{ pathLength: 0 }}
                 animate={{ pathLength: result.sovereigntyScore / 100 }}
                 transition={{ duration: 2, ease: "easeOut" }}
                 d="M 10 50 A 40 40 0 0 1 90 50" 
                 fill="none" 
                 stroke={activeRing === "red" ? "var(--consciousness-critical)" : activeRing === "yellow" ? "var(--ds-color-accent-amber)" : "var(--consciousness-primary)"}
                 strokeWidth="8" 
                 strokeDasharray="100 100"
                 strokeLinecap="round"
                 style={{ filter: `drop-shadow(0 0 10px ${activeRing === "red" ? "rgba(244,63,94,0.4)" : "rgba(45,212,191,0.4)"})` }}
               />
             </svg>
             <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
                <motion.span 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="text-4xl font-black text-white"
                >
                  {result.sovereigntyScore}<span className="text-lg text-slate-500">%</span>
                </motion.span>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">مؤشر السيادة</span>
             </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="space-y-4"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black text-teal-400 tracking-[0.3em] uppercase">
              الخلاصة الاستراتيجية
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight px-4 blur-none">
              {isEmotionalPrisoner ? result.state_label : result.title}
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
              {result.goal_label}
            </p>
          </motion.div>
        </motion.div>

        {/* Tactical Narrative Card */}
        <motion.div 
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 1.2 }}
          className="relative group p-8 rounded-[3rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 backdrop-blur-2xl shadow-2xl mb-10 text-right"
        >
          <div 
            className="absolute -top-20 -right-20 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20"
            style={{ 
              background: `radial-gradient(circle, ${activeRing === "red" ? "var(--consciousness-critical)" : "var(--consciousness-primary)"}, transparent)` 
            }}
          />
          <p className="text-xl/relaxed text-slate-300 font-medium whitespace-pre-wrap relative z-10">
            {shortPromiseBody}
          </p>
          
          {isEmotionalPrisoner && (
            <div className="mt-6 p-5 rounded-2xl bg-rose-500/5 border-r-4 border-rose-500/30">
              <p className="text-sm text-slate-300 leading-relaxed font-bold italic opacity-90">
                "جسمك حُر.. لكن عقلك لسه متعلق بمحاكمات وهمية."
              </p>
            </div>
          )}
        </motion.div>

        {/* Global Mission Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 }}
          className="px-8 py-6 rounded-[2.5rem] bg-slate-900/40 border border-teal-500/20 relative overflow-hidden group mb-12 text-right shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
        >
          <div className="absolute top-0 right-0 w-1 bg-teal-500 h-full shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-end gap-2 mb-3">
             <span className="opacity-50">{result.mission_label}</span>
             <span>•</span>
             <span className="text-teal-400">الهدف الحالي</span>
          </span>
          <p className="text-2xl font-black text-white">{result.mission_goal}</p>
        </motion.div>
      </div>

      {/* High-Fidelity Tactical Instruments */}
      <div className="space-y-4">
        {pressureSentence && <PressureSentenceCard snapshot={pressureSentence} />}
        {sovereigntySnapshot && <SovereigntySnapshotCard snapshot={sovereigntySnapshot} />}
        {boundaryEvidence && <BoundaryEvidenceCard evidence={boundaryEvidence} />}
      </div>

      {!summaryOnly && (
        <div className="grid grid-cols-1 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="px-8 py-8 rounded-[3rem] bg-slate-950/40 border border-blue-500/10 text-right shadow-2xl backdrop-blur-md"
          >
            <h3 className="text-sm font-black text-blue-400 mb-4 flex items-center gap-2">
              <span className="text-xl">🔍</span> {result.understanding_title}
            </h3>
            <p className="text-base text-slate-300 leading-relaxed font-medium">{result.understanding_body}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2 }}
            className="px-8 py-8 rounded-[3rem] bg-slate-950/40 border border-violet-500/10 text-right shadow-2xl backdrop-blur-md"
          >
            <h3 className="text-sm font-black text-violet-400 mb-4 flex items-center gap-2">
              <span className="text-xl">✨</span> {result.explanation_title}
            </h3>
            <p className="text-base text-slate-300 leading-relaxed font-medium">{result.explanation_body}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4 }}
            className="px-8 py-8 rounded-[3rem] bg-[#020617]/90 border border-indigo-500/20 text-right shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[50px]" />
            <h3 className="text-sm font-black text-indigo-400 mb-2 flex items-center gap-2">
              <span className="text-xl">🎯</span> {result.suggested_zone_title}
            </h3>
            <p className="text-2xl font-black text-white mb-3">{result.suggested_zone_label}</p>
            <p className="text-base text-slate-400 font-medium leading-relaxed mb-8">{result.suggested_zone_body}</p>
            <button 
               onClick={() => setShowScripts(true)} 
               className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
            >
              <BookOpen className="w-5 h-5 text-indigo-400" />
              الموسوعة: جمل جاهزة للرد على {displayName}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );

  // ==========================================
  // RENDER: ROADMAP TAB
  // ==========================================
  const renderRoadmapTab = () => (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {addedNode && (
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
      )}
      {addedNode && (
        <SuggestedPlacement currentRing={activeRing} personLabel={displayName} category={category} selectedSymptoms={addedNode.analysis?.selectedSymptoms} />
      )}
      {addedNode && (addedNode.analysis?.selectedSymptoms?.length ?? 0) > 0 && (
        <div className="px-6 py-6 rounded-[2rem] bg-[var(--ds-color-primary-soft)] border border-[var(--ds-color-primary-glow)] flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-6">
          <div className="w-14 h-14 shrink-0 rounded-2xl bg-[var(--ds-color-primary-glow)] flex items-center justify-center border border-[var(--ds-color-primary-glow)]">
            <Target className="w-7 h-7 text-[var(--consciousness-primary)]" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-white mb-2">تدريب المواجهة المخصص</h4>
            <p className="text-sm text-slate-300 leading-relaxed font-medium mb-4">
              هنحطك في مواقف حقيقية ونشوف هتتعامل إزاي. التدريب ده هو اللي هيبني "عضلة الحدود" عشان تقدر تحمي نفسك في الواقع.
            </p>
            <button onClick={() => setShowTraining(true)} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--consciousness-primary)] text-[var(--ds-color-space-deep)] font-black text-sm hover:opacity-90 transition-opacity flex items-center justify-center sm:justify-start gap-2">
              ابدأ التدريب الآن <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

      )}

      {!summaryOnly && (
        <>
          <div className="px-6 py-6 rounded-[2rem] bg-slate-950/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-right">
            <div>
              <h4 className="text-base font-black text-white mb-1">لو جاهز، ابدأ خطوتك</h4>
              <p className="text-xs text-slate-400 font-medium">تقدر تتابع التنفيذ والخطوات في شاشة الخريطة المستقلة.</p>
            </div>
            <div className="flex flex-col w-full sm:w-auto gap-3">
              <button
                type="button"
                disabled={!addedNodeId}
                onClick={() => {
                  if (!addedNodeId) return;
                  if (!isMissionStarted) startMission(addedNodeId);
                  onOpenMission?.(addedNodeId);
                }}
                className={`px-8 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-colors ${isMissionCompleted ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-[var(--consciousness-primary)] text-[var(--ds-color-space-deep)] hover:opacity-90"}`}
              >
                {missionButtonLabel}
              </button>
              {!isMissionCompleted && isMissionStarted && (
                <div className="flex justify-center sm:justify-start items-center gap-2">
                  <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">التقدم: {completedSteps}/{totalSteps}</span>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-6 rounded-[2rem] bg-[#020617] border border-white/5 text-right">
            <h3 className="text-sm font-black text-emerald-400 mb-5 flex items-center gap-2">
              <span className="opacity-80">🗺️</span> خطة الخطوة الأولى
            </h3>
            <ol className="space-y-3">
              {result.steps.map((step, index) => (
                <li key={`${step}-${index}`} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <span className="shrink-0 w-6 h-6 mt-0.5 rounded-full bg-[var(--ds-color-primary-soft)] text-[10px] font-black text-[var(--consciousness-primary)] flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-300 font-medium leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );

  // ==========================================
  // RENDER: TOOLS TAB
  // ==========================================
  const renderToolsTab = () => (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {summaryOnly && generationalEcho && (
        <div className="p-1 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
          <GenerationalEchoCard snapshot={generationalEcho} onOpenRecoveryPath={handleOpenTraumaRecoveryPath} />
        </div>
      )}

      {isEmotionalPrisoner && !summaryOnly && (
        <div className="px-6 py-6 rounded-[2rem] bg-slate-950/40 border border-indigo-500/10 text-right">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-white mb-1">أعراض بتحصل معاك مع {displayName}؟</h4>
              <p className="text-xs text-slate-400 font-medium">اختار كل اللي ينطبق عليك للوصول لأدق خطة تعافي</p>
            </div>
          </div>
          <SymptomsChecklist ring={activeRing} personLabel={displayName} selectedSymptoms={addedNode?.analysis?.selectedSymptoms ?? []} onSymptomsChange={(ids) => addedNode && updateNodeSymptoms(addedNode.id, ids)} />
        </div>
      )}

      {!summaryOnly && (
        <>
          <div className="px-6 py-6 rounded-[2rem] bg-[#020617] border border-white/5 text-right">
            <h3 className="text-sm font-black text-amber-400 mb-5 flex items-center gap-2">
              <span className="opacity-80">🎒</span> أدواتك المطلوبة
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {result.requirements.map((item, index) => {
                const isReality = item.title.includes("ملف القضية") || item.title.includes("قائمة الواقع");
                const isDopamine = item.title.includes("بديل الدوبامين");
                return (
                  <li key={`${item.title}-${index}`} className="rounded-xl bg-white/[0.02] px-4 py-4 border border-white/5 flex items-start justify-between gap-4">
                    <span>
                      <span className="font-black text-white block mb-1 text-sm">{item.title}</span>{" "}
                      <span className="text-xs text-slate-400 font-medium leading-relaxed">{item.detail}</span>
                    </span>
                    {(isReality || isDopamine) && (
                      <button
                        type="button"
                        onClick={() => { if (isReality) setShowRealityPopup((v) => !v); else setShowDopaminePopup((v) => !v); }}
                        className="shrink-0 p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Info className="w-5 h-5" />
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
                    {detachmentReasons.map((r, i) => <li key={i}>{r}</li>)}
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

          <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/20 backdrop-blur-xl text-right shadow-2xl relative overflow-hidden transition-all hover:bg-rose-950/30">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-500/5 blur-3xl" />
            <h3 className="text-lg font-black text-[var(--consciousness-critical)] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--consciousness-critical)]/20 flex items-center justify-center text-xl">⚠️</span> 
              التحديات المتوقعة
            </h3>
            <ul className="space-y-4">
              {normalizedObstacles.map((item, index) => {
                const solutionHasReality = item.solution.includes("ملف القضية الحقيقي") || item.solution.includes("قائمة الواقع");
                return (
                  <li key={`${item.title}-${index}`} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 transition-colors hover:bg-white/[0.05]">
                    <span className="font-black text-[var(--consciousness-critical)] block mb-2">{item.title}:</span>{" "}
                    <span className="text-base text-slate-300 font-medium leading-relaxed">
                      {solutionHasReality ? (
                        <>
                          {item.solution.includes("ملف القضية الحقيقي") ? (
                            <>{item.solution.split("ملف القضية الحقيقي")[0]}<button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-400 font-black border-b border-rose-400/30 hover:text-rose-300 transition-colors">ملف القضية الحقيقي</button>{item.solution.split("ملف القضية الحقيقي")[1]}</>
                          ) : (
                            <>{item.solution.split("قائمة الواقع")[0]}<button type="button" onClick={() => setShowRealityPopup((v) => !v)} className="text-rose-400 font-black border-b border-rose-400/30 hover:text-rose-300 transition-colors">قائمة الواقع</button>{item.solution.split("قائمة الواقع")[1]}</>
                          )}
                        </>
                      ) : item.solution}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`w-full relative z-10 flex flex-col items-center justify-start px-4 ${summaryOnly ? "mt-8" : "py-12 md:py-20"}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(15px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl space-y-8 mx-auto"
      >
        {/* Section 1: The Diagnostic Verdict */}
        <div id="diagnosis" className="space-y-8">
          {renderDiagnosisTab()}
        </div>

        {/* Section 2: Roadmap & Action */}
        {!summaryOnly && (
          <div id="roadmap" className="space-y-10 pt-8 border-t border-white/5">
            <div className="text-right">
              <h3 className="text-2xl font-black text-white mb-2">🎯 طريقك للتعافي</h3>
              <p className="text-sm text-slate-500 font-medium tracking-wide">خطوات عملية لفك الارتباط واستعادة توازنك</p>
            </div>
            {renderRoadmapTab()}
          </div>
        )}

        {/* Section 3: Tools & Symptoms */}
        {!summaryOnly && (
          <div id="tools" className="space-y-10 pt-8 border-t border-white/5">
            <div className="text-right">
              <h3 className="text-2xl font-black text-white mb-2">🎒 حقيبة الرحلة</h3>
              <p className="text-sm text-slate-500 font-medium tracking-wide">أدوات مساعدة وأعراض محتملة للتعامل الواعي</p>
            </div>
            {renderToolsTab()}
          </div>
        )}

        {/* Sticky Command Bar */}
        <div className="sticky bottom-4 left-0 right-0 z-50 mt-12 p-3 rounded-[2rem] bg-[#020617]/80 backdrop-blur-3xl border border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-3">
          
          {isEmergency && (
            <div className="rounded-[1.5rem] border border-rose-500/40 bg-rose-950/40 p-5 text-right relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-1 items-center sm:items-start text-center sm:text-right">
                <p className="text-lg font-black text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[var(--consciousness-critical)]" />
                  سلامتك أولاً (مسار طوارئ)
                </p>
                <p className="text-xs text-rose-200/80 font-bold max-w-sm">
                  هذا الكيان يشكل خطراً مباشراً على استقرارك. استعن بغرفة الطوارئ أو خطوط الدعم.
                </p>
              </div>
              {onOpenEmergency && (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.EMERGENCY_OPENED, { source: "result_screen" });
                    onOpenEmergency();
                  }}
                  className="w-full sm:w-auto shrink-0 rounded-xl bg-[var(--consciousness-critical)] text-white px-6 py-3 text-sm font-black hover:opacity-90 active:scale-95 transition-all shadow-[0_10px_30px_rgba(244,63,94,0.3)] relative z-10"
                >
                  افتح غرفة الطوارئ
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                if (!addedNodeId) {
                  recordFlowEvent("add_person_start_path_blocked_missing_node", { meta: { reason: "missing_added_node_id" } });
                  setCtaStatus("جاري تحضير البيانات...");
                  return;
                }
                setCtaStatus(null);
                recordFlowEvent("add_person_start_path_clicked", { meta: { nodeId: addedNodeId } });
                startMissionAndTrack(addedNodeId);
                onOpenMission?.(addedNodeId);
                onClose?.();
              }}
              className="flex-1 rounded-2xl bg-[var(--consciousness-primary)] text-[var(--ds-color-space-deep)] px-6 py-4 sm:py-5 text-lg font-black hover:opacity-90 hover:shadow-[0_0_30px_var(--ds-color-primary-glow)] active:scale-95 transition-all shadow-[0_10px_30px_rgba(45,212,191,0.2)] tracking-widest uppercase relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isEmergency ? `🛡️ ابدأ حماية نفسك من ${displayName}` : `🚀 ابدأ مسار التغيير مع ${displayName}`}
                {ctaStatus && <span className="text-xs font-medium opacity-80">({ctaStatus})</span>}
              </span>
            </button>

            {!isForcedCtaMode && (
              <button
                type="button"
                onClick={() => onClose?.(addedNodeId)}
                className="w-full sm:w-48 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:py-5 text-sm font-black text-slate-300 hover:bg-white/10 hover:text-white active:scale-95 transition-all uppercase tracking-widest"
              >
                رجوع للخريطة
              </button>
            )}
            {isForcedCtaMode && (
              <div className="hidden sm:flex w-48 shrink-0 items-center justify-center border border-white/5 rounded-2xl bg-black/20">
                 <p className="text-[9px] text-slate-600 text-center font-black tracking-[0.2em] uppercase">مسار_إلزامي</p>
              </div>
            )}
          </div>
        </div>

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


