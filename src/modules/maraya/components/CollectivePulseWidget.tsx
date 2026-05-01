"use client";

import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Activity, Globe, X, ChevronDown, ChevronUp } from "lucide-react";
import { getGlobalHarmony, type HarmonyPulse } from "@/services/globalPulse";

/**
 * نبض الرحلة الجماعي — Collective Pulse Widget
 * ================================================
 * يثبت للمستخدم إنه مش لوحده في الرحلة.
 * يعرض:
 * 1. عدد المسافرين النشطين الآن
 * 2. النبض الجماعي (حالة الوعي الجماعي)
 * 3. الوهم الأكثر شيوعاً اللي الناس بتحاربه
 * 4. رسالة "إنت مش لوحدك"
 */

const COMMON_ILLUSIONS = [
  { label: "مغالطة التكلفة الغارقة", fighters: 342, emoji: "⚓" },
  { label: "وهم السيطرة", fighters: 287, emoji: "🎭" },
  { label: "تحيز التأكيد", fighters: 256, emoji: "🔍" },
  { label: "تحيز التفاؤل", fighters: 198, emoji: "🌈" },
  { label: "تأثير الألفة", fighters: 176, emoji: "🔄" },
  { label: "الدعم الوهمي", fighters: 154, emoji: "🪞" },
  { label: "تحيز الوضع الراهن", fighters: 143, emoji: "⚖️" },
];

const SOLIDARITY_MESSAGES = [
  "مش لوحدك. في ناس دلوقتي بتحارب نفس المعركة.",
  "كل نفس بيتواجه مع الحقيقة — بيقرّبك من اللي زيك.",
  "الوعي مش رحلة فردية. ده موجة جماعية.",
  "في اللحظة دي، مسافرين كتير بيعملوا نفس اللي بتعمله.",
  "الشجاعة معدية. وإنت جزء من الموجة.",
];

interface CollectivePulseWidgetProps {
  onDismiss?: () => void;
}

export const CollectivePulseWidget: FC<CollectivePulseWidgetProps> = ({ onDismiss }) => {
  const [harmony, setHarmony] = useState<HarmonyPulse | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setHarmony(getGlobalHarmony());
    const id = setInterval(() => setHarmony(getGlobalHarmony()), 15000);
    return () => clearInterval(id);
  }, []);

  const todayIllusion = useMemo(() => {
    const dayIndex = new Date().getDay();
    return COMMON_ILLUSIONS[dayIndex % COMMON_ILLUSIONS.length];
  }, []);

  const solidarityMsg = useMemo(() => {
    return SOLIDARITY_MESSAGES[Math.floor(Math.random() * SOLIDARITY_MESSAGES.length)];
  }, []);

  if (!harmony || !visible) return null;

  const scorePercent = Math.round(harmony.score * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-20 right-4 z-[60] w-[280px] select-none"
        dir="rtl"
      >
        <div
          className="rounded-2xl overflow-hidden backdrop-blur-xl"
          style={{
            background: "rgba(8, 12, 22, 0.85)",
            border: `1px solid ${harmony.color}22`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${harmony.color}08`,
          }}
        >
          {/* Header */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Pulsing dot */}
              <div className="relative">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: harmony.color }}
                />
                <div
                  className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                  style={{ background: harmony.color, opacity: 0.4 }}
                />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: harmony.color }}>
                نبض الرحلة
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                ) : (
                  <ChevronUp className="w-3 h-3 text-slate-500" />
                )}
              </button>
              <button
                onClick={() => { setVisible(false); onDismiss?.(); }}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-3 h-3 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Main Stats Row */}
          <div className="px-4 pb-3 flex items-center gap-3">
            {/* Active Users */}
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" style={{ color: harmony.color }} />
              <span className="text-sm font-black text-white">{harmony.activeUsers.toLocaleString("ar-EG")}</span>
              <span className="text-[8px] text-slate-500 font-bold">مسافر</span>
            </div>

            <div className="w-px h-4 bg-white/5" />

            {/* Harmony Score */}
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" style={{ color: harmony.color }} />
              <span className="text-sm font-black" style={{ color: harmony.color }}>{scorePercent}%</span>
              <span className="text-[8px] text-slate-500 font-bold">وعي</span>
            </div>
          </div>

          {/* Solidarity Message */}
          <div className="px-4 pb-3">
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              {solidarityMsg}
            </p>
          </div>

          {/* Expanded Section */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                  {/* Today's Illusion */}
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-rose-400/60" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      أكثر وهم يُحارَب الآن
                    </span>
                  </div>
                  <div
                    className="p-3 rounded-xl flex items-center gap-3"
                    style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}
                  >
                    <span className="text-lg">{todayIllusion.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-white truncate">{todayIllusion.label}</p>
                      <p className="text-[10px] text-rose-400/60 font-bold mt-0.5">
                        {todayIllusion.fighters} مسافر بيواجهوه دلوقتي
                      </p>
                    </div>
                  </div>

                  {/* Harmony Label */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: harmony.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${scorePercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold shrink-0">{harmony.label}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CollectivePulseWidget;
