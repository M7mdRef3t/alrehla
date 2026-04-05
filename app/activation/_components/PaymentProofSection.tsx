"use client";

import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";
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
    <section className="rounded-[36px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400 text-sm font-black text-slate-950 shadow-[0_0_18px_rgba(20,184,166,0.55)]">
          3
        </div>
        <div>
          <p className="text-sm font-black text-white">ابعت إثبات الدفع</p>
          <p className="text-xs text-slate-400">هنراجع التحويل ونفعّل الحساب يدويًا</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Payment Proof</p>
          <h2 className="mt-3 text-2xl font-black text-white">دفعت بالفعل؟ ابعت المرجع أو الصورة</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            الفورم بتوصل مباشرة لفريق التفعيل. واتساب متاح كمسار دعم إضافي، مش القناة الوحيدة.
          </p>

          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleProofSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">
                الإيميل المسجل <span className="font-normal text-slate-500">(اختياري)</span>
              </span>
              <input
                id="activation-email"
                name="activationEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/50"
                placeholder="الإيميل اللي سجلت بيه على المنصة"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">وسيلة الدفع</span>
              <select
                id="activation-proof-method"
                name="activationProofMethod"
                value={proofMethod}
                onChange={(event) => setProofMethod(event.target.value as ManualProofMethod)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/50"
              >
                {availableProofMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">رقم العملية أو المرجع</span>
              <input
                id="activation-proof-ref"
                name="activationProofRef"
                type="text"
                value={proofReference}
                onChange={(event) => setProofReference(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/50"
                placeholder="TX-874512"
              />
              <span className="mt-2 block text-xs text-slate-400">سيبه فاضي فقط لو هترفع لقطة واضحة فيها كل التفاصيل.</span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">المبلغ المحول</span>
              <input
                id="activation-proof-amount"
                name="activationProofAmount"
                type="text"
                value={proofAmount}
                onChange={(event) => setProofAmount(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/50"
                placeholder={amountPlaceholder}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-200">لقطة شاشة أو إيصال الدفع</span>
              <input
                id="activation-proof-file"
                name="activationProofFile"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProofImageChange}
                className="block w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-teal-400 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950"
              />
              <span className="mt-2 block text-xs text-slate-400">PNG / JPG / WEBP فقط حتى 900KB.</span>
              {proofImage ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{proofImage.name}</p>
                      <p className="text-xs text-slate-400">
                        {proofImage.type} • {Math.round(proofImage.bytes / 1024)}KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                  <img src={proofImage.dataUrl} alt="معاينة إثبات الدفع" className="mt-3 max-h-56 rounded-xl border border-white/10 object-contain" />
                </div>
              ) : null}
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-200">ملاحظات إضافية</span>
              <textarea
                id="activation-proof-note"
                name="activationProofNote"
                rows={4}
                value={proofNote}
                onChange={(event) => setProofNote(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/50"
                placeholder="لو التحويل تم باسم مختلف، أو في ملاحظة مختصرة تفيد المراجعة، اكتبها هنا."
              />
            </label>

            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmittingProof}
                className="inline-flex items-center rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingProof ? "جاري إرسال الإثبات..." : "إرسال إثبات الدفع"}
              </button>
              <a
                href={proofWhatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                إرسال نسخة على واتساب
              </a>
            </div>
          </form>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
          <p className="text-sm font-black text-white">قبل ما تبعت</p>
          <div className="mt-4 space-y-3">
            {[
              "خلي الإيميل هو نفس الإيميل اللي هيتفعل عليه الحساب.",
              "لو في صورة، خليه واضح فيها المبلغ وتاريخ العملية.",
              "واتساب للتأكيد فقط، مش بديل عن رفع الإثبات.",
              "لو في مشكلة، هنرد عليك على واتساب أو من التذكرة.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-200" />
                <p className="text-sm leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>

          <a
            href={helpWhatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" />
            عندك سؤال قبل الدفع؟
          </a>
        </div>
      </div>
    </section>
  );
}
