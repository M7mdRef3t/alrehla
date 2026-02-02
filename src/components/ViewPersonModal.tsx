import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, X, ChevronDown, ChevronUp } from "lucide-react";
import { useMapState } from "../state/mapState";
import { RecoveryProgressBar } from "./RecoveryProgressBar";
import { DynamicRecoveryPlan } from "./DynamicRecoveryPlan";
import { ResultActionToolkit } from "./ResultActionToolkit";
import { NotesSection } from "./NotesSection";
import { SymptomsChecklist } from "./SymptomsChecklist";
import { PersonalizedTraining } from "./PersonalizedTraining";
import { SuggestedPlacement } from "./SuggestedPlacement";
import { RecoveryRoadmap } from "./RecoveryRoadmap";
import { RealityCheck, realityScoreToRing } from "./RealityCheck";
import type { AdviceCategory } from "../data/adviceScripts";
import { mapCopy } from "../copy/map";
import { getPersonViewData } from "../modules/personView/personViewData";
import { getSuggestedContent } from "../data/educationalContent";
import { generateBasicPlan } from "../utils/dynamicPlanGenerator";

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

  // Tabs on result view: التشخيص | الأعراض | الحل | الخطة
  const [resultTab, setResultTab] = useState<"diagnosis" | "symptoms" | "solution" | "plan">("diagnosis");

  // Training modal state
  const [showTraining, setShowTraining] = useState(false);
  // تبويب التشخيص — رؤية إضافية (إن وُجدت) مطوية افتراضيًا
  const [showDiagnosisInsight, setShowDiagnosisInsight] = useState(false);

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
          className="relative bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
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

  // عقد بيانات التبويبات الأربعة — مصدر واحد، قابل لتغذية AI عبر node.analysis.insights
  const viewData = getPersonViewData(node, category, goalId);
  const { diagnosis, symptoms, solution, plan } = viewData;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700 z-10"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
        <AnimatePresence mode="wait">
          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RecoveryProgressBar node={node} />

              {/* Tabs: التشخيص | الأعراض | الحل | الخطة — ضغط لطيف وانتقال ناعم */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
                {(["diagnosis", "symptoms", "solution", "plan"] as const).map((tab) => {
                  const isActive = resultTab === tab;
                  return (
                    <motion.button
                      key={tab}
                      type="button"
                      onClick={() => setResultTab(tab)}
                      className={`flex-1 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                        isActive ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                      }`}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      {tab === "diagnosis" ? mapCopy.tabDiagnosis : tab === "symptoms" ? mapCopy.tabSymptoms : tab === "solution" ? mapCopy.tabSolution : mapCopy.tabPlan}
                    </motion.button>
                  );
                })}
              </div>

              {resultTab === "diagnosis" && (
                <div className="space-y-4">
                  {/* فقرة واحدة: العنوان + فهم الوضع + الحالة والهدف — بدون عنوان "اقرأ فهم الوضع" */}
                  <div className="p-5 bg-linear-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-2xl text-right">
                    <p className="text-base text-slate-800 leading-relaxed">
                      {diagnosis.personalizedTitle}
                      <br />
                      {diagnosis.understanding}
                      <br />
                      <span className="text-sm text-gray-600 mt-2 block">
                        الحالة: <span className="font-semibold text-slate-700">{diagnosis.stateLabel}</span>
                        {diagnosis.goalAction && (
                          <span>  الهدف: {diagnosis.goalAction}</span>
                        )}
                      </span>
                    </p>
                  </div>

                  {/* رؤية إضافية — مطوية افتراضيًا، فتح/إغلاق ناعم */}
                  {diagnosis.diagnosisSummary && (
                    <div className="rounded-xl border-2 border-violet-200 overflow-hidden">
                      <motion.button
                        type="button"
                        onClick={() => setShowDiagnosisInsight((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-right bg-violet-50 hover:bg-violet-100 transition-colors duration-200 text-sm font-semibold text-violet-900"
                        whileTap={{ scale: 0.995 }}
                      >
                        <span className="flex items-center gap-2">
                          <span>✨</span> {mapCopy.diagnosisReadInsight}
                        </span>
                        <motion.span
                          animate={{ rotate: showDiagnosisInsight ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                          <ChevronDown className="w-4 h-4 shrink-0" />
                        </motion.span>
                      </motion.button>
                      <AnimatePresence initial={false}>
                        {showDiagnosisInsight && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-violet-50/80 border-t border-violet-100 text-right">
                              <p className="text-sm text-gray-700 leading-relaxed">{diagnosis.diagnosisSummary}</p>
                              <button
                                type="button"
                                onClick={() => setShowDiagnosisInsight(false)}
                                className="mt-2 text-xs text-slate-500 hover:text-slate-700 transition-colors duration-150"
                              >
                                {mapCopy.diagnosisCollapse}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {resultTab === "symptoms" && (
                <div className="min-h-[280px]">
                  {symptoms.symptomsInterpretation && (
                    <div className="mb-4 p-4 bg-violet-50 border-2 border-violet-200 rounded-xl text-right">
                      <p className="text-sm text-gray-700 leading-relaxed">{symptoms.symptomsInterpretation}</p>
                    </div>
                  )}
                  <SymptomsChecklist
                    ring={symptoms.ring}
                    personLabel={symptoms.personLabel}
                    selectedSymptoms={symptoms.selectedSymptoms}
                    onSymptomsChange={(symptomIds) => updateNodeSymptoms(nodeId, symptomIds)}
                  />
                </div>
              )}

              {resultTab === "solution" && (
                <div className="space-y-4">
                  {solution.solutionSuggestions && (
                    <div className="p-4 bg-violet-50 border-2 border-violet-200 rounded-xl text-right">
                      <p className="text-sm text-gray-700 leading-relaxed">{solution.solutionSuggestions}</p>
                    </div>
                  )}
                  <SuggestedPlacement
                    currentRing={solution.currentRing}
                    personLabel={solution.personLabel}
                    category={solution.category}
                    selectedSymptoms={solution.selectedSymptoms}
                  />
                  <button
                    type="button"
                    onClick={() => setStep("reality")}
                    className="w-full rounded-full bg-gray-100 text-gray-700 px-8 py-3 text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 border border-dashed border-gray-300"
                    title="اختياري: فهم علاقتك بالشخص"
                  >
                    استكمال: فهم العلاقة
                  </button>
                </div>
              )}

              {resultTab === "plan" && (
                <div className="space-y-4">
                  {!plan.canShowRecoveryPlan && plan.canShowPlanPreview && (
                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-right">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                        {mapCopy.planPreviewTitle}
                      </h3>
                      {(() => {
                        const basic = generateBasicPlan(plan.personLabel, node.ring);
                        const first = basic.steps[0];
                        if (!first) return null;
                        return (
                          <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300 mb-1">
                              الأسبوع {first.week} — {first.title}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                              {first.description}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {first.successCriteria}
                            </p>
                          </div>
                        );
                      })()}
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {mapCopy.planPreviewCta}
                      </p>
                      <button
                        type="button"
                        onClick={handleGoToFirstStep}
                        className="w-full rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold hover:bg-teal-700 active:scale-[0.98] transition-all"
                      >
                        {mapCopy.planRuleCta}
                      </button>
                    </div>
                  )}
                  {!plan.canShowRecoveryPlan && !plan.canShowPlanPreview && (
                    <div className="p-5 bg-amber-50 border-2 border-amber-400 rounded-xl text-right shadow-sm">
                      <h3 className="text-base font-bold text-amber-900 mb-2">
                        ❓ {mapCopy.planRuleTitle}
                      </h3>
                      <p className="text-sm text-amber-900 leading-relaxed mb-3">
                        {mapCopy.planRuleBody}
                      </p>
                      <p className="text-sm font-bold text-amber-800 mb-4">
                        {mapCopy.planRuleCounter(plan.situationsCount)}
                      </p>
                      <button
                        type="button"
                        onClick={handleGoToFirstStep}
                        className="w-full rounded-full bg-amber-500 text-white px-6 py-3 text-sm font-semibold hover:bg-amber-600 active:scale-[0.98] transition-all"
                      >
                        {mapCopy.planRuleCta}
                      </button>
                    </div>
                  )}
                  {plan.planHighlights && plan.planHighlights.length > 0 && (
                    <div className="p-4 bg-violet-50 border-2 border-violet-200 rounded-xl text-right">
                      <h3 className="text-sm font-bold text-violet-900 mb-2">نقاط بارزة</h3>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                        {plan.planHighlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <RecoveryRoadmap
                    personLabel={plan.personLabel}
                    hasAnalysis={plan.hasAnalysis}
                    hasSelectedSymptoms={plan.hasSelectedSymptoms}
                    hasWrittenSituations={plan.hasWrittenSituations}
                    hasCompletedTraining={plan.hasCompletedTraining}
                    completedRecoverySteps={plan.completedRecoverySteps}
                    totalRecoverySteps={plan.totalRecoverySteps}
                    journeyStartDate={plan.journeyStartDate}
                  />

                  <div className="space-y-3">
                    {!plan.canShowRecoveryPlan && (
                      <p className="text-sm text-slate-600 text-center">
                        {mapCopy.planRuleCounter(plan.situationsCount)} — {mapCopy.planRuleShort}
                      </p>
                    )}
                    {plan.canShowRecoveryPlan && (
                      <button
                        type="button"
                        onClick={handleGoToRecoveryPlan}
                        className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
                      >
                        شوف الخطة الأسبوعية →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleGoToFirstStep}
                      className={`w-full rounded-full px-8 py-3 text-sm font-medium active:scale-[0.98] transition-all duration-200 ${
                        plan.canShowRecoveryPlan
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-teal-600 text-white hover:bg-teal-700 shadow-lg font-semibold py-4 text-base"
                      }`}
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
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors active:scale-95 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="font-medium">رجوع</span>
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
              <RecoveryProgressBar node={node} />

              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors active:scale-95 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="font-medium">رجوع</span>
              </button>

              <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-300 rounded-xl text-right">
                <p className="text-sm font-bold text-purple-900 mb-2">
                  🛑 {mapCopy.planRuleShort}
                </p>
                <p className="text-sm font-semibold text-purple-900 mb-1">
                  💡 اختار موقف أو اتنين تحب تبدأ بيهم
                </p>
                <p className="text-xs text-purple-800 mb-1">
                  عشان نقدر نحلل الأنماط ونولّد خطة تعافي مخصصة ليك
                </p>
                <p className="text-sm font-bold text-purple-700">
                  {mapCopy.planRuleCounter(plan.situationsCount)}
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
                  disabled={!plan.canShowRecoveryPlan}
                  className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold shadow-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200"
                  title={plan.canShowRecoveryPlan ? "شوف خطة التعافي" : "اختار موقف أو اتنين الأول"}
                >
                  {plan.canShowRecoveryPlan ? "شوف خطة التعافي →" : "اكتب موقفين عشان تظهر الخطة"}
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
              <RecoveryProgressBar node={node} />

              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors active:scale-95 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="font-medium">رجوع</span>
              </button>

              <DynamicRecoveryPlan
                personLabel={node.label}
                ring={node.ring}
                situations={Object.values(node.firstStepProgress?.stepInputs || {}).flat().filter(s => s?.trim())}
                selectedSymptoms={node.analysis?.selectedSymptoms || []}
                completedSteps={node.recoveryProgress?.completedSteps || []}
                onToggleStep={(stepId) => toggleStepCompletion(nodeId, stepId)}
                onUpdateStepInput={(stepId, value) => updateDynamicStepInput(nodeId, stepId, value)}
                stepInputs={node.recoveryProgress?.dynamicStepInputs || {}}
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

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                {/* Suggested Content */}
                {(() => {
                  const suggestedContent = getSuggestedContent(node.ring);
                  const hasContent = suggestedContent.videos.length > 0 || 
                                     suggestedContent.stories.length > 0 || 
                                     suggestedContent.faqs.length > 0;
                  
                  if (hasContent) {
                    return (
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                          <h3 className="font-semibold text-indigo-900">محتوى مقترح لك</h3>
                        </div>
                        <p className="text-sm text-indigo-700 mb-3">
                          محتوى تعليمي قد يساعدك في هذا الموقف
                        </p>
                        <div className="space-y-2">
                          {suggestedContent.videos.slice(0, 2).map((video) => (
                            <div key={video.id} className="p-3 bg-white rounded-lg border border-indigo-100">
                              <p className="text-sm font-medium text-slate-900">{video.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{video.duration}</p>
                            </div>
                          ))}
                          {suggestedContent.faqs.slice(0, 1).map((faq) => (
                            <div key={faq.id} className="p-3 bg-white rounded-lg border border-indigo-100">
                              <p className="text-sm font-medium text-slate-900">{faq.question}</p>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-indigo-600 mt-3 text-center">
                          افتح المكتبة لاستكشاف المزيد من المحتوى
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

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
