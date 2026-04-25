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
  Zap as Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  normalizeWhatsappNumber,
  paymentConfig,
} from "@/config/paymentConfig";
import { TIER_PRICES_USD, TIER_LABELS } from "@/config/pricing";
import { telegramBot } from "@/services/telegramBot";
import { supabase } from "@/services/supabaseClient";
import * as analyticsService from "@/services/analytics";
import { useEffect } from "react";

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

  useEffect(() => {
    // Fired when the payment selector is shown
    analyticsService.trackCheckoutViewed({
      course: TIER_LABELS.premium,
      price: price.monthly
    });
    
    analyticsService.trackAddPaymentInfo({ 
      course: TIER_LABELS.premium,
      price: price.monthly 
    });
  }, [price]);

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
    analyticsService.trackPaymentNumberCopied({ field: key, value: text });
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // ── Telegram notification ────────────────────────────────────────
  const notifyOwner = useCallback(async (method: PaymentMethod) => {
    setIsSending(true);

    // P0: Critical funnel event - User committed to paying/sent proof
    analyticsService.trackPaymentProofSubmitted({
      method,
      value: price.monthly,
      currency: "USD",
      content_name: TIER_LABELS.premium
    });

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
          `⏰ ${new Date().toLocaleString("en-US")}`,
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
    analyticsService.trackWhatsAppSupportClicked({ context: extraText || "general_support" });
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  }, [whatsappNumber]);

  // ── Success screen ─────────────────────────────────────────────────
  if (requestSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center p-8 min-h-[360px] justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, delay: 0.15 }}
          className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-400/20 backdrop-blur-md relative"
        >
          <div className="absolute inset-0 rounded-3xl border border-emerald-300/30 blur-[2px]" />
          <Check className="w-12 h-12 text-emerald-400 relative z-10 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        </motion.div>

        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">تم إرسال الإشارة! 🎉</h3>
        <p className="text-sm text-emerald-100/70 leading-relaxed max-w-xs mb-8">
          البوابة استقبلت طلبك. هنتواصل معاك خلال دقائق لتأكيد الدفع وفتح المسار.
          <br /><span className="text-teal-400/80 mt-2 block">عايز تسرّع العملية؟ كلمنا مباشرة:</span>
        </p>

        <button
          onClick={() => openWhatsApp("بعتلك إيصال الدفع عشان تفعّل الحساب.")}
          className="flex items-center justify-center gap-2 w-full max-w-[280px] p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition-all mb-4 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/30"
        >
          <MessageCircle className="w-5 h-5" />
          تأكيد عبر WhatsApp
        </button>

        <button
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-teal-400 transition-colors"
        >
          العودة للرحلة
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
        <div className="text-center mb-6 relative">
          <div className="absolute inset-0 bg-teal-500/10 blur-[40px] rounded-full" />
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-400/90 to-emerald-600/90 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(20,184,166,0.3)] border border-teal-300/20 backdrop-blur-xl">
            <ShieldCheck className="w-8 h-8 text-slate-950" />
          </div>
          <h3 className="text-xl font-black text-white mb-1 tracking-tight">تأكيد مرورك القيادي</h3>
          <p className="text-xs text-teal-100/70 font-medium">
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
            onClick={() => {
              analyticsService.trackPaymentMethodSelected({ method: "vodafone_cash" });
              analyticsService.trackInitiateCheckout({ method: "vodafone_cash" });
              setSelectedMethod("vodafone_cash");
            }}
          />

          {/* InstaPay */}
          <MethodButton
            icon={<Smartphone className="w-5 h-5 text-blue-400" />}
            iconBg="bg-blue-500/15"
            label="InstaPay"
            sub={localPriceLabel}
            onClick={() => {
              analyticsService.trackPaymentMethodSelected({ method: "instapay" });
              analyticsService.trackInitiateCheckout({ method: "instapay" });
              setSelectedMethod("instapay");
            }}
          />

          {/* PayPal */}
          <MethodButton
            icon={<CreditCard className="w-5 h-5 text-sky-400" />}
            iconBg="bg-sky-500/15"
            label="PayPal"
            sub={`$${price.monthly}/شهر`}
            badge="دولي"
            onClick={() => {
              analyticsService.trackPaymentMethodSelected({ method: "paypal" });
              analyticsService.trackInitiateCheckout({ method: "paypal" });
              setSelectedMethod("paypal");
            }}
          />

          {/* Gumroad / Card */}
          <MethodButton
            icon={<CreditCard className="w-5 h-5 text-purple-400" />}
            iconBg="bg-purple-500/15"
            label="بطاقة ائتمان"
            sub={`$${price.monthly}/شهر — Apple Pay, Visa, Mastercard`}
            badge="دولي"
            onClick={() => {
              analyticsService.trackPaymentMethodSelected({ method: "gumroad" });
              analyticsService.trackInitiateCheckout({ method: "gumroad" });
              setSelectedMethod("gumroad");
            }}
          />
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 font-medium tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          اتصال مشفر ومؤمن بالكامل. لا نحتفظ بأي بيانات بنكية.
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
            <p className="text-xs text-slate-400">لم يتم ضبط رابط PayPal بعد.</p>
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
            <p className="text-xs text-slate-400">لم يتم ضبط رابط الدفع الدولي بعد.</p>
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
          <p className="text-xs text-slate-400">بيانات هذه الوسيلة غير مكتملة حاليًا.</p>
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
      <div className="rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-xl p-5 space-y-5 mb-6 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
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

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-3/4 mx-auto" />

        {/* Step 2 */}
        <Step n="٢" title={`المبلغ: ${localPriceLabel}`}>
          <p className="text-xs text-slate-400 font-medium">باقة {TIER_LABELS.premium} — تفعيل المسار</p>
        </Step>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-3/4 mx-auto" />

        {/* Step 3 */}
        <Step n="٣" title="ابعتلنا إيصال التحويل">
          <p className="text-xs text-slate-400 font-medium">على WhatsApp وهنفعّلك فوراً</p>
        </Step>
      </div>

      {/* Actions */}
      <div className="space-y-3 relative z-10">
        <button
          onClick={() => {
            void notifyOwner(selectedMethod);
            openWhatsApp(`بعتلك إيصال تحويل ${isVodafone ? "فودافون كاش" : "InstaPay"} — رقم الحوالة: [ضع رقم الإيصال هنا]`);
          }}
          disabled={isSending}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-teal-900/20 hover:shadow-teal-500/30"
        >
          {isSending
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <MessageCircle className="w-5 h-5" />}
          {isSending ? "جاري الإرسال..." : "أرسل الإيصال على WhatsApp"}
        </button>

        <button
          onClick={() => void notifyOwner(selectedMethod)}
          disabled={isSending}
          className="w-full text-center text-xs font-medium text-slate-500 hover:text-teal-400 transition-colors py-2 disabled:opacity-50"
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
      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.05] hover:border-teal-400/40 transition-all duration-300 text-right group shadow-lg shadow-black/20 hover:shadow-teal-900/20 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 border border-white/5 shadow-inner`}>
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
