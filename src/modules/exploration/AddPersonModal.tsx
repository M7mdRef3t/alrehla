import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { addPersonCopy } from "@/copy/addPerson";
import { useMapState } from '@/modules/map/dawayirIndex';
import type { FeelingAnswers } from "./FeelingCheck";
import type { RealityAnswers } from "./RealityCheck";
import { feelingScore } from "@/utils/feelingScore";
import { realityScoreToRing } from "@/utils/realityScore";
import type { QuickAnswer1, QuickAnswer2 } from "@/utils/suggestInitialRing";
import { trackingService } from "@/domains/journey";
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";
import { useEmergencyState } from "@/domains/admin/store/emergency.store";
import { quick1Tier, quick2Tier } from "@/utils/optionColors";
import { SelectPersonStep } from "./AddPersonModal/SelectPersonStep";
import { QuickQuestionsStep } from "./AddPersonModal/QuickQuestionsStep";
import { PositionStep } from "./AddPersonModal/PositionStep";
import { isUserMode } from "@/config/appEnv";
import { resolveAdviceCategory } from "@/data/adviceScripts";
import { buildEmergencyContextFromNode } from "@/utils/emergencyContext";
import type { PersonGender } from "@/utils/resultScreenAI";
import { FeelingStep } from "./AddPersonModal/FeelingStep";
import { ResultScreen } from "./AddPersonModal/ResultScreen";
import { ScientificDiagnosticHUD } from "./AddPersonModal/ScientificDiagnosticHUD";
import { triggerBackgroundAnalysis } from "@/services/backgroundAnalysis";
import { soundManager } from "@/services/soundManager";

type AddPersonStep =
  | "select"
  | "quickQuestions"
  | "feeling"
  | "position"
  | "diagnostic"
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

function isLowContact(realityAnswers: RealityAnswers): boolean {
  const low = [realityAnswers.q1, realityAnswers.q2, realityAnswers.q3].filter(
    (q) => q === "rarely" || q === "never"
  ).length;
  return low >= 2;
}

interface AddPersonModalProps {
  goalId: string;
  canUseFamilyTree?: boolean;
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
  const [quickAnswer1, setQuickAnswer1] = useState<QuickAnswer1 | null>(null);
  const [quickAnswer2, setQuickAnswer2] = useState<QuickAnswer2 | null>(null);
  const [linkToParentId, setLinkToParentId] = useState<string | null>(null);
  const [linkRelationLabel, setLinkRelationLabel] = useState<string>("");
  const [customRelationLabel, setCustomRelationLabel] = useState<string>("");
  const [lastRealityAnswers, setLastRealityAnswers] = useState<RealityAnswers | null>(null);
  const [isEmergency, setIsEmergency] = useState<boolean | null>(null);
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
      soundManager.playEffect("cosmic_pulse");
      const finalLabel = customName.trim() || selectedTitle;
      const nodeId = addNode(
        finalLabel,
        "yellow",
        undefined,
        goalId,
        undefined,
        false,
        "medium",
        false,
        undefined,
        undefined,
        true
      );
      setAddedNodeId(nodeId);
      triggerBackgroundAnalysis(nodeId, `إضافة شخص جديد باسم: ${finalLabel}`);
      setStep("quickQuestions");
    }
  };

  const handleQuickQuestionsDone = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playEffect("warp");
    if (quickAnswer1 == null || quickAnswer2 == null || isEmergency == null) return;
    if (addedNodeId) {
      useMapState.getState().updateNode(addedNodeId, {
        isEmergency: isEmergency,
        safetyAnswer: quickAnswer2 ?? undefined
      });
    }
    setStep("feeling");
  };

  const handleFeelingDone = (healthAnswers: FeelingAnswers) => {
    soundManager.playEffect("harmony");
    const score = feelingScore(healthAnswers);
    setHealthScore(score);
    setLastFeelingAnswers(healthAnswers);
    const finalLabel = customName.trim() || selectedTitle;
    setPendingPlacement({ finalLabel, score, healthAnswers });
    setStep("position");
  };

  const handleRealityDone = (answers: Parameters<typeof realityScoreToRing>[0]) => {
    if (!pendingPlacement || !addedNodeId) return;
    soundManager.playEffect(isEmergency ? "tension" : "gavel");
    const ring = isEmergency ? "red" : realityScoreToRing(answers);
    setLastRealityAnswers(answers);
    const { finalLabel, score, healthAnswers } = pendingPlacement;
    const resolvedRelationLabel = (customRelationLabel.trim() || linkRelationLabel.trim() || selectedTitle).trim();
    const treeRelation =
      canLinkInFamilyTree && linkToParentId
        ? { type: "family" as const, parentId: linkToParentId, relationLabel: resolvedRelationLabel }
        : undefined;
    const detachmentMode = ring === "red" && isLowContact(answers);
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
      isAnalyzing: false
    });
    trackingService.record("node_added", { ring, detachmentMode: detachmentMode ?? false, isEmergency: isEmergency === true, personLabel: finalLabel, nodeId: addedNodeId });
    analyticsService.track(AnalyticsEvents.PERSON_ADDED, {
      person_label: finalLabel,
      ring: ring,
      is_emergency: isEmergency === true,
      goal_id: goalId
    });
    if (nodes.filter(n => !n.isNodeArchived).length >= 2) {
      analyticsService.track(AnalyticsEvents.BASELINE_COMPLETED, { goal_id: goalId });
    }
    setPendingPlacement(null);
    setStep("diagnostic");
  };

  useEffect(() => {
    trackingService.recordFlow("add_person_opened");
  }, []);

  useEffect(() => {
    if (!isForcedResultGate || forcedCtaShownRef.current) return;
    forcedCtaShownRef.current = true;
    trackingService.recordFlow("add_person_cta_forced_shown", {
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
      trackingService.recordFlow("add_person_done_show_on_map", { meta: { nodeId: openNodeId } });
    } else if (step !== "result") {
      trackingService.recordFlow("add_person_dropped", { atStep: step });
    }
    onClose(openNodeId);
  };

  const handleCloseAttempt = (reason: "backdrop" | "close_button") => {
    if (isForcedResultGate) {
      trackingService.recordFlow("add_person_cta_forced_blocked_close", {
        meta: { reason, step }
      });
      return;
    }
    soundManager.playEffect("warp");
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

  const accentColor = isEmergency ? "var(--consciousness-critical)" : "var(--consciousness-primary)";

  // Progress tracking for the journey steps
  const STEP_ORDER: AddPersonStep[] = ["select", "quickQuestions", "feeling", "position", "diagnostic", "result"];
  const currentStepIndex = STEP_ORDER.indexOf(step);
  const totalVisibleSteps = 5; // don't count diagnostic as a visible step
  
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(5, 8, 18, 0.92)", backdropFilter: "blur(40px)" }}
      onClick={() => handleCloseAttempt("backdrop")}
      aria-labelledby="add-person-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className={`relative w-full min-h-0 flex flex-col text-[var(--consciousness-text)] ${
          step === "result"
            ? "h-full overflow-y-auto overflow-x-hidden scrollbar-hide"
            : "max-w-2xl overflow-hidden rounded-3xl px-6 py-6 pb-12 sm:px-8 sm:py-8 sm:pb-12"
        }`}
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 15 }}
        transition={{ type: "spring", damping: 28, stiffness: 200, mass: 0.8 }}
        style={{
          ...(step === "result" ? {
            maxHeight: "100%",
            height: "100%",
          } : {
            height: "min(90vh, fit-content)",
            maxHeight: "90vh",
            background: "rgba(15, 20, 35, 0.85)",
            backdropFilter: "blur(60px) saturate(1.5)",
            border: `1px solid rgba(255,255,255,0.08)`,
            boxShadow: `0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset`,
          })
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ Top Bar: Progress + Close ═══ */}
        {step !== "result" && (
          <div className="flex items-center justify-between mb-6 shrink-0 relative z-50">
            {/* Progress Dots */}
            <div className="flex items-center gap-2" dir="ltr">
              {["select", "quickQuestions", "feeling", "position", "result"].map((s, i) => {
                const stepIdx = STEP_ORDER.indexOf(s as AddPersonStep);
                const isActive = currentStepIndex >= stepIdx;
                const isCurrent = step === s || (step === "diagnostic" && s === "result");
                return (
                  <div
                    key={s}
                    className={`rounded-full transition-all duration-500 ${
                      isCurrent
                        ? `w-6 h-2 ${isEmergency ? "bg-rose-400" : "bg-teal-400"} shadow-[0_0_12px_rgba(45,212,191,0.5)]`
                        : isActive
                          ? `w-2 h-2 ${isEmergency ? "bg-rose-600" : "bg-teal-600"}`
                          : "w-2 h-2 bg-zinc-800"
                    }`}
                  />
                );
              })}
            </div>

            {/* Close Button */}
            {!isForcedResultGate && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCloseAttempt("close_button"); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:rotate-90 bg-zinc-800 hover:bg-zinc-700 text-white z-[200] group border border-white/20 shadow-lg"
                aria-label="إغلاق"
              >
                <span className="text-xl font-black leading-none">✕</span>
              </button>
            )}
          </div>
        )}

        {/* ═══ Close button for result step ═══ */}
        {step === "result" && !isForcedResultGate && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleCloseAttempt("close_button"); }}
            className="fixed top-6 left-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 hover:rotate-90 bg-zinc-900 hover:bg-zinc-800 text-white z-[250] border border-white/30 backdrop-blur-3xl shadow-2xl"
            aria-label="إغلاق"
          >
            <span className="text-3xl font-black leading-none">✕</span>
          </button>
        )}

        {/* ═══ Accent line ═══ */}
        {step !== "result" && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[2px] rounded-full" style={{ background: accentColor, boxShadow: `0 0 20px ${accentColor}` }} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="flex-auto min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col pt-1 pr-1"
            initial={{ opacity: 0, x: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -30, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
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
                      <label htmlFor="link-parent" className="block text-sm font-semibold text-[var(--consciousness-text-muted)] mb-2">
                        ربط بـ (اختياري)
                      </label>
                      <select
                        id="link-parent"
                        value={linkToParentId ?? ""}
                        onChange={(e) => setLinkToParentId(e.target.value || null)}
                        className="w-full border border-[var(--page-border)] rounded-xl px-3 py-2.5 text-sm bg-[var(--page-surface-2)] text-[var(--consciousness-text)] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                      >
                        <option value="">— بدون ربط —</option>
                        {familyNodes.map((n) => (
                          <option key={n.id} value={n.id} className="bg-slate-900">
                            {n.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">لو اخترت شخص، هيتربط تحته في شجرة العيلة</p>
                      {linkToParentId && (
                        <>
                          <label htmlFor="link-relation-type" className="block text-sm font-semibold text-[var(--consciousness-text-muted)] mt-3 mb-2">
                            نوع الربط
                          </label>
                          <select
                            id="link-relation-type"
                            value={linkRelationLabel}
                            onChange={(e) => setLinkRelationLabel(e.target.value)}
                            className="w-full border border-[var(--page-border)] rounded-xl px-3 py-2.5 text-sm bg-[var(--page-surface-2)] text-[var(--consciousness-text)] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                          >
                            <option value="" className="bg-slate-900">— اختر نوع الربط —</option>
                            <option value="ابن" className="bg-slate-900">ابن</option>
                            <option value="ابنة" className="bg-slate-900">ابنة</option>
                            <option value="أخ" className="bg-slate-900">أخ</option>
                            <option value="أخت" className="bg-slate-900">أخت</option>
                            <option value="زوج" className="bg-slate-900">زوج</option>
                            <option value="زوجة" className="bg-slate-900">زوجة</option>
                            <option value="أب" className="bg-slate-900">أب</option>
                            <option value="أم" className="bg-slate-900">أم</option>
                            <option value="قريب" className="bg-slate-900">قريب</option>
                            <option value="صلة أخرى" className="bg-slate-900">صلة أخرى</option>
                          </select>
                          <input
                            id="custom-relation-label"
                            name="customRelationLabel"
                            value={customRelationLabel}
                            onChange={(e) => setCustomRelationLabel(e.target.value)}
                            placeholder="أو اكتب صلة مخصصة (اختياري)"
                            className="w-full mt-2 border border-white/10 rounded-xl px-3 py-2.5 text-sm bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
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
            ) : step === "diagnostic" ? (
              <ScientificDiagnosticHUD
                personName={customName.trim() || selectedTitle}
                orbId={lastRealityAnswers ? (isEmergency ? "red" : realityScoreToRing(lastRealityAnswers)) : "yellow"}
                answers={lastRealityAnswers ?? {}}
                onComplete={() => {
                  setStep("result");
                }}
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
                isEmergency={isEmergency === true}
                safetyAnswer={quickAnswer2 ?? undefined}
                forcedGate={isForcedResultGate}
                category={resolveAdviceCategory(goalId)}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
