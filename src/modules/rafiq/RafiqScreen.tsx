/**
 * رفيق — Rafiq Screen
 * Smart Journey Companion: daily greeting, personalized suggestions, ecosystem radar
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRafiqState,
  TOOL_REGISTRY,
  GREETINGS,
  type Suggestion,
  type MoodTone,
} from "./store/rafiq.store";

// Cross-ecosystem reads
import { useTazkiyaState } from "@/modules/tazkiya/store/tazkiya.store";
import { useJisrState } from "@/modules/jisr/store/jisr.store";
import { useRisalaState } from "@/modules/risala/store/risala.store";
import { useKhalwaState } from "@/modules/khalwa/store/khalwa.store";
import { useWarshaState } from "@/modules/warsha/store/warsha.store";
import { useKanzState } from "@/modules/kanz/store/kanz.store";
import { useBathraState } from "@/modules/bathra/store/bathra.store";
import { useMithaqState } from "@/modules/mithaq/store/mithaq.store";
import { useQalbState } from "@/modules/qalb/store/qalb.store";
import { useAtharState } from "@/modules/athar/store/athar.store";

import {
  Compass,
  Sparkles,
  ChevronLeft,
  X,
  ArrowLeft,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*       SUGGESTION ENGINE                    */
/* ═══════════════════════════════════════════ */

function useGenerateSuggestions(): { suggestions: Suggestion[]; tone: MoodTone } {
  const tazkiyaCycles = useTazkiyaState((s) => s.cycles.length);
  const tazkiyaComplete = useTazkiyaState((s) => s.cycles.filter((c) => c.isComplete).length);
  const bridges = useJisrState((s) => s.bridges.length);
  const bridgesOpen = useJisrState((s) => s.bridges.filter((b) => !b.isComplete).length);
  const sentMessages = useRisalaState((s) => s.sentMessages.length);
  const khalwaMin = useKhalwaState((s) => s.getTotalMinutes());
  const warshaActive = useWarshaState((s) => s.activeChallenges.length);
  const warshaComplete = useWarshaState((s) => s.completedChallenges.length);
  const kanzGems = useKanzState((s) => s.gems.length);
  const seedsActive = useBathraState((s) => s.getActiveSeeds().length);
  const pledgesActive = useMithaqState((s) => s.pledges.filter((p) => p.status === "active").length);
  const qalbScore = useQalbState((s) => s.getToday()?.score ?? 0);
  const atharCount = useAtharState((s) => s.entries.length);

  return useMemo(() => {
    const suggestions: Suggestion[] = [];
    let id = 0;
    const add = (toolId: string, reason: string, priority: "high" | "medium" | "low") => {
      const tool = TOOL_REGISTRY[toolId];
      if (!tool) return;
      suggestions.push({
        id: `rfq-${id++}`,
        toolId,
        toolName: tool.name,
        emoji: tool.emoji,
        reason,
        priority,
        color: tool.color,
        dismissed: false,
      });
    };

    // High priority: things that need attention NOW
    if (bridgesOpen > 0) add("jisr", `عندك ${bridgesOpen} جسر مفتوح — أكمل خطوة الإصلاح`, "high");
    if (warshaActive > 0) add("warsha", `عندك ${warshaActive} تحدي نشط — لا تكسر السلسلة!`, "high");
    if (pledgesActive > 0) add("mithaq", `${pledgesActive} عهد نشط ينتظر الوفاء`, "high");

    // Medium: growth opportunities
    if (tazkiyaCycles === 0) add("tazkiya", "ابدأ أول دورة تزكية — اكتشف خفتك", "medium");
    if (khalwaMin < 10) add("khalwa", "جرّب 10 دقائق خلوة — السكينة تبدأ من هنا", "medium");
    if (kanzGems === 0) add("kanz", "أضف أول جوهرة لكنزك — درس أو لحظة", "medium");
    if (sentMessages === 0) add("risala", "أرسل رسالة تشجيع لمسافر — العطاء يُغني", "medium");
    if (seedsActive === 0) add("bathra", "ازرع بذرة عادة جديدة — اختر شيئاً بسيطاً", "medium");

    // Low: exploration
    if (atharCount < 5) add("athar", "تصفّح سجل أثرك — كل فعل يُحسب", "low");
    if (qalbScore < 50) add("qalb", `صحة قلبك ${qalbScore}% — اكتشف الأبعاد الضعيفة`, "medium");
    if (warshaComplete >= 3) add("shahada", "تحقق من شهاداتك — قد تكون فتحت بادج جديد!", "low");

    // Sort: high → medium → low
    const order = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => order[a.priority] - order[b.priority]);

    // Determine mood tone
    let tone: MoodTone = "warm";
    if (qalbScore >= 70) tone = "celebrate";
    else if (qalbScore >= 50) tone = "energize";
    else if (qalbScore >= 30) tone = "calm";
    else if (qalbScore > 0) tone = "comfort";

    return { suggestions: suggestions.slice(0, 6), tone };
  }, [tazkiyaCycles, tazkiyaComplete, bridges, bridgesOpen, sentMessages, khalwaMin, warshaActive, warshaComplete, kanzGems, seedsActive, pledgesActive, qalbScore, atharCount]);
}

/* ═══════════════════════════════════════════ */
/*       SUGGESTION CARD                      */
/* ═══════════════════════════════════════════ */

function SuggestionCard({ s, onGo, onDismiss }: {
  s: Suggestion;
  onGo: () => void;
  onDismiss: () => void;
}) {
  const priorityBadge = s.priority === "high" ? "🔴" : s.priority === "medium" ? "🟡" : "🟢";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -50 }}
      layout
      className="rounded-2xl p-4 relative group"
      style={{ background: `${s.color}06`, border: `1px solid ${s.color}18` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
          <span className="text-xl">{s.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[8px]">{priorityBadge}</span>
            <span className="text-xs font-black text-white">{s.toolName}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{s.reason}</p>
        </div>
        <button onClick={onDismiss}
          className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-60 transition-all text-slate-600 flex-shrink-0">
          <X className="w-3 h-3" />
        </button>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={onGo}
        className="w-full mt-3 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
        style={{ background: `${s.color}10`, border: `1px solid ${s.color}20`, color: s.color }}>
        <ArrowLeft className="w-3 h-3 rotate-180" /> افتح {s.toolName}
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function RafiqScreen() {
  const { dismissSuggestion, dismissedIds, setSuggestions, setGreeting, greeting } = useRafiqState();
  const { suggestions, tone } = useGenerateSuggestions();

  // Apply suggestions to store
  useEffect(() => {
    setSuggestions(suggestions);
  }, [suggestions]);

  // Generate daily greeting
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (greeting?.date === today) return;

    const pool = GREETINGS[tone];
    const msg = pool[Math.floor(Math.random() * pool.length)];
    const emojis: Record<MoodTone, string> = { warm: "🌅", calm: "🌿", energize: "⚡", comfort: "💛", celebrate: "🎉" };

    setGreeting({ date: today, message: msg, tone, emoji: emojis[tone] });
  }, [tone]);

  const activeSuggestions = useMemo(
    () => suggestions.filter((s) => !dismissedIds.includes(s.id)),
    [suggestions, dismissedIds]
  );

  const highCount = activeSuggestions.filter((s) => s.priority === "high").length;

  const handleGo = (toolId: string) => {
    const tool = TOOL_REGISTRY[toolId];
    if (tool) {
      window.location.hash = `#${tool.screen}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-900/15 border border-indigo-500/20">
            <Compass className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">رفيق</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">مرافقك الذكي في الرحلة</p>
          </div>
        </div>
      </motion.div>

      {/* Daily Greeting */}
      {greeting && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 mx-5 mb-5 rounded-2xl p-5 text-center"
          style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <span className="text-4xl block mb-2">{greeting.emoji}</span>
          <p className="text-sm text-white/85 font-bold leading-relaxed">{greeting.message}</p>
        </motion.div>
      )}

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "اقتراح", value: activeSuggestions.length, color: "#6366f1" },
            { label: "عاجل", value: highCount, color: "#ef4444" },
            { label: "تم تجاهله", value: dismissedIds.length, color: "#64748b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="relative z-10 px-5">
        <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-400" /> اقتراحات مخصصة لك
        </h3>

        {activeSuggestions.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">✨</span>
            <p className="text-sm text-slate-500 font-bold mb-1">لا اقتراحات الآن</p>
            <p className="text-[10px] text-slate-600">أنت في حالة ممتازة — واصل رحلتك!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {activeSuggestions.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}>
                  <SuggestionCard
                    s={s}
                    onGo={() => handleGo(s.toolId)}
                    onDismiss={() => dismissSuggestion(s.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Ecosystem Radar */}
      <div className="relative z-10 px-5 mt-6">
        <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider">🛰️ رادار المنظومة</h3>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(TOOL_REGISTRY).map(([id, tool]) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleGo(id)}
              className="rounded-xl p-3 text-center transition-all"
              style={{ background: `${tool.color}06`, border: `1px solid ${tool.color}12` }}
            >
              <span className="text-xl block mb-1">{tool.emoji}</span>
              <span className="text-[9px] font-bold block" style={{ color: tool.color }}>{tool.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🧭 رفيق — يقرأ رحلتك ويقترح الخطوة التالية دائماً
        </p>
      </motion.div>
    </div>
  );
}
