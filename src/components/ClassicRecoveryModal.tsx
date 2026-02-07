import type { FC } from "react";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList } from "lucide-react";
import { useMapState } from "../state/mapState";
import { RecoveryPlanView } from "./RecoveryPlanView";
import { RecoveryAccordion } from "./RecoveryAccordion";

interface ClassicRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClassicRecoveryModal: FC<ClassicRecoveryModalProps> = ({
  isOpen,
  onClose
}) => {
  const nodes = useMapState((s) => s.nodes);
  const toggleStepCompletion = useMapState((s) => s.toggleStepCompletion);
  const addSituationLog = useMapState((s) => s.addSituationLog);
  const deleteSituationLog = useMapState((s) => s.deleteSituationLog);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "accordion">("cards");

  useEffect(() => {
    if (!isOpen) return;
    if (nodes.length === 0) {
      setSelectedNodeId(null);
      return;
    }
    setSelectedNodeId((prev) => (prev && nodes.some((n) => n.id === prev) ? prev : nodes[0]!.id));
  }, [isOpen, nodes]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null),
    [nodes, selectedNodeId]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-linear-to-l from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-blue-700" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-900">الخطة الكلاسيكية</h2>
                    <p className="text-xs text-slate-500">خطة أسبوعية + بنك سكريبتات + سجل الميدان</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto">
                {nodes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-right text-sm text-slate-700">
                    لسه مفيش جبهات على الخريطة. أضف جبهة أولًا عشان الخطة تظهر.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 text-right">
                        اختَر الجبهة
                      </label>
                      <select
                        value={selectedNodeId ?? ""}
                        onChange={(e) => setSelectedNodeId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode("cards")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          viewMode === "cards"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        عرض بطاقات
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("accordion")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          viewMode === "accordion"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        عرض أكورديون
                      </button>
                    </div>

                    {selectedNode && viewMode === "cards" && (
                      <RecoveryPlanView
                        personLabel={selectedNode.label}
                        ring={selectedNode.ring}
                        completedSteps={selectedNode.recoveryProgress?.completedSteps ?? []}
                        situationLogs={selectedNode.recoveryProgress?.situationLogs ?? []}
                        onToggleStep={(stepId) => toggleStepCompletion(selectedNode.id, stepId)}
                        onAddLog={(log) => addSituationLog(selectedNode.id, log)}
                        onDeleteLog={(logId) => deleteSituationLog(selectedNode.id, logId)}
                      />
                    )}

                    {selectedNode && viewMode === "accordion" && (
                      <RecoveryAccordion
                        ring={selectedNode.ring}
                        completedSteps={selectedNode.recoveryProgress?.completedSteps ?? []}
                        situationLogs={selectedNode.recoveryProgress?.situationLogs ?? []}
                        onToggleStep={(stepId) => toggleStepCompletion(selectedNode.id, stepId)}
                        onAddLog={(log) => addSituationLog(selectedNode.id, log)}
                        onDeleteLog={(logId) => deleteSituationLog(selectedNode.id, logId)}
                      />
                    )}
                  </>
                )}
              </div>

              <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
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
};
