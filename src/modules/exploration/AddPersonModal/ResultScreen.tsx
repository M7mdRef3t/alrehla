import type { FC } from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert } from "lucide-react";
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
import { recordFlowEvent, recordPathStartedOnce } from "@/services/journeyTracking";
import { useSyncState } from "@/domains/journey/store/sync.store";
import { isUserMode } from "@/config/appEnv";
import { PersonalizedTraining } from "../PersonalizedTraining";
import { BoundaryScriptsLibrary } from "../../growth/BoundaryScriptsLibrary";

// Sub-components
import { DiagnosisSection } from "./DiagnosisSection";
import { RoadmapSection } from "./RoadmapSection";
import { ToolsSection } from "./ToolsSection";
import { MirrorQuestions } from "./MirrorQuestions";
import { ScienceBehindFeeling } from "./ScienceBehindFeeling";

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

  // ═══ Fire node_classified event — feeds IllusionRadar ═══
  useEffect(() => {
    if (!result?.scenarioKey) return;
    const ring = realityAnswers ? realityScoreToRing(realityAnswers) : "green";
    const isEmotionalCaptivity = result.scenarioKey === "emotional_prisoner";
    const scenarioLabel = isEmotionalCaptivity
      ? "سجين ذهني"
      : ring === "red" && result.scenarioKey === "emergency"
      ? "طوارئ"
      : ring === "red"
      ? "طوارئ"
      : ring === "yellow"
      ? "استنزاف نشط"
      : "ميناء آمن";
    recordFlowEvent("node_classified", {
      meta: {
        scenarioLabel,
        scenarioKey: result.scenarioKey,
        ring,
        isEmotionalCaptivity,
        nodeId: addedNodeId,
        category,
        classifiedAt: Date.now()
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.scenarioKey]); // fire once per unique result

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

  // Derive imports from parent/utils
  const { deriveCommandSnapshot } = require("@/utils/commandSnapshot");
  const { deriveBoundaryEvidence } = require("@/utils/boundaryEvidence");
  const { derivePressureSentence } = require("@/utils/pressureSentence");
  const { deriveGenerationalEcho } = require("@/utils/generationalEcho");

  const commandSnapshot = useMemo(() => deriveCommandSnapshot({
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

  // ═══ Relationship Verdict Logic ═══
  // Context-aware: family/close bonds ≠ cut. They need boundaries, not severing.
  const isFamilyRelation = category === "family" || ["الأب", "الأم", "الأخ", "الأخت", "الابن", "الابنة", "الزوج", "الزوجة", "الجد", "الجدة", "العم", "الخال", "العائلة"].some(
    t => personTitle?.includes(t)
  );

  const relationshipVerdict = useMemo(() => {
    if (isEmergency || result.scenarioKey === "emergency") {
      // Family emergency → NOT cutting, but clear truth about the rescuer burden
      if (isFamilyRelation) {
        return {
          action: "protect" as const,
          emoji: "🪞",
          label: "توقف عن الإنقاذ — احمِ نفسك",
          description: `${displayName} من عائلتك — لكن حبك ليه مش معناه إنك تشيل نتيجة أفعاله. أنت مش مسؤول عن إنقاذه. حماية نفسك من الاستنزاف هي أول خطوة حقيقية — ليك وليه.`,
          color: "amber",
          bgClass: "bg-amber-950 border-amber-500/50",
          textClass: "text-amber-300"
        };
      }
      return {
        action: "cut" as const,
        emoji: "🚫",
        label: "قطع فوري",
        description: `${displayName} يمثل خطراً حقيقياً على سلامتك. الخطوة الأولى هي حماية نفسك بالابتعاد الكامل.`,
        color: "rose",
        bgClass: "bg-rose-950 border-rose-500/50",
        textClass: "text-rose-300"
      };
    }
    if (result.scenarioKey === "active_battlefield" || activeRing === "red") {
      if (isFamilyRelation) {
        return {
          action: "safe_distance" as const,
          emoji: "🏠",
          label: "مسافة آمنة",
          description: `علاقتك مع ${displayName} مستنزفة، لكنه من عائلتك. الحل: مسافة مؤقتة + حدود واضحة — مش قطيعة. احمِ نفسك الأول ثم ارجع بشروطك.`,
          color: "amber",
          bgClass: "bg-amber-950/80 border-amber-500/40",
          textClass: "text-amber-300"
        };
      }
      return {
        action: "distance" as const,
        emoji: "🛡️",
        label: "ابتعاد تدريجي",
        description: `علاقتك مع ${displayName} مستنزفة. الحل: تقليل التواصل وبناء حدود واضحة حتى تستعيد توازنك.`,
        color: "amber",
        bgClass: "bg-amber-950/80 border-amber-500/40",
        textClass: "text-amber-300"
      };
    }
    if (result.scenarioKey === "emotional_prisoner") {
      return {
        action: "distance" as const,
        emoji: "⛓️‍💥",
        label: isFamilyRelation ? "فك التعلق مع حفظ الرابط" : "فك الارتباط العقلي",
        description: isFamilyRelation
          ? `عقلك متعلق بـ${displayName} بشكل مؤلم. الأولوية: كسر دورة التفكير — مش كسر العلاقة. اهتم بنفسك الأول.`
          : `جسمك حر لكن عقلك لسه متعلق بـ${displayName}. الأولوية: كسر دورة التفكير المتكرر.`,
        color: "amber",
        bgClass: "bg-amber-950/80 border-amber-500/40",
        textClass: "text-amber-300"
      };
    }
    if (result.scenarioKey === "eggshells" || activeRing === "yellow") {
      return {
        action: "negotiate" as const,
        emoji: "⚖️",
        label: "إعادة تفاوض",
        description: `العلاقة مع ${displayName} فيها احتكاك. ممكن تتحسن بحدود واضحة وتواصل مدروس.`,
        color: "sky",
        bgClass: "bg-sky-950/80 border-sky-500/40",
        textClass: "text-sky-300"
      };
    }
    return {
      action: "maintain" as const,
      emoji: "✅",
      label: "علاقة صحية",
      description: `${displayName} مصدر دعم في حياتك. حافظ على التوازن وراقب أي تغيرات.`,
      color: "emerald",
      bgClass: "bg-emerald-950/80 border-emerald-500/40",
      textClass: "text-emerald-300"
    };
  }, [isEmergency, result.scenarioKey, activeRing, displayName, isFamilyRelation]);

  // Progressive Disclosure state
  const [showDetails, setShowDetails] = useState(false);
  // Emergency Fast-Track: minimal UI
  const isEmergencyFastTrack = isEmergency === true;

  return (
    <div className={`w-full relative z-10 flex flex-col items-center justify-start px-4 pb-28 ${summaryOnly ? "mt-8" : "py-12 md:py-20"}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30, filter: "blur(15px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl space-y-12 mx-auto"
      >
        {/* Section 1: The Diagnostic Verdict */}
        <div id="diagnosis" className="space-y-10">
          <DiagnosisSection 
            shareCardRef={shareCardRef}
            result={result}
            activeRing={activeRing as any}
            isEmotionalPrisoner={isEmotionalPrisoner}
            shortPromiseBody={shortPromiseBody}
            displayName={displayName}
            pressureSentence={pressureSentence}
            commandSnapshot={commandSnapshot}
            boundaryEvidence={boundaryEvidence}
            summaryOnly={summaryOnly}
            onShowScripts={() => setShowScripts(true)}
          />
        </div>

        {/* ═══ Relationship Verdict Banner ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`relative p-6 sm:p-8 rounded-2xl border ${relationshipVerdict.bgClass} overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-20 pointer-events-none" 
            style={{ background: relationshipVerdict.color === "rose" ? "#f43f5e" : relationshipVerdict.color === "amber" ? "#f59e0b" : relationshipVerdict.color === "sky" ? "#0ea5e9" : "#10b981" }} 
          />
          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
            <div className="text-4xl shrink-0">{relationshipVerdict.emoji}</div>
            <div className="flex-1 text-right">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${relationshipVerdict.textClass}`}>
                  حكم الرحلة
                </span>
              </div>
              <h3 className={`text-2xl sm:text-3xl font-black ${relationshipVerdict.textClass} mb-2`}>
                {relationshipVerdict.label}
              </h3>
              <p className="text-base text-slate-300 leading-relaxed font-medium">
                {relationshipVerdict.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══ Mirror Questions — أسئلة المرآة ═══ */}
        <MirrorQuestions 
          verdictAction={relationshipVerdict.action}
          isFamilyRelation={isFamilyRelation}
          displayName={displayName}
        />

        {/* ═══ Science Behind Feeling — ليه بتحس كده ═══ */}
        <ScienceBehindFeeling
          verdictAction={relationshipVerdict.action}
          isFamilyRelation={isFamilyRelation}
          displayName={displayName}
        />

        {/* ═══ Emergency Fast-Track: Skip details ═══ */}
        {isEmergencyFastTrack && !showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="text-sm text-slate-500 hover:text-slate-300 font-bold font-tajawal underline underline-offset-4 decoration-slate-700 hover:decoration-slate-400 transition-all"
            >
              عرض التفاصيل الكاملة (الخطة + الأدوات) ↓
            </button>
          </motion.div>
        )}

        {/* Section 2: Roadmap & Action — Progressive Disclosure */}
        {!summaryOnly && (!isEmergencyFastTrack || showDetails) && (
          <div id="roadmap" className="space-y-10 pt-8 border-t border-[var(--page-border-soft)]">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="w-full text-right group"
            >
              <div className="flex items-center justify-between">
                <motion.span 
                  animate={{ rotate: showDetails ? 180 : 0 }}
                  className="text-slate-500 text-lg"
                >↓</motion.span>
                <div>
                  <h3 className="text-2xl font-black text-white mb-1 group-hover:text-teal-300 transition-colors">🎯 طريقك للتعافي</h3>
                  <p className="text-sm text-slate-400 font-medium tracking-wide">خطوات عملية لفك الارتباط واستعادة توازنك</p>
                </div>
              </div>
            </button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <RoadmapSection 
                    addedNode={addedNode}
                    displayName={displayName}
                    score={score}
                    feelingAnswers={feelingAnswers}
                    totalSteps={totalSteps}
                    activeRing={activeRing as any}
                    category={category}
                    summaryOnly={summaryOnly}
                    isMissionStarted={isMissionStarted}
                    isMissionCompleted={isMissionCompleted}
                    missionButtonLabel={missionButtonLabel}
                    completedSteps={completedSteps}
                    result={result}
                    onStartMission={startMission}
                    onOpenMission={onOpenMission!}
                    onShowTraining={() => setShowTraining(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Section 3: Tools & Symptoms — Progressive Disclosure */}
        {!summaryOnly && (!isEmergencyFastTrack || showDetails) && (
          <div id="tools" className="space-y-10 pt-8 border-t border-[var(--page-border-soft)]">
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-right mb-6">
                  <h3 className="text-2xl font-black text-white mb-2">🎒 حقيبة الرحلة</h3>
                  <p className="text-sm text-slate-400 font-medium tracking-wide">أدوات مساعدة وأعراض محتملة للتعامل الواعي</p>
                </div>
                <ToolsSection 
                  summaryOnly={summaryOnly}
                  generationalEcho={generationalEcho}
                  displayName={displayName}
                  isEmotionalPrisoner={isEmotionalPrisoner}
                  activeRing={activeRing as any}
                  addedNode={addedNode}
                  updateNodeSymptoms={updateNodeSymptoms}
                  result={result}
                  normalizedObstacles={normalizedObstacles}
                  detachmentReasons={detachmentReasons}
                  onOpenTraumaRecoveryPath={handleOpenTraumaRecoveryPath}
                />
              </motion.div>
            )}
            {!showDetails && !isEmergencyFastTrack && (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="w-full py-4 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all font-tajawal"
              >
                🎒 عرض حقيبة الأدوات والأعراض ↓
              </button>
            )}
          </div>
        )}

        {/* Sticky Command Bar */}
        <div className="sticky bottom-0 left-0 right-0 z-50 mt-16 p-4 rounded-2xl bg-[var(--consciousness-background)]/90 backdrop-blur-3xl border border-[var(--page-border)] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4">
          
          {isEmergency && (
            <div className="rounded-sm border border-rose-500/60 bg-rose-950 p-5 text-right relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-1 items-center sm:items-start text-center sm:text-right">
                <p className="text-lg font-black text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[var(--consciousness-critical)]" />
                  سلامتك أولاً (مسار طوارئ)
                </p>
                <p className="text-xs text-rose-200 font-bold max-w-sm">
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
              className="flex-1 rounded-sm bg-[var(--consciousness-primary)] text-[var(--ds-color-space-deep)] px-6 py-4 sm:py-5 text-lg font-black hover:opacity-90 hover:shadow-[0_0_30px_var(--ds-color-primary-glow)] active:scale-95 transition-all shadow-[0_10px_30px_rgba(45,212,191,0.2)] relative overflow-hidden group font-alexandria"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isEmergency ? `🛡️ ابدأ حماية نفسك من ${displayName}` : `🚀 ابدأ مسار التغيير مع ${displayName}`}
                {ctaStatus && <span className="text-xs font-medium">({ctaStatus})</span>}
              </span>
            </button>

            {!isForcedCtaMode && (
              <button
                type="button"
                onClick={() => onClose?.(addedNodeId)}
                className="w-full sm:w-48 shrink-0 rounded-sm border border-white/10 bg-white/[0.03] px-4 py-4 sm:py-5 text-sm font-black text-slate-300 hover:bg-white/10 hover:text-white active:scale-95 transition-all font-tajawal"
              >
                رجوع للخريطة
              </button>
            )}
            {isForcedCtaMode && (
              <div className="hidden sm:flex w-48 shrink-0 items-center justify-center border border-white/5 rounded-sm bg-black/20">
                 <p className="text-[9px] text-slate-600 text-center font-black font-tajawal">مسار_إلزامي</p>
              </div>
            )}
          </div>
        </div>

      {showTraining && addedNode && (
        <PersonalizedTraining
          personLabel={displayName}
          selectedSymptoms={addedNode.analysis?.selectedSymptoms ?? []}
          ring={activeRing as any}
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
