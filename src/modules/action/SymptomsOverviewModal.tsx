import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList } from "lucide-react";
import { useMapState } from '@/modules/map/dawayirIndex';
import { SymptomsChecklist } from '@/modules/exploration/SymptomsChecklist';

interface SymptomsOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SymptomsOverviewModal: FC<SymptomsOverviewModalProps> = ({
  isOpen,
  onClose
}) => {
  const nodes = useMapState((s) => s.nodes);
  const updateNodeSymptoms = useMapState((s) => s.updateNodeSymptoms);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() =>
    nodes.length > 0 ? nodes[0]!.id : null
  );

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

  const selectedNode = nodes.find((n) => n.id === effectiveSelectedId) || null;

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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-xl mx-auto"
          >
            <div className="bg-white rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-l from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-purple-700" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-900">الأعراض</h2>
                    <p className="text-xs text-slate-500">
                      اختر الشخص وشوف الأعراض المرتبطة بعلاقتك بيه
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
                    اضغط «أضف شخص» في الخريطة الأول، وبعدين ارجع هنا تشوف الأعراض.
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
                        id="symptoms-overview-person"
                        name="symptomsOverviewPerson"
                        value={effectiveSelectedId ?? ""}
                        onChange={(e) => setSelectedNodeId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      >
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Symptoms checklist for selected person */}
                    <div className="mt-2">
                      <SymptomsChecklist
                        ring={selectedNode.ring}
                        personLabel={selectedNode.label}
                        selectedSymptoms={selectedNode.analysis?.selectedSymptoms || []}
                        onSymptomsChange={(symptomIds) =>
                          updateNodeSymptoms(selectedNode.id, symptomIds)
                        }
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
