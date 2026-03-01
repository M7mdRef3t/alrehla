import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Zap, Smile, Frown, Meh, Heart, Star, AlertCircle, Quote, RefreshCw, BookOpen } from "lucide-react";
import { useDailyPulse } from "../hooks/useDailyPulse";
import { useDailyQuestion } from "../hooks/useDailyQuestion";
import { supabase } from "../services/supabaseClient";

const MOODS = [
  { val: 1, icon: Frown, color: '#f87171', label: 'متضايق' },
  { val: 2, icon: Meh, color: '#fb923c', label: 'عادي' },
  { val: 3, icon: Smile, color: '#facc15', label: 'رايق' },
  { val: 4, icon: Heart, color: '#4ade80', label: 'مبسوط' },
  { val: 5, icon: Star, color: '#2dd4bf', label: 'طاير' },
];

const STRESS_TAGS = ["شغل", "أهل", "صحة", "فلوس", "علاقات", "نفسي"];

export const DailyPulseWidget: FC<{ onOpenArchive?: () => void }> = ({ onOpenArchive }) => {
  const { todayPulse, streak, loading, savePulse, hasAnsweredToday } = useDailyPulse();
  const { question } = useDailyQuestion();

  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stressTag, setStressTag] = useState("نفسي");
  const [note, setNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const [pulseInsight, setPulseInsight] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    if (todayPulse) {
      setMood(todayPulse.mood);
      setEnergy(todayPulse.energy);
      setStressTag(todayPulse.stress_tag);
      setNote(todayPulse.note);
      fetchPulseInsight();
    }
  }, [todayPulse]);

  const fetchPulseInsight = async () => {
    if (!hasAnsweredToday) return;
    setLoadingInsight(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          mode: 'daily_pulse',
          pulseData: { mood, energy, stress_tag: stressTag, note }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPulseInsight(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleSave = async () => {
    try {
      await savePulse({ mood, energy, stress_tag: stressTag, note, focus: 'general' });
      setIsSaved(true);
      await fetchPulseInsight();
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      className="rounded-[1.5rem] p-6 text-right w-full relative overflow-hidden border border-white/10 backdrop-blur-md"
      style={{ background: "rgba(15,23,42,0.3)" }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 blur-[40px] pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 fill-orange-400" />
            <span>{streak} يوم متتالي</span>
          </div>
          {onOpenArchive && (
            <button
              onClick={onOpenArchive}
              className="p-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-indigo-400 transition-colors"
              title="سجل الخواطر"
            >
              <BookOpen className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">نبض اليوم</h3>
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[11px] text-slate-400 mb-3 font-bold uppercase tracking-wider">الحالة المزاجية</p>
        <div className="flex justify-between gap-2">
          {MOODS.map((m) => {
            const Icon = m.icon;
            const isActive = mood === m.val;
            return (
              <button
                key={m.val}
                onClick={() => setMood(m.val)}
                className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${isActive ? 'bg-white/10 border-indigo-500/50 scale-105' : 'bg-white/5 border-transparent opacity-40 grayscale'
                  }`}
              >
                <Icon className="w-6 h-6" style={{ color: isActive ? m.color : '#94a3b8' }} />
                <span className={`text-[9px] font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[11px] text-slate-400 mb-3 font-bold uppercase tracking-wider">مستوى الطاقة</p>
        <div className="flex items-center gap-3">
          <Zap className={`w-4 h-4 ${energy > 3 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'}`} />
          <div className="flex-1 flex gap-1.5 h-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                onClick={() => setEnergy(i)}
                className={`flex-1 rounded-full cursor-pointer transition-all ${energy >= i ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-white/10'
                  }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-300 w-4">{energy}</span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[11px] text-slate-400 mb-3 font-bold uppercase tracking-wider">أكبر ضغط الآن</p>
        <div className="flex flex-wrap gap-2 justify-end">
          {STRESS_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setStressTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${stressTag === tag ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/5 text-slate-400'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 text-right">
        <div className="flex items-center gap-2 justify-end mb-2">
          <p className="text-[11px] text-indigo-400 font-bold">سؤال المحطة</p>
          <Quote className="w-3 h-3 text-indigo-500/50" />
        </div>
        <p className="text-xs text-slate-200 leading-relaxed mb-3 pr-2 border-r-2 border-indigo-500/30">
          {question.text}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="اكتب خاطرة سريعة أو إجابة..."
          className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none transition-all"
          rows={3}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.98] ${isSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
          }`}
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
        {hasAnsweredToday ? (isSaved ? 'تم التحديث' : 'تحديث نبض اليوم') : 'تسجيل النبض'}
      </button>

      {/* Auto Insight Display */}
      <AnimatePresence>
        {(hasAnsweredToday || isSaved) && (pulseInsight || loadingInsight) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 pt-6 border-t border-white/5"
          >
            <div className="flex items-center gap-2 justify-end mb-3">
              <p className="text-[10px] font-bold text-indigo-400">بصيرة المسار</p>
              <Sparkles className="w-3 h-3 text-indigo-500" />
            </div>
            {loadingInsight ? (
              <div className="flex items-center gap-2 justify-end py-2">
                <p className="text-[10px] text-slate-500 animate-pulse">جاري استخراج حكمة اليوم...</p>
                <RefreshCw className="w-3 h-3 text-slate-600 animate-spin" />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-right">
                <p className="text-[11px] text-slate-200 leading-relaxed italic">
                  "{pulseInsight.summary}"
                </p>
                {pulseInsight.recommendations && pulseInsight.recommendations[0] && (
                  <div className="mt-3 flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-emerald-400 font-bold">{pulseInsight.recommendations[0]}</span>
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isSaved && !pulseInsight && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex items-center justify-center bg-indigo-600 shadow-2xl rounded-2xl p-6 z-20"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-white font-bold mb-1">تمت المهمة</h4>
            <p className="text-indigo-100 text-[10px]">وعيك هو استثمارك الأول. استمر.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
