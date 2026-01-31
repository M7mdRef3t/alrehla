import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useMapState } from "../state/mapState";
import { ProgressIndicator } from "./ProgressIndicator";
import { DynamicRecoveryPlan } from "./DynamicRecoveryPlan";
import { ResultActionToolkit } from "./ResultActionToolkit";
import { NotesSection } from "./NotesSection";
import { SymptomsChecklist } from "./SymptomsChecklist";
import { PersonalizedTraining } from "./PersonalizedTraining";
import { SuggestedPlacement } from "./SuggestedPlacement";
import { RecoveryRoadmap } from "./RecoveryRoadmap";
import { RealityCheck, realityScoreToRing } from "./RealityCheck";
import type { Ring } from "../modules/map/mapTypes";
import type { AdviceCategory } from "../data/adviceScripts";
import { adviceDatabase } from "../data/adviceScripts";
import { getGoalAction } from "../copy/goalPicker";
import { mapCopy } from "../copy/map";

interface ViewPersonModalProps {
  nodeId: string;
  category: AdviceCategory;
  goalId?: string;
  onClose: () => void;
}

export const ViewPersonModal: FC<ViewPersonModalProps> = ({
  nodeId,
  category,
  goalId,
  onClose
}) => {
  const node = useMapState((s) => s.nodes.find((n) => n.id === nodeId));
  const toggleFirstStepCompletion = useMapState((s) => s.toggleFirstStepCompletion);
  const updateFirstStepInputs = useMapState((s) => s.updateFirstStepInputs);
  const toggleStepCompletion = useMapState((s) => s.toggleStepCompletion);
  const updateDynamicStepInput = useMapState((s) => s.updateDynamicStepInput);
  const updateStepFeedback = useMapState((s) => s.updateStepFeedback);
  const updateLastViewedStep = useMapState((s) => s.updateLastViewedStep);
  const addNoteToNode = useMapState((s) => s.addNoteToNode);
  const deleteNoteFromNode = useMapState((s) => s.deleteNoteFromNode);
  const updateNodeSymptoms = useMapState((s) => s.updateNodeSymptoms);
  const markTrainingComplete = useMapState((s) => s.markTrainingComplete);
  const moveNodeToRing = useMapState((s) => s.moveNodeToRing);

  // Initialize step based on lastViewedStep or default to result
  const [step, setStep] = useState<"result" | "reality" | "firstStep" | "recoveryPlan">(
    node?.lastViewedStep || "result"
  );

  // Tabs on result view: التشخيص | الحل | الخطة
  const [resultTab, setResultTab] = useState<"diagnosis" | "solution" | "plan">("diagnosis");

  // Training modal state
  const [showTraining, setShowTraining] = useState(false);

  // Update step when node changes
  useEffect(() => {
    if (node?.lastViewedStep) {
      setStep(node.lastViewedStep);
    }
  }, [node?.lastViewedStep]);

  if (!node || !node.analysis) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-center py-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {node?.label || "شخص غير موجود"}
            </h3>
            <p className="text-gray-500 mb-6">
              تمت إضافة هذا الشخص قبل تفعيل ميزة حفظ التحليل.
              <br />
              يمكنك حذفه وإضافته مرة أخرى للحصول على النصائح.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleGoToFirstStep = () => {
    setStep("firstStep");
    updateLastViewedStep(nodeId, "firstStep");
  };

  const handleGoToRecoveryPlan = () => {
    setStep("recoveryPlan");
    updateLastViewedStep(nodeId, "recoveryPlan");
  };

  const handleBack = () => {
    if (step === "firstStep") {
      setStep("result");
      updateLastViewedStep(nodeId, "result");
    } else if (step === "recoveryPlan") {
      setStep("firstStep");
      updateLastViewedStep(nodeId, "firstStep");
    } else if (step === "reality") {
      setStep("result");
    }
  };

  const situationsCount = node.firstStepProgress?.stepInputs 
    ? Object.values(node.firstStepProgress.stepInputs).flat().filter(s => s?.trim()).length 
    : 0;
  const canShowRecoveryPlan = situationsCount >= 2;

  let zone: "red" | "yellow" | "green";
  if (node.analysis.score > 2) {
    zone = "red";
  } else if (node.analysis.score >= 1) {
    zone = "yellow";
  } else {
    zone = "green";
  }

  const adviceByZone = adviceDatabase[zone];
  const advice = adviceByZone[category] ?? adviceByZone.general ?? adviceDatabase.green.general;
  const stateLabel = node.ring === "green" ? "صحية" : node.ring === "yellow" ? "محتاجة انتباه" : "استنزاف";

  const understanding = {
    red: `علاقتك مع ${node.label} بتاخد منك أكتر مما بتديك. جسمك بيحذرك - اسمع له.`,
    yellow: `في أنماط مش صحية في علاقتك مع ${node.label} محتاجة انتباه. الحدود هتحميك.`,
    green: `علاقتك مع ${node.label} صحية ومتوازنة. حافظ عليها واستمر.`
  };

  // New personalized title
  const personalizedTitle = {
    red: `قربك من "${node.label}" مؤلم ومحتاج حماية`,
    yellow: `علاقتك مع "${node.label}" محتاجة ضبط`,
    green: `علاقتك مع "${node.label}" صحية وآمنة`
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        className="bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProgressIndicator 
                currentStep={1} 
                totalSteps={3} 
                labels={["النتيجة", "أول خطوة", "خطة التعافي"]}
              />

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 mb-4 flex items-center justify-center gap-2"
                title="تأكيد مكان الشخص على الخريطة وإغلاق الكارت"
              >
                ✓ {mapCopy.confirmPlacement}
              </button>

              {/* Tabs: التشخيص | الحل | الخطة */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
                {(["diagnosis", "solution", "plan"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setResultTab(tab)}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                      resultTab === tab
                        ? "bg-white text-teal-700 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab === "diagnosis" ? mapCopy.tabDiagnosis : tab === "solution" ? mapCopy.tabSolution : mapCopy.tabPlan}
                  </button>
                ))}
              </div>

              {resultTab === "diagnosis" && (
                <div className="space-y-4">
                  <div className="p-6 bg-linear-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl">
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

                  <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl text-right">
                    <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <span>🔍</span> فهم الوضع
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {understanding[zone]}
                    </p>
                  </div>

                  <SymptomsChecklist
                    ring={node.ring}
                    personLabel={node.label}
                    selectedSymptoms={node.analysis.selectedSymptoms}
                    onSymptomsChange={(symptomIds) => updateNodeSymptoms(nodeId, symptomIds)}
                  />
                </div>
              )}

              {resultTab === "solution" && (
                <SuggestedPlacement
                  currentRing={node.ring}
                  personLabel={node.label}
                  category={category}
                  selectedSymptoms={node.analysis.selectedSymptoms}
                />
              )}

              {resultTab === "plan" && (
                <div className="space-y-4">
                  <RecoveryRoadmap
                    personLabel={node.label}
                    hasAnalysis={!!node.analysis}
                    hasSelectedSymptoms={!!node.analysis?.selectedSymptoms && node.analysis.selectedSymptoms.length > 0}
                    hasWrittenSituations={
                      Object.values(node.firstStepProgress?.stepInputs || {})
                        .flat()
                        .filter(s => s?.trim()).length >= 2
                    }
                    hasCompletedTraining={node.hasCompletedTraining}
                    completedRecoverySteps={node.recoveryProgress?.completedSteps?.length || 0}
                    totalRecoverySteps={10}
                    journeyStartDate={node.journeyStartDate}
                  />

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setStep("reality")}
                      className="w-full rounded-full bg-gray-100 text-gray-700 px-8 py-3 text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-dashed border-gray-300"
                      title="اختياري: فهم علاقتك بالشخص"
                    >
                      استكمال: فهم العلاقة
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToFirstStep}
                      className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
                    >
                      {mapCopy.firstStepCta} →
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full rounded-full bg-gray-100 text-gray-700 px-8 py-3 text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === "reality" && (
            <motion.div
              key="reality"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </button>
              <RealityCheck
                personLabel={node.label}
                onDone={(answers) => {
                  moveNodeToRing(nodeId, realityScoreToRing(answers));
                  setStep("result");
                }}
              />
            </motion.div>
          )}

          {step === "firstStep" && (
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

              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </button>

              <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-300 rounded-xl text-right">
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  💡 اختار موقف أو اتنين تحب تبدأ بيهم
                </p>
                <p className="text-xs text-purple-800">
                  عشان نقدر نحلل الأنماط ونولّد خطة تعافي مخصصة ليك ({situationsCount}/2)
                </p>
              </div>

              <ResultActionToolkit
                personLabel={node.label}
                ring={node.ring}
                score={node.analysis.score}
                category={category}
                nodeId={nodeId}
                completedFirstSteps={node.firstStepProgress?.completedFirstSteps || []}
                stepInputs={node.firstStepProgress?.stepInputs || {}}
                onToggleFirstStep={(stepId) => toggleFirstStepCompletion(nodeId, stepId)}
                onUpdateStepInputs={(stepId, inputs) => updateFirstStepInputs(nodeId, stepId, inputs)}
                compactMode={true}
              />

              <div className="mt-6 space-y-3">
                {/* Training Button (if symptoms selected) */}
                {node.analysis.selectedSymptoms && node.analysis.selectedSymptoms.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTraining(true)}
                    className="w-full rounded-full bg-purple-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-purple-700 active:scale-[0.98] transition-all duration-200 flex flex-col items-center gap-1"
                  >
                    <span>🎯 تدرب على التعامل مع {node.label}</span>
                    <span className="text-sm font-medium text-purple-100">أنا جاهز أمثل دور {node.label}.. وريني هتتصرف إزاي 😉</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGoToRecoveryPlan}
                  disabled={!canShowRecoveryPlan}
                  className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
                  title={canShowRecoveryPlan ? "شوف خطة التعافي" : "اختار موقف أو اتنين الأول"}
                >
                  مش دلوقتي – بعدين
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-full bg-gray-100 text-gray-700 px-8 py-3 text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          )}

          {step === "recoveryPlan" && (
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

              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </button>

              <DynamicRecoveryPlan
                personLabel={node.label}
                ring={node.ring}
                situations={Object.values(node.firstStepProgress?.stepInputs || {}).flat().filter(s => s?.trim())}
                selectedSymptoms={node.analysis?.selectedSymptoms || []}
                completedSteps={node.recoveryProgress?.completedSteps || []}
                onToggleStep={(stepId) => toggleStepCompletion(nodeId, stepId)}
                onUpdateStepInput={(stepId, value) => updateDynamicStepInput(nodeId, stepId, value)}
                stepInputs={(node.recoveryProgress as any)?.dynamicStepInputs || {}}
                stepFeedback={node.recoveryProgress?.stepFeedback || {}}
                onStepFeedback={(stepId, value) => updateStepFeedback(nodeId, stepId, value)}
              />

              {/* Notes Section */}
              <div className="mt-8">
                <NotesSection
                  personLabel={node.label}
                  notes={node.notes || []}
                  onAddNote={(text, comment) => addNoteToNode(nodeId, text, comment)}
                  onDeleteNote={(noteId) => deleteNoteFromNode(nodeId, noteId)}
                />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
                >
                  تمام، إغلاق
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personalized Training Modal */}
        {showTraining && node.analysis.selectedSymptoms && (
          <PersonalizedTraining
            personLabel={node.label}
            selectedSymptoms={node.analysis.selectedSymptoms}
            ring={node.ring}
            goalId={goalId ?? "general"}
            nodeId={nodeId}
            onClose={() => setShowTraining(false)}
            onComplete={() => markTrainingComplete(nodeId)}
          />
        )}
      </motion.div>
    </div>
  );
};
