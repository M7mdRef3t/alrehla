"use client";

import { Check, ArrowLeft, Zap, Infinity as InfinityIcon, ShieldCheck, Star } from "lucide-react";
import { motion } from "framer-motion";

type PricingRow = { title: string; value: string; note: string };

type StepWelcomeProps = {
  userName?: string | null;
  priceLine: string;
  pricingRows: PricingRow[];
  seatsLeft: number | null;
  totalSeats: number;
  scarcityPct: number;
  onNext: () => void;
};

const ICON_MAP: Record<string, typeof Zap> = {
  "Ø§Ù„Ù…Ø³Ø§Ø±": ShieldCheck,
  "Ø§Ù„Ù…Ø¯Ø©": InfinityIcon,
  "Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª": Zap,
};

const BENEFITS = [
  "ÙˆØµÙˆÙ„ ÙÙˆØ±ÙŠ Ù„ÙƒÙ„ Ø¨ÙˆØ§Ø¨Ø§Øª Ø§Ù„Ù…Ù„Ø§Ø° Ø§Ù„Ø¢Ù…Ù†",
  "Ø®Ø±ÙŠØ·Ø© Ø¹Ù„Ø§Ù‚Ø§ØªÙƒ Ø§Ù„ØªÙØ§Ø¹Ù„ÙŠØ© ÙƒØ§Ù…Ù„Ø©",
  "Ø¨ÙˆØµÙ„Ø© Ø§Ù„ØªÙˆØ¬ÙŠÙ‡ ÙˆÙ…Ø³Ø§Ø±Ø§Øª Ø§Ù„Ù†Ù…Ùˆ Ø§Ù„Ù…Ø®ØµØµØ©",
  "Ø±ÙØ§Ù‚ Ø§Ù„Ø·Ø±ÙŠÙ‚ â€” Ø§Ù„Ø¯Ø¹Ù…ØŒ Ø§Ù„ØªÙˆØ¬ÙŠÙ‡ØŒ ÙˆØ§Ù„Ù…Ø´Ø§Ø±ÙƒØ©",
  "Ø¬Ù…ÙŠØ¹ Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª Ø§Ù„Ù‚Ø§Ø¯Ù…Ø© Ø¨Ù„Ø§ Ø£ÙŠ Ø±Ø³ÙˆÙ… Ø¥Ø¶Ø§ÙÙŠØ©",
] as const;

export function StepWelcome({
  userName,
  priceLine,
  pricingRows,
  seatsLeft,
  totalSeats,
  scarcityPct,
  onNext,
}: StepWelcomeProps) {
  // Map traditional pricing titles to Journey philosophy if needed
  const displayRows = pricingRows.map(row => ({
    ...row,
    title: row.title === "Ø§Ù„Ø®Ø·Ø©" ? "Ø§Ù„Ù…Ø³Ø§Ø±" : row.title,
    value: row.value === "Ø§Ù„Ø¹Ø¶ÙˆÙŠØ© Ø§Ù„ØªØ£Ø³ÙŠØ³ÙŠØ©" ? "Ø§Ù„Ø±ÙØ§Ù‚ Ø§Ù„Ø£ÙˆØ§Ø¦Ù„" : row.value
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full items-center justify-center py-8"
    >
      <div className="w-full max-w-lg" dir="rtl">

        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            <Star className="h-3 w-3 fill-teal-300" />
            Founding Cohort â€” Ù„Ù„Ø±ÙØ§Ù‚ Ø§Ù„Ø£ÙˆØ§Ø¦Ù„
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="mb-4 text-center text-4xl font-black leading-tight text-white drop-shadow-md">
            {userName ? `Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ ÙŠØ§ ${userName}ØŒ` : "Ø£Ù‡Ù„Ø§Ù‹ Ø¨Ùƒ ÙŠØ§ Ø±ÙÙŠÙ‚ØŒ"}
            <br />
            <span className="bg-gradient-to-l from-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Ø§Ù„Ù…Ù„Ø§Ø° Ø§Ù„Ø¢Ù…Ù† Ø¨Ø§Ù†ØªØ¸Ø§Ø±Ùƒ
            </span>
          </h1>
          <p className="mb-8 text-center text-sm leading-7 text-slate-300">
            Ø®Ø·ÙˆØªØ§Ù† ÙÙ‚Ø· Ù„ØªÙˆØ«ÙŠÙ‚ Ø§Ù„ØªØ²Ø§Ù…Ùƒ Ø¨Ø§Ù„Ø±Ø­Ù„Ø© ÙˆÙØªØ­ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø§Øª.
            <br />
            Ø§Ø®ØªØ§Ø± ÙˆØ³ÙŠÙ„Ø© Ø§Ù„ØªØ£ÙƒÙŠØ¯ØŒ ÙˆØ³ÙŠÙ‚ÙˆÙ… Ø§Ù„ÙØ±ÙŠÙ‚ Ø¨ØªÙ‡ÙŠØ¦Ø© Ù…Ø³Ø§Ø±Ùƒ Ø®Ù„Ø§Ù„ Ø³Ø§Ø¹Ø§Øª.
          </p>
        </motion.div>

        {/* Price card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6 overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-slate-900/80 shadow-[0_0_40px_-10px_rgba(20,184,166,0.25)] backdrop-blur-md"
        >
          <div className="px-6 py-6 border-b border-white/5">
            <p className="text-xs font-black uppercase tracking-widest text-teal-400/70">
              ØªØ°ÙƒØ±Ø© Ø§Ù„Ø¹Ø¨ÙˆØ± Ù„Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªØ£Ø³ÙŠØ³ÙŠØ©
            </p>
            <p className="mt-2 text-3xl font-black text-white drop-shadow-sm">{priceLine}</p>
            <p className="mt-1 text-xs text-slate-400">
              Ø§Ø³ØªØ«Ù…Ø§Ø± Ù„Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© â€” Ø±ÙÙŠÙ‚ Ù„Ø±Ø­Ù„ØªÙƒ Ù…Ø¯Ù‰ Ø§Ù„Ø­ÙŠØ§Ø©ØŒ Ø¨Ù„Ø§ Ù‚ÙŠÙˆØ¯.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {displayRows.map((row) => {
                const Icon = ICON_MAP[row.title] ?? ShieldCheck;
                return (
                  <div
                    key={row.title}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3 transition hover:bg-slate-800/80"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white">{row.value}</p>
                      <p className="truncate text-[10px] text-slate-400">{row.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scarcity bar */}
          <div className="bg-slate-950/40 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 flex items-center gap-2">
                Ù…Ù‚Ø§Ø¹Ø¯ Ø§Ù„Ø±ÙØ§Ù‚ Ø§Ù„Ù…ØªØ§Ø­Ø©:{" "}
                <span className="font-black text-white">
                  {seatsLeft ?? "â€”"} / {totalSeats}
                </span>
              </p>
              {typeof seatsLeft === "number" && seatsLeft <= 10 && (
                <motion.span 
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/20"
                >
                  âš¡ Ø§Ù„Ø£Ù…Ø§ÙƒÙ† ØªÙ†ØªÙ‡ÙŠ
                </motion.span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, scarcityPct)}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-l from-teal-400 to-emerald-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Benefits checklist */}
        <motion.ul 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.4 }
            }
          }}
          className="mb-8 space-y-3"
        >
          {BENEFITS.map((b) => (
            <motion.li 
              key={b} 
              variants={{
                hidden: { opacity: 0, x: -10 },
                visible: { opacity: 1, x: 0 }
              }}
              className="flex items-center gap-3 text-sm text-slate-300"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 border border-teal-500/30">
                <Check className="h-3.5 w-3.5 text-teal-400" />
              </span>
              {b}
            </motion.li>
          ))}
        </motion.ul>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onNext}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-teal-500 px-8 py-4 text-base font-black text-slate-950 shadow-[0_0_32px_rgba(20,184,166,0.35)] transition-all hover:bg-teal-400 hover:shadow-[0_0_48px_rgba(20,184,166,0.45)]"
          >
            Ø¨Ø¯Ø¡ ØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø¹Ù‡Ø¯
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </motion.button>
          <p className="mt-4 text-center text-xs text-slate-500">
            Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©: Ø§Ø®ØªØ§Ø± ÙˆØ³ÙŠÙ„Ø© Ø§Ù„ØªØ£ÙƒÙŠØ¯ Ù„Ø­Ø¬Ø² Ù…Ù‚Ø¹Ø¯Ùƒ
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}


