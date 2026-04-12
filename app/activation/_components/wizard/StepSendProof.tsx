"use client";

import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Upload,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ManualProofMethod } from "../../../../src/config/paymentConfig";
import { buildPaymentWhatsappHref } from "../../../../src/config/paymentConfig";
import type { ProofImageState } from "../../_lib/paymentProof";

type StepSendProofProps = {
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

export function StepSendProof({
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
            إتمام وتأكيد العهد
          </h2>
          <p className="mb-8 text-center text-sm text-slate-400">
            بإرسالك التفاصيل، يتم توثيق العهد ويبدأ فريق الملاذ بربط حسابك لفتح البوابات فوراً.
          </p>
        </motion.div>

        <form className="space-y-5" onSubmit={handleProofSubmit}>
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

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="proof-email" className="mb-2 block text-[13px] font-black text-slate-300">
              بريدك الإلكتروني <span className="font-normal text-slate-500">(الحساب المسجّل)</span>
            </label>
            <input
              id="proof-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-teal-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-teal-500/20 transition-all backdrop-blur-sm"
            />
          </motion.div>

          {/* Method select */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <label htmlFor="proof-method" className="mb-2 block text-[13px] font-black text-slate-300">
              وسيلة التوثيق المستخدمة
            </label>
            <select
              id="proof-method"
              value={proofMethod}
              onChange={(e) => setProofMethod(e.target.value as ManualProofMethod)}
              className="w-full rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 text-sm text-white outline-none focus:border-teal-500/50 focus:bg-slate-900/80 focus:ring-1 focus:ring-teal-500/20 transition-all backdrop-blur-sm"
            >
              {availableProofMethods.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Reference + Amount row */}
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
                className="w-full rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-teal-500/50 focus:bg-slate-900/80 transition-all backdrop-blur-sm"
              />
            </div>
            <div>
              <label htmlFor="proof-amount" className="mb-2 block text-[13px] font-black text-slate-300">
                قيمة الاستثمار المدرجة
              </label>
              <input
                id="proof-amount"
                type="text"
                value={proofAmount}
                onChange={(e) => setProofAmount(e.target.value)}
                placeholder={amountPlaceholder}
                className="w-full rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-teal-500/50 focus:bg-slate-900/80 transition-all backdrop-blur-sm"
              />
            </div>
          </motion.div>

          {/* Image upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <label className="mb-2 block text-[13px] font-black text-slate-300">
              مرفق الإثبات (صورة الإيصال) <span className="font-normal text-slate-500">(اختياري إن وجد الرقم المرجعي)</span>
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
                      <span className="text-[10px] text-teal-400/50 font-mono">
                        {Math.round(proofImage.bytes / 1024)}KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-300 transition-all hover:bg-rose-500/20 hover:border-rose-500/40"
                    >
                      إزالة وتعويض
                    </button>
                  </div>
                  <div className="bg-black/40 border-t border-white/5 p-2">
                    <img
                      src={proofImage.dataUrl}
                      alt="معاينة الإثبات"
                      className="max-h-48 w-full object-contain rounded-lg"
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
                  className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-8 text-center transition-all hover:border-teal-500/40 hover:bg-slate-900/60 shadow-inner"
                >
                  <Upload className="h-8 w-8 text-slate-500 transition-colors group-hover:text-teal-400" />
                  <p className="text-sm font-black text-slate-300">
                    اسحب الصورة أو اضغط للرفع
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">PNG / JPG / WEBP — MAX 900KB</p>
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

          {/* Note */}
          <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5 }}
          >
            <label htmlFor="proof-note" className="mb-2 block text-[13px] font-black text-slate-300">
               رسالة إضافية للفريق <span className="font-normal text-slate-500">(اختياري)</span>
            </label>
            <textarea
              id="proof-note"
              rows={2}
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              placeholder="مثلاً: تم التأكيد باسم مستعار، أو أي تفاصيل أخرى ترغب بإيصالها للرفاق."
              className="w-full resize-none rounded-2xl border border-white/5 bg-slate-900/60 px-5 py-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-teal-500/50 focus:bg-slate-900/80 transition-all backdrop-blur-sm"
            />
          </motion.div>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3 pt-4"
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
              type="submit"
              disabled={isSubmittingProof}
              className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-teal-500 py-4 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 hover:shadow-[0_0_36px_rgba(20,184,166,0.4)] disabled:opacity-40 disabled:hover:shadow-none"
            >
              {isSubmittingProof ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  جاري تسجيل العهد...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  توثيق واعتماد
                </>
              )}
            </button>
          </motion.div>

          {/* WhatsApp alternative */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center pt-2"
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">أو بديلاً عن ذلك</p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-400 transition hover:bg-emerald-500/20 hover:border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            >
              <span>💬</span> مراسلة الفريق وتأكيد العهد عبر واتسآب المباشر
            </a>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
