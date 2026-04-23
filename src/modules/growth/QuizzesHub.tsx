'use client';

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Zap as Sparkles, TrendingUp, Clock, Lightbulb, Star, Search, X, Flame } from "lucide-react";

/* ══════════════════════════════════════════
   Quiz Metadata (tags / time / difficulty)
   ══════════════════════════════════════════ */

type QuizTag = "علاقات" | "ذات" | "شريك" | "حدود" | "عاطفي";
type QuizDifficulty = "سهل" | "متوسط" | "متعمق";

interface QuizMeta {
  durationMin: number;
  difficulty: QuizDifficulty;
  tags: QuizTag[];
  popularity: number; // 0-100 — drives badge
}

const QUIZ_META: Record<string, QuizMeta> = {
  attachment:     { durationMin: 6,  difficulty: "متوسط",  tags: ["ذات", "علاقات"], popularity: 91 },
  boundaries:     { durationMin: 5,  difficulty: "سهل",    tags: ["ذات", "حدود"],   popularity: 78 },
  codependency:   { durationMin: 7,  difficulty: "متعمق",  tags: ["شريك", "عاطفي"], popularity: 85 },
  quality:        { durationMin: 5,  difficulty: "سهل",    tags: ["علاقات", "شريك"], popularity: 70 },
  eq:             { durationMin: 7,  difficulty: "متوسط",  tags: ["ذات", "عاطفي"],  popularity: 88 },
  social:         { durationMin: 6,  difficulty: "سهل",    tags: ["علاقات", "ذات"],  popularity: 72 },
  communication:  { durationMin: 6,  difficulty: "متوسط",  tags: ["شريك", "علاقات"], popularity: 80 },
};

const DIFFICULTY_COLORS: Record<QuizDifficulty, string> = {
  سهل:   "#34D399",
  متوسط: "#FBBF24",
  متعمق: "#F87171",
};

const ALL_TAGS: QuizTag[] = ["علاقات", "ذات", "شريك", "حدود", "عاطفي"];
import { QUIZZES, type QuizDef, type QuizResultBand } from "@/data/quizData";
import { useQuizHistory, type QuizHistoryEntry } from "@/hooks/useQuizHistory";
import { useQuizStats } from "@/hooks/useQuizStats";
import { useDailyPulse } from "@/hooks/useDailyPulse";
import { useMapState } from '@/modules/map/dawayirIndex';
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { ComprehensiveAnalysis } from '@/modules/exploration/ComprehensiveAnalysis';
import { CouplesCommunity } from "./CouplesCommunity";
import { trackingService } from "@/domains/journey";

/* ══════════════════════════════════════════
   Daily Tips (rotate by day index)
   ══════════════════════════════════════════ */

const DAILY_TIPS = [
  "قبل ما ترد على حد بغضب، خد نفس عميق وسأل نفسك: 'هل ردي ده هيحل المشكلة أم هيكبّرها؟'",
  "الحد الصحي مش رفض للآخر — هو احترام لنفسك. قول 'لا' من غير ذنب.",
  "علاقة صحية مش بالضرورة علاقة سهلة — لكنها علاقة آمنة.",
  "أول خطوة في التعافي هي الوعي. وأنت طالما وصلت لهنا، بدأت فعلاً.",
  "استنزافك للآخرين مش معناه إنك ضعيف — معناه إنك بشر.",
  "الوعي الذاتي مش فاشية على النفس — هو فضول حقيقي تجاه مشاعرك.",
  "لما حد يتخطى حدودك وانت ماسكتش، بتعلّمه إن ده مقبول.",
  "مش كل جرح من حياتك من مسؤوليتك — لكن شفاؤك مسؤوليتك.",
  "التفاعل العاطفي الصحي مش إنك ما تتجاوبش — هو إنك تتجاوب بوعي.",
  "برقبتك مش مدار الكون. سيبها تلف من غيرك.",
];

function getDailyTip(): string {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return DAILY_TIPS[dayIndex % DAILY_TIPS.length];
}

/* ══════════════════════════════════════════
   Personal Growth calculation from map data
   ══════════════════════════════════════════ */

function usePersonalGrowth() {
  const nodes = useMapState((s) => s.nodes);
  return useMemo(() => {
    const active = nodes.filter((n) => !n.isNodeArchived);
    if (active.length === 0) return { awareness: 0, emotional: 0, interaction: 0 };

    // وعي ذاتي: % of people with analysis done
    const analyzed = active.filter((n) => n.analysis).length;
    const awareness = Math.round((analyzed / active.length) * 100);

    // ذكاء عاطفي: avg recovery step completion
    const maxSteps = active.length * 8;
    const totalSteps = active.reduce((s, n) => s + (n.recoveryProgress?.completedSteps?.length ?? 0), 0);
    const emotional = maxSteps === 0 ? 0 : Math.min(100, Math.round((totalSteps / maxSteps) * 100));

    // تفاعل: % of people with notes or situation logs
    const interacted = active.filter((n) =>
      (n.notes?.length ?? 0) > 0 || (n.recoveryProgress?.situationLogs?.length ?? 0) > 0
    ).length;
    const interaction = Math.round((interacted / active.length) * 100);

    return { awareness, emotional, interaction };
  }, [nodes]);
}

/* ══════════════════════════════════════════
   PDF / Text Export Helper
   ══════════════════════════════════════════ */

function exportQuizReport(history: QuizHistoryEntry[]) {
  const byQuiz = new Map<string, QuizHistoryEntry>();
  for (const entry of history) {
    if (!byQuiz.has(entry.quizId)) byQuiz.set(entry.quizId, entry);
  }

  const rows = Array.from(byQuiz.values()).map((e) => {
    const pct = Math.round((e.score / e.maxScore) * 100);
    const date = new Date(e.timestamp).toLocaleDateString("ar-EG");
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #1e293b;font-weight:700;color:#e2e8f0">${e.quizTitle}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e293b"><span style="background:${e.bandColor}22;color:${e.bandColor};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700">${e.bandTitle}</span></td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e293b;color:#94a3b8">${pct}%</td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e293b;color:#475569;font-size:11px">${date}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0631\u062D\u0644\u0629</title>
    <style>@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap");
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:"Tajawal","29LT Bukra","IBM Plex Sans Arabic",sans-serif;background:#080b15;color:#e2e8f0;padding:40px}
    @media print{body{background:#fff;color:#0f172a}table{border:1px solid #e2e8f0}td{border-bottom-color:#e2e8f0!important;color:#0f172a!important}
    h1,h2{color:#0f172a}}</style></head><body>
    <div style="max-width:640px;margin:0 auto">
    <div style="text-align:center;margin-bottom:32px"><h1 style="font-size:24px;font-weight:800;margin-bottom:4px">\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631\u0627\u062A \u0627\u0644\u0634\u0627\u0645\u0644</h1>
    <p style="font-size:12px;color:#475569">\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u062D\u0644\u0629 \u00B7 ${new Date().toLocaleDateString("ar-EG")}</p></div>
    <table style="width:100%;border-collapse:collapse;border-radius:16px;overflow:hidden;background:rgba(255,255,255,0.03)">
    <thead><tr style="background:rgba(167,139,250,0.08)">
    <th style="padding:12px 16px;text-align:right;font-size:11px;color:#A78BFA;font-weight:700">\u0627\u0644\u0627\u062E\u062A\u0628\u0627\u0631</th>
    <th style="padding:12px 16px;text-align:right;font-size:11px;color:#A78BFA;font-weight:700">\u0627\u0644\u0646\u062A\u064A\u062C\u0629</th>
    <th style="padding:12px 16px;text-align:right;font-size:11px;color:#A78BFA;font-weight:700">%</th>
    <th style="padding:12px 16px;text-align:right;font-size:11px;color:#A78BFA;font-weight:700">\u0627\u0644\u062A\u0627\u0631\u064A\u062E</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <p style="text-align:center;margin-top:24px;font-size:10px;color:#334155">\u0647\u0630\u0627 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0644\u0644\u062A\u0648\u0639\u064A\u0629 \u0627\u0644\u0630\u0627\u062A\u064A\u0629 \u0648\u0644\u064A\u0633 \u0628\u062F\u064A\u0644\u0627\u064B \u0639\u0646 \u0627\u0644\u0627\u0633\u062A\u0634\u0627\u0631\u0629 \u0627\u0644\u0645\u062A\u062E\u0635\u0635\u0629.</p>
    </div></body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  }
}

/* ══════════════════════════════════════════
   Streak Badge
   ══════════════════════════════════════════ */

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "linear-gradient(135deg, #F97316, #EA580C)",
        padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, color: "#fff",
      }}
    >
      <Flame size={11} />
      {streak} يوم متوالية
    </motion.div>
  );
}


/* ══════════════════════════════════════════
   Quiz Reminders Card
   ══════════════════════════════════════════ */

function QuizRemindersCard({ reminders, onStart }: {
  reminders: Array<{ quizId: string; title: string; emoji: string }>;
  onStart: (id: string) => void;
}) {
  if (reminders.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(135deg, rgba(248,113,113,0.07), rgba(248,113,113,0.03))",
        border: "1px solid rgba(248,113,113,0.18)",
        borderRadius: 16, padding: "14px 16px", marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 13 }}>💤</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#F87171" }}>لم تكملها بعد</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {reminders.map((r) => (
          <button key={r.quizId} onClick={() => onStart(r.quizId)} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "8px 10px", cursor: "pointer", textAlign: "right",
          }}>
            <span style={{ fontSize: 16 }}>{r.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{r.title}</span>
            <span style={{ marginRight: "auto", fontSize: 9, color: "#F87171", fontWeight: 700 }}>ابدأ ←</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Partner Invite Card
   ══════════════════════════════════════════ */

function PartnerInviteCard() {
  const [copied, setCopied] = useState(false);
  const inviteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?screen=quizzes`
    : "alrehla.app/quizzes";

  const handleCopy = () => {
    const text = `🧠 جرب معي اختبارات العلاقات على منصة الرحلة ✨\n${inviteUrl}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(244,114,182,0.05))",
        border: "1px solid rgba(167,139,250,0.2)",
        borderRadius: 16, padding: "14px 16px", marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 15 }}>💑</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#A78BFA" }}>ادعو شريكك</span>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
        شارك الاختبارات مع شريك حياتك وقارنوا النتائج معاً.
      </p>
      <button onClick={handleCopy} style={{
        width: "100%", padding: "9px", borderRadius: 10,
        background: copied ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.1)",
        border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(167,139,250,0.25)"}`,
        color: copied ? "#34D399" : "#A78BFA",
        fontSize: 11, fontWeight: 700, cursor: "pointer",
        transition: "all 0.2s",
      }}>
        {copied ? "✓ تم النسخ" : "🔗 انسخ رابط الدعوة"}
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Hub First-Open Onboarding Modal
   ══════════════════════════════════════════ */

const HUB_ONBOARDED_KEY = "alrehla_hub_onboarded_v1";

function HubFirstOpenModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(8,11,21,0.92)", backdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 28 }}
        style={{
          background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(244,114,182,0.07))",
          border: "1px solid rgba(167,139,250,0.3)",
          borderRadius: 28, padding: "32px 28px",
          maxWidth: 380, width: "100%", textAlign: "center", position: "relative",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(167,139,250,0.1)",
        }}
      >
        {/* Animated glow orb */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)",
            width: 80, height: 80, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.4), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ fontSize: 52, marginBottom: 12 }}>🧠</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#e2e8f0" }}>
          مرحباً في مركز الوعي
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
          7 اختبارات مصمّمة لكشف أنماطك العلائقية — بدقة وبدون أحكام.
          نتائجك تُبنى تدريجياً مع كل اختبار.
        </p>

        {/* Quiz preview list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
          {[
            { e: "🔗", t: "نمط التعلق" }, { e: "❤️", t: "الذكاء العاطفي" },
            { e: "🧩", t: "التوافق الاجتماعي" }, { e: "💬", t: "التواصل" },
          ].map((q, i) => (
            <motion.div
              key={q.t}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                background: "rgba(255,255,255,0.03)", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.05)", textAlign: "right",
              }}
            >
              <span style={{ fontSize: 16 }}>{q.e}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{q.t}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{
            width: "100%", padding: "13px", borderRadius: 16, border: "none",
            background: "linear-gradient(135deg, #A78BFA, #F472B6)",
            color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(167,139,250,0.35)",
          }}
        >
          ابدأ رحلة الوعي 🚀
        </motion.button>
        <p style={{ margin: "10px 0 0", fontSize: 9, color: "#334155" }}>
          نتائجك خاصة تماماً — لا تُشارك مع أحد بدون إذنك
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Attachment Node Picker
   ══════════════════════════════════════════ */

function AttachmentNodePicker({
  band: _band, onLink, onSkip,
}: {
  band: { title: string; color: string };
  onLink: (nodeId: string) => void;
  onSkip: () => void;
}) {
  const nodes = useMapState((s) => s.nodes);
  const selectableNodes = useMemo(
    () => nodes.filter((node) => !node.isNodeArchived && !node.isDetached),
    [nodes]
  );

  if (selectableNodes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 16, padding: "14px 16px",
        background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(244,114,182,0.05))",
        border: "1px solid rgba(167,139,250,0.22)",
        borderRadius: 18,
      }}
    >
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#A78BFA" }}>
        🔗 ربط نتيجة الاختبار بشخص في خريطتك
      </p>
      <p style={{ margin: "0 0 10px", fontSize: 10, color: "#475569", lineHeight: 1.6 }}>
        اختر الشخص الذي تصف هذه النتيجة طريقة تعلقك معه وستظهر على بطاقته.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {selectableNodes.slice(0, 5).map((n) => (
          <motion.button
            key={n.id}
            onClick={() => onLink(n.id)}
            whileHover={{ backgroundColor: "rgba(167,139,250,0.12)" }}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "8px 12px", cursor: "pointer", textAlign: "right",
              color: "#94a3b8", fontSize: 11, fontWeight: 600,
            }}
          >
            <span style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(139,92,246,0.1))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>{n.label[0]}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            <span style={{
              fontSize: 8, fontWeight: 700,
              background: n.ring === "red" ? "rgba(248,113,113,0.12)" : n.ring === "yellow" ? "rgba(251,191,36,0.12)" : "rgba(52,211,153,0.12)",
              color: n.ring === "red" ? "#F87171" : n.ring === "yellow" ? "#FBBF24" : "#34D399",
              padding: "2px 8px", borderRadius: 8,
            }}>
              {n.ring === "red" ? "أحمر" : n.ring === "yellow" ? "أصفر" : "أخضر"}
            </span>
          </motion.button>
        ))}
      </div>
      <button onClick={onSkip} style={{
        background: "none", border: "none", color: "#334155",
        fontSize: 10, cursor: "pointer", width: "100%",
      }}>
        تجاوز الربط الآن
      </button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Partner Invite Card
   ══════════════════════════════════════════ */

function PartnerInviteSection({ quizTitle, bandTitle, score, maxScore }: {
  quizTitle: string; bandTitle: string; score: number; maxScore: number;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = [
    `🌍 أكملت اختبار "${quizTitle}" على منصة الرحلة`,
    `📊 نتيجتي: ${bandTitle} (${Math.round((score / maxScore) * 100)}%)`,
    ``,
    `🤝 جرّب أنت كمان وقارن نتائجنا:`,
    `https://alrehla.app/quizzes`,
  ].join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 16, padding: "16px 18px",
        background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(167,139,250,0.06))",
        border: "1px solid rgba(20,184,166,0.2)",
        borderRadius: 18,
      }}
    >
      <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#14B8A6" }}>
        💑 شارك شريكك — قارنوا نتائجكم
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 10, color: "#475569", lineHeight: 1.6 }}>
        ارسل دعوة لشريكك ليكمل نفس الاختبار وتقارنوا أنماطكم العلائقية.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <motion.button
          onClick={handleWhatsApp} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{
            flex: 1, padding: "10px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          💬 WhatsApp
        </motion.button>
        <motion.button
          onClick={handleCopy} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          style={{
            flex: 1, padding: "10px", borderRadius: 12,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: copied ? "#14B8A6" : "#94a3b8", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}
        >
          {copied ? "✅ تم النسخ" : "📋 نسخ الدعوة"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Weekly Digest Card
   ══════════════════════════════════════════ */

function WeeklyDigestCard({ history }: { history: QuizHistoryEntry[] }) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = history.filter((h) => h.timestamp >= weekAgo);
  if (thisWeek.length === 0) return null;

  const uniqueQuizzes = new Set(thisWeek.map((h) => h.quizId)).size;
  const avgScore = Math.round(thisWeek.reduce((s, h) => s + (h.score / h.maxScore) * 100, 0) / thisWeek.length);

  // Dominant band from this week
  const bandCounts = new Map<string, { count: number; color: string }>();
  thisWeek.forEach((h) => {
    const prev = bandCounts.get(h.bandTitle) || { count: 0, color: h.bandColor };
    bandCounts.set(h.bandTitle, { count: prev.count + 1, color: h.bandColor });
  });
  const dominant = Array.from(bandCounts.entries()).sort((a, b) => b[1].count - a[1].count)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(135deg, rgba(56,189,248,0.08), rgba(167,139,250,0.06))",
        border: "1px solid rgba(56,189,248,0.2)",
        borderRadius: 18, padding: "16px 18px", marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>📊</div>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>ملخص الأسبوع</p>
          <p style={{ margin: 0, fontSize: 9, color: "#475569" }}>آخر 7 أيام</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#38BDF8" }}>{thisWeek.length}</p>
          <p style={{ margin: 0, fontSize: 9, color: "#475569" }}>اختبار</p>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#A78BFA" }}>{uniqueQuizzes}</p>
          <p style={{ margin: 0, fontSize: 9, color: "#475569" }}>نوع مختلف</p>
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#34D399" }}>{avgScore}%</p>
          <p style={{ margin: 0, fontSize: 9, color: "#475569" }}>متوسط</p>
        </div>
      </div>
      {dominant && (
        <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>
          النمط السائد: <span style={{ color: dominant[1].color, fontWeight: 700 }}>{dominant[0]}</span>
        </p>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Screenshot-Ready Result Card
   ══════════════════════════════════════════ */

function ScreenshotResultCard({
  quiz, score, band, onClose,
}: {
  quiz: { title: string; emoji: string };
  score: number;
  band: { title: string; description: string; color: string; emoji: string };
  onClose: () => void;
}) {
  const percent = Math.round((score / 24) * 100);
  const circ = 2 * Math.PI * 44;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9100,
        background: "rgba(8,11,21,0.96)", backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, flexDirection: "column", gap: 16,
      }}
      onClick={onClose}
    >
      {/* Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(145deg, rgba(8,11,21,0.98), rgba(20,27,50,0.98))`,
          border: `1px solid ${band.color}40`,
          borderRadius: 32, padding: "36px 28px",
          maxWidth: 340, width: "100%", textAlign: "center",
          boxShadow: `0 0 80px ${band.color}20, 0 40px 80px rgba(0,0,0,0.6)`,
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Background gradient blob */}
        <div style={{
          position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
          width: 200, height: 200,
          background: `radial-gradient(circle, ${band.color}15, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Platform watermark */}
        <div style={{
          position: "absolute", top: 14, right: 16,
          fontSize: 8, color: "rgba(255,255,255,0.15)", fontWeight: 700, letterSpacing: 1,
        }}>الرحلة · ALREHLA</div>

        {/* Score ring */}
        <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 16px", display: "inline-block" }}>
          <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={50} cy={50} r={44} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
            <motion.circle
              cx={50} cy={50} r={44} fill="none"
              stroke={band.color} strokeWidth={6} strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - percent / 100) }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 8px ${band.color}80)` }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
            <span style={{ fontSize: 24 }}>{band.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: band.color }}>{percent}%</span>
          </div>
        </div>

        {/* Quiz title */}
        <p style={{ margin: "0 0 4px", fontSize: 10, color: "#475569", fontWeight: 700 }}>
          {quiz.emoji} {quiz.title}
        </p>

        {/* Band title */}
        <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 900, color: "#e2e8f0" }}>
          {band.title}
        </h2>

        {/* Band description */}
        <p style={{ margin: "0 0 20px", fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
          {band.description}
        </p>

        {/* Decorative dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i === 1 ? band.color : `${band.color}40`,
            }} />
          ))}
        </div>

        {/* Score text */}
        <p style={{ margin: 0, fontSize: 9, color: "#334155" }}>
          {score} / 24 نقطة · منصة الرحلة للنمو العلائقي
        </p>
      </motion.div>

      {/* Instructions */}
      <p style={{ fontSize: 11, color: "#475569", textAlign: "center" }}>
        📸 اضغط طويلاً أو صوّر الشاشة لمشاركة نتيجتك
      </p>
      <button onClick={onClose} style={{
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12, padding: "10px 28px", color: "#94a3b8",
        fontSize: 13, cursor: "pointer",
      }}>إغلاق</button>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */

type QuizView =
  | { view: "hub" }
  | { view: "comprehensive" }
  | { view: "community" }
  | { view: "partner-compare"; shareCode: string }
  | { view: "quiz"; quizId: string; step: number; answers: number[] }
  | { view: "result"; quizId: string; score: number; band: QuizResultBand };

/* ══════════════════════════════════════════
   Progress Bar
   ══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   Growth Radar Chart
   ══════════════════════════════════════════ */

function GrowthRadar({ awareness, emotional, interaction }: {
  awareness: number; emotional: number; interaction: number;
}) {
  const SIZE = 120;
  const CX = SIZE / 2, CY = SIZE / 2;
  const R = 46;
  const axes = [
    { label: "وعي ذاتي", color: "#38BDF8",  angle: -90,              value: awareness },
    { label: "ذكاء عاطفي", color: "#A78BFA", angle: -90 + 120,      value: emotional },
    { label: "تفاعل",      color: "#34D399", angle: -90 + 240,      value: interaction },
  ];

  const pt = (angleDeg: number, pct: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    const r = (pct / 100) * R;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  };

  const polygon = axes
    .map((a) => { const p = pt(a.angle, a.value); return `${p.x},${p.y}`; })
    .join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Grid rings */}
        {[25, 50, 75, 100].map((pct) => {
          const ring = axes.map((a) => { const p = pt(a.angle, pct); return `${p.x},${p.y}`; }).join(" ");
          return <polygon key={pct} points={ring} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} />;
        })}
        {/* Axis lines */}
        {axes.map((a, i) => {
          const end = pt(a.angle, 100);
          return <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y}
            stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />;
        })}
        {/* Data polygon */}
        <motion.polygon points={polygon}
          fill="rgba(20,184,166,0.12)" stroke="#14B8A6" strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: `${CX}px ${CY}px` }} />
        {/* Dots */}
        {axes.map((a, i) => {
          const p = pt(a.angle, a.value);
          return <circle key={i} cx={p.x} cy={p.y} r={3}
            fill={a.color} stroke="#080b15" strokeWidth={1.5} />;
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {axes.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.color }} />
            <span style={{ fontSize: 9, color: "#64748b" }}>{a.label}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: a.color }}>{a.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Result Comparison — score evolution graph
   ══════════════════════════════════════════ */

function ResultComparisonGraph({ attempts, color }: {
  attempts: QuizHistoryEntry[];
  color: string;
}) {
  if (attempts.length < 2) return null;
  const MAX = 100;
  const W = 200, H = 60;
  const pts = [...attempts].reverse(); // oldest first
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * W);
  const ys = pts.map((e) => H - (Math.round((e.score / e.maxScore) * 100) / MAX) * H);
  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: `${color}08`, border: `1px solid ${color}20`,
        borderRadius: 14, padding: "12px 14px", marginTop: 12,
      }}
    >
      <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>
        📈 تطور نتيجتك ({attempts.length} محاولات)
      </p>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polyline points={polyline} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={ys[i]} r={3} fill={color} stroke="#080b15" strokeWidth={1.5} />
            <text x={x} y={H} dy={-2} textAnchor="middle"
              fontSize={7} fill="#475569">
              {Math.round((pts[i].score / pts[i].maxScore) * 100)}%
            </text>
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {pts.map((e, i) => {
          const d = Math.floor((Date.now() - e.timestamp) / (1000 * 60 * 60 * 24));
          return <span key={i} style={{ fontSize: 7, color: "#334155" }}>{d === 0 ? "اليوم" : d === 1 ? "أمس" : `${d}ي`}</span>;
        })}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Quiz Recommendation
   ══════════════════════════════════════════ */

const RECOMMENDATION_MAP: Record<string, { suggest: string; reason: string }> = {
  attachment:    { suggest: "communication", reason: "نمط تعلقك يؤثر على طريقة تواصلك — اكتشف كيف" },
  boundaries:    { suggest: "codependency",  reason: "الحدود والتبعية وجهان لعملة واحدة" },
  codependency:  { suggest: "eq",            reason: "الذكاء العاطفي يساعدك تفصل بين مشاعرك ومشاعر الآخرين" },
  quality:       { suggest: "social",        reason: "جودة العلاقة الواحدة تنعكس على دائرتك كلها" },
  eq:            { suggest: "attachment",    reason: "الذكاء العاطفي ومفهوم التعلق يكملان بعض" },
  social:        { suggest: "communication", reason: "التوافق الاجتماعي يعتمد على جودة تواصلك" },
  communication: { suggest: "eq",            reason: "التواصل العميق يبدأ بالذكاء العاطفي" },
};

function QuizRecommendationCard({ lastCompletedId, onStart }: {
  lastCompletedId: string | null;
  onStart: (id: string) => void;
}) {
  if (!lastCompletedId) return null;
  const rec = RECOMMENDATION_MAP[lastCompletedId];
  if (!rec) return null;
  const quiz = QUIZZES.find((q) => q.id === rec.suggest);
  if (!quiz) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      style={{
        background: `linear-gradient(135deg, ${quiz.color}10, ${quiz.color}05)`,
        border: `1px solid ${quiz.color}25`,
        borderRadius: 18, padding: "14px 16px", marginBottom: 14,
      }}
    >
      <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: "#475569", letterSpacing: 1 }}>
        💡 مُوصى به لك
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 26 }}>{quiz.emoji}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>
            {quiz.title.replace("اختبار ", "").replace("مقياس ", "")}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>{rec.reason}</p>
        </div>
        <button
          onClick={() => onStart(quiz.id)}
          style={{
            background: quiz.color, border: "none",
            borderRadius: 10, padding: "6px 14px",
            color: "#0a0d18", fontSize: 11, fontWeight: 800, cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >ابدأ ←</button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Share Result Card (screenshot-ready modal)
   ══════════════════════════════════════════ */

function ShareResultCard({ quiz, score, band, onClose }: {
  quiz: QuizDef; score: number; band: QuizResultBand; onClose: () => void;
}) {
  const pct = Math.round((score / (quiz.questions.length * 3)) * 100);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: 24,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 300, background: "linear-gradient(135deg, #0d1426, #12183a)",
            border: `2px solid ${band.color}40`, borderRadius: 28, padding: "28px 24px",
            textAlign: "center", boxShadow: `0 0 60px ${band.color}20`,
          }}
        >
          {/* Brand */}
          <p style={{ margin: "0 0 16px", fontSize: 11, color: "#334155", letterSpacing: 2, fontWeight: 700 }}>
            ✦ الرحلة
          </p>
          {/* Emoji + score */}
          <div style={{ fontSize: 52, marginBottom: 8 }}>{band.emoji}</div>
          <div style={{
            fontSize: 40, fontWeight: 900, color: band.color,
            marginBottom: 4, letterSpacing: -1,
          }}>{pct}%</div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>
            {band.title}
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 11, color: "#475569" }}>{quiz.title}</p>
          {/* Progress arc */}
          <div style={{
            height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)",
            overflow: "hidden", marginBottom: 20,
          }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ height: "100%", background: band.color, borderRadius: 6 }}
            />
          </div>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
            {band.description.slice(0, 80)}...
          </p>
          <p style={{ margin: 0, fontSize: 9, color: "#1e293b" }}>الرحلة · منصة الصحة النفسية العلائقية</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════
   Insight Milestone Card (after every 2 quizzes)
   ══════════════════════════════════════════ */

const MILESTONE_MESSAGES: Record<number, { emoji: string; title: string; body: string }> = {
  2: { emoji: "🌱", title: "بدأت رحلتك!", body: "أكملت أول اختبارين — أنت تبني وعياً حقيقياً بنفسك." },
  4: { emoji: "💡", title: "وعي متنامٍ", body: "4 اختبارات خلفك! كل اختبار يُضيف طبقة من الفهم الذاتي." },
  6: { emoji: "⭐", title: "مستكشف متقدم", body: "6 اختبارات — أنت من النادرين الذين يستثمرون بجدية في فهم أنفسهم." },
  7: { emoji: "🏆", title: "أكملت الرحلة!", body: "أكملت جميع الاختبارات! ملفك النفسي الآن أكثر اكتمالاً من 95% من المستخدمين." },
};

function InsightMilestoneCard({ totalCompleted, onDismiss }: {
  totalCompleted: number;
  onDismiss: () => void;
}) {
  const milestone = MILESTONE_MESSAGES[totalCompleted];
  if (!milestone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(20,184,166,0.08))",
        border: "1px solid rgba(167,139,250,0.3)",
        borderRadius: 20, padding: "16px 18px", marginBottom: 16,
        display: "flex", alignItems: "flex-start", gap: 14,
      }}
    >
      <span style={{ fontSize: 32 }}>{milestone.emoji}</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>{milestone.title}</p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{milestone.body}</p>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
        <X size={14} color="#334155" />
      </button>
    </motion.div>
  );
}



function HistoryCard({ entry }: { entry: QuizHistoryEntry }) {
  const pct = Math.round((entry.score / entry.maxScore) * 100);
  const grade = pct >= 75 ? "A" : pct >= 50 ? "B" : "C";
  const gradeColor = pct >= 75 ? "#34D399" : pct >= 50 ? "#FBBF24" : "#F87171";
  const daysAgo = Math.floor((Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24));

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: `${gradeColor}18`, border: `1px solid ${gradeColor}33`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: gradeColor,
      }}>
        {grade}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {entry.quizTitle.replace("اختبار ", "").replace("مقياس ", "").replace("مؤشر ", "")}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#475569" }}>
          {daysAgo === 0 ? "اليوم" : daysAgo === 1 ? "أمس" : `منذ ${daysAgo} أيام`}
        </p>
      </div>
      <ChevronLeft size={14} color="#334155" />
    </div>
  );
}

/* ══════════════════════════════════════════
   Sidebar
   ══════════════════════════════════════════ */

function QuizSidebar({ history }: { history: QuizHistoryEntry[] }) {
  const growth = usePersonalGrowth();
  const tip = useMemo(() => getDailyTip(), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 240, flexShrink: 0 }}>

      {/* النمو الشخصي */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <TrendingUp size={16} color="#A78BFA" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>النمو الشخصي</h3>
        </div>
        {(growth.awareness + growth.emotional + growth.interaction) === 0 ? (
          <p style={{ margin: 0, fontSize: 11, color: "#334155", textAlign: "center", padding: "8px 0" }}>
            أضف أشخاصاً للخريطة لحساب نموك
          </p>
        ) : (
          <GrowthRadar awareness={growth.awareness} emotional={growth.emotional} interaction={growth.interaction} />
        )}
      </motion.div>

      {/* النتائج الأخيرة */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={15} color="#FBBF24" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>النتائج الأخيرة</h3>
          </div>
        </div>
        {history.length === 0 ? (
          <p style={{ margin: 0, fontSize: 11, color: "#334155", textAlign: "center", padding: "8px 0" }}>
            لم تأخذ اختباراً بعد
          </p>
        ) : (
          history.slice(0, 3).map((entry) => (
            <HistoryCard key={`${entry.quizId}-${entry.timestamp}`} entry={entry} />
          ))
        )}
      </motion.div>

      {/* نصيحة اليوم */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.04))",
          border: "1px solid rgba(251,191,36,0.18)", borderRadius: 20, padding: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Lightbulb size={15} color="#FBBF24" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#FBBF24" }}>نصيحة اليوم</h3>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>"{tip}"</p>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Hero Quiz Card
   ══════════════════════════════════════════ */

function HeroCard({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        background: "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(124,58,237,0.10))",
        border: "1px solid rgba(20,184,166,0.25)",
        borderRadius: 24, padding: "28px 28px",
        display: "flex", alignItems: "center", gap: 24, marginBottom: 24,
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div style={{
        position: "absolute", top: -40, left: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: "rgba(20,184,166,0.08)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      {/* Icon */}
      <div style={{
        width: 90, height: 90, borderRadius: "50%",
        background: "rgba(20,184,166,0.1)", border: "2px solid rgba(20,184,166,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, flexShrink: 0,
      }}>
        🧠
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <span style={{
          display: "inline-block", fontSize: 10, fontWeight: 700, color: "#14B8A6",
          background: "rgba(20,184,166,0.15)", padding: "3px 10px",
          borderRadius: 20, marginBottom: 8,
        }}>
          الاختبار المميز
        </span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#e2e8f0", lineHeight: 1.3 }}>
          تحليل العلاقات الشامل
        </h2>
        <p style={{ margin: "8px 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
          اكتشف أعمق طبقاتك العاطفية والنفسي من خلال هذا التحليل المدعوم بالذكاء الاصطناعي. نظرة شاملة تتجاوز السطح.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={onStart}
            style={{
              background: "linear-gradient(135deg, #14B8A6, #0d9488)",
              border: "none", borderRadius: 14, padding: "12px 24px",
              color: "#0a0d18", fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}
          >
            ابدأ التحليل الآن ←
          </button>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} /> 20 دقيقة
            </span>
            <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={12} color="#FBBF24" /> 4.9 تقييم
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Quiz Mini Card (Hub Grid)
   ══════════════════════════════════════════ */

function QuizMiniCard({ quiz, index, lastResult, onStart }: {
  quiz: QuizDef; index: number;
  lastResult?: QuizHistoryEntry;
  onStart: () => void;
}) {
  const meta = QUIZ_META[quiz.id];
  const diffColor = meta ? DIFFICULTY_COLORS[meta.difficulty] : "#64748b";
  const isPopular = meta && meta.popularity >= 85;

  return (
    <motion.button
      type="button"
      onClick={onStart}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: `linear-gradient(135deg, ${quiz.color}10, ${quiz.color}05)`,
        border: `1px solid ${quiz.color}25`,
        borderRadius: 20, padding: "18px 16px",
        cursor: "pointer", textAlign: "right",
        display: "flex", flexDirection: "column", gap: 8,
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div style={{
          position: "absolute", top: 10, left: 10,
          display: "flex", alignItems: "center", gap: 3,
          background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)",
          borderRadius: 8, padding: "2px 6px",
        }}>
          <Flame size={8} color="#FBBF24" />
          <span style={{ fontSize: 8, fontWeight: 800, color: "#FBBF24" }}>الأكثر إكمالاً</span>
        </div>
      )}

      {/* Icon + tags row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: isPopular ? 12 : 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${quiz.color}18`, display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>
          {quiz.emoji}
        </div>
        {meta && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 110 }}>
            {meta.tags.map((t) => (
              <span key={t} style={{
                fontSize: 8, fontWeight: 700, color: quiz.color,
                background: `${quiz.color}12`, border: `1px solid ${quiz.color}20`,
                borderRadius: 6, padding: "2px 6px",
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>
        {quiz.title.replace("اختبار ", "").replace("مقياس ", "").replace("مؤشر ", "").replace("تقييم ", "")}
      </h3>
      <p style={{ margin: 0, fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>{quiz.subtitle}</p>

      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: "#475569", display: "flex", alignItems: "center", gap: 3 }}>
            <Clock size={9} /> {meta?.durationMin ?? quiz.questions.length} د
          </span>
          {meta && (
            <span style={{
              fontSize: 8, fontWeight: 700, color: diffColor,
              background: `${diffColor}12`, padding: "2px 6px", borderRadius: 6,
            }}>{meta.difficulty}</span>
          )}
        </div>
        {lastResult ? (
          <span style={{
            fontSize: 9, fontWeight: 700, color: lastResult.bandColor,
            background: `${lastResult.bandColor}18`, padding: "2px 8px", borderRadius: 20,
          }}>
            {lastResult.bandTitle.split(" ")[0]}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: quiz.color, fontWeight: 700 }}>ابدأ ←</span>
        )}
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════
   Save Progress Helpers
   ══════════════════════════════════════════ */

const SAVE_KEY = "alrehla_quiz_saved_progress";

interface SavedProgress {
  quizId: string;
  step: number;
  answers: number[];
  savedAt: number;
}

function loadSavedProgress(): SavedProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as SavedProgress) : null;
  } catch { return null; }
}

function saveProgress(quizId: string, step: number, answers: number[]) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ quizId, step, answers, savedAt: Date.now() }));
}

function clearSavedProgress() {
  localStorage.removeItem(SAVE_KEY);
}

/* ══════════════════════════════════════════
   Resume Banner
   ══════════════════════════════════════════ */

function ResumeBanner({ saved, quiz, onResume, onDiscard }: {
  saved: SavedProgress;
  quiz: QuizDef;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const pct = Math.round((saved.step / quiz.questions.length) * 100);
  const daysAgo = Math.floor((Date.now() - saved.savedAt) / (1000 * 60 * 60 * 24));
  const timeLabel = daysAgo === 0 ? "اليوم" : daysAgo === 1 ? "أمس" : `منذ ${daysAgo} أيام`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: `linear-gradient(135deg, ${quiz.color}10, ${quiz.color}06)`,
        border: `1px solid ${quiz.color}25`,
        borderRadius: 18, padding: "14px 18px", marginBottom: 18,
        display: "flex", alignItems: "center", gap: 14,
      }}
    >
      <div style={{ fontSize: 28 }}>{quiz.emoji}</div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>
          لديك تقدم محفوظ — {quiz.title.replace("اختبار ", "").replace("مقياس ", "").replace("مؤشر ", "")}
        </p>
        <p style={{ margin: "3px 0 6px", fontSize: 10, color: "#475569" }}>
          {pct}% مكتمل · حُفظ {timeLabel}
        </p>
        {/* Mini progress bar */}
        <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", width: 140 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: quiz.color, borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <button onClick={onResume} style={{
          background: `${quiz.color}18`, border: `1px solid ${quiz.color}35`,
          borderRadius: 10, padding: "6px 14px",
          color: quiz.color, fontSize: 11, fontWeight: 800, cursor: "pointer",
          whiteSpace: "nowrap",
        }}>↩ استمر</button>
        <button onClick={onDiscard} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 9, color: "#334155",
        }}>تجاهل</button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Active Quiz View
   ══════════════════════════════════════════ */

function ActiveQuiz({ quiz, step, answers, onAnswer, onBack }: {
  quiz: QuizDef; step: number; answers: number[];
  onAnswer: (value: number) => void; onBack: () => void;
}) {
  const q = quiz.questions[step];
  const progress = ((step + 1) / quiz.questions.length) * 100;
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveProgress(quiz.id, step, answers);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080b15" }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" }}>
          <ArrowLeft size={18} color="#94a3b8" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: "100%", background: quiz.color, borderRadius: 4 }}
            />
          </div>
        </div>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
          {step + 1}/{quiz.questions.length}
        </span>
        {/* Save button */}
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.92 }}
          style={{
            background: saved ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${saved ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 10, padding: "5px 10px",
            display: "flex", alignItems: "center", gap: 5,
            cursor: "pointer", whiteSpace: "nowrap",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: 11 }}>{saved ? "✅" : "💾"}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: saved ? "#34D399" : "#475569" }}>
            {saved ? "تم الحفظ" : "حفظ"}
          </span>
        </motion.button>
      </div>

      {/* Question */}
      <div style={{ padding: "40px 24px", maxWidth: 560, margin: "0 auto" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <p style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.7, marginBottom: 32 }}>
              {q.question}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {q.options.map((opt, i) => {
                const selected = answers[step] === opt.value;
                return (
                  <motion.button
                    key={i} type="button" onClick={() => onAnswer(opt.value)}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    style={{
                      width: "100%", padding: "16px 20px", borderRadius: 16,
                      border: `1.5px solid ${selected ? quiz.color : "rgba(255,255,255,0.08)"}`,
                      background: selected ? `${quiz.color}15` : "rgba(255,255,255,0.03)",
                      color: selected ? "#e2e8f0" : "#94a3b8",
                      fontSize: 15, fontWeight: selected ? 700 : 500,
                      cursor: "pointer", textAlign: "right", transition: "all 0.15s",
                    }}
                  >{opt.text}</motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Result View
   ══════════════════════════════════════════ */

function ResultView({ quiz, score, band, onRetry, onHub, onShare, attempts }: {
  quiz: QuizDef; score: number; band: QuizResultBand;
  onRetry: () => void; onHub: () => void;
  onShare: () => void;
  attempts: QuizHistoryEntry[];
}) {
  const maxScore = quiz.questions.length * 3;
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div style={{ minHeight: "100vh", background: "#080b15" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 60px" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }} style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{band.emoji}</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#e2e8f0" }}>{band.title}</h2>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#475569" }}>{quiz.title}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: `linear-gradient(135deg, ${band.color}12, ${band.color}06)`,
            border: `1px solid ${band.color}30`,
            borderRadius: 20, padding: 24, marginBottom: 20, textAlign: "center",
          }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: band.color }}>{pct}%</div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden", margin: "12px 0" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ height: "100%", background: band.color, borderRadius: 4 }} />
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{score} من {maxScore} نقطة</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "20px 20px", marginBottom: 24,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Sparkles size={16} color={band.color} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>ماذا يعني هذا؟</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.8 }}>{band.description}</p>
        </motion.div>
        <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onRetry} style={{
              flex: 1, padding: "13px", borderRadius: 14,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <RotateCcw size={15} /> أعد الاختبار
            </button>
            <button onClick={onHub} style={{
              flex: 1, padding: "13px", borderRadius: 14,
              background: `linear-gradient(135deg, ${quiz.color}, ${quiz.color}bb)`,
              border: "none", color: "#0a0d18", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <ChevronRight size={15} /> اختبارات أخرى
            </button>
          </div>
          {/* Share button */}
          <button onClick={onShare} style={{
            width: "100%", padding: "11px", borderRadius: 14,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            📤 شارك نتيجتك
          </button>
          {/* Comparison graph */}
          <ResultComparisonGraph attempts={attempts} color={quiz.color} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Search Bar + Tag Filter
   ══════════════════════════════════════════ */

function QuizSearchBar({ search, setSearch, activeTag, setActiveTag, notCompletedOnly, setNotCompletedOnly }: {
  search: string;
  setSearch: (v: string) => void;
  activeTag: QuizTag | null;
  setActiveTag: (t: QuizTag | null) => void;
  notCompletedOnly: boolean;
  setNotCompletedOnly: (v: boolean) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {/* Search input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14, padding: "9px 14px", marginBottom: 10,
      }}>
        <Search size={13} color="#334155" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن اختبار..."
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#e2e8f0", fontSize: 12, fontFamily: "var(--font-sans)",
            direction: "rtl",
          }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center",
          }}>
            <X size={12} color="#475569" />
          </button>
        )}
      </div>

      {/* Tag filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTag(null)}
          style={{
            fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
            background: activeTag === null ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${activeTag === null ? "#14B8A6" : "rgba(255,255,255,0.08)"}`,
            color: activeTag === null ? "#14B8A6" : "#475569",
            transition: "all 0.15s",
          }}
        >
          الكل
        </button>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            style={{
              fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
              background: activeTag === tag ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeTag === tag ? "#A78BFA" : "rgba(255,255,255,0.08)"}`,
              color: activeTag === tag ? "#A78BFA" : "#475569",
              transition: "all 0.15s",
            }}
          >
            {tag}
          </button>
        ))}
        {/* Not completed toggle */}
        <button
          onClick={() => setNotCompletedOnly(!notCompletedOnly)}
          style={{
            fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
            background: notCompletedOnly ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${notCompletedOnly ? "#F87171" : "rgba(255,255,255,0.08)"}`,
            color: notCompletedOnly ? "#F87171" : "#475569",
            transition: "all 0.15s",
          }}
        >
          □ لم أكمله
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Hub (exported)
   ══════════════════════════════════════════ */

interface QuizzesHubProps {
  onBack?: () => void;
}

export function QuizzesHub({ onBack }: QuizzesHubProps) {
  const [state, setState] = useState<QuizView>({ view: "hub" });
  const { history, addResult, getAttempts, totalCompleted, completedQuizIds } = useQuizHistory();
  const { streak, pendingCount } = useQuizStats();
  const { quizReminders } = useDailyPulse();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<QuizTag | null>(null);
  const [notCompletedOnly, setNotCompletedOnly] = useState(false);
  const [insightDismissed, setInsightDismissed] = useState<number>(-1);
  const [showShareCard, setShowShareCard] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(() => loadSavedProgress());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showNodePicker, setShowNodePicker] = useState(false);
  const updateNode = useMapState((s) => s.updateNode);

  /* show insight milestone if new threshold reached */
  const showInsight = totalCompleted > 0 && totalCompleted !== insightDismissed && MILESTONE_MESSAGES[totalCompleted];

  /* Fire hub_opened event + quiz achievement check on mount */
  useEffect(() => {
    trackingService.recordFlow("quiz_hub_opened");
    // Show first-open onboarding if never visited
    if (!localStorage.getItem(HUB_ONBOARDED_KEY)) {
      setTimeout(() => setShowOnboarding(true), 600);
    }
    // Unlock quiz achievements based on current history
    try {
      const raw = localStorage.getItem("alrehla_quiz_history");
      const qh: Array<{ quizId: string }> = raw ? JSON.parse(raw) : [];
      const unique = new Set(qh.map((e) => e.quizId)).size;
      const { unlock } = useAchievementState.getState();
      if (unique >= 1) unlock("quiz_first");
      if (unique >= 2) unlock("quiz_double");
      if (unique >= 4) unlock("quiz_half");
      if (unique >= 7) unlock("quiz_master");
    } catch { /* silent */ }
   
  }, []);

  const completed = completedQuizIds();
  const filteredQuizzes = useMemo(() => {
    return QUIZZES.filter((q) => {
      const meta = QUIZ_META[q.id];
      const matchSearch = search === "" ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.subtitle.toLowerCase().includes(search.toLowerCase());
      const matchTag = activeTag === null ||
        (meta && meta.tags.includes(activeTag));
      const matchCompleted = !notCompletedOnly || !completed.has(q.id);
      return matchSearch && matchTag && matchCompleted;
    });
  }, [search, activeTag, notCompletedOnly, completed]);

  const startQuiz = useCallback((quizId: string) => {
    setState({ view: "quiz", quizId, step: 0, answers: [] });
  }, []);

  const handleAnswer = useCallback((value: number) => {
    setState((prev) => {
      if (prev.view !== "quiz") return prev;
      const quiz = QUIZZES.find((q) => q.id === prev.quizId)!;
      const nextAnswers = [...prev.answers];
      nextAnswers[prev.step] = value;
      const nextStep = prev.step + 1;
      if (nextStep >= quiz.questions.length) {
        const score = nextAnswers.reduce((s, v) => s + v, 0);
        const band = quiz.results.find((r) => score >= r.min && score <= r.max) ?? quiz.results[quiz.results.length - 1];
        // Save to history
        addResult({
          quizId: quiz.id,
          quizTitle: quiz.title,
          score,
          maxScore: quiz.questions.length * 3,
          bandTitle: band.title,
          bandColor: band.color,
          timestamp: Date.now(),
        });
        clearSavedProgress();
        setSavedProgress(null);
        // Track quiz completion with proper FlowStep type
        trackingService.recordFlow("quiz_completed", {
          meta: { quizId: quiz.id, score, band: band.title }
        });
        // Show manual node picker to link result to a person
        setTimeout(() => setShowNodePicker(true), 400);
        return { view: "result", quizId: prev.quizId, score, band };
      }
      return { ...prev, step: nextStep, answers: nextAnswers };
    });
  }, [addResult]);

  const goHub = useCallback(() => setState({ view: "hub" }), []);

  const activeQuiz = useMemo(() => {
    if (state.view === "hub" || state.view === "comprehensive" || state.view === "partner-compare" || state.view === "community") return null;
    return QUIZZES.find((q) => q.id === state.quizId) ?? null;
  }, [state]);

  /* Detect ?compare=CODE URL param on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("compare");
    if (code && code.length >= 4) {
      setState({ view: "partner-compare", shareCode: code });
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  /* ── Sub-views ── */
  if (state.view === "partner-compare") {
    return <ComprehensiveAnalysis onBack={goHub} partnerShareCode={state.shareCode} />;
  }
  if (state.view === "community") {
    return <CouplesCommunity onBack={goHub} />;
  }
  if (state.view === "comprehensive") {
    return <ComprehensiveAnalysis onBack={goHub} />;
  }

  if (state.view === "quiz" && activeQuiz) {
    return (
      <div dir="rtl">
        <ActiveQuiz quiz={activeQuiz} step={state.step} answers={state.answers}
          onAnswer={handleAnswer} onBack={goHub} />
      </div>
    );
  }

  if (state.view === "result" && activeQuiz) {
    const resultAttempts = getAttempts(activeQuiz.id);
    return (
      <div dir="rtl">
        {showShareCard && (
          <ShareResultCard quiz={activeQuiz} score={state.score} band={state.band}
            onClose={() => setShowShareCard(false)} />
        )}
        <ResultView quiz={activeQuiz} score={state.score} band={state.band}
          onRetry={() => startQuiz(activeQuiz.id)} onHub={goHub}
          onShare={() => setShowShareCard(true)}
          attempts={resultAttempts} />
      </div>
    );
  }

  /* ── Hub Layout ── */
  const savedQuiz = savedProgress ? QUIZZES.find((q) => q.id === savedProgress.quizId) ?? null : null;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#080b15" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(244,114,182,0.08))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={20} color="#A78BFA" />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>
              الاختبارات والتحليل
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>الوعي هو الخطوة الأولى</p>
          </div>
          <StreakBadge streak={streak} />
          {pendingCount > 0 && (
            <motion.span
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              style={{
                background: "#F87171", color: "#fff", fontSize: 9, fontWeight: 900,
                borderRadius: "50%", width: 18, height: 18, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >{pendingCount}</motion.span>
          )}
        </div>
        {onBack && (
          <div style={{ display: "flex", gap: 8 }}>
            {history.length > 0 && (
              <button onClick={() => exportQuizReport(history)} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "8px 14px", color: "#94a3b8", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                📄 تصدير
              </button>
            )}
            <button onClick={onBack} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "8px 16px", color: "#94a3b8", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <ArrowLeft size={14} /> رجوع
            </button>
          </div>
        )}
      </div>

      {/* Body — responsive: row on desktop, column on mobile */}
      <div style={{
        display: "flex", gap: 20,
        padding: "24px 20px 60px",
        maxWidth: 960, margin: "0 auto",
        flexWrap: "wrap-reverse",  /* sidebar goes below on narrow screens */
      }}>

        {/* Sidebar */}
        <div style={{ width: 200, minWidth: 160, flex: "0 0 200px", display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Weekly Digest */}
          <WeeklyDigestCard history={history} />
          {/* Quiz Reminders */}
          <QuizRemindersCard
            reminders={quizReminders}
            onStart={(id) => { startQuiz(id); }}
          />
          {/* Partner Invite */}
          <PartnerInviteCard />
          {/* History Sidebar */}
          <QuizSidebar history={history} />
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Resume Banner — shows when saved progress exists */}
          {savedProgress && savedQuiz && (
            <ResumeBanner
              saved={savedProgress}
              quiz={savedQuiz}
              onResume={() => {
                setState({ view: "quiz", quizId: savedProgress.quizId, step: savedProgress.step, answers: savedProgress.answers });
                setSavedProgress(null);
              }}
              onDiscard={() => {
                clearSavedProgress();
                setSavedProgress(null);
              }}
            />
          )}

          {/* Hero */}

          {/* Weekly Digest */}
          <WeeklyDigestCard history={history} />

          <HeroCard onStart={() => setState({ view: "comprehensive" })} />

          {/* Community Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onClick={() => setState({ view: "community" })}
            style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(20,184,166,0.06))",
              border: "1px solid rgba(167,139,250,0.2)",
              borderRadius: 18, padding: "16px 20px", marginBottom: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "border-color 0.2s",
            }}
            whileHover={{ borderColor: "rgba(167,139,250,0.4)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>
                ✨
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>مجتمع الثنائي</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>Ethereal Insight — تجارب ورؤى مشتركة</p>
              </div>
            </div>
            <span style={{ fontSize: 10, color: "#A78BFA", fontWeight: 700 }}>🔗 ادخل</span>
          </motion.div>

          {/* Insight Milestone Card */}
          <AnimatePresence>
            {showInsight && (
              <InsightMilestoneCard
                totalCompleted={totalCompleted}
                onDismiss={() => setInsightDismissed(totalCompleted)}
              />
            )}
          </AnimatePresence>

          {/* Quiz Recommendation */}
          {history.length > 0 && (
            <QuizRecommendationCard
              lastCompletedId={history[0]?.quizId ?? null}
              onStart={startQuiz}
            />
          )}

          {/* Search + Tags */}
          <QuizSearchBar search={search} setSearch={setSearch} activeTag={activeTag} setActiveTag={setActiveTag}
            notCompletedOnly={notCompletedOnly} setNotCompletedOnly={setNotCompletedOnly} />

          {/* Grid */}
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>استكشف الاختبارات المتاحة</h2>
            <span style={{ fontSize: 10, color: "#334155" }}>{filteredQuizzes.length} اختبار</span>
          </div>

          {filteredQuizzes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <p style={{ margin: 0, fontSize: 12, color: "#334155" }}>لا توجد اختبارات تطابق بحثك</p>
              <button onClick={() => { setSearch(""); setActiveTag(null); }}
                style={{ background: "none", border: "none", color: "#14B8A6", fontSize: 11, cursor: "pointer", marginTop: 6 }}>
                مسح الفلتر
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {filteredQuizzes.map((quiz, i) => {
                const lastResult = history.find((h) => h.quizId === quiz.id);
                return (
                  <QuizMiniCard
                    key={quiz.id} quiz={quiz} index={i}
                    lastResult={lastResult}
                    onStart={() => startQuiz(quiz.id)}
                  />
                );
              })}
            </div>
          )}

          <p style={{ textAlign: "center", fontSize: 11, color: "#1e293b", marginTop: 24 }}>
            هذه الاختبارات للتوعية الذاتية وليست بديلاً عن الاستشارة المتخصصة.
          </p>
        </div>
      </div>

      {/* Overlay Modals */}
      <AnimatePresence>
        {showOnboarding && (
          <HubFirstOpenModal
            key="hub-onboarding"
            onClose={() => { localStorage.setItem(HUB_ONBOARDED_KEY, "1"); setShowOnboarding(false); }}
          />
        )}
        {showNodePicker && state.view === "result" && activeQuiz && (
          <motion.div
            key="node-picker-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 8900, background: "rgba(8,11,21,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 16px 32px" }}
          >
            <div style={{ width: "100%", maxWidth: 420 }}>
              <AttachmentNodePicker
                band={{ title: state.band.title, color: state.band.color }}
                onLink={(nodeId) => {
                  updateNode(nodeId, { quizResult: { quizId: activeQuiz.id, bandTitle: state.band.title, bandColor: state.band.color, score: state.score, maxScore: activeQuiz.questions.length * 3, timestamp: Date.now() } });
                  setShowNodePicker(false);
                }}
                onSkip={() => setShowNodePicker(false)}
              />
            </div>
          </motion.div>
        )}
        {state.view === "result" && activeQuiz && (
          <motion.div
            key="partner-pdf-actions"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", bottom: 140, left: "50%", transform: "translateX(-50%)", zIndex: 810, width: "calc(100% - 48px)", maxWidth: 380 }}
          >
            <PartnerInviteSection
              quizTitle={activeQuiz.title}
              bandTitle={state.band.title}
              score={state.score}
              maxScore={activeQuiz.questions.length * 3}
            />
            <motion.button
              onClick={() => exportQuizReport(history)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                marginTop: 8, width: "100%", padding: "11px", borderRadius: 14,
                background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
                color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}
            >
              📄 تصدير تقرير PDF شامل
            </motion.button>
          </motion.div>
        )}
        {showScreenshot && state.view === "result" && activeQuiz && (
          <ScreenshotResultCard key="screenshot-card" quiz={{ title: activeQuiz.title, emoji: activeQuiz.emoji }} score={state.score} band={state.band} onClose={() => setShowScreenshot(false)} />
        )}
      </AnimatePresence>

      {/* Screenshot FAB */}
      <AnimatePresence>
        {state.view === "result" && !showScreenshot && !showNodePicker && (
          <motion.button key="screenshot-fab"
            initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setShowScreenshot(true)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
            style={{ position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", zIndex: 800, background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(244,114,182,0.15))", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 20, padding: "10px 20px", color: "#A78BFA", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, backdropFilter: "blur(12px)", boxShadow: "0 8px 20px rgba(0,0,0,0.3)" }}
          >
            📸 بطاقة للمشاركة
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

