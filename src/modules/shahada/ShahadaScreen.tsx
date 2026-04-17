/**
 * شهادة — Shahada Screen
 * Journey Certificates: unlock, view, and share visual badges
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useShahadaState,
  TIER_META,
  type Certificate,
  type CertificateTier,
} from "./store/shahada.store";
import { useTazkiyaState } from "@/modules/tazkiya/store/tazkiya.store";
import { useJisrState } from "@/modules/jisr/store/jisr.store";
import { useRisalaState } from "@/modules/risala/store/risala.store";
import { useKhalwaState } from "@/modules/khalwa/store/khalwa.store";
import { useBathraState } from "@/modules/bathra/store/bathra.store";
import { useMithaqState } from "@/modules/mithaq/store/mithaq.store";
import {
  Award,
  Lock,
  Sparkles,
  Trophy,
  Share2,
  ChevronLeft,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*        CERTIFICATE CARD                    */
/* ═══════════════════════════════════════════ */

function CertCard({ cert, userName, onView }: {
  cert: Certificate;
  userName: string;
  onView: () => void;
}) {
  const tierMeta = TIER_META[cert.tier];

  if (!cert.isUnlocked) {
    return (
      <div className="rounded-2xl p-4 text-center opacity-40"
        style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <Lock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
        <span className="text-3xl block mb-1 grayscale">{ cert.emoji }</span>
        <h3 className="text-xs font-bold text-slate-500">{cert.title}</h3>
        <p className="text-[9px] text-slate-600 mt-0.5">{cert.requirement}</p>
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onView}
      className="rounded-2xl p-4 text-center relative overflow-hidden group"
      style={{ background: cert.bgGradient, border: `1px solid ${cert.color}30` }}>
      {/* Glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle at center, ${tierMeta.glow}, transparent 70%)` }} />

      <div className="relative z-10">
        <span className="text-3xl block mb-1">{cert.emoji}</span>
        <h3 className="text-xs font-black text-white">{cert.title}</h3>
        <p className="text-[9px] mt-0.5" style={{ color: `${cert.color}cc` }}>{cert.subtitle}</p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <div className="w-2 h-2 rounded-full" style={{ background: tierMeta.color }} />
          <span className="text-[8px] font-bold" style={{ color: tierMeta.color }}>{tierMeta.label}</span>
        </div>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════ */
/*       FULL CERTIFICATE VIEW                */
/* ═══════════════════════════════════════════ */

function CertificateFullView({ cert, userName, onClose }: {
  cert: Certificate;
  userName: string;
  onClose: () => void;
}) {
  const tierMeta = TIER_META[cert.tier];
  const date = cert.unlockedAt ? new Date(cert.unlockedAt).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric"
  }) : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
        style={{ background: cert.bgGradient, border: `2px solid ${cert.color}40` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corners */}
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 rounded-tr-xl" style={{ borderColor: `${cert.color}30` }} />
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl" style={{ borderColor: `${cert.color}30` }} />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 rounded-br-xl" style={{ borderColor: `${cert.color}30` }} />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 rounded-bl-xl" style={{ borderColor: `${cert.color}30` }} />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${cert.color}80` }}>
            شهادة الرحلة
          </p>

          <motion.span
            className="text-6xl block"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            {cert.emoji}
          </motion.span>

          <div>
            <h2 className="text-xl font-black text-white mb-1">{cert.title}</h2>
            <p className="text-xs text-slate-400">{cert.subtitle}</p>
          </div>

          {/* Tier */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{ background: `${tierMeta.color}15`, border: `1px solid ${tierMeta.color}30` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: tierMeta.color }} />
            <span className="text-[10px] font-bold" style={{ color: tierMeta.color }}>{tierMeta.label}</span>
          </div>

          {/* Traveler name */}
          <div className="pt-2">
            <p className="text-[10px] text-slate-500">مُنحت إلى المسافر</p>
            <p className="text-base font-black text-white mt-1">{userName || "مسافر مجهول"}</p>
          </div>

          {/* Date */}
          <p className="text-[9px] text-slate-600">{date}</p>

          {/* Sparkle particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ background: cert.color, top: `${20 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}

          {/* Footer */}
          <div className="pt-4 flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/40 border border-slate-700/30">
              إغلاق
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function ShahadaScreen() {
  const {
    certificates,
    userName,
    setUserName,
    checkAndUnlock,
    getUnlocked,
    getLocked,
    getProgress,
  } = useShahadaState();

  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [showNameInput, setShowNameInput] = useState(!userName);
  const [nameInput, setNameInput] = useState(userName);

  // Gather ecosystem stats
  const tazkiyaCycles = useTazkiyaState((s) => s.cycles.filter((c) => c.isComplete).length);
  const bridgesBuilt = useJisrState((s) => s.bridges.length);
  const bottlesSent = useRisalaState((s) => s.bottlesSent);
  const messagesReceived = useRisalaState((s) => s.receivedMessages.length);
  const khalwaMinutes = useKhalwaState((s) => s.getTotalMinutes());
  const seedsPlanted = useBathraState((s) => s.seeds.length);
  const pledgesKept = useMithaqState((s) => s.pledges.filter((p) => p.status === "completed").length);

  // Check for new unlocks on mount
  useEffect(() => {
    const totalActions = tazkiyaCycles + bridgesBuilt + bottlesSent + seedsPlanted + pledgesKept;
    checkAndUnlock({
      daysActive: Math.max(1, Math.floor(totalActions / 2)), // rough estimate
      tazkiyaCycles,
      bridgesBuilt,
      bottlesSent,
      khalwaMinutes,
      seedsPlanted,
      pledgesKept,
      messagesReceived,
      productsExplored: Math.min(12, Math.ceil(totalActions / 3)),
      totalActions,
    });
  }, [tazkiyaCycles, bridgesBuilt, bottlesSent, khalwaMinutes, seedsPlanted, pledgesKept, messagesReceived]);

  const unlocked = useMemo(() => getUnlocked(), [certificates]);
  const locked = useMemo(() => getLocked(), [certificates]);
  const progress = useMemo(() => getProgress(), [certificates]);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setShowNameInput(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full top-[-10%] right-[-5%]"
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
            <p className="text-xs text-slate-500 font-medium mt-0.5">إنجازات رحلتك</p>
          </div>
        </div>
      </motion.div>

      {/* Name input */}
      {showNameInput && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 px-5 mb-5">
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
            <p className="text-xs text-slate-400 text-center">ما اسمك يا مسافر؟ (سيظهر على شهاداتك)</p>
            <div className="flex gap-2">
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                placeholder="اسمك..."
                className="flex-1 bg-slate-800/40 border border-slate-700/40 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                dir="rtl" />
              <button onClick={handleSaveName}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-900/20 border border-amber-800/30 text-amber-400">
                حفظ
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress */}
      <div className="relative z-10 px-5 mb-5">
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-bold">تقدّم الشهادات</span>
            <span className="text-sm font-black text-amber-400">{unlocked.length}/{certificates.length}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #cd7f32, #ffd700, #e879f9)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <p className="text-[9px] text-slate-600 mt-1.5 text-center">{progress}% مكتمل</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "مفتوحة", value: unlocked.length, color: "#ffd700" },
            { label: "مقفلة", value: locked.length, color: "#64748b" },
            { label: "مستوى", value: unlocked.length >= 10 ? "أسطوري" : unlocked.length >= 6 ? "ذهبي" : unlocked.length >= 3 ? "فضي" : "برونزي", color: unlocked.length >= 10 ? "#e879f9" : unlocked.length >= 6 ? "#ffd700" : unlocked.length >= 3 ? "#c0c0c0" : "#cd7f32" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div className="relative z-10 px-5 mb-5">
          <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" /> شهادات مفتوحة
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {unlocked.map((cert, i) => (
              <motion.div key={cert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <CertCard cert={cert} userName={userName} onView={() => setViewingCert(cert)} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      <div className="relative z-10 px-5">
        <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-600" /> لم تُفتح بعد
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {locked.map((cert, i) => (
            <motion.div key={cert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}>
              <CertCard cert={cert} userName={userName} onView={() => {}} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🏆 شهادة — كل إنجاز في رحلتك يُتوّج هنا
        </p>
      </motion.div>

      {/* Full View Modal */}
      <AnimatePresence>
        {viewingCert && (
          <CertificateFullView cert={viewingCert} userName={userName} onClose={() => setViewingCert(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
