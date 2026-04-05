"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingFlow } from "../../src/components/OnboardingFlow";
import { useJourneyState } from "../../src/state/journeyState";
import {
  captureLeadAttributionFromCurrentUrl,
  captureUtmFromCurrentUrl
} from "../../src/services/marketingAttribution";

const APP_BOOT_ACTION_KEY = "dawayir-app-boot-action";
void APP_BOOT_ACTION_KEY;

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
           transition={{ duration: 2, ease: "easeInOut" }}
         />
       </div>
     </motion.div>
  </motion.div>
);

export default function OnboardingRouteClient() {
  const mirrorName = useJourneyState((s) => s.mirrorName);
  const [isWarping, setIsWarping] = useState(false);

  useEffect(() => {
    captureUtmFromCurrentUrl();
    captureLeadAttributionFromCurrentUrl();
  }, []);

  const handleComplete = useCallback((skipped = false) => {
    setIsWarping(true);
    
    // 1. Prepare storage
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("dawayir-app-boot-action", "start_recovery");
    }
    
    const currentState = useJourneyState.getState();
    const name = currentState.mirrorName || "";
    const email = (typeof window !== "undefined" ? window.sessionStorage.getItem("dawayir-lead-email") : "") || "";
    
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (email) params.set("email", email);
    if (skipped) params.set("skipped", "1");
    
    const queryString = params.toString();
    const nextUrl = queryString ? `/?${queryString}` : "/";

    // 2. Cinematic delay
    setTimeout(() => {
      window.location.href = nextUrl;
    }, 2200);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isWarping && <WarpOverlay />}
      </AnimatePresence>
      
      <OnboardingFlow
        initialMirrorName={mirrorName}
        onComplete={handleComplete}
      />
    </>
  );
}
