"use client";

import React from "react";
import { motion } from "framer-motion";

export default function OnboardingLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center space-y-8 p-4">
      <div className="relative h-20 w-20">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-t-2 border-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="h-2 w-2 rounded-full bg-primary"
            animate={{ scale: [1, 2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>
      
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-medium text-foreground font-ibm-arabic">
          بنجهزلك الرحلة..
        </h3>
        <p className="text-xs text-muted-foreground font-ibm-arabic">
          ثواني وهتكون جاهز تبدأ أول خطوة
        </p>
      </div>
    </div>
  );
}
