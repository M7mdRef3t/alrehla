"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ManualProofMethod, PaymentMode } from "../../../../src/config/paymentConfig";
import { paymentConfig, buildPaymentWhatsappHref } from "../../../../src/config/paymentConfig";

type StepPaymentDetailsProps = {
  selectedMethod: ManualProofMethod;
  mode: PaymentMode;
  email: string;
  onNext: () => void;
  onBack: () => void;
};

type FieldDef = { label: string; value: string };

function getFields(
  method: ManualProofMethod,
  mode: PaymentMode,
): { fields: FieldDef[]; paypalHref?: string } {
  const c = paymentConfig;

  switch (method) {
    case "instapay":
      return {
        fields: [
          c.instapayAlias ? { label: "Alias", value: c.instapayAlias } : null,
          c.instapayNumber
            ? { label: "رقم الهاتف", value: c.instapayNumber }
            : null,
        ].filter(Boolean) as FieldDef[],
      };

    case "vodafone_cash":
      return {
        fields: c.vodafoneCashNumber
          ? [{ label: "رقم المحفظة", value: c.vodafoneCashNumber }]
          : [],
      };

    case "etisalat_cash":
      return {
        fields: c.etisalatCashNumber
          ? [{ label: "رقم المحفظة", value: c.etisalatCashNumber }]
          : [],
        paypalHref: mode === "international"
          ? "https://www.eand.com.eg/portal/pages/services/International_money_remittance.html"
          : undefined,
      };

    case "bank_transfer":
      return {
        fields: [
          c.bankIban ? { label: "IBAN", value: c.bankIban } : null,
          c.bankAccountNumber
            ? { label: "رقم الحساب", value: c.bankAccountNumber }
            : null,
          c.bankName ? { label: "البنك", value: c.bankName } : null,
          c.bankBeneficiary
            ? { label: "اسم المستفيد", value: c.bankBeneficiary }
            : null,
          c.bankSwift ? { label: "Swift / BIC", value: c.bankSwift } : null,
        ].filter(Boolean) as FieldDef[],
      };

    case "paypal":
      return {
        fields: c.paypalEmail
          ? [{ label: "PayPal Email", value: c.paypalEmail }]
          : [],
        paypalHref: c.paypalUrl ?? undefined,
      };

    case "fawry":
      return { fields: [] };

    default:
      return { fields: [] };
  }
}

const METHOD_LABELS: Record<ManualProofMethod, string> = {
  instapay: "InstaPay",
  vodafone_cash: "Vodafone Cash",
  etisalat_cash: "Etisalat Cash / e& money",
  bank_transfer: "تحويل بنكي",
  paypal: "PayPal",
  fawry: "فوري",
};

function CopyField({ label, value }: FieldDef) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 transition hover:border-white/10"
    >
      <div className="flex items-center justify-between px-5 py-3">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            copied
              ? "bg-teal-500/20 text-teal-300"
              : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "تم!" : "نسخ البيانات"}
        </button>
      </div>
      <p className="border-t border-white/5 px-5 py-4 font-mono text-base font-bold text-white break-all">
        {value}
      </p>
    </motion.div>
  );
}

export function StepPaymentDetails({
  selectedMethod,
  mode,
  email,
  onNext,
  onBack,
}: StepPaymentDetailsProps) {
  const { fields, paypalHref } = getFields(selectedMethod, mode);
  const methodLabel = METHOD_LABELS[selectedMethod] ?? selectedMethod;
  const whatsappHref = buildPaymentWhatsappHref({ email, method: methodLabel as string });
  const isFawry = selectedMethod === "fawry";

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
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="mb-4 flex justify-center"
        >
          <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-black tracking-wider text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            مسار التوثيق: {methodLabel}
          </span>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <h2 className="mb-2 text-center text-3xl font-black text-white drop-shadow-md">
            بيانات التوثيق
          </h2>
          <p className="mb-8 text-center text-sm text-slate-400">
            {isFawry
              ? "هذا المسار يتطلب التنسيق مع الفريق — تواصل معهم لترتيب العبور."
              : "انسخ البيانات لتوثيق الميثاق وإتمام الدفع — ثم نلتقي للخطوة الختامية."}
          </p>
        </motion.div>

        {/* Fields */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.3 }
            }
          }}
        >
          {fields.length > 0 ? (
            <div className="mb-6 space-y-3">
              {fields.map((f) => (
                <CopyField key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
          ) : (
            <motion.div 
               variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
               }}
               className="mb-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 text-center backdrop-blur-sm"
            >
              <p className="text-3xl drop-shadow-md">📩</p>
              <p className="mt-4 text-base font-black text-amber-200">
                التواصل عبر واتسآب المباشر
              </p>
              <p className="mt-2 text-sm text-slate-400">
                الفريق بانتظارك لترتيب التفاصيل وتوجيهك (عادة الرد خلال دقائق).
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* PayPal direct link */}
        {paypalHref && (
          <motion.a
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={paypalHref}
            target="_blank"
            rel="noreferrer"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-500/20 bg-teal-500/10 py-4 text-sm font-black text-teal-300 transition-all hover:bg-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
          >
            <ExternalLink className="h-4 w-4" />
            الانتقال بوابة الدفع الدولية
          </motion.a>
        )}

        {/* WhatsApp CTA for fawry / no-fields */}
        {(isFawry || fields.length === 0 || !fields.length) && (
          <motion.a
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-4 text-sm font-black text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:bg-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            <span className="text-lg">💬</span>
            انتقل للمحادثة مع الفريق
          </motion.a>
        )}

        {/* Reminder note */}
        {!isFawry && fields.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 flex items-start gap-4 rounded-2xl border border-amber-500/15 bg-amber-500/5 px-5 py-4 backdrop-blur-sm"
          >
            <span className="text-xl">💡</span>
            <p className="text-xs leading-6 text-amber-200/80 font-medium">
              تذكر التقاط صورة للإيصال أو نسخ رقم العملية البنكية، ستحتاجها لإرسال الإثبات في الخطوة الأخيرة.
            </p>
          </motion.div>
        )}

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
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:shadow-[0_0_36px_rgba(20,184,166,0.4)]"
          >
            {isFawry ? "لا، اختار مساراً آخر" : "أتممت العملية — للخطوة الختامية"}
            <ArrowLeft className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
