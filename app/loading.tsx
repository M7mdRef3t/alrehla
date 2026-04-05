"use client";

import React from "react";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center gap-6">
        {/* Cinematic Animated Orb */}
        <div className="relative h-24 w-24">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-primary/40"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />
          <div className="absolute inset-6 rounded-full bg-primary shadow-[0_0_20px_rgba(var(--primary),0.5)]" />
        </div>

        {/* Egyptian Slang Loading Text */}
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl font-ibm-arabic">
            استنى ثواني..
          </h2>
          <p className="text-sm text-muted-foreground font-ibm-arabic opacity-80">
            بنرتبلك الرحلة عشان تبدأ صح
          </p>
        </div>

        {/* Progress Bar (Visual Only) */}
        <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
