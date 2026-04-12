"use client";

import {
  Building2,
  ExternalLink,
  Landmark,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { MethodCard } from "./MethodCard";
import {
  buildPaymentWhatsappHref,
  paymentConfig,
  type ManualProofMethod,
  type PaymentMode,
} from "../../../src/config/paymentConfig";

type ActivationPaymentMethodsSectionProps = {
  mode: PaymentMode;
  setMode: (mode: PaymentMode) => void;
  email: string;
  hasBankDetails: boolean;
  bankValue: string;
  bankSecondaryValue: string;
  paypalHref: string;
  copyValue: (value: string) => Promise<void>;
  selectMethod: (method: ManualProofMethod, trackingMethod: string) => void;
};

export function ActivationPaymentMethodsSection({
  mode,
  setMode,
  email,
  hasBankDetails,
  bankValue,
  bankSecondaryValue,
  paypalHref,
  copyValue,
  selectMethod,
}: ActivationPaymentMethodsSectionProps) {
  const localMethods = [
    {
      title: "InstaPay",
      subtitle:
        paymentConfig.instapayAlias || paymentConfig.instapayNumber
          ? "حوّل مباشرة على البيانات، ثم أرسل المرجع أو لقطة الشاشة."
          : "بيانات InstaPay ستُرسل عبر واتسآب.",
      value: paymentConfig.instapayAlias || paymentConfig.instapayNumber || undefined,
      valueLabel: paymentConfig.instapayAlias ? "Alias" : "رقم InstaPay",
      secondaryValue:
        paymentConfig.instapayAlias && paymentConfig.instapayNumber
          ? `رقم الهاتف: ${paymentConfig.instapayNumber}`
          : undefined,
      actionLabel:
        paymentConfig.instapayAlias || paymentConfig.instapayNumber
          ? "واتساب للتأكيد"
          : "اطلب بيانات InstaPay",
      href: buildPaymentWhatsappHref({ email, method: "InstaPay" }),
      onAction: () => {
        selectMethod("instapay", "instapay");
        const payload = [paymentConfig.instapayAlias, paymentConfig.instapayNumber]
          .filter(Boolean)
          .join("\n");
        if (payload) void copyValue(payload);
      },
      icon: <Wallet className="h-5 w-5" />,
      badge: "الأسرع",
    },
    {
      title: "Vodafone Cash",
      subtitle: paymentConfig.vodafoneCashNumber
        ? "أتم التحويل على رقم المحفظة، ثم أرسل إثبات الدفع."
        : "سيتم إرسال الرقم عبر واتسآب.",
      value: paymentConfig.vodafoneCashNumber || undefined,
      valueLabel: "رقم المحفظة",
      actionLabel: paymentConfig.vodafoneCashNumber
        ? "واتساب للتأكيد"
        : "اطلب رقم Vodafone Cash",
      href: buildPaymentWhatsappHref({ email, method: "Vodafone Cash" }),
      onAction: () => {
        selectMethod("vodafone_cash", "vodafone_cash");
        if (paymentConfig.vodafoneCashNumber)
          void copyValue(paymentConfig.vodafoneCashNumber);
      },
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      title: "Etisalat Cash",
      subtitle: paymentConfig.etisalatCashNumber
        ? "أتم التحويل على رقم المحفظة، ثم أرسل رقم العملية أو لقطة شاشة."
        : "افتح واتسآب لتلقّي التفاصيل.",
      value: paymentConfig.etisalatCashNumber || undefined,
      valueLabel: "رقم المحفظة",
      actionLabel: paymentConfig.etisalatCashNumber
        ? "واتساب للتأكيد"
        : "اطلب رقم Etisalat Cash",
      href: buildPaymentWhatsappHref({ email, method: "Etisalat Cash" }),
      onAction: () => {
        selectMethod("etisalat_cash", "etisalat_cash");
        if (paymentConfig.etisalatCashNumber)
          void copyValue(paymentConfig.etisalatCashNumber);
      },
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      title: "تحويل بنكي",
      subtitle: hasBankDetails
        ? "استخدم بيانات المستفيد للتحويل، ثم أرسل إثبات التحويل."
        : "بيانات الحساب البنكي تُرسل يدوياً حسب الحالة.",
      value: hasBankDetails ? bankValue : undefined,
      valueLabel: "بيانات المستفيد",
      secondaryValue: hasBankDetails ? bankSecondaryValue || undefined : undefined,
      actionLabel: hasBankDetails ? "واتساب للتأكيد" : "اطلب بيانات الحساب",
      href: buildPaymentWhatsappHref({ email, method: "تحويل بنكي" }),
      onAction: () => {
        selectMethod("bank_transfer", "bank_transfer");
        if (hasBankDetails)
          void copyValue([bankValue, bankSecondaryValue].filter(Boolean).join("\n"));
      },
      icon: <Landmark className="h-5 w-5" />,
    },
    {
      title: "فوري",
      subtitle:
        "خدمة فوري غير متاحة للدفع المباشر حالياً. تواصل معنا لترتيب المسار المناسب.",
      href: buildPaymentWhatsappHref({
        email,
        method: "Fawry",
        note: "محتاج مسار دفع فوري",
      }),
      onAction: () => selectMethod("fawry", "fawry"),
      icon: <Building2 className="h-5 w-5" />,
      actionLabel: "تواصل عبر واتسآب",
    },
  ];

  const intlMethods = [
    {
      title: "PayPal",
      subtitle: paymentConfig.paypalUrl
        ? "افتح الرابط، أتمّ الدفع، وعُد لإرسال المرجع أو لقطة الشاشة."
        : paymentConfig.paypalEmail
          ? "استخدم هذا الإيميل على PayPal ثم أرسل إثبات التحويل."
          : "رابط الدفع الدولي غير متاح حالياً. افتح واتسآب للحصول عليه.",
      value: paymentConfig.paypalEmail || undefined,
      valueLabel: paymentConfig.paypalEmail ? "PayPal Email" : undefined,
      actionLabel: paymentConfig.paypalUrl ? "افتح PayPal" : "اطلب رابط PayPal",
      href: paypalHref,
      onAction: () => {
        selectMethod("paypal", "paypal");
        if (paymentConfig.paypalEmail) void copyValue(paymentConfig.paypalEmail);
      },
      icon: <MessageCircle className="h-5 w-5" />,
      badge: "International",
    },
    {
      title: "e& money / Etisalat",
      subtitle:
        "إذا كان التحويل الدولي عبر e& money مناسباً، افتح تفاصيل الخدمة واتبع نفس مسار الإثبات.",
      value: paymentConfig.etisalatCashNumber || undefined,
      valueLabel: paymentConfig.etisalatCashNumber ? "رقم المحفظة" : undefined,
      actionLabel: "تفاصيل الخدمة",
      href: "https://www.eand.com.eg/portal/pages/services/International_money_remittance.html",
      onAction: () => {
        selectMethod("etisalat_cash", "etisalat_international");
        if (paymentConfig.etisalatCashNumber)
          void copyValue(paymentConfig.etisalatCashNumber);
      },
      icon: <ExternalLink className="h-5 w-5" />,
    },
  ];

  const methods = mode === "local" ? localMethods : intlMethods;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/50 shadow-2xl backdrop-blur-xl"
      dir="rtl"
    >
      {/* Section header */}
      <div className="border-b border-white/5 px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-teal-400/80">
              الخطوة 1
            </p>
            <h2 className="mt-1 text-lg font-black text-white">
              اختر وسيلة الدفع
            </h2>
          </div>

          {/* Mode toggle pill */}
          <div className="flex overflow-hidden rounded-xl border border-white/5 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => setMode("local")}
              className={`rounded-lg px-5 py-2 text-xs font-black transition-all duration-300 ${
                mode === "local"
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              داخل مصر
            </button>
            <button
              type="button"
              onClick={() => setMode("international")}
              className={`rounded-lg px-5 py-2 text-xs font-black transition-all duration-300 ${
                mode === "international"
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              خارج مصر
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          {mode === "local"
            ? "اختر الوسيلة الأنسب وادفع — ثم أرسل إثبات التحويل من القسم التالي."
            : "اختر PayPal أو e& money وأرسل إثبات العملية بعد الدفع."}
        </p>
      </div>

      {/* Method cards — 2-col grid on md+, single col on mobile */}
      <div className="grid grid-cols-1 divide-y divide-white/[0.04] md:grid-cols-2 md:divide-x md:divide-y-0">
        {methods.map((m) => (
          <MethodCard
            key={m.title}
            title={m.title}
            subtitle={m.subtitle}
            value={m.value}
            valueLabel={m.valueLabel}
            actionLabel={m.actionLabel}
            href={m.href}
            onAction={m.onAction}
            icon={m.icon}
            secondaryValue={"secondaryValue" in m ? m.secondaryValue : undefined}
            badge={"badge" in m ? m.badge : undefined}
          />
        ))}
        {/* Odd-card spacer for 2-col grid */}
        {methods.length % 2 !== 0 && (
          <div className="hidden md:block bg-slate-950/20" />
        )}
      </div>
    </section>
  );
}
