"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";
import { applyReferralCode } from "@/services/referralEngine";
import { initAnalytics, trackLandingView } from "@/services/analytics";

/* ══════════════════════════════════════════
   صفحة الهبوط للإحالة — Referral Landing Page
   "صديقك دعاك لاكتشاف خريطة علاقاتك"
   ══════════════════════════════════════════ */

function ReferralContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // 1. Initialize Analytics to ensure Meta Pixel is loaded
    initAnalytics();
    
    const params: Record<string, string> = { content_name: "referral_landing" };
    searchParams?.forEach((value, key) => {
      if (key.startsWith('utm_') || key === 'fbclid' || key === 'ref') {
        params[key] = value;
      }
    });

    // 2. Track Landing Page View immediately for higher fidelity conversion tracking
    trackLandingView(params);

    const ref = searchParams?.get("ref");
    if (ref) {
      setRefCode(ref);
      applyReferralCode(ref);
      // Store for later sync
      try {
        localStorage.setItem("dawayir-pending-ref", ref);
      } catch { /* noop */ }
    }
  }, [searchParams]);

  const handleStart = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    
    if (refCode) params.set("ref", refCode);
    if (!params.has("utm_source")) params.set("utm_source", "referral");
    if (!params.has("utm_medium")) params.set("utm_medium", "share");
    if (!params.has("utm_campaign")) params.set("utm_campaign", "viral");
    
    router.push(`/gate?${params.toString()}`);
  };

  if (!mounted) return null;

  return (
    <main
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      dir="rtl"
      style={{
        background: "linear-gradient(160deg, #0a0a1a 0%, #1a103d 40%, #0d1117 100%)",
      }}
    >
      {/* Background Circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Outer ring */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 500, height: 500,
            border: "1px solid rgba(248,113,113,0.15)",
          }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 340, height: 340,
            border: "1px solid rgba(251,191,36,0.2)",
          }}
          animate={{ scale: [1, 1.03, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        {/* Inner ring */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 180, height: 180,
            border: "2px solid rgba(52,211,153,0.3)",
            boxShadow: "0 0 40px rgba(52,211,153,0.1)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Center dot */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
          style={{
            background: "rgba(13,148,136,0.6)",
            boxShadow: "0 0 20px rgba(13,148,136,0.4)",
          }}
        />
      </div>

      {/* Content Card */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="rounded-3xl overflow-hidden p-8 text-center"
          style={{
            background: "rgba(15,23,42,0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-bold text-violet-300 tracking-wide">دعوة خاصة</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            صديقك بدأ رحلته
            <br />
            <span className="bg-gradient-to-l from-teal-400 to-violet-400 bg-clip-text text-transparent">
              وعايزك تبدأ معاه
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-sm text-slate-400 mb-8 leading-relaxed max-w-xs mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            اكتشف خريطة علاقاتك في ٣ دقائق — افهم مين في دائرة الأمان ومين محتاج يتحرك.
          </motion.p>

          {/* Stats Preview */}
          <motion.div
            className="flex justify-center gap-6 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { emoji: "🟢", label: "أمان", color: "#34d399" },
              { emoji: "🟡", label: "حذر", color: "#fbbf24" },
              { emoji: "🔴", label: "خطر", color: "#f87171" },
            ].map(({ emoji, label, color }) => (
              <div key={label} className="text-center">
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-xs font-bold" style={{ color }}>{label}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5, #0d9488)",
              boxShadow: "0 8px 30px rgba(124,58,237,0.3)",
            }}
            whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(124,58,237,0.4)" }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <span>ابدأ رحلتك مجاناً</span>
            <span className="text-xl">🗺️</span>
          </motion.button>

          {/* Referral Code Badge */}
          {refCode && (
            <motion.div
              className="mt-4 py-2 px-4 rounded-xl inline-flex items-center gap-2"
              style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <span className="text-xs text-teal-400">🎁 كود الدعوة مُفعّل:</span>
              <span className="text-xs font-mono font-bold text-teal-300">{refCode}</span>
            </motion.div>
          )}

          {/* Trust Badge */}
          <motion.p
            className="text-[10px] text-slate-600 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            🔒 خصوصية كاملة — بدون أسماء أو بيانات شخصية
          </motion.p>
        </div>
      </motion.div>
    </main>
  );
}

export default function ReferralLandingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "#0a0a1a" }} />}>
      <ReferralContent />
    </Suspense>
  );
}
