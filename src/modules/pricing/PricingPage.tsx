"use client";

import React, { useMemo, useState } from "react";
import { Check, Lock, Shield, Sparkles, Target } from "lucide-react";
import { signInWithGoogleAtPath } from "../../services/authService";
import { consumeEmotionalOffer, getEmotionalOffer } from "../../services/subscriptionManager";
import { supabase } from "../../services/supabaseClient";

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<"premium" | "coach" | null>(null);
  const [offerConsumed, setOfferConsumed] = useState(false);
  const emotionalOffer = useMemo(() => getEmotionalOffer(), []);

  const handleSubscribe = async (tier: "premium" | "coach") => {
    setIsLoading(tier);

    if (!supabase) {
      alert("خدمة التسجيل غير متاحة حاليًا.");
      setIsLoading(null);
      return;
    }

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session?.user) {
      await signInWithGoogleAtPath("/pricing");
      setIsLoading(null);
      return;
    }

    window.location.href = `/checkout?plan=${tier}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-20 font-sans" dir="rtl">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        {emotionalOffer && !offerConsumed ? (
          <div className="mb-8 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-right shadow-sm">
            <p className="text-sm font-bold leading-tight text-emerald-800">{emotionalOffer.title}</p>
            <p className="mt-1 text-sm leading-[1.7] text-emerald-700">{emotionalOffer.message}</p>
            <button
              type="button"
              onClick={() => {
                consumeEmotionalOffer();
                setOfferConsumed(true);
              }}
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              تم الاستلام
            </button>
          </div>
        ) : null}

        <div className="mb-14 max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--soft-teal)] bg-[var(--soft-teal)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--soft-teal)]">
            <Sparkles className="h-4 w-4" />
            اختار المسار المناسب وابدأ التفعيل
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
            باقات واضحة من غير فواصل وهمية
          </h1>
          <p className="text-lg leading-[1.8] text-gray-600">
            الدفع الحالي يدوي بالكامل. تختار الباقة، تنتقل لصفحة التفعيل، وتكمل التحويل وترسل الإثبات هناك.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2">
          <div className="relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:p-10">
            <div className="mb-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-2xl font-bold leading-tight text-gray-900">الخطة الشخصية</h2>
              <p className="h-10 text-sm leading-[1.8] text-gray-500">
                لفرد عايز وضوح أكتر، متابعة أحسن، ومسار شخصي داخل دواير.
              </p>
            </div>

            <div className="mb-8 rounded-2xl bg-gray-50 p-6">
              <div className="mb-1 flex items-end gap-1">
                <span className="text-4xl font-black text-gray-900">9 دولار</span>
                <span className="mb-1 font-medium text-gray-500">/ شهريًا</span>
              </div>
              <div className="text-sm text-gray-400">التفعيل والمتابعة يدويين حاليًا</div>
            </div>

            <ul className="mb-10 flex-1 space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--soft-teal)]" />
                <span className="leading-relaxed">
                  <strong>خريطة أوضح للعلاقات</strong> بدل التخمين واللف
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--soft-teal)]" />
                <span className="leading-relaxed">
                  <strong>متابعة منتظمة</strong> للحالة والتقدم
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--soft-teal)]" />
                <span className="leading-relaxed">
                  <strong>دخول أسرع للمميزات الأساسية</strong>
                </span>
              </li>
            </ul>

            <button
              onClick={() => void handleSubscribe("premium")}
              disabled={isLoading === "premium"}
              className="flex w-full items-center justify-center rounded-xl bg-gray-900 py-4 text-lg font-bold text-white shadow-lg shadow-gray-900/20 transition-colors hover:bg-black"
            >
              {isLoading === "premium" ? "جاري فتح صفحة التفعيل..." : "ابدأ الخطة الشخصية"}
            </button>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--soft-teal)] via-[var(--soft-teal)] to-[var(--soft-teal)] p-8 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--soft-teal)] md:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-white opacity-5 blur-3xl" />

            <div className="absolute left-6 top-6 rounded-full border border-[var(--soft-teal)] bg-[var(--soft-teal)]/30 px-3 py-1 text-xs font-bold text-[var(--soft-teal)] backdrop-blur-sm">
              للمدربين والمعالجين
            </div>

            <div className="relative z-10 mb-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--soft-teal)] bg-[var(--soft-teal)]/20 text-[var(--soft-teal)] backdrop-blur-sm">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-2xl font-bold leading-tight text-white">خطة العيادة</h2>
              <p className="h-10 text-sm leading-[1.8] text-[var(--soft-teal)]">
                للمتابعة المنظمة، وإدارة عدد من الحالات، وتوسيع الاستخدام بشكل أنضف.
              </p>
            </div>

            <div className="relative z-10 mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-1 flex items-end gap-1">
                <span className="text-4xl font-black text-white">49 دولار</span>
                <span className="mb-1 font-medium text-[var(--soft-teal)]">/ شهريًا</span>
              </div>
              <div className="text-sm text-[var(--soft-teal)]">يشمل أول 10 مقاعد للعملاء</div>
            </div>

            <ul className="relative z-10 mb-10 flex-1 space-y-4 text-[var(--soft-teal)]">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-full bg-[var(--soft-teal)]/30 p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="leading-relaxed">
                  <strong>لوحة متابعة أوضح</strong> للحالات والاشتراكات
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-full bg-[var(--soft-teal)]/30 p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="leading-relaxed">تنظيم أفضل للتوسع والإدارة</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-full bg-[var(--soft-teal)]/30 p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="leading-relaxed">
                  <strong>مسار تفعيل يدوي مباشر</strong> من غير بوابات وسيطة
                </span>
              </li>
            </ul>

            <button
              onClick={() => void handleSubscribe("coach")}
              disabled={isLoading === "coach"}
              className="relative z-10 flex w-full items-center justify-center rounded-xl bg-white py-4 text-lg font-bold text-[var(--soft-teal)] shadow-lg shadow-white/10 transition-colors hover:bg-[var(--soft-teal)]/10"
            >
              {isLoading === "coach" ? "جاري فتح صفحة التفعيل..." : "ابدأ خطة العيادة"}
            </button>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-4 text-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            الدفع الحالي يدوي
          </div>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <div>التفعيل يتم بعد مراجعة إثبات الدفع</div>
        </div>
      </div>
    </div>
  );
}
