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
  UploadCloud,
  ImageIcon
} from "lucide-react";
import {
  normalizeWhatsappNumber,
  paymentConfig,
} from "@/config/paymentConfig";
import { TIER_PRICES_USD, TIER_LABELS, BASE_PRICE_EGP, ORIGINAL_PRICE_EGP } from "@/config/pricing";
import { telegramBot } from "@/services/telegramBot";
import { supabase } from "@/services/supabaseClient";
import * as analyticsService from "@/services/analytics";
import { useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

type PaymentMethod = "vodafone_cash" | "instapay" | "paypal" | "gumroad" | "etisalat_cash" | "bank_transfer";

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
  const [requestSent, setRequestSent] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const price = TIER_PRICES_USD.premium;
  const localPriceLabel = paymentConfig.localMonthlyPriceLabel || `${BASE_PRICE_EGP} ج.م / شهر`;
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

  // ── Telegram & DB notification ────────────────────────────────────────
  const notifyOwner = useCallback(async (method: PaymentMethod, overrideReceipt?: string) => {
    setIsSending(true);
    const finalReceipt = overrideReceipt || receiptNumber;

    // Record in DB and trigger server-side Telegram notification
    try {
      const user = await getUserInfo();
      const finalEmail = user.email !== "غير معروف" ? user.email : (contactInfo || "غير معروف");

      await fetch("/api/payments/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: finalEmail,
          amount: BASE_PRICE_EGP,
          provider: method,
          itemType: "subscription",
          metadata: { market: "Local", receipt: finalReceipt },
          receiptUrl
        })
      });
    } catch (e) {
      console.error("Failed to record transaction start:", e);
    }

    // P0: Critical funnel event - User committed to paying/sent proof
    analyticsService.trackPaymentProofSubmitted({
      method,
      value: price.monthly,
      currency: "USD",
      content_name: TIER_LABELS.premium
    });

    // Keep standard registration tracking for third-party sync
    analyticsService.trackCompleteRegistration({
      method,
      value: price.monthly,
      currency: "USD",
      content_name: TIER_LABELS.premium
    });

    try {
      setRequestSent(true);
    } catch (error) {
      console.error("Post-payment error:", error);
    } finally {
      setIsSending(false);
    }
  }, [price, receiptNumber, receiptUrl, contactInfo]);

  // ── Image Upload ──────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `payments/${fileName}`; // Folder inside receipts

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      setReceiptUrl(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      alert("حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploading(false);
    }
  };

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
          onClick={_onSuccess || onClose}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          رجوع لرحلتك
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-teal-500/10">
            <ShieldCheck className="w-7 h-7 text-slate-950" />
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <h3 className="text-lg font-black text-white">اختر طريقة الدفع</h3>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold mx-auto">
              <Sparkles className="w-3 h-3" />
              خصم 50% للدفعة الأولى لفترة محدودة
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 line-through decoration-red-500/50">{ORIGINAL_PRICE_EGP} ج.م</span>
              <span className="text-xl font-black text-white">{BASE_PRICE_EGP} ج.م</span>
              <span className="text-xs text-slate-400">/ شهر</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
              أو ${price.monthly} <span className="line-through decoration-slate-600 opacity-60">${price.originalMonthly}</span> دولياً
            </p>
          </div>
        </div>

        {/* Methods */}
        <div className="space-y-3">
          {/* Vodafone Cash */}
          <MethodButton
            icon={<Smartphone className="w-5 h-5 text-red-400" />}
            iconBg="bg-red-500/15"
            label="فودافون كاش"
            sub={`${BASE_PRICE_EGP} ج.م / شهر`}
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
            sub={`${BASE_PRICE_EGP} ج.م / شهر`}
            onClick={() => {
              analyticsService.trackPaymentMethodSelected({ method: "instapay" });
              analyticsService.trackInitiateCheckout({ method: "instapay" });
              setSelectedMethod("instapay");
            }}
          />

          {/* Etisalat Cash */}
          <MethodButton
            icon={<Smartphone className="w-5 h-5 text-emerald-400" />}
            iconBg="bg-emerald-500/15"
            label="اتصالات كاش"
            sub={`${BASE_PRICE_EGP} ج.م / شهر`}
            onClick={() => {
              analyticsService.trackPaymentMethodSelected({ method: "etisalat_cash" });
              analyticsService.trackInitiateCheckout({ method: "etisalat_cash" });
              setSelectedMethod("etisalat_cash");
            }}
          />

          {/* Bank Transfer */}
          <MethodButton
            icon={<CreditCard className="w-5 h-5 text-indigo-400" />}
            iconBg="bg-indigo-500/15"
            label="تحويل بنكي"
            sub={localPriceLabel}
            onClick={() => {
              analyticsService.trackPaymentMethodSelected({ method: "bank_transfer" });
              analyticsService.trackInitiateCheckout({ method: "bank_transfer" });
              setSelectedMethod("bank_transfer");
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
  // Bank Transfer flow
  // ═══════════════════════════════════════════════════════════════════

  if (selectedMethod === "bank_transfer") {
    const bankConfigured = Boolean(paymentConfig.bankAccountNumber && paymentConfig.bankName);

    if (!bankConfigured) {
      return (
        <FlowWrapper onBack={() => setSelectedMethod(null)}>
          <div className="text-center mb-6">
            <CreditCard className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-lg font-black text-white mb-1">بيانات البنك غير متاحة</h3>
            <p className="text-xs text-slate-400">يرجى التواصل معنا مباشرة للتفعيل.</p>
          </div>
        </FlowWrapper>
      );
    }

    return (
      <FlowWrapper onBack={() => setSelectedMethod(null)}>
        <div className="text-center mb-5">
          <CreditCard className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-lg font-black text-white mb-1">تحويل بنكي</h3>
          <p className="text-xs text-slate-400">قم بالتحويل للملف البنكي التالي:</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4 mb-5">
          <Step n="١" title="بيانات الحساب:">
            <div className="space-y-3">
              <CopyField value={paymentConfig.bankName} fieldKey="bank_name" copied={copied} onCopy={copyText} label="البنك" />
              <CopyField value={paymentConfig.bankBeneficiary} fieldKey="beneficiary" copied={copied} onCopy={copyText} label="المستفيد" />
              <CopyField value={paymentConfig.bankAccountNumber} fieldKey="acc_num" copied={copied} onCopy={copyText} label="رقم الحساب" />
              <CopyField value={paymentConfig.bankIban} fieldKey="iban" copied={copied} onCopy={copyText} label="IBAN" />
            </div>
          </Step>
          <Step n="٢" title={`المبلغ: ${localPriceLabel}`}>
            <p className="text-xs text-slate-500">باقة {TIER_LABELS.premium} — شهر واحد</p>
          </Step>
        </div>

        <button
          onClick={() => {
            void notifyOwner("bank_transfer");
            openWhatsApp("حوّلت المبلغ عبر البنك، محتاج تفعيل الحساب.");
          }}
          disabled={isSending}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all"
        >
          {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
          إرسال إثبات التحويل
        </button>
      </FlowWrapper>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // Egyptian local flow (Vodafone Cash / InstaPay / Etisalat Cash)
  // ═══════════════════════════════════════════════════════════════════

  const isVodafone = selectedMethod === "vodafone_cash";
  const isEtisalat = selectedMethod === "etisalat_cash";
  const isInstapay = selectedMethod === "instapay";

  let displayAlias = "";
  let methodLabel = "";
  let methodColor = "text-blue-400";
  
  if (isVodafone) {
    displayAlias = paymentConfig.vodafoneCashNumber;
    methodLabel = "فودافون كاش";
    methodColor = "text-red-400";
  } else if (isEtisalat) {
    displayAlias = paymentConfig.etisalatCashNumber;
    methodLabel = "اتصالات كاش";
    methodColor = "text-emerald-400";
  } else {
    displayAlias = paymentConfig.instapayAlias;
    methodLabel = "InstaPay";
    methodColor = "text-blue-400";
  }

  const localMethodConfigured = Boolean(displayAlias && whatsappNumber);

  if (!localMethodConfigured) {
    return (
      <FlowWrapper onBack={() => setSelectedMethod(null)}>
        <div className="text-center mb-6">
          <Smartphone className={`w-10 h-10 mx-auto mb-3 ${methodColor}`} />
          <h3 className="text-lg font-black text-white mb-1">وسيلة الدفع غير مهيأة بعد</h3>
          <p className="text-xs text-slate-400">بيانات هذه الوسيلة غير مكتملة حاليًا.</p>
        </div>
      </FlowWrapper>
    );
  }

  return (
    <FlowWrapper onBack={() => setSelectedMethod(null)}>
      <div className="text-center mb-5">
        <Smartphone className={`w-10 h-10 mx-auto mb-3 ${methodColor}`} />
        <h3 className="text-lg font-black text-white mb-1">
          {methodLabel}
        </h3>
        <p className="text-xs text-slate-400">حوّل {localPriceLabel} ثم ابعتلنا الإيصال</p>
      </div>

      {/* Steps */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4 mb-5">
        {/* Step 1 */}
        <Step n="١" title={isInstapay ? "حوّل على الرمز ده (InstaPay):" : "حوّل على الرقم ده:"}>
          <CopyField
            value={displayAlias}
            fieldKey="alias"
            copied={copied}
            onCopy={copyText}
          />
          {isInstapay && (
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
          <div className="space-y-3">
             <p className="text-[11px] text-slate-500">طالما إنت مش مسجل دخول، ابعتلنا رقم خطك أو إيميلك عشان نفعل لك بيه:</p>
             <div className="relative group">
               <input
                 type="text"
                 placeholder="رقم الواتس آب أو الإيميل الخاص بك"
                 value={contactInfo}
                 onChange={(e) => setContactInfo(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all font-mono mb-2"
               />
               <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/30 group-focus-within:text-emerald-400 group-focus-within:animate-pulse pointer-events-none" />
             </div>
             
             <p className="text-[11px] text-slate-500 mt-2">عشان نوصل للحوالة أسرع وتقدر تبدأ رحلتك فوراً:</p>
             <div className="relative group">
               <input
                 type="text"
                 placeholder="رقم الحوالة (اختياري)"
                 value={receiptNumber}
                 onChange={(e) => setReceiptNumber(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all text-center font-mono"
               />
               <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500/30 group-focus-within:text-teal-400 group-focus-within:animate-pulse pointer-events-none" />
             </div>
             
             {/* Upload Field */}
             <div className="mt-3">
               {receiptUrl ? (
                 <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                     <ImageIcon className="w-4 h-4" />
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col text-right">
                     <span className="text-sm font-bold">تم إرفاق الإيصال بنجاح</span>
                     <span className="text-[10px] opacity-70">هيتبعت مع طلب الترقية</span>
                   </div>
                   <Check className="w-5 h-5" />
                 </div>
               ) : (
                 <label className={`flex gap-3 px-4 py-3 rounded-xl border border-dashed transition-all cursor-pointer items-center justify-center
                   ${isUploading ? "bg-white/5 border-white/10 opacity-70 pointer-events-none" : "bg-white/[0.02] border-white/20 hover:bg-white/5 hover:border-teal-500/50"}
                 `}>
                   <input 
                     type="file" 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handleImageUpload}
                     disabled={isUploading}
                   />
                   {isUploading ? (
                     <>
                       <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                       <span className="text-xs text-slate-300">جاري الرفع...</span>
                     </>
                   ) : (
                     <>
                       <UploadCloud className="w-5 h-5 text-slate-500" />
                       <span className="text-xs font-bold text-slate-300">ارفع صورة الإيصال (اختياري)</span>
                     </>
                   )}
                 </label>
               )}
             </div>

          </div>
        </Step>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => {
            void notifyOwner(selectedMethod);
            const receiptTxt = receiptNumber ? `رقم الحوالة: ${receiptNumber}` : "بعتلك إيصال التحويل";
            const imgTxt = receiptUrl ? " (ورفعت الصورة على المنصة)" : "";
            openWhatsApp(`حوّلت ${isVodafone ? "فودافون كاش" : methodLabel} — ${receiptTxt}${imgTxt}`);
          }}
          disabled={isSending || isUploading}
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
