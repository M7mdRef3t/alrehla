import type { FC } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Shield, Users, Heart, Loader } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(false);
    setMessage(null);
    setError(null);
  }, [isOpen]);

  const handleGoogle = async () => {
    if (!isSupabaseReady) {
      setError("تسجيل الدخول غير متاح حاليًا.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);
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

    const { error: signInError } = await signInWithGoogle();
    if (signInError) {
      clearPostAuthIntent();
      const raw = (signInError as { message?: unknown })?.message;
      const text = typeof raw === "string" ? raw : "";
      if (/Unsupported provider/i.test(text) || /provider is not enabled/i.test(text)) {
        setError("خدمة جوجل مؤقتاً متوقفة. جرب تاني بعد شوية.");
      } else {
        setError("حصلت مشكلة في الاتصال. جرب تاني.");
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
            className="fixed inset-0 z-[90] bg-gradient-to-br from-blue-50/95 to-teal-50/95 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[95] max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="تسجيل الدخول"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right flex-1">
                  <h2 className="text-xl sm:text-lg font-bold text-white">
                    {intent.kind === "start_recovery" ? "قرايتك جميلة جداً! 💙" : "أهلاً بيك في الرحلة 🌟"}
                  </h2>
                  <p className="text-sm sm:text-xs text-white/90 mt-2 leading-relaxed">
                    {intent.kind === "start_recovery"
                      ? "سجل دخول عشان نحفظها ونكمل رحلتك سوا"
                      : "سجل دخول بحساب جوجل عشان نحفظ تقدمك"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 sm:w-8 sm:h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-4 space-y-4 text-right">
              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 text-xs text-green-600 dark:text-green-400">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>اتصال آمن</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>1000+ مستخدم</span>
                </div>
              </div>

              {intent.kind === "start_recovery" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">قراءتك اللحظية</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">البطارية:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {valueToLabel(intent.pulse.energy)} ({intent.pulse.energy}/10)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">الطقس:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{MOOD_LABEL[intent.pulse.mood]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">التركيز:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{FOCUS_LABEL[intent.pulse.focus]}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Google button with enhanced design */}
              <motion.button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 sm:py-3 text-base sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5"
                    >
                      <Loader className="w-full h-full text-white" />
                    </motion.div>
                    <span>بنوصل بجوجل...</span>
                  </>
                ) : (
                  <>
                    <GoogleMark className="w-5 h-4" />
                    <span>تسجيل الدخول بجوجل</span>
                  </>
                )}
              </motion.button>

              {/* Privacy note with better design */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">خصوصيتنا:</span> بنستخدم تسجيل الدخول بس عشان نحفظ قرايتك وتقدمك. مفيش نشر أو مشاركة بياناتك مع حد.
                </p>
              </div>

              {/* Not now button */}
              <motion.button
                type="button"
                onClick={handleNotNow}
                className="w-full inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-3 sm:py-2.5 text-sm sm:text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                مش دلوقتي
              </motion.button>

              {/* Error message with better design */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3"
                >
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Success message */}
              {message && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3"
                >
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {message}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
