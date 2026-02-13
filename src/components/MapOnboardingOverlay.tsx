import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mapCopy } from "../copy/map";
import { setOnboardingSeen } from "../utils/mapOnboarding";
import { EditableText } from "./EditableText";

interface MapOnboardingOverlayProps {
  onClose: () => void;
}

export const MapOnboardingOverlay: FC<MapOnboardingOverlayProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);

  const handleFinish = () => {
    setOnboardingSeen();
    onClose();
  };

  const steps = [
    { id: 1, text: mapCopy.onboardingStep1 },
    { id: 2, text: mapCopy.onboardingStep2 }
  ];

  const current = steps.find((s) => s.id === step)!;
  const isLast = step === 2;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 text-right"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="onboarding-title" className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          {step === 1 ? (
            <EditableText id="map_onboarding_title_1" defaultText="أهلاً بيك في خريطة مداراتك" page="map" showEditIcon={false} />
          ) : (
            <EditableText id="map_onboarding_title_2" defaultText="المدارات وإحساسك" page="map" showEditIcon={false} />
          )}
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={current.id}
            className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            <EditableText
              id={current.id === 1 ? "map_onboarding_step_1" : "map_onboarding_step_2"}
              defaultText={current.text}
              page="map"
              multiline
              showEditIcon={false}
            />
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-3 justify-end">
          {!isLast ? (
            <motion.button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full bg-teal-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              whileTap={{ scale: 0.98 }}
            >
              <EditableText id="map_onboarding_next" defaultText="التالي" page="map" editOnClick={false} />
            </motion.button>
          ) : null}
          {isLast ? (
            <motion.button
              type="button"
              onClick={handleFinish}
              className="rounded-full bg-teal-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              whileTap={{ scale: 0.98 }}
            >
              <EditableText id="map_onboarding_cta" defaultText={mapCopy.onboardingCta} page="map" editOnClick={false} />
            </motion.button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};
