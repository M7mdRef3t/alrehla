import type { FC } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Shield, Lock, Heart, Loader, Sparkles } from "lucide-react";
import { signInWithGoogle } from "../services/authService";
import { AnalyticsEvents, trackEvent } from "../services/analytics";
import { isSupabaseReady } from "../services/supabaseClient";
import type { PulseEnergyConfidence, PulseFocus, PulseMood } from "../state/pulseState";
import { GoogleMark } from "./GoogleMark";
import { clearPostAuthIntent, setPostAuthIntent, type PostAuthIntent } from "../utils/postAuthIntent";

interface GoogleAuthModalProps {
  isOpen: boolean;
  intent: PostAuthIntent;
  onClose: () => void;
  onGuestMode?: () => void;
  /** يُستدعى عند "مش دلوقتي" — يُمرّر pulse للحفظ المحلي (Guest Mode) */
  onNotNow?: (pulseToSave?: {
    energy: number;
    mood: PulseMood;
    focus: PulseFocus;
    auto?: boolean;
    notes?: string;
    energyReasons?: string[];
    energyConfidence?: PulseEnergyConfidence;
  }) => void;
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
  sad: "حزين",
  tense: "متوتر",
  hopeful: "متفائل",
  overwhelmed: "مرهق"
};

function getFocusLabel(focus: PulseFocus, intent: PostAuthIntent): string {
  if (focus === "event") return "موقف حصل";
  if (focus === "thought") return "فكرة مش بتروح";
  if (focus === "body") return "جسدي تعبان";
  return intent.kind === "start_recovery" ? "ولا حاجة، جاي أكتشف" : "ولا حاجة، جاي أكمل";
}

function getAuthTitle(intent: PostAuthIntent): string {
  if (intent.kind === "ai_focus") return "الذكاء محتاج سحابة يشوفك بوضوح";
  if (intent.kind !== "start_recovery") return "أهلاً بيك في الرحلة";
  const { mood, energy } = intent.pulse;
  const negativeMood = mood === "sad" || mood === "anxious" || mood === "angry" || mood === "tense" || mood === "overwhelmed";
  if (negativeMood) return "قرايتك وصلت، واحنا مقدرينها";
  const isPositive = mood === "bright" || mood === "calm" || mood === "hopeful" || energy >= 6;
  if (isPositive) return "قرايتك جميلة جداً!";
  return "يلا نحفظ اللحظة دي";
}

export const GoogleAuthModal: FC<GoogleAuthModalProps> = ({
  isOpen,
  intent,
  onClose,
  onGuestMode,
  onNotNow
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(false);
    setMessage(null);
    setError(null);
    setIsAgeVerified(false);
    trackEvent(AnalyticsEvents.AUTH_MODAL_SHOWN, { trigger: intent.kind });
  }, [isOpen, intent.kind]);

  const handleGoogle = async () => {
    if (!isAgeVerified) {
      setError("أكّد أن عمرك +18 للمتابعة.");
      return;
    }

    if (!isSupabaseReady) {
      setError("Google login is currently unavailable. Continue as guest or configure Supabase OAuth.");
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
      const providerUnavailable = /Unsupported provider/i.test(text) || /provider is not enabled/i.test(text);
      if (providerUnavailable) {
        setError("خدمة جوجل مؤقتاً متوقفة. جرّب تاني بعد شوية.");
      } else {
        setError("حصلت مشكلة في الاتصال. جرّب تاني.");
      }
      setLoading(false);
      return;
    }

    setMessage("تمام... بنحوّلك على Google.");
    setLoading(false);
  };

  const handleNotNow = () => {
    if (intent.kind === "start_recovery" && onNotNow) {
      onNotNow(intent.pulse);
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── backdrop — dark cosmic blur ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90]"
            style={{
              background: "rgba(10, 14, 31, 0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
            onClick={onClose}
          />

          {/* ── modal ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.35, type: "spring", stiffness: 280, damping: 24 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[95] max-w-md mx-auto overflow-hidden"
            style={{
              background: "rgba(15, 22, 41, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "1.5rem",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(45, 212, 191, 0.06)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="تسجيل الدخول"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── header ── */}
            <div
              className="relative p-6 sm:p-5 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(45, 212, 191, 0.12) 0%, rgba(245, 166, 35, 0.08) 100%)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              {/* subtle glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)" }}
              />

              <div className="relative flex items-start justify-between gap-3">
                <div className="text-right flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" style={{ color: "#2dd4bf" }} />
                    <h2 className="text-lg font-bold text-white">
                      {getAuthTitle(intent)}
                    </h2>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(203, 213, 225, 0.8)" }}>
                    {intent.kind === "start_recovery"
                      ? "سجل دخول عشان نحفظها ونكمل رحلتك سوا"
                      : intent.kind === "ai_focus"
                        ? "سجل دخول بحساب جوجل عشان تفعّل ذكاء المدار"
                        : "سجل دخول بحساب جوجل عشان نحفظ تقدمك"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" style={{ color: "rgba(203, 213, 225, 0.7)" }} />
                </button>
              </div>
            </div>

            {/* ── body ── */}
            <div className="p-6 sm:p-5 space-y-4 text-right">

              {/* trust signals */}
              <div className="flex items-center justify-center gap-5">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" style={{ color: "#2dd4bf" }} />
                  <span className="text-[12px] font-medium" style={{ color: "rgba(45, 212, 191, 0.8)" }}>اتصال آمن</span>
                </div>
                <div
                  className="w-px h-3"
                  style={{ background: "rgba(255, 255, 255, 0.1)" }}
                />
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
                  <span className="text-[12px] font-medium" style={{ color: "rgba(251, 191, 36, 0.8)" }}>بياناتك محمية ومش بتتشارك</span>
                </div>
              </div>

              {/* pulse data (recovery intent) */}
              {intent.kind === "start_recovery" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(45, 212, 191, 0.1)",
                        border: "1px solid rgba(45, 212, 191, 0.2)",
                      }}
                    >
                      <Heart className="w-4 h-4" style={{ color: "#2dd4bf" }} />
                    </div>
                    <p className="text-[14px] font-semibold text-white">قراءتك اللحظية</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "البطارية", value: `${valueToLabel(intent.pulse.energy)} (${intent.pulse.energy}/10)` },
                      { label: "الطقس", value: MOOD_LABEL[intent.pulse.mood] },
                      { label: "التركيز", value: getFocusLabel(intent.pulse.focus, intent) },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between text-[13px]">
                        <span style={{ color: "rgba(148, 163, 184, 0.7)" }}>{row.label}</span>
                        <span className="font-semibold text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Age Verification Checkbox */}
              <div
                onClick={() => setIsAgeVerified(!isAgeVerified)}
                className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5 border border-transparent hover:border-white/10"
              >
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${isAgeVerified
                  ? "bg-teal-500 border-teal-500"
                  : "border-slate-500 bg-slate-800/50"
                  }`}>
                  {isAgeVerified && <Sparkles className="w-3 h-3 text-white" />}
                </div>
                <p className="text-[13px] text-slate-300 leading-snug select-none">
                  أقر بأن عمري <span className="text-teal-400 font-bold">18 عاماً أو أكثر</span>، وأنني مسؤول مسؤولية كاملة عن قراراتي داخل غرفة العمليات.
                </p>
              </div>

              {/* Google sign-in button */}
              <motion.button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "#1a1a2e",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                }}
                whileHover={!loading ? { y: -1, boxShadow: "0 8px 28px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)" } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader className="w-5 h-5" style={{ color: "#1a1a2e" }} />
                    </motion.div>
                    <span>بنوصل بجوجل...</span>
                  </>
                ) : (
                  <>
                    <GoogleMark className="w-5 h-5" />
                    <span>تسجيل الدخول بجوجل</span>
                  </>
                )}
              </motion.button>

              {!isSupabaseReady && onGuestMode && (
                <motion.button
                  type="button"
                  onClick={onGuestMode}
                  className="w-full inline-flex items-center justify-center rounded-xl px-6 py-3 text-[14px] font-medium transition-all duration-200"
                  style={{
                    background: "rgba(244, 63, 94, 0.08)",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    color: "rgba(251, 113, 133, 0.95)",
                  }}
                  whileHover={{ background: "rgba(244, 63, 94, 0.12)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span style={{ fontSize: "14px", lineHeight: 1.2 }}>
                    Login is unavailable right now.
                  </span>
                </motion.button>
              )}

              {/* privacy note */}
              <div
                className="rounded-xl p-3.5"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(148, 163, 184, 0.65)" }}>
                  <span className="font-semibold" style={{ color: "rgba(203, 213, 225, 0.85)" }}>خصوصيتنا:</span>{" "}
                  بنستخدم تسجيل الدخول بس عشان نحفظ قرايتك وتقدمك. مفيش نشر أو مشاركة بياناتك مع حد.
                </p>
              </div>

              {/* not now button */}
              <motion.button
                type="button"
                onClick={handleNotNow}
                className="w-full inline-flex items-center justify-center rounded-xl px-6 py-3 text-[14px] font-medium transition-all duration-200"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "rgba(203, 213, 225, 0.7)",
                }}
                whileHover={{ background: "rgba(255, 255, 255, 0.07)" }}
                whileTap={{ scale: 0.98 }}
              >
                مش دلوقتي
              </motion.button>

              {/* error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3.5"
                  style={{
                    background: "rgba(248, 113, 113, 0.08)",
                    border: "1px solid rgba(248, 113, 113, 0.2)",
                  }}
                >
                  <p className="text-[13px]" style={{ color: "#f87171" }}>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* success message */}
              {message && !error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-3.5"
                  style={{
                    background: "rgba(45, 212, 191, 0.08)",
                    border: "1px solid rgba(45, 212, 191, 0.2)",
                  }}
                >
                  <p className="text-[13px]" style={{ color: "#2dd4bf" }}>
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
