import type { FC } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Shield, Lock, Heart, Loader, Check, Fingerprint } from "lucide-react";
import { signInWithGoogle, signInWithPhone, verifyOtp } from "@/services/authService";
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";
import { isSupabaseReady } from "@/services/supabaseClient";
import type { PulseEnergyConfidence, PulseFocus, PulseMood } from "@/domains/consciousness/store/pulse.store";
import { GoogleMark } from '@/modules/meta/GoogleMark';
import { clearPostAuthIntent, setPostAuthIntent, type PostAuthIntent } from "@/utils/postAuthIntent";
import { Phone, ChevronLeft, ArrowRight } from "lucide-react";

interface GoogleAuthModalProps {
  isOpen: boolean;
  intent?: PostAuthIntent;
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

type AuthMode = "google" | "phone";
type PhoneStep = "input" | "otp" | "info";

export const GoogleAuthModal: FC<GoogleAuthModalProps> = ({
  isOpen,
  intent,
  onClose,
  onGuestMode,
  onNotNow
}) => {
  const resolvedIntent: PostAuthIntent = intent ?? { kind: "login", createdAt: Date.now() };
  const [mode, setMode] = useState<AuthMode>("google");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("input");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
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
    setMode("google");
    setPhoneStep("input");
    setPhone("");
    setOtp("");
    setName("");
    analyticsService.auth(AnalyticsEvents.AUTH_MODAL_SHOWN, { trigger: resolvedIntent.kind });
  }, [isOpen, resolvedIntent.kind]);

  const handleGoogle = async () => {
    if (!isAgeVerified) {
      setError("أكّد أن عمرك +18 للمتابعة.");
      return;
    }

    if (!isSupabaseReady) {
      setError("خدمة جوجل غير متاحة حالياً.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);
    analyticsService.auth(AnalyticsEvents.AUTH_GOOGLE_CLICKED, {
      source: resolvedIntent.kind === "start_recovery" ? "micro_commitment" : "login_icon",
    });
    setPostAuthIntent(resolvedIntent);

    const { error: signInError } = await signInWithGoogle();
    if (signInError) {
      clearPostAuthIntent();
      setError("حصلت مشكلة في الاتصال بجوجل. جرّب تاني.");
      setLoading(false);
      return;
    }

    setMessage("تمام... بنحوّلك على Google.");
    setLoading(false);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgeVerified) {
      setError("أكّد أن عمرك +18 للمتابعة.");
      return;
    }
    if (phone.length < 8) {
      setError("برجاء إدخال رقم تليفون صحيح.");
      return;
    }

    setLoading(true);
    setError(null);
    analyticsService.auth(AnalyticsEvents.AUTH_PHONE_CLICKED);

    const { error: signInError } = await signInWithPhone(phone);
    if (signInError) {
      setError("مش عارفين نبعت الكود حالياً. اتأكد من الرقم وجرّب تاني.");
      setLoading(false);
      return;
    }

    analyticsService.auth(AnalyticsEvents.AUTH_PHONE_OTP_SENT);
    setPhoneStep("otp");
    setLoading(false);
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;

    setLoading(true);
    setError(null);

    const { data: sessionData, error: verifyError } = await verifyOtp(phone, otp);
    if (verifyError) {
      setError("الكود ده غلط أو انتهت صلاحيته. جرّب تاني.");
      setLoading(false);
      return;
    }

    analyticsService.auth(AnalyticsEvents.AUTH_PHONE_OTP_VERIFIED);
    analyticsService.auth(AnalyticsEvents.AUTH_COMPLETED, { method: "phone" });
    setMessage("تم الدخول بنجاح!");
    onClose();
  };

  const handleNotNow = () => {
    if (resolvedIntent.kind === "start_recovery" && onNotNow) {
      onNotNow(resolvedIntent.pulse);
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
                    {/* ليه موجود؟ أيقونة البصمة بتوصل معنى "تحقّق الهوية" بشكل أوضح في تسجيل الدخول. Time Complexity: O(1) */}
                    <Fingerprint className="w-4 h-4" style={{ color: "#2dd4bf" }} />
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: '"Noto Kufi Arabic"' }}>
                      {getAuthTitle(resolvedIntent)}
                    </h2>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(203, 213, 225, 0.8)" }}>
                    {resolvedIntent.kind === "start_recovery"
                      ? "سجل دخول عشان نحفظها ونكمل رحلتك سوا"
                      : resolvedIntent.kind === "ai_focus"
                        ? "سجل دخول بحساب جوجل عشان تفعّل ذكاء المدار"
                        : "سجل دخول بحساب جوجل عشان نحفظ تقدمك"}
                  </p>
                </div>
                {/* ليه موجود؟ ضمان ظهور زر الإغلاق حتى لو SVG فشل في الرندر. Time Complexity: O(1) */}
                <button
                  type="button"
                  onClick={onClose}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                  aria-label="إغلاق"
                >
                  <X
                    className="w-4 h-4"
                    strokeWidth={2.25}
                    style={{ color: "rgba(203, 213, 225, 0.9)" }}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute text-lg leading-none font-semibold pointer-events-none"
                    style={{ color: "rgba(203, 213, 225, 0.9)" }}
                    aria-hidden="true"
                  >
                    ×
                  </span>
                </button>
              </div>
            </div>

            {/* ── body ── */}
            <div className="p-6 sm:p-5 space-y-4 text-right">

              {/* Back Button (Only for Phone mode) */}
              {mode === "phone" && (
                <button
                  type="button"
                  onClick={() => {
                    if (phoneStep === "otp") setPhoneStep("input");
                    else setMode("google");
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:text-white"
                  style={{ color: "rgba(203, 213, 225, 0.6)" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>رجوع</span>
                </button>
              )}

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
                  <span className="text-[12px] font-medium" style={{ color: "rgba(251, 191, 36, 0.8)" }}>بياناتك محمية</span>
                </div>
              </div>

              {/* pulse data (recovery intent) */}
              {resolvedIntent.kind === "start_recovery" && mode === "google" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
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
                      { label: "البطارية", value: `${valueToLabel(resolvedIntent.pulse.energy)} (${resolvedIntent.pulse.energy}/10)` },
                      { label: "الطقس", value: MOOD_LABEL[resolvedIntent.pulse.mood] },
                      { label: "التركيز", value: getFocusLabel(resolvedIntent.pulse.focus, resolvedIntent) },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between text-[13px]">
                        <span style={{ color: "rgba(148, 163, 184, 0.7)" }}>{row.label}</span>
                        <span className="font-semibold text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Age Verification Checkbox (Visible in start screens) */}
              {(mode === "google" || (mode === "phone" && phoneStep === "input")) && (
                <div
                  onClick={() => setIsAgeVerified(!isAgeVerified)}
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all ${isAgeVerified
                    ? "bg-teal-500 border-teal-500"
                    : "border-slate-500 bg-slate-800/50"
                    }`}>
                    {/* ليه موجود؟ علامة صح أوضح لتأكيد الاختيار بدل أيقونة النجوم. Time Complexity: O(1) */}
                    {isAgeVerified && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <p className="text-[13px] text-slate-300 leading-snug select-none">
                    أقر بأن عمري <span className="text-teal-400 font-bold">18 عاماً أو أكثر</span>
                  </p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {mode === "google" ? (
                  <motion.div
                    key="google"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <motion.button
                      type="button"
                      onClick={handleGoogle}
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-[15px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "rgba(255, 255, 255, 0.95)",
                        color: "#1a1a2e",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                      }}
                      whileHover={!loading ? { y: -1 } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                    >
                      {loading ? <Loader className="w-5 h-5 animate-spin" /> : <GoogleMark className="w-5 h-5" />}
                      <span>دخول بجوجل</span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => setMode("phone")}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-[14px] font-medium transition-all duration-200"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "rgba(255, 255, 255, 0.9)",
                      }}
                    >
                      <Phone className="w-4 h-4" />
                      <span>تسجيل دخول بالموبايل</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {phoneStep === "input" ? (
                      <form onSubmit={handlePhoneSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[13px] text-slate-400 block px-1">رقم موبايلك (مصر)</label>
                          <div className="relative">
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="01xxxxxxxxx"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg ltr placeholder:text-slate-600 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all outline-none"
                              autoFocus
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium ltr">
                              +20
                            </div>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={loading || phone.length < 8}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold bg-teal-500 text-white transition-all hover:bg-teal-400 disabled:opacity-50"
                        >
                          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <span>ابعت كود الدخول</span>}
                          {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                      </form>
                    ) : phoneStep === "otp" ? (
                      <form onSubmit={handleOtpVerify} className="space-y-4">
                        <div className="space-y-2 text-center">
                          <p className="text-[13px] text-slate-400">كتبنا الكود اللي وصلك على {phone}</p>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="------"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-3xl font-bold tracking-[0.5em] text-center placeholder:text-slate-700 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all outline-none"
                            autoFocus
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading || otp.length < 6}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[15px] font-semibold bg-teal-500 text-white transition-all hover:bg-teal-400 disabled:opacity-50"
                        >
                          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <span>تأكيد الدخول</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhoneStep("input")}
                          className="w-full text-[12px] text-teal-400/70 hover:text-teal-400 transition-colors"
                        >
                          تعديل الرقم؟
                        </button>
                      </form>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* notification area for errors/success */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                      <p className="text-[12px] text-red-400">{error}</p>
                    </div>
                  </motion.div>
                )}
                {message && !error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl p-3 bg-teal-500/10 border border-teal-500/20">
                      <p className="text-[12px] text-teal-400">{message}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* privacy note (Only in main screen) */}
              {mode === "google" && (
                <div
                  className="rounded-xl p-3.5"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(148, 163, 184, 0.65)" }}>
                    <span className="font-semibold" style={{ color: "rgba(203, 213, 225, 0.85)" }}>خصوصيتنا:</span>{" "}
                    بنستخدم تسجيل الدخول بس عشان نحفظ قرايتك وتقدمك.
                  </p>
                </div>
              )}

              {/* not now button (Only in main screen) */}
              {mode === "google" && (
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
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


