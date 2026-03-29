"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Landmark,
  MessageCircle,
  ShieldCheck,
  Wallet
} from "lucide-react";
import {
  trackCompleteRegistration,
  trackInitiateCheckout as trackActivationInitiated,
  trackCheckoutViewed as trackActivationViewed
} from "../../src/services/analytics";
import { recordFlowEvent } from "../../src/services/journeyTracking";
import { safeGetSession } from "../../src/services/supabaseClient";
import { marketingLeadService } from "../../src/services/marketingLeadService";

type ScarcityResponse = {
  total_seats: number;
  seats_left: number | null;
  source: string;
  is_live?: boolean;
};

type PaymentMode = "local" | "international";
type ManualProofMethod = "instapay" | "vodafone_cash" | "etisalat_cash" | "bank_transfer" | "fawry" | "paypal";

type ProofImageState = {
  name: string;
  type: string;
  bytes: number;
  dataUrl: string;
};

const ACTIVATION_PUBLIC_ENABLED = process.env.NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED === "true";
const DEFAULT_WHATSAPP_NUMBER = "201123003681";
const WHATSAPP_NUMBER_RAW = process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER || DEFAULT_WHATSAPP_NUMBER;
const INSTAPAY_ALIAS = String(process.env.NEXT_PUBLIC_PAYMENT_INSTAPAY_ALIAS || "").trim();
const INSTAPAY_NUMBER = String(process.env.NEXT_PUBLIC_PAYMENT_INSTAPAY_NUMBER || "").trim();
const VODAFONE_CASH_NUMBER = String(process.env.NEXT_PUBLIC_PAYMENT_VODAFONE_CASH_NUMBER || "").trim();
const ETISALAT_CASH_NUMBER = String(process.env.NEXT_PUBLIC_PAYMENT_ETISALAT_CASH_NUMBER || "").trim();
const BANK_NAME = String(process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME || "").trim();
const BANK_BENEFICIARY = String(process.env.NEXT_PUBLIC_PAYMENT_BANK_BENEFICIARY || "").trim();
const BANK_ACCOUNT_NUMBER = String(process.env.NEXT_PUBLIC_PAYMENT_BANK_ACCOUNT_NUMBER || "").trim();
const BANK_IBAN = String(process.env.NEXT_PUBLIC_PAYMENT_BANK_IBAN || "").trim();
const BANK_SWIFT = String(process.env.NEXT_PUBLIC_PAYMENT_BANK_SWIFT || "").trim();
const PAYPAL_URL = String(process.env.NEXT_PUBLIC_PAYMENT_PAYPAL_URL || "").trim();
const PAYPAL_EMAIL = String(process.env.NEXT_PUBLIC_PAYMENT_PAYPAL_EMAIL || "").trim();
const FOUNDING_COHORT_PRICE_LABEL = String(process.env.NEXT_PUBLIC_FOUNDING_COHORT_PRICE_LABEL || "").trim();
const LOCAL_MONTHLY_PRICE_LABEL = String(process.env.NEXT_PUBLIC_LOCAL_PREMIUM_PRICE_LABEL || "").trim();
const GLOBAL_MONTHLY_PRICE_LABEL = String(process.env.NEXT_PUBLIC_GLOBAL_PREMIUM_PRICE_LABEL || "").trim();
const LAST_PAYMENT_MODE_KEY = "activation.last_payment_mode";
const COMPLETE_REGISTRATION_SESSION_KEY = "activation.complete_registration_tracked";
const ALLOWED_PROOF_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_PROOF_IMAGE_BYTES = 900_000;

const LOCAL_PROOF_METHODS: Array<{ value: ManualProofMethod; label: string }> = [
  { value: "instapay", label: "InstaPay" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
  { value: "etisalat_cash", label: "Etisalat Cash" },
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "fawry", label: "فوري" }
];

const INTERNATIONAL_PROOF_METHODS: Array<{ value: ManualProofMethod; label: string }> = [
  { value: "paypal", label: "PayPal" },
  { value: "etisalat_cash", label: "e& money / Etisalat Cash" }
];

function isLikelyEgyptUser(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  const locales = [nav.language, ...(nav.languages ?? [])].map((value) => String(value ?? "").toLowerCase());
  const hasEgyptLocale = locales.some((locale) => locale.includes("ar-eg"));
  const tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "").toLowerCase();
  const hasEgyptTimezone = tz.includes("cairo") || tz.includes("egypt");
  return hasEgyptLocale || hasEgyptTimezone;
}

function normalizeWhatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

function buildWhatsappHref(args: { email: string; method: string; note?: string }): string {
  const safeEmail = args.email || "غير_مسجل";
  const message = [
    "أهلا، عايز أفعل رحلة دواير.",
    `طريقة الدفع المختارة: ${args.method}.`,
    `الإيميل المسجل: ${safeEmail}.`,
    args.note ? `ملاحظة: ${args.note}.` : "",
    "محتاج تأكيد بيانات الدفع أو مراجعة إثبات التحويل."
  ]
    .filter(Boolean)
    .join(" ");

  return `https://wa.me/${normalizeWhatsappNumber(WHATSAPP_NUMBER_RAW)}?text=${encodeURIComponent(message)}`;
}

async function copyValue(value: string, onDone: (message: string) => void) {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  await navigator.clipboard.writeText(value);
  onDone("اتنسخت البيانات. حوّل وارجع ابعت إثبات الدفع.");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ماقدرناش نجهز صورة الإثبات."));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });
}

function MethodCard({
  title,
  subtitle,
  value,
  valueLabel,
  actionLabel,
  href,
  onAction,
  icon,
  secondaryValue,
  badge
}: {
  title: string;
  subtitle: string;
  value?: string;
  valueLabel?: string;
  actionLabel: string;
  href: string;
  onAction: () => void;
  icon: ReactNode;
  secondaryValue?: string;
  badge?: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_-42px_rgba(20,184,166,0.35)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-400/25 bg-teal-400/10 text-teal-200">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-white">{title}</h3>
            {badge ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-300">{subtitle}</p>
          {value ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3">
              {valueLabel ? <p className="mb-1 text-[11px] font-black text-slate-500">{valueLabel}</p> : null}
              <p className="break-all font-mono text-sm text-teal-100">{value}</p>
              {secondaryValue ? <p className="mt-2 break-all font-mono text-xs text-slate-400">{secondaryValue}</p> : null}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {value ? (
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <Copy className="h-4 w-4" />
                نسخ البيانات
              </button>
            ) : null}
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-400 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-teal-300"
            >
              <ArrowUpRight className="h-4 w-4" />
              {actionLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const availableProofMethods = mode === "local" ? LOCAL_PROOF_METHODS : INTERNATIONAL_PROOF_METHODS;

  useEffect(() => {
    if (!ACTIVATION_PUBLIC_ENABLED) return;
    try {
      recordFlowEvent("activation_page_viewed");
      trackActivationViewed();
      // Only sync if we have a real identifier the backend accepts (phone or email).
      // storedLeadId goes to metadata as context only — backend doesn't use it as lookup key.
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
      setPaymentNotice("الدفع تم بنجاح. لو التفعيل لسه ماوصلش، ابعت المرجع أو صورة الدفع تحت.");
      setPaymentNoticeKind("success");
    } else if (paymentState === "cancelled") {
      setPaymentNotice("العملية ماكملتش. تقدر تجرّب تاني أو تختار وسيلة مختلفة.");
      setPaymentNoticeKind("error");
    }
  }, []);

  const scarcityPct = useMemo(() => {
    if (typeof seatsLeft !== "number") return 0;
    const sold = Math.max(totalSeats - seatsLeft, 0);
    if (totalSeats <= 0) return 0;
    return Math.min((sold / totalSeats) * 100, 100);
  }, [seatsLeft, totalSeats]);

  const hasBankDetails = Boolean(BANK_NAME || BANK_BENEFICIARY || BANK_ACCOUNT_NUMBER || BANK_IBAN);
  const bankValue = [BANK_NAME, BANK_BENEFICIARY].filter(Boolean).join(" - ");
  const bankSecondaryValue = [
    BANK_ACCOUNT_NUMBER && `Account: ${BANK_ACCOUNT_NUMBER}`,
    BANK_IBAN && `IBAN: ${BANK_IBAN}`,
    BANK_SWIFT && `SWIFT: ${BANK_SWIFT}`
  ]
    .filter(Boolean)
    .join(" | ");
  const paypalHref = PAYPAL_URL || buildWhatsappHref({ email, method: "PayPal", note: "محتاج رابط الدفع الدولي" });
  const priceLine = FOUNDING_COHORT_PRICE_LABEL
    ? `سعر الدفعة الحالية: ${FOUNDING_COHORT_PRICE_LABEL}`
    : "السعر بيتأكد معاك يدوي قبل التحويل. مفيش رقم وهمي ولا رقم متخيل.";
  const amountPlaceholder =
    mode === "local"
      ? LOCAL_MONTHLY_PRICE_LABEL || "500 EGP"
      : GLOBAL_MONTHLY_PRICE_LABEL || FOUNDING_COHORT_PRICE_LABEL || "30 USD";

  const pricingRows = [
    { title: "Founding Cohort", value: FOUNDING_COHORT_PRICE_LABEL || "30 USD / 500 EGP", note: "رحلة مركزة 21 يوم + 100 Awareness Tokens" },
    { title: "مصر", value: LOCAL_MONTHLY_PRICE_LABEL || "500 EGP", note: "المسار المحلي الأنسب للدفع من جوه مصر" },
    { title: "دولي", value: GLOBAL_MONTHLY_PRICE_LABEL || "30 USD", note: "لأي مستخدم بره مصر أو محتاج دفع دولي" }
  ];

  const steps = [
    "اختار وسيلة الدفع اللي تناسبك.",
    "انسخ البيانات أو افتح واتساب لو محتاج تأكيد سريع.",
    "بعد التحويل ابعت المرجع أو لقطة واضحة من نفس الصفحة.",
    "التفعيل اليدوي بيروح للفريق مباشرة، وبعدها الرحلة بتتفعل على حسابك."
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
      setPaymentNotice("الصورة اترفعت. كمّل إرسال الإثبات.");
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
      setPaymentNotice(data.message || "تم استلام إثبات الدفع. هنراجع التحويل ونفعّل الحساب.");
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
              href={buildWhatsappHref({ email: "", method: "استفسار عام" })}
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
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="flex items-center gap-0" dir="rtl">
            {[
              { n: 1, label: "اختار طريقة الدفع" },
              { n: 2, label: "حوّل الفلوس" },
              { n: 3, label: "ابعت الإثبات" }
            ].map((s, i) => (
              <>
                <div key={s.n} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-all duration-500 ${
                      funnelStep >= s.n
                        ? "bg-teal-400 text-slate-950 shadow-[0_0_18px_rgba(20,184,166,0.55)]"
                        : "bg-white/10 text-slate-500"
                    }`}
                  >
                    {funnelStep > s.n ? "✓" : s.n}
                  </div>
                  <span className={`text-[11px] font-bold text-center leading-tight hidden sm:block ${
                    funnelStep >= s.n ? "text-teal-300" : "text-slate-600"
                  }`}>{s.label}</span>
                </div>
                {i < 2 && (
                  <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-700 ${
                    funnelStep > s.n ? "bg-teal-400/60" : "bg-white/10"
                  }`} />
                )}
              </>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">Founding Cohort</p>
              <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight md:text-5xl">فعل رحلتك من غير لف ودوران</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base md:leading-8">
                اختار طريقة الدفع، ابعت الإثبات، وإحنا نراجع التفعيل يدويًا على نفس الحساب.
              </p>
              <div className="mt-5 inline-flex rounded-2xl border border-teal-300/20 bg-teal-400/10 px-4 py-3 text-sm font-bold text-teal-100">
                {priceLine}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pricingRows.map((row) => (
                  <div key={row.title} className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{row.title}</p>
                    <p className="mt-2 text-xl font-black text-white">{row.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{row.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/20 p-6 md:p-8 lg:border-r lg:border-t-0">
              <div className="rounded-[28px] border border-amber-300/15 bg-amber-400/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-200/10 text-amber-200">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">الحجز الحالي</p>
                    <p className="text-xs text-amber-100/80">التحديث حيّ لما المصدر يكون متاح</p>
                  </div>
                </div>
                <p className="mt-4 text-3xl font-black text-white">{typeof seatsLeft === "number" ? seatsLeft : "--"}</p>
                <p className="mt-1 text-sm text-slate-300">{typeof seatsLeft === "number" ? "مقاعد متبقية الآن" : "بيانات المقاعد غير متاحة"}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-teal-300 transition-all duration-500" style={{ width: `${scarcityPct}%` }} />
                </div>
                <p className="mt-3 text-xs text-slate-400">المصدر: {source} • السعة الكلية: {totalSeats}</p>
              </div>

              <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-black text-white">الخطوات</p>
                <ol className="mt-4 space-y-3">
                  {steps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-teal-200">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-white/10 bg-black/20 p-5 md:p-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("local")}
              className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                mode === "local" ? "bg-teal-400 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              دفع محلي داخل مصر
            </button>
            <button
              type="button"
              onClick={() => setMode("international")}
              className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                mode === "international" ? "bg-teal-400 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              دفع دولي
            </button>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            {mode === "local"
              ? "لو إنت داخل مصر، اختار الأنسب ليك وابعت الإثبات بعد التحويل."
              : "لو خارج مصر، استخدم PayPal أو المسار الدولي وبعدها ابعت المرجع هنا."}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {mode === "local" ? (
              <>
                <MethodCard
                  title="InstaPay"
                  subtitle={
                    INSTAPAY_ALIAS || INSTAPAY_NUMBER
                      ? "حوّل مباشرة على البيانات دي، وبعدها ابعت المرجع أو الصورة تحت."
                      : "بيانات InstaPay لسه مش منشورة هنا. افتح واتساب وخدها مباشرة."
                  }
                  value={INSTAPAY_ALIAS || INSTAPAY_NUMBER || undefined}
                  valueLabel={INSTAPAY_ALIAS ? "Alias" : "رقم InstaPay"}
                  secondaryValue={INSTAPAY_ALIAS && INSTAPAY_NUMBER ? `رقم الهاتف: ${INSTAPAY_NUMBER}` : undefined}
                  actionLabel={INSTAPAY_ALIAS || INSTAPAY_NUMBER ? "واتساب للتأكيد" : "اطلب بيانات InstaPay"}
                  href={buildWhatsappHref({ email, method: "InstaPay" })}
                  onAction={() => {
                    setProofMethod("instapay");
                    trackManualIntent("instapay");
                    const payload = [INSTAPAY_ALIAS, INSTAPAY_NUMBER].filter(Boolean).join("\n");
                    if (payload) void copyValue(payload, setPaymentNotice);
                  }}
                  icon={<Wallet className="h-5 w-5" />}
                  badge="الأسرع"
                />

                <MethodCard
                  title="Vodafone Cash"
                  subtitle={
                    VODAFONE_CASH_NUMBER
                      ? "لو التحويل بالمحفظة أسهل ليك، استخدم الرقم ده وابعث إثبات الدفع."
                      : "رقم المحفظة هنبعته لك يدوي على واتساب."
                  }
                  value={VODAFONE_CASH_NUMBER || undefined}
                  valueLabel="رقم المحفظة"
                  actionLabel={VODAFONE_CASH_NUMBER ? "واتساب للتأكيد" : "اطلب رقم Vodafone Cash"}
                  href={buildWhatsappHref({ email, method: "Vodafone Cash" })}
                  onAction={() => {
                    setProofMethod("vodafone_cash");
                    trackManualIntent("vodafone_cash");
                    if (VODAFONE_CASH_NUMBER) void copyValue(VODAFONE_CASH_NUMBER, setPaymentNotice);
                  }}
                  icon={<Wallet className="h-5 w-5" />}
                />

                <MethodCard
                  title="Etisalat Cash"
                  subtitle={
                    ETISALAT_CASH_NUMBER
                      ? "نفس الفكرة: حوّل على المحفظة وابعت المرجع أو لقطة واضحة."
                      : "لو دي أنسب طريقة ليك، افتح واتساب وخد التفاصيل."
                  }
                  value={ETISALAT_CASH_NUMBER || undefined}
                  valueLabel="رقم المحفظة"
                  actionLabel={ETISALAT_CASH_NUMBER ? "واتساب للتأكيد" : "اطلب رقم Etisalat Cash"}
                  href={buildWhatsappHref({ email, method: "Etisalat Cash" })}
                  onAction={() => {
                    setProofMethod("etisalat_cash");
                    trackManualIntent("etisalat_cash");
                    if (ETISALAT_CASH_NUMBER) void copyValue(ETISALAT_CASH_NUMBER, setPaymentNotice);
                  }}
                  icon={<Wallet className="h-5 w-5" />}
                />

                <MethodCard
                  title="تحويل بنكي"
                  subtitle={
                    hasBankDetails
                      ? "لو هتحوّل من بنك لبنك، استخدم بيانات المستفيد دي وبعدها ابعت إثبات التحويل."
                      : "بيانات الحساب البنكي بتتبعت يدوي حسب الحالة."
                  }
                  value={hasBankDetails ? bankValue : undefined}
                  valueLabel="بيانات المستفيد"
                  secondaryValue={hasBankDetails ? bankSecondaryValue || undefined : undefined}
                  actionLabel={hasBankDetails ? "واتساب للتأكيد" : "اطلب بيانات الحساب"}
                  href={buildWhatsappHref({ email, method: "تحويل بنكي" })}
                  onAction={() => {
                    setProofMethod("bank_transfer");
                    trackManualIntent("bank_transfer");
                    if (hasBankDetails) {
                      void copyValue([bankValue, bankSecondaryValue].filter(Boolean).join("\n"), setPaymentNotice);
                    }
                  }}
                  icon={<Landmark className="h-5 w-5" />}
                />

                <MethodCard
                  title="فوري"
                  subtitle="فوري هنا مش automated بالكامل دلوقتي. افتح واتساب لو عايز ننسق لك المسار المناسب أو المرجع اليدوي."
                  actionLabel="افتح واتساب"
                  href={buildWhatsappHref({ email, method: "Fawry", note: "محتاج مسار دفع فوري" })}
                  onAction={() => {
                    setProofMethod("fawry");
                    trackManualIntent("fawry");
                  }}
                  icon={<Building2 className="h-5 w-5" />}
                />
              </>
            ) : (
              <>
                <MethodCard
                  title="PayPal"
                  subtitle={
                    PAYPAL_URL
                      ? "افتح الرابط، كمّل الدفع، وارجع ابعت المرجع أو لقطة واضحة."
                      : PAYPAL_EMAIL
                        ? "استخدم الإيميل ده على PayPal وبعدها ابعت إثبات التحويل."
                        : "رابط الدفع الدولي مش ظاهر هنا حاليًا. افتح واتساب وخده مباشرة."
                  }
                  value={PAYPAL_EMAIL || undefined}
                  valueLabel={PAYPAL_EMAIL ? "PayPal Email" : undefined}
                  actionLabel={PAYPAL_URL ? "افتح PayPal" : "اطلب رابط PayPal"}
                  href={paypalHref}
                  onAction={() => {
                    setProofMethod("paypal");
                    trackManualIntent("paypal");
                    if (PAYPAL_EMAIL) void copyValue(PAYPAL_EMAIL, setPaymentNotice);
                  }}
                  icon={<MessageCircle className="h-5 w-5" />}
                  badge="International"
                />

                <MethodCard
                  title="e& money / Etisalat"
                  subtitle="لو التحويل الدولي عبر e& money مناسب ليك، افتح تفاصيل الخدمة واعتمد نفس مسار الإثبات بعد الدفع."
                  value={ETISALAT_CASH_NUMBER || undefined}
                  valueLabel={ETISALAT_CASH_NUMBER ? "رقم المحفظة" : undefined}
                  actionLabel="تفاصيل الخدمة"
                  href="https://www.eand.com.eg/portal/pages/services/International_money_remittance.html"
                  onAction={() => {
                    setProofMethod("etisalat_cash");
                    trackManualIntent("etisalat_international");
                    if (ETISALAT_CASH_NUMBER) void copyValue(ETISALAT_CASH_NUMBER, setPaymentNotice);
                  }}
                  icon={<ExternalLink className="h-5 w-5" />}
                />
              </>
            )}
          </div>
        </section>

        {/* Proof form only shows AFTER a payment method is chosen */}
        {!proofFormVisible && (
          <div className="rounded-[36px] border border-teal-500/20 bg-teal-400/5 p-6 text-center">
            <p className="text-sm font-black text-teal-300 uppercase tracking-widest">الخطوة التالية</p>
            <p className="mt-2 text-base font-bold text-white">
              اختار طريقة الدفع اللي تناسبك من فوق 👆
            </p>
            <p className="mt-1 text-sm text-slate-400">
              بعد ما تنسخ البيانات أو تفتح واتساب، هيظهر لك فورم إرسال الإثبات تلقائياً.
            </p>
          </div>
        )}
        {proofFormVisible && (
        <section className="rounded-[36px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400 text-slate-950 text-sm font-black shadow-[0_0_18px_rgba(20,184,166,0.55)]">
              3
            </div>
            <div>
              <p className="text-sm font-black text-white">ابعت إثبات الدفع</p>
              <p className="text-xs text-slate-400">هنراجع التحويل ونفعّل الحساب يدوياً</p>
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
                  <span className="mb-2 block text-sm font-semibold text-slate-200">الإيميل المسجل <span className="text-slate-500 font-normal">(اختياري)</span></span>
                  <input
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
                          <p className="text-xs text-slate-400">{proofImage.type} • {Math.round(proofImage.bytes / 1024)}KB</p>
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
                    href={buildWhatsappHref({ email, method: "إثبات دفع", note: "هبعت المرجع أو لقطة الشاشة" })}
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
                  "لو في مشكلة، هنرد عليك على واتساب أو من التذكرة."
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-200" />
                    <p className="text-sm leading-7 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>

              <a
                href={buildWhatsappHref({ email, method: "استفسار قبل الدفع" })}
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
        )} {/* end proofFormVisible */}

        {/* ─── Trust / Social Proof Section ─── */}
        <section className="rounded-[36px] border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <p className="text-center text-xs font-black uppercase tracking-[0.28em] text-slate-500">لماذا رحلة دواير؟</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: "🔒",
                title: "بياناتك أمان",
                body: "مش بنخزن كارت الائتمان ولا بنشارك بياناتك. التحويل اليدوي يعني إنت بتتعامل معنا مباشرة."
              },
              {
                icon: "⚡",
                title: "تفعيل سريع",
                body: "لما نستلم الإثبات، التفعيل بيتم خلال ساعات في التغطية. مش أيام."
              },
              {
                icon: "🤝",
                title: "دعم حقيقي",
                body: "مش بوت ولا ردود آلية. في حاجة؟ بتكلم الفريق مباشرة على واتساب."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-center">
                <p className="text-3xl">{item.icon}</p>
                <p className="mt-3 text-sm font-black text-white">{item.title}</p>
                <p className="mt-2 text-xs leading-6 text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
