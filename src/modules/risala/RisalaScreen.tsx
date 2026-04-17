/**
 * رسالة — Risala Screen
 * Anonymous Messages Between Travelers: أرسل / استقبل / زجاجة البحر
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useRisalaState,
  TONE_META,
  STAGE_META,
  REACTION_META,
  type MessageTone,
  type TravelerStage,
} from "./store/risala.store";
import {
  Send,
  Inbox,
  Anchor,
  Heart,
  Star,
  ChevronLeft,
  MessageCircleHeart,
  Sparkles,
  User,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*            HELPERS                         */
/* ═══════════════════════════════════════════ */

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} س`;
  const days = Math.floor(hrs / 24);
  return `${days} ي`;
}

/* ═══════════════════════════════════════════ */
/*           COMPOSE VIEW                     */
/* ═══════════════════════════════════════════ */

function ComposeView({ onDone }: { onDone: () => void }) {
  const { myStage, sendMessage } = useRisalaState();
  const [content, setContent] = useState("");
  const [tone, setTone] = useState<MessageTone>("encouragement");
  const [target, setTarget] = useState<TravelerStage | "anyone">("anyone");
  const [isBottle, setIsBottle] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage({ content: content.trim(), tone, targetStage: target, isBottle });
    setSent(true);
    setTimeout(onDone, 2500);
  };

  if (sent) {
    return (
      <motion.div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 px-8"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}>
          {isBottle ? (
            <span className="text-6xl">🍾</span>
          ) : (
            <MessageCircleHeart className="w-16 h-16 text-cyan-400" />
          )}
        </motion.div>
        {/* Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400"
            initial={{ x: 0, y: 0, opacity: 0.7 }}
            animate={{ x: (Math.random() - 0.5) * 180, y: -80 - Math.random() * 120, opacity: 0 }}
            transition={{ duration: 1.5 + Math.random(), delay: 0.2 + Math.random() * 0.4 }} />
        ))}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-cyan-300 font-black text-lg text-center">
          {isBottle ? "زجاجتك في البحر 🌊" : "رسالتك وصلت 💌"}
        </motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="text-slate-500 text-xs text-center">
          مسافر مجهول سيقرأها في اللحظة المناسبة
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-4">
      <div className="text-center mb-2">
        <span className="text-3xl block mb-2">✍️</span>
        <h2 className="text-lg font-black text-white">اكتب رسالة</h2>
        <p className="text-[10px] text-slate-500">لمسافر مجهول يحتاج كلمتك الآن</p>
      </div>

      {/* Tone */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold mb-2 block">نبرة الرسالة</label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TONE_META) as MessageTone[]).map((t) => {
            const m = TONE_META[t];
            const active = tone === t;
            return (
              <button key={t} onClick={() => setTone(t)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${m.color}20` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                  color: active ? m.color : "#94a3b8",
                }}>
                <span>{m.emoji}</span><span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target stage */}
      <div>
        <label className="text-[10px] text-slate-500 font-bold mb-2 block">لمن تُرسل؟</label>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setTarget("anyone")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
            style={{
              background: target === "anyone" ? "rgba(6,182,212,0.15)" : "rgba(30,41,59,0.4)",
              border: `1px solid ${target === "anyone" ? "#06b6d4" : "rgba(51,65,85,0.3)"}`,
              color: target === "anyone" ? "#06b6d4" : "#94a3b8",
            }}>
            🌍 أي مسافر
          </button>
          {(Object.keys(STAGE_META) as TravelerStage[]).map((s) => {
            const m = STAGE_META[s];
            const active = target === s;
            return (
              <button key={s} onClick={() => setTarget(s)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: active ? `${m.color}20` : "rgba(30,41,59,0.4)",
                  border: `1px solid ${active ? m.color : "rgba(51,65,85,0.3)"}`,
                  color: active ? m.color : "#94a3b8",
                }}>
                <span>{m.emoji}</span><span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="اكتب كلمتك... ستصل لمسافر يحتاجها"
        rows={4}
        className="w-full bg-slate-800/40 border border-slate-700/40 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none leading-relaxed"
        dir="rtl"
      />

      {/* Bottle toggle */}
      <button onClick={() => setIsBottle(!isBottle)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all"
        style={{
          background: isBottle ? "rgba(6,182,212,0.1)" : "rgba(30,41,59,0.4)",
          border: `1px solid ${isBottle ? "#06b6d4" : "rgba(51,65,85,0.3)"}`,
          color: isBottle ? "#06b6d4" : "#94a3b8",
        }}>
        <span className="flex items-center gap-2">
          <Anchor className="w-3.5 h-3.5" />
          زجاجة بحر — تصل لشخص عشوائي بعد أيام
        </span>
        <div className="w-8 h-4 rounded-full relative" style={{ background: isBottle ? "#06b6d4" : "#334155" }}>
          <motion.div className="absolute top-0.5 w-3 h-3 rounded-full bg-white"
            animate={{ left: isBottle ? 16 : 2 }} transition={{ type: "spring", stiffness: 500 }} />
        </div>
      </button>

      {/* Send */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend}
        disabled={!content.trim()}
        className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
        style={{
          background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(16,185,129,0.06))",
          border: "1px solid rgba(6,182,212,0.3)",
          color: "#06b6d4",
        }}>
        <Send className="w-4 h-4" />
        أرسل الرسالة
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*         MESSAGE CARD                       */
/* ═══════════════════════════════════════════ */

function MessageCard({ msg, onReact }: {
  msg: ReturnType<typeof useRisalaState.getState>["receivedMessages"][0];
  onReact: (reaction: "heart" | "star" | "prayer" | "tear") => void;
}) {
  const toneMeta = TONE_META[msg.tone];
  const stageMeta = STAGE_META[msg.senderStage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: msg.isBottle ? "rgba(6,182,212,0.04)" : "rgba(15,23,42,0.6)",
        border: `1px solid ${msg.isBottle ? "rgba(6,182,212,0.15)" : "rgba(51,65,85,0.3)"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold">مسافر مجهول</span>
            <span className="text-[9px] text-slate-600 mr-1.5">{stageMeta.emoji} {stageMeta.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {msg.isBottle && <span className="text-xs" title="زجاجة بحر">🍾</span>}
          <span className="text-[8px] text-slate-600">{timeAgo(msg.createdAt)}</span>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-white/80 leading-relaxed">{msg.content}</p>

      {/* Tone badge */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: `${toneMeta.color}15`, color: toneMeta.color }}>
          {toneMeta.emoji} {toneMeta.label}
        </span>

        {/* Reactions */}
        <div className="flex items-center gap-1">
          {(["heart", "star", "prayer", "tear"] as const).map((r) => (
            <button key={r} onClick={() => onReact(r)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
              style={{
                background: msg.reaction === r ? "rgba(251,191,36,0.1)" : "rgba(30,41,59,0.4)",
                border: `1px solid ${msg.reaction === r ? "rgba(251,191,36,0.3)" : "rgba(51,65,85,0.2)"}`,
              }}>
              {REACTION_META[r].emoji}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function RisalaScreen() {
  const {
    sentMessages,
    receivedMessages,
    myStage,
    bottlesSent,
    bottlesReceived,
    setMyStage,
    receiveRandomMessage,
    receiveBottle,
    markRead,
    reactToMessage,
    getSentCount,
    getReceivedCount,
    getUnreadCount,
  } = useRisalaState();

  const [view, setView] = useState<"home" | "compose" | "inbox" | "bottles">("home");
  const [stagePickerOpen, setStagePickerOpen] = useState(false);

  const sentCount = useMemo(() => getSentCount(), [sentMessages]);
  const receivedCount = useMemo(() => getReceivedCount(), [receivedMessages]);
  const unreadCount = useMemo(() => getUnreadCount(), [receivedMessages]);

  const handleReceive = () => {
    receiveRandomMessage();
    setView("inbox");
  };

  const handleBottle = () => {
    receiveBottle();
    setView("bottles");
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full top-[-10%] right-[-5%]"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06), transparent 65%)" }} />
        <div className="absolute w-[350px] h-[350px] rounded-full bottom-[-8%] left-[-3%]"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.04), transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-900/15 border border-cyan-500/20">
              <MessageCircleHeart className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">رسالة</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">كلمات بين مسافرين مجهولين</p>
            </div>
          </div>
          {view !== "home" && (
            <button onClick={() => setView("home")}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/40 border border-slate-700/30 text-slate-400">
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>
      </motion.div>

      {/* My Stage */}
      <div className="relative z-10 px-5 mb-4">
        <button onClick={() => setStagePickerOpen(!stagePickerOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] transition-all"
          style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
          <span className="text-slate-400 font-bold">أنا الآن:</span>
          <span className="flex items-center gap-1 font-bold" style={{ color: STAGE_META[myStage].color }}>
            {STAGE_META[myStage].emoji} {STAGE_META[myStage].label}
          </span>
        </button>
        <AnimatePresence>
          {stagePickerOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2">
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(STAGE_META) as TravelerStage[]).map((s) => {
                  const m = STAGE_META[s];
                  return (
                    <button key={s} onClick={() => { setMyStage(s); setStagePickerOpen(false); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: myStage === s ? `${m.color}20` : "rgba(30,41,59,0.4)",
                        border: `1px solid ${myStage === s ? m.color : "rgba(51,65,85,0.3)"}`,
                        color: myStage === s ? m.color : "#94a3b8",
                      }}>
                      <span>{m.emoji}</span><span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "أرسلت", value: sentCount, color: "#06b6d4" },
            { label: "استقبلت", value: receivedCount, color: "#10b981" },
            { label: "غير مقروءة", value: unreadCount, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "compose" ? (
          <ComposeView key="compose" onDone={() => setView("home")} />
        ) : view === "inbox" || view === "bottles" ? (
          <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 px-5 space-y-3">
            <h3 className="text-xs text-slate-500 font-bold mb-2">
              {view === "bottles" ? "🍾 زجاجات البحر" : "📬 صندوق الرسائل"}
            </h3>
            {receivedMessages
              .filter((m) => view === "bottles" ? m.isBottle : true)
              .map((msg) => (
                <MessageCard
                  key={msg.id}
                  msg={msg}
                  onReact={(r) => { markRead(msg.id); reactToMessage(msg.id, r); }}
                />
              ))}
            {receivedMessages.filter((m) => view === "bottles" ? m.isBottle : true).length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">{view === "bottles" ? "🌊" : "📭"}</span>
                <p className="text-sm text-slate-600">{view === "bottles" ? "لا زجاجات بعد" : "لا رسائل بعد"}</p>
                <button onClick={view === "bottles" ? handleBottle : handleReceive}
                  className="text-xs text-cyan-400 font-bold mt-3">
                  {view === "bottles" ? "🍾 التقط زجاجة" : "📬 استقبل رسالة"}
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* Home */
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 px-5 space-y-3">
            {/* Action Cards */}
            {[
              {
                emoji: "✍️", title: "اكتب رسالة", desc: "أرسل تشجيع لمسافر مجهول",
                color: "#06b6d4", action: () => setView("compose"),
              },
              {
                emoji: "📬", title: "استقبل رسالة", desc: `رسائل من مسافرين في مرحلتك${unreadCount > 0 ? ` — ${unreadCount} جديدة` : ""}`,
                color: "#10b981", action: handleReceive,
              },
              {
                emoji: "🍾", title: "زجاجة البحر", desc: "التقط رسالة عشوائية من البحر",
                color: "#8b5cf6", action: handleBottle,
              },
            ].map((card, i) => (
              <motion.button
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                whileTap={{ scale: 0.98 }}
                onClick={card.action}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-right transition-all"
                style={{
                  background: `${card.color}06`,
                  border: `1px solid ${card.color}20`,
                }}
              >
                <span className="text-3xl">{card.emoji}</span>
                <div className="flex-1">
                  <span className="text-sm font-black text-white block">{card.title}</span>
                  <span className="text-[10px] text-slate-500">{card.desc}</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </motion.button>
            ))}

            {/* Recent sent */}
            {sentMessages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wider">آخر ما أرسلت</h3>
                {sentMessages.slice(0, 3).map((msg) => (
                  <div key={msg.id} className="rounded-lg px-3 py-2 mb-2"
                    style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px]" style={{ color: TONE_META[msg.tone].color }}>
                        {TONE_META[msg.tone].emoji} {TONE_META[msg.tone].label}
                      </span>
                      <span className="text-[8px] text-slate-600">{timeAgo(msg.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          💌 رسالة — كلمات مجهولة تصل في اللحظة المناسبة
        </p>
      </motion.div>
    </div>
  );
}
