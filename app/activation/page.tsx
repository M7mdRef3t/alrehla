"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Copy, Check, Upload, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { marketingLeadService } from "../../src/services/marketingLeadService";
import { recordFlowEvent } from "../../src/services/journeyTracking";
import { safeGetSession } from "../../src/services/supabaseClient";
import { revenueConfig } from "../../src/config/opsLinks";
import { AppAtmosphere } from "../../src/components/shared/AppAtmosphere";

// We now use revenueConfig.number from src/config/opsLinks.ts
const VODAFONE_CASH_NUMBER = revenueConfig.number;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_IMAGE_BYTES = 900_000;

type ProofImageState = { name: string; type: string; bytes: number; dataUrl: string };

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ActivationPage() {
  const router = useRouter();
  
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState("");
  const [proofImage, setProofImage] = useState<ProofImageState | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeKind, setNoticeKind] = useState<"info" | "success" | "error">("info");
  
  const [step, setStep] = useState<"upload" | "success">("upload");

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Auto-fill phone if we have it locally
    const storedPhone = marketingLeadService.getStoredLeadPhone();
    if (storedPhone) setPhone(storedPhone);

    recordFlowEvent("activation_page_viewed");
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(VODAFONE_CASH_NUMBER).catch(() => null);
    setCopied(true);
    recordFlowEvent("activation_copy_number_clicked");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProofImage(null);
      return;
    }
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      setProofImage(null);
      setNotice("برجاء رفع صورة بصيغة PNG أو JPG أو WEBP فقط.");
      setNoticeKind("error");
      e.target.value = "";
      return;
    }
    
    if (file.size > MAX_IMAGE_BYTES) {
      setProofImage(null);
      setNotice("الصورة أكبر من المسموح. الحد الأقصى 900KB.");
      setNoticeKind("error");
      e.target.value = "";
      return;
    }
    
    try {
      recordFlowEvent("activation_proof_upload_started");
      const dataUrl = await readFileAsDataUrl(file);
      setProofImage({ name: file.name, type: file.type, bytes: file.size, dataUrl });
      setNotice("الصورة اترفعت بنجاح. كمل إرسال الإثبات.");
      setNoticeKind("success");
      recordFlowEvent("activation_proof_upload_completed");
    } catch {
      setProofImage(null);
      setNotice("حدث خطأ أثناء تجهيز الصورة.");
      setNoticeKind("error");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setNotice("الجوال مطلوب عشان نربط التحويل بحسابك.");
      setNoticeKind("error");
      return;
    }
    if (!proofImage) {
      setNotice("برجاء رفع إثبات الدفع (لقطة شاشة).");
      setNoticeKind("error");
      return;
    }

    setIsSubmitting(true);
    setNotice(null);
    recordFlowEvent("activation_submit_clicked");

    try {
      const session = await safeGetSession();
      const payload = {
        phone,
        method: "vodafone_cash",
        proofImage,
        note: notes
      };
      
      const res = await fetch("/api/activation/manual-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "تعذر إرسال إثبات الدفع.");
      
      // Update local lead status
      marketingLeadService.syncLead({ status: "proof_received", phone });
      recordFlowEvent("activation_submit_success");
      
      setStep("success");
      
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (_err) {
      setNotice(_err instanceof Error ? _err.message : "حدث خطأ غير متوقع.");
      setNoticeKind("error");
      recordFlowEvent("activation_submit_failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent text-white selection:bg-teal-500/30 relative flex flex-col items-center py-10 px-4 md:px-0" dir="rtl">
      <AppAtmosphere mode="default" intensity={1} />

      <div className="relative z-10 w-full max-w-lg mt-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            مرحلة التفعيل
          </span>
          <h1 className="mt-6 text-3xl font-black text-white drop-shadow-md">
            تفعيل إحداثياتك (درع الحماية)
          </h1>
          <p className="mt-3 text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            الرحلة تعتمد على نظام تفعيل دقيق. لاستلام خريطتك الشاملة وروشتة العلاج، قم بتأكيد العبور.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.form 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              
              {/* Payment Number Card */}
              <div className="overflow-hidden rounded-3xl border border-[rgba(0,240,255,0.25)] bg-[rgba(5,8,20,0.75)] backdrop-blur-xl transition hover:border-[rgba(0,240,255,0.4)] shadow-[0_0_40px_rgba(0,240,255,0.05)]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">فودافون كاش</p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      copied
                        ? "bg-teal-500/20 text-teal-300"
                        : "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300"
                    }`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "تم النسخ" : "نسخ الرقم"}
                  </button>
                </div>
                <div className="px-5 py-6">
                  <p className="text-center font-mono text-3xl font-black tracking-[0.1em] text-white">
                    {VODAFONE_CASH_NUMBER.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-2xl border border-teal-500/15 bg-teal-500/[0.04] px-5 py-4 text-xs text-slate-300 leading-6">
                <ul className="space-y-2 list-none p-0 m-0">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    تأكد إن التحويل من محفظة فودافون كاش مباشرة.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    خد سكرين شوت لرسالة الإرسال اللي بتظهر بنجاح.
                  </li>
                </ul>
              </div>

              {/* Notice */}
              {notice && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border px-4 py-3 text-xs leading-6 ${
                  noticeKind === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" :
                  noticeKind === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-200" :
                  "border-sky-500/30 bg-sky-500/10 text-sky-200"
                }`}>
                  {notice}
                </motion.div>
              )}

              {/* Fields */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[13px] font-black text-slate-300">رقم الهاتف <span className="font-normal text-slate-500">(الذي تم التحويل منه أو التواصل به)</span></label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    className="w-full text-left rounded-2xl border border-[rgba(0,240,255,0.2)] bg-[rgba(5,8,20,0.5)] px-5 py-4 text-sm font-mono text-white outline-none placeholder:text-[rgba(255,255,255,0.3)] transition-all focus:border-[rgba(0,240,255,0.5)] focus:bg-[rgba(5,8,20,0.8)] shadow-inner"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-black text-slate-300">لقطة شاشة التفعيل</label>
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
                          <img src={proofImage.dataUrl} alt="الإثبات" className="max-h-48 w-full rounded-lg object-contain" />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.label
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-[rgba(0,240,255,0.25)] bg-[rgba(5,8,20,0.4)] px-6 py-10 text-center shadow-inner transition-all hover:border-[rgba(0,240,255,0.5)] hover:bg-[rgba(5,8,20,0.6)] backdrop-blur-md"
                      >
                        <Upload className="h-8 w-8 text-slate-500 transition-colors group-hover:text-teal-400" />
                        <p className="text-sm font-black text-slate-300">أرفق لقطة الشاشة (Screenshot)</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500">Max size: 900KB</p>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </motion.label>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-black text-slate-300">ملاحظات <span className="font-normal text-slate-500">(اختياري)</span></label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظة أو اسم إضافي لتسريع المراجعة"
                    className="w-full resize-none rounded-2xl border border-[rgba(0,240,255,0.2)] bg-[rgba(5,8,20,0.5)] px-5 py-4 text-sm text-white outline-none placeholder:text-[rgba(255,255,255,0.3)] transition-all focus:border-[rgba(0,240,255,0.5)] focus:bg-[rgba(5,8,20,0.8)] shadow-inner"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 mt-4">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex items-center justify-center rounded-2xl border border-white/10 px-5 py-4 text-sm font-bold text-slate-400 transition hover:border-white/20 hover:bg-white/5 hover:text-slate-200"
                >
                  العودة
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex flex-1 items-center justify-center gap-3 rounded-2xl bg-[#00f0ff] py-4 text-sm font-black text-[#020408] shadow-[0_0_24px_rgba(0,240,255,0.3)] transition-all hover:bg-[#2dd4bf] hover:shadow-[0_0_36px_rgba(0,240,255,0.4)] disabled:opacity-40"
                >
                  {isSubmitting ? (
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
              </div>

            </motion.form>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-full flex-col items-center justify-center py-10 text-center bg-slate-900/40 border border-white/5 rounded-3xl p-8"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-3">تم تسلُم الإثبات بنجاح</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-sm">
                تم تسجيل طلبك وحالياً قيد المراجعة اليدوية من قبل فريق التشغيل. سيتم تفعيل وصولك وربطه بملفك خلال ساعات.
              </p>
              
              <button
                onClick={() => router.push("/")}
                className="rounded-2xl border border-teal-500/20 bg-teal-500/10 px-8 py-4 text-sm font-black text-teal-300 transition-all hover:bg-teal-500/20 w-full md:w-auto"
              >
                العودة للرحلة
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
