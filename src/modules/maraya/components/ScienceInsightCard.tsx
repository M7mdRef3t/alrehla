"use client";

import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Microscope, BookHeart } from "lucide-react";
import { BIAS_SCIENCE, MIRROR_SCIENCE, type ScienceNote, type MirrorScienceNote } from "@/data/scienceBehindBias";
import type { BiasType } from "@/services/cognitiveBiasEngine";
import type { MirrorInsightType } from "@/data/scienceBehindBias";

/**
 * 🔬 Science Insight Card — جرعة العلم
 * ======================================
 * بطاقة تظهر العلم وراء كل تحيز/تناقض يكشفه النظام.
 * تربط بين: البحث العلمي + الآية القرآنية + رسالة مبسطة.
 */

interface ScienceInsightCardProps {
  /** bias type from cognitiveBiasEngine */
  biasType?: BiasType;
  /** mirror insight type from mirrorLogic */
  mirrorType?: MirrorInsightType;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
}

export const ScienceInsightCard: FC<ScienceInsightCardProps> = ({
  biasType,
  mirrorType,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const biasData: ScienceNote | undefined = biasType ? BIAS_SCIENCE[biasType] : undefined;
  const mirrorData: MirrorScienceNote | undefined = mirrorType ? MIRROR_SCIENCE[mirrorType] : undefined;

  if (!biasData && !mirrorData) return null;

  const title = biasData?.titleAr ?? mirrorData?.titleAr ?? "";
  const titleEn = biasData?.titleEn ?? "";
  const research = biasData?.researchSummary ?? mirrorData?.researchSummary ?? "";
  const researcher = biasData?.researcher ?? mirrorData?.researcher ?? "";
  const year = biasData?.year ?? mirrorData?.year ?? 0;
  const institution = biasData?.institution ?? "";
  const ayah = biasData?.relatedAyah ?? mirrorData?.relatedAyah ?? "";
  const ayahRef = biasData?.ayahReference ?? mirrorData?.ayahReference ?? "";
  const connection = biasData?.connectionExplanation ?? "";
  const insight = biasData?.userFriendlyInsight ?? mirrorData?.userFriendlyInsight ?? "";

  return (
    <div className="w-full" dir="rtl">
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold tracking-wide"
        style={{
          background: expanded ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)",
          border: `1px solid rgba(99,102,241,${expanded ? "0.25" : "0.1"})`,
          color: "#818cf8",
        }}
      >
        <Microscope className="w-3 h-3" />
        <span>{expanded ? "إخفاء العلم" : "اعرف العلم وراء ده"}</span>
      </button>

      {/* Expandable Card */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 8 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl p-4 space-y-4"
              style={{
                background: "rgba(99,102,241,0.04)",
                border: "1px solid rgba(99,102,241,0.1)",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">{title}</h4>
                  {titleEn && (
                    <p className="text-[10px] text-indigo-400/60 font-mono mt-0.5">{titleEn}</p>
                  )}
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              {/* Research Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-indigo-400/60" />
                  <span className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest">
                    البحث العلمي
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-[1.8] font-medium">
                  {research}
                </p>
                <p className="text-[9px] text-slate-500 font-bold">
                  — {researcher} ({year}){institution ? ` • ${institution}` : ""}
                </p>
              </div>

              {/* Quranic Connection */}
              <div
                className="p-3 rounded-xl space-y-2"
                style={{
                  background: "rgba(245,166,35,0.04)",
                  borderRight: "3px solid rgba(245,166,35,0.3)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <BookHeart className="w-3 h-3 text-amber-400/60" />
                  <span className="text-[9px] font-bold text-amber-400/60 uppercase tracking-widest">
                    النص القرآني يؤكد
                  </span>
                </div>
                <p className="text-[12px] text-amber-200 font-bold leading-[2] font-amiri" style={{ fontFamily: "var(--font-amiri, serif)" }}>
                  {ayah}
                </p>
                <p className="text-[9px] text-amber-400/40 font-bold">{ayahRef}</p>
                {connection && (
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                    {connection}
                  </p>
                )}
              </div>

              {/* User Insight */}
              <div
                className="p-3 rounded-xl"
                style={{
                  background: "rgba(45,212,191,0.04)",
                  border: "1px solid rgba(45,212,191,0.08)",
                }}
              >
                <p className="text-[11px] text-teal-300 font-bold leading-relaxed">
                  💡 {insight}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScienceInsightCard;
