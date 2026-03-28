import { useEffect, useMemo, useState, type FC } from "react";
import { motion } from "framer-motion";
import { Clock3, Play, Pause, RotateCcw, Sparkles, Waves, Music2, ArrowLeft, TimerReset, MoonStar } from "lucide-react";
import { soundManager } from "../services/soundManager";

type SessionTone = "focus" | "recovery" | "sleep";

interface MeditationSession {
  id: string;
  title: string;
  durationMinutes: number;
  tone: SessionTone;
  description: string;
  useCase: string;
}

const SESSIONS: MeditationSession[] = [
  {
    id: "reset",
    title: "إعادة ضبط سريعة",
    durationMinutes: 7,
    tone: "focus",
    description: "للانتقال من الضوضاء إلى هدوء قابل للتنفيذ.",
    useCase: "قبل العمل أو أثناء التشويش الذهني"
  },
  {
    id: "breath",
    title: "تنفّس وتهدئة",
    durationMinutes: 12,
    tone: "recovery",
    description: "جلسة أبطأ لتخفيف الحمل الذهني وإعادة التنظيم.",
    useCase: "بعد نقاش أو ضغط عاطفي"
  },
  {
    id: "sleep",
    title: "استعداد للنوم",
    durationMinutes: 18,
    tone: "sleep",
    description: "إيقاع منخفض ومساحة للتهدئة قبل النوم.",
    useCase: "قبل النوم أو بعد يوم طويل"
  }
];

const TONE_STYLES: Record<SessionTone, { label: string; accent: string; tint: string; glow: string; icon: FC<{ className?: string }> }> = {
  focus: { label: "تركيز", accent: "#38bdf8", tint: "rgba(56,189,248,0.12)", glow: "rgba(56,189,248,0.20)", icon: Sparkles },
  recovery: { label: "استرجاع", accent: "#34d399", tint: "rgba(52,211,153,0.12)", glow: "rgba(52,211,153,0.18)", icon: Waves },
  sleep: { label: "نوم", accent: "#a78bfa", tint: "rgba(167,139,250,0.12)", glow: "rgba(167,139,250,0.18)", icon: MoonStar },
};

interface MeditationSessionPlayerProps {
  onBack: () => void;
  onOpenCompletionSummary: () => void;
}

interface SessionCompletionSummaryProps {
  session: MeditationSession;
  elapsedSeconds: number;
  smartTimerEnabled: boolean;
  smartTimerMinutes: number;
  wakeFadeMinutes: number;
  onReplay: () => void;
  onBackToLibrary: () => void;
  onOpenCompletionSummary: () => void;
}

function SessionCompletionSummary({
  session,
  elapsedSeconds,
  smartTimerEnabled,
  smartTimerMinutes,
  wakeFadeMinutes,
  onReplay,
  onBackToLibrary,
  onOpenCompletionSummary
}: SessionCompletionSummaryProps) {
  const totalMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const smartTimerLabel = smartTimerEnabled ? `${smartTimerMinutes} دقيقة` : "موقف";

  return (
    <motion.section
      className="glass-heavy rounded-[2rem] p-5 md:p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderColor: "rgba(125,211,252,0.18)" }}
    >
      <div className="text-right">
        <p className="text-xs uppercase tracking-[0.28em] text-white/45">Session Completion Summary</p>
        <h2 className="mt-2 text-2xl font-black text-white">انتهت الجلسة بوضوح أهدأ</h2>
        <p className="mt-2 text-sm leading-7 text-white/65">
          {session.title} اكتملت بنجاح. هذا ملخص سريع لما نفذته خلال الجلسة.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/4 p-3 text-right">
          <p className="text-[11px] text-white/50">المدة</p>
          <p className="mt-1 text-lg font-black text-white">{totalMinutes} دقيقة</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/4 p-3 text-right">
          <p className="text-[11px] text-white/50">النغمة</p>
          <p className="mt-1 text-lg font-black text-white">{session.tone === "focus" ? "تركيز" : session.tone === "recovery" ? "استرجاع" : "نوم"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/4 p-3 text-right">
          <p className="text-[11px] text-white/50">Smart Timer</p>
          <p className="mt-1 text-lg font-black text-white">{smartTimerLabel}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/4 p-3 text-right">
          <p className="text-[11px] text-white/50">Gentle Wake</p>
          <p className="mt-1 text-lg font-black text-white">{wakeFadeMinutes > 0 ? `${wakeFadeMinutes} دقائق` : "موقف"}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-cyan-400/15 bg-cyan-400/8 p-4 text-right">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">النتيجة</p>
        <p className="mt-2 text-sm leading-7 text-white/75">
          استمر الإيقاع الهادئ حتى النهاية، ثم تم إنهاء الجلسة بشكل تدريجي بدل القطع المفاجئ.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, #38bdf8, #14b8a6)" }}
        >
          <RotateCcw className="w-4 h-4" />
          إعادة الجلسة
        </button>
        <button
          type="button"
          onClick={onOpenCompletionSummary}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Sparkles className="w-4 h-4" />
          فتح ملخص مستقل
        </button>
        <button
          type="button"
          onClick={onBackToLibrary}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للمشغل
        </button>
      </div>
    </motion.section>
  );
}

export const MeditationSessionPlayer: FC<MeditationSessionPlayerProps> = ({ onBack, onOpenCompletionSummary }) => {
  const [selectedSessionId, setSelectedSessionId] = useState(SESSIONS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const [smartTimerEnabled, setSmartTimerEnabled] = useState(true);
  const [smartTimerMinutes, setSmartTimerMinutes] = useState(30);
  const [wakeFadeMinutes, setWakeFadeMinutes] = useState(3);

  const selectedSession = useMemo(
    () => SESSIONS.find((session) => session.id === selectedSessionId) ?? SESSIONS[0],
    [selectedSessionId]
  );

  const selectedTone = TONE_STYLES[selectedSession.tone];
  const totalSeconds = selectedSession.durationMinutes * 60;
  const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);
  const progress = Math.min(elapsedSeconds / totalSeconds, 1);
  const smartTimerSeconds = smartTimerEnabled ? smartTimerMinutes * 60 : null;

  const triggerSessionSound = (tone: SessionTone) => {
    if (tone === "focus") {
      soundManager.playEffect("cosmic_pulse");
      return;
    }
    if (tone === "recovery") {
      soundManager.playEffect("harmony");
      return;
    }
    soundManager.playEffect("celebration");
  };

  useEffect(() => {
    if (!isPlaying) return;
    soundManager.startAmbientCommunity();
    const interval = window.setInterval(() => {
      setElapsedSeconds((previous) => {
        const next = previous + 1;
        const maxSeconds = selectedSession.durationMinutes * 60;
        const limitSeconds = smartTimerSeconds ?? maxSeconds;
        const stopAtSeconds = Math.min(maxSeconds, limitSeconds);
        const hitSmartTimer =
          smartTimerEnabled &&
          smartTimerSeconds !== null &&
          smartTimerSeconds < maxSeconds &&
          next >= smartTimerSeconds;
        if (next >= stopAtSeconds) {
          window.clearInterval(interval);
          setIsPlaying(false);
          setShowCompletionSummary(true);
          if (hitSmartTimer && wakeFadeMinutes > 0) {
            soundManager.playEffect("harmony");
          }
          return stopAtSeconds;
        }
        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
      soundManager.stopAmbientCommunity();
    };
  }, [isPlaying, selectedSession.durationMinutes, smartTimerEnabled, smartTimerSeconds, wakeFadeMinutes]);

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        setShowCompletionSummary(false);
        triggerSessionSound(selectedSession.tone);
      } else {
        soundManager.stopAmbientCommunity();
      }
      return next;
    });
  };

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    setShowCompletionSummary(false);
    soundManager.stopAmbientCommunity();
  };

  const handleTimerPreset = (minutes: number) => {
    setSmartTimerEnabled(true);
    setSmartTimerMinutes(minutes);
  };

  const handleSeek = (deltaSeconds: number) => {
    setElapsedSeconds((previous) => {
      const next = Math.max(0, Math.min(totalSeconds, previous + deltaSeconds));
      if (next === totalSeconds) {
        setIsPlaying(false);
        soundManager.stopAmbientCommunity();
      }
      return next;
    });
  };

  const handleNextSession = () => {
    const currentIndex = SESSIONS.findIndex((session) => session.id === selectedSessionId);
    const nextSession = SESSIONS[(currentIndex + 1) % SESSIONS.length];
    setSelectedSessionId(nextSession.id);
    setIsPlaying(false);
    setElapsedSeconds(0);
    setShowCompletionSummary(false);
    soundManager.stopAmbientCommunity();
    triggerSessionSound(nextSession.tone);
  };

  const handlePreviousSession = () => {
    const currentIndex = SESSIONS.findIndex((session) => session.id === selectedSessionId);
    const previousSession = SESSIONS[(currentIndex - 1 + SESSIONS.length) % SESSIONS.length];
    setSelectedSessionId(previousSession.id);
    setIsPlaying(false);
    setElapsedSeconds(0);
    setShowCompletionSummary(false);
    soundManager.stopAmbientCommunity();
    triggerSessionSound(previousSession.tone);
  };

  return (
    <motion.main
      className="min-h-screen px-4 py-6 md:py-10 relative overflow-hidden"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: "linear-gradient(180deg, var(--space-void) 0%, var(--space-deep) 55%, var(--space-950) 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(circle at 50% 20%, rgba(20,184,166,0.14), transparent 34%), radial-gradient(circle at 50% 70%, rgba(124,58,237,0.12), transparent 28%)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "42px 42px", opacity: 0.55 }} />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="glass-button inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-colors sm:w-auto"
            style={{ color: "var(--brand-white)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </button>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.38)" }}>
              مشغل جلسات التأمل
            </p>
            <h1 className="text-xl font-black text-white sm:text-2xl md:text-3xl">اختر الجلسة ثم ابدأ</h1>
          </div>
        </div>

        {showCompletionSummary ? (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <SessionCompletionSummary
              session={selectedSession}
              elapsedSeconds={elapsedSeconds}
              smartTimerEnabled={smartTimerEnabled}
              smartTimerMinutes={smartTimerMinutes}
              wakeFadeMinutes={wakeFadeMinutes}
              onReplay={handleReset}
              onBackToLibrary={onBack}
              onOpenCompletionSummary={() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("dawayir-meditation-completion-summary", JSON.stringify({
                    sessionTitle: selectedSession.title,
                    sessionTone: selectedSession.tone,
                    elapsedSeconds,
                    smartTimerEnabled,
                    smartTimerMinutes,
                    wakeFadeMinutes
                  }));
                }
                onOpenCompletionSummary();
              }}
            />
            <section className="glass-card rounded-[2rem] p-4 sm:p-5 md:p-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-white/65">الاستعداد للجلسة التالية</p>
                <h3 className="mt-1 text-lg font-black text-white sm:text-xl">يمكنك اختيار جلسة أخرى أو إعادة نفس المسار</h3>
              </div>
              <div className="mt-4 space-y-3">
                {SESSIONS.map((session) => {
                  const tone = TONE_STYLES[session.tone];
                  const SessionIcon = tone.icon;
                  const isActive = session.id === selectedSessionId;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setShowCompletionSummary(false);
                        setIsPlaying(false);
                        setElapsedSeconds(0);
                        soundManager.stopAmbientCommunity();
                      }}
                      className="w-full rounded-2xl border px-4 py-3 text-right transition-all"
                      style={{
                        background: isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                        borderColor: isActive ? tone.accent : "rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: tone.tint, color: tone.accent }}>
                          <SessionIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="text-base font-bold text-white">{session.title}</h4>
                            <span className="text-xs font-semibold text-white/55">{session.durationMinutes} دقيقة</span>
                          </div>
                          <p className="mt-1 text-xs leading-6 text-white/60">{session.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-card rounded-[2rem] p-4 sm:p-5 md:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: "var(--soft-teal)" }}>{selectedTone.label}</p>
                <h2 className="mt-1 text-lg font-black text-white sm:text-xl md:text-2xl">{selectedSession.title}</h2>
                <p className="mt-2 text-sm leading-7" style={{ color: "rgba(255,255,255,0.55)" }}>{selectedSession.description}</p>
              </div>
              <div className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center glass" style={{ color: selectedTone.accent, boxShadow: `0 0 0 1px ${selectedTone.glow}` }}>
                <selectedTone.icon className="w-7 h-7" />
              </div>
            </div>

            <div className="mb-5 rounded-[1.5rem] p-4 glass" style={{ borderColor: selectedTone.glow, background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,0.42)" }}>
                    قالب الجلسة
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">{selectedSession.useCase}</p>
                </div>
                <div className="relative h-16 w-16 shrink-0">
                  <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${selectedTone.glow}, transparent 70%)` }} />
                  <div className="absolute inset-2 rounded-full border" style={{ borderColor: selectedTone.accent, opacity: 0.9 }} />
                  <div className="absolute inset-5 rounded-full" style={{ background: selectedTone.accent, opacity: 0.85 }} />
                </div>
              </div>
            </div>

            <div className="glass-heavy rounded-[1.75rem] p-5 md:p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="mb-4 flex items-center justify-between text-sm text-white/70">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="w-4 h-4" />
                  {selectedSession.durationMinutes} دقيقة
                </span>
                <span className="inline-flex items-center gap-2">
                  <Music2 className="w-4 h-4" />
                  وضع هادئ
                </span>
              </div>

              <div className="relative mx-auto aspect-square max-w-[300px] sm:max-w-[340px]">
                <motion.div
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                />
                <motion.div
                  className="absolute inset-5 rounded-full border"
                  style={{ borderColor: selectedTone.accent, boxShadow: `0 0 48px ${selectedTone.accent}22` }}
                  animate={{ scale: isPlaying ? [1, 1.03, 1] : 1 }}
                  transition={{ duration: 2.4, repeat: isPlaying ? Infinity : 0, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                  <div className="text-[11px] uppercase tracking-[0.35em] text-white/60">
                    {isPlaying ? "يعمل الآن" : "متوقف"}
                  </div>
                  <div className="mt-2 text-4xl font-black sm:text-5xl" style={{ color: selectedTone.accent }}>
                    {Math.floor(remainingSeconds / 60).toString().padStart(2, "0")}:
                    {Math.floor(remainingSeconds % 60).toString().padStart(2, "0")}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    تنفّس ببطء. دع الشاشة تحمل الإيقاع بدل أن تطلب منك مجهودًا إضافيًا.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-white/65">
                    <span>منقضي: {Math.floor(elapsedSeconds / 60).toString().padStart(2, "0")}:{Math.floor(elapsedSeconds % 60).toString().padStart(2, "0")}</span>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span>متبقي: {Math.floor(remainingSeconds / 60).toString().padStart(2, "0")}:{Math.floor(remainingSeconds % 60).toString().padStart(2, "0")}</span>
                  </div>
                </div>
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={selectedTone.accent}
                    strokeLinecap="round"
                    strokeWidth="4"
                    strokeDasharray={`${progress * 326} 326`}
                  />
                </svg>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.01] sm:col-span-1"
                  style={{ background: selectedTone.accent }}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "إيقاف مؤقت" : "ابدأ الجلسة"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <RotateCcw className="w-4 h-4" />
                  إعادة
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
                <button
                  type="button"
                  onClick={handlePreviousSession}
                  className="rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4"
                  style={{ background: "rgba(56,189,248,0.08)", color: "#7dd3fc", border: "1px solid rgba(125,211,252,0.18)" }}
                >
                  الجلسة السابقة
                </button>
                <button
                  type="button"
                  onClick={() => handleSeek(-10)}
                  className="rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4"
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  -10 ثوانٍ
                </button>
                <button
                  type="button"
                  onClick={() => handleSeek(10)}
                  className="rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4"
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  +10 ثوانٍ
                </button>
                <button
                  type="button"
                  onClick={handleNextSession}
                  className="rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:px-4"
                  style={{ background: "rgba(56,189,248,0.08)", color: "#7dd3fc", border: "1px solid rgba(125,211,252,0.18)" }}
                >
                  الجلسة التالية
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2">
                  <TimerReset className="w-4 h-4" />
                  تقدّم الجلسة
                </span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: selectedTone.accent, width: `${Math.max(progress * 100, 7)}%` }}
                  animate={{ opacity: isPlaying ? [0.9, 1, 0.9] : 1 }}
                  transition={{ duration: 2.4, repeat: isPlaying ? Infinity : 0, ease: "easeInOut" }}
                />
              </div>
            </div>
          </section>

          <section className="glass-card rounded-[2rem] p-4 sm:p-5 md:p-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-white/65">الجلسات المتاحة</p>
              <h3 className="mt-1 text-lg font-black text-white sm:text-xl">اختر ما يناسب حالتك</h3>
            </div>

            <div className="mt-4 rounded-2xl p-4 glass" style={{ borderColor: "rgba(56,189,248,0.14)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/60">Smart Timer</p>
                  <h4 className="mt-1 text-sm font-bold text-white">إنهاء تلقائي + منبه تدريجي</h4>
                  <p className="mt-1 text-xs leading-6 text-white/65">
                    اختر مدة ثابتة للجلسة، ثم فعّل تدرج الاستيقاظ لو الجلسة هتنتهي بنعومة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSmartTimerEnabled((prev) => !prev)}
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
                  style={{
                    background: smartTimerEnabled ? "rgba(56,189,248,0.14)" : "rgba(255,255,255,0.05)",
                    color: smartTimerEnabled ? "#7dd3fc" : "rgba(255,255,255,0.72)",
                    border: "1px solid rgba(125,211,252,0.18)",
                  }}
                >
                  {smartTimerEnabled ? "مفعل" : "متوقف"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[15, 30, 60].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => handleTimerPreset(minutes)}
                    className="rounded-full px-3 py-2 text-xs font-semibold transition-colors"
                    style={{
                      background: smartTimerMinutes === minutes ? "rgba(56,189,248,0.14)" : "rgba(255,255,255,0.04)",
                      color: smartTimerMinutes === minutes ? "#7dd3fc" : "rgba(255,255,255,0.78)",
                      border: `1px solid ${smartTimerMinutes === minutes ? "rgba(125,211,252,0.2)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    {minutes === 60 ? "1 ساعة" : `${minutes} دقيقة`}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-2 grid grid-cols-3 gap-2 text-[11px] text-white/60">
                  <span>1 دقيقة</span>
                  <span className="text-center">{smartTimerMinutes} دقيقة</span>
                  <span className="text-left">60 دقيقة</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  value={smartTimerMinutes}
                  onChange={(event) => {
                    setSmartTimerEnabled(true);
                    setSmartTimerMinutes(Number(event.target.value));
                  }}
                  className="w-full accent-sky-300"
                />
              </div>

              <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">منبه الاستيقاظ التدريجي</p>
                    <p className="text-xs leading-6 text-white/60">الصوت يرتفع تدريجيًا في النهاية بدل ما يقطع الحالة فجأة.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWakeFadeMinutes((minutes) => (minutes > 0 ? 0 : 3))}
                    className="inline-flex w-full sm:w-auto items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors"
                    style={{
                      background: wakeFadeMinutes > 0 ? "rgba(52,211,153,0.14)" : "rgba(255,255,255,0.05)",
                      color: wakeFadeMinutes > 0 ? "#86efac" : "rgba(255,255,255,0.72)",
                      border: "1px solid rgba(134,239,172,0.18)",
                    }}
                  >
                    {wakeFadeMinutes > 0 ? "مفعل" : "متوقف"}
                  </button>
                </div>
                <div className="mt-3">
                  <div className="mb-2 grid grid-cols-3 gap-2 text-[11px] text-white/60">
                    <span>1 دقيقة</span>
                    <span className="text-center">{wakeFadeMinutes} دقائق</span>
                    <span className="text-left">10 دقائق</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={wakeFadeMinutes}
                    onChange={(event) => setWakeFadeMinutes(Number(event.target.value))}
                    className="w-full accent-emerald-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {SESSIONS.map((session) => {
                const tone = TONE_STYLES[session.tone];
                const SessionIcon = tone.icon;
                const isActive = session.id === selectedSessionId;

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setIsPlaying(false);
                      setElapsedSeconds(0);
                      soundManager.stopAmbientCommunity();
                      triggerSessionSound(session.tone);
                    }}
                    className="w-full rounded-2xl p-4 text-right transition-all"
                    style={{
                      background: isActive ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? "rgba(20,184,166,0.28)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tone.accent}18`, color: tone.accent }}>
                          <SessionIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white">{session.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${tone.accent}15`, color: tone.accent }}>
                              {tone.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-white/70">{session.description}</p>
                          <p className="mt-2 text-[11px] font-medium text-white/55">
                            مناسب لـ: {session.useCase}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-white/60 sm:text-left">
                        {session.durationMinutes} دقيقة
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl p-4 text-right glass" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                ملاحظة
              </p>
              <p className="mt-2 text-sm leading-7 text-white/75">
                هذه الصفحة مستقلة عن تأريض الجسم. الهدف هنا تشغيل جلسة تأمل واضحة، ثم الرجوع بسرعة إذا أردت.
              </p>
            </div>
          </section>
          </div>
        )}
      </div>
    </motion.main>
  );
};
