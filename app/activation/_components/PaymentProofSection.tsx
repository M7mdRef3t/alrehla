"use client";

import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import { CheckCircle2, MessageCircle, Upload } from "lucide-react";
import type { ManualProofMethod } from "../../../src/config/paymentConfig";
import type { ProofImageState } from "../_lib/paymentProof";

type PaymentProofSectionProps = {
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
  proofWhatsappHref: string;
  helpWhatsappHref: string;
};

export function PaymentProofSection({
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
  proofWhatsappHref,
  helpWhatsappHref,
}: PaymentProofSectionProps) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-slate-900/50 shadow-[0_0_60px_-15px_rgba(20,184,166,0.2)] backdrop-blur-xl"
      dir="rtl"
    >
      {/* Glow accent */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,_rgba(20,184,166,0.07),_transparent)]" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 border-b border-teal-500/10 px-6 py-5 md:px-8">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-sm font-black text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.4)]">
          3
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-teal-400">
            الخطوة 3
          </p>
          <h2 className="text-lg font-black text-white">أرسل إثبات التحويل</h2>
        </div>
        <p className="mr-auto hidden text-sm text-slate-400 sm:block">
          أرسل رقم العملية أو لقطة شاشة واضحة ليتم ربط حسابك
        </p>
      </div>

      <div className="relative z-10 grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_300px]">
        {/* ─── Form ─── */}
        <div>
          <form
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={handleProofSubmit}
          >
            {/* Email */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                البريد الإلكتروني{" "}
                <span className="font-normal text-slate-500">(اختياري)</span>
              </span>
              <input
                id="activation-email"
                name="activationEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/15 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
                placeholder="الإيميل المسجّل به في المنصة"
              />
            </label>

            {/* Method */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                وسيلة الدفع
              </span>
              <select
                id="activation-proof-method"
                name="activationProofMethod"
                value={proofMethod}
                onChange={(e) =>
                  setProofMethod(e.target.value as ManualProofMethod)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition-all hover:border-white/15 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
              >
                {availableProofMethods.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Reference */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                رقم العملية / المرجع
              </span>
              <input
                id="activation-proof-ref"
                name="activationProofRef"
                type="text"
                value={proofReference}
                onChange={(e) => setProofReference(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/15 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
                placeholder="TX-874512"
              />
              <span className="mt-1.5 block text-xs text-slate-500">
                يمكن تركه فارغاً إذا كنت سترفق لقطة شاشة واضحة.
              </span>
            </label>

            {/* Amount */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                المبلغ المحوّل
              </span>
              <input
                id="activation-proof-amount"
                name="activationProofAmount"
                type="text"
                value={proofAmount}
                onChange={(e) => setProofAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/15 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
                placeholder={amountPlaceholder}
              />
            </label>

            {/* Image upload */}
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                لقطة شاشة أو إيصال الدفع
              </span>

              {proofImage ? (
                <div className="overflow-hidden rounded-xl border border-teal-500/20 bg-slate-950/50">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-400" />
                      <div>
                        <p className="text-sm font-bold text-white">
                          {proofImage.name}
                        </p>
                        <p className="font-mono text-xs text-teal-400/70">
                          {Math.round(proofImage.bytes / 1024)}KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                    >
                      إزالة
                    </button>
                  </div>
                  <img
                    src={proofImage.dataUrl}
                    alt="معاينة إثبات الدفع"
                    className="max-h-48 w-full border-t border-white/5 bg-black/40 object-contain"
                  />
                </div>
              ) : (
                <label
                  htmlFor="activation-proof-file"
                  className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-6 py-8 text-center transition-all hover:border-teal-500/30 hover:bg-slate-950/50"
                >
                  <Upload className="h-8 w-8 text-slate-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-300">
                      اضغط لرفع صورة التحويل
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      PNG / JPG / WEBP — حتى 900KB
                    </p>
                  </div>
                  <input
                    id="activation-proof-file"
                    name="activationProofFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProofImageChange}
                    className="sr-only"
                  />
                </label>
              )}
            </label>

            {/* Note */}
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                ملاحظات إضافية{" "}
                <span className="font-normal text-slate-500">(اختياري)</span>
              </span>
              <textarea
                id="activation-proof-note"
                name="activationProofNote"
                rows={3}
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 hover:border-white/15 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
                placeholder="مثلاً: التحويل تم باسم شخص آخر، أو أي تفصيل مفيد."
              />
            </label>

            {/* Submit row */}
            <div className="flex flex-wrap gap-3 border-t border-white/5 pt-4 sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmittingProof}
                className="flex-1 rounded-xl bg-teal-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(20,184,166,0.3)] transition-all hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {isSubmittingProof ? "جارٍ الإرسال..." : "تأكيد وإرسال الإثبات"}
              </button>
              <a
                href={proofWhatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-xl border border-white/10 bg-slate-800/40 px-6 py-3.5 text-center text-sm font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white sm:flex-none"
              >
                إرسال عبر واتسآب
              </a>
            </div>
          </form>
        </div>

        {/* ─── Security tips ─── */}
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs font-black uppercase tracking-wider text-amber-400">
              تنبيهات أمنية
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {[
              "تأكد أن البريد الإلكتروني المُدخل هو نفسه المسجّل في المنصة.",
              "في حال رفع إيصال مصوّر، يجب أن يكون تاريخ العملية وقيمتها واضحَين.",
              "واتسآب وسيلة دعم مساعدة ولا تُغني عن رفع الإثبات هنا.",
              "في حال تأخّر المراجعة، استخدم رابط الاستفسار أدناه.",
            ].map((tip) => (
              <div
                key={tip}
                className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/60" />
                <p className="text-xs leading-5 text-slate-400">{tip}</p>
              </div>
            ))}
          </div>
          <a
            href={helpWhatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm font-black text-amber-400 transition-all hover:bg-amber-500/10"
          >
            <MessageCircle className="h-4 w-4" />
            تحتاج مساعدة؟
          </a>
        </div>
      </div>
    </section>
  );
}
