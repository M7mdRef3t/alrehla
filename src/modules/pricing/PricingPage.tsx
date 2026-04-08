'use client';

import React, { useEffect, useRef, useState } from "react";
import { Check, Shield, Sparkles, ArrowLeft, Zap } from "lucide-react";
import { signInWithGoogleAtPath } from "@/services/authService";
import { consumeEmotionalOffer, getEmotionalOffer } from "@/services/subscriptionManager";
import { supabase } from "@/services/supabaseClient";
import { trackEvent, AnalyticsEvents } from "@/services/analytics";
import { marketingLeadService } from "@/services/marketingLeadService";
import { recordFlowEvent } from "@/services/journeyTracking";
import {
  TIER_PRICES_USD,
  TIER_LABELS,
  PREMIUM_FEATURES_LIST,
} from "@/config/pricing";

const FEATURES = PREMIUM_FEATURES_LIST;

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [offerConsumed, setOfferConsumed] = useState(false);
  const [emotionalOffer, setEmotionalOffer] = useState(() => null as ReturnType<typeof getEmotionalOffer>);
  const globalPrice = TIER_PRICES_USD.premium.label;
  const localPrice = "200 ج.م";
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    setEmotionalOffer(getEmotionalOffer());
  }, []);

  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    try {
      trackEvent(AnalyticsEvents.ACTIVATION_VIEWED, { page: "pricing" });
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

    const storedPhone = marketingLeadService.getStoredLeadPhone();
    const storedLeadId = marketingLeadService.getStoredLeadId();
    if (storedPhone || storedLeadId) {
      try {
        recordFlowEvent("activation_page_viewed");
        void marketingLeadService.syncLead({
          phone: storedPhone ?? undefined,
          status: "engaged",
          source: "pricing_page",
          sourceType: "website",
          metadata: { leadId: storedLeadId ?? undefined, plan: "premium_intent" }
        });
      } catch { /* non-blocking */ }
    }

    window.location.href = `/coach`;
  };

  return (
    <div
      className="min-h-screen px-4 py-16 font-sans md:py-24 bg-app transition-colors"
      dir="rtl"
      style={{
        background: "radial-gradient(circle at top, rgba(20,184,166,0.08), transparent 50%), var(--app-bg)"
      }}
    >
      <div className="mx-auto flex w-full max-w-xl md:max-w-4xl flex-col items-center">
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
              className="mt-3 rounded-lg bg-teal-400 px-4 py-2 text-xs font-bold text-teal-950 transition-colors hover:bg-teal-300"
            >
              تم الاستلام
            </button>
          </div>
        ) : null}

        {/* Header */}
        <div className="mb-10 max-w-lg text-center">
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-teal-500 dark:text-teal-400">
            مساحات الملاذ الآمن
          </p>
            <h1 className="mb-4 text-3xl font-black leading-tight text-app-foreground md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            خطوة واحدة بينك وبين التعافي
          </h1>
          <p className="text-sm leading-[1.8] text-app-muted-foreground">
            أنت الآن في أمان.. يمكنك البقاء في الملاذ المبدئي للتحليل، أو فتح المسار الأكثر خطورة وعمقاً.
          </p>
        </div>

        {/* A/B Pricing Cards */}
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 md:max-w-4xl max-w-xl mx-auto">
          {/* Free Tier Card */}
          <div
            className="relative flex flex-col overflow-hidden rounded-[2rem] border border-app-border p-8 md:p-10 transition-all bg-app-surface/60 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-app-muted border border-app-border">
                <Shield className="h-6 w-6 text-app-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-black text-app-foreground">الملاذ المبدئي</h2>
                <p className="text-xs text-app-muted-foreground">مساحة آمنة لاكتشاف خريطتك</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-8 rounded-2xl border border-app-border bg-app-muted p-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-app-foreground">مجاناً</span>
              </div>
              <p className="mt-2 text-[10px] text-app-muted-foreground uppercase tracking-widest">متاح دائماً</p>
            </div>

            {/* Features */}
            <ul className="mb-8 space-y-3 flex-1">
              {[
                "تشخيص الوعي وخريطة العلاقات",
                "روشتة تعافي مبدئية",
                "نبضات يومية للحالة المزاجية",
                "نصائح الذكاء الاصطناعي الأساسية"
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-muted">
                    <Check className="h-3 w-3 text-teal-400" />
                  </div>
                  <span className="text-sm text-app-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => { window.location.href = "/"; }}
              className="mt-auto w-full py-4 text-sm font-bold text-app-muted-foreground border border-app-border rounded-2xl hover:bg-app-muted hover:text-app-foreground transition-all"
            >
              استمر في الملاذ
            </button>
          </div>

          {/* Premium Tier Card */}
          <div
            className="relative flex flex-col overflow-hidden rounded-[2rem] border border-teal-500/30 p-8 md:p-10 shadow-xl bg-app-surface/80 backdrop-blur-xl"
            style={{
              background: "radial-gradient(circle at top right, rgba(20,184,166,0.12), transparent 50%), var(--app-surface)"
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-teal-950 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.2)]">
              المسار الأكثر طلباً
            </div>

            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400/10 border border-teal-400/20">
                <Sparkles className="h-6 w-6 text-teal-500 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-app-foreground">{TIER_LABELS.premium}</h2>
                <p className="text-xs text-teal-600 dark:text-teal-400/80">التعافي العميق بأدوات سيادية</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-8 rounded-2xl border border-teal-500/10 bg-teal-500/[0.03] p-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-5xl font-black text-app-foreground">{globalPrice}</span>
              </div>
              <p className="mt-2 text-xs text-app-muted-foreground">أو <span className="text-teal-600 dark:text-teal-400 font-bold">{localPrice}</span> / شهر للمصريين</p>
            </div>

            {/* Features */}
            <ul className="mb-8 space-y-3 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 dark:bg-teal-400/20">
                    <Check className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="text-sm font-medium text-app-foreground">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => void handleSubscribe()}
              disabled={isLoading}
              className="group w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 dark:from-teal-400 dark:to-emerald-400 py-4 text-lg font-black text-white dark:text-teal-950 shadow-lg dark:shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? (
                "جاري التجهيز..."
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  افتح المسار المتقدم
                  <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trust */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-center text-xs text-app-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            بياناتك مشفرة ومحمية
          </div>
          <span className="h-1 w-1 rounded-full bg-app-border" />
          <div>إلغاء في أي وقت بدون شروط</div>
          <span className="h-1 w-1 rounded-full bg-app-border" />
          <div>الفتح خلال ساعة من التواصل أو المسار الداخلي</div>
        </div>
      </div>
    </div>
  );
}
