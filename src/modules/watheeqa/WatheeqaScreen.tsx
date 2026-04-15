import type { FC } from "react";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, PenLine, Calendar, TrendingUp, Sparkles,
  ChevronDown, ChevronUp, Clock, Heart, Zap, Moon,
  Sun, Cloud, CloudRain, Flame, Shield, Eye,
  FileText, Search, Hash, ArrowUpRight, Star
} from "lucide-react";
import { useDailyJournalState, type DailyJournalEntry } from "@/domains/journey/store/journal.store";
import { usePulseState, type PulseMood } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";

/* ═══════════════════════════════════════════ */
/*              HELPERS & TYPES               */
/* ═══════════════════════════════════════════ */

const MOODS: { id: PulseMood; icon: FC<any>; label: string; color: string }[] = [
  { id: "bright",      icon: Sun,       label: "مشرق",    color: "#facc15" },
  { id: "calm",        icon: Moon,      label: "هادئ",    color: "#818cf8" },
  { id: "hopeful",     icon: Star,      label: "متفائل",  color: "#34d399" },
  { id: "anxious",     icon: Cloud,     label: "قلق",     color: "#f97316" },
  { id: "sad",         icon: CloudRain, label: "حزين",    color: "#64748b" },
  { id: "angry",       icon: Flame,     label: "غاضب",    color: "#ef4444" },
  { id: "tense",       icon: Shield,    label: "متوتر",   color: "#e879f9" },
  { id: "overwhelmed", icon: Eye,       label: "مرهق",    color: "#94a3b8" },
];

const REFLECTION_PROMPTS = [
  "ما الشيء الذي أنت ممتنّ له اليوم؟",
  "ما اللحظة اللي حسّيت فيها بنفسك أكتر النهاردة؟",
  "لو تقدر تقول لنفسك بكرة حاجة واحدة — هتقول إيه؟",
  "إيه الحاجة اللي تعلمتها عن نفسك النهاردة؟",
  "وصّف يومك في 3 كلمات بس.",
  "مين الشخص اللي أثّر فيك النهاردة — وإزاي؟",
  "ما هو القرار اللي اتخذته النهاردة وأنت فخور بيه؟",
  "لو النهاردة كان فصل في كتاب حياتك — عنوانه إيه؟",
  "ما الشيء اللي كنت بتتجنبه وواجهته النهاردة؟",
  "إيه الشعور المسيطر عليك دلوقتي — وليه؟",
];

function getTodayDate(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function formatArabicDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function getRelativeDay(dateStr: string): string {
  const today = getTodayDate();
  if (dateStr === today) return "اليوم";
  const t = new Date(today);
  const d = new Date(dateStr);
  const diff = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (diff === 1) return "أمس";
  if (diff < 7) return `قبل ${diff} أيام`;
  if (diff < 30) return `قبل ${Math.floor(diff / 7)} أسابيع`;
  return formatArabicDate(dateStr);
}

/* ═══════════════════════════════════════════ */
/*               WATHEEQA SCREEN              */
/* ═══════════════════════════════════════════ */

export const WatheeqaScreen: FC = () => {
  const { entries, saveAnswer, hasAnsweredToday, totalAnswers } = useDailyJournalState();
  const pulseHistory = usePulseState((s) => s.logs);
  const addXP = useGamificationState((s) => s.addXP);
  const streak = useGamificationState((s) => s.streak);

  const [activeTab, setActiveTab] = useState<"write" | "archive" | "insights">("write");
  const [journalText, setJournalText] = useState("");
  const [selectedMood, setSelectedMood] = useState<PulseMood | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePromptIdx, setActivePromptIdx] = useState(() => Math.floor(Math.random() * REFLECTION_PROMPTS.length));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const today = getTodayDate();
  const answeredToday = hasAnsweredToday();

  // Group entries by month
  const groupedEntries = useMemo(() => {
    const safe = Array.isArray(entries) ? entries : [];
    const sorted = [...safe].sort((a, b) => b.savedAt - a.savedAt);
    const filtered = searchQuery
      ? sorted.filter((e) => e.answer.includes(searchQuery) || e.questionText.includes(searchQuery))
      : sorted;
    const groups: Record<string, DailyJournalEntry[]> = {};
    filtered.forEach((e) => {
      const month = e.date.substring(0, 7); // YYYY-MM
      if (!groups[month]) groups[month] = [];
      groups[month].push(e);
    });
    return groups;
  }, [entries, searchQuery]);

  // Insights — word frequency
  const wordInsights = useMemo(() => {
    const safe = Array.isArray(entries) ? entries : [];
    const allText = safe.map((e) => e.answer).join(" ");
    const words = allText.split(/\s+/).filter((w) => w.length >= 3);
    const freq: Record<string, number> = {};
    words.forEach((w) => { const clean = w.replace(/[^\u0600-\u06FF]/g, ""); if (clean.length >= 3) freq[clean] = (freq[clean] ?? 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [entries]);

  // Streak calendar — last 30 days
  const calendarDays = useMemo(() => {
    const safe = Array.isArray(entries) ? entries : [];
    const datesSet = new Set(safe.map((e) => e.date));
    const days: { date: string; hasEntry: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      days.push({ date: ds, hasEntry: datesSet.has(ds) });
    }
    return days;
  }, [entries]);

  // Average mood from pulse
  const recentMoodLabel = useMemo(() => {
    if (!pulseHistory || pulseHistory.length === 0) return null;
    const last5 = pulseHistory.slice(-5);
    const moodCounts: Record<string, number> = {};
    last5.forEach((p) => { if (p.mood) moodCounts[p.mood] = (moodCounts[p.mood] ?? 0) + 1; });
    const top = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    return top ? MOODS.find((m) => m.id === top[0]) : null;
  }, [pulseHistory]);

  const handleSave = useCallback(() => {
    if (!journalText.trim()) return;
    const prompt = REFLECTION_PROMPTS[activePromptIdx];
    saveAnswer(activePromptIdx + 100, prompt, journalText.trim());
    addXP(40, "تدوينة في وثيقة 📝");
    setJournalText("");
    setSelectedMood(null);
    setEnergyLevel(5);
    setActivePromptIdx(Math.floor(Math.random() * REFLECTION_PROMPTS.length));
  }, [journalText, activePromptIdx, saveAnswer, addXP]);

  const cyclePrompt = useCallback(() => {
    setActivePromptIdx((prev) => (prev + 1) % REFLECTION_PROMPTS.length);
  }, []);

  useEffect(() => {
    if (activeTab === "write" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeTab]);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  const totalEntries = totalAnswers();

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #0f172a 40%, #0a0a1a 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-8 pb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.25)" }}
            >
              <BookOpen className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">وثيقة</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">سجّل رحلتك — كلمة كلمة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
              style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)", color: "#fb923c" }}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{streak} يوم</span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          {([
            { id: "write" as const, icon: PenLine, label: "اكتب" },
            { id: "archive" as const, icon: Calendar, label: "أرشيف" },
            { id: "insights" as const, icon: TrendingUp, label: "رؤى" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{
                background: activeTab === tab.id ? "rgba(251,146,60,0.15)" : "transparent",
                color: activeTab === tab.id ? "#fb923c" : "rgba(148,163,184,0.6)",
                border: activeTab === tab.id ? "1px solid rgba(251,146,60,0.2)" : "1px solid transparent",
              }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ═══════ TAB: WRITE ═══════ */}
        {activeTab === "write" && (
          <motion.div key="write" variants={sectionVariants} initial="hidden" animate="visible" exit="hidden"
            className="px-5 space-y-5"
          >
            {/* Reflection Prompt */}
            <div className="p-5 rounded-3xl relative overflow-hidden"
              style={{ background: "rgba(251,146,60,0.04)", border: "1px solid rgba(251,146,60,0.12)" }}
            >
              <div className="absolute top-3 left-3 opacity-10"><Sparkles className="w-16 h-16 text-orange-400" /></div>
              <button onClick={cyclePrompt} className="text-[10px] text-orange-400/60 font-bold uppercase tracking-widest mb-3 hover:text-orange-400 transition-colors flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> سؤال اليوم للتأمل
              </button>
              <p className="text-base text-white/90 font-bold leading-relaxed relative z-10">
                {REFLECTION_PROMPTS[activePromptIdx]}
              </p>
            </div>

            {/* Mood Selector */}
            <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">حالتك المزاجية الآن</p>
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMood(selectedMood === m.id ? null : m.id)}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                    style={{
                      background: selectedMood === m.id ? `${m.color}20` : "rgba(255,255,255,0.02)",
                      border: selectedMood === m.id ? `1px solid ${m.color}40` : "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    <m.icon className="w-4 h-4" style={{ color: selectedMood === m.id ? m.color : "rgba(148,163,184,0.4)" }} />
                    <span className="text-[10px] font-bold" style={{ color: selectedMood === m.id ? m.color : "rgba(148,163,184,0.4)" }}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Slider */}
            <div className="p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">مستوى الطاقة</p>
                <span className="text-sm font-black text-orange-400">{energyLevel}/10</span>
              </div>
              <input
                type="range" min="1" max="10" step="1"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-bold mt-1">
                <span>منهك</span><span>طاقة عالية</span>
              </div>
            </div>

            {/* Recent Mood Context */}
            {recentMoodLabel && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{ background: `${recentMoodLabel.color}10`, border: `1px solid ${recentMoodLabel.color}20` }}
              >
                <recentMoodLabel.icon className="w-4 h-4" style={{ color: recentMoodLabel.color }} />
                <span className="text-xs font-medium" style={{ color: recentMoodLabel.color }}>
                  حالتك الأخيرة من Pulse: {recentMoodLabel.label}
                </span>
              </div>
            )}

            {/* Text Input */}
            <div className="rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <textarea
                ref={textareaRef}
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="اكتب هنا... خلّي كلامك حر ومن القلب"
                rows={6}
                className="w-full bg-transparent p-5 text-white/90 text-sm leading-relaxed placeholder:text-slate-700 resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <span className="text-[10px] text-slate-600 font-bold">
                  {journalText.length} حرف
                </span>
                <button
                  onClick={handleSave}
                  disabled={!journalText.trim()}
                  className="px-6 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all active:scale-95 disabled:opacity-30"
                  style={{
                    background: journalText.trim() ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.03)",
                    border: journalText.trim() ? "1px solid rgba(251,146,60,0.3)" : "1px solid transparent",
                    color: journalText.trim() ? "#fb923c" : "rgba(148,163,184,0.3)",
                  }}
                >
                  حفظ في الوثيقة ✦
                </button>
              </div>
            </div>

            {/* Already Answered Badge */}
            {answeredToday && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}
              >
                <Heart className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-bold">وثّقت يومك — أحسنت ✨</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ═══════ TAB: ARCHIVE ═══════ */}
        {activeTab === "archive" && (
          <motion.div key="archive" variants={sectionVariants} initial="hidden" animate="visible" exit="hidden"
            className="px-5 space-y-5"
          >
            {/* Streak Calendar */}
            <div className="p-5 rounded-3xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">آخر 30 يوم</p>
              <div className="grid grid-cols-10 gap-1.5">
                {calendarDays.map((d) => (
                  <div
                    key={d.date}
                    className="aspect-square rounded-md transition-all"
                    title={formatArabicDate(d.date)}
                    style={{
                      background: d.hasEntry ? "rgba(251,146,60,0.5)" : "rgba(255,255,255,0.03)",
                      border: d.date === today ? "1px solid rgba(251,146,60,0.6)" : "none",
                      boxShadow: d.hasEntry ? "0 0 8px rgba(251,146,60,0.2)" : "none",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-slate-600">{calendarDays.filter(d => d.hasEntry).length} يوم من 30</span>
                <span className="text-[10px] text-orange-400 font-bold">{totalEntries} تدوينة إجمالاً</span>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في تدويناتك..."
                className="w-full bg-transparent px-5 pr-10 py-3 rounded-2xl text-sm text-white/80 placeholder:text-slate-700 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              />
            </div>

            {/* Entries grouped by month */}
            {Object.entries(groupedEntries).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Calendar className="w-12 h-12 text-slate-800" />
                <p className="text-sm text-slate-600 text-center font-medium">لسه ما بدأتش توثّق</p>
              </div>
            ) : (
              Object.entries(groupedEntries).map(([month, monthEntries]) => (
                <div key={month}>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(month + "-01").toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}
                    <span className="text-slate-700">({monthEntries.length})</span>
                  </p>
                  <div className="space-y-3">
                    {monthEntries.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-4 rounded-2xl"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-orange-400/60 font-bold">{getRelativeDay(entry.date)}</span>
                          <span className="text-[10px] text-slate-700 font-mono">{new Date(entry.savedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-1.5 italic leading-relaxed">{entry.questionText}</p>
                        <p className="text-sm text-white/80 leading-relaxed font-medium">&quot;{entry.answer}&quot;</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ═══════ TAB: INSIGHTS ═══════ */}
        {activeTab === "insights" && (
          <motion.div key="insights" variants={sectionVariants} initial="hidden" animate="visible" exit="hidden"
            className="px-5 space-y-5"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "تدوينات", value: totalEntries.toString(), icon: FileText, color: "#fb923c" },
                { label: "أيام متواصلة", value: streak.toString(), icon: Flame, color: "#ef4444" },
                { label: "كلمات كُتبت", value: (Array.isArray(entries) ? entries : []).reduce((s, e) => s + e.answer.split(/\s+/).length, 0).toLocaleString("ar-EG"), icon: Hash, color: "#818cf8" },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-2xl text-center"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}
                >
                  <s.icon className="w-4 h-4 mx-auto mb-2" style={{ color: s.color }} />
                  <p className="text-xl font-black text-white">{s.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: `${s.color}80` }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Word Cloud */}
            <div className="p-5 rounded-3xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Hash className="w-3 h-3" /> الكلمات الأكثر تكراراً في تدويناتك
              </p>
              {wordInsights.length === 0 ? (
                <p className="text-xs text-slate-700 text-center py-6">اكتب أكتر عشان نكشف أنماطك</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {wordInsights.map(([word, count], i) => (
                    <span
                      key={word}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{
                        background: `rgba(251,146,60,${0.05 + (i < 3 ? 0.15 : 0.05)})`,
                        border: `1px solid rgba(251,146,60,${0.1 + (i < 3 ? 0.2 : 0.05)})`,
                        color: i < 3 ? "#fb923c" : "rgba(251,146,60,0.5)",
                        fontSize: i < 3 ? 14 : i < 6 ? 12 : 11,
                      }}
                    >
                      {word} <span className="opacity-50">×{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mood Correlation */}
            <div className="p-5 rounded-3xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Heart className="w-3 h-3" /> توزيع المشاعر من Pulse
              </p>
              {(!pulseHistory || pulseHistory.length === 0) ? (
                <p className="text-xs text-slate-700 text-center py-6">لا بيانات مزاجية بعد — سجّل Pulse أولاً</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const moodCounts: Record<string, number> = {};
                    pulseHistory.forEach((p) => { if (p.mood) moodCounts[p.mood] = (moodCounts[p.mood] ?? 0) + 1; });
                    const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
                    return Object.entries(moodCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([mood, count]) => {
                        const m = MOODS.find((x) => x.id === mood);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={mood} className="flex items-center gap-3">
                            {m && <m.icon className="w-4 h-4 shrink-0" style={{ color: m.color }} />}
                            <span className="text-xs font-bold text-white/60 w-16">{m?.label ?? mood}</span>
                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6 }}
                                className="h-full rounded-full"
                                style={{ background: m?.color ?? "#fb923c" }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-600 font-mono w-8 text-left">{pct}%</span>
                          </div>
                        );
                      });
                  })()}
                </div>
              )}
            </div>

            {/* Journey Advice */}
            <div className="p-5 rounded-3xl relative overflow-hidden"
              style={{ background: "rgba(251,146,60,0.03)", border: "1px solid rgba(251,146,60,0.1)" }}
            >
              <div className="absolute -bottom-4 -left-4 opacity-5"><Sparkles className="w-24 h-24 text-orange-400" /></div>
              <p className="text-[10px] text-orange-400/60 font-bold uppercase tracking-widest mb-3 flex items-center gap-1">
                <Eye className="w-3 h-3" /> رؤية من رحلتك
              </p>
              <p className="text-sm text-white/70 leading-relaxed font-medium relative z-10">
                {totalEntries >= 7
                  ? `كتبت ${totalEntries} تدوينة حتى الآن — ده معناه إنك بتاخد رحلتك بجدية. الكلمات اللي بتكتبها بتبني خريطة لوعيك. استمر.`
                  : totalEntries >= 1
                  ? "بدأت الطريق — كل تدوينة بتقرّبك أكتر من فهم نفسك. حاول توثّق كل يوم."
                  : "لسه ما بدأتش — اكتب أول تدوينة ليك. مش محتاج تكون مثالية — محتاجة تكون صادقة."
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WatheeqaScreen;
