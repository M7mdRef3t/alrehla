/**
 * PaymentCheckout — مكون الدفع الموحد
 * =====================================
 * يقرأ كل بيانات الدفع من env vars الموجودة في .env.local
 * ويرسل إشعار Telegram للمالك عند أي طلب ترقية.
 */

import type { FC } from "react";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  CreditCard,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  normalizeWhatsappNumber,
  paymentConfig,
} from "@/config/paymentConfig";
import { TIER_PRICES_USD, TIER_LABELS } from "@/config/pricing";
import { telegramBot } from "@/services/telegramBot";
import { supabase } from "@/services/supabaseClient";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

type PaymentMethod = "vodafone_cash" | "instapay" | "paypal" | "gumroad";

interface PaymentCheckoutProps {
  onClose: () => void;
  onSuccess?: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

async function getUserInfo() {
  if (!supabase) return { email: "غير معروف", name: "غير معروف" };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      email: session?.user?.email || "غير معروف",
      name: (session?.user?.user_metadata as Record<string, unknown>)?.full_name as string
        || session?.user?.email
        || "غير معروف",
    };
  } catch {
    return { email: "غير معروف", name: "غير معروف" };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export const PaymentCheckout: FC<PaymentCheckoutProps> = ({ onClose, onSuccess: _onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const price = TIER_PRICES_USD.premium;
  const localPriceLabel = paymentConfig.localMonthlyPriceLabel || "200 ج.م / شهر";
  const whatsappNumber = normalizeWhatsappNumber(paymentConfig.whatsappNumberRaw);

  // ── Copy ──────────────────────────────────────────────────────────
  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // ── Telegram notification ────────────────────────────────────────
  const notifyOwner = useCallback(async (method: PaymentMethod) => {
    setIsSending(true);
    try {
      const user = await getUserInfo();
      const methodLabels: Record<PaymentMethod, string> = {
        vodafone_cash: "فودافون كاش",
        instapay:      "InstaPay",
        paypal:        "PayPal (دولي)",
        gumroad:       "بطاقة ائتمان / Gumroad",
      };

      await telegramBot.sendMessage({
        type: "emotional_pricing_notification",
        text: [
          "💳 *طلب ترقية جديد!*",
          "",
          `👤 *المستخدم:* ${user.name}`,
          `📧 *الإيميل:* ${user.email}`,
          `💰 *الباقة:* ${TIER_LABELS.premium}`,
          `💵 *السعر:* ${price.label} (أو ${localPriceLabel})`,
          `📱 *طريقة الدفع:* ${methodLabels[method]}`,
          "",
          `⏰ ${new Date().toLocaleString("ar-EG")}`,
          "",
          "👇 *المطلوب:* تأكيد استلام الفلوس ثم تفعيل الحساب",
        ].join("\n"),
        parseMode: "Markdown",
      });

      setRequestSent(true);
    } catch {
      setRequestSent(true); // أظهر success حتى لو Telegram failed
    } finally {
      setIsSending(false);
    }
  }, [localPriceLabel, price]);

  // ── Open WhatsApp ─────────────────────────────────────────────────
  const openWhatsApp = useCallback((extraText = "") => {
    const base = `مرحباً، حابب أفعّل باقة "${TIER_LABELS.premium}" في الرحلة.`;
    const msg = extraText ? `${base}\n${extraText}` : base;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  }, [whatsappNumber]);

  // ── Success screen ─────────────────────────────────────────────────
  if (requestSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center p-8 min-h-[360px] justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, delay: 0.15 }}
          className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center mb-5"
        >
          <Check className="w-10 h-10 text-emerald-400" />
        </motion.div>

        <h3 className="text-xl font-black text-white mb-2">تم إرسال طلبك! 🎉</h3>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-6">
          هنتواصل معاك خلال دقائق لتأكيد الدفع وتفعيل حسابك.
          <br />لو عايز تسرّع — كلمنا مباشرة:
        </p>

        <button
          onClick={() => openWhatsApp("بعتلك إيصال الدفع عشان تفعّل الحساب.")}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors mb-3"
        >
          <MessageCircle className="w-5 h-5" />
          كلمنا على WhatsApp
        </button>

        <button
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          رجوع للتطبيق
        </button>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // Method selector
  // ═══════════════════════════════════════════════════════════════════

  if (!selectedMethod) {
    return (
      <motion.div
        key="select"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="p-6"
        dir="rtl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/20">
            <ShieldCheck className="w-7 h-7 text-slate-950" />
          </div>
          <h3 className="text-lg font-black text-white mb-1">اختر طريقة الدفع</h3>
          <p className="text-xs text-slate-400">
            {TIER_LABELS.premium} — {localPriceLabel} أو ${price.monthly}/شهر
          </p>
        </div>

        {/* Methods */}
        <div className="space-y-3">
          {/* Vodafone Cash */}
          <MethodButton
            icon={<Smartphone className="w-5 h-5 text-red-400" />}
            iconBg="bg-red-500/15"
            label="فودافون كاش"
            sub={localPriceLabel}
            onClick={() => setSelectedMethod("vodafone_cash")}
          />

          {/* InstaPay */}
          <MethodButton
            icon={<Smartphone className="w-5 h-5 text-blue-400" />}
            iconBg="bg-blue-500/15"
            label="InstaPay"
            sub={localPriceLabel}
            onClick={() => setSelectedMethod("instapay")}
          />

          {/* PayPal */}
          <MethodButton
            icon={<CreditCard className="w-5 h-5 text-sky-400" />}
            iconBg="bg-sky-500/15"
            label="PayPal"
            sub={`$${price.monthly}/شهر`}
            badge="دولي"
            onClick={() => setSelectedMethod("paypal")}
          />

          {/* Gumroad / Card */}
          <MethodButton
            icon={<CreditCard className="w-5 h-5 text-purple-400" />}
            iconBg="bg-purple-500/15"
            label="بطاقة ائتمان"
            sub={`$${price.monthly}/شهر — Apple Pay, Visa, Mastercard`}
            badge="دولي"
            onClick={() => setSelectedMethod("gumroad")}
          />
        </div>

        <p className="mt-5 text-center text-[10px] text-slate-600 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          مفيش بيانات بنكية بتتحفظ عندنا
        </p>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // PayPal flow
  // ═══════════════════════════════════════════════════════════════════

  if (selectedMethod === "paypal") {
    if (!paymentConfig.paypalUrl) {
      return (
        <FlowWrapper onBack={() => setSelectedMethod(null)}>
          <div className="text-center mb-6">
            <CreditCard className="w-10 h-10 text-sky-400 mx-auto mb-3" />
            <h3 className="text-lg font-black text-white mb-1">PayPal غير متاح الآن</h3>
            <p className="text-xs text-slate-400">لم يتم ضبط رابط PayPal في إعدادات المنصة بعد.</p>
          </div>
        </FlowWrapper>
      );
    }

    return (
      <FlowWrapper onBack={() => setSelectedMethod(null)}>
        <div className="text-center mb-6">
          <CreditCard className="w-10 h-10 text-sky-400 mx-auto mb-3" />
          <h3 className="text-lg font-black text-white mb-1">PayPal</h3>
          <p className="text-xs text-slate-400">أرسل ${price.monthly} لحسابنا ثم أخبرنا</p>
        </div>

        <a
          href={paymentConfig.paypalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all mb-3"
          onClick={() => void notifyOwner("paypal")}
        >
          <ExternalLink className="w-4 h-4" />
          افتح PayPal وادفع ${price.monthly}
        </a>

        <button
          onClick={() => { void notifyOwner("paypal"); openWhatsApp("دفعت عبر PayPal."); }}
          className="w-full text-center text-sm text-emerald-400 hover:text-emerald-300 py-2 transition-colors"
        >
          دفعت؟ أخبرنا على WhatsApp →
        </button>
      </FlowWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // Gumroad / Card flow
  // ═══════════════════════════════════════════════════════════════════

  if (selectedMethod === "gumroad") {
    if (!paymentConfig.gumroadUrl) {
      return (
        <FlowWrapper onBack={() => setSelectedMethod(null)}>
          <div className="text-center mb-6">
            <CreditCard className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <h3 className="text-lg font-black text-white mb-1">الدفع بالبطاقة غير متاح الآن</h3>
            <p className="text-xs text-slate-400">لم يتم ضبط رابط الدفع الدولي في إعدادات المنصة بعد.</p>
          </div>
        </FlowWrapper>
      );
    }

    return (
      <FlowWrapper onBack={() => setSelectedMethod(null)}>
        <div className="text-center mb-6">
          <CreditCard className="w-10 h-10 text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg font-black text-white mb-1">بطاقة ائتمان</h3>
          <p className="text-xs text-slate-400">Visa · Mastercard · Apple Pay</p>
        </div>

        <a
          href={paymentConfig.gumroadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold transition-all shadow-lg shadow-purple-900/20"
          onClick={() => void notifyOwner("gumroad")}
        >
          <Sparkles className="w-5 h-5" />
          ادفع ${price.monthly} / شهر
          <ExternalLink className="w-4 h-4 opacity-60" />
        </a>

        <p className="mt-3 text-center text-[10px] text-slate-600">
          دفع آمن عبر Gumroad — الاشتراك يُفعَّل بعد تأكيد الدفع
        </p>
      </FlowWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // Egyptian local flow (Vodafone Cash / InstaPay)
  // ═══════════════════════════════════════════════════════════════════

  const isVodafone = selectedMethod === "vodafone_cash";
  const displayAlias  = isVodafone ? paymentConfig.vodafoneCashNumber : paymentConfig.instapayAlias;
  const localMethodConfigured = Boolean(displayAlias && whatsappNumber);

  if (!localMethodConfigured) {
    return (
      <FlowWrapper onBack={() => setSelectedMethod(null)}>
        <div className="text-center mb-6">
          <Smartphone className={`w-10 h-10 mx-auto mb-3 ${isVodafone ? "text-red-400" : "text-blue-400"}`} />
          <h3 className="text-lg font-black text-white mb-1">وسيلة الدفع غير مهيأة بعد</h3>
          <p className="text-xs text-slate-400">بيانات هذه الوسيلة غير مكتملة في إعدادات المنصة حاليًا.</p>
        </div>
      </FlowWrapper>
    );
  }

  return (
    <FlowWrapper onBack={() => setSelectedMethod(null)}>
      <div className="text-center mb-5">
        <Smartphone className={`w-10 h-10 mx-auto mb-3 ${isVodafone ? "text-red-400" : "text-blue-400"}`} />
        <h3 className="text-lg font-black text-white mb-1">
          {isVodafone ? "فودافون كاش" : "InstaPay"}
        </h3>
        <p className="text-xs text-slate-400">حوّل {localPriceLabel} ثم ابعتلنا الإيصال</p>
      </div>

      {/* Steps */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4 mb-5">
        {/* Step 1 */}
        <Step n="١" title={isVodafone ? "حوّل على الرقم ده:" : "حوّل على الرمز ده (InstaPay):"}>
          <CopyField
            value={displayAlias}
            fieldKey="alias"
            copied={copied}
            onCopy={copyText}
          />
          {!isVodafone && (
            <CopyField
              value={paymentConfig.instapayNumber}
              fieldKey="number"
              copied={copied}
              onCopy={copyText}
              label="أو الرقم"
            />
          )}
        </Step>

        {/* Step 2 */}
        <Step n="٢" title={`المبلغ: ${localPriceLabel}`}>
          <p className="text-xs text-slate-500">باقة {TIER_LABELS.premium} — شهر واحد</p>
        </Step>

        {/* Step 3 */}
        <Step n="٣" title="ابعتلنا إيصال التحويل">
          <p className="text-xs text-slate-500">على WhatsApp وهنفعّلك خلال دقائق</p>
        </Step>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => {
            void notifyOwner(selectedMethod);
            openWhatsApp(`بعتلك إيصال تحويل ${isVodafone ? "فودافون كاش" : "InstaPay"} — رقم الحوالة: [ضع رقم الإيصال هنا]`);
          }}
          disabled={isSending}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all disabled:opacity-50"
        >
          {isSending
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <MessageCircle className="w-5 h-5" />}
          {isSending ? "جاري الإرسال..." : "ابعت الإيصال على WhatsApp"}
        </button>

        <button
          onClick={() => void notifyOwner(selectedMethod)}
          disabled={isSending}
          className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 disabled:opacity-50"
        >
          حوّلت بالفعل ومحتاج تفعيل؟ اضغط هنا
        </button>
      </div>
    </FlowWrapper>
  );
};

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

function MethodButton({
  icon, iconBg, label, sub, badge, onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sub: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-teal-400/30 transition-all text-right group"
    >
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-white text-sm">{label}</p>
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-400/15 text-teal-400 font-bold">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
      <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-teal-400 -rotate-90 transition-colors" />
    </button>
  );
}

function FlowWrapper({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
      dir="rtl"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-5 transition-colors"
      >
        <ArrowLeft className="w-3 h-3 rotate-180" />
        رجوع
      </button>
      {children}
    </motion.div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-teal-400/15 flex items-center justify-center flex-shrink-0 text-xs font-black text-teal-400">
        {n}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-white mb-1.5">{title}</p>
        {children}
      </div>
    </div>
  );
}

function CopyField({
  value, fieldKey, copied, onCopy, label,
}: {
  value: string;
  fieldKey: string;
  copied: string | null;
  onCopy: (v: string, k: string) => void;
  label?: string;
}) {
  return (
    <div className="mb-2">
      {label && <p className="text-[10px] text-slate-600 mb-1">{label}</p>}
      <button
        onClick={() => onCopy(value, fieldKey)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group w-full"
      >
        <span className="text-sm font-mono text-teal-300 flex-1 text-right">{value}</span>
        {copied === fieldKey
          ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          : <Copy className="w-4 h-4 text-slate-500 group-hover:text-teal-400 flex-shrink-0 transition-colors" />}
      </button>
    </div>
  );
}
