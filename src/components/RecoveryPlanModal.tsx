import type { FC } from "react";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target } from "lucide-react";
import { useMapState } from "../state/mapState";
import { DynamicRecoveryPlan } from "./DynamicRecoveryPlan";

interface RecoveryPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPreselectedNodeId?: string | null;
  focusTraumaInheritance?: boolean;
}

export const RecoveryPlanModal: FC<RecoveryPlanModalProps> = ({
  isOpen,
  onClose,
  initialPreselectedNodeId,
  focusTraumaInheritance
}) => {
  const nodes = useMapState((s) => s.nodes);
  const toggleStepCompletion = useMapState((s) => s.toggleStepCompletion);
  const updateDynamicStepInput = useMapState((s) => s.updateDynamicStepInput);
  const updateStepFeedback = useMapState((s) => s.updateStepFeedback);
  const updateDetachmentReasons = useMapState((s) => s.updateDetachmentReasons);
  const incrementRuminationLog = useMapState((s) => s.incrementRuminationLog);
  const updateRecoveryPathSnapshot = useMapState((s) => s.updateRecoveryPathSnapshot);
  const addDailyPathProgress = useMapState((s) => s.addDailyPathProgress);
  const updateBoundaryLegitimacyScore = useMapState((s) => s.updateBoundaryLegitimacyScore);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() =>
    nodes.length > 0 ? nodes[0]!.id : null
  );

  useEffect(() => {
    if (isOpen && initialPreselectedNodeId && nodes.some((n) => n.id === initialPreselectedNodeId)) {
      setSelectedNodeId(initialPreselectedNodeId);
    }
  }, [isOpen, initialPreselectedNodeId, nodes]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const hasNodes = nodes.length > 0;
  const effectiveSelectedId =
    hasNodes && selectedNodeId && nodes.some((n) => n.id === selectedNodeId)
      ? selectedNodeId
      : hasNodes
        ? nodes[0]!.id
        : null;

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === effectiveSelectedId) || null,
    [nodes, effectiveSelectedId]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-linear-to-l from-teal-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-teal-700" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">بروتوكول الدفاع</h2>
                    <p className="text-xs text-slate-500">
                      اختر الشخص وشوف خطتك الأسبوعية معاه
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto">
                {!hasNodes && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-right text-sm text-slate-700">
                    لسه ما فيش علاقات على الخريطة.
                    <br />
                    ابدأ بإضافة جبهة وكتابة موقفين عالأقل، وبعدها هتظهر مهمات الميدان هنا.
                  </div>
                )}

                {hasNodes && selectedNode && (
                  <>
                    {/* Person selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 text-right">
                        اختر الشخص
                      </label>
                      <select
                        value={effectiveSelectedId ?? ""}
                        onChange={(e) => setSelectedNodeId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      >
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Recovery plan for selected person */}
                    <div className="mt-2">
                      <DynamicRecoveryPlan
                        personLabel={selectedNode.label}
                        ring={selectedNode.ring}
                        situations={
                          Object.values(selectedNode.firstStepProgress?.stepInputs || {})
                            .flat()
                            .filter((s) => s?.trim())
                        }
                        selectedSymptoms={selectedNode.analysis?.selectedSymptoms || []}
                        completedSteps={selectedNode.recoveryProgress?.completedSteps || []}
                        onToggleStep={(stepId) =>
                          toggleStepCompletion(selectedNode.id, stepId)
                        }
                        onUpdateStepInput={(stepId, value) =>
                          updateDynamicStepInput(selectedNode.id, stepId, value)
                        }
                        stepInputs={selectedNode.recoveryProgress?.dynamicStepInputs || {}}
                        stepFeedback={selectedNode.recoveryProgress?.stepFeedback || {}}
                        onStepFeedback={(stepId, value) =>
                          updateStepFeedback(selectedNode.id, stepId, value)
                        }
                        focusTraumaInheritance={focusTraumaInheritance}
                        detachmentMode={selectedNode.detachmentMode}
                        detachmentReasons={selectedNode.recoveryProgress?.detachmentReasons ?? []}
                        onUpdateDetachmentReasons={(reasons) =>
                          updateDetachmentReasons(selectedNode.id, reasons)
                        }
                        ruminationCount={selectedNode.recoveryProgress?.ruminationLogCount ?? 0}
                        onIncrementRumination={() => incrementRuminationLog(selectedNode.id)}
                        nodeId={selectedNode.id}
                        pathId={selectedNode.recoveryProgress?.pathId}
                        recoveryPathSnapshot={selectedNode.recoveryProgress?.recoveryPathSnapshot}
                        onUpdateRecoveryPathSnapshot={(snapshot) =>
                          updateRecoveryPathSnapshot(selectedNode.id, snapshot)
                        }
                        onAddDailyPathProgress={addDailyPathProgress}
                        dailyPathProgress={selectedNode.recoveryProgress?.dailyPathProgress ?? []}
                        lastPathGeneratedAt={selectedNode.recoveryProgress?.lastPathGeneratedAt}
                        goalId={selectedNode.goalId ?? undefined}
                        boundaryLegitimacyScore={selectedNode.recoveryProgress?.boundaryLegitimacyScore}
                        onUpdateBoundaryLegitimacyScore={(score) => updateBoundaryLegitimacyScore(selectedNode.id, score)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-full bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 active:scale-95 transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

