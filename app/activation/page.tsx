"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

import {
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
import { StepChooseMethod } from "./_components/wizard/StepChooseMethod";
import { StepSendProof } from "./_components/wizard/StepSendProof";
import { ActivationPulse } from "../../src/components/ActivationPulse";
import {
  ALLOWED_PROOF_IMAGE_TYPES,
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

function getPreferredMethod(mode: PaymentMode): ManualProofMethod {
  if (mode === "international") {
    if (paymentConfig.paypalUrl || paymentConfig.paypalEmail) return "paypal";
    if (paymentConfig.etisalatCashNumber) return "etisalat_cash";
    return "paypal";
  }

  if (paymentConfig.instapayAlias || paymentConfig.instapayNumber) return "instapay";
  if (paymentConfig.vodafoneCashNumber) return "vodafone_cash";
  if (paymentConfig.etisalatCashNumber) return "etisalat_cash";
  if (paymentConfig.bankIban || paymentConfig.bankAccountNumber) return "bank_transfer";
  return "fawry";
}

export default function ActivationPage() {
  const router = useRouter();
  const [mode, setMode] = useState<PaymentMode>("local");
  const [email, setEmail] = useState("");
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);
  const [totalSeats, setTotalSeats] = useState(50);  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [paymentNoticeKind, setPaymentNoticeKind] = useState<"info" | "success" | "error">("info");
  const [proofMethod, setProofMethod] = useState<ManualProofMethod>("instapay");
  const [proofReference, setProofReference] = useState("");
  const [proofAmount, setProofAmount] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofImage, setProofImage] = useState<ProofImageState | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  // Wizard step: 1=choose method, 2=payment + proof
  const [wizardStep, setWizardStep] = useState(1);
  // Selected method id & track id for the wizard
  const [selectedMethodId, setSelectedMethodId] = useState<ManualProofMethod | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [activationStatus, setActivationStatus] = useState<"pending" | "activated">("pending");
  const syncAttemptedRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const availableProofMethods = getProofMethods(mode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nameParam = params.get("name");
    if (nameParam) setUserName(nameParam);
    
    // Also check for email in params to pre-fill
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);

    // Capture Gate Session Continuity
    const gateSessionId = params.get("gateSessionId");
    if (gateSessionId) {
      fetch("/api/gate/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: gateSessionId })
      }).catch(err => console.error("[activation] Gate activation error:", err));
    }
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
    const preferredMethod = getPreferredMethod(mode);
    setSelectedMethodId((current) => {
      if (current === preferredMethod) return current;
      if (current && availableProofMethods.some((method) => method.value === current)) {
        return current;
      }
      return preferredMethod;
    });

    setProofMethod((current) => {
      if (current === preferredMethod) return current;
      if (availableProofMethods.some((method) => method.value === current)) {
        return current;
      }
      return preferredMethod;
    });
  }, [mode, availableProofMethods]);

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
        setTotalSeats(50);      }
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
      setPaymentNotice("ØªÙ…ÙŽÙ‘Øª Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ø¯ÙØ¹ Ø¨Ù†Ø¬Ø§Ø­. Ø¥Ø°Ø§ Ù„Ù… ÙŠØµÙ„Ùƒ ØªØ£ÙƒÙŠØ¯ Ø§Ù„ØªÙØ¹ÙŠÙ„ Ø¨Ø¹Ø¯ØŒ Ø£Ø±Ø³Ù„ Ø±Ù‚Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ© Ø£Ùˆ Ù„Ù‚Ø·Ø© Ø§Ù„Ø´Ø§Ø´Ø© Ø£Ø¯Ù†Ø§Ù‡.");
      setPaymentNoticeKind("success");
    } else if (paymentState === "cancelled") {
      setPaymentNotice("Ù„Ù… ØªÙƒØªÙ…Ù„ Ø§Ù„Ø¹Ù…Ù„ÙŠØ©. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø¬Ø¯Ø¯Ø§Ù‹ Ø£Ùˆ Ø§Ø®ØªÙŠØ§Ø± ÙˆØ³ÙŠÙ„Ø© Ø¯ÙØ¹ Ù…Ø®ØªÙ„ÙØ©.");
      setPaymentNoticeKind("error");
    }
  }, []);

  // Path 2: Real-time Activation Polling
  useEffect(() => {
    if (wizardStep !== 3 || activationStatus === "activated") {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const session = await safeGetSession();
        const user = session?.user;
        if (!user) return;

        const { supabase } = await import("../../src/services/supabaseClient");
        if (!supabase) return;

        // Use public client to check profile (RLS should allow user to see their own profile)
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("[activation] Status poll error:", error);
          return;
        }

        const isPremium = data.role === "premium";
        if (isPremium) {
          setActivationStatus("activated");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          recordFlowEvent("activation_detected_realtime");
        }
      } catch (err) {
        console.error("[activation] Status poll exception:", err);
      }
    };

    // Initial check
    void checkStatus();

    // Poll every 3 seconds (faster for better UX)
    pollingIntervalRef.current = setInterval(() => {
      void checkStatus();
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [wizardStep, activationStatus]);

  const scarcityPct = useMemo(() => {
    if (typeof seatsLeft !== "number") return 0;
    const sold = Math.max(totalSeats - seatsLeft, 0);
    if (totalSeats <= 0) return 0;
    return Math.min((sold / totalSeats) * 100, 100);
  }, [seatsLeft, totalSeats]);

  const priceLine = getFoundingPriceLine();
  const amountPlaceholder = getPaymentAmountPlaceholder(mode);

  const pricingRows = [
    { title: "Ø§Ù„Ø®Ø·Ø©", value: "Ø§Ù„Ø¹Ø¶ÙˆÙŠØ© Ø§Ù„ØªØ£Ø³ÙŠØ³ÙŠØ©", note: "Ø¹Ø¶ÙˆÙŠØ© Ø­ØµØ±ÙŠØ© Ù„Ù„Ù…Ø´ØªØ±ÙƒÙŠÙ† Ø§Ù„Ø£ÙˆØ§Ø¦Ù„" },
    { title: "Ø§Ù„Ù…Ø¯Ø©", value: "Ù…Ø¯Ù‰ Ø§Ù„Ø­ÙŠØ§Ø©", note: "ÙˆØµÙˆÙ„ ÙƒØ§Ù…Ù„ ÙˆØ¯Ø§Ø¦Ù… Ù„ÙƒØ§ÙØ© Ø§Ù„Ù…Ù…ÙŠØ²Ø§Øª" },
    { title: "Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª", value: "ØªÙ„Ù‚Ø§Ø¦ÙŠØ©", note: "Ù…Ø´Ù…ÙˆÙ„Ø© Ø¯Ø§Ø¦Ù…Ø§Ù‹ Ø¯ÙˆÙ† Ø£ÙŠ ØªÙƒØ§Ù„ÙŠÙ Ø¥Ø¶Ø§ÙÙŠØ©" },
  ];
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
      setPaymentNotice("Ø§Ù„ØµÙˆØ±Ø© Ø§ØªØ±ÙØ¹Øª. ÙƒÙ…Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø«Ø¨Ø§Øª.");
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
          proofImage,
          clarity_session_id: typeof window !== "undefined" ? (window as any).clarity?.useSessionId?.() || null : null
        })
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø¯ÙØ¹.");
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
      setPaymentNotice(data.message || "ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø¯ÙØ¹. Ù‡Ù†Ø±Ø§Ø¬Ø¹ Ø§Ù„ØªØ­ÙˆÙŠÙ„ ÙˆÙ†ÙØ¹Ù„ Ø§Ù„Ø­Ø³Ø§Ø¨.");
      setPaymentNoticeKind("success");
      setWizardStep(3);
      
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø¯ÙØ¹.");
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400/80 mb-6">Ø±Ø­Ù„Ø© Ø§Ù„Ù…ØºØ§Ø¯Ø±Ø©</p>
          <h1 className="text-3xl font-black mb-4">Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ù…Ù„Ø§Ø° Ù…ØºÙ„Ù‚Ø© Ù…Ø¤Ù‚ØªØ§Ù‹</h1>
          <p className="text-sm leading-8 text-slate-400 mb-8 max-w-lg mx-auto">
            Ø£Ù†Øª Ø§Ù„Ø¢Ù† Ø¹Ù„Ù‰ Ø£Ø¹ØªØ§Ø¨ Ø§Ù„Ø±Ø­Ù„Ø©ØŒ Ù„ÙƒÙ† Ø§Ù„Ø£Ø¨ÙˆØ§Ø¨ Ø­Ø§Ù„ÙŠØ§Ù‹ ÙÙŠ ÙØªØ±Ø© ØµÙŠØ§Ù†Ø© ÙˆØªØ¬Ù‡ÙŠØ² Ù„Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø§Ù„Ø±ÙØ§Ù‚ Ø§Ù„Ø¬Ø¯Ø¯. 
            Ù‚Ø±ÙŠØ¨Ø§Ù‹ Ø³ØªÙØªØ­ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø§Øª. Ø¥Ø°Ø§ ÙƒØ§Ù†Øª Ù„Ø¯ÙŠÙƒ Ø­Ø§Ù„Ø© Ø®Ø§ØµØ©ØŒ Ø±ÙØ§Ù‚ Ø§Ù„Ø·Ø±ÙŠÙ‚ ÙÙŠ Ø§Ù†ØªØ¸Ø§Ø±Ùƒ.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/" className="rounded-2xl border border-teal-500/20 bg-teal-500/10 px-6 py-3.5 text-sm font-black text-teal-300 transition hover:bg-teal-500/20">
              Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø³Ø§Ø­Ø©
            </a>
            <a
              href={buildPaymentWhatsappHref({ email: "", method: "Ø§Ø³ØªÙØ³Ø§Ø± Ø¹Ø§Ù…" })}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø±ÙØ§Ù‚ (ÙˆØ§ØªØ³Ø¢Ø¨)
            </a>
          </div>
        </motion.div>
      </main>
    );
  }

  const goNext = () => setWizardStep((s) => Math.min(s + 1, 4));
  const goBack = () => {
    setWizardStep((s) => {
      if (s === 1) {
        router.push("/pricing");
        return s;
      }
      return Math.max(s - 1, 1);
    });
  };
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
        <WizardProgressBar currentStep={Math.min(wizardStep, 2)} />

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <AnimatePresence mode="wait" initial={false}>
            {/* Step 1 â€” Choose payment method */}
            {wizardStep === 1 && (
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

            {/* Step 2 â€” Payment + send proof */}
            {wizardStep === 2 && (
              <StepSendProof
                key="step-send-proof"
                selectedMethod={selectedMethodId ?? proofMethod}
                mode={mode}
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

            {/* Step 3 - Success Screen */}
            {wizardStep === 3 && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex w-full max-w-lg flex-col items-center justify-center py-16 text-center"
                dir="rtl"
              >
                <ActivationPulse 
                  isChecking={activationStatus === "pending"} 
                  status={activationStatus}
                  method={proofMethod}
                />
                
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <a
                    href={activationStatus === "activated" ? "/app/dashboard" : "/app"}
                    className={`flex items-center justify-center rounded-2xl py-4 px-8 text-sm font-black text-slate-950 transition-all w-full sm:w-auto ${
                      activationStatus === "activated" 
                        ? "bg-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_36px_rgba(16,185,129,0.4)]" 
                        : "bg-teal-500 shadow-[0_0_24px_rgba(20,184,166,0.3)] hover:bg-teal-400 hover:shadow-[0_0_36px_rgba(20,184,166,0.4)]"
                    }`}
                  >
                    {activationStatus === "activated" ? "Ø§Ø¯Ø®Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ø±Ø­Ù„Ø©" : "Ø§Ù„Ø¹ÙˆØ¯Ø© Ø¥Ù„Ù‰ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚"}
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

