"use client";

import { Building2, ExternalLink, Landmark, MessageCircle, Wallet } from "lucide-react";
import { MethodCard } from "./MethodCard";
import { buildPaymentWhatsappHref, paymentConfig, type ManualProofMethod, type PaymentMode } from "../../../src/config/paymentConfig";

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
  return (
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
                paymentConfig.instapayAlias || paymentConfig.instapayNumber
                  ? "حوّل مباشرة على البيانات دي، وبعدها ابعت المرجع أو الصورة تحت."
                  : "بيانات InstaPay لسه مش منشورة هنا. افتح واتساب وخدها مباشرة."
              }
              value={paymentConfig.instapayAlias || paymentConfig.instapayNumber || undefined}
              valueLabel={paymentConfig.instapayAlias ? "Alias" : "رقم InstaPay"}
              secondaryValue={paymentConfig.instapayAlias && paymentConfig.instapayNumber ? `رقم الهاتف: ${paymentConfig.instapayNumber}` : undefined}
              actionLabel={paymentConfig.instapayAlias || paymentConfig.instapayNumber ? "واتساب للتأكيد" : "اطلب بيانات InstaPay"}
              href={buildPaymentWhatsappHref({ email, method: "InstaPay" })}
              onAction={() => {
                selectMethod("instapay", "instapay");
                const payload = [paymentConfig.instapayAlias, paymentConfig.instapayNumber].filter(Boolean).join("\n");
                if (payload) void copyValue(payload);
              }}
              icon={<Wallet className="h-5 w-5" />}
              badge="الأسرع"
            />

            <MethodCard
              title="Vodafone Cash"
              subtitle={
                paymentConfig.vodafoneCashNumber
                  ? "لو التحويل بالمحفظة أسهل ليك، استخدم الرقم ده وابعت إثبات الدفع."
                  : "رقم المحفظة هنبعته لك يدوي على واتساب."
              }
              value={paymentConfig.vodafoneCashNumber || undefined}
              valueLabel="رقم المحفظة"
              actionLabel={paymentConfig.vodafoneCashNumber ? "واتساب للتأكيد" : "اطلب رقم Vodafone Cash"}
              href={buildPaymentWhatsappHref({ email, method: "Vodafone Cash" })}
              onAction={() => {
                selectMethod("vodafone_cash", "vodafone_cash");
                if (paymentConfig.vodafoneCashNumber) void copyValue(paymentConfig.vodafoneCashNumber);
              }}
              icon={<Wallet className="h-5 w-5" />}
            />

            <MethodCard
              title="Etisalat Cash"
              subtitle={
                paymentConfig.etisalatCashNumber
                  ? "نفس الفكرة: حوّل على المحفظة وابعت المرجع أو لقطة واضحة."
                  : "لو دي أنسب طريقة ليك، افتح واتساب وخد التفاصيل."
              }
              value={paymentConfig.etisalatCashNumber || undefined}
              valueLabel="رقم المحفظة"
              actionLabel={paymentConfig.etisalatCashNumber ? "واتساب للتأكيد" : "اطلب رقم Etisalat Cash"}
              href={buildPaymentWhatsappHref({ email, method: "Etisalat Cash" })}
              onAction={() => {
                selectMethod("etisalat_cash", "etisalat_cash");
                if (paymentConfig.etisalatCashNumber) void copyValue(paymentConfig.etisalatCashNumber);
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
              href={buildPaymentWhatsappHref({ email, method: "تحويل بنكي" })}
              onAction={() => {
                selectMethod("bank_transfer", "bank_transfer");
                if (hasBankDetails) void copyValue([bankValue, bankSecondaryValue].filter(Boolean).join("\n"));
              }}
              icon={<Landmark className="h-5 w-5" />}
            />

            <MethodCard
              title="فوري"
              subtitle="فوري هنا مش automated بالكامل دلوقتي. افتح واتساب لو عايز ننسق لك المسار المناسب أو المرجع اليدوي."
              actionLabel="افتح واتساب"
              href={buildPaymentWhatsappHref({ email, method: "Fawry", note: "محتاج مسار دفع فوري" })}
              onAction={() => {
                selectMethod("fawry", "fawry");
              }}
              icon={<Building2 className="h-5 w-5" />}
            />
          </>
        ) : (
          <>
            <MethodCard
              title="PayPal"
              subtitle={
                paymentConfig.paypalUrl
                  ? "افتح الرابط، كمّل الدفع، وارجع ابعت المرجع أو لقطة واضحة."
                  : paymentConfig.paypalEmail
                    ? "استخدم الإيميل ده على PayPal وبعدها ابعت إثبات التحويل."
                    : "رابط الدفع الدولي مش ظاهر هنا حاليًا. افتح واتساب وخده مباشرة."
              }
              value={paymentConfig.paypalEmail || undefined}
              valueLabel={paymentConfig.paypalEmail ? "PayPal Email" : undefined}
              actionLabel={paymentConfig.paypalUrl ? "افتح PayPal" : "اطلب رابط PayPal"}
              href={paypalHref}
              onAction={() => {
                selectMethod("paypal", "paypal");
                if (paymentConfig.paypalEmail) void copyValue(paymentConfig.paypalEmail);
              }}
              icon={<MessageCircle className="h-5 w-5" />}
              badge="International"
            />

            <MethodCard
              title="e& money / Etisalat"
              subtitle="لو التحويل الدولي عبر e& money مناسب ليك، افتح تفاصيل الخدمة واعتمد نفس مسار الإثبات بعد الدفع."
              value={paymentConfig.etisalatCashNumber || undefined}
              valueLabel={paymentConfig.etisalatCashNumber ? "رقم المحفظة" : undefined}
              actionLabel="تفاصيل الخدمة"
              href="https://www.eand.com.eg/portal/pages/services/International_money_remittance.html"
              onAction={() => {
                selectMethod("etisalat_cash", "etisalat_international");
                if (paymentConfig.etisalatCashNumber) void copyValue(paymentConfig.etisalatCashNumber);
              }}
              icon={<ExternalLink className="h-5 w-5" />}
            />
          </>
        )}
      </div>
    </section>
  );
}
