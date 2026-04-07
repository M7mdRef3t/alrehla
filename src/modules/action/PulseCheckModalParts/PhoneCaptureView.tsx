import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, CheckCircle2, AlertCircle, Trash2, WifiOff } from "lucide-react";

interface PhoneCaptureViewProps {
  phone: string;
  setPhone: (val: string) => void;
  onValidSubmit?: () => void;
  autoFocus?: boolean;
  /** Called if the CRM sync fails after submit — parent can show a toast or retry */
  onSubmitError?: (reason: string) => void;
  /** If true, shows a subtle inline notice that the last sync failed */
  syncFailed?: boolean;
}

export function PhoneCaptureView({
  phone,
  setPhone,
  onValidSubmit,
  autoFocus = true,
  onSubmitError: _onSubmitError,
  syncFailed = false
}: PhoneCaptureViewProps) {
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Strict Egyptian Mobile Validation (010, 011, 012, 015)
  const validateEgyptianPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length === 0) return null;

    if (!cleaned.startsWith("01")) {
      return "لازم يبدأ بـ 01";
    }

    const thirdDigit = cleaned[2];
    if (thirdDigit && !["0", "1", "2", "5"].includes(thirdDigit)) {
      return "رقم غير صحيح.. اتأكد من البداية (010, 011, 012, 015)";
    }

    if (cleaned.length > 11) {
      return "الرقم أطول من اللازم (11 رقم بس)";
    }

    if (cleaned.length === 11) {
      return null; // Valid
    }

    return "ناقص أرقام.. كمل الـ 11 رقم";
  };

  useEffect(() => {
    const errMsg = validateEgyptianPhone(phone);
    setError(errMsg);
  }, [phone]);

  const isValid = phone.replace(/\D/g, "").length === 11 && !error;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && onValidSubmit) {
      onValidSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 py-6 px-2"
    >
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold tracking-tight" style={{ color: "var(--ds-theme-text-primary)", fontFamily: "var(--font-display)" }}>
          سيب رقمك عشان نبعتلك التفاصيل 📩
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--ds-theme-text-secondary)" }}>
          عشان نبعتلك خطة رحلتك الشخصية ونساعدك على الواتساب أول بأول بخصوص أهدافك اللي سجلتها.
        </p>
      </div>

      <div className="relative group">
        {/* Input Wrapper */}
        <div
          className={`relative flex items-center gap-4 p-5 rounded-3xl transition-all duration-500 overflow-hidden ${
            isFocused ? "shadow-[0_0_30px_rgba(20,184,166,0.15)]" : ""
          }`}
          style={{
            background: "var(--ds-color-glass-default)",
            border: `2px solid ${
              isValid
                ? "var(--ds-color-primary)"
                : error && phone.length > 5
                  ? "rgba(239,68,68,0.4)"
                  : isFocused
                    ? "var(--ds-color-primary-glow)"
                    : "var(--ds-color-border-default)"
            }`,
          }}
        >
          <Phone className={`w-6 h-6 transition-colors ${isValid ? "text-teal-400" : "var(--ds-theme-text-muted)"}`} />

          <input
            id="phone-capture-input"
            name="phoneNumber"
            autoFocus={autoFocus}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="01xxxxxxxxx"
            className="flex-1 bg-transparent border-none outline-none text-2xl font-black font-mono tracking-[0.1em]"
            style={{ color: "var(--ds-theme-text-primary)", direction: "ltr" }}
          />

          <AnimatePresence mode="wait">
            {isValid ? (
              <motion.div
                key="valid"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <CheckCircle2 className="w-6 h-6 text-teal-400" />
              </motion.div>
            ) : phone.length > 0 && (
              <motion.button
                key="clear"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setPhone("")}
                className="p-1 hover:bg-white/5 rounded-full"
              >
                <Trash2 className="w-5 h-5 text-slate-500 opacity-40" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Validation Error */}
        <AnimatePresence>
          {error && phone.length > 3 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mt-3 px-4 text-xs font-bold text-red-400"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CRM Sync failure notice — non-blocking, subtle amber warning */}
      <AnimatePresence>
        {syncFailed && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/20"
            style={{ background: "rgba(245,158,11,0.05)" }}
          >
            <WifiOff className="w-4 h-4 text-amber-400/80 shrink-0" />
            <p className="text-[11px] font-bold text-amber-300/80 leading-relaxed">
              فيه مشكلة في الاتصال — هنسجل رقمك محليًا وهنحاول تاني بعد كده.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10">
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
        <p className="text-[11px] font-bold text-teal-400/80 leading-relaxed uppercase tracking-wider">
          متاح دعم فوري ومتابعة على الواتساب بمجرد التسجيل
        </p>
      </div>
    </motion.div>
  );
}
