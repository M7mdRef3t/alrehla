"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
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
            ? { label: "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ", value: c.instapayNumber }
            : null,
        ].filter(Boolean) as FieldDef[],
      };

    case "vodafone_cash":
      return {
        fields: c.vodafoneCashNumber
          ? [{ label: "Ø±Ù‚Ù… Ø§Ù„Ù…Ø­ÙØ¸Ø©", value: c.vodafoneCashNumber }]
          : [],
      };

    case "etisalat_cash":
      return {
        fields: c.etisalatCashNumber
          ? [{ label: "Ø±Ù‚Ù… Ø§Ù„Ù…Ø­ÙØ¸Ø©", value: c.etisalatCashNumber }]
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
            ? { label: "Ø±Ù‚Ù… Ø§Ù„Ø­Ø³Ø§Ø¨", value: c.bankAccountNumber }
            : null,
          c.bankName ? { label: "Ø§Ù„Ø¨Ù†Ùƒ", value: c.bankName } : null,
          c.bankBeneficiary
            ? { label: "Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªÙÙŠØ¯", value: c.bankBeneficiary }
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
  bank_transfer: "ØªØ­ÙˆÙŠÙ„ Ø¨Ù†ÙƒÙŠ",
  paypal: "PayPal",
  fawry: "ÙÙˆØ±ÙŠ",
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
          {copied ? "ØªÙ…!" : "Ù†Ø³Ø® Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª"}
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
            Ù…Ø³Ø§Ø± Ø§Ù„ØªÙˆØ«ÙŠÙ‚: {methodLabel}
          </span>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <h2 className="mb-2 text-center text-3xl font-black text-white drop-shadow-md">
            Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙˆØ«ÙŠÙ‚
          </h2>
          <p className="mb-8 text-center text-sm text-slate-400">
            {isFawry
              ? "Ù‡Ø°Ø§ Ø§Ù„Ù…Ø³Ø§Ø± ÙŠØªØ·Ù„Ø¨ Ø§Ù„ØªÙ†Ø³ÙŠÙ‚ Ù…Ø¹ Ø§Ù„ÙØ±ÙŠÙ‚ â€” ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù‡Ù… Ù„ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¹Ø¨ÙˆØ±."
              : "Ø§Ù†Ø³Ø® Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„ØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ù…ÙŠØ«Ø§Ù‚ ÙˆØ¥ØªÙ…Ø§Ù… Ø§Ù„Ø¯ÙØ¹ â€” Ø«Ù… Ù†Ù„ØªÙ‚ÙŠ Ù„Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø®ØªØ§Ù…ÙŠØ©."}
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
              <p className="text-3xl drop-shadow-md">ðŸ“©</p>
              <p className="mt-4 text-base font-black text-amber-200">
                Ø§Ù„ØªÙˆØ§ØµÙ„ Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø¢Ø¨ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Ø§Ù„ÙØ±ÙŠÙ‚ Ø¨Ø§Ù†ØªØ¸Ø§Ø±Ùƒ Ù„ØªØ±ØªÙŠØ¨ Ø§Ù„ØªÙØ§ØµÙŠÙ„ ÙˆØªÙˆØ¬ÙŠÙ‡Ùƒ (Ø¹Ø§Ø¯Ø© Ø§Ù„Ø±Ø¯ Ø®Ù„Ø§Ù„ Ø¯Ù‚Ø§Ø¦Ù‚).
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
            Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ©
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
            <span className="text-lg">ðŸ’¬</span>
            Ø§Ù†ØªÙ‚Ù„ Ù„Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ù…Ø¹ Ø§Ù„ÙØ±ÙŠÙ‚
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
            <span className="text-xl">ðŸ’¡</span>
            <p className="text-xs leading-6 text-amber-200/80 font-medium">
              ØªØ°ÙƒØ± Ø§Ù„ØªÙ‚Ø§Ø· ØµÙˆØ±Ø© Ù„Ù„Ø¥ÙŠØµØ§Ù„ Ø£Ùˆ Ù†Ø³Ø® Ø±Ù‚Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø¨Ù†ÙƒÙŠØ©ØŒ Ø³ØªØ­ØªØ§Ø¬Ù‡Ø§ Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø«Ø¨Ø§Øª ÙÙŠ Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø£Ø®ÙŠØ±Ø©.
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
            ØªØ±Ø§Ø¬Ø¹
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-4 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:shadow-[0_0_36px_rgba(20,184,166,0.4)]"
          >
            {isFawry ? "Ù„Ø§ØŒ Ø§Ø®ØªØ§Ø± Ù…Ø³Ø§Ø±Ø§Ù‹ Ø¢Ø®Ø±" : "Ø£ØªÙ…Ù…Øª Ø§Ù„Ø¹Ù…Ù„ÙŠØ© â€” Ù„Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø®ØªØ§Ù…ÙŠØ©"}
            <ArrowLeft className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

