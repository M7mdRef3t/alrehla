import type { FC } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEmergencyState } from "../state/emergencyState";
import { emergencyCopy } from "../copy/emergency";

export interface EmergencyOverlayProps {
  /** عند الضغط على «تمرين تنفس» — إن وُجد يُستدعى ثم يُغلق الـ overlay */
  onStartBreathing?: () => void;
  /** عند الضغط على «سيناريو رد احترافي» — إن وُجد يُستدعى ثم يُغلق الـ overlay */
  onStartScenario?: () => void;
}

export const EmergencyOverlay: FC<EmergencyOverlayProps> = ({
  onStartBreathing,
  onStartScenario
}) => {
  const close = useEmergencyState((s) => s.close);

  const handleBreathing = () => {
    onStartBreathing?.();
    close();
  };

  const handleScenario = () => {
    onStartScenario?.();
    close();
  };

  const showRoomActions = onStartBreathing != null || onStartScenario != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-lg px-4"
      onClick={close}
      aria-labelledby="emergency-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="relative bg-transparent max-w-md w-full text-center"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={close}
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
        <h2
          id="emergency-title"
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          غرفة الطوارئ
        </h2>
        <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-10">
          وقف. خد نفس. مش دورك دلوقتي.
        </p>

        {showRoomActions && (
          <div className="flex flex-col gap-4 mb-10">
            {onStartBreathing && (
              <button
                type="button"
                className="w-full rounded-2xl bg-rose-500 text-white px-8 py-5 text-lg font-semibold shadow-lg hover:bg-rose-600 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-red-950"
                onClick={handleBreathing}
                aria-label="تمرين تنفس دقيقة"
              >
                تمرين تنفس (دقيقة)
              </button>
            )}
            {onStartScenario && (
              <button
                type="button"
                className="w-full rounded-2xl bg-white/15 text-white border-2 border-white/40 px-8 py-5 text-lg font-semibold hover:bg-white/25 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-red-950"
                onClick={handleScenario}
                aria-label="سيناريو رد احترافي"
              >
                سيناريو رد احترافي
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          className="rounded-full bg-rose-400 text-white px-10 py-4 text-base font-semibold shadow-sm hover:bg-rose-500 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-red-950"
          onClick={close}
          title="خروج هادي"
          aria-label="خروج هادي"
        >
          {emergencyCopy.exit}
        </button>
        {emergencyCopy.supportLines.length > 0 && (
          <div className="mt-10 pt-8 border-t border-white/20 text-right">
            <h3 className="text-lg font-semibold text-white mb-3">
              {emergencyCopy.supportTitle}
            </h3>
            <ul className="space-y-3">
              {emergencyCopy.supportLines.map((line) => (
                <li key={line.phone} className="text-white/90 text-sm">
                  <span className="font-medium">{line.name}</span>
                  {" — "}
                  <a
                    href={`tel:${line.phone}`}
                    className="text-teal-300 hover:text-teal-200 underline"
                  >
                    {line.phone}
                  </a>
                  <span className="block text-white/70 text-xs mt-0.5">
                    {line.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
};
