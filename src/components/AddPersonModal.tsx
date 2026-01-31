import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { 
  User, 
  Users, 
  UserCircle, 
  Heart, 
  Briefcase, 
  UserCheck,
  UserX,
  Building2,
  ArrowLeft,
  type LucideIcon 
} from "lucide-react";
import { mapCopy } from "../copy/map";
import { useMapState } from "../state/mapState";
import { FeelingCheck, type FeelingAnswers } from "./FeelingCheck";
import { ResultActionToolkit } from "./ResultActionToolkit";
import { DynamicRecoveryPlan } from "./DynamicRecoveryPlan";
import { ProgressIndicator } from "./ProgressIndicator";
import { SymptomsChecklist } from "./SymptomsChecklist";
import { PersonalizedTraining } from "./PersonalizedTraining";
import { SuggestedPlacement } from "./SuggestedPlacement";
import type { Ring } from "../modules/map/mapTypes";
import type { AdviceCategory } from "../data/adviceScripts";
import { adviceDatabase } from "../data/adviceScripts";
import { getGoalAction } from "../copy/goalPicker";

// Smart suggestions with icons based on goalId
interface SuggestionCard {
  label: string;
  icon: LucideIcon;
}

const SUGGESTIONS: Record<string, SuggestionCard[]> = {
  family: [
    { label: "أب", icon: User },
    { label: "أم", icon: Heart },
    { label: "أخ", icon: Users },
    { label: "أخت", icon: UserCircle },
    { label: "ابن", icon: User },
    { label: "ابنة", icon: UserCircle },
    { label: "قريب", icon: UserCheck }
  ],
  work: [
    { label: "مدير", icon: Briefcase },
    { label: "زميل", icon: Users },
    { label: "عميل", icon: Building2 },
    { label: "مدير سابق", icon: UserX }
  ],
  love: [
    { label: "شريك", icon: Heart },
    { label: "خطيب", icon: Heart },
    { label: "زوج", icon: Heart },
    { label: "إكس", icon: UserX }
  ],
  money: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ],
  unknown: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ],
  general: [
    { label: "صديق", icon: Users },
    { label: "جار", icon: UserCheck },
    { label: "معرفة", icon: UserCircle }
  ]
};

// Dynamic placeholders based on goalId
const PLACEHOLDERS: Record<string, string> = {
  family: "مثال: ماما / الأب / الأخ الكبير",
  work: "مثال: المدير / الزميل / العميل",
  love: "مثال: الشريك / الخطيب / الإكس",
  money: "مثال: الصديق / الجار",
  unknown: "مثال: الشخص اللي في بالك",
  general: "مثال: الشخص اللي في بالك"
};

type RingId = "green" | "yellow" | "red";

const RING_ZONES: { id: RingId; label: string; bg: string; border: string }[] = [
  { id: "green", label: mapCopy.legendGreen, bg: "bg-teal-400/20", border: "border-teal-400" },
  { id: "yellow", label: mapCopy.legendYellow, bg: "bg-amber-400/20", border: "border-amber-400" },
  { id: "red", label: mapCopy.legendRed, bg: "bg-rose-400/20", border: "border-rose-400" }
];

function DraggablePersonChip({ personLabel }: { personLabel: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: "new-person" });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-full bg-white border-2 border-teal-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg cursor-grab active:cursor-grabbing touch-none select-none ${
        isDragging ? "opacity-90 scale-105 shadow-xl" : ""
      }`}
    >
      {personLabel}
    </div>
  );
}

function DroppableZone({
  ring,
  label,
  bg,
  border,
  onPlace
}: { ring: RingId; label: string; bg: string; border: string; onPlace: (ring: RingId) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id: ring });
  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={() => onPlace(ring)}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 min-h-[80px] transition-all ${bg} ${border} ${
        isOver ? "ring-4 ring-teal-400 ring-offset-2 scale-[1.02]" : "hover:scale-[1.02]"
      }`}
    >
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className="text-xs text-slate-600 mt-0.5">اضغط أو اسحب الدائرة هنا</span>
    </button>
  );
}

function PlacementStep({ personLabel, onPlace }: { personLabel: string; onPlace: (ring: RingId) => void }) {
  const handleDragEnd = (event: DragEndEvent) => {
    const over = event.over;
    if (over && (over.id === "green" || over.id === "yellow" || over.id === "red")) {
      onPlace(over.id as RingId);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-xl font-bold text-slate-900 mb-1">{mapCopy.placementTitle}</h2>
      <p className="text-sm text-gray-600 mb-6">{mapCopy.placementHint}</p>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-3 mb-8">
          {RING_ZONES.map((z) => (
            <DroppableZone
              key={z.id}
              ring={z.id}
              label={z.label}
              bg={z.bg}
              border={z.border}
              onPlace={onPlace}
            />
          ))}
        </div>

        <div className="flex justify-center pt-4 pb-2" aria-label="الدائرة في إيدك">
          <DraggablePersonChip personLabel={personLabel} />
        </div>
        <p className="text-xs text-gray-500">اسحب الدائرة فوق المنطقة واتركها</p>
      </DndContext>
    </div>
  );
}

interface AddPersonModalProps {
  goalId: string;
  category: AdviceCategory;
  onClose: () => void;
}

export const AddPersonModal: FC<AddPersonModalProps> = ({ goalId, category, onClose }) => {
  const [step, setStep] = useState<"select" | "feeling" | "placement" | "result" | "firstStep" | "recoveryPlan">("select");
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [customTitleInput, setCustomTitleInput] = useState("");
  const [showCustomTitleInput, setShowCustomTitleInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [currentRing, setCurrentRing] = useState<Ring>("yellow");
  const [recommendedRing, setRecommendedRing] = useState<Ring>("yellow");
  const [healthScore, setHealthScore] = useState<number>(0);
  const [addedNodeId, setAddedNodeId] = useState<string | null>(null);
  const [pendingPlacement, setPendingPlacement] = useState<{ finalLabel: string; score: number; healthAnswers: FeelingAnswers } | null>(null);
  const addNode = useMapState((s) => s.addNode);
  const toggleFirstStepCompletion = useMapState((s) => s.toggleFirstStepCompletion);
  const updateFirstStepInputs = useMapState((s) => s.updateFirstStepInputs);
  const toggleStepCompletion = useMapState((s) => s.toggleStepCompletion);
  const updateDynamicStepInput = useMapState((s) => s.updateDynamicStepInput);
  const updateStepFeedback = useMapState((s) => s.updateStepFeedback);
  const updateLastViewedStep = useMapState((s) => s.updateLastViewedStep);
  const updateNodeSymptoms = useMapState((s) => s.updateNodeSymptoms);
  const markTrainingComplete = useMapState((s) => s.markTrainingComplete);
  const nodes = useMapState((s) => s.nodes);

  const suggestions = SUGGESTIONS[goalId] || SUGGESTIONS.general;

  const handleContinue = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedTitle) {
      setCurrentRing("yellow");
      setStep("feeling");
    }
  };

  const handleFeelingDone = (healthAnswers: FeelingAnswers) => {
    // Calculate health score: count "yes" answers (true = unhealthy)
    const score = (healthAnswers.q1 ? 1 : 0) + (healthAnswers.q2 ? 1 : 0) + (healthAnswers.q3 ? 1 : 0);
    
    // Determine RECOMMENDED ring based on health analysis
    let ring: Ring;
    if (score >= 2) {
      ring = "red";    // 2-3 yes = should be distant (danger/exhausting)
    } else if (score === 1) {
      ring = "yellow"; // 1 yes = should be conditional
    } else {
      ring = "green";  // 0 yes = can be close (healthy)
    }

    setRecommendedRing(ring);
    setHealthScore(score);

    const finalLabel = customName.trim() || selectedTitle;
    setPendingPlacement({ finalLabel, score, healthAnswers });
    setStep("placement");
  };

  const handlePlacementDrop = (ring: Ring) => {
    if (!pendingPlacement) return;
    const { finalLabel, score, healthAnswers } = pendingPlacement;
    const nodeId = addNode(finalLabel, ring, { score, answers: healthAnswers });
    setAddedNodeId(nodeId);
    setPendingPlacement(null);
    setStep("result");
  };

  const handleFinish = () => {
    onClose();
  };

  const handleGoToFirstStep = () => {
    setStep("firstStep");
    if (addedNodeId) {
      updateLastViewedStep(addedNodeId, "firstStep");
    }
  };

  const handleGoToRecoveryPlan = () => {
    setStep("recoveryPlan");
    if (addedNodeId) {
      updateLastViewedStep(addedNodeId, "recoveryPlan");
    }
  };

  const handleCompleteLater = () => {
    // Save current step before closing
    if (addedNodeId && (step === "result" || step === "firstStep" || step === "recoveryPlan")) {
      updateLastViewedStep(addedNodeId, step as "result" | "firstStep" | "recoveryPlan");
    }
    onClose();
  };

  // Training modal state
  const [showTraining, setShowTraining] = useState(false);

  const handleBack = () => {
    if (step === "firstStep") {
      setStep("result");
    } else if (step === "recoveryPlan") {
      setStep("firstStep");
    }
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

  const getRingLabel = (ring: Ring): string => {
    switch (ring) {
      case "green": return "القرب الصحي";
      case "yellow": return "القرب المشروط";
      case "red": return "الخطر والاستنزاف";
    }
  };

  // Calculate progress step
  const getProgressStep = (): number => {
    if (step === "result") return 1;
    if (step === "firstStep") return 2;
    if (step === "recoveryPlan") return 3;
    return 0;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
      aria-labelledby="add-person-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {step === "select" ? (
          <form onSubmit={handleContinue} className="text-right">
            <h2 id="add-person-title" className="text-xl font-bold text-slate-900 mb-4">
              {mapCopy.addPersonTitle}
            </h2>
        
        {/* Step 1: Select Title (Required) */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر اللقب <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {suggestions.map((suggestion) => {
              const Icon = suggestion.icon;
              const isSelected = selectedTitle === suggestion.label && !showCustomTitleInput;
              const isPillar = goalId === "family" && (suggestion.label === "أب" || suggestion.label === "أم");
              return (
                <motion.button
                  key={suggestion.label}
                  type="button"
                  onClick={() => handleTitleSelect(suggestion.label)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1 ${
                    isSelected
                      ? "bg-teal-50 border-teal-500 shadow-md"
                      : "bg-white border-gray-100 hover:border-teal-300 hover:bg-teal-50"
                  } ${isPillar ? "p-3" : "p-2.5"}`}
                  title={`اختر "${suggestion.label}"`}
                  whileHover={{ scale: isSelected ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`rounded-full flex items-center justify-center ${
                    isSelected ? "bg-teal-200" : "bg-teal-100"
                  } ${isPillar ? "w-10 h-10" : "w-8 h-8"}`}>
                    <Icon className={`${isSelected ? "text-teal-700" : "text-teal-600"} ${isPillar ? "w-5 h-5" : "w-4 h-4"}`} strokeWidth={2} />
                  </div>
                  <span className={`font-semibold ${isSelected ? "text-teal-900" : "text-slate-900"} ${isPillar ? "text-base" : "text-xs"}`}>
                    {suggestion.label}
                  </span>
                </motion.button>
              );
            })}
            <motion.button
              type="button"
              onClick={() => handleTitleSelect("__custom__")}
              className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-1 ${
                showCustomTitleInput && customTitleInput.trim()
                  ? "bg-gray-100 border-gray-400"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
              }`}
              title="اكتب لقب يدوياً"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xs font-medium text-gray-600">حد تاني</span>
            </motion.button>
          </div>
          {showCustomTitleInput && (
            <div className="mt-3">
              <input
                type="text"
                value={customTitleInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustomTitleInput(v);
                  setSelectedTitle(v.trim());
                }}
                placeholder="اكتب اللقب..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Step 2: Optional Name (only shown after title selection) */}
        {selectedTitle && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label htmlFor="person-name-input" className="block text-sm font-medium text-gray-700 mb-2">
              الاسم (اختياري)
            </label>
            <input
              id="person-name-input"
              name="personName"
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder={`مثال: أحمد، محمد، سارة...`}
              title="اكتب اسم الشخص (اختياري)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-2">
              سيظهر كـ: <span className="font-semibold text-teal-700">
                {customName.trim() || selectedTitle}
              </span>
            </p>
          </motion.div>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-full bg-gray-100 px-6 py-3 text-sm text-gray-700 font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            onClick={onClose}
            title="إلغاء وإغلاق النافذة"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={!selectedTitle}
            className="flex-1 rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold shadow-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            title={selectedTitle ? "التالي: حلل إحساسك" : "اختر اللقب أولاً"}
          >
            التالي
          </button>
            </div>
          </form>
        ) : step === "feeling" ? (
          <div>
            <FeelingCheck
              personLabel={customName.trim() || selectedTitle}
              onDone={handleFeelingDone}
            />
          </div>
        ) : step === "placement" && pendingPlacement ? (
          <PlacementStep
            personLabel={pendingPlacement.finalLabel}
            onPlace={(ring) => handlePlacementDrop(ring)}
          />
        ) : step === "result" ? (
          <ResultScreen
            personLabel={customName.trim() || selectedTitle}
            ring={recommendedRing}
            score={healthScore}
            category={category}
            goalId={goalId}
            nodeId={addedNodeId || undefined}
            onGoToFirstStep={handleGoToFirstStep}
            onCompleteLater={handleCompleteLater}
          />
        ) : step === "firstStep" ? (
          <FirstStepScreen
            personLabel={customName.trim() || selectedTitle}
            ring={recommendedRing}
            score={healthScore}
            category={category}
            nodeId={addedNodeId || undefined}
            selectedSymptoms={
              addedNodeId
                ? nodes.find(n => n.id === addedNodeId)?.analysis?.selectedSymptoms
                : undefined
            }
            completedFirstSteps={
              addedNodeId 
                ? nodes.find(n => n.id === addedNodeId)?.firstStepProgress?.completedFirstSteps || []
                : []
            }
            stepInputs={
              addedNodeId
                ? nodes.find(n => n.id === addedNodeId)?.firstStepProgress?.stepInputs || {}
                : {}
            }
            onToggleFirstStep={
              addedNodeId
                ? (stepId) => toggleFirstStepCompletion(addedNodeId, stepId)
                : undefined
            }
            onUpdateStepInputs={
              addedNodeId
                ? (stepId, inputs) => updateFirstStepInputs(addedNodeId, stepId, inputs)
                : undefined
            }
            onGoToRecoveryPlan={handleGoToRecoveryPlan}
            onCompleteLater={handleCompleteLater}
            onBack={handleBack}
            onOpenTraining={() => setShowTraining(true)}
          />
        ) : step === "recoveryPlan" ? (
          <RecoveryPlanScreen
            personLabel={customName.trim() || selectedTitle}
            ring={recommendedRing}
            nodeId={addedNodeId || undefined}
            situations={
              addedNodeId
                ? Object.values(nodes.find(n => n.id === addedNodeId)?.firstStepProgress?.stepInputs || {}).flat().filter(s => s?.trim())
                : []
            }
            completedSteps={
              addedNodeId
                ? nodes.find(n => n.id === addedNodeId)?.recoveryProgress?.completedSteps || []
                : []
            }
            stepInputs={
              addedNodeId
                ? (nodes.find(n => n.id === addedNodeId)?.recoveryProgress as any)?.dynamicStepInputs || {}
                : {}
            }
            onToggleStep={
              addedNodeId
                ? (stepId) => toggleStepCompletion(addedNodeId, stepId)
                : undefined
            }
            onUpdateStepInput={
              addedNodeId
                ? (stepId, value) => updateDynamicStepInput(addedNodeId, stepId, value)
                : undefined
            }
            stepFeedback={
              addedNodeId
                ? (nodes.find(n => n.id === addedNodeId)?.recoveryProgress?.stepFeedback || {})
                : {}
            }
            onStepFeedback={
              addedNodeId
                ? (stepId, value) => updateStepFeedback(addedNodeId, stepId, value)
                : undefined
            }
            onFinish={handleFinish}
            onBack={handleBack}
          />
        ) : null}

        {/* Personalized Training Modal */}
        {showTraining && addedNodeId && (
          <PersonalizedTraining
            personLabel={customName.trim() || selectedTitle}
            selectedSymptoms={
              nodes.find(n => n.id === addedNodeId)?.analysis?.selectedSymptoms || []
            }
            ring={nodes.find(n => n.id === addedNodeId)?.ring ?? recommendedRing}
            goalId={goalId}
            nodeId={addedNodeId || undefined}
            onClose={() => setShowTraining(false)}
            onComplete={() => addedNodeId && markTrainingComplete(addedNodeId)}
          />
        )}
      </motion.div>
    </div>
  );
};

// ============================================
// Screen 1: Result Screen (النتيجة الأساسية)
// ============================================
interface ResultScreenProps {
  personLabel: string;
  ring: Ring;
  score: number;
  category: AdviceCategory;
  goalId: string;
  nodeId?: string;
  onGoToFirstStep: () => void;
  onCompleteLater: () => void;
}

const ResultScreen: FC<ResultScreenProps> = ({
  personLabel,
  ring,
  score,
  category,
  goalId,
  nodeId,
  onGoToFirstStep,
  onCompleteLater
}) => {
  const updateNodeSymptoms = useMapState((s) => s.updateNodeSymptoms);
  const nodes = useMapState((s) => s.nodes);
  const node = nodeId ? nodes.find(n => n.id === nodeId) : null;
  let zone: "red" | "yellow" | "green";
  if (score > 2) {
    zone = "red";
  } else if (score >= 1) {
    zone = "yellow";
  } else {
    zone = "green";
  }

  const adviceByZone = adviceDatabase[zone];
  const advice = adviceByZone[category] ?? adviceByZone.general ?? adviceDatabase.green.general;

  const stateLabel = ring === "green" ? "صحية" : ring === "yellow" ? "محتاجة انتباه" : "استنزاف";

  const understanding = {
    red: `علاقتك مع ${personLabel} بتاخد منك أكتر مما بتديك. جسمك بيحذرك - اسمع له.`,
    yellow: `في أنماط مش صحية في علاقتك مع ${personLabel} محتاجة انتباه. الحدود هتحميك.`,
    green: `علاقتك مع ${personLabel} صحية ومتوازنة. حافظ عليها واستمر.`
  };

  const personalizedTitle = {
    red: `قربك من "${personLabel}" مؤلم ومحتاج حماية`,
    yellow: `علاقتك مع "${personLabel}" محتاجة ضبط`,
    green: `علاقتك مع "${personLabel}" صحية وآمنة`
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="result"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <ProgressIndicator 
          currentStep={1} 
          totalSteps={3} 
          labels={["النتيجة", "أول خطوة", "خطة التعافي"]}
        />

        {/* النتيجة الرئيسية */}
        <div className="p-6 bg-linear-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {personalizedTitle[zone]}
          </h2>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-500 text-center">
            <p>
              الحالة: <span className="font-semibold text-slate-700">{stateLabel}</span>
            </p>
            {getGoalAction(goalId) && (
              <p>
                الهدف: <span className="font-semibold text-slate-700">{getGoalAction(goalId)}</span>
              </p>
            )}
          </div>
        </div>

        {/* فهم الوضع */}
        <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl text-right mb-6">
          <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span>🔍</span> فهم الوضع
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {understanding[zone]}
          </p>
        </div>

        {/* Symptoms Checklist */}
        {nodeId && node && (
          <div className="mb-6">
            <SymptomsChecklist
              ring={ring}
              personLabel={personLabel}
              selectedSymptoms={node.analysis?.selectedSymptoms}
              onSymptomsChange={(symptomIds) => updateNodeSymptoms(nodeId, symptomIds)}
            />
          </div>
        )}

        {/* Suggested Placement */}
        {nodeId && node && (
          <SuggestedPlacement
            currentRing={ring}
            personLabel={personLabel}
            category={category}
            selectedSymptoms={node.analysis?.selectedSymptoms}
          />
        )}

        {/* الأزرار */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={onGoToFirstStep}
            className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            {mapCopy.firstStepCta} →
          </button>
          <button
            type="button"
            onClick={onCompleteLater}
            className="w-full rounded-full bg-gray-100 text-gray-700 px-8 py-3 text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            أكمل بعدين
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Screen 2: First Step Screen (الخطوة الأولى)
// ============================================
interface FirstStepScreenProps {
  personLabel: string;
  ring: Ring;
  score: number;
  category: AdviceCategory;
  nodeId?: string;
  selectedSymptoms?: string[];
  completedFirstSteps?: string[];
  stepInputs?: Record<string, string[]>;
  onToggleFirstStep?: (stepId: string) => void;
  onUpdateStepInputs?: (stepId: string, inputs: string[]) => void;
  onGoToRecoveryPlan: () => void;
  onCompleteLater: () => void;
  onBack: () => void;
  onOpenTraining?: () => void;
}

const FirstStepScreen: FC<FirstStepScreenProps> = ({
  personLabel,
  ring,
  score,
  category,
  nodeId,
  selectedSymptoms,
  completedFirstSteps,
  stepInputs,
  onToggleFirstStep,
  onUpdateStepInputs,
  onGoToRecoveryPlan,
  onCompleteLater,
  onBack,
  onOpenTraining
}) => {
  // Check if user has written enough situations for dynamic plan
  const situationsCount = stepInputs 
    ? Object.values(stepInputs).flat().filter(s => s?.trim()).length 
    : 0;
  const canShowRecoveryPlan = situationsCount >= 2;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="firstStep"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <ProgressIndicator 
          currentStep={2} 
          totalSteps={3} 
          labels={["النتيجة", "أول خطوة", "خطة التعافي"]}
        />

        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        {/* Banner: Need at least 2 situations */}
        <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-300 rounded-xl text-right">
          <p className="text-sm font-semibold text-purple-900 mb-1">
            💡 اختار موقف أو اتنين تحب تبدأ بيهم
          </p>
          <p className="text-xs text-purple-800">
            عشان نقدر نحلل الأنماط ونولّد خطة تعافي مخصصة ليك ({situationsCount}/2)
          </p>
        </div>

        {/* First Step Toolkit */}
        <ResultActionToolkit
          personLabel={personLabel}
          ring={ring}
          score={score}
          category={category}
          nodeId={nodeId}
          completedFirstSteps={completedFirstSteps}
          stepInputs={stepInputs}
          onToggleFirstStep={onToggleFirstStep}
          onUpdateStepInputs={onUpdateStepInputs}
          compactMode={true}
        />

        {/* الأزرار */}
        <div className="mt-6 space-y-3">
          {/* Training Button (if symptoms selected) */}
          {selectedSymptoms && selectedSymptoms.length > 0 && (
            <button
              type="button"
              onClick={onOpenTraining}
              className="w-full rounded-full bg-purple-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-purple-700 active:scale-[0.98] transition-all duration-200 flex flex-col items-center gap-1"
            >
              <span>🎯 تدرب على التعامل مع {personLabel}</span>
              <span className="text-sm font-medium text-purple-100">أنا جاهز أمثل دور {personLabel}.. وريني هتتصرف إزاي 😉</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGoToRecoveryPlan}
            disabled={!canShowRecoveryPlan}
            className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            title={canShowRecoveryPlan ? "شوف خطة التعافي" : "اختار موقف أو اتنين الأول"}
          >
            مش دلوقتي – بعدين
          </button>
          <button
            type="button"
            onClick={onCompleteLater}
            className="w-full rounded-full bg-gray-100 text-gray-700 px-8 py-3 text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            أكمل بعدين
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// Screen 3: Recovery Plan Screen (خطة التعافي)
// ============================================
interface RecoveryPlanScreenProps {
  personLabel: string;
  ring: Ring;
  nodeId?: string;
  situations: string[];
  completedSteps?: string[];
  stepInputs?: Record<string, string>;
  onToggleStep?: (stepId: string) => void;
  onUpdateStepInput?: (stepId: string, value: string) => void;
  stepFeedback?: Record<string, "hard" | "easy" | "unrealistic">;
  onStepFeedback?: (stepId: string, value: "hard" | "easy" | "unrealistic") => void;
  onFinish: () => void;
  onBack: () => void;
}

const RecoveryPlanScreen: FC<RecoveryPlanScreenProps> = ({
  personLabel,
  ring,
  nodeId,
  situations,
  completedSteps,
  stepInputs,
  onToggleStep,
  onUpdateStepInput,
  stepFeedback = {},
  onStepFeedback,
  onFinish,
  onBack
}) => {
  const nodes = useMapState((s) => s.nodes);
  const node = nodeId ? nodes.find(n => n.id === nodeId) : null;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="recoveryPlan"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <ProgressIndicator 
          currentStep={3} 
          totalSteps={3} 
          labels={["النتيجة", "أول خطوة", "خطة التعافي"]}
        />

        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        {/* Dynamic Recovery Plan */}
        <DynamicRecoveryPlan
          personLabel={personLabel}
          ring={ring}
          situations={situations}
          selectedSymptoms={node?.analysis?.selectedSymptoms}
          completedSteps={completedSteps || []}
          onToggleStep={onToggleStep || (() => {})}
          onUpdateStepInput={onUpdateStepInput || (() => {})}
          stepInputs={stepInputs || {}}
          stepFeedback={stepFeedback}
          onStepFeedback={onStepFeedback}
        />

        {/* زرار الإغلاق */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            تمام، إغلاق
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
