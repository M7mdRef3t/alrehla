import type { FC } from "react";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useMapState } from "../state/mapState";
import type { AdviceCategory } from "../data/adviceScripts";
import { ResultScreen } from "./AddPersonModal/ResultScreen";
import type { QuickAnswer2 } from "../utils/suggestInitialRing";
import { useShadowPulseState } from "../state/shadowPulseState";

interface ViewPersonModalProps {
  nodeId: string;
  category: AdviceCategory;
  goalId?: string;
  onClose: () => void;
  onOpenMission?: (nodeId: string) => void;
}

export const ViewPersonModal: FC<ViewPersonModalProps> = ({
  nodeId,
  onClose,
  onOpenMission
}) => {
  const node = useMapState((s) => s.nodes.find((n) => n.id === nodeId));
  const recordOpen = useShadowPulseState((s) => s.recordOpen);
  const recordClose = useShadowPulseState((s) => s.recordClose);
  const openedAtRef = useRef<number | null>(null);

  // سجّل فتح النافذة
  useEffect(() => {
    recordOpen(nodeId);
    openedAtRef.current = Date.now();
    return () => {
      // سجّل الإغلاق عند unmount
      if (openedAtRef.current !== null) {
        recordClose(nodeId, openedAtRef.current, false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  if (!node || !node.analysis) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full"
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
            <h3 className="text-xl font-bold text-slate-900 mb-2">الشخص غير متاح الآن</h3>
            <p className="text-gray-500 mb-6">لا توجد قراءة كاملة محفوظة لهذا الشخص حاليًا.</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-teal-600 text-white px-8 py-4 text-base font-semibold hover:bg-teal-700 active:scale-[0.98] transition-all duration-200"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleOpenMission = (targetNodeId: string) => {
    onOpenMission?.(targetNodeId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        className="relative bg-white border border-gray-200 rounded-2xl px-8 py-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
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

        <ResultScreen
          personLabel={node.label}
          personTitle={node.label}
          score={node.analysis.score}
          feelingAnswers={node.analysis.answers}
          realityAnswers={node.realityAnswers}
          isEmergency={node.isEmergency}
          safetyAnswer={node.safetyAnswer as QuickAnswer2 | undefined}
          summaryOnly
          addedNodeId={node.id}
          onOpenMission={handleOpenMission}
          onClose={() => onClose()}
        />
      </motion.div>
    </div>
  );
};
