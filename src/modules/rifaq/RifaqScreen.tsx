/**
 * رفاق — Rifaq: رفاق الطريق
 *
 * أول عنصر اجتماعي في المنصة:
 * - اكتشاف رفاق بنفس الهدف
 * - تقدم مشترك مع حماية الخصوصية
 * - تحديات جماعية من Tajmeed
 * - رسائل تشجيع مهيكلة
 * - نظام دعوات
 */

import type { FC } from "react";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, Trophy, MessageCircle, Send, Shield,
  Flame, Star, Heart, ArrowRight, Copy, Check, Share2,
  Swords, Target, Zap, Crown, ChevronRight, Sparkles,
  HandHeart, UserCheck, Clock, Lock, Eye, EyeOff
} from "lucide-react";
import { useRifaqState, type Buddy, type TeamChallenge } from "./store/rifaq.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";

/* ═══════════════════════════════════════════ */
/*                 CONSTANTS                  */
/* ═══════════════════════════════════════════ */

const TABS = [
  { id: "discover" as const, label: "اكتشف", icon: Users },
  { id: "my-rifaq" as const, label: "رفاقي", icon: HandHeart },
  { id: "challenges" as const, label: "تحديات", icon: Trophy },
] as const;

type TabId = typeof TABS[number]["id"];

const ENCOURAGEMENT_TEMPLATES = [
  "أنت قادر — خطوة خطوة 💪",
  "فخور بيك — استمر! 🌟",
  "اليوم أحسن من أمس 📈",
  "إنت مش لوحدك 🤝",
  "الرحلة تستاهل — كمّل 🔥",
  "شايف تقدمك وفرحان 🎉",
  "خذها يوم بيوم — بتتحسن 🌱",
  "معاك على الطريق ♥️",
];

/** Simulated potential buddies for discovery */
const DISCOVERABLE_BUDDIES = [
  { id: "sim-1", name: "مسافر مجهول", avatarEmoji: "🧭", goal: "وضع حدود صحية", progressScore: 62, streak: 11, lastActiveAt: Date.now() - 3600000 },
  { id: "sim-2", name: "باحث عن سلام", avatarEmoji: "🕊️", goal: "التعافي من علاقة سامة", progressScore: 45, streak: 7, lastActiveAt: Date.now() - 7200000 },
  { id: "sim-3", name: "رحّالة واعي", avatarEmoji: "🌍", goal: "فهم أنماط العلاقات", progressScore: 78, streak: 23, lastActiveAt: Date.now() - 1800000 },
  { id: "sim-4", name: "قلب شجاع", avatarEmoji: "🦁", goal: "بناء ثقة بالنفس", progressScore: 34, streak: 5, lastActiveAt: Date.now() - 14400000 },
  { id: "sim-5", name: "نجمة هادية", avatarEmoji: "⭐", goal: "التواصل الصحي", progressScore: 89, streak: 31, lastActiveAt: Date.now() - 600000 },
  { id: "sim-6", name: "جبل صامد", avatarEmoji: "🏔️", goal: "إدارة الغضب", progressScore: 51, streak: 14, lastActiveAt: Date.now() - 10800000 },
];

const AVAILABLE_CHALLENGES: Omit<TeamChallenge, "myProgress" | "buddyProgress" | "startedAt" | "status" | "buddyId">[] = [
  { id: "ch-1", title: "أسبوع النبض", description: "سجّل نبضك 7 أيام متتالية مع رفيقك", icon: "💓", duration: 7 },
  { id: "ch-2", title: "ماراثون التوثيق", description: "اكتب 5 تدوينات في وثيقة خلال أسبوع", icon: "📝", duration: 7 },
  { id: "ch-3", title: "حدود واضحة", description: "حدد 3 حدود صحية في علاقاتك", icon: "🛡️", duration: 14 },
  { id: "ch-4", title: "هدوء 30 يوم", description: "مارس تمرين تأريض يومي لمدة شهر", icon: "🧘", duration: 30 },
  { id: "ch-5", title: "رحلة الوعي", description: "سجّل 10 نقاط وعي في بصيرة", icon: "🧠", duration: 14 },
];

/* ═══════════════════════════════════════════ */
/*                 HELPERS                    */
/* ═══════════════════════════════════════════ */

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `${min} دقيقة`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ساعة`;
  const d = Math.floor(hr / 24);
  return `${d} يوم`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const RifaqScreen: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("discover");
  const { buddies, challenges, addBuddy, sendMessage, startChallenge, generateInviteCode, inviteCode } = useRifaqState();
  const addXP = useGamificationState((s) => s.addXP);

  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  const activeBuddies = useMemo(() => buddies.filter((b) => b.status === "active"), [buddies]);
  const activeChallenges = useMemo(() => challenges.filter((c) => c.status === "active"), [challenges]);

  const handleConnect = useCallback((sim: typeof DISCOVERABLE_BUDDIES[0]) => {
    addBuddy({
      id: sim.id + "-" + generateId(),
      name: sim.name,
      avatarEmoji: sim.avatarEmoji,
      goal: sim.goal,
      status: "active",
      progressScore: sim.progressScore,
      streak: sim.streak,
      lastActiveAt: sim.lastActiveAt,
    });
    addXP(30, "إضافة رفيق جديد");
  }, [addBuddy, addXP]);

  const handleSendEncouragement = useCallback((buddyId: string) => {
    const msg = ENCOURAGEMENT_TEMPLATES[Math.floor(Math.random() * ENCOURAGEMENT_TEMPLATES.length)];
    sendMessage(buddyId, msg, "encouragement");
    addXP(10, "تشجيع رفيق");
  }, [sendMessage, addXP]);

  const handleStartChallenge = useCallback((challenge: typeof AVAILABLE_CHALLENGES[0], buddyId: string) => {
    startChallenge({ ...challenge, id: challenge.id + "-" + generateId(), buddyId });
    addXP(25, "بدء تحدي جماعي");
  }, [startChallenge, addXP]);

  const handleCopyInvite = useCallback(() => {
    const code = inviteCode || generateInviteCode();
    navigator.clipboard?.writeText(`انضم لرحلتي في الرحلة! كود الدعوة: ${code}\nhttps://alrehla.com/join?code=${code}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [inviteCode, generateInviteCode]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #0d1225 40%, #0a0a1a 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.25)" }}
            >
              <Users className="w-6 h-6 text-pink-400" />
              {activeBuddies.length > 0 && (
                <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{activeBuddies.length}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">رفاق</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">لست وحدك في الرحلة</p>
            </div>
          </div>

          {/* Invite Button */}
          <button
            onClick={handleCopyInvite}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            style={{
              background: copiedCode ? "rgba(16,185,129,0.15)" : "rgba(236,72,153,0.1)",
              border: `1px solid ${copiedCode ? "rgba(16,185,129,0.3)" : "rgba(236,72,153,0.2)"}`,
              color: copiedCode ? "#10b981" : "#ec4899",
            }}
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedCode ? "تم النسخ" : "ادعُ رفيق"}</span>
          </button>
        </div>

        {/* Privacy Badge */}
        <button
          onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 transition-all"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
        >
          <Shield className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400/80">خصوصيتك محمية — لا بيانات شخصية مكشوفة</span>
          {showPrivacyInfo ? <EyeOff className="w-3 h-3 text-emerald-400/60" /> : <Eye className="w-3 h-3 text-emerald-400/60" />}
        </button>
        <AnimatePresence>
          {showPrivacyInfo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="p-4 rounded-2xl space-y-2" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
                <div className="flex items-start gap-2"><Lock className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /><p className="text-[11px] text-slate-400">رفيقك يشوف فقط: نسبة تقدم عامة + streak — بدون تفاصيل شخصية</p></div>
                <div className="flex items-start gap-2"><Shield className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /><p className="text-[11px] text-slate-400">لا يمكنه رؤية: يومياتك، علاقاتك، حالتك المزاجية، أو أي بيانات خاصة</p></div>
                <div className="flex items-start gap-2"><Heart className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" /><p className="text-[11px] text-slate-400">التواصل عبر رسائل تشجيع مهيكلة فقط — لا محادثات مفتوحة</p></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Bar */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: activeTab === tab.id ? "rgba(236,72,153,0.12)" : "transparent",
                color: activeTab === tab.id ? "#ec4899" : "rgba(148,163,184,0.5)",
                border: activeTab === tab.id ? "1px solid rgba(236,72,153,0.2)" : "1px solid transparent",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "my-rifaq" && activeBuddies.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-pink-500/20 text-pink-400 text-[9px] font-black flex items-center justify-center">{activeBuddies.length}</span>
              )}
              {tab.id === "challenges" && activeChallenges.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black flex items-center justify-center">{activeChallenges.length}</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ═══════ TAB: DISCOVER ═══════ */}
        {activeTab === "discover" && (
          <motion.div key="discover" variants={sectionVariants} initial="hidden" animate="visible" exit="hidden"
            className="px-5 space-y-4"
          >
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> مسافرون في نفس الاتجاه
            </p>

            {DISCOVERABLE_BUDDIES.map((sim, i) => {
              const alreadyConnected = buddies.some((b) => b.id.startsWith(sim.id));
              return (
                <motion.div
                  key={sim.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-2xl flex items-center gap-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)" }}
                  >
                    {sim.avatarEmoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{sim.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{sim.goal}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] text-slate-600 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" /> {sim.streak} يوم
                      </span>
                      <span className="text-[9px] text-slate-600 flex items-center gap-1">
                        <Target className="w-3 h-3 text-blue-400" /> {sim.progressScore}%
                      </span>
                      <span className="text-[9px] text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(sim.lastActiveAt)}
                      </span>
                    </div>
                  </div>

                  {/* Connect Button */}
                  {alreadyConnected ? (
                    <div className="px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                    >
                      <UserCheck className="w-3.5 h-3.5" /> متصل
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(sim)}
                      className="px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all active:scale-95"
                      style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.2)", color: "#ec4899" }}
                    >
                      <UserPlus className="w-3.5 h-3.5" /> تواصل
                    </button>
                  )}
                </motion.div>
              );
            })}

            {/* Invite Card */}
            <div className="p-5 rounded-2xl text-center space-y-3 mt-2"
              style={{
                background: "linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(168,85,247,0.06) 100%)",
                border: "1px solid rgba(236,72,153,0.12)",
              }}
            >
              <p className="text-base font-black text-white">ادعُ رفيقك الحقيقي</p>
              <p className="text-xs text-slate-500">شارك رابط الدعوة مع شخص تعرفه — ارحلوا معاً</p>
              <button
                onClick={handleCopyInvite}
                className="mx-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.25)", color: "#ec4899" }}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "تم النسخ!" : "انسخ رابط الدعوة"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════ TAB: MY RIFAQ ═══════ */}
        {activeTab === "my-rifaq" && (
          <motion.div key="my-rifaq" variants={sectionVariants} initial="hidden" animate="visible" exit="hidden"
            className="px-5 space-y-4"
          >
            {activeBuddies.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background: "rgba(236,72,153,0.08)" }}
                >
                  <Users className="w-8 h-8 text-pink-400/30" />
                </div>
                <p className="text-sm font-bold text-slate-500">ما عندك رفاق بعد</p>
                <p className="text-xs text-slate-600">اكتشف مسافرين في نفس الاتجاه أو ادعُ شخص تعرفه</p>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="mx-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  style={{ background: "rgba(236,72,153,0.1)", color: "#ec4899" }}
                >
                  <Users className="w-3.5 h-3.5" /> اكتشف رفاق
                </button>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                  <HandHeart className="w-3 h-3" /> رفاق الطريق ({activeBuddies.length})
                </p>

                {activeBuddies.map((buddy, i) => (
                  <motion.div
                    key={buddy.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    {/* Buddy Header */}
                    <button
                      onClick={() => setSelectedBuddy(selectedBuddy?.id === buddy.id ? null : buddy)}
                      className="w-full p-4 flex items-center gap-4 text-right transition-all hover:bg-white/[0.01]"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)" }}
                      >
                        {buddy.avatarEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{buddy.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{buddy.goal}</p>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: buddy.progressScore >= 70 ? "rgba(16,185,129,0.1)" : buddy.progressScore >= 40 ? "rgba(251,191,36,0.1)" : "rgba(239,68,68,0.1)",
                          }}
                        >
                          <span className="text-sm font-black"
                            style={{
                              color: buddy.progressScore >= 70 ? "#10b981" : buddy.progressScore >= 40 ? "#fbbf24" : "#ef4444",
                            }}
                          >
                            {buddy.progressScore}%
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-600 font-bold">تقدم</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${selectedBuddy?.id === buddy.id ? "rotate-90" : ""}`} />
                    </button>

                    {/* Expanded Section */}
                    <AnimatePresence>
                      {selectedBuddy?.id === buddy.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-2.5 rounded-xl text-center" style={{ background: "rgba(239,68,68,0.06)" }}>
                                <Flame className="w-3.5 h-3.5 text-red-400 mx-auto mb-1" />
                                <p className="text-sm font-black text-white">{buddy.streak}</p>
                                <p className="text-[8px] text-slate-500 font-bold">أيام</p>
                              </div>
                              <div className="p-2.5 rounded-xl text-center" style={{ background: "rgba(96,165,250,0.06)" }}>
                                <Target className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                                <p className="text-sm font-black text-white">{buddy.progressScore}%</p>
                                <p className="text-[8px] text-slate-500 font-bold">تقدم</p>
                              </div>
                              <div className="p-2.5 rounded-xl text-center" style={{ background: "rgba(168,85,247,0.06)" }}>
                                <MessageCircle className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
                                <p className="text-sm font-black text-white">{buddy.messages.length}</p>
                                <p className="text-[8px] text-slate-500 font-bold">رسائل</p>
                              </div>
                            </div>

                            {/* Recent Messages */}
                            {buddy.messages.length > 0 && (
                              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {buddy.messages.slice(-3).map((msg) => (
                                  <div key={msg.id} className="flex items-start gap-2 p-2 rounded-lg"
                                    style={{ background: msg.from === "me" ? "rgba(236,72,153,0.05)" : "rgba(96,165,250,0.05)" }}
                                  >
                                    <span className="text-[9px]">{msg.from === "me" ? "أنت" : buddy.avatarEmoji}</span>
                                    <p className="text-[11px] text-slate-300 flex-1">{msg.text}</p>
                                    <span className="text-[8px] text-slate-600 shrink-0">{timeAgo(msg.timestamp)}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSendEncouragement(buddy.id)}
                                className="flex-1 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)", color: "#ec4899" }}
                              >
                                <Heart className="w-3.5 h-3.5" /> شجّعه
                              </button>
                              <button
                                onClick={() => setActiveTab("challenges")}
                                className="flex-1 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}
                              >
                                <Swords className="w-3.5 h-3.5" /> تحدّي
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}

        {/* ═══════ TAB: CHALLENGES ═══════ */}
        {activeTab === "challenges" && (
          <motion.div key="challenges" variants={sectionVariants} initial="hidden" animate="visible" exit="hidden"
            className="px-5 space-y-5"
          >
            {/* Active Challenges */}
            {activeChallenges.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] text-amber-400/60 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Flame className="w-3 h-3" /> تحديات نشطة ({activeChallenges.length})
                </p>
                {activeChallenges.map((ch) => {
                  const buddy = buddies.find((b) => b.id === ch.buddyId);
                  const daysLeft = Math.max(0, ch.duration - Math.floor((Date.now() - ch.startedAt) / 86400000));
                  return (
                    <div key={ch.id} className="p-4 rounded-2xl space-y-3"
                      style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{ch.icon}</span>
                          <div>
                            <p className="text-sm font-black text-white">{ch.title}</p>
                            <p className="text-[10px] text-slate-500">{ch.description}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-400/60">{daysLeft} يوم متبقي</span>
                      </div>

                      {/* Progress Bars */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 w-10 shrink-0">أنت</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <div className="h-full rounded-full bg-pink-500 transition-all" style={{ width: `${ch.myProgress}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-pink-400 w-8">{ch.myProgress}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 w-10 shrink-0 truncate">{buddy?.avatarEmoji ?? "🤝"}</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${ch.buddyProgress}%` }} />
                          </div>
                          <span className="text-[9px] font-black text-blue-400 w-8">{ch.buddyProgress}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available Challenges */}
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Trophy className="w-3 h-3" /> تحديات جاهزة
              </p>

              {activeBuddies.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Trophy className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-xs text-slate-500">أضف رفيق أولاً عشان تبدأ تحدي</p>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="mx-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    style={{ background: "rgba(236,72,153,0.1)", color: "#ec4899" }}
                  >
                    <Users className="w-3.5 h-3.5" /> اكتشف رفاق
                  </button>
                </div>
              ) : (
                AVAILABLE_CHALLENGES.map((ch, i) => (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-2xl flex items-center gap-4"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}
                    >
                      {ch.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white">{ch.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{ch.description}</p>
                      <span className="text-[9px] text-slate-600 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {ch.duration} يوم
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartChallenge(ch, activeBuddies[0].id)}
                      className="px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shrink-0"
                      style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}
                    >
                      <Zap className="w-3.5 h-3.5" /> ابدأ
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Completed Challenges */}
            {challenges.filter((c) => c.status === "completed").length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Crown className="w-3 h-3" /> تحديات مكتملة
                </p>
                {challenges.filter((c) => c.status === "completed").map((ch) => (
                  <div key={ch.id} className="p-3 rounded-xl flex items-center gap-3"
                    style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}
                  >
                    <span className="text-lg">{ch.icon}</span>
                    <p className="text-xs font-bold text-emerald-400/70 flex-1">{ch.title}</p>
                    <Star className="w-4 h-4 text-amber-400" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RifaqScreen;
