import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ════════════════════════════════════════════════
   JOURNEY TOAST — رسالة طمأنة
   بلا جرس، بلا إزعاج — نبضة هادية بس
   ════════════════════════════════════════════════ */

export type JourneyToastVariant =
  | "onboarding_complete"   /* بعد إتمام الـ onboarding */
  | "archive"               /* بعد إرسال شخص لمحطات عدت */
  | "weekly_gratitude"      /* الإشعار الأسبوعي */
  | "map_revisit"          /* ذكرى اليوم */
  | "nudge";                /* تنبيه ذكي من المحرك */

interface JourneyToastProps {
  variant: JourneyToastVariant;
  personName?: string;   /* لـ archive variant */
  nudgeData?: { title: string; message: string; icon: string; cta?: string };
  visible: boolean;
  onClose?: () => void;
}

/* ── Feather / light-pulse icon ── */
const FeatherIcon: FC = () => (
  <svg
    width="18" height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="15" />
  </svg>
);

/* ── Toast content per variant ── */
const TOAST_CONTENT: Record<
  JourneyToastVariant,
  { title: string; body: (name?: string) => string; cta?: string }
> = {
  onboarding_complete: {
    title: "خطوة شجاعة..",
    body: () =>
      "رسم أول خريطة هو أصعب جزء، وإنت عملته. دوايرك دلوقتي جاهزة تسندك في رحلتك.",
    cta: "استكشف مساحتك",
  },
  archive: {
    title: "مساحة جديدة بتنور..",
    body: (name) =>
      name
        ? `نقل "${name}" لمحطات عدت بيخلي حملك أخف. إنت بتعمل مساحة للي يستاهل يكون في دوايرك فعلاً.`
        : "الخريطة بقت أخف دلوقتي. خد نَفَس.",
  },
  weekly_gratitude: {
    title: "الرحلة مستمرة..",
    body: () =>
      "بقالك وقت بتهتم بدوايرك. ده لوحده إنجاز — التعافي مش سحر، هو المتابعة الواعية دي.",
  },
  map_revisit: {
    title: "لسه فاكر خريطتك؟",
    body: () =>
      "التعافي مش سحر، هو متابعة واعية للي بيحصل جوانا. يمكن محتاج تحرك حد من مكانه النهاردة؟",
  },
  nudge: {
    title: "",
    body: () => "",
  },
};

export const JourneyToast: FC<JourneyToastProps> = ({
  variant,
  personName,
  nudgeData,
  visible,
  onClose,
}) => {
  const content = variant === "nudge" && nudgeData
    ? { title: nudgeData.title, body: () => nudgeData.message, cta: nudgeData.cta }
    : TOAST_CONTENT[variant];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] md:bottom-6 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm"
          style={{ translateX: "-50%" }}
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          dir="rtl"
        >
          <div
            className="rounded-2xl px-4 py-4 flex items-start gap-3"
            style={{
              background: "rgba(13,19,36,0.95)",
              border: "1px solid rgba(45,212,191,0.22)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(45,212,191,0.06)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {/* Icon — feather / light pulse */}
            <div
              className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "rgba(45,212,191,0.12)",
                border: "1px solid rgba(45,212,191,0.25)",
                color: "rgba(45,212,191,0.85)",
              }}
            >
              {variant === "nudge" && nudgeData ? (
                <span className="text-sm">{nudgeData.icon}</span>
              ) : (
                <FeatherIcon />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-bold mb-1"
                style={{ color: "rgba(45,212,191,0.9)" }}
              >
                {content.title}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(203,213,225,0.85)" }}
              >
                {content.body(personName)}
              </p>
              {content.cta && (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 text-xs font-semibold transition-colors"
                  style={{ color: "rgba(45,212,191,0.7)" }}
                >
                  {content.cta} ←
                </button>
              )}
            </div>

            {/* Dismiss */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors mt-0.5"
                style={{ color: "rgba(148,163,184,0.5)" }}
                aria-label="إغلاق"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
