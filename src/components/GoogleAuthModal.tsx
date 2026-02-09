import type { FC } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { signInWithGoogle } from "../services/authService";
import { AnalyticsEvents, trackEvent } from "../services/analytics";
import { isSupabaseReady } from "../services/supabaseClient";
import type { PulseFocus, PulseMood } from "../state/pulseState";
import { GoogleMark } from "./GoogleMark";
import { clearPostAuthIntent, setPostAuthIntent, type PostAuthIntent } from "../utils/postAuthIntent";

interface GoogleAuthModalProps {
  isOpen: boolean;
  intent: PostAuthIntent;
  onClose: () => void;
  onNotNow?: () => void;
}

function valueToLabel(value: number): string {
  if (value <= 2) return "خفيف";
  if (value <= 4) return "مقبول";
  if (value <= 6) return "تقيل";
  if (value <= 8) return "مجهد";
  return "حرج";
}

const MOOD_LABEL: Record<PulseMood, string> = {
  bright: "رايق",
  calm: "هادئ",
  anxious: "قلقان",
  angry: "غضبان",
  sad: "حزين"
};

const FOCUS_LABEL: Record<PulseFocus, string> = {
  event: "موقف حصل",
  thought: "فكرة مش بتروح",
  body: "جسدي تعبان",
  none: "ولا حاجة، جاي أكمل"
};

export const GoogleAuthModal: FC<GoogleAuthModalProps> = ({
  isOpen,
  intent,
  onClose,
  onNotNow
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(false);
    setMessage(null);
  }, [isOpen]);

  const handleGoogle = async () => {
    if (!isSupabaseReady) {
      setMessage("تسجيل الدخول غير متاح حاليًا.");
      return;
    }

    setLoading(true);
    setMessage(null);
    trackEvent(AnalyticsEvents.AUTH_GOOGLE_CLICKED, {
      source: intent.kind === "start_recovery" ? "micro_commitment" : "login_icon",
      ...(intent.kind === "start_recovery"
        ? {
            pulse_energy: intent.pulse.energy,
            pulse_mood: intent.pulse.mood,
            pulse_focus: intent.pulse.focus,
            pulse_auto: intent.pulse.auto ?? false
          }
        : {})
    });
    setPostAuthIntent(intent);

    const { error } = await signInWithGoogle();
    if (error) {
      clearPostAuthIntent();
      const raw = (error as { message?: unknown })?.message;
      const text = typeof raw === "string" ? raw : "";
      if (/Unsupported provider/i.test(text) || /provider is not enabled/i.test(text)) {
        setMessage("Google OAuth مش مفعّل في Supabase. فعّل Provider: Authentication → Providers → Google.");
      } else {
        setMessage("تعذّر فتح بوابة جوجل. راجع إعدادات OAuth ونكمل.");
      }
      setLoading(false);
      return;
    }

    setMessage("تمام... بنحوّلك على Google.");
    setLoading(false);
  };

  const handleNotNow = () => {
    if (intent.kind === "start_recovery" && onNotNow) {
      onNotNow();
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[95] max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="تسجيل الدخول"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {intent.kind === "start_recovery" ? "وصلت القراية" : "سجل دخول"}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {intent.kind === "start_recovery"
                    ? "سجل دخول بلمسة واحدة عشان نحفظ قرايتك ونبدأ."
                    : "الدخول بجوجل يحفظ تقدمك ويربطه بالسحابة."}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-right">
              {intent.kind === "start_recovery" && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2">
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">قراءتك اللحظية</p>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    البطارية: {valueToLabel(intent.pulse.energy)}{" "}
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">({intent.pulse.energy}/10)</span>
                  </p>
                  <p className="text-[12px] text-slate-700 dark:text-slate-300 mt-1">
                    الطقس: <span className="font-semibold text-slate-800 dark:text-slate-200">{MOOD_LABEL[intent.pulse.mood]}</span>
                  </p>
                  <p className="text-[12px] text-slate-700 dark:text-slate-300">
                    التركيز: <span className="font-semibold text-slate-800 dark:text-slate-200">{FOCUS_LABEL[intent.pulse.focus]}</span>
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
              >
                <GoogleMark className="w-4 h-4" />
                Continue with Google
              </button>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                خصوصية: بنستخدم تسجيل الدخول بس عشان نحفظ قرايتك وتقدمك. مفيش نشر.
              </p>

              <button
                type="button"
                onClick={handleNotNow}
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                مش دلوقتي
              </button>

              {message && (
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
