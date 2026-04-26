"use client";

import type { FC } from "react";
import { ArrowRight, ShieldCheck, ScrollText } from "lucide-react";
import { AlrehlaWordmark } from "./logo/AlrehlaWordmark";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { privacyCopy, termsCopy } from "@/copy/legal";

interface LegalPageProps {
  type: "privacy" | "terms";
}

export const LegalPage: FC<LegalPageProps> = ({ type }) => {
  const copy = type === "privacy" ? privacyCopy : termsCopy;
  const Icon = type === "privacy" ? ShieldCheck : ScrollText;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full overflow-x-hidden isolate relative bg-[#020617] text-slate-200"
      dir="rtl"
    >
      {/* Immersive Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-[800px] mx-auto px-6 sm:px-8 py-16 md:py-24">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <a
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-all"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            العودة للرئيسية
          </a>
        </motion.div>

        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 text-center md:text-right"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-6 text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <Icon className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight text-white">
            {copy.title}
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-slate-400 text-sm font-medium">
            <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {copy.lastUpdated}
            </span>
          </div>
        </motion.header>

        {/* Intro Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mb-16 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full" />
          <p className="relative z-10 text-xl text-slate-300 leading-relaxed font-medium">
            {copy.intro}
          </p>
        </motion.div>

        {/* Content Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-12"
        >
          {copy.sections.map((section, i) => (
            <motion.section
              key={i}
              variants={itemVariants}
              className="relative pr-8 border-r-2 border-teal-500/20 hover:border-teal-500/50 transition-colors"
            >
              <div className="absolute -right-[9px] top-1.5 w-4 h-4 rounded-full bg-[#020617] border-2 border-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                {section.heading}
              </h2>
              <p className="text-slate-400 leading-relaxed text-lg whitespace-pre-line">
                {section.body}
              </p>
            </motion.section>
          ))}
        </motion.div>

        {/* Footer Note */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-24 pt-12 border-t border-white/10 text-center"
        >
          <p className="text-teal-400 font-bold text-lg mb-2">{copy.contact}</p>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1">شكرًا لثقتك في <AlrehlaWordmark height={12} color="currentColor" />.</p>
        </motion.footer>

        <div className="h-24" />
      </div>
    </div>
  );
};

