"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Building2, Copy, ExternalLink, Landmark, MessageCircle, Wallet } from "lucide-react";
import { supabase } from "../../src/services/supabaseClient";
import { recordFlowEvent } from "../../src/services/journeyTracking";

type ScarcityResponse = {
  total_seats: number;
  seats_left: number | null;
  source: string;
  is_live?: boolean;
};

type PaymentMode = "local" | "international";
type ManualProofMethod = "instapay" | "vodafone_cash" | "etisalat_cash" | "bank_transfer" | "fawry" | "paypal";

const CHECKOUT_PUBLIC_ENABLED = process.env.NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED === "true";
const DEFAULT_WHATSAPP_NUMBER = "201023050092";
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
const LAST_PAYMENT_MODE_KEY = "checkout.last_payment_mode";
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
  { value: "paypal", label: "PayPal" }
];
type ProofImageState = {
  name: string;
  type: string;
  bytes: number;
  dataUrl: string;
};

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
    "أهلاً، أرغب في تفعيل رحلة 21 يوم.",
    `وسيلة الدفع المختارة: ${args.method}.`,
    `البريد المسجل: ${safeEmail}.`,
    args.note ? `ملاحظة: ${args.note}.` : "",
    "أحتاج بيانات الدفع أو تأكيد التفعيل اليدوي."
  ]
    .filter(Boolean)
    .join(" ");
  return `https://wa.me/${normalizeWhatsappNumber(WHATSAPP_NUMBER_RAW)}?text=${encodeURIComponent(message)}`;
}

async function copyValue(value: string, onDone: (message: string) => void) {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  await navigator.clipboard.writeText(value);
  onDone("تم نسخ البيانات. بعد التحويل أرسل إثبات الدفع لتفعيل الرحلة.");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر تجهيز صورة الإثبات."));
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
  secondaryValue
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
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-teal-400/20 bg-teal-400/10 text-teal-300">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{subtitle}</p>
          {value && (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-3">
              {valueLabel && <p className="mb-1 text-[11px] font-bold text-slate-400">{valueLabel}</p>}
              <p className="font-mono text-sm text-teal-200 break-all">{value}</p>
              {secondaryValue && <p className="mt-2 font-mono text-xs text-slate-400 break-all">{secondaryValue}</p>}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {value && (
              <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                <Copy className="h-4 w-4" />
                نسخ
              </button>
            )}
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-teal-400 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {actionLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [mode, setMode] = useState<PaymentMode>("local");
  const [email, setEmail] = useState<string>("");
  const [seatsLeft, setSeatsLeft] = useState<number | null>(null);
  const [totalSeats, setTotalSeats] = useState<number>(50);
  const [source, setSource] = useState<string>("unavailable");
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [proofMethod, setProofMethod] = useState<ManualProofMethod>("instapay");
  const [proofReference, setProofReference] = useState("");
  const [proofAmount, setProofAmount] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofImage, setProofImage] = useState<ProofImageState | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  const availableProofMethods = mode === "local" ? LOCAL_PROOF_METHODS : INTERNATIONAL_PROOF_METHODS;

  useEffect(() => {
    if (!CHECKOUT_PUBLIC_ENABLED) return;
    try {
      recordFlowEvent("checkout_page_viewed");
    } catch {
      // never block checkout rendering on analytics failures
    }
  }, []);

  useEffect(() => {
    if (!CHECKOUT_PUBLIC_ENABLED) return;
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
    if (!CHECKOUT_PUBLIC_ENABLED) return;
    let mounted = true;
    const load = async () => {
      try {
        const [sessionRes, scarcityRes] = await Promise.all([
          supabase?.auth.getSession() ?? Promise.resolve({ data: { session: null } }),
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
  const paypalHref = PAYPAL_URL || buildWhatsappHref({ email, method: "PayPal", note: "\u0623\u062d\u062a\u0627\u062c \u0631\u0627\u0628\u0637 \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u062f\u0648\u0644\u064a" });
  const priceLine = FOUNDING_COHORT_PRICE_LABEL
    ? `\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a \u0644\u0644\u0641\u0648\u062c \u0627\u0644\u062d\u0627\u0644\u064a: ${FOUNDING_COHORT_PRICE_LABEL}`
    : "\u0642\u064a\u0645\u0629 \u0627\u0644\u0631\u062d\u0644\u0629 \u062a\u0624\u0643\u062f \u0645\u0639\u0643 \u064a\u062f\u0648\u064a\u064b\u0627 \u0642\u0628\u0644 \u0627\u0644\u062a\u062d\u0648\u064a\u0644. \u0644\u0646 \u0646\u0639\u0631\u0636 \u0631\u0642\u0645\u064b\u0627 \u063a\u064a\u0631 \u0645\u0639\u062a\u0645\u062f.";
  const amountPlaceholder =
    mode === "local"
      ? LOCAL_MONTHLY_PRICE_LABEL || "150 EGP"
      : GLOBAL_MONTHLY_PRICE_LABEL || FOUNDING_COHORT_PRICE_LABEL || "9.99 USD";
  const pricingRows = [
    {
      title: "Closed Beta",
      value: FOUNDING_COHORT_PRICE_LABEL || "12-15 USD",
      note: "21-day journey - 100 Awareness Tokens"
    },
    {
      title: "Premium Egypt",
      value: LOCAL_MONTHLY_PRICE_LABEL || "150 EGP / month",
      note: "\u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0625\u0637\u0644\u0627\u0642 \u0627\u0644\u0639\u0627\u0645 \u062f\u0627\u062e\u0644 \u0645\u0635\u0631"
    },
    {
      title: "Premium Global",
      value: GLOBAL_MONTHLY_PRICE_LABEL || "9.99 USD / month",
      note: "\u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0625\u0637\u0644\u0627\u0642 \u0627\u0644\u0639\u0627\u0645 \u0644\u0644\u062f\u0641\u0639 \u0627\u0644\u062f\u0648\u0644\u064a"
    }
  ];

  const trackManualIntent = (method: string) => {
    try {
      recordFlowEvent("payment_intent_submitted", { meta: { source: `manual_${method}` } });
    } catch {
      // keep payment actions resilient even if tracking fails
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
      setPaymentNotice("\u0627\u0631\u0641\u0639 \u0635\u0648\u0631\u0629 PNG \u0623\u0648 JPG \u0623\u0648 WEBP \u0641\u0642\u0637.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PROOF_IMAGE_BYTES) {
      setProofImage(null);
      setPaymentNotice("\u062d\u062c\u0645 \u0627\u0644\u0625\u062b\u0628\u0627\u062a \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0645\u0633\u0645\u0648\u062d. \u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 900KB.");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setProofImage({
        name: file.name,
        type: file.type,
        bytes: file.size,
        dataUrl
      });
      setPaymentNotice("\u062a\u0645 \u0625\u0631\u0641\u0627\u0642 \u0635\u0648\u0631\u0629 \u0627\u0644\u0625\u062b\u0628\u0627\u062a. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0622\u0646.");
    } catch (error) {
      setProofImage(null);
      setPaymentNotice(error instanceof Error ? error.message : "\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u062f\u0641\u0639.");
    }
  };

  const handleProofSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!proofReference.trim() && !proofImage) {
      setPaymentNotice("\u0623\u0636\u0641 \u0631\u0642\u0645 \u0639\u0645\u0644\u064a\u0629 \u0623\u0648 \u0623\u0631\u0641\u0642 \u0635\u0648\u0631\u0629 \u0625\u062b\u0628\u0627\u062a \u0648\u0627\u0636\u062d\u0629 \u0642\u0628\u0644 \u0627\u0644\u0625\u0631\u0633\u0627\u0644.");
      return;
    }
    setIsSubmittingProof(true);
    try {
      const session = (await supabase?.auth.getSession())?.data?.session ?? null;
      const response = await fetch("/api/checkout/manual-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          email,
          method: proofMethod,
          reference: proofReference,
          amount: proofAmount,
          note: proofNote,
          proofImage
        })
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.error || "\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u062f\u0641\u0639.");
      }
      setProofReference("");
      setProofAmount("");
      setProofNote("");
      setProofImage(null);
      setPaymentNotice(data.message || "\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u062f\u0641\u0639.");
      trackManualIntent(`${proofMethod}_proof_form`);
    } catch (error) {
      setPaymentNotice(error instanceof Error ? error.message : "تعذر إرسال إثبات الدفع.");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  if (!CHECKOUT_PUBLIC_ENABLED) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-6 text-center md:p-8">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-amber-300">Checkout</p>
          <h1 className="mb-3 text-2xl font-black md:text-3xl">بوابة التفعيل غير متاحة الآن</h1>
          <p className="text-sm leading-relaxed text-slate-300 md:text-base">
            التفعيل اليدوي غير منشور حاليًا. عند فتحه سيظهر هنا مباشرة دون أي بيانات وهمية.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-xl bg-teal-500 px-5 py-2.5 font-black text-slate-950 transition-colors hover:bg-teal-400"
          >
            العودة للمنصة
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        {paymentNotice && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {paymentNotice}
          </div>
        )}

        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-teal-300">Founding Cohort</p>
          <h1 className="mb-3 text-2xl font-black md:text-4xl">تفعيل الرحلة التأسيسية</h1>
          <p className="max-w-3xl text-sm text-slate-300 md:text-base">
            21 يوم تركيز عميق. 100 نقطة وعي. الدفع هنا يدوي ومباشر. بعد التحويل أرسل إثبات الدفع، ونفعل الرحلة لك يدويًا.
          </p>
          <div className="mt-4 inline-flex rounded-2xl border border-teal-400/20 bg-teal-400/10 px-4 py-3 text-sm font-semibold text-teal-100">
            {priceLine}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {pricingRows.map((row) => (
              <div key={row.title} className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{row.title}</p>
                <p className="mt-2 text-lg font-black text-white">{row.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{row.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
            <p className="text-sm font-semibold text-amber-100">
              {typeof seatsLeft === "number"
                ? `المقاعد المتبقية الآن: ${seatsLeft}`
                : "بيانات المقاعد اللحظية غير متاحة حاليًا."}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: `${scarcityPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">المصدر: {source} • السعة: {totalSeats}</p>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-4 md:p-6">
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("local")}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                mode === "local" ? "bg-teal-500 text-slate-950" : "bg-white/5 text-slate-300"
              }`}
            >
              دفع محلي داخل مصر
            </button>
            <button
              type="button"
              onClick={() => setMode("international")}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                mode === "international" ? "bg-teal-500 text-slate-950" : "bg-white/5 text-slate-300"
              }`}
            >
              دفع دولي
            </button>
          </div>

          {mode === "local" && (
            <div className="grid gap-4 md:grid-cols-2">
              <MethodCard
                title="InstaPay"
                subtitle={
                  INSTAPAY_ALIAS || INSTAPAY_NUMBER
                    ? "حوّل مباشرة على الألياس التالي، ثم أرسل إثبات الدفع لتفعيل الرحلة."
                    : "بيانات InstaPay الفعلية تُرسل لك يدويًا عبر واتساب قبل التحويل."
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
              />

              <MethodCard
                title="Vodafone Cash"
                subtitle={
                  VODAFONE_CASH_NUMBER
                    ? "حوّل على الرقم التالي ثم أرسل لقطة أو رقم العملية ليتم التفعيل."
                    : "سنرسل لك رقم Vodafone Cash الحقيقي يدويًا عبر واتساب."
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
                    ? "حوّل على الرقم التالي ثم أرسل ما يثبت التحويل لتأكيد التفعيل."
                    : "سنرسل لك رقم Etisalat Cash الحقيقي يدويًا عبر واتساب."
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
                    ? "استخدم بيانات الحساب التالية ثم أرسل إثبات التحويل البنكي لبدء التفعيل."
                    : "بيانات الحساب البنكي تُرسل لك يدويًا عبر واتساب عند اختيار هذا المسار."
                }
                value={hasBankDetails ? bankValue : undefined}
                valueLabel="بيانات المستفيد"
                secondaryValue={hasBankDetails ? bankSecondaryValue || undefined : undefined}
                actionLabel={hasBankDetails ? "واتساب للتأكيد" : "اطلب بيانات الحساب البنكي"}
                href={buildWhatsappHref({ email, method: "تحويل بنكي" })}
                onAction={() => {
                  setProofMethod("bank_transfer");
                  trackManualIntent("bank_transfer");
                  if (hasBankDetails) void copyValue([bankValue, bankSecondaryValue].filter(Boolean).join("\n"), setPaymentNotice);
                }}
                icon={<Landmark className="h-5 w-5" />}
              />

              <MethodCard
                title="فوري"
                subtitle="كود فوري لا يتم توليده آليًا الآن. راسلنا وسنرتب معك طريقة التفعيل أو رقم المرجع يدويًا إن كان المسار متاحًا."
                actionLabel="واتساب للتنسيق"
                href={buildWhatsappHref({ email, method: "Fawry", note: "أحتاج مسار فوري إن كان متاحًا" })}
                onAction={() => {
                  setProofMethod("fawry");
                  trackManualIntent("fawry");
                }}
                icon={<Building2 className="h-5 w-5" />}
              />
            </div>
          )}

          {mode === "international" && (
            <div className="grid gap-4 md:grid-cols-2">
              <MethodCard
                title="PayPal"
                subtitle={
                  PAYPAL_URL
                    ? "الدفع الدولي متاح عبر الرابط التالي. بعد الإتمام أرسل لنا إثبات الدفع لتفعيل الرحلة."
                    : PAYPAL_EMAIL
                      ? "استخدم بريد PayPal التالي، ثم أرسل لنا إثبات الدفع بعد التحويل."
                      : "رابط PayPal غير منشور بعد. راسلنا لنرسل لك مسار الدفع الدولي المتاح."
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
              />
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Payment Proof</p>
            <h2 className="mt-2 text-xl font-black text-white">{"\u0623\u0631\u0633\u0644\u062a \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0628\u0627\u0644\u0641\u0639\u0644\u061f \u0623\u0631\u0633\u0644 \u0627\u0644\u0645\u0631\u062c\u0639 \u0623\u0648 \u0627\u0644\u0644\u0642\u0637\u0629 \u0647\u0646\u0627"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {"\u0647\u0630\u0627 \u0627\u0644\u0645\u0633\u0627\u0631 \u064a\u0635\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u064a\u062f\u0648\u064a. \u0648\u0627\u062a\u0633\u0627\u0628 \u064a\u0638\u0644 \u0645\u062a\u0627\u062d\u064b\u0627\u060c \u0644\u0643\u0646\u0647 \u0644\u0645 \u064a\u0639\u062f \u0627\u0644\u0642\u0646\u0627\u0629 \u0627\u0644\u0648\u062d\u064a\u062f\u0629."}
            </p>
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleProofSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">{"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0645\u0633\u062c\u0644"}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/40"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">{"\u0648\u0633\u064a\u0644\u0629 \u0627\u0644\u062f\u0641\u0639"}</span>
              <select
                value={proofMethod}
                onChange={(event) => setProofMethod(event.target.value as ManualProofMethod)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/40"
              >
                {availableProofMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">{"\u0631\u0642\u0645 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0623\u0648 \u0627\u0644\u0645\u0631\u062c\u0639"}</span>
              <input
                type="text"
                value={proofReference}
                onChange={(event) => setProofReference(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/40"
                placeholder="TX-874512"
              />
              <span className="mt-2 block text-xs text-slate-400">{"\u0627\u062a\u0631\u0643\u0647 \u0641\u0627\u0631\u063a\u064b\u0627 \u0641\u0642\u0637 \u0625\u0630\u0627 \u0623\u0631\u0641\u0642\u062a \u0644\u0642\u0637\u0629 \u0625\u062b\u0628\u0627\u062a \u0648\u0627\u0636\u062d\u0629."}</span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">{"\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062d\u0648\u0644"}</span>
              <input
                type="text"
                value={proofAmount}
                onChange={(event) => setProofAmount(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/40"
                placeholder={amountPlaceholder}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-200">{"\u0644\u0642\u0637\u0629 \u0634\u0627\u0634\u0629 \u0623\u0648 \u0625\u064a\u0635\u0627\u0644 \u0627\u0644\u062f\u0641\u0639"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProofImageChange}
                className="block w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-teal-500 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950"
              />
              <span className="mt-2 block text-xs text-slate-400">{"PNG / JPG / WEBP فقط حتى 900KB. تحفظ مع تذكرة التفعيل اليدوي."}</span>
              {proofImage && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{proofImage.name}</p>
                      <p className="text-xs text-slate-400">{proofImage.type} - {Math.round(proofImage.bytes / 1024)}KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofImage(null)}
                      className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                    >
                      {"\u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0635\u0648\u0631\u0629"}
                    </button>
                  </div>
                  <img
                    src={proofImage.dataUrl}
                    alt={"\u0645\u0639\u0627\u064a\u0646\u0629 \u0625\u062b\u0628\u0627\u062a \u0627\u0644\u062f\u0641\u0639"}
                    className="mt-3 max-h-56 rounded-xl border border-white/10 object-contain"
                  />
                </div>
              )}
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-200">{"\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629"}</span>
              <textarea
                rows={4}
                value={proofNote}
                onChange={(event) => setProofNote(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-teal-400/40"
                placeholder={"\u0644\u0648 \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u062a\u0645 \u0628\u0627\u0633\u0645 \u0645\u062e\u062a\u0644\u0641 \u0623\u0648 \u0644\u062f\u064a\u0643 \u0645\u0644\u0627\u062d\u0638\u0629 \u0642\u0635\u064a\u0631\u0629\u060c \u0627\u0643\u062a\u0628\u0647\u0627 \u0647\u0646\u0627."}
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmittingProof}
                className="inline-flex items-center rounded-2xl bg-teal-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingProof ? "جارٍ إرسال الإثبات..." : "إرسال إثبات الدفع"}
              </button>
              <a
                href={buildWhatsappHref({ email, method: "إثبات دفع", note: "أرفق لقطة شاشة أو مرجع العملية" })}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {"\u0625\u0631\u0633\u0627\u0644 \u0646\u0633\u062e\u0629 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628"}
              </a>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-slate-300">
          <p className="font-black text-white">خطوات التفعيل</p>
          <ol className="mt-3 space-y-2">
            <li>1. اختر وسيلة الدفع المناسبة.</li>
            <li>2. حوّل الرسوم أو اطلب البيانات الفعلية عبر واتساب.</li>
            <li>3. أرسل إثبات الدفع من نفس البريد المسجل: <span className="font-mono text-teal-200">{email || "غير_مسجل"}</span>.</li>
            <li>4. يتم التفعيل يدويًا داخل المنصة ومنحك 100 نقطة وعي لمدة 21 يومًا.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
