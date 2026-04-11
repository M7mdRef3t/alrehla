"use client";

import { Check, ArrowLeft, Zap, Infinity, ShieldCheck, Star } from "lucide-react";
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
  "المسار": ShieldCheck,
  "المدة": Infinity,
  "التحديثات": Zap,
};

const BENEFITS = [
  "وصول فوري لكل بوابات الملاذ الآمن",
  "خريطة علاقاتك التفاعلية كاملة",
  "بوصلة التوجيه ومسارات النمو المخصصة",
  "رفاق الطريق — الدعم، التوجيه، والمشاركة",
  "جميع التحديثات القادمة بلا أي رسوم إضافية",
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
    title: row.title === "الخطة" ? "المسار" : row.title,
    value: row.value === "العضوية التأسيسية" ? "الرفاق الأوائل" : row.value
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
            Founding Cohort — للرفاق الأوائل
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="mb-4 text-center text-4xl font-black leading-tight text-white drop-shadow-md">
            {userName ? `أهلاً بك يا ${userName}،` : "أهلاً بك يا رفيق،"}
            <br />
            <span className="bg-gradient-to-l from-teal-300 to-emerald-300 bg-clip-text text-transparent">
              الملاذ الآمن بانتظارك
            </span>
          </h1>
          <p className="mb-8 text-center text-sm leading-7 text-slate-300">
            خطوتان فقط لتوثيق التزامك بالرحلة وفتح البوابات.
            <br />
            اختار وسيلة التأكيد، وسيقوم الفريق بتهيئة مسارك خلال ساعات.
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
              تذكرة العبور للمرحلة التأسيسية
            </p>
            <p className="mt-2 text-3xl font-black text-white drop-shadow-sm">{priceLine}</p>
            <p className="mt-1 text-xs text-slate-400">
              استثمار لمرة واحدة — رفيق لرحلتك مدى الحياة، بلا قيود.
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
                مقاعد الرفاق المتاحة:{" "}
                <span className="font-black text-white">
                  {seatsLeft ?? "—"} / {totalSeats}
                </span>
              </p>
              {typeof seatsLeft === "number" && seatsLeft <= 10 && (
                <motion.span 
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/20"
                >
                  ⚡ الأماكن تنتهي
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
            بدء توثيق العهد
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </motion.button>
          <p className="mt-4 text-center text-xs text-slate-500">
            الخطوة التالية: اختار وسيلة التأكيد لحجز مقعدك
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
