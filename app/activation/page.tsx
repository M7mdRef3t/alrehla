"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  trackCompleteRegistration,
  trackInitiateCheckout as trackActivationInitiated,
  trackCheckoutViewed as trackActivationViewed,
  trackEvent,
  AnalyticsEvents,
} from "../../src/services/analytics";
import {
  buildPaymentWhatsappHref,
  getFoundingPriceLine,
  getPaymentAmountPlaceholder,
  getProofMethods,
  paymentConfig,
  type ManualProofMethod,
  type PaymentMode,
} from "../../src/config/paymentConfig";
import { WizardProgressBar } from "./_components/wizard/WizardProgressBar";
import { StepWelcome } from "./_components/wizard/StepWelcome";
import { StepChooseMethod } from "./_components/wizard/StepChooseMethod";
import { StepPaymentDetails } from "./_components/wizard/StepPaymentDetails";
import { StepSendProof } from "./_components/wizard/StepSendProof";
import {
  ALLOWED_PROOF_IMAGE_TYPES,
  COMPLETE_REGISTRATION_SESSION_KEY,
  copyValue,
  isLikelyEgyptUser,
  LAST_PAYMENT_MODE_KEY,
  MAX_PROOF_IMAGE_BYTES,
  readFileAsDataUrl,
  type ProofImageState,
} from "./_lib/paymentProof";
import { recordFlowEvent } from "../../src/services/journeyTracking";
import { safeGetSession } from "../../src/services/supabaseClient";
import { marketingLeadService } from "../../src/services/marketingLeadService";
import { getStoredLeadEmail, setStoredLeadEmail } from "../../src/services/revenueAccess";

type ScarcityResponse = {
  total_seats: number;
  seats_left: number | null;
  source: string;
  is_live?: boolean;
};

const ACTIVATION_PUBLIC_ENABLED = paymentConfig.activationPublicEnabled;

export default function ActivationPage() {
  const [mode, setMode] = useState<PaymentMode>("local");
  const [email, setEmail] = useState("");
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);
  const [totalSeats, setTotalSeats] = useState(50);
  const [source, setSource] = useState("unavailable");
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [paymentNoticeKind, setPaymentNoticeKind] = useState<"info" | "success" | "error">("info");
  const [proofMethod, setProofMethod] = useState<ManualProofMethod>("instapay");
  const [proofReference, setProofReference] = useState("");
  const [proofAmount, setProofAmount] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofImage, setProofImage] = useState<ProofImageState | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  // Wizard step: 1=welcome, 2=choose method, 3=payment details, 4=send proof
  const [wizardStep, setWizardStep] = useState(1);
  // Selected method id & track id for the wizard
  const [selectedMethodId, setSelectedMethodId] = useState<ManualProofMethod | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const syncAttemptedRef = useRef(false);

  const availableProofMethods = getProofMethods(mode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get("name");
    if (nameParam) setUserName(nameParam);
    
    // Also check for email in params to pre-fill
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, []);

  useEffect(() => {
    if (!ACTIVATION_PUBLIC_ENABLED) return;
    try {
      recordFlowEvent("activation_page_viewed");
      trackActivationViewed();
    } catch {
      // Never block activation rendering on analytics issues.
    }
  }, []);

  useEffect(() => {
    if (!ACTIVATION_PUBLIC_ENABLED) return;
    if (isLikelyEgyptUser()) {
      setMode("local");
      return;
    }
    if (typeof window !== "undefined") {
      const storedMode = window.localStorage.getItem(LAST_PAYMENT_MODE_KEY);
      if (storedMode === "local" || storedMode === "international") {
        setMode(storedMode);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LAST_PAYMENT_MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    setProofMethod((current) =>
      availableProofMethods.some((method) => method.value === current)
        ? current
        : availableProofMethods[0]?.value ?? "instapay"
    );
  }, [availableProofMethods]);

  useEffect(() => {
    if (!ACTIVATION_PUBLIC_ENABLED) return;
    let mounted = true;
    const load = async () => {
      try {
        const [sessionRes, scarcityRes] = await Promise.all([
          safeGetSession().then((session) => ({ data: { session } })),
          fetch("/api/public/scarcity", { cache: "no-store" })
        ]);
        const params = new URLSearchParams(window.location.search);
        const emailFromUrl = params.get("email");
        const sessionUser = sessionRes?.data?.session?.user ?? null;
        
        let resolvedEmail = emailFromUrl || sessionUser?.email || "";
        if (!resolvedEmail && typeof window !== "undefined") {
          resolvedEmail = getStoredLeadEmail() || "";
        }
        
        if (resolvedEmail) {
          setStoredLeadEmail(resolvedEmail);
        }
        
        const scarcity = (await scarcityRes.json()) as ScarcityResponse;
        const isLive = scarcity?.is_live === true;
        if (!mounted) return;
        
        setEmail(resolvedEmail);
        setSeatsLeft(isLive && typeof scarcity?.seats_left === "number" ? Number(scarcity.seats_left) : null);
        setTotalSeats(Number(scarcity?.total_seats ?? 50));
        setSource(String(scarcity?.source || (isLive ? "supabase" : "unavailable")));

        if (!syncAttemptedRef.current) {
          syncAttemptedRef.current = true;
          const storedPhone = marketingLeadService.getStoredLeadPhone();
          const storedLeadId = marketingLeadService.getStoredLeadId();
          const hasRealIdentifier = Boolean(storedPhone || resolvedEmail);
          if (hasRealIdentifier) {
            marketingLeadService.syncLead({
              phone: storedPhone ?? undefined,
              email: resolvedEmail || undefined,
              status: "payment_requested",
              source: "activation_page",
              sourceType: "website",
              metadata: { leadId: storedLeadId ?? undefined }
            }).catch(err => console.error("[activation] Lead sync error:", err));
          }
        }
      } catch {
        if (!mounted) return;
        setEmail("");
        setSeatsLeft(null);
        setTotalSeats(50);
        setSource("unavailable");
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paymentState = params.get("payment");
    if (paymentState === "success") {
      setPaymentNotice("تمَّت عملية الدفع بنجاح. إذا لم يصلك تأكيد التفعيل بعد، أرسل رقم العملية أو لقطة الشاشة أدناه.");
      setPaymentNoticeKind("success");
    } else if (paymentState === "cancelled") {
      setPaymentNotice("لم تكتمل العملية. يمكنك المحاولة مجدداً أو اختيار وسيلة دفع مختلفة.");
      setPaymentNoticeKind("error");
    }
  }, []);

  const scarcityPct = useMemo(() => {
    if (typeof seatsLeft !== "number") return 0;
    const sold = Math.max(totalSeats - seatsLeft, 0);
    if (totalSeats <= 0) return 0;
    return Math.min((sold / totalSeats) * 100, 100);
  }, [seatsLeft, totalSeats]);

  const priceLine = getFoundingPriceLine();
  const amountPlaceholder = getPaymentAmountPlaceholder(mode);

  const pricingRows = [
    { title: "الخطة", value: "العضوية التأسيسية", note: "عضوية حصرية للمشتركين الأوائل" },
    { title: "المدة", value: "مدى الحياة", note: "وصول كامل ودائم لكافة المميزات" },
    { title: "التحديثات", value: "تلقائية", note: "مشمولة دائماً دون أي تكاليف إضافية" },
  ];

  const activationSteps = [
    "اختر وسيلة الدفع التي تناسبك من القائمة",
    "حول المبلغ وصور لقطة الشاشة أو احتفظ برقم العملية",
    "ارفع الإثبات في النموذج بالأسفل لربط حسابك",
  ];

  const hasBankDetails = Boolean(paymentConfig.bankIban || paymentConfig.bankAccountNumber);
  const bankValue = paymentConfig.bankIban || paymentConfig.bankAccountNumber || "";
  const bankSecondaryValue = [paymentConfig.bankName, paymentConfig.bankBeneficiary, paymentConfig.bankSwift].filter(Boolean).join(" - ");
  const paypalHref = paymentConfig.paypalUrl || buildPaymentWhatsappHref({ email, method: "PayPal", note: "محتاج رابط PayPal" });

  const selectPaymentMethod = (method: ManualProofMethod, trackingMethod: string) => {
    setProofMethod(method);
    setSelectedMethodId(method);
    try {
      recordFlowEvent("payment_intent_submitted", { meta: { source: `manual_${trackingMethod}` } });
      trackActivationInitiated({ payment_method: trackingMethod, payment_mode: mode });
    } catch {
      // Keep payment flow resilient.
    }
  };

  const handleProofImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProofImage(null);
      return;
    }
    if (!ALLOWED_PROOF_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_PROOF_IMAGE_TYPES)[number])) {
      setProofImage(null);
      setPaymentNotice("ارفع PNG أو JPG أو WEBP فقط.");
      setPaymentNoticeKind("error");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PROOF_IMAGE_BYTES) {
      setProofImage(null);
      setPaymentNotice("الصورة أكبر من المسموح. الحد الأقصى 900KB.");
      setPaymentNoticeKind("error");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProofImage({ name: file.name, type: file.type, bytes: file.size, dataUrl });
      setPaymentNotice("الصورة اترفعت. كمل إرسال الإثبات.");
      setPaymentNoticeKind("success");
    } catch (error) {
      setProofImage(null);
      setPaymentNotice(error instanceof Error ? error.message : "تعذر تجهيز صورة الإثبات.");
      setPaymentNoticeKind("error");
    }
  };

  const handleProofSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const referenceValue = proofReference.trim();
    const amountValue = proofAmount.trim();
    const hasProofImage = Boolean(proofImage);
    const methodValue = proofMethod;
    const modeValue = mode;

    if (!referenceValue && !hasProofImage) {
      setPaymentNotice("أضف رقم العملية أو ارفع لقطة واضحة قبل الإرسال.");
      setPaymentNoticeKind("error");
      return;
    }

    setIsSubmittingProof(true);
    try {
      const session = await safeGetSession();
      const response = await fetch("/api/activation/manual-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          email,
          method: methodValue,
          reference: referenceValue,
          amount: amountValue,
          note: proofNote,
          proofImage
        })
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || "تعذر إرسال إثبات الدفع.");
      }

      trackEvent(AnalyticsEvents.PAYMENT_PROOF_SUBMITTED, {
        flow: "activation_manual_proof",
        method: methodValue,
        payment_mode: modeValue,
        has_reference: Boolean(referenceValue),
        has_proof_image: hasProofImage
      });

      recordFlowEvent("payment_proof_submitted", {
        meta: {
          source: "activation_manual_proof",
          method: methodValue,
          payment_mode: modeValue
        }
      });

      setProofReference("");
      setProofAmount("");
      setProofNote("");
      setProofImage(null);
      setPaymentNotice(data.message || "تم استلام إثبات الدفع. هنراجع التحويل ونفعل الحساب.");
      setPaymentNoticeKind("success");
      
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "تعذر إرسال إثبات الدفع.");
      setPaymentNoticeKind("error");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  if (!ACTIVATION_PUBLIC_ENABLED) {
    return (
      <main className="min-h-screen bg-[#020408] px-4 py-10 text-white relative overflow-hidden flex items-center justify-center">
        {/* Cinematic Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mx-auto max-w-2xl rounded-[32px] border border-white/5 bg-slate-900/40 backdrop-blur-xl p-10 text-center shadow-[0_30px_120px_-60px_rgba(20,184,166,0.3)]"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400/80 mb-6">رحلة المغادرة</p>
          <h1 className="text-3xl font-black mb-4">بوابة الملاذ مغلقة مؤقتاً</h1>
          <p className="text-sm leading-8 text-slate-400 mb-8 max-w-lg mx-auto">
            أنت الآن على أعتاب الرحلة، لكن الأبواب حالياً في فترة صيانة وتجهيز لاستقبال الرفاق الجدد. 
            قريباً ستفتح البوابات. إذا كانت لديك حالة خاصة، رفاق الطريق في انتظارك.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/" className="rounded-2xl border border-teal-500/20 bg-teal-500/10 px-6 py-3.5 text-sm font-black text-teal-300 transition hover:bg-teal-500/20">
              العودة إلى الساحة
            </a>
            <a
              href={buildPaymentWhatsappHref({ email: "", method: "استفسار عام" })}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              تواصل مع الرفاق (واتسآب)
            </a>
          </div>
        </motion.div>
      </main>
    );
  }

  const goNext = () => setWizardStep((s) => Math.min(s + 1, 4));
  const goBack = () => setWizardStep((s) => Math.max(s - 1, 1));
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main className="min-h-screen bg-[#020408] text-white selection:bg-teal-500/30 relative overflow-hidden flex flex-col">
      {/* Cinematic Deep Background */}
      <div className="fixed inset-0 z-0 bg-[#020408]">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)'
          }}
        />
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col">
        {/* Sticky step progress bar */}
        <WizardProgressBar currentStep={wizardStep} />

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <AnimatePresence mode="wait" initial={false}>
            {/* Step 1 — Welcome */}
            {wizardStep === 1 && (
              <StepWelcome
                key="step-welcome"
                userName={userName}
                priceLine={priceLine}
                pricingRows={pricingRows}
                seatsLeft={seatsLeft}
                totalSeats={totalSeats}
                scarcityPct={scarcityPct}
                onNext={() => { goNext(); scrollTop(); }}
              />
            )}

            {/* Step 2 — Choose payment method */}
            {wizardStep === 2 && (
              <StepChooseMethod
                key="step-choose-method"
                mode={mode}
                setMode={setMode}
                selectedMethod={selectedMethodId}
                onSelect={(method, trackId) => {
                  selectPaymentMethod(method, trackId);
                }}
                onNext={() => { goNext(); scrollTop(); }}
                onBack={() => { goBack(); scrollTop(); }}
              />
            )}

            {/* Step 3 — Payment details / copy data */}
            {wizardStep === 3 && selectedMethodId && (
              <StepPaymentDetails
                key="step-payment-details"
                selectedMethod={selectedMethodId}
                mode={mode}
                email={email}
                onNext={() => { goNext(); scrollTop(); }}
                onBack={() => { goBack(); scrollTop(); }}
              />
            )}

            {/* Step 4 — Send proof */}
            {wizardStep === 4 && (
              <StepSendProof
                key="step-send-proof"
                email={email}
                setEmail={setEmail}
                proofMethod={proofMethod}
                setProofMethod={setProofMethod}
                availableProofMethods={availableProofMethods}
                proofReference={proofReference}
                setProofReference={setProofReference}
                proofAmount={proofAmount}
                setProofAmount={setProofAmount}
                amountPlaceholder={amountPlaceholder}
                handleProofImageChange={handleProofImageChange}
                proofImage={proofImage}
                setProofImage={setProofImage}
                proofNote={proofNote}
                setProofNote={setProofNote}
                isSubmittingProof={isSubmittingProof}
                handleProofSubmit={handleProofSubmit}
                onBack={() => { goBack(); scrollTop(); }}
                paymentNotice={paymentNotice}
                paymentNoticeKind={paymentNoticeKind}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
