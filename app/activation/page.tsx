"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
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
import { ActivationTrustSection } from "./_components/ActivationTrustSection";
import { ActivationHeroSection } from "./_components/ActivationHeroSection";
import { ActivationPaymentMethodsSection } from "./_components/ActivationPaymentMethodsSection";
import { ActivationNextStepNotice } from "./_components/ActivationNextStepNotice";
import { PaymentProofSection } from "./_components/PaymentProofSection";
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
  // UX Fix: show proof form only after a payment method is chosen
  const [proofFormVisible, setProofFormVisible] = useState(false);
  // Track current funnel step for the progress bar (1=choose, 2=transfer, 3=send-proof)
  const [funnelStep, setFunnelStep] = useState(1);
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
      setPaymentNotice("الدفع تم بنجاح. لو التفعيل لسه ماوصلش، ابعت المرجع أو صورة الدفع تحت.");
      setPaymentNoticeKind("success");
    } else if (paymentState === "cancelled") {
      setPaymentNotice("العملية ماكملتش. تقدر تجرب تاني أو تختار وسيلة مختلفة.");
      setPaymentNoticeKind("error");
    }
  }, []);

  const scarcityPct = useMemo(() => {
    if (typeof seatsLeft !== "number") return 0;
    const sold = Math.max(totalSeats - seatsLeft, 0);
    if (totalSeats <= 0) return 0;
    return Math.min((sold / totalSeats) * 100, 100);
  }, [seatsLeft, totalSeats]);

  const hasBankDetails = Boolean(
    paymentConfig.bankName || paymentConfig.bankBeneficiary || paymentConfig.bankAccountNumber || paymentConfig.bankIban
  );
  const bankValue = [paymentConfig.bankName, paymentConfig.bankBeneficiary].filter(Boolean).join(" - ");
  const bankSecondaryValue = [
    paymentConfig.bankAccountNumber && `Account: ${paymentConfig.bankAccountNumber}`,
    paymentConfig.bankIban && `IBAN: ${paymentConfig.bankIban}`,
    paymentConfig.bankSwift && `SWIFT: ${paymentConfig.bankSwift}`
  ]
    .filter(Boolean)
    .join(" | ");
  const paypalHref =
    paymentConfig.paypalUrl || buildPaymentWhatsappHref({ email, method: "PayPal", note: "محتاج رابط الدفع الدولي" });
  const priceLine = getFoundingPriceLine();
  const amountPlaceholder = getPaymentAmountPlaceholder(mode);
  const copyPaymentValue = async (value: string) => {
    await copyValue(value, setPaymentNotice);
  };

  const pricingRows = [
    {
      title: "Founding Cohort",
      value: paymentConfig.foundingCohortPriceLabel || "30 USD / 500 EGP",
      note: "رحلة مركزة 21 يوم + 100 Awareness Tokens"
    },
    {
      title: "مصر",
      value: paymentConfig.localMonthlyPriceLabel || "500 EGP",
      note: "المسار المحلي الأنسب للدفع من جوه مصر"
    },
    {
      title: "دولي",
      value: paymentConfig.globalMonthlyPriceLabel || "30 USD",
      note: "لأي مستخدم بره مصر أو محتاج دفع دولي"
    }
  ];

  const steps = [
    "اختار وسيلة الدفع اللي تناسبك.",
    "انسخ البيانات أو افتح واتساب لو محتاج تأكيد سريع.",
    "بعد التحويل ابعت المرجع أو لقطة واضحة من نفس الصفحة.",
    "التفعيل اليدوي بيروح للفريق مباشرة، وبعدها الرحلة بتتحفل على حسابك."
  ];

  const trackManualIntent = (method: string) => {
    try {
      recordFlowEvent("payment_intent_submitted", { meta: { source: `manual_${method}` } });
      trackActivationInitiated({ payment_method: method, payment_mode: mode });
      // Reveal proof form and advance funnel step
      setProofFormVisible(true);
      setFunnelStep(2);
    } catch {
      // Keep payment flow resilient.
    }
  };
  const selectPaymentMethod = (method: ManualProofMethod, trackingMethod: string) => {
    setProofMethod(method);
    trackManualIntent(trackingMethod);
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
      trackManualIntent(`${methodValue}_proof_form`);
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "تعذر إرسال إثبات الدفع.");
      setPaymentNoticeKind("error");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const proofSection = (
    <PaymentProofSection
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
      proofWhatsappHref={buildPaymentWhatsappHref({ email, method: "إثبات دفع", note: "هبعت المرجع أو لقطة الشاشة" })}
      helpWhatsappHref={buildPaymentWhatsappHref({ email, method: "استفسار قبل الدفع" })}
    />
  );

  if (!ACTIVATION_PUBLIC_ENABLED) {
    return (
      <main className="min-h-screen bg-[#06131a] px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_30px_120px_-60px_rgba(20,184,166,0.45)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-300">Activation</p>
          <h1 className="mt-4 text-3xl font-black">بوابة التفعيل مش مفتوحة دلوقتي</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            أول ما التفعيل العام يفتح هتلاقي الصفحة دي شغالة مباشرة. لحد وقتها ارجع للمنصة أو كلمنا لو عندك حالة عاجلة.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/" className="rounded-2xl bg-teal-400 px-5 py-3 font-black text-slate-950 transition hover:bg-teal-300">
              ارجع للمنصة
            </a>
            <a
              href={buildPaymentWhatsappHref({ email: "", method: "استفسار عام" })}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 px-5 py-3 font-bold text-white transition hover:bg-white/10"
            >
              افتح واتساب
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#041018] px-4 py-8 text-white md:px-6 md:py-12" 
      style={{ 
        background: "radial-gradient(circle at top, rgba(20,184,166,0.16), transparent 32%), linear-gradient(180deg, #041018 0%, #07161f 42%, #03080d 100%)" 
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6" dir="rtl">
        {paymentNotice ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-medium ${
              paymentNoticeKind === "success"
                ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-50"
                : paymentNoticeKind === "error"
                  ? "border border-rose-300/20 bg-rose-400/10 text-rose-50"
                  : "border border-teal-300/20 bg-teal-400/10 text-teal-50"
            }`}
          >
            {paymentNotice}
          </div>
        ) : null}

        {/* ─── Visual Funnel Progress Bar ─── */}
        <ActivationHeroSection
          funnelStep={funnelStep}
          priceLine={priceLine}
          pricingRows={pricingRows}
          seatsLeft={seatsLeft}
          totalSeats={totalSeats}
          source={source}
          scarcityPct={scarcityPct}
          steps={steps}
          userName={userName}
        />

        <ActivationPaymentMethodsSection
          mode={mode}
          setMode={setMode}
          email={email}
          hasBankDetails={hasBankDetails}
          bankValue={bankValue}
          bankSecondaryValue={bankSecondaryValue}
          paypalHref={paypalHref}
          copyValue={copyPaymentValue}
          selectMethod={selectPaymentMethod}
        />

        {/* Proof form only shows AFTER a payment method is chosen */}
        {!proofFormVisible && <ActivationNextStepNotice />}
        {proofFormVisible && proofSection}

        {/* ─── Trust / Social Proof Section ─── */}
        <ActivationTrustSection />

      </div>
    </main>
  );
}
