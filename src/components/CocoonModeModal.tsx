import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Wind } from "lucide-react";

interface CocoonModeModalProps {
  isOpen: boolean;
  onStart: () => void;
  onClose: () => void;
}

export const CocoonModeModal: FC<CocoonModeModalProps> = ({ isOpen, onStart, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl bg-slate-900 text-white p-6 text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-slate-200">
            <Moon className="w-5 h-5" />
            <span className="text-sm font-semibold">دقيقة شحن</span>
          </div>
          <h2 className="text-2xl font-bold">النهاردة يوم شحن</h2>
          <p className="text-sm text-slate-300">
            سيب المواجهة. خليك في وضع هادي يشحن طاقتك.
          </p>

          <button
            type="button"
            onClick={onStart}
            className="w-full rounded-full bg-teal-500 text-white py-4 text-base font-semibold hover:bg-teal-400 transition-all flex items-center justify-center gap-2"
          >
            <Wind className="w-5 h-5" />
            ابدأ دقيقة الشحن
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 underline decoration-slate-600"
          >
            تخطي والعودة
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
