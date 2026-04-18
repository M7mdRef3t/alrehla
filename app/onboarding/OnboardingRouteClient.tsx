"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingFlow } from "@/modules/meta/OnboardingFlow";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import {
  captureLeadAttributionFromCurrentUrl,
  captureUtmFromCurrentUrl,
} from "../../src/services/marketingAttribution";
import { useMapState } from "@/modules/map/store/map.store";
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
             delay: Math.random() * 2,
             ease: "easeIn"
           }}
         />
       ))}
     </div>
     <motion.div 
       initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
       animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
       transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
       className="relative z-10 text-center"
     >
       <h1 className="text-2xl font-black tracking-[0.4em] text-teal-400 uppercase mb-4" dir="rtl">
         جاري تهيئة الملاذ الآمن
       </h1>
       <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
         <motion.div 
           className="h-full bg-teal-400"
           initial={{ width: "0%" }}
           animate={{ width: "100%" }}
           transition={{ duration: 1, ease: "easeInOut" }}
         />
       </div>
     </motion.div>
  </motion.div>
);

export default function OnboardingRouteClient() {
  const mirrorName = useJourneyState((s) => s.mirrorName);
  const [isWarping, setIsWarping] = useState(false);
  const [gateContext, setGateContext] = useState<GateOnboardingPayload | null>(null);

  useEffect(() => {
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();

    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const source = searchParams?.get("source");
    if (typeof window !== "undefined" && source === "gate") {
      const rawPayload = window.sessionStorage.getItem(GATE_ONBOARDING_PAYLOAD_KEY);
      if (rawPayload) {
        try {
          setGateContext(JSON.parse(rawPayload) as GateOnboardingPayload);
        } catch {
          setGateContext(null);
        }
        window.sessionStorage.removeItem(GATE_ONBOARDING_PAYLOAD_KEY);
      }
    }

    const nodesCount = useMapState.getState().nodes.length;
    const baselineCompletedAt = useJourneyState.getState().baselineCompletedAt;
    
    if (typeof window !== "undefined" && (nodesCount > 0 || baselineCompletedAt)) {
      window.location.replace("/?boot_action=start_recovery");
    }
  }, []);

  const handleComplete = useCallback((skipped = false) => {
    setIsWarping(true);

    const currentState = useJourneyState.getState();
    const name = currentState.mirrorName || "";
    const existingEmail = getStoredLeadEmail() || "";
    if (existingEmail) setStoredLeadEmail(existingEmail);

    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (existingEmail) params.set("email", existingEmail);
    if (skipped) params.set("skipped", "1");
    params.set("source", "onboarding");
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(APP_BOOT_ACTION_KEY, "navigate:map");
      window.sessionStorage.setItem("dawayir-onboarding-just-finished", "true");
    }

    const nextUrl = `/?${params.toString()}`;

    // 🎯 Optimized Cinematic transition
    // Reduced from 2200ms to allow for faster handoff while preserving the premium feel.
    setTimeout(() => {
      window.location.href = nextUrl;
    }, 1000);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isWarping && <WarpOverlay />}
      </AnimatePresence>
      
      <OnboardingFlow
        initialMirrorName={mirrorName}
        gateContext={gateContext}
        onComplete={handleComplete}
      />
    </>
  );
}
