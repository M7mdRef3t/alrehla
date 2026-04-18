import { runtimeEnv } from "./runtimeEnv";

export type PaymentMode = "local" | "international";
export type ManualProofMethod =
  | "instapay"
  | "vodafone_cash"
  | "etisalat_cash"
  | "bank_transfer"
  | "fawry"
  | "paypal";

export const paymentConfig = {
  activationPublicEnabled: process.env.NEXT_PUBLIC_PUBLIC_PAYMENTS_ENABLED === "true",
  whatsappNumberRaw:
    process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER ||
    runtimeEnv.whatsappContactNumber ||
    "",
  instapayAlias: process.env.NEXT_PUBLIC_PAYMENT_INSTAPAY_ALIAS || "",
  instapayNumber: process.env.NEXT_PUBLIC_PAYMENT_INSTAPAY_NUMBER || "",
  vodafoneCashNumber: process.env.NEXT_PUBLIC_PAYMENT_VODAFONE_CASH_NUMBER || "01023050092",
  etisalatCashNumber: process.env.NEXT_PUBLIC_PAYMENT_ETISALAT_CASH_NUMBER || "",
  bankName: process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME || "",
  bankBeneficiary: process.env.NEXT_PUBLIC_PAYMENT_BANK_BENEFICIARY || "",
  bankAccountNumber: process.env.NEXT_PUBLIC_PAYMENT_BANK_ACCOUNT_NUMBER || "",
  bankIban: process.env.NEXT_PUBLIC_PAYMENT_BANK_IBAN || "",
  bankSwift: process.env.NEXT_PUBLIC_PAYMENT_BANK_SWIFT || "",
  paypalUrl: process.env.NEXT_PUBLIC_PAYMENT_PAYPAL_URL || "",
  paypalEmail: process.env.NEXT_PUBLIC_PAYMENT_PAYPAL_EMAIL || "",
  gumroadUrl: process.env.NEXT_PUBLIC_PAYMENT_GUMROAD_URL || "",
  foundingCohortPriceLabel: process.env.NEXT_PUBLIC_FOUNDING_COHORT_PRICE_LABEL || "",
  localMonthlyPriceLabel: process.env.NEXT_PUBLIC_LOCAL_PREMIUM_PRICE_LABEL || "",
  globalMonthlyPriceLabel: process.env.NEXT_PUBLIC_GLOBAL_PREMIUM_PRICE_LABEL || "",
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
