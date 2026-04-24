"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingFlow } from "@/modules/meta/OnboardingFlow";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import {
  captureLeadAttributionFromCurrentUrl,
  captureUtmFromCurrentUrl,
} from "../../src/services/marketingAttribution";
import { useMapState } from "@/modules/map/store/map.store";
import { useAuthState } from "@/domains/auth/store/auth.store";
import { getStoredLeadEmail, setStoredLeadEmail, hasRevenueAccess } from "../../src/services/revenueAccess";

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";
const GATE_ONBOARDING_PAYLOAD_KEY = "dawayir-gate-onboarding-payload";

type GateOnboardingPayload = {
  message: string;
  source: "template" | "ai" | "offline_intervention";
  painPoint?: string | null;
  intent?: string | null;
};

const WarpOverlay = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden"
  >
     {/* Starfield simulation */}
     <div className="absolute inset-0">
       {[...Array(60)].map((_, i) => (
         <motion.div 
           key={i}
           className="absolute w-1 h-1 bg-white rounded-full"
           style={{
             left: `${Math.random() * 100}%`,
             top: `${Math.random() * 100}%`,
           }}
           animate={{
             scale: [0, 1.5, 0],
             opacity: [0, 0.8, 0],
             z: [0, 500]
           }}
           transition={{
             duration: 1.5,
             repeat: Infinity,
             delay: Math.random() * 2
           }}
         />
       ))}
     </div>
     <motion.div
       initial={{ scale: 0.8, opacity: 0 }}
       animate={{ scale: 1, opacity: 1 }}
       className="relative z-10 text-center"
     >
       <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
       <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">جاري تهيئة الرحلة...</h2>
       <p className="text-indigo-300/60 text-sm">نحن نجهز لك فضاءً خاصاً لاستكشاف ذاتك</p>
     </motion.div>
  </motion.div>
);

export default function OnboardingRouteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuthState();
  const isReady = status === "ready";
  
  const mirrorName = useJourneyState((s) => s.mirrorName);
  const baselineCompletedAt = useJourneyState((s) => s.baselineCompletedAt);
  const nodesCount = useMapState((s) => s.nodes.length);
  const isHydrated = useMapState((s) => s.isHydrated);

  const [isWarping, setIsWarping] = useState(false);
  const [gateContext, setGateContext] = useState<GateOnboardingPayload | null>(null);

  // Robust force check
  const forceOnboarding = useMemo(() => {
    return searchParams?.get("force") === "1";
  }, [searchParams]);



  useEffect(() => {
    // 1. Initial attribution capture
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();

    console.log("[Onboarding] Guard Evaluation:", {
      isReady,
      status,
      isHydrated,
      forceOnboarding,
      nodesCount,
      baselineCompletedAt
    });

    if (!isReady) return;

    // 2. Handle Unauthenticated users
    if (isReady && !user) {
      console.log("[Onboarding] Unauthenticated user. Redirecting to home.");
      window.location.replace("/");
      return;
    }

    // 3. Process Gate context
    const source = searchParams?.get("source");
    if (typeof window !== "undefined" && source === "gate") {
      const rawPayload = window.sessionStorage.getItem(GATE_ONBOARDING_PAYLOAD_KEY);
      if (rawPayload) {
        try {
          setGateContext(JSON.parse(rawPayload) as GateOnboardingPayload);
        } catch {
          setGateContext(null);
        }
      }
    }

    // 4. Hydration-aware Guard
    if (isHydrated) {
      if (!forceOnboarding && (nodesCount > 0 || !!baselineCompletedAt)) {
        console.log("[Onboarding] Guard: Data exists & force=1 is MISSING. Redirecting.");
        window.location.replace("/?boot_action=start_recovery&reason=already_onboarded");
        return;
      }
      
      console.log("[Onboarding] Access Permitted:", forceOnboarding ? "Forced Bypass" : "New User");
    }
  }, [isReady, status, searchParams, forceOnboarding, nodesCount, baselineCompletedAt, isHydrated, user]);


  const handleComplete = useCallback(() => {
    setIsWarping(true);
    // Give time for animations to breathe
    setTimeout(() => {
      window.location.assign("/?boot_action=start_recovery&source=onboarding_completion");
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
      <AnimatePresence>
        {isWarping && <WarpOverlay />}
      </AnimatePresence>

      <div className="relative z-10">
        <OnboardingFlow 
          onComplete={handleComplete}
          initialMirrorName={mirrorName || ""}
          gateContext={gateContext || undefined}
        />
      </div>

      {/* Atmospheric Background Components */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      </div>
    </div>
  );
}
