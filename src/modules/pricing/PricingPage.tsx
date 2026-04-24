'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { Check, Shield, Zap as Sparkles, ArrowRight, ArrowLeft, Zap, Crown, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { signInWithGoogleAtPath } from "@/services/authService";
import { consumeEmotionalOffer, getEmotionalOffer } from "@/services/subscriptionManager";
import { supabase } from "@/services/supabaseClient";
import { analyticsService, AnalyticsEvents } from "@/domains/analytics";
import { marketingLeadService } from "@/services/marketingLeadService";
import { recordFlowEvent } from "@/services/journeyTracking";
import {
  TIER_PRICES_USD,
  TIER_LABELS,
  PREMIUM_FEATURES_LIST,
} from "@/config/pricing";
import { markRevenueAccessUnlocked } from "@/services/revenueAccess";

const FEATURES = PREMIUM_FEATURES_LIST;

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [offerConsumed, setOfferConsumed] = useState(false);
  const [emotionalOffer, setEmotionalOffer] = useState(() => null as ReturnType<typeof getEmotionalOffer>);
  const globalPrice = TIER_PRICES_USD.premium.label;
  const localPrice = "200 ج.م";
  const viewTrackedRef = useRef(false);

  const [vipCode, setVipCode] = useState("");
  const [vipError, setVipError] = useState("");
  const [isVipLoading, setIsVipLoading] = useState(false);
  const [showVipInput, setShowVipInput] = useState(false);

  useEffect(() => {
    setEmotionalOffer(getEmotionalOffer());
  }, []);

  useEffect(() => {
    if (viewTrackedRef.current) return;
    viewTrackedRef.current = true;
    try {
      analyticsService.track(AnalyticsEvents.ACTIVATION_VIEWED, { page: "pricing" });
    } catch { /* never block render */ }

    // Check for magic link promo
    const params = new URLSearchParams(window.location.search);
    const magicVip = params.get("vip");
    if (magicVip && magicVip.trim().length > 0) {
      setTimeout(() => {
        setVipCode(magicVip.trim());
        setShowVipInput(true);
        void handleVipSubmit(magicVip.trim());
      }, 500);
    }
  }, []);

  const handleVipSubmit = async (codeOverride?: string) => {
    const code = (codeOverride || vipCode).trim();
    if (!code) return;
    setIsVipLoading(true);
    setVipError("");
    try {
      const email = "anonymous@alrehla.app";
      const phone = marketingLeadService.getStoredLeadPhone() || "";
      const res = await fetch("/api/checkout/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email, phone })
      });
      const data = await res.json();
      if (data.success) {
        markRevenueAccessUnlocked();
        window.location.href = "/";
      } else {
        setVipError(data.message || "كود غير مفعّل");
      }
    } catch (e) {
      setVipError("خطأ في الاتصال");
    } finally {
      setIsVipLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try { analyticsService.cta({ source: "pricing", plan: "premium" }); } catch { /* */ }

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full overflow-x-hidden isolate relative bg-[#02040a] text-slate-200"
      dir="rtl"
    >
      {/* Cinematic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-xl md:max-w-5xl flex-col items-center px-6 py-16 md:py-24">
        
        {/* Emotional Offer Banner */}
        <AnimatePresence>
          {emotionalOffer && !offerConsumed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="mb-12 w-full rounded-3xl border border-teal-500/20 bg-teal-500/5 backdrop-blur-xl p-6 text-right relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 blur-3xl rounded-full" />
              <p className="text-lg font-bold text-teal-400 mb-1">{emotionalOffer.title}</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{emotionalOffer.message}</p>
              <button
                type="button"
                onClick={() => {
                  consumeEmotionalOffer();
                  setOfferConsumed(true);
                }}
                className="rounded-xl bg-teal-500 px-6 py-2.5 text-xs font-black text-[#02040a] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/20"
              >
                قبول الهدية
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 max-w-2xl text-center"
        >
          <motion.p 
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.3em' }}
            className="mb-6 text-[11px] font-black uppercase text-teal-500 tracking-[0.3em]"
          >
            استثمارك في ذاتك
          </motion.p>
          <h1 className="mb-6 text-4xl md:text-5xl font-black leading-tight text-white tracking-tight">
            اختر أفق <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-400 to-blue-400">رحلتك القادمة</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto">
            هل تكتفي بالنظر للخريطة، أم قررت اليوم أن تبدأ التحرك الفعلي نحو التعافي؟
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid w-full grid-cols-1 gap-8 md:grid-cols-2"
        >
          {/* Free Tier Card */}
          <motion.div
            variants={itemVariants}
            className="relative group flex flex-col overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-2xl p-8 md:p-12 transition-all hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                <Compass className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">مساحة الأمان</h2>
                <p className="text-sm text-slate-500">بداية الاستكشاف</p>
              </div>
            </div>

            <div className="mb-10 rounded-3xl border border-white/5 bg-white/5 p-8 text-center">
              <span className="text-5xl font-black text-white">مجاناً</span>
              <p className="mt-3 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">متاحة لكل مسافر</p>
            </div>

            <ul className="mb-12 space-y-4 flex-1">
              {[
                "تشخيص الوعي وخريطة العلاقات",
                "روشتة تعافي مبدئية",
                "نبضات يومية للحالة المزاجية",
                "نصائح الذكاء الاصطناعي الأساسية"
              ].map((f) => (
                <li key={f} className="flex items-center gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5">
                    <Check className="h-3.5 w-3.5 text-teal-500" />
                  </div>
                  <span className="text-slate-400 font-medium">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => { window.location.href = "/"; }}
              className="mt-auto w-full py-5 text-sm font-black text-slate-400 border border-white/10 rounded-2xl hover:bg-white/5 hover:text-white transition-all active:scale-95"
            >
              البقاء في مساحة الأمان
            </button>
          </motion.div>

          {/* Premium Tier Card */}
          <motion.div
            variants={itemVariants}
            className="relative group flex flex-col overflow-hidden rounded-[2.5rem] border border-teal-500/20 bg-teal-500/[0.02] backdrop-blur-2xl p-8 md:p-12 shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-teal-500 text-[#02040a] text-[10px] font-black uppercase tracking-[0.2em] px-5 py-1.5 rounded-full shadow-[0_0_20px_rgba(20,184,166,0.3)]">
              المسار الأكثر عمقاً
            </div>

            <div className="flex items-center gap-4 mb-8 mt-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">أفق التوسع</h2>
                <p className="text-sm text-teal-500/60 font-bold">الأدوات المتقدمة للتعافي</p>
              </div>
            </div>

            <div className="mb-10 rounded-3xl border border-teal-500/10 bg-teal-500/5 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-teal-500/[0.02] animate-pulse" />
              <span className="relative z-10 text-6xl font-black text-white tracking-tighter">{globalPrice.split(' ')[0]}</span>
              <span className="relative z-10 text-xl font-bold text-slate-400 mr-2">/ شهر</span>
              <p className="mt-4 text-xs text-slate-500 font-medium">أو <span className="text-teal-400 font-black">{localPrice}</span> للمقيمين في مصر</p>
            </div>

            <ul className="mb-12 space-y-4 flex-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                    <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <span className="text-slate-200 font-bold">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => void handleSubscribe()}
              disabled={isLoading}
              className="relative group w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-teal-500 to-blue-500 py-5 text-xl font-black text-[#02040a] shadow-xl shadow-teal-500/20 transition-all hover:scale-[1.02] hover:shadow-teal-500/40 active:scale-95 disabled:opacity-60"
            >
              {isLoading ? (
                "جاري التجهيز..."
              ) : (
                <>
                  <Zap className="h-6 w-6 fill-current" />
                  ابدأ التعافي العميق
                  <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
                </>
              )}
            </button>
          </motion.div>
        </motion.div>

        {/* Secret Gate (VIP Section) */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 flex flex-col items-center gap-8 w-full max-w-md"
        >
          {!showVipInput ? (
            <button 
              onClick={() => setShowVipInput(true)}
              className="group flex flex-col items-center gap-3 text-slate-500 hover:text-teal-400 transition-all"
            >
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-teal-500/50 group-hover:shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-all">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs font-black tracking-[0.2em] uppercase">لديك كود مرور سري؟</span>
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full relative group"
            >
              <input 
                type="text" 
                autoFocus
                placeholder="أدخل الشفرة..." 
                value={vipCode}
                onChange={(e) => setVipCode(e.target.value)}
                dir="ltr"
                className="w-full bg-white/[0.02] border border-teal-500/20 rounded-2xl py-4 px-6 outline-none focus:border-teal-500/50 focus:bg-teal-500/[0.05] text-center font-black tracking-[0.4em] text-teal-400 uppercase placeholder:text-slate-700 transition-all"
              />
              <button
                onClick={() => handleVipSubmit()}
                disabled={isVipLoading || !vipCode.trim()}
                className="absolute left-2 top-2 bottom-2 px-6 rounded-xl bg-teal-500 text-[#02040a] text-sm font-black hover:bg-teal-400 transition-all disabled:opacity-50"
              >
                {isVipLoading ? "..." : "تأكيد"}
              </button>
            </motion.div>
          )}
          {vipError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-red-400 font-bold tracking-wide">{vipError}</motion.div>}
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 mt-4">
            <span className="flex items-center gap-2"><Shield className="w-3 h-3" /> بيانات مشفرة</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span>إلغاء في أي وقت</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span>دعم مستمر ٢٤/٧</span>
          </div>
        </motion.div>

        <div className="h-24" />
      </div>
    </div>
  );
}

