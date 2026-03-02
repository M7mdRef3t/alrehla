import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Zap, Smile, Frown, Meh, Heart, Star, Quote, RefreshCw, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useDailyPulse } from "../hooks/useDailyPulse";
import { useDailyQuestion } from "../hooks/useDailyQuestion";
import { supabase } from "../services/supabaseClient";

/**
 * 🎨 PULSE CAPSULE (Daily Vital Sign)
 * ─────────────────────────────────────────────────────────────────────────────
 * تحويل الـ DailyPulse من Widget تقليدي إلى HUD Vital Sign هادئ واحترافي.
 */

const MOODS = [
  { val: 1, icon: Frown, color: '#94a3b8', label: 'متضايق', secondary: '#f87171' },
  { val: 2, icon: Meh, color: '#94a3b8', label: 'عادي', secondary: '#fb923c' },
  { val: 3, icon: Smile, color: '#10b981', label: 'رايق', secondary: '#facc15' },
  { val: 4, icon: Heart, color: '#10b981', label: 'مبسوط', secondary: '#4ade80' },
  { val: 5, icon: Star, color: '#10b981', label: 'طاير', secondary: '#2dd4bf' },
];

const STRESS_TAGS = ["شغل", "أهل", "صحة", "فلوس", "علاقات", "نفسي"];

export const DailyPulseWidget: FC<{ onOpenArchive?: () => void }> = ({ onOpenArchive }) => {
  const { todayPulse, history, loading, savePulse, hasAnsweredToday } = useDailyPulse();
  const { question } = useDailyQuestion();

  const [isExpanded, setIsExpanded] = useState(false);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stressTag, setStressTag] = useState("نفسي");
  const [note, setNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // ─── Behavioral Logic: Meaning & Diff ──────────────────────────────────────
  const meaning = useMemo(() => {
    if (!hasAnsweredToday) return "تسجيل نبض الآن";
    const currentMood = todayPulse?.mood || 3;
    if (currentMood === 1) return "حاجة للسكون (إجهاد مرتفع)";
    if (currentMood === 2) return "مراقبة هادئة (ترقب)";
    if (currentMood === 3) return "النظام في حالة استقرار (توازن)";
    if (currentMood === 4) return "توازن متصاعد (نشاط إيجابي)";
    if (currentMood === 5) return "اتساع في الوعي (حالة مثالية)";
    return "نبض مستقر";
  }, [hasAnsweredToday, todayPulse]);

  const diff = useMemo(() => {
    if (!hasAnsweredToday || history.length < 2) return null;
    const current = todayPulse?.mood || 0;
    const prev = history[1]?.mood || 0;
    const delta = current - prev;
    if (delta === 0) return null;
    return {
      val: Math.abs(delta).toFixed(1),
      dir: delta > 0 ? "↑" : "↓",
      color: delta > 0 ? "text-emerald-400" : "text-white/40"
    };
  }, [hasAnsweredToday, history, todayPulse]);

  useEffect(() => {
    if (todayPulse) {
      setMood(todayPulse.mood);
      setEnergy(todayPulse.energy);
      setStressTag(todayPulse.stress_tag);
      setNote(todayPulse.note);
    }
  }, [todayPulse]);

  const handleSave = async (quickMood?: number) => {
    try {
      const finalMood = quickMood || mood;
      await savePulse({ mood: finalMood, energy, stress_tag: stressTag, note, focus: 'general' });
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setIsExpanded(false);
      }, 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const currentMoodObj = MOODS.find(m => m.val === (hasAnsweredToday ? todayPulse?.mood : mood)) || MOODS[2];

  return (
    <div className="relative flex flex-col items-center">
      {/* ── 💊 PULSE CAPSULE (Vital Sign HUD) ── */}
      <motion.button
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 h-12 px-6 rounded-full glass border border-white/5 shadow-none hover:bg-white/[0.04] transition-all relative z-50 overflow-hidden"
        style={{
          backdropFilter: "blur(12px)",
          background: "rgba(10, 10, 10, 0.4)",
          minWidth: "18rem"
        }}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {/* Vital Dot */}
        <motion.div
          layoutId="vital-dot"
          className="w-2 h-2 rounded-full"
          animate={{ scale: isSaved ? [1, 1.5, 1] : 1 }}
          style={{
            backgroundColor: currentMoodObj.color,
            opacity: 0.8
          }}
        />

        {/* Meaning Label */}
        <span className="flex-1 text-right text-[11px] font-black text-white/60 tracking-tight">
          {meaning}
        </span>

        {/* Discovery Hint (Quiet Indicator for first steps) */}
        {!hasAnsweredToday && !isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -bottom-8 right-0 text-[8px] font-black text-[#8A8A8A] uppercase tracking-[0.3em] pointer-events-none"
          >
            Start Journey Here
          </motion.div>
        )}

        {/* Diff Indicator (Subtle) */}
        {diff && (
          <span className={`text-[9px] font-black ${diff.color} opacity-40`}>
            {diff.dir} {diff.val}
          </span>
        )}

        {/* Success Flash / Glow + Semantic Confirmation (Micro-feedback) */}
        <AnimatePresence>
          {isSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-500/10 pointer-events-none flex items-center justify-center"
            >
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[9px] font-black text-emerald-400 uppercase tracking-widest"
              >
                تم تسجيل النبض
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interaction Icon / Quick Tuner */}
        <div className="ml-1 flex items-center gap-2 relative">
          {!hasAnsweredToday && !isExpanded && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 mr-2 group-hover:bg-white/[0.05] transition-all">
              {MOODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={`quick-${m.val}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(m.val);
                    }}
                    className="p-1 hover:scale-125 transition-transform text-white/20 hover:text-white"
                  >
                    <Icon className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          )}
          <div className="opacity-20">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </motion.button>

      {/* ── 📦 EXPANDED PULSE (The Input Layer) ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-[34rem] glass overflow-hidden border border-white/10 shadow-2xl z-40"
            style={{ borderRadius: "1.5rem", background: "rgba(10, 14, 35, 0.85)" }}
          >
            <div className="p-6 text-right space-y-6">
              {/* Internal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {onOpenArchive && (
                    <button
                      onClick={onOpenArchive}
                      className="p-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">نبض النظام</h3>
              </div>

              {/* Mood Selection */}
              <div className="space-y-3">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">الحالة المزاجية</p>
                <div className="flex justify-between gap-2">
                  {MOODS.map((m) => {
                    const Icon = m.icon;
                    const isActive = mood === m.val;
                    return (
                      <button
                        key={m.val}
                        onClick={() => setMood(m.val)}
                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${isActive ? 'bg-white/[0.08] border-emerald-500/40' : 'bg-transparent border-white/5 opacity-40'
                          }`}
                      >
                        <Icon className="w-5 h-5" style={{ color: isActive ? m.secondary : '#94a3b8' }} />
                        <span className="text-[9px] font-bold text-white/60">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Energy Slider */}
              <div className="space-y-3">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">مستوى الطاقة</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex gap-1.5 h-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        onClick={() => setEnergy(i)}
                        className={`flex-1 rounded-full cursor-pointer transition-all ${energy >= i ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]' : 'bg-white/5'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Question & Note */}
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-right">
                  <p className="text-xs text-white/80 leading-relaxed font-medium">
                    {question.text}
                  </p>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="اكتب بصمت..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none transition-all resize-none"
                  rows={2}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={() => handleSave()}
                disabled={loading}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black tracking-widest uppercase transition-all active:scale-[0.98] ${isSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white text-black hover:bg-white/90'
                  }`}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                {isSaved ? "تم الضبط" : (hasAnsweredToday ? 'تحديث النبض' : 'تسجيل الدخول للنفس')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
