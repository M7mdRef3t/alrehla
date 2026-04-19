/**
 * شهادة — Shahada Screen
 * Achievement Certificates & Journey Badges
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useShahadaState,
  TIER_META,
  CATEGORY_META,
  type CertTier,
  type CertCategory,
  type Certificate,
} from "./store/shahada.store";
import { X, Lock, Trophy } from "lucide-react";

/* ═══════════════════════════════════════════ */
/*         CERTIFICATE DETAIL MODAL           */
/* ═══════════════════════════════════════════ */

function CertModal({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const tier = TIER_META[cert.tier];
  const cat = CATEGORY_META[cert.category];
  const pct = cert.maxProgress > 0 ? Math.round((cert.progress / cert.maxProgress) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
        className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden"
        style={{ background: "#0a0f1f", border: `1px solid ${tier.color}25` }}
        onClick={(e) => e.stopPropagation()}>

        {/* Glow */}
        {cert.unlocked && (
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 30%, ${tier.glow}, transparent 70%)` }} />
        )}

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/40 text-slate-500 z-10">
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Badge */}
        <div className="text-center relative z-10 mb-4">
          <motion.div
            animate={cert.unlocked ? { rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-3 relative"
            style={{
              background: cert.unlocked ? `${tier.color}12` : "rgba(30,41,59,0.4)",
              border: `2px solid ${cert.unlocked ? `${tier.color}30` : "rgba(51,65,85,0.3)"}`,
              boxShadow: cert.unlocked ? `0 0 30px ${tier.glow}` : "none",
            }}>
            {cert.unlocked ? (
              <span className="text-5xl">{cert.emoji}</span>
            ) : (
              <Lock className="w-8 h-8 text-slate-600" />
            )}
          </motion.div>

          <h2 className="text-lg font-black text-white mb-1">{cert.title}</h2>
          <p className="text-[11px] text-slate-400 mb-2">{cert.description}</p>

          {/* Tier + Category */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}25` }}>
              {tier.label}
            </span>
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${cat.color}10`, color: cat.color, border: `1px solid ${cat.color}20` }}>
              {cat.emoji} {cat.label}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="relative z-10 rounded-xl p-3"
          style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(51,65,85,0.2)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-slate-500 font-bold">التقدم</span>
            <span className="text-xs font-black" style={{ color: cert.unlocked ? "#22c55e" : tier.color }}>
              {pct}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: cert.unlocked ? "#22c55e" : tier.color }} />
          </div>
          <p className="text-[8px] text-slate-600 mt-1.5">{cert.requirement} ({cert.progress}/{cert.maxProgress})</p>
        </div>

        {/* Unlock date */}
        {cert.unlocked && cert.unlockedAt && (
          <div className="text-center mt-3 relative z-10">
            <span className="text-[9px] text-green-500/70">
              ✅ تحققت في {new Date(cert.unlockedAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function ShahadaScreen() {
  const { certificates, getTotalUnlocked, getCompletionPct } = useShahadaState();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [filter, setFilter] = useState<CertCategory | CertTier | "all" | "unlocked">("all");

  const totalUnlocked = useMemo(() => getTotalUnlocked(), [getTotalUnlocked]);
  const completionPct = useMemo(() => getCompletionPct(), [getCompletionPct]);
  const totalCerts = certificates.length;

  const filtered = useMemo(() => {
    if (filter === "all") return certificates;
    if (filter === "unlocked") return certificates.filter((c) => c.unlocked);
    if (filter in TIER_META) return certificates.filter((c) => c.tier === filter);
    if (filter in CATEGORY_META) return certificates.filter((c) => c.category === filter);
    return certificates;
  }, [certificates, filter]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: "radial-gradient(circle, rgba(255,215,0,0.05), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-900/15 border border-amber-500/20">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">شهادة</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">إنجازات رحلتك وشهاداتك</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "مُحققة", value: totalUnlocked, color: "#22c55e" },
            { label: "المجموع", value: totalCerts, color: "#6366f1" },
            { label: "الإتمام", value: `${completionPct}%`, color: "#ffd700" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Overall progress */}
        <div className="mt-3 rounded-xl p-3"
          style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-slate-500 font-bold">تقدم الرحلة الكلي</span>
            <span className="text-xs font-black text-amber-400">{completionPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #ffd700, #f59e0b)" }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="relative z-10 px-5 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { key: "all", label: "الكل" },
            { key: "unlocked", label: "✅ محققة" },
            ...Object.entries(TIER_META).map(([k, v]) => ({ key: k, label: `${v.label}` })),
            ...Object.entries(CATEGORY_META).map(([k, v]) => ({ key: k, label: `${v.emoji} ${v.label}` })),
          ].map(({ key, label }) => {
            const active = filter === key;
            const color = key in TIER_META ? TIER_META[key as CertTier].color
              : key in CATEGORY_META ? CATEGORY_META[key as CertCategory].color
              : "#6366f1";
            return (
              <button key={key} onClick={() => setFilter(key as any)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${color}15` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? `${color}30` : "rgba(51,65,85,0.3)"}`,
                  color: active ? color : "#64748b",
                }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="relative z-10 px-5 grid grid-cols-2 gap-2.5">
        {filtered.map((cert, idx) => {
          const tier = TIER_META[cert.tier];
          const pct = cert.maxProgress > 0 ? Math.round((cert.progress / cert.maxProgress) * 100) : 0;

          return (
            <motion.button key={cert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => setSelectedCert(cert)}
              className="rounded-xl p-3 text-center relative overflow-hidden group transition-all active:scale-[0.97]"
              style={{
                background: cert.unlocked ? `${tier.color}04` : "rgba(15,23,42,0.4)",
                border: `1px solid ${cert.unlocked ? `${tier.color}15` : "rgba(51,65,85,0.2)"}`,
              }}>

              {/* Glow for unlocked */}
              {cert.unlocked && (
                <div className="absolute inset-0 pointer-events-none opacity-50"
                  style={{ background: `radial-gradient(circle at 50% 20%, ${tier.glow}, transparent 70%)` }} />
              )}

              {/* Badge */}
              <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-2 relative z-10"
                style={{
                  background: cert.unlocked ? `${tier.color}10` : "rgba(30,41,59,0.4)",
                  border: `1.5px solid ${cert.unlocked ? `${tier.color}25` : "rgba(51,65,85,0.3)"}`,
                }}>
                {cert.unlocked ? (
                  <span className="text-3xl">{cert.emoji}</span>
                ) : (
                  <Lock className="w-5 h-5 text-slate-600" />
                )}
              </div>

              {/* Title */}
              <p className="text-[11px] font-bold text-white truncate relative z-10 mb-0.5">{cert.title}</p>

              {/* Tier */}
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full inline-block relative z-10"
                style={{ background: `${tier.color}12`, color: tier.color }}>
                {tier.label}
              </span>

              {/* Progress bar */}
              {!cert.unlocked && (
                <div className="w-full h-1 mt-2 rounded-full bg-slate-800 overflow-hidden relative z-10">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: tier.color }} />
                </div>
              )}

              {/* Checkmark */}
              {cert.unlocked && (
                <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-[8px]">✅</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="relative z-10 mx-5 rounded-2xl p-8 text-center mt-4"
          style={{ background: "rgba(255,215,0,0.03)", border: "1px dashed rgba(255,215,0,0.15)" }}>
          <span className="text-4xl block mb-3">🏆</span>
          <p className="text-sm text-white/80 font-bold mb-1">لا شهادات في هذا التصنيف</p>
          <p className="text-[10px] text-slate-500">جرّب فلتر آخر لاستعراض شهاداتك</p>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🏅 شهادة — كل إنجاز في رحلتك يُسجّل ويُحتفل به — استمر في النمو
        </p>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCert && <CertModal cert={selectedCert} onClose={() => setSelectedCert(null)} />}
      </AnimatePresence>
    </div>
  );
}
