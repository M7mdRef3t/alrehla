import type { FC } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { SocialLinks } from "../SocialLinks";

interface LandingFooterProps {
  trustPoints: string[];
  stagger: Variants;
  onOpenLegal: (path: "/privacy" | "/terms") => void;
}

export const LandingFooter: FC<LandingFooterProps> = ({
  trustPoints,
  stagger,
  onOpenLegal
}) => (
  <motion.footer
    className="pb-10 flex flex-col items-center gap-5 text-sm"
    variants={stagger}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
  >
    <nav
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
      aria-label="روابط أساسية"
    >
      <a
        href="/stories"
        className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
      >
        قصص النجاح
      </a>
      <a
        href="/about"
        className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
      >
        عن الرحلة
      </a>
      <a
        href="/privacy"
        onClick={(e) => { e.preventDefault(); onOpenLegal("/privacy"); }}
        className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
      >
        سياسة الخصوصية
      </a>
      <a
        href="/terms"
        onClick={(e) => { e.preventDefault(); onOpenLegal("/terms"); }}
        className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2"
      >
        شروط الاستخدام
      </a>
      <a
        href="/pricing"
        className="text-amber-300/80 hover:text-amber-200 transition-colors underline underline-offset-2 font-bold"
      >
        الخطط والأسعار
      </a>
      <a
        href="https://wa.me/201023050092"
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-400 hover:text-teal-400 transition-colors underline underline-offset-2 inline-flex items-center gap-1"
      >
        تواصل معنا
        <span className="sr-only">(يفتح في نافذة جديدة)</span>
      </a>
    </nav>

    <div className="flex flex-col items-center gap-3 mb-2 bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3">
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
        ما نعد به
      </p>
      <div className="flex flex-col items-center gap-1.5">
        {trustPoints.map((point, idx) => (
          <p key={idx} className="text-sm text-slate-500 font-bold flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-teal-500/40" />
            {point}
          </p>
        ))}
      </div>
    </div>

    <SocialLinks />

    <span className="text-sm text-slate-600 font-mono tracking-widest">
      الرحلة — مساحة أوضح للعلاقات والحدود
    </span>
  </motion.footer>
);
