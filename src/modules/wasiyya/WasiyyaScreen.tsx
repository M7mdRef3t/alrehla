/**
 * وصية — Wasiyya Screen
 * Sealed letters to your future self
 * Write → Seal → Wait → Unseal → Reflect
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useWasiyyaState,
  MOOD_META,
  SEAL_DURATIONS,
  type LetterMood,
} from "./store/wasiyya.store";
import {
  Lock,
  Unlock,
  Plus,
  Send,
  Clock,
  Archive,
  Mail,
  MailOpen,
  X,
  Sparkles,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*                 HELPERS                    */
/* ═══════════════════════════════════════════ */

function timeUntil(ts: number): string {
  const diff = ts - Date.now();
  if (diff <= 0) return "جاهزة للفتح";
  const days = Math.floor(diff / 86400000);
  if (days > 30) return `${Math.floor(days / 30)} شهر`;
  if (days > 0) return `${days} يوم`;
  const hours = Math.floor(diff / 3600000);
  return `${hours} ساعة`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ═══════════════════════════════════════════ */
/*            VIEW MODES                      */
/* ═══════════════════════════════════════════ */

type ViewMode = "sealed" | "ready" | "opened" | "compose";

/* ═══════════════════════════════════════════ */
/*            COMPOSE FORM                    */
/* ═══════════════════════════════════════════ */

function ComposeForm({ onDone }: { onDone: () => void }) {
  const { writeLetter } = useWasiyyaState();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<LetterMood>("hope");
  const [emoji, setEmoji] = useState("✉️");
  const [selectedDuration, setSelectedDuration] = useState(30); // days
  const [sealed, setSealed] = useState(false);

  const handleSeal = () => {
    if (!title.trim() || !content.trim()) return;
    setSealed(true);

    setTimeout(() => {
      writeLetter({
        title: title.trim(),
        content: content.trim(),
        mood,
        emoji,
        unlockAt: Date.now() + selectedDuration * 86400000,
      });
      onDone();
    }, 2000);
  };

  if (sealed) {
    return (
      <motion.div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6">
        <motion.div
          initial={{ scale: 1, rotateY: 0 }}
          animate={{ scale: [1, 0.8, 1.1, 1], rotateY: [0, 90, 180, 360] }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          className="w-28 h-28 rounded-3xl flex items-center justify-center bg-amber-900/20 border border-amber-500/30"
        >
          <Lock className="w-12 h-12 text-amber-400" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-amber-300 font-bold text-lg"
        >
          تم ختم الوصية بأمان 🔐
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-slate-500 text-sm"
        >
          ستصلك بعد {selectedDuration > 30 ? `${Math.round(selectedDuration / 30)} شهر` : `${selectedDuration} يوم`}
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 pb-32 space-y-5"
    >
      {/* Title */}
      <div>
        <label className="text-xs text-slate-500 font-bold mb-2 block">عنوان الوصية</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="رسالة للنسخة القادمة مني..."
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
          dir="rtl"
        />
      </div>

      {/* Content */}
      <div>
        <label className="text-xs text-slate-500 font-bold mb-2 block">اكتب وصيتك</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="عزيزي أنا المستقبلي... أكتب لك هذه الرسالة لأنني..."
          rows={7}
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none leading-relaxed"
          dir="rtl"
        />
      </div>

      {/* Mood */}
      <div>
        <label className="text-xs text-slate-500 font-bold mb-2 block">شعور الوصية</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MOOD_META) as LetterMood[]).map((m) => {
            const meta = MOOD_META[m];
            const active = mood === m;
            return (
              <button
                key={m}
                onClick={() => { setMood(m); setEmoji(meta.emoji); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: active ? `${meta.color}25` : "rgba(30,41,59,0.5)",
                  border: `1px solid ${active ? meta.color : "rgba(71,85,105,0.3)"}`,
                  color: active ? meta.color : "#94a3b8",
                }}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seal Duration */}
      <div>
        <label className="text-xs text-slate-500 font-bold mb-2 block">مدة الختم</label>
        <div className="flex flex-wrap gap-2">
          {SEAL_DURATIONS.map((d) => {
            const active = selectedDuration === d.days;
            return (
              <button
                key={d.days}
                onClick={() => setSelectedDuration(d.days)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: active ? "rgba(251,191,36,0.15)" : "rgba(30,41,59,0.5)",
                  border: `1px solid ${active ? "#fbbf24" : "rgba(71,85,105,0.3)"}`,
                  color: active ? "#fbbf24" : "#94a3b8",
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seal Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSeal}
        disabled={!title.trim() || !content.trim()}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30"
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.08))",
          border: "1px solid rgba(251,191,36,0.3)",
          color: "#fbbf24",
        }}
      >
        <Lock className="w-4 h-4" />
        اختم الوصية
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*            LETTER CARD                     */
/* ═══════════════════════════════════════════ */

function LetterCard({
  letter,
  onUnseal,
  onRead,
}: {
  letter: ReturnType<typeof useWasiyyaState.getState>["letters"][0];
  onUnseal?: () => void;
  onRead?: () => void;
}) {
  const isSealed = !letter.openedAt;
  const isReady = isSealed && letter.unlockAt <= Date.now();
  const moodMeta = MOOD_META[letter.mood];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-4 transition-all"
      style={{
        background: isReady
          ? "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.03))"
          : "rgba(15,23,42,0.6)",
        border: `1px solid ${isReady ? "rgba(251,191,36,0.3)" : "rgba(51,65,85,0.4)"}`,
      }}
    >
      {/* Glow for ready letters */}
      {isReady && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: "0 0 30px rgba(251,191,36,0.1)" }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      <div className="flex items-start gap-3 relative z-10">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isSealed ? "rgba(251,191,36,0.1)" : "rgba(16,185,129,0.1)",
            border: `1px solid ${isSealed ? "rgba(251,191,36,0.2)" : "rgba(16,185,129,0.2)"}`,
          }}
        >
          {isSealed ? (
            <Lock className="w-5 h-5 text-amber-400" />
          ) : (
            <MailOpen className="w-5 h-5 text-emerald-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{letter.emoji}</span>
            <h3 className="text-sm font-bold text-white truncate">{letter.title}</h3>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>كُتبت {formatDate(letter.writtenAt)}</span>
            <span>•</span>
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{
                background: `${moodMeta.color}15`,
                color: moodMeta.color,
              }}
            >
              {moodMeta.emoji} {moodMeta.label}
            </span>
          </div>

          {isSealed && (
            <div className="flex items-center gap-1 mt-2 text-[10px]" style={{ color: isReady ? "#fbbf24" : "#64748b" }}>
              <Clock className="w-3 h-3" />
              <span>{isReady ? "✨ جاهزة للفتح!" : `تُفتح بعد ${timeUntil(letter.unlockAt)}`}</span>
            </div>
          )}

          {!isSealed && (
            <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">{letter.content}</p>
          )}
        </div>

        {/* Action */}
        {isReady && onUnseal && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onUnseal}
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1"
            style={{
              background: "rgba(251,191,36,0.15)",
              border: "1px solid rgba(251,191,36,0.3)",
              color: "#fbbf24",
            }}
          >
            <Unlock className="w-3 h-3" />
            فك الختم
          </motion.button>
        )}

        {!isSealed && onRead && (
          <button
            onClick={onRead}
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-emerald-400 bg-emerald-900/20 border border-emerald-800/30"
          >
            اقرأ
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           READING MODAL                    */
/* ═══════════════════════════════════════════ */

function ReadingModal({
  letter,
  onClose,
}: {
  letter: ReturnType<typeof useWasiyyaState.getState>["letters"][0];
  onClose: () => void;
}) {
  const { addReflection } = useWasiyyaState();
  const [reflection, setReflection] = useState(letter.afterReflection || "");
  const [saved, setSaved] = useState(false);
  const moodMeta = MOOD_META[letter.mood];

  const handleSave = () => {
    if (reflection.trim()) {
      addReflection(letter.id, reflection.trim());
      setSaved(true);
      setTimeout(onClose, 1200);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl p-6 space-y-4"
        style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(10,15,30,0.98))",
          border: `1px solid ${moodMeta.color}30`,
        }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{letter.emoji}</span>
            <div>
              <h2 className="text-lg font-black text-white">{letter.title}</h2>
              <p className="text-[10px] text-slate-500">{formatDate(letter.writtenAt)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Letter content */}
        <div
          className="rounded-2xl p-4 text-sm text-slate-300 leading-relaxed max-h-60 overflow-y-auto"
          style={{
            background: "rgba(30,41,59,0.3)",
            border: "1px solid rgba(51,65,85,0.3)",
          }}
        >
          {letter.content}
        </div>

        {/* Reflection */}
        {!saved ? (
          <>
            <div>
              <label className="text-xs text-slate-500 font-bold mb-2 block">
                <Sparkles className="w-3 h-3 inline ml-1" />
                كيف تشعر الآن بعد قراءتها؟
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="اكتب تأملك..."
                rows={3}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!reflection.trim()}
              className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "#10b981",
              }}
            >
              <Send className="w-3 h-3" />
              حفظ التأمل
            </button>
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-emerald-400 font-bold text-sm py-4"
          >
            ✨ تم حفظ تأملك
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function WasiyyaScreen() {
  const { letters, unsealLetter, getSealedLetters, getUnsealedLetters, getReadyToOpen, getStats } =
    useWasiyyaState();
  const [viewMode, setViewMode] = useState<ViewMode>("sealed");
  const [readingLetter, setReadingLetter] = useState<string | null>(null);

  const stats = useMemo(() => getStats(), [letters]);
  const sealedLetters = useMemo(() => getSealedLetters(), [letters]);
  const readyLetters = useMemo(() => getReadyToOpen(), [letters]);
  const openedLetters = useMemo(() => getUnsealedLetters(), [letters]);

  const letter = readingLetter ? letters.find((l) => l.id === readingLetter) : null;

  const tabs: { id: ViewMode; icon: React.ReactNode; label: string; count: number }[] = [
    { id: "sealed", icon: <Lock className="w-3.5 h-3.5" />, label: "مختومة", count: sealedLetters.length },
    { id: "ready", icon: <Sparkles className="w-3.5 h-3.5" />, label: "جاهزة", count: readyLetters.length },
    { id: "opened", icon: <Archive className="w-3.5 h-3.5" />, label: "مفتوحة", count: openedLetters.length },
  ];

  const displayLetters =
    viewMode === "sealed"
      ? sealedLetters
      : viewMode === "ready"
        ? readyLetters
        : viewMode === "opened"
          ? openedLetters
          : [];

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.06),transparent_60%)] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-900/20 border border-amber-500/20">
              <Mail className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">وصية</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">رسائل مختومة للمستقبل</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewMode("compose")}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-900/20 border border-amber-500/30 text-amber-400"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="px-5 mb-4">
        <div className="flex gap-3">
          {[
            { label: "إجمالي", value: stats.total, color: "#94a3b8" },
            { label: "مختومة", value: stats.sealed, color: "#fbbf24" },
            { label: "جاهزة", value: stats.readyToOpen, color: "#10b981" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-xl p-3 text-center"
              style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(51,65,85,0.3)",
              }}
            >
              <div className="text-xl font-black" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      {viewMode !== "compose" && (
        <div className="px-5 mb-4">
          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800/50">
            {tabs.map((t) => {
              const active = viewMode === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setViewMode(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: active ? "rgba(251,191,36,0.1)" : "transparent",
                    color: active ? "#fbbf24" : "#64748b",
                    border: active ? "1px solid rgba(251,191,36,0.2)" : "1px solid transparent",
                  }}
                >
                  {t.icon}
                  {t.label}
                  {t.count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px]"
                      style={{
                        background: active ? "rgba(251,191,36,0.2)" : "rgba(100,116,139,0.2)",
                      }}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "compose" ? (
          <ComposeForm key="compose" onDone={() => setViewMode("sealed")} />
        ) : displayLetters.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-800/40 border border-slate-700/30">
              <Mail className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-600 font-medium">لا توجد رسائل هنا بعد</p>
            <button
              onClick={() => setViewMode("compose")}
              className="text-xs text-amber-400 font-bold"
            >
              ✍️ اكتب أول وصية
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 space-y-3"
          >
            {displayLetters.map((l) => (
              <LetterCard
                key={l.id}
                letter={l}
                onUnseal={
                  l.unlockAt <= Date.now() && !l.openedAt
                    ? () => {
                        unsealLetter(l.id);
                        setReadingLetter(l.id);
                      }
                    : undefined
                }
                onRead={l.openedAt ? () => setReadingLetter(l.id) : undefined}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading Modal */}
      <AnimatePresence>
        {letter && letter.openedAt && (
          <ReadingModal
            key="reading"
            letter={letter}
            onClose={() => setReadingLetter(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{
          background: "rgba(15,23,42,0.4)",
          border: "1px solid rgba(51,65,85,0.2)",
        }}
      >
        <p className="text-[10px] text-slate-600 leading-relaxed">
          ✉️ الوصية رسالة مختومة لنفسك المستقبلية — تُكتب اليوم وتُفتح غداً
        </p>
      </motion.div>
    </div>
  );
}
