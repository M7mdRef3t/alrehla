"use client";

import React from "react";
import { motion } from "framer-motion";

export default function RadarLoading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-12">
      {/* Radar Pulse Animation */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute h-48 w-48 rounded-full border border-primary/30"
          animate={{ scale: [1, 2], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute h-48 w-48 rounded-full border border-primary/20"
          animate={{ scale: [1, 2], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
        />
        <div className="relative h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.6)]">
          <motion.div
            className="h-2 w-2 rounded-full bg-white"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>
      </div>
      
      <div className="space-y-3 text-center">
        <h2 className="text-2xl font-bold tracking-widest text-primary uppercase font-inter">
          System Radar Active
        </h2>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-ibm-arabic text-muted-foreground">
            جاري مسح البيانات وتحليل المؤشرات..
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mock Grid Lines / Aesthetic Detail */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
  );
}
