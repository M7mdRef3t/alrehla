import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { addPersonCopy } from "../copy/addPerson";
import { useMapState } from "../state/mapState";
import type { FeelingAnswers } from "./FeelingCheck";
import type { RealityAnswers } from "./RealityCheck";
import { feelingScore } from "../utils/feelingScore";
import { realityScoreToRing } from "../utils/realityScore";
import type { QuickAnswer1, QuickAnswer2 } from "../utils/suggestInitialRing";
import type { ContactLevel } from "../modules/pathEngine/pathTypes";
import { recordJourneyEvent, recordFlowEvent } from "../services/journeyTracking";
import { trackEvent, AnalyticsEvents } from "../services/analytics";
import { useEmergencyState } from "../state/emergencyState";
import { quick1Tier, quick2Tier } from "../utils/optionColors";
import { SelectPersonStep } from "./AddPersonModal/SelectPersonStep";
import { QuickQuestionsStep } from "./AddPersonModal/QuickQuestionsStep";
import { PositionStep } from "./AddPersonModal/PositionStep";
import { isUserMode } from "../config/appEnv";
import { resolveAdviceCategory } from "../data/adviceScripts";
import { buildEmergencyContextFromNode } from "../utils/emergencyContext";
import type { PersonGender } from "../utils/resultScreenAI";
import { FeelingStep } from "./AddPersonModal/FeelingStep";
import { ResultScreen } from "./AddPersonModal/ResultScreen";
import { triggerBackgroundAnalysis } from "../services/backgroundAnalysis";

type AddPersonStep =
  | "select"
  | "quickQuestions"
  | "feeling"
  | "position"
  | "result";

function inferPersonGender(title?: string): PersonGender {
  if (!title) return "unknown";
  const t = title.trim();
  if (!t) return "unknown";
  const femaleHints = ["أم", "ماما", "أخت", "زوجة", "ابنة", "بنت", "خالة", "عمة", "ست", "مديرة", "صديقة", "زوجة الأخ", "زوجة الأخت"];
  const maleHints = ["أب", "بابا", "أخ", "زوج", "ابن", "عم", "خال", "مدير", "زميل", "عميل", "صديق", "جار", "زوج الأخت"];
  if (femaleHints.some((h) => t.includes(h))) return "female";
  if (maleHints.some((h) => t.includes(h))) return "male";
  return "unknown";
}

/** مسافة عالية = أغلب الإجابات نادراً أو أبداً (صيغة قياسية) */
function isLowContact(realityAnswers: RealityAnswers): boolean {
  const low = [realityAnswers.q1, realityAnswers.q2, realityAnswers.q3].filter(
    (q) => q === "rarely" || q === "never"
  ).length;
  return low >= 2;
}

/** معدل الاحتكاك من إجابات الواقع (تواصل): 6–9 عالي، 3–5 متوسط، 1–2 منخفض، 0 لا تواصل */
function realityAnswersToContact(answers: RealityAnswers): ContactLevel {
  const pt = (q: string) => (q === "often" ? 3 : q === "sometimes" ? 2 : q === "rarely" ? 1 : 0);
  const sum = pt(answers.q1) + pt(answers.q2) + pt(answers.q3);
  if (sum >= 6) return "high";
  if (sum >= 3) return "medium";
  if (sum >= 1) return "low";
  return "none";
}

interface AddPersonModalProps {
  goalId: string;
  canUseFamilyTree?: boolean;
  /** عند "تم" يُستدعى بدون معامل. عند "افتح [الاسم]" يُستدعى بمعرّف العقدة لفتح نافذة الشخص */
  onClose: (openNodeId?: string) => void;
  onOpenMission?: (nodeId: string) => void;
  onOpenMissionFromAddPerson?: (nodeId: string) => void;
}

export const AddPersonModal: FC<AddPersonModalProps> = ({
  goalId,
  canUseFamilyTree = false,
  onClose,
  onOpenMission,
  onOpenMissionFromAddPerson
}) => {
  const [step, setStep] = useState<AddPersonStep>("select");
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [customTitleInput, setCustomTitleInput] = useState("");
  const [showCustomTitleInput, setShowCustomTitleInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [healthScore, setHealthScore] = useState<number>(0);
  const [lastFeelingAnswers, setLastFeelingAnswers] = useState<FeelingAnswers | null>(null);
  const [addedNodeId, setAddedNodeId] = useState<string | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<{ finalLabel: string; score: number; healthAnswers: FeelingAnswers } | null>(null);
  const [quickAnswer1, setQuickAnswer1] = useState<QuickAnswer1 | null>("medium");
  const [quickAnswer2, setQuickAnswer2] = useState<QuickAnswer2 | null>("medium");
  const [linkToParentId, setLinkToParentId] = useState<string | null>(null);
  const [linkRelationLabel, setLinkRelationLabel] = useState<string>("");
  const [customRelationLabel, setCustomRelationLabel] = useState<string>("");
  const [lastRealityAnswers, setLastRealityAnswers] = useState<RealityAnswers | null>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [showEncouragementHint, setShowEncouragementHint] = useState(false);
  const forcedCtaShownRef = useRef(false);
  const addNode = useMapState((s) => s.addNode);
  const nodes = useMapState((s) => s.nodes);
  const openEmergency = useEmergencyState((s) => s.open);
  const canLinkInFamilyTree = goalId === "family" && canUseFamilyTree;
  const familyNodes = canLinkInFamilyTree ? nodes.filter((n) => n.goalId === "family" || n.goalId == null) : [];
  const linkedParentLabel = linkToParentId ? familyNodes.find((n) => n.id === linkToParentId)?.label ?? "" : "";
  const resolvedHintRelation = (customRelationLabel.trim() || linkRelationLabel.trim() || selectedTitle).trim();
  const contextualNameHint =
    canLinkInFamilyTree && linkedParentLabel
      ? `هيتسجل كـ "${resolvedHintRelation || "صلة"}" تحت "${linkedParentLabel}" في شجرة العيلة.`
      : undefined;
  const isForcedResultGate = isUserMode && step === "result";

  useEffect(() => {
    if (!selectedTitle) return;
    if (!linkRelationLabel && !customRelationLabel.trim()) {
      setLinkRelationLabel(selectedTitle);
    }
  }, [selectedTitle, linkRelationLabel, customRelationLabel]);

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedTitle) {
      const finalLabel = customName.trim() || selectedTitle;
      // Optimistic Add: Add node immediately with isAnalyzing: true
      const nodeId = addNode(
        finalLabel,
        "yellow", // Default ring while analyzing
        undefined,
        goalId,
        undefined, // Will be updated later if needed
        false,
        "medium",
        false,
        undefined,
        undefined,
        true // isAnalyzing: true
      );
      setAddedNodeId(nodeId);
      
      // Trigger Background Analysis (Optimistic UI)
      triggerBackgroundAnalysis(nodeId, `إضافة شخص جديد باسم: ${finalLabel}`);
      
      setStep("quickQuestions");
    }
  };

  const handleQuickQuestionsDone = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAnswer1 == null || quickAnswer2 == null) return;
    
    // Update node with preliminary safety/emergency info
    if (addedNodeId) {
      useMapState.getState().updateNode(addedNodeId, {
        isEmergency: isEmergency,
        safetyAnswer: quickAnswer2 ?? undefined
      });
    }
    
    setStep("feeling");
  };

  const handleFeelingDone = (healthAnswers: FeelingAnswers) => {
    const score = feelingScore(healthAnswers);
    setHealthScore(score);
    setLastFeelingAnswers(healthAnswers);

    const finalLabel = customName.trim() || selectedTitle;
    setPendingPlacement({ finalLabel, score, healthAnswers });
    // بعد "تأثير العلاقة عليك" نروح لشاشة "فين الشخص في حياتك"
    setStep("position");
  };

  const handleRealityDone = (answers: Parameters<typeof realityScoreToRing>[0]) => {
    if (!pendingPlacement || !addedNodeId) return;
    const ring = isEmergency ? "red" : realityScoreToRing(answers);
    setLastRealityAnswers(answers);
    const { finalLabel, score, healthAnswers } = pendingPlacement;
    const resolvedRelationLabel = (customRelationLabel.trim() || linkRelationLabel.trim() || selectedTitle).trim();
    
    const treeRelation =
      canLinkInFamilyTree && linkToParentId
        ? { type: "family" as const, parentId: linkToParentId, relationLabel: resolvedRelationLabel }
        : undefined;
        
    const detachmentMode = ring === "red" && isLowContact(answers);
    const contact = realityAnswersToContact(answers);

    // Final Update: Remove isAnalyzing and set final ring/analysis
    useMapState.getState().updateNode(addedNodeId, {
      label: finalLabel,
      ring,
      analysis: {
        score,
        answers: healthAnswers,
        timestamp: Date.now(),
        recommendedRing: ring
      },
      treeRelation,
      detachmentMode,
      realityAnswers: answers,
      isAnalyzing: false // Done analyzing!
    });

    recordJourneyEvent("node_added", { ring, detachmentMode: detachmentMode ?? false, isEmergency: isEmergency ?? false, personLabel: finalLabel, nodeId: addedNodeId });
    trackEvent(AnalyticsEvents.PERSON_ADDED, {
      person_label: finalLabel,
      ring: ring,
      is_emergency: isEmergency ?? false,
      goal_id: goalId
    });

    // Check for Baseline Completion (3+ nodes)
    if (nodes.filter(n => !n.isNodeArchived).length >= 2) { // current node + 2 existing = 3
      trackEvent(AnalyticsEvents.BASELINE_COMPLETED, { goal_id: goalId });
    }
    
    setPendingPlacement(null);
    setStep("result");
  };

  useEffect(() => {
    recordFlowEvent("add_person_opened");
  }, []);

  useEffect(() => {
    if (!isForcedResultGate || forcedCtaShownRef.current) return;
    forcedCtaShownRef.current = true;
    recordFlowEvent("add_person_cta_forced_shown", {
      meta: { nodeId: addedNodeId ?? null }
    });
  }, [addedNodeId, isForcedResultGate]);

  useEffect(() => {
    if (step !== "select") return;
    const t = setTimeout(() => setShowEncouragementHint(true), 15_000);
    return () => clearTimeout(t);
  }, [step]);

  const handleClose = (openNodeId?: string) => {
    if (step === "result" && openNodeId) {
      recordFlowEvent("add_person_done_show_on_map", { meta: { nodeId: openNodeId } });
    } else if (step !== "result") {
      recordFlowEvent("add_person_dropped", { atStep: step });
    }
    onClose(openNodeId);
  };

  const handleCloseAttempt = (reason: "backdrop" | "close_button") => {
    if (isForcedResultGate) {
      recordFlowEvent("add_person_cta_forced_blocked_close", {
        meta: { reason, step }
      });
      return;
    }
    handleClose();
  };

  const handleTitleSelect = (title: string) => {
    if (title === "__custom__") {
      setShowCustomTitleInput(true);
      setSelectedTitle(customTitleInput.trim() || "");
      return;
    }
    setShowCustomTitleInput(false);
    setCustomTitleInput("");
    setSelectedTitle(title);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md px-4"
      onClick={() => handleCloseAttempt("backdrop")}
      aria-labelledby="add-person-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="relative ds-card px-6 py-6 max-w-md w-full min-h-0 flex flex-col overflow-hidden text-slate-100"
        style={{ height: "min(90vh, fit-content)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {!isForcedResultGate && (
          <button
            type="button"
            onClick={() => handleCloseAttempt("close_button")}
            className="absolute top-3 left-3 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white z-10 shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex-auto min-h-0 overflow-hidden flex flex-col pt-1">
        {step === "select" ? (
          <SelectPersonStep
            goalId={goalId}
            selectedTitle={selectedTitle}
            customTitleInput={customTitleInput}
            showCustomTitleInput={showCustomTitleInput}
            customName={customName}
            encouragementHint={showEncouragementHint}
            contextualHint={contextualNameHint}
            onTitleSelect={handleTitleSelect}
            onCustomTitleChange={(value) => {
              setCustomTitleInput(value);
              setSelectedTitle(value.trim());
            }}
            onNameChange={(value) => setCustomName(value)}
            onCancel={handleClose}
            onContinue={handleContinue}
            afterNameContent={
              canLinkInFamilyTree && familyNodes.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <label htmlFor="link-parent" className="block text-sm font-medium text-gray-700 mb-2">
                    ربط بـ (اختياري)
                  </label>
                  <select
                    id="link-parent"
                    value={linkToParentId ?? ""}
                    onChange={(e) => setLinkToParentId(e.target.value || null)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">— بدون ربط —</option>
                    {familyNodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">لو اخترت شخص، هيتربط تحته في شجرة العيلة</p>
                  {linkToParentId && (
                    <>
                      <label htmlFor="link-relation-type" className="block text-sm font-medium text-gray-700 mt-3 mb-2">
                        نوع الربط
                      </label>
                      <select
                        id="link-relation-type"
                        value={linkRelationLabel}
                        onChange={(e) => setLinkRelationLabel(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">— اختر نوع الربط —</option>
                        <option value="ابن">ابن</option>
                        <option value="ابنة">ابنة</option>
                        <option value="أخ">أخ</option>
                        <option value="أخت">أخت</option>
                        <option value="زوج">زوج</option>
                        <option value="زوجة">زوجة</option>
                        <option value="أب">أب</option>
                        <option value="أم">أم</option>
                        <option value="قريب">قريب</option>
                        <option value="صلة أخرى">صلة أخرى</option>
                      </select>
                      <input
                        value={customRelationLabel}
                        onChange={(e) => setCustomRelationLabel(e.target.value)}
                        placeholder="أو اكتب صلة مخصصة (اختياري)"
                        className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </>
                  )}
                </motion.div>
              ) : null
            }
          />
        ) : step === "quickQuestions" ? (
          <QuickQuestionsStep
            title={addPersonCopy.quickQuestionsTitle}
            question1={addPersonCopy.question1}
            options1={addPersonCopy.options1}
            question2={addPersonCopy.question2}
            options2={addPersonCopy.options2}
            quickAnswer1={quickAnswer1}
            quickAnswer2={quickAnswer2}
            isEmergency={isEmergency}
            onSelectQuick1={(value) => setQuickAnswer1(value as QuickAnswer1)}
            onSelectQuick2={(value) => setQuickAnswer2(value as QuickAnswer2)}
            onSelectEmergency={(value) => setIsEmergency(value)}
            onBack={() => setStep("select")}
            onContinue={handleQuickQuestionsDone}
            disableSubmit={false}
            getTier1={(value) => quick1Tier[value] ?? "green"}
            getTier2={(value) => quick2Tier[value] ?? "green"}
            nextLabel={addPersonCopy.nextAfterQuestions}
          />
        ) : step === "feeling" ? (
          <FeelingStep
            personLabel={customName.trim() || selectedTitle}
            onDone={handleFeelingDone}
          />
        ) : step === "position" && pendingPlacement ? (
          <PositionStep
            personLabel={pendingPlacement.finalLabel}
            onDone={handleRealityDone}
            onBack={() => setStep("feeling")}
          />
        ) : step === "result" ? (
          <ResultScreen
            personLabel={customName.trim() || selectedTitle}
            personTitle={selectedTitle}
            personName={customName}
            personGender={inferPersonGender(selectedTitle)}
            score={healthScore}
            summaryOnly
            addedNodeId={addedNodeId ?? undefined}
            onClose={handleClose}
            onOpenMission={onOpenMissionFromAddPerson ?? onOpenMission}
            onOpenEmergency={
              isEmergency
                ? () => {
                    const node = addedNodeId
                      ? useMapState.getState().nodes.find((item) => item.id === addedNodeId)
                      : null;
                    openEmergency(node ? buildEmergencyContextFromNode(node) : undefined);
                  }
                : undefined
            }
            realityAnswers={lastRealityAnswers ?? undefined}
            feelingAnswers={lastFeelingAnswers ?? undefined}
            isEmergency={isEmergency}
            safetyAnswer={quickAnswer2 ?? undefined}
            forcedGate={isForcedResultGate}
            category={resolveAdviceCategory(goalId)}
          />
        ) : null}
        </div>
      </motion.div>
    </div>
  );
};
