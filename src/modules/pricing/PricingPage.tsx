"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Shield, Sparkles, ArrowLeft, Zap } from "lucide-react";
import { signInWithGoogleAtPath } from "../../services/authService";
import { consumeEmotionalOffer, getEmotionalOffer } from "../../services/subscriptionManager";
import { supabase } from "../../services/supabaseClient";
import { trackEvent, AnalyticsEvents } from "../../services/analytics";

const FEATURES = [
  "خريطة علاقات لا محدودة",
  "خطة تعافي يومية مخصصة بالذكاء الاصطناعي",
  "تحليل الأنماط المتكررة في علاقاتك",
  "مساعد ذكي (نَواة) بلا حدود",
  "تقارير PDF شاملة",
  "أولوية في الدعم والمتابعة",
];

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [offerConsumed, setOfferConsumed] = useState(false);
  const emotionalOffer = useMemo(() => getEmotionalOffer(), []);
  const foundingPrice = process.env.NEXT_PUBLIC_FOUNDING_COHORT_PRICE_LABEL || "30 USD / 500 EGP";
  const localPrice = process.env.NEXT_PUBLIC_LOCAL_PREMIUM_PRICE_LABEL || "500 EGP";
  const globalPrice = process.env.NEXT_PUBLIC_GLOBAL_PREMIUM_PRICE_LABEL || "30 USD";
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    try {
      trackEvent(AnalyticsEvents.CHECKOUT_VIEWED, { page: "pricing" });
    } catch { /* never block render */ }
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try { trackEvent(AnalyticsEvents.CTA_CLICK, { source: "pricing", plan: "premium" }); } catch { /* */ }

    if (!supabase) {
      alert("خدمة التسجيل غير متاحة حاليًا.");
      setIsLoading(false);
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      await signInWithGoogleAtPath("/pricing");
      setIsLoading(false);
      return;
    }

    window.location.href = `/checkout?plan=premium`;
  };

  return (
    <div
      className="min-h-screen px-4 py-16 font-sans md:py-24"
      dir="rtl"
      style={{
        background: "radial-gradient(circle at top, rgba(20,184,166,0.12), transparent 40%), linear-gradient(180deg, #060f15 0%, #0a1a24 50%, #060f15 100%)"
      }}
    >
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        {/* Emotional offer banner */}
        {emotionalOffer && !offerConsumed ? (
          <div className="mb-8 w-full rounded-2xl border border-teal-400/20 bg-teal-400/10 px-5 py-4 text-right">
            <p className="text-sm font-bold leading-tight text-teal-100">{emotionalOffer.title}</p>
            <p className="mt-1 text-sm leading-[1.7] text-teal-200/70">{emotionalOffer.message}</p>
            <button
              type="button"
              onClick={() => {
                consumeEmotionalOffer();
                setOfferConsumed(true);
              }}
              className="mt-3 rounded-lg bg-teal-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-teal-300"
            >
              تم الاستلام
            </button>
          </div>
        ) : null}

        {/* Header */}
        <div className="mb-10 max-w-lg text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-teal-400">
            فعّل رحلتك
          </p>
          <h1 className="mb-4 text-3xl font-black leading-tight text-white md:text-4xl" style={{ fontFamily: "Tajawal, sans-serif" }}>
            خطوة واحدة بينك وبين التعافي
          </h1>
          <p className="text-base leading-[1.8] text-slate-400">
            اكتشفت الخريطة. شوفت الحقيقة. دلوقتي فعّل رحلتك لتحصل على خطة عمل يومية مخصصة ليك.
          </p>
        </div>

        {/* Single Plan Card */}
        <div
          className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 p-8 md:p-10"
          style={{
            background: "radial-gradient(circle at top right, rgba(20,184,166,0.12), transparent 50%), rgba(15,23,42,0.85)",
            backdropFilter: "blur(20px)"
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 border border-teal-400/20">
              <Shield className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">الخطة الشخصية</h2>
              <p className="text-xs text-slate-400">كل اللي محتاجه عشان تستعيد نفسك</p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-5xl font-black text-white">{globalPrice}</span>
              <span className="mb-1.5 text-sm font-medium text-slate-400">/ لمرة واحدة</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">أو {localPrice} لمواطني مصر — الدفع يدوي ببياناتك</p>
          </div>

          {/* Features */}
          <ul className="mb-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/15">
                  <Check className="h-3 w-3 text-teal-400" />
                </div>
                <span className="text-sm text-slate-300">{f}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={() => void handleSubscribe()}
            disabled={isLoading}
            className="group w-full flex items-center justify-center gap-3 rounded-2xl bg-teal-400 py-4 text-lg font-black text-slate-950 shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-300 hover:shadow-teal-500/30 active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? (
              "جاري فتح صفحة التفعيل..."
            ) : (
              <>
                <Zap className="h-5 w-5" />
                فعّل رحلتك الآن
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </>
            )}
          </button>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            الدفع يدوي بالكامل (InstaPay / Vodafone Cash / PayPal). بعد التحويل هنفعّلك في أقل من ساعة.
          </p>
        </div>

        {/* Trust */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-center text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            بياناتك مشفرة ومحمية
          </div>
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <div>إلغاء في أي وقت بدون شروط</div>
          <span className="h-1 w-1 rounded-full bg-slate-700" />
          <div>التفعيل خلال ساعة من الدفع</div>
        </div>
      </div>
    </div>
  );
}
