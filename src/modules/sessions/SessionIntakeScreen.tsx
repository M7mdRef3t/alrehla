"use client";

import { memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Compass,
  User,
  Phone,
  Mail,
  Globe,
  Calendar,
  MessageCircle,
  Heart,
  AlertTriangle,
  Target,
  Clock,
  Shield,
  Zap as Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useSessionIntake } from "@/domains/sessions/hooks/useSessionIntake";
import { SESSION_GOAL_OPTIONS, COUNTRIES, PREVIOUS_SESSION_OPTIONS } from "@/domains/sessions/constants";
import { eventBus } from "@/shared/events/bus";
import type { IntakeStep } from "@/domains/sessions/types";


/* ─── Step Progress ──────────────────────────── */

const STEPS: { key: IntakeStep; label: string; icon: React.ReactNode }[] = [
  { key: "welcome", label: "الترحيب", icon: <Compass className="w-4 h-4" /> },
  { key: "basic", label: "بيانات أساسية", icon: <User className="w-4 h-4" /> },
  { key: "reason", label: "السبب", icon: <Heart className="w-4 h-4" /> },
  { key: "context", label: "السياق", icon: <Clock className="w-4 h-4" /> },
  { key: "safety", label: "الأمان", icon: <Shield className="w-4 h-4" /> },
];

function StepIndicator({ currentStep }: { currentStep: IntakeStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);
  if (currentStep === "success") return null;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, idx) => (
        <div
          key={s.key}
          className="flex items-center gap-1.5"
        >
          <div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
              ${idx < currentIdx
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : idx === currentIdx
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 ring-2 ring-indigo-500/20"
                  : "bg-white/5 text-white/20 border border-white/10"
              }
            `}
          >
            {idx < currentIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.icon}
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`w-6 h-px transition-colors duration-500 ${idx < currentIdx ? "bg-emerald-500/40" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Reusable Form Fields ───────────────────── */

function FormField({
  label,
  icon,
  children,
  hint,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-bold text-white/70">
        {icon}
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/30 pr-6">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  dir = "rtl",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  dir?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      dir="rtl"
      className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
    />
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir="rtl"
      className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all appearance-none"
    >
      <option value="" disabled className="bg-[#0a0a0f] text-white/40">
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0a0a0f] text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ─── Step Screens ───────────────────────────── */

const fadeSlide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.25 } },
};

/* ─── Main Component ─────────────────────────── */

interface SessionIntakeScreenProps {
  onBack: () => void;
}

export const SessionIntakeScreen = memo(function SessionIntakeScreen({
  onBack,
}: SessionIntakeScreenProps) {
  const {
    step,
    formData,
    isSubmitting,
    updateField,
    goBack,
    goNext,
    submitIntake,
    canProceedFromBasic,
    canProceedFromReason,
    canProceedFromContext,
    canSubmitSafety,
    isDiagnosisSynced,
  } = useSessionIntake();


  const handleSubmit = async () => {
    const success = await submitIntake();
    if (success) {
      eventBus.emit("session:intake_completed", {});
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-y-auto"
      dir="rtl"
      style={{
        background: "linear-gradient(135deg, #030308 0%, #0a0a1a 40%, #0d0520 100%)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 20%, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top bar */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-black/40 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={step === "welcome" ? onBack : goBack}
            className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm group"
          >
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{step === "welcome" ? "العودة" : "السابق"}</span>
          </button>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400/80">
              محطة الجلسة الخاصة
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-8">
        {step !== "success" && <StepIndicator currentStep={step} />}

        <AnimatePresence mode="wait">
          {/* ─── Welcome ─── */}
          {step === "welcome" && (
            <motion.div key="welcome" {...fadeSlide} className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Compass className="w-10 h-10 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  محطة في رحلتك
                </h1>
                <p className="text-white/40 text-sm leading-relaxed max-w-md mx-auto">
                  أحياناً نحتاج رفيق طريق يساعدنا نشوف اللي مش شايفينه.
                  <br />
                  الجلسة الخاصة هي هذه المحطة — مساحة آمنة تكشف لك ما وراء السطح.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                {[
                  { icon: <Shield className="w-5 h-5" />, label: "مساحة آمنة" },
                  { icon: <Target className="w-5 h-5" />, label: "رؤية واضحة" },
                  { icon: <Sparkles className="w-5 h-5" />, label: "تحول حقيقي" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-center"
                  >
                    <div className="text-indigo-400 flex justify-center">{item.icon}</div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => goNext("basic")}
                className="mx-auto flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-[0_0_40px_rgba(99,102,241,0.15)] hover:shadow-[0_0_60px_rgba(99,102,241,0.25)]"
              >
                <span>ابدأ طلب الجلسة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ─── Basic Info ─── */}
          {step === "basic" && (
            <motion.div key="basic" {...fadeSlide} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white">البيانات الأساسية</h2>
                <p className="text-white/30 text-xs mt-1">احكيلنا عن نفسك بشكل مبدئي</p>
              </div>

              <FormField label="الاسم" icon={<User className="w-4 h-4 text-indigo-400" />}>
                <TextInput
                  value={formData.name}
                  onChange={(v) => updateField("name", v)}
                  placeholder="اسمك الأول يكفي"
                />
              </FormField>

              <FormField label="رقم الهاتف" icon={<Phone className="w-4 h-4 text-indigo-400" />}>
                <TextInput
                  value={formData.phone}
                  onChange={(v) => updateField("phone", v)}
                  placeholder="+20 1xx xxxx xxx"
                  type="tel"
                  dir="ltr"
                />
              </FormField>

              <FormField label="البريد الإلكتروني" icon={<Mail className="w-4 h-4 text-indigo-400" />} hint="اختياري">
                <TextInput
                  value={formData.email}
                  onChange={(v) => updateField("email", v)}
                  placeholder="email@example.com"
                  type="email"
                  dir="ltr"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="الدولة" icon={<Globe className="w-4 h-4 text-indigo-400" />}>
                  <SelectField
                    value={formData.country}
                    onChange={(v) => updateField("country", v)}
                    options={[...COUNTRIES]}
                    placeholder="اختر الدولة"
                  />
                </FormField>
                <FormField label="تاريخ الميلاد" icon={<Calendar className="w-4 h-4 text-indigo-400" />} hint="اختياري">
                  <TextInput
                    value={formData.birthDate}
                    onChange={(v) => updateField("birthDate", v)}
                    placeholder=""
                    type="date"
                    dir="ltr"
                  />
                </FormField>
              </div>

              <FormField label="طريقة التواصل المفضلة" icon={<MessageCircle className="w-4 h-4 text-indigo-400" />}>
                <div className="flex gap-3">
                  {["whatsapp", "phone", "email"].map((method) => (
                    <button
                      key={method}
                      onClick={() => updateField("preferredContact", method as "whatsapp" | "phone" | "email")}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                        formData.preferredContact === method
                          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                          : "bg-white/[0.03] border-white/10 text-white/30 hover:text-white/50"
                      }`}
                    >
                      {method === "whatsapp" ? "واتساب" : method === "phone" ? "اتصال" : "إيميل"}
                    </button>
                  ))}
                </div>
              </FormField>

              <div className="pt-4">
                <button
                  onClick={() => goNext("reason")}
                  disabled={!canProceedFromBasic}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Reason ─── */}
          {step === "reason" && (
            <motion.div key="reason" {...fadeSlide} className="space-y-6">
              <div className="text-center mb-8 relative">
                <h2 className="text-2xl font-black text-white">سبب الطلب</h2>
                <p className="text-white/30 text-xs mt-1">ساعدنا نفهم اللي بتمر بيه</p>
                
                {isDiagnosisSynced && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center justify-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mx-auto w-fit"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-black text-cyan-300 uppercase tracking-tighter">Sovereign Intel Synced</span>
                  </motion.div>
                )}
              </div>

              <FormField label="ليه بتطلب جلسة دلوقتي؟" icon={<Heart className="w-4 h-4 text-rose-400" />}>
                <TextArea
                  value={formData.requestReason}
                  onChange={(v) => updateField("requestReason", v)}
                  placeholder="اكتب بحرية... مفيش إجابة غلط هنا"
                  rows={4}
                />
              </FormField>

              <FormField label="إيه اللي خلاها مستعجلة؟" icon={<Clock className="w-4 h-4 text-amber-400" />}>
                <TextArea
                  value={formData.urgencyReason}
                  onChange={(v) => updateField("urgencyReason", v)}
                  placeholder="حصل حاجة معينة؟ ولا تراكم من فترة؟"
                  rows={3}
                />
              </FormField>

              <FormField label="أكبر تحدي بتواجهه دلوقتي" icon={<Target className="w-4 h-4 text-orange-400" />} hint="اختياري">
                <TextArea
                  value={formData.biggestChallenge}
                  onChange={(v) => updateField("biggestChallenge", v)}
                  placeholder="الحاجة اللي مأرقاك أكتر..."
                  rows={2}
                />
              </FormField>

              <div className="pt-4">
                <button
                  onClick={() => goNext("context")}
                  disabled={!canProceedFromReason}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Context ─── */}
          {step === "context" && (
            <motion.div key="context" {...fadeSlide} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white">السياق</h2>
                <p className="text-white/30 text-xs mt-1">كل تفصيلة بتساعد في تخصيص الجلسة</p>
              </div>

              <FormField label="تجارب سابقة مع جلسات" icon={<User className="w-4 h-4 text-teal-400" />}>
                <div className="space-y-2">
                  {PREVIOUS_SESSION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateField("previousSessions", opt.value)}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-medium text-right transition-all border ${
                        formData.previousSessions === opt.value
                          ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                          : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="فيه شخص أو موقف محدد؟" icon={<Heart className="w-4 h-4 text-rose-400" />} hint="اختياري">
                <TextArea
                  value={formData.specificPersonOrSituation}
                  onChange={(v) => updateField("specificPersonOrSituation", v)}
                  placeholder="ممكن تحكيلنا بشكل مبدئي..."
                  rows={2}
                />
              </FormField>

              <FormField label="قديمة الموضوع ده قد إيه؟" icon={<Clock className="w-4 h-4 text-amber-400" />}>
                <div className="grid grid-cols-2 gap-2">
                  {["أيام", "أسابيع", "شهور", "سنين"].map((d) => (
                    <button
                      key={d}
                      onClick={() => updateField("durationOfProblem", d)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                        formData.durationOfProblem === d
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-white/[0.03] border-white/10 text-white/30 hover:text-white/50"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label={`مدى التأثير على حياتك: ${formData.impactScore}/10`} icon={<Target className="w-4 h-4 text-orange-400" />}>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={formData.impactScore}
                  onChange={(e) => updateField("impactScore", Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-white/10 rounded-full"
                />
                <div className="flex justify-between text-[10px] text-white/20 font-bold">
                  <span>تأثير بسيط</span>
                  <span>تأثير كبير جداً</span>
                </div>
              </FormField>

              <div className="pt-4">
                <button
                  onClick={() => goNext("safety")}
                  disabled={!canProceedFromContext}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>الخطوة الأخيرة</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Safety ─── */}
          {step === "safety" && (
            <motion.div key="safety" {...fadeSlide} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white">الأمان والهدف</h2>
                <p className="text-white/30 text-xs mt-1">آخر خطوة — نحمي مساحتك ونحدد بوصلتك</p>
              </div>

              <FormField label="هدفك من الجلسة" icon={<Target className="w-4 h-4 text-indigo-400" />}>
                <div className="space-y-2">
                  {SESSION_GOAL_OPTIONS.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => updateField("sessionGoalType", goal)}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-medium text-right transition-all border ${
                        formData.sessionGoalType === goal
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                          : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Crisis flag */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  formData.crisisFlag
                    ? "bg-red-500/5 border-red-500/30"
                    : "bg-white/[0.02] border-white/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${formData.crisisFlag ? "text-red-400" : "text-white/20"}`} />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-bold text-white/60">
                      هل بتمر بأزمة حادة أو أفكار إيذاء نفس؟
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateField("crisisFlag", true)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          formData.crisisFlag
                            ? "bg-red-500/15 border-red-500/40 text-red-300"
                            : "bg-white/[0.03] border-white/10 text-white/30"
                        }`}
                      >
                        نعم، محتاج دعم فوري
                      </button>
                      <button
                        onClick={() => updateField("crisisFlag", false)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          !formData.crisisFlag
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-white/[0.03] border-white/10 text-white/30"
                        }`}
                      >
                        لا، الوضع مستقر
                      </button>
                    </div>
                    {formData.crisisFlag && (
                      <p className="text-[11px] text-red-400/70 leading-relaxed">
                        سنتواصل معك في أقرب وقت. إذا كنت في خطر فوري، اتصل بخط نجدة الصحة النفسية: 08008880700
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmitSafety || isSubmitting}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <span>أرسل طلب الجلسة</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── Success ─── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center space-y-8 py-16"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-white">تم إرسال طلبك</h2>
                <p className="text-white/40 text-sm leading-relaxed max-w-sm mx-auto">
                  محطتك في الرحلة تم حجزها. سنتواصل معك قريباً لتحديد موعد الجلسة.
                  <br />
                  <span className="text-indigo-400/60">الذكاء الاصطناعي يحلل بياناتك لتخصيص التجربة.</span>
                </p>
              </div>
              <button
                onClick={onBack}
                className="mx-auto flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للرحلة</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
