"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  } from "lucide-react";
import {
  trackCompleteRegistration,
  trackInitiateCheckout as trackActivationInitiated,
  trackCheckoutViewed as trackActivationViewed
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

  const availableProofMethods = getProofMethods(mode);

  useEffect(() => {
    if (!ACTIVATION_PUBLIC_ENABLED) return;
    try {
      recordFlowEvent("activation_page_viewed");
      trackActivationViewed();
      // Only sync if we have a real identifier the backend accepts (phone or email).
      // storedLeadId goes to metadata as context only â€” backend doesn't use it as lookup key.
      const storedPhone = marketingLeadService.getStoredLeadPhone();
      const storedLeadId = marketingLeadService.getStoredLeadId();
      const hasRealIdentifier = Boolean(storedPhone);
      if (hasRealIdentifier) {
        marketingLeadService.syncLead({
          phone: storedPhone ?? undefined,
          status: "payment_requested",
          source: "activation_page",
          sourceType: "website",
          metadata: { leadId: storedLeadId ?? undefined }
        }).catch(err => console.error("[activation] Lead sync error:", err));
      }
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
        const sessionUser = sessionRes?.data?.session?.user ?? null;
        const scarcity = (await scarcityRes.json()) as ScarcityResponse;
        const isLive = scarcity?.is_live === true;
        if (!mounted) return;
        setEmail(sessionUser?.email || "");
        setSeatsLeft(isLive && typeof scarcity?.seats_left === "number" ? Number(scarcity.seats_left) : null);
        setTotalSeats(Number(scarcity?.total_seats ?? 50));
        setSource(String(scarcity?.source || (isLive ? "supabase" : "unavailable")));
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
      setPaymentNotice("Ø§Ù„Ø¯ÙØ¹ ØªÙ… Ø¨Ù†Ø¬Ø§Ø­. Ù„Ùˆ Ø§Ù„ØªÙØ¹ÙŠÙ„ Ù„Ø³Ù‡ Ù…Ø§ÙˆØµÙ„Ø´ØŒ Ø§Ø¨Ø¹Øª Ø§Ù„Ù…Ø±Ø¬Ø¹ Ø£Ùˆ ØµÙˆØ±Ø© Ø§Ù„Ø¯ÙØ¹ ØªØ­Øª.");
      setPaymentNoticeKind("success");
    } else if (paymentState === "cancelled") {
      setPaymentNotice("Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ù…Ø§ÙƒÙ…Ù„ØªØ´. ØªÙ‚Ø¯Ø± ØªØ¬Ø±Ù‘Ø¨ ØªØ§Ù†ÙŠ Ø£Ùˆ ØªØ®ØªØ§Ø± ÙˆØ³ÙŠÙ„Ø© Ù…Ø®ØªÙ„ÙØ©.");
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
    paymentConfig.paypalUrl || buildPaymentWhatsappHref({ email, method: "PayPal", note: "Ù…Ø­ØªØ§Ø¬ Ø±Ø§Ø¨Ø· Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¯ÙˆÙ„ÙŠ" });
  const priceLine = getFoundingPriceLine();
  const amountPlaceholder = getPaymentAmountPlaceholder(mode);
  const copyPaymentValue = async (value: string) => {
    await copyValue(value, setPaymentNotice);
  };

  const pricingRows = [
    {
      title: "Founding Cohort",
      value: paymentConfig.foundingCohortPriceLabel || "30 USD / 500 EGP",
      note: "Ø±Ø­Ù„Ø© Ù…Ø±ÙƒØ²Ø© 21 ÙŠÙˆÙ… + 100 Awareness Tokens"
    },
    {
      title: "Ù…ØµØ±",
      value: paymentConfig.localMonthlyPriceLabel || "500 EGP",
      note: "Ø§Ù„Ù…Ø³Ø§Ø± Ø§Ù„Ù…Ø­Ù„ÙŠ Ø§Ù„Ø£Ù†Ø³Ø¨ Ù„Ù„Ø¯ÙØ¹ Ù…Ù† Ø¬ÙˆÙ‡ Ù…ØµØ±"
    },
    {
      title: "Ø¯ÙˆÙ„ÙŠ",
      value: paymentConfig.globalMonthlyPriceLabel || "30 USD",
      note: "Ù„Ø£ÙŠ Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø±Ù‡ Ù…ØµØ± Ø£Ùˆ Ù…Ø­ØªØ§Ø¬ Ø¯ÙØ¹ Ø¯ÙˆÙ„ÙŠ"
    }
  ];

  const steps = [
    "Ø§Ø®ØªØ§Ø± ÙˆØ³ÙŠÙ„Ø© Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ù„ÙŠ ØªÙ†Ø§Ø³Ø¨Ùƒ.",
    "Ø§Ù†Ø³Ø® Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø£Ùˆ Ø§ÙØªØ­ ÙˆØ§ØªØ³Ø§Ø¨ Ù„Ùˆ Ù…Ø­ØªØ§Ø¬ ØªØ£ÙƒÙŠØ¯ Ø³Ø±ÙŠØ¹.",
    "Ø¨Ø¹Ø¯ Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ø¨Ø¹Øª Ø§Ù„Ù…Ø±Ø¬Ø¹ Ø£Ùˆ Ù„Ù‚Ø·Ø© ÙˆØ§Ø¶Ø­Ø© Ù…Ù† Ù†ÙØ³ Ø§Ù„ØµÙØ­Ø©.",
    "Ø§Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„ÙŠØ¯ÙˆÙŠ Ø¨ÙŠØ±ÙˆØ­ Ù„Ù„ÙØ±ÙŠÙ‚ Ù…Ø¨Ø§Ø´Ø±Ø©ØŒ ÙˆØ¨Ø¹Ø¯Ù‡Ø§ Ø§Ù„Ø±Ø­Ù„Ø© Ø¨ØªØªÙØ¹Ù„ Ø¹Ù„Ù‰ Ø­Ø³Ø§Ø¨Ùƒ."
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
      setPaymentNotice("Ø§Ø±ÙØ¹ PNG Ø£Ùˆ JPG Ø£Ùˆ WEBP ÙÙ‚Ø·.");
      setPaymentNoticeKind("error");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PROOF_IMAGE_BYTES) {
      setProofImage(null);
      setPaymentNotice("Ø§Ù„ØµÙˆØ±Ø© Ø£ÙƒØ¨Ø± Ù…Ù† Ø§Ù„Ù…Ø³Ù…ÙˆØ­. Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ 900KB.");
      setPaymentNoticeKind("error");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProofImage({ name: file.name, type: file.type, bytes: file.size, dataUrl });
      setPaymentNotice("Ø§Ù„ØµÙˆØ±Ø© Ø§ØªØ±ÙØ¹Øª. ÙƒÙ…Ù‘Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø«Ø¨Ø§Øª.");
      setPaymentNoticeKind("success");
    } catch (error) {
      setProofImage(null);
      setPaymentNotice(error instanceof Error ? error.message : "ØªØ¹Ø°Ø± ØªØ¬Ù‡ÙŠØ² ØµÙˆØ±Ø© Ø§Ù„Ø¥Ø«Ø¨Ø§Øª.");
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
      setPaymentNotice("Ø£Ø¶Ù Ø±Ù‚Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø£Ùˆ Ø§Ø±ÙØ¹ Ù„Ù‚Ø·Ø© ÙˆØ§Ø¶Ø­Ø© Ù‚Ø¨Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„.");
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
        throw new Error(data.error || "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø¯ÙØ¹.");
      }
      const alreadyTrackedThisSession =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(COMPLETE_REGISTRATION_SESSION_KEY) === "true";

      if (!alreadyTrackedThisSession) {
        trackCompleteRegistration({
          flow: "activation_manual_proof",
          method: methodValue,
          payment_mode: modeValue,
          has_reference: Boolean(referenceValue),
          has_proof_image: hasProofImage
        });
        recordFlowEvent("payment_success", {
          meta: {
            source: "activation_manual_proof",
            method: methodValue,
            payment_mode: modeValue
          }
        });
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(COMPLETE_REGISTRATION_SESSION_KEY, "true");
        }
      }

      setProofReference("");
      setProofAmount("");
      setProofNote("");
      setProofImage(null);
      setPaymentNotice(data.message || "ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø¯ÙØ¹. Ù‡Ù†Ø±Ø§Ø¬Ø¹ Ø§Ù„ØªØ­ÙˆÙŠÙ„ ÙˆÙ†ÙØ¹Ù‘Ù„ Ø§Ù„Ø­Ø³Ø§Ø¨.");
      setPaymentNoticeKind("success");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      trackManualIntent(`${methodValue}_proof_form`);
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø¯ÙØ¹.");
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
      proofWhatsappHref={buildPaymentWhatsappHref({ email, method: "Ø¥Ø«Ø¨Ø§Øª Ø¯ÙØ¹", note: "Ù‡Ø¨Ø¹Øª Ø§Ù„Ù…Ø±Ø¬Ø¹ Ø£Ùˆ Ù„Ù‚Ø·Ø© Ø§Ù„Ø´Ø§Ø´Ø©" })}
      helpWhatsappHref={buildPaymentWhatsappHref({ email, method: "Ø§Ø³ØªÙØ³Ø§Ø± Ù‚Ø¨Ù„ Ø§Ù„Ø¯ÙØ¹" })}
    />
  );

  if (!ACTIVATION_PUBLIC_ENABLED) {
    return (
      <main className="min-h-screen bg-[#06131a] px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_30px_120px_-60px_rgba(20,184,166,0.45)]">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-300">Activation</p>
          <h1 className="mt-4 text-3xl font-black">Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„ØªÙØ¹ÙŠÙ„ Ù…Ø´ Ù…ÙØªÙˆØ­Ø© Ø¯Ù„ÙˆÙ‚ØªÙŠ</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Ø£ÙˆÙ„ Ù…Ø§ Ø§Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¹Ø§Ù… ÙŠÙØªØ­ Ù‡ØªÙ„Ø§Ù‚ÙŠ Ø§Ù„ØµÙØ­Ø© Ø¯ÙŠ Ø´ØºØ§Ù„Ø© Ù…Ø¨Ø§Ø´Ø±Ø©. Ù„Ø­Ø¯ ÙˆÙ‚ØªÙ‡Ø§ Ø§Ø±Ø¬Ø¹ Ù„Ù„Ù…Ù†ØµØ© Ø£Ùˆ ÙƒÙ„Ù…Ù†Ø§ Ù„Ùˆ Ø¹Ù†Ø¯Ùƒ Ø­Ø§Ù„Ø© Ø¹Ø§Ø¬Ù„Ø©.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/" className="rounded-2xl bg-teal-400 px-5 py-3 font-black text-slate-950 transition hover:bg-teal-300">
              Ø§Ø±Ø¬Ø¹ Ù„Ù„Ù…Ù†ØµØ©
            </a>
            <a
              href={buildPaymentWhatsappHref({ email: "", method: "Ø§Ø³ØªÙØ³Ø§Ø± Ø¹Ø§Ù…" })}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 px-5 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Ø§ÙØªØ­ ÙˆØ§ØªØ³Ø§Ø¨
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

        {/* â”€â”€â”€ Visual Funnel Progress Bar â”€â”€â”€ */}
        <ActivationHeroSection
          funnelStep={funnelStep}
          priceLine={priceLine}
          pricingRows={pricingRows}
          seatsLeft={seatsLeft}
          totalSeats={totalSeats}
          source={source}
          scarcityPct={scarcityPct}
          steps={steps}
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

        {/* â”€â”€â”€ Trust / Social Proof Section â”€â”€â”€ */}
        <ActivationTrustSection />

      </div>
    </main>
  );
}
