import { runtimeEnv } from "./runtimeEnv";

export type PaymentMode = "local" | "international";
export type ManualProofMethod =
  | "instapay"
  | "vodafone_cash"
  | "etisalat_cash"
  | "bank_transfer"
  | "fawry"
  | "paypal";

function readPublicPaymentEnv(key: string): string {
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key];
    if (typeof value === "string") {
      return value.trim();
    }
  }
  return "";
}

export const paymentConfig = {
  activationPublicEnabled: process.env.NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED === "true",
  whatsappNumberRaw:
    readPublicPaymentEnv("NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER") ||
    runtimeEnv.whatsappContactNumber ||
    "",
  instapayAlias: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_INSTAPAY_ALIAS"),
  instapayNumber: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_INSTAPAY_NUMBER"),
  vodafoneCashNumber: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_VODAFONE_CASH_NUMBER"),
  etisalatCashNumber: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_ETISALAT_CASH_NUMBER"),
  bankName: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_BANK_NAME"),
  bankBeneficiary: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_BANK_BENEFICIARY"),
  bankAccountNumber: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_BANK_ACCOUNT_NUMBER"),
  bankIban: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_BANK_IBAN"),
  bankSwift: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_BANK_SWIFT"),
  paypalUrl: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_PAYPAL_URL"),
  paypalEmail: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_PAYPAL_EMAIL"),
  gumroadUrl: readPublicPaymentEnv("NEXT_PUBLIC_PAYMENT_GUMROAD_URL"),
  foundingCohortPriceLabel: readPublicPaymentEnv("NEXT_PUBLIC_FOUNDING_COHORT_PRICE_LABEL"),
  localMonthlyPriceLabel: readPublicPaymentEnv("NEXT_PUBLIC_LOCAL_PREMIUM_PRICE_LABEL"),
  globalMonthlyPriceLabel: readPublicPaymentEnv("NEXT_PUBLIC_GLOBAL_PREMIUM_PRICE_LABEL"),
} as const;

export const LOCAL_PROOF_METHODS: Array<{ value: ManualProofMethod; label: string }> = [
  { value: "instapay", label: "InstaPay" },
  { value: "vodafone_cash", label: "Vodafone Cash" },
  { value: "etisalat_cash", label: "Etisalat Cash" },
  { value: "bank_transfer", label: "تحويل بنكي" },
  { value: "fawry", label: "فوري" },
];

export const INTERNATIONAL_PROOF_METHODS: Array<{ value: ManualProofMethod; label: string }> = [
  { value: "paypal", label: "PayPal" },
  { value: "etisalat_cash", label: "e& money / Etisalat Cash" },
];

export function getProofMethods(mode: PaymentMode) {
  return mode === "local" ? LOCAL_PROOF_METHODS : INTERNATIONAL_PROOF_METHODS;
}

export function normalizeWhatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

export function buildPaymentWhatsappHref(args: {
  email?: string;
  method: string;
  note?: string;
}): string {
  const safeEmail = args.email || "غير_مسجل";
  const message = [
    "أهلا، عايز أفعل رحلة دواير.",
    `طريقة الدفع المختارة: ${args.method}.`,
    `الإيميل المسجل: ${safeEmail}.`,
    args.note ? `ملاحظة: ${args.note}.` : "",
    "محتاج تأكيد بيانات الدفع أو مراجعة إثبات التحويل.",
  ]
    .filter(Boolean)
    .join(" ");

  return `https://wa.me/${normalizeWhatsappNumber(paymentConfig.whatsappNumberRaw)}?text=${encodeURIComponent(message)}`;
}

export function getPaymentAmountPlaceholder(mode: PaymentMode): string {
  if (mode === "local") {
    return paymentConfig.localMonthlyPriceLabel || "500 EGP";
  }

  return (
    paymentConfig.globalMonthlyPriceLabel ||
    paymentConfig.foundingCohortPriceLabel ||
    "30 USD"
  );
}

export function getFoundingPriceLine(): string {
  return paymentConfig.foundingCohortPriceLabel
    ? `سعر الدفعة الحالية: ${paymentConfig.foundingCohortPriceLabel}`
    : "السعر بيتأكد معاك يدوي قبل التحويل. مفيش رقم وهمي ولا رقم متخيل.";
}
