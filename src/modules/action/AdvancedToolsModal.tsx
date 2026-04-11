import type { FC } from "react";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { ResultActionToolkit } from "./ResultActionToolkit";
import { NotesSection } from '@/modules/meta/NotesSection';
import { PersonalizedTraining } from '@/modules/exploration/PersonalizedTraining';
import { resolveAdviceCategory } from "@/data/adviceScripts";

interface AdvancedToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvancedToolsModal: FC<AdvancedToolsModalProps> = ({ isOpen, onClose }) => {
  const nodes = useMapState((s) => s.nodes);
  const toggleFirstStepCompletion = useMapState((s) => s.toggleFirstStepCompletion);
  const updateFirstStepInputs = useMapState((s) => s.updateFirstStepInputs);
  const addNoteToNode = useMapState((s) => s.addNoteToNode);
  const deleteNoteFromNode = useMapState((s) => s.deleteNoteFromNode);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showTraining, setShowTraining] = useState(false);

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

  const category = resolveAdviceCategory(selectedNode?.goalId ?? "general");
  const completedFirstSteps = selectedNode?.firstStepProgress?.completedFirstSteps ?? [];
  const stepInputs = selectedNode?.firstStepProgress?.stepInputs ?? {};
  const selectedSymptoms = selectedNode?.analysis?.selectedSymptoms ?? [];

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
            <div className="bg-white rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-linear-to-l from-teal-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-teal-700" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-900">أدوات متقدمة</h2>
                    <p className="text-xs text-slate-500">أول خطوات + ملاحظات + تدريب مخصص</p>
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
                    لسه ما فيش علاقات على الخريطة. أضف شخص أولاً علشان الأدوات تشتغل.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600 text-right">
                        اختر الشخص
                      </label>
                      <select
                        id="advanced-tools-target"
                        name="advancedToolsTarget"
                        value={selectedNodeId ?? ""}
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

                    {selectedNode && (
                      <>
                        <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50">
                          <ResultActionToolkit
                            personLabel={selectedNode.label}
                            ring={selectedNode.ring}
                            score={selectedNode.analysis?.score ?? 0}
                            category={category}
                            completedFirstSteps={completedFirstSteps}
                            stepInputs={stepInputs}
                            onToggleFirstStep={(stepId) => toggleFirstStepCompletion(selectedNode.id, stepId)}
                            onUpdateStepInputs={(stepId, inputs) => updateFirstStepInputs(selectedNode.id, stepId, inputs)}
                          />
                        </div>

                        <NotesSection
                          personLabel={selectedNode.label}
                          notes={selectedNode.notes ?? []}
                          onAddNote={(text, comment) => addNoteToNode(selectedNode.id, text, comment)}
                          onDeleteNote={(noteId) => deleteNoteFromNode(selectedNode.id, noteId)}
                        />

                        <div className="mt-6 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setShowTraining(true)}
                            className="rounded-full bg-teal-600 text-white px-6 py-3 text-sm font-semibold hover:bg-teal-700 active:scale-[0.98] transition-all"
                          >
                            ابدأ تدريب مخصص
                          </button>
                        </div>
                      </>
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

          {showTraining && selectedNode && (
            <PersonalizedTraining
              personLabel={selectedNode.label}
              selectedSymptoms={selectedSymptoms}
              ring={selectedNode.ring}
              goalId={selectedNode.goalId ?? "unknown"}
              onClose={() => setShowTraining(false)}
              onComplete={() => setShowTraining(false)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};
