"use client";

import {
  ArrowLeft,
  ArrowRight,
  Landmark,
  MessageCircle,
  Wallet,
  ExternalLink,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ManualProofMethod, PaymentMode } from "../../../../src/config/paymentConfig";
import { paymentConfig } from "../../../../src/config/paymentConfig";

type Method = {
  id: ManualProofMethod;
  trackId: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  available?: boolean;
};

const LOCAL_METHODS: Method[] = [
  {
    id: "instapay",
    trackId: "instapay",
    title: "InstaPay",
    subtitle: "الأسرع — تحويل فوري للتوثيق",
    icon: <Wallet className="h-6 w-6" />,
    badge: "⚡ الأسرع",
    available: Boolean(paymentConfig.instapayAlias || paymentConfig.instapayNumber),
  },
  {
    id: "vodafone_cash",
    trackId: "vodafone_cash",
    title: "Vodafone Cash",
    subtitle: "عبر محفظة فودافون",
    icon: <Wallet className="h-6 w-6" />,
    available: Boolean(paymentConfig.vodafoneCashNumber),
  },
  {
    id: "etisalat_cash",
    trackId: "etisalat_cash",
    title: "Etisalat Cash",
    subtitle: "e& money — عبر محفظة اتصالات",
    icon: <Wallet className="h-6 w-6" />,
    available: Boolean(paymentConfig.etisalatCashNumber),
  },
  {
    id: "bank_transfer",
    trackId: "bank_transfer",
    title: "تحويل بنكي",
    subtitle: "IBAN / رقم الحساب",
    icon: <Landmark className="h-6 w-6" />,
    available: Boolean(paymentConfig.bankIban || paymentConfig.bankAccountNumber),
  },
  {
    id: "fawry",
    trackId: "fawry",
    title: "فوري",
    subtitle: "تواصل مع فريق الدعم لترتيب المسار",
    icon: <Building2 className="h-6 w-6" />,
    available: false,
  },
];

const INTL_METHODS: Method[] = [
  {
    id: "paypal",
    trackId: "paypal",
    title: "PayPal",
    subtitle: "توثيق دولي فوري",
    icon: <MessageCircle className="h-6 w-6" />,
    badge: "🌍 International",
    available: Boolean(paymentConfig.paypalUrl || paymentConfig.paypalEmail),
  },
  {
    id: "etisalat_cash",
    trackId: "etisalat_international",
    title: "e& money",
    subtitle: "تحويل دولي عبر e& Etisalat",
    icon: <ExternalLink className="h-6 w-6" />,
    available: Boolean(paymentConfig.etisalatCashNumber),
  },
];

type StepChooseMethodProps = {
  mode: PaymentMode;
  setMode: (m: PaymentMode) => void;
  selectedMethod: ManualProofMethod | null;
  onSelect: (method: ManualProofMethod, trackId: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepChooseMethod({
  mode,
  setMode,
  selectedMethod,
  onSelect,
  onNext,
  onBack,
}: StepChooseMethodProps) {
  const methods = mode === "local" ? LOCAL_METHODS : INTL_METHODS;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full items-center justify-center py-8"
    >
      <div className="w-full max-w-lg" dir="rtl">

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <h2 className="mb-2 text-center text-3xl font-black text-white drop-shadow-md">
            اختار وسيلة تأكيد العهد
          </h2>
          <p className="mb-8 text-center text-sm text-slate-400">
            أيها الرفيق، اختار ما يناسبك لتوثيق التزامك بالرحلة والمضي قدماً
          </p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-1.5 backdrop-blur-md"
        >
          <button
            type="button"
            onClick={() => setMode("local")}
            className={`flex-1 rounded-xl py-3 text-sm font-black transition-all duration-300 ${
              mode === "local"
                ? "bg-teal-500 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🇪🇬 داخل مصر
          </button>
          <button
            type="button"
            onClick={() => setMode("international")}
            className={`flex-1 rounded-xl py-3 text-sm font-black transition-all duration-300 ${
              mode === "international"
                ? "bg-teal-500 text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🌍 خارج مصر
          </button>
        </motion.div>

        {/* Method cards */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08, delayChildren: 0.4 }
            }
          }}
          className="mb-8 space-y-3"
        >
          {methods.map((m) => {
            const isSelected = selectedMethod === m.id;
            return (
              <motion.button
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1 }
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                key={m.id + m.trackId}
                onClick={() => onSelect(m.id, m.trackId)}
                className={`group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-right transition-all duration-300 ${
                  isSelected
                    ? "border-teal-400/50 bg-teal-500/10 shadow-[0_0_30px_rgba(20,184,166,0.15)]"
                    : "border-white/5 bg-slate-900/60 hover:border-white/10 hover:bg-slate-800/80"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                    isSelected
                      ? "bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                      : "border border-white/5 bg-slate-800/80 text-slate-400 group-hover:text-teal-300"
                  }`}
                >
                  {m.icon}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-base font-black transition-colors ${isSelected ? "text-teal-200" : "text-white"}`}
                    >
                      {m.title}
                    </span>
                    {m.badge && (
                      <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[10px] font-black text-teal-300">
                        {m.badge}
                      </span>
                    )}
                    {!m.available && (
                      <span className="rounded-full border border-slate-600/40 bg-slate-800/50 px-2 py-0.5 text-[10px] text-slate-500">
                        للتواصل
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{m.subtitle}</p>
                </div>

                {/* Selected check */}
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                    isSelected
                      ? "bg-teal-500 text-slate-950 scale-100"
                      : "border border-white/5 scale-90 opacity-50 group-hover:opacity-100"
                  }`}
                >
                  {isSelected && <span className="text-[10px] font-black">✓</span>}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Nav buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3"
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-4 text-sm font-bold text-slate-400 transition hover:border-white/20 hover:text-slate-200 hover:bg-white/5"
          >
            <ArrowRight className="h-4 w-4" />
            تراجع
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!selectedMethod}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:shadow-[0_0_36px_rgba(20,184,166,0.4)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
          >
            الخطوة التالية: إتمام التوثيق
            <ArrowLeft className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
