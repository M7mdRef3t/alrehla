"use client";

import { useState, type ChangeEvent, type Dispatch, type FormEvent, type SetStateAction } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Send,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { ManualProofMethod, PaymentMode } from "../../../../src/config/paymentConfig";
import {
  buildPaymentWhatsappHref,
  paymentConfig,
} from "../../../../src/config/paymentConfig";
import type { ProofImageState } from "../../_lib/paymentProof";

type StepSendProofProps = {
  selectedMethod: ManualProofMethod;
  mode: PaymentMode;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  proofMethod: ManualProofMethod;
  setProofMethod: Dispatch<SetStateAction<ManualProofMethod>>;
  availableProofMethods: Array<{ value: ManualProofMethod; label: string }>;
  proofReference: string;
  setProofReference: Dispatch<SetStateAction<string>>;
  proofAmount: string;
  setProofAmount: Dispatch<SetStateAction<string>>;
  amountPlaceholder: string;
  handleProofImageChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  proofImage: ProofImageState | null;
  setProofImage: Dispatch<SetStateAction<ProofImageState | null>>;
  proofNote: string;
  setProofNote: Dispatch<SetStateAction<string>>;
  isSubmittingProof: boolean;
  handleProofSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onBack: () => void;
  paymentNotice?: string | null;
  paymentNoticeKind?: "info" | "success" | "error";
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
          c.instapayNumber ? { label: "رقم الهاتف", value: c.instapayNumber } : null,
        ].filter(Boolean) as FieldDef[],
      };
    case "vodafone_cash":
      return {
        fields: c.vodafoneCashNumber ? [{ label: "رقم المحفظة", value: c.vodafoneCashNumber }] : [],
      };
    case "etisalat_cash":
      return {
        fields: c.etisalatCashNumber ? [{ label: "رقم المحفظة", value: c.etisalatCashNumber }] : [],
        paypalHref:
          mode === "international"
            ? "https://www.eand.com.eg/portal/pages/services/International_money_remittance.html"
            : undefined,
      };
    case "bank_transfer":
      return {
        fields: [
          c.bankIban ? { label: "IBAN", value: c.bankIban } : null,
          c.bankAccountNumber ? { label: "رقم الحساب", value: c.bankAccountNumber } : null,
          c.bankName ? { label: "البنك", value: c.bankName } : null,
          c.bankBeneficiary ? { label: "اسم المستفيد", value: c.bankBeneficiary } : null,
          c.bankSwift ? { label: "Swift / BIC", value: c.bankSwift } : null,
        ].filter(Boolean) as FieldDef[],
      };
    case "paypal":
      return {
        fields: c.paypalEmail ? [{ label: "PayPal Email", value: c.paypalEmail }] : [],
        paypalHref: c.paypalUrl ?? undefined,
      };
    case "fawry":
      return { fields: [] };
    default:
      return { fields: [] };
  }
}

function CopyField({ label, value }: FieldDef) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 transition hover:border-white/10">
      <div className="flex items-center justify-between px-5 py-3">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            copied
              ? "bg-teal-500/20 text-teal-300"
              : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "تم!" : "نسخ"}
        </button>
      </div>
      <p className="break-all border-t border-white/5 px-5 py-4 font-mono text-base font-bold text-white">
        {value}
      </p>
    </div>
  );
}

export function StepSendProof({
  selectedMethod,
  mode,
  email,
  setEmail,
  proofMethod,
  setProofMethod,
  availableProofMethods,
  proofReference,
  setProofReference,
  proofAmount,
  setProofAmount,
  amountPlaceholder,
  handleProofImageChange,
  proofImage,
  setProofImage,
  proofNote,
  setProofNote,
  isSubmittingProof,
  handleProofSubmit,
  onBack,
  paymentNotice,
  paymentNoticeKind = "info",
}: StepSendProofProps) {
  const { fields, paypalHref } = getFields(selectedMethod, mode);
  const isFawry = selectedMethod === "fawry";
  const whatsappHref = buildPaymentWhatsappHref({
    email,
    method: proofMethod,
    note: "أرسلت التأكيد عبر التوثيق السريع",
  });

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
          className="mb-6 flex justify-center"
        >
          <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            الخطوة الختامية
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-2 text-center text-3xl font-black text-white drop-shadow-md">
            أتمم الدفع وارفع الإثبات
          </h2>
          <p className="mb-8 text-center text-sm text-slate-400">
            انسخ البيانات المناسبة، نفّذ التحويل، ثم ابعت رقم العملية أو لقطة الشاشة في نفس الشاشة.
          </p>
        </motion.div>

        <form className="space-y-5" onSubmit={handleProofSubmit}>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "نراجع الإثبات يدويًا بعد الإرسال مباشرة",
              "لو الرقم المرجعي واضح فغالبًا المراجعة تكون أسرع",
              "لو حصل أي لخبطة تقدر تكمل مع الفريق على واتساب",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-xs font-medium leading-6 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>

          {fields.length > 0 ? (
            <div className="space-y-3 rounded-3xl border border-white/5 bg-slate-950/30 p-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-teal-300">بيانات الدفع</p>
              {fields.map((f) => (
                <CopyField key={f.label} label={f.label} value={f.value} />
              ))}
              {paypalHref && (
                <a
                  href={paypalHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-teal-500/20 bg-teal-500/10 py-3 text-sm font-black text-teal-300 transition-all hover:bg-teal-500/20"
                >
                  <ExternalLink className="h-4 w-4" />
                  افتح بوابة الدفع
                </a>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-100">
              {isFawry
                ? "المسار ده يحتاج تنسيق مباشر مع الفريق على واتساب قبل إرسال الإثبات."
                : "لو البيانات لا تظهر هنا، استخدم واتساب المباشر بالأسفل لإكمال الترتيب."}
            </div>
          )}

          {paymentNotice && (
            <div
              className={`rounded-2xl border px-4 py-3 text-xs leading-6 ${
                paymentNoticeKind === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : paymentNoticeKind === "error"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    : "border-sky-500/30 bg-sky-500/10 text-sky-200"
              }`}
            >
              {paymentNotice}
            </div>
          )}

          <div className="rounded-2xl border border-teal-500/15 bg-teal-500/[0.04] px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-teal-300">
              بعد ما تبعت
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-[10px] font-black text-slate-950">
                1
              </span>
              <span>الإثبات يدخل للمراجعة فورًا</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-black text-teal-300">
                2
              </span>
              <span>نربط التحويل بحسابك أو نتواصل معك لو فيه نقص</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-black text-teal-300">
                3
              </span>
              <span>يتفعّل وصولك وتكمل رحلتك من غير إعادة الخطوات</span>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label htmlFor="proof-email" className="mb-2 block text-[13px] font-black text-slate-300">
              بريدك الإلكتروني <span className="font-normal text-slate-500">(الحساب المسجّل)</span>
            </label>
            <input
              id="proof-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 text-sm text-white outline-none placeholder:text-slate-600 transition-all backdrop-blur-sm focus:border-teal-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-teal-500/20"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <label htmlFor="proof-method" className="mb-2 block text-[13px] font-black text-slate-300">
              وسيلة الدفع المستخدمة
            </label>
            <select
              id="proof-method"
              value={proofMethod}
              onChange={(e) => setProofMethod(e.target.value as ManualProofMethod)}
              className="w-full rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 text-sm text-white outline-none transition-all backdrop-blur-sm focus:border-teal-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-teal-500/20"
            >
              {availableProofMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label htmlFor="proof-ref" className="mb-2 block text-[13px] font-black text-slate-300">
                رقم العملية المرجعي
              </label>
              <input
                id="proof-ref"
                type="text"
                value={proofReference}
                onChange={(e) => setProofReference(e.target.value)}
                placeholder="TX-12345"
                className="w-full rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 font-mono text-sm text-white outline-none placeholder:text-slate-600 transition-all backdrop-blur-sm focus:border-teal-500/50 focus:bg-slate-900/80"
              />
            </div>
            <div>
              <label htmlFor="proof-amount" className="mb-2 block text-[13px] font-black text-slate-300">
                قيمة التحويل
              </label>
              <input
                id="proof-amount"
                type="text"
                value={proofAmount}
                onChange={(e) => setProofAmount(e.target.value)}
                placeholder={amountPlaceholder}
                className="w-full rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 text-sm text-white outline-none placeholder:text-slate-600 transition-all backdrop-blur-sm focus:border-teal-500/50 focus:bg-slate-900/80"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <label className="mb-2 block text-[13px] font-black text-slate-300">
              لقطة الشاشة أو الإيصال <span className="font-normal text-slate-500">(اختياري لو معاك الرقم المرجعي)</span>
            </label>

            <AnimatePresence mode="wait">
              {proofImage ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="overflow-hidden rounded-2xl border border-teal-500/30 bg-slate-900/80 shadow-[0_0_20px_rgba(20,184,166,0.1)]"
                >
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                      <span className="text-sm font-black text-white">{proofImage.name}</span>
                      <span className="font-mono text-[10px] text-teal-400/50">
                        {Math.round(proofImage.bytes / 1024)}KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/20"
                    >
                      إزالة
                    </button>
                  </div>
                  <div className="border-t border-white/5 bg-black/40 p-2">
                    <img
                      src={proofImage.dataUrl}
                      alt="معاينة الإثبات"
                      className="max-h-48 w-full rounded-lg object-contain"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.label
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  htmlFor="proof-file"
                  className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-8 text-center shadow-inner transition-all hover:border-teal-500/40 hover:bg-slate-900/60"
                >
                  <Upload className="h-8 w-8 text-slate-500 transition-colors group-hover:text-teal-400" />
                  <p className="text-sm font-black text-slate-300">اضغط لرفع الصورة</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">PNG / JPG / WEBP - MAX 900KB</p>
                  <input
                    id="proof-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProofImageChange}
                    className="sr-only"
                  />
                </motion.label>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <label htmlFor="proof-note" className="mb-2 block text-[13px] font-black text-slate-300">
              ملاحظة إضافية <span className="font-normal text-slate-500">(اختياري)</span>
            </label>
            <textarea
              id="proof-note"
              rows={2}
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              placeholder="أي تفاصيل تساعد الفريق يراجع أسرع"
              className="w-full resize-none rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 text-sm text-white outline-none placeholder:text-slate-600 transition-all backdrop-blur-sm focus:border-teal-500/50 focus:bg-slate-900/80"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3 pt-4"
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
              type="submit"
              disabled={isSubmittingProof}
              className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-teal-500 py-4 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:shadow-[0_0_36px_rgba(20,184,166,0.4)] disabled:opacity-40"
            >
              {isSubmittingProof ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  جاري الإرسال...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  إرسال الإثبات
                </>
              )}
            </button>
          </motion.div>

          <p className="text-center text-[11px] leading-6 text-slate-500">
            أرسل الرقم المرجعي لو موجود. ولو مش موجود، لقطة شاشة واضحة غالبًا تكفي للمراجعة.
          </p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center pt-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/20"
            >
              مراسلة الفريق على واتساب
            </a>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
