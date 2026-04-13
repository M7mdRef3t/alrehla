"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ExternalLink,
  Landmark,
  MessageCircle,
  Wallet,
} from "lucide-react";
import type { ManualProofMethod, PaymentMode } from "../../../../src/config/paymentConfig";
import { paymentConfig } from "../../../../src/config/paymentConfig";

type Method = {
  id: ManualProofMethod;
  trackId: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  badge?: string;
  available?: boolean;
  priority?: "primary" | "secondary" | "manual";
};

const LOCAL_METHODS: Method[] = [
  {
    id: "instapay",
    trackId: "instapay",
    title: "InstaPay",
    subtitle: "الأسرع غالبًا لإتمام التحويل ورفع الإثبات فورًا",
    icon: <Wallet className="h-6 w-6" />,
    badge: "⚡ الأسرع",
    available: Boolean(paymentConfig.instapayAlias || paymentConfig.instapayNumber),
    priority: "primary",
  },
  {
    id: "vodafone_cash",
    trackId: "vodafone_cash",
    title: "Vodafone Cash",
    subtitle: "مناسب لو محفظتك الأساسية على فودافون",
    icon: <Wallet className="h-6 w-6" />,
    available: Boolean(paymentConfig.vodafoneCashNumber),
    priority: "secondary",
  },
  {
    id: "etisalat_cash",
    trackId: "etisalat_cash",
    title: "Etisalat Cash",
    subtitle: "بديل جيد لو e& money أسهل لك من التحويل البنكي",
    icon: <Wallet className="h-6 w-6" />,
    available: Boolean(paymentConfig.etisalatCashNumber),
    priority: "secondary",
  },
  {
    id: "bank_transfer",
    trackId: "bank_transfer",
    title: "تحويل بنكي",
    subtitle: "أنسب لو ستدفع من تطبيق البنك أو من حساب شركة",
    icon: <Landmark className="h-6 w-6" />,
    available: Boolean(paymentConfig.bankIban || paymentConfig.bankAccountNumber),
    priority: "secondary",
  },
  {
    id: "fawry",
    trackId: "fawry",
    title: "فوري",
    subtitle: "مسار يدوي أكثر ويحتاج تنسيقًا مباشرًا مع الفريق",
    icon: <Building2 className="h-6 w-6" />,
    available: true,
    priority: "manual",
  },
];

const INTL_METHODS: Method[] = [
  {
    id: "paypal",
    trackId: "paypal",
    title: "PayPal",
    subtitle: "الأوضح والأسرع غالبًا للدفع الدولي",
    icon: <MessageCircle className="h-6 w-6" />,
    badge: "🌍 International",
    available: Boolean(paymentConfig.paypalUrl || paymentConfig.paypalEmail),
    priority: "primary",
  },
  {
    id: "etisalat_cash",
    trackId: "etisalat_international",
    title: "e& money",
    subtitle: "بديل مناسب لو التحويل على e& أسهل من PayPal",
    icon: <ExternalLink className="h-6 w-6" />,
    available: Boolean(paymentConfig.etisalatCashNumber),
    priority: "secondary",
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

function MethodCard({
  method,
  isSelected,
  onClick,
}: {
  method: Method;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isPrimary = method.priority === "primary";
  const isManual = method.priority === "manual";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`group flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-right transition-all duration-300 ${
        isSelected
          ? "border-teal-400/50 bg-teal-500/10 shadow-[0_0_30px_rgba(20,184,166,0.15)]"
          : isPrimary
            ? "border-teal-500/20 bg-teal-500/[0.06] hover:border-teal-400/40 hover:bg-teal-500/[0.1]"
            : isManual
              ? "border-amber-500/15 bg-amber-500/[0.05] hover:border-amber-400/30 hover:bg-amber-500/[0.08]"
              : "border-white/5 bg-slate-900/60 hover:border-white/10 hover:bg-slate-800/80"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
          isSelected
            ? "bg-teal-500 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
            : "border border-white/5 bg-slate-800/80 text-slate-400 group-hover:text-teal-300"
        }`}
      >
        {method.icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-base font-black transition-colors ${isSelected ? "text-teal-200" : "text-white"}`}>
            {method.title}
          </span>
          {method.badge && (
            <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-[10px] font-black text-teal-300">
              {method.badge}
            </span>
          )}
          {isPrimary && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-300">
              موصى به
            </span>
          )}
          {isManual && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-300">
              خطة بديلة
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-400">{method.subtitle}</p>
      </div>

      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          isSelected ? "scale-100 bg-teal-500 text-slate-950" : "scale-90 border border-white/5 opacity-50 group-hover:opacity-100"
        }`}
      >
        {isSelected && <span className="text-[10px] font-black">✓</span>}
      </div>
    </motion.button>
  );
}

export function StepChooseMethod({
  mode,
  setMode,
  selectedMethod,
  onSelect,
  onNext,
  onBack,
}: StepChooseMethodProps) {
  const allMethods = mode === "local" ? LOCAL_METHODS : INTL_METHODS;
  const activeMethods = allMethods.filter((method) => method.priority !== "manual" && method.available);
  const fallbackMethods = allMethods.filter((method) => method.priority === "manual");
  const recommendedMethod = activeMethods.find((method) => method.priority === "primary") ?? activeMethods[0] ?? fallbackMethods[0];
  const hasActiveMethods = activeMethods.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full items-center justify-center py-8"
    >
      <div className="w-full max-w-lg" dir="rtl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="mb-2 text-center text-3xl font-black text-white drop-shadow-md">
            اختار طريقة الدفع الأقرب للإتمام
          </h2>
          <p className="mb-6 text-center text-sm text-slate-400">
            بنعرض لك الطرق الجاهزة فعليًا الآن، ونخلي المسار اليدوي كحل بديل فقط.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-5 rounded-2xl border border-teal-500/20 bg-teal-500/[0.08] px-4 py-3 text-sm text-slate-200"
        >
          <span className="font-black text-teal-300">الترشيح الحالي:</span>{" "}
          {recommendedMethod?.title ?? "أسرع وسيلة متاحة"} هو غالبًا أقصر طريق من الاختيار إلى إرسال الإثبات.
        </motion.div>

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
            داخل مصر
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
            خارج مصر
          </button>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
          }}
          className="mb-8 space-y-3"
        >
          {hasActiveMethods ? (
            activeMethods.map((method) => (
              <MethodCard
                key={`${method.id}-${method.trackId}`}
                method={method}
                isSelected={selectedMethod === method.id}
                onClick={() => onSelect(method.id, method.trackId)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-4 text-sm leading-7 text-amber-100">
              لا توجد قناة دفع مهيأة بالكامل في هذه البيئة الآن. استخدم المسار البديل بالأسفل للتنسيق المباشر مع الفريق.
            </div>
          )}
        </motion.div>

        {fallbackMethods.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">لو الطرق الجاهزة لا تناسبك</p>
            <div className="space-y-3">
              {fallbackMethods.map((method) => (
                <MethodCard
                  key={`${method.id}-${method.trackId}`}
                  method={method}
                  isSelected={selectedMethod === method.id}
                  onClick={() => onSelect(method.id, method.trackId)}
                />
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3"
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-4 text-sm font-bold text-slate-400 transition hover:border-white/20 hover:bg-white/5 hover:text-slate-200"
          >
            <ArrowRight className="h-4 w-4" />
            تراجع
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!selectedMethod}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:shadow-[0_0_36px_rgba(20,184,166,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            تابع إلى الدفع والإثبات
            <ArrowLeft className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
