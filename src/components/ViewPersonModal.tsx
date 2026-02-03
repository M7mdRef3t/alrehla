import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, ChevronDown } from "lucide-react";
import { useMapState } from "../state/mapState";
import { RecoveryProgressBar } from "./RecoveryProgressBar";
import { SuggestedPlacement } from "./SuggestedPlacement";
import { RealityCheck, realityScoreToRing } from "./RealityCheck";
import type { AdviceCategory } from "../data/adviceScripts";
import { mapCopy } from "../copy/map";
import { getPersonViewData } from "../modules/personView/personViewData";

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
  const moveNodeToRing = useMapState((s) => s.moveNodeToRing);

  // شاشتين بس: تشخيص/حل + فهم العلاقة
  const [step, setStep] = useState<"result" | "reality">("result");

  // تبويبين بس في النتيجة: التشخيص | الحل
  const [resultTab, setResultTab] = useState<"diagnosis" | "solution">("diagnosis");
  // تبويب التشخيص — رؤية إضافية (إن وُجدت) مطوية افتراضيًا
  const [showDiagnosisInsight, setShowDiagnosisInsight] = useState(false);

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

  const handleBack = () => {
    if (step === "reality") setStep("result");
  };

  // نستخدم نفس بيانات العرض لكن بس التشخيص + الحل في النافذة دي
  const viewData = getPersonViewData(node, category, goalId);
  const { diagnosis, solution } = viewData;

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

              {/* Tabs: التشخيص | الحل */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
                {(["diagnosis", "solution"] as const).map((tab) => {
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

        </AnimatePresence>
      </motion.div>
    </div>
  );
};
