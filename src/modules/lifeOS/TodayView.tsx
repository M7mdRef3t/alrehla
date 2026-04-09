"use client";

/**
 * ☀️ TodayView — واجهة "يومك النهاردة"
 * =======================================
 * الشاشة الرئيسية اللي المستخدم يفتحها أول ما يصحى.
 * بتتكيف حسب الوقت: صباح / نهار / مساء.
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Sunset, CheckCircle2, Circle, Flame,
  Plus, Sparkles, Zap, Trophy, Battery, BatteryLow, BatteryMedium, Award, ShoppingBag,
} from "lucide-react";
import { useRitualState } from "@/state/ritualState";
import { useLifeState } from "@/state/lifeState";
import { usePulseState } from "@/state/pulseState";
import { useAppOverlayState } from "@/state/appOverlayState";
import { useGamificationState } from "@/state/gamificationState";
import { useShakeDetection } from "@/hooks/useShakeDetection";
import { isUserMode } from "@/config/appEnv";
import { QuickActions } from "./QuickActions";
import type { QuickAction } from "@/services/ritualsEngine";
import {
  getTodayRituals,
  getDailyCompletionStats,
  suggestDayTheme,
  generateQuickActions,
  type RitualWithStatus,
} from "@/services/ritualsEngine";
import {
  getCurrentTimeOfDay,
  DAY_THEME_CONFIG,
  PRESET_RITUALS,
  type DayTheme,
  type TimeOfDay,
} from "@/types/dailyRituals";
import { getDomainConfig, type LifeDomainId } from "@/types/lifeDomains";
import { resolveDisplayName } from "@/services/userMemory";


interface TodayViewProps {
  onOpenCapture?: () => void;
  onOpenDecisions?: () => void;
  onOpenAssessment?: () => void;
  onOpenEveningReview?: () => void;
}

// ─── Energy Badge ─────────────────────────────────────────────────
function EnergyBadge({ energy, onClick }: { energy: number | null; onClick: () => void }) {
  const getEnergyData = (e: number | null) => {
    if (e === null) return { icon: <Battery className="w-3.5 h-3.5" />, label: "سجّل طاقتك", color: "rgba(255,255,255,0.2)" };
    if (e <= 3) return { icon: <BatteryLow className="w-3.5 h-3.5" />, label: `${e}/10`, color: "#f87171" };
    if (e <= 6) return { icon: <BatteryMedium className="w-3.5 h-3.5" />, label: `${e}/10`, color: "#f59e0b" };
    return { icon: <Battery className="w-3.5 h-3.5" />, label: `${e}/10`, color: "#10b981" };
  };
  const d = getEnergyData(energy);
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all"
      style={{ background: `${d.color}12`, border: `1px solid ${d.color}30`, color: d.color }}
    >
      {d.icon}
      <span className="text-[10px] font-bold whitespace-nowrap">{d.label}</span>
    </button>
  );
}

// ─── Time-based Greeting ─────────────────────────────────────────
function getTimeGreeting(): { text: string; icon: React.ReactNode; bg: string } {
  const hour = new Date().getHours();
  const name = resolveDisplayName();
  const greeting = name ? `يا ${name}` : "";

  if (hour >= 5 && hour < 12) {
    return {
      text: `صباح الخير ${greeting}`,
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      bg: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04))",
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      text: `إيه أخبارك ${greeting}`,
      icon: <Sunset className="w-5 h-5 text-orange-400" />,
      bg: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04))",
    };
  }
  return {
    text: `مساء الخير ${greeting}`,
    icon: <Moon className="w-5 h-5 text-indigo-400" />,
    bg: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(79,70,229,0.04))",
  };
}

// ─── Ritual Item ─────────────────────────────────────────────────
function RitualItem({
  ritual,
  onToggle,
}: {
  ritual: RitualWithStatus;
  onToggle: (id: string) => void;
}) {
  const domainConfig = getDomainConfig(ritual.domainId);

  return (
    <motion.button
      className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl transition-all group text-right"
      style={{
        background: ritual.isCompletedToday
          ? "rgba(16,185,129,0.06)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${
          ritual.isCompletedToday
            ? "rgba(16,185,129,0.2)"
            : "rgba(255,255,255,0.05)"
        }`,
      }}
      onClick={() => onToggle(ritual.id)}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Check */}
      <div className="shrink-0">
        {ritual.isCompletedToday ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <Circle className="w-5 h-5 text-white/15 group-hover:text-white/30 transition-colors" />
        )}
      </div>

      {/* Icon */}
      <span className="text-lg shrink-0">{ritual.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-bold transition-all ${
            ritual.isCompletedToday
              ? "text-white/30 line-through"
              : "text-white/80"
          }`}
        >
          {ritual.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-white/20 font-mono">
            {domainConfig.icon} {domainConfig.label}
          </span>
          {ritual.estimatedMinutes > 0 && (
            <span className="text-[9px] text-white/15 font-mono">
              {ritual.estimatedMinutes}د
            </span>
          )}
        </div>
      </div>

      {/* Streak badge */}
      {ritual.streak.currentStreak > 1 && (
        <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 shrink-0">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-black font-mono text-orange-300">
            {ritual.streak.currentStreak}
          </span>
        </div>
      )}
    </motion.button>
  );
}

// ─── Progress Ring ───────────────────────────────────────────────
function ProgressRing({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={percentage >= 80 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#8b5cf6"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset: offset,
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            strokeDashoffset: { duration: 1, ease: "easeOut" },
            opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        />
      </svg>
      <button 
        onClick={() => useAppOverlayState.getState().setOverlay("evolutionHub", true)}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="text-xl font-black text-white font-mono">{percentage}%</span>
        <span className="text-[8px] text-white/25 font-bold uppercase tracking-wider">يومك</span>
      </button>
    </div>
  );
}

// ─── Add Ritual Sheet ────────────────────────────────────────────
function AddRitualSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const addPresetRitual = useRitualState((s) => s.addPresetRitual);
  const addRitual = useRitualState((s) => s.addRitual);
  const existingRituals = useRitualState((s) => s.rituals);
  const existingNames = new Set(existingRituals.map((r) => r.name));

  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const availablePresets = PRESET_RITUALS.filter(
    (p) => !existingNames.has(p.name)
  );

  const handleAddPreset = (preset: (typeof PRESET_RITUALS)[number]) => {
    addPresetRitual(preset);
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    addRitual({
      name: customName.trim(),
      icon: "✨",
      domainId: "self",
      targetTime: "anytime",
      frequency: "daily",
      estimatedMinutes: 10,
      isActive: true,
    });
    setCustomName("");
    setShowCustom(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden max-h-[75vh] overflow-y-auto"
        style={{
          background: "#0c0c1a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        dir="rtl"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white">أضف عادة جديدة</h3>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 text-sm font-bold"
            >
              إغلاق
            </button>
          </div>

          {/* Preset categories */}
          {["essential", "growth", "wellness"].map((cat) => {
            const catPresets = availablePresets.filter((p) => p.category === cat);
            if (catPresets.length === 0) return null;
            const catLabels: Record<string, string> = {
              essential: "أساسية",
              growth: "نمو",
              wellness: "صحة ورفاهية",
            };
            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-[10px] font-black text-white/25 uppercase tracking-[0.15em]">
                  {catLabels[cat]}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {catPresets.map((preset) => (
                    <button
                      key={preset.name}
                      className="flex items-center gap-2 p-3 rounded-xl text-right transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                      onClick={() => handleAddPreset(preset)}
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white/70 truncate">
                          {preset.name}
                        </p>
                        {preset.estimatedMinutes > 0 && (
                          <p className="text-[9px] text-white/20 font-mono">
                            {preset.estimatedMinutes} دقيقة
                          </p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-white/20" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Custom */}
          <div className="space-y-2">
            {showCustom ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="اسم العادة..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white placeholder:text-white/20 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                />
                <button
                  onClick={handleAddCustom}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                  }}
                >
                  أضف
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-violet-400 transition-all"
                style={{
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.15)",
                }}
              >
                <Plus className="w-4 h-4" />
                عادة مخصصة
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main TodayView ──────────────────────────────────────────────
import { useEveningNudge } from "@/hooks/useEveningNudge";

export function TodayView({
  onOpenCapture,
  onOpenDecisions,
  onOpenAssessment,
  onOpenEveningReview,
}: TodayViewProps) {
  const [isAddRitualOpen, setIsAddRitualOpen] = useState(false);

  // Pulse — كيفية فتح النبضة الفعلية
  const setPulseCheck = useAppOverlayState((s) => s.setPulseCheck);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const handleOpenPulse = useCallback(() => {
    setPulseCheck(true, "regular");
  }, [setPulseCheck]);

  // Energy من آخر نبضة
  const currentEnergy = lastPulse?.energy ?? null;

  // State
  const rituals = useRitualState((s) => s.rituals);
  const logs = useRitualState((s) => s.logs);
  const logCompletion = useRitualState((s) => s.logCompletion);
  const undoCompletion = useRitualState((s) => s.undoCompletion);
  const plan = useRitualState((s) => s.getTodayPlan());
  const lifeScore = useLifeState((s) => s.lifeScore);
  const pendingDecisions = useLifeState((s) => s.getPendingDecisions().length);

  // Computed
  const todayRituals = useMemo(() => getTodayRituals(rituals, logs), [rituals, logs]);
  const stats = useMemo(() => getDailyCompletionStats(todayRituals), [todayRituals]);
  const [selectedDomain, setSelectedDomain] = useState<LifeDomainId | null>(null);
  const greeting = useMemo(() => getTimeGreeting(), []);
  const timeOfDay = useMemo(() => getCurrentTimeOfDay(), []);
  const quickActions = useMemo(
    () => generateQuickActions(todayRituals, plan, lifeScore, false, pendingDecisions),
    [todayRituals, plan, lifeScore, pendingDecisions]
  );

  // Evening Nudge — reminder بعد 8م لو مالكملش المراجعة
  const { shouldShow: showEveningNudge, dismiss: dismissNudge, openReview: openEveningFromNudge } =
    useEveningNudge(onOpenEveningReview);

  // Handlers
  const handleToggleRitual = useCallback(
    (ritualId: string) => {
      const isCompleted = logs.some(
        (l) => l.ritualId === ritualId && l.logDate === new Date().toISOString().slice(0, 10)
      );
      if (isCompleted) {
        undoCompletion(ritualId);
      } else {
        logCompletion(ritualId);
      }
    },
    [logs, logCompletion, undoCompletion]
  );

  const handleQuickAction = (qa: QuickAction) => {
    switch (qa.action) {
      case "pulse":
        setPulseCheck(true, "regular");
        break;
      case "capture":
        onOpenCapture?.();
        break;
      case "decision":
        onOpenCapture?.();
        break;
      case "rest":
        onOpenCapture?.();
        break;
      case "focus":
        onOpenCapture?.();
        break;
      case "assessment":
        onOpenAssessment?.();
        break;
      case "evening-review":
        onOpenEveningReview?.();
        break;
      case "morning-start":
        useRitualState.getState().startMorning();
        break;
    }
  };
  
  const handleSimulateJarvis = () => {
    // 1. Set low energy
    usePulseState.getState().logPulse({ energy: 2, mood: "overwhelmed", focus: "body" });
    // 2. Clear shown nudges to allow re-triggering
    localStorage.removeItem("dawayir-nudges-shown");
    // 3. Force a reload or wait for next check (which is every 8s in AppOverlayHost/AppMindSignals)
    // Actually, just changing the state might not trigger it immediately if the timer already ran.
    // The user might need to wait 8s.
    alert("تم محاكاة انخفاض الطاقة. انتظر 8 ثوانٍ داخل التطبيق ليقوم جارفيس بالتدخل.");
  };

  // ─── Phase 3: Shake to Intervene ────────────────────────────────
  useShakeDetection(useCallback(() => {
    // Trigger a high-priority "Grounding" nudge when shake is detected
    // This makes Jarvis feel like he is physically reactive to the user's tremor/stress
    if (currentEnergy && currentEnergy <= 4) {
      alert("جارفيس: لاحظت إنك مهزوز شوية.. خد نَفَس عميق.");
      // We could also trigger a specific nudge here if the nudge engine supported direct firing
    }
  }, [currentEnergy]));

  // Group rituals by time
  const morningRituals = todayRituals.filter((r) => r.targetTime === "morning");
  const afternoonRituals = todayRituals.filter((r) => r.targetTime === "afternoon");
  const eveningRituals = todayRituals.filter((r) => r.targetTime === "evening");
  const anytimeRituals = todayRituals.filter((r) => r.targetTime === "anytime");

  const timeGroups: { id: TimeOfDay; label: string; icon: React.ReactNode; rituals: RitualWithStatus[] }[] = [
    { id: "morning" as const, label: "الصباح", icon: <Sun className="w-3.5 h-3.5 text-amber-400" />, rituals: morningRituals },
    { id: "afternoon" as const, label: "الظهر", icon: <Sunset className="w-3.5 h-3.5 text-orange-400" />, rituals: afternoonRituals },
    { id: "evening" as const, label: "المساء", icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />, rituals: eveningRituals },
    { id: "anytime" as const, label: "أي وقت", icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, rituals: anytimeRituals },
  ].filter((g) => g.rituals.length > 0);

  // Day theme
  const dayTheme = plan?.dayTheme
    ? DAY_THEME_CONFIG[plan.dayTheme]
    : null;

  return (
    <div className="space-y-5">
      {/* Greeting + Progress */}
      <motion.div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: greeting.bg,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {greeting.icon}
              <h2 className="text-lg font-black text-white">{greeting.text}</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Energy Badge — يفتح نبضة الطاقة */}
              <EnergyBadge energy={currentEnergy} onClick={handleOpenPulse} />

              {/* Level Badge — يفتح مركز التطور */}
              <button
                onClick={() => useAppOverlayState.getState().setOverlay("evolutionHub", true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all shadow-lg shadow-black/20"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-amber-100 font-mono">Lvl {useGamificationState.getState().level}</span>
              </button>

              {/* Simulation Trigger (Dev Only) */}
              {!isUserMode && (
                <button
                  onClick={handleSimulateJarvis}
                  className="p-1 rounded-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                  title="محاكاة انخفاض الطاقة"
                >
                  <Zap className="w-3 h-3 text-red-500" />
                </button>
              )}
            </div>

            {/* Day theme badge */}
            {dayTheme && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  background: `${dayTheme.color}10`,
                  border: `1px solid ${dayTheme.color}25`,
                }}
              >
                <span className="text-xs">{dayTheme.icon}</span>
                <span className="text-[10px] font-bold" style={{ color: dayTheme.color }}>
                  {dayTheme.label}
                </span>
              </div>
            )}

            {/* Today stats */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/40 font-medium">
                {stats.completed}/{stats.total} عادة مكتملة
              </span>
              {plan?.topPriorities && plan.topPriorities.length > 0 && (
                <span className="text-[11px] text-white/30 font-medium">
                  · {plan.topPriorities.filter((p) => p.isCompleted).length}/{plan.topPriorities.length} أولوية
                </span>
              )}
            </div>
          </div>

          {/* Daily Progress Ring */}
          <ProgressRing percentage={stats.percentage} size={80} />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} onAction={handleQuickAction} />


      {/* Priorities */}
      {plan && plan.topPriorities.length > 0 && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-[10px] font-black text-white/25 uppercase tracking-[0.15em]">
            أولويات اليوم
          </h3>
          <div className="space-y-1.5">
            {plan.topPriorities.map((p) => {
              const domainConfig = getDomainConfig(p.domainId);
              return (
                <button
                  key={p.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-right"
                  style={{
                    background: p.isCompleted
                      ? "rgba(16,185,129,0.05)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${
                      p.isCompleted
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(255,255,255,0.05)"
                    }`,
                  }}
                  onClick={() => useRitualState.getState().togglePriority(p.id)}
                >
                  {p.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-white/15 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-bold flex-1 ${
                      p.isCompleted ? "text-white/30 line-through" : "text-white/60"
                    }`}
                  >
                    {p.text}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: domainConfig.color }}>
                    {domainConfig.icon}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Rituals by Time */}
      {todayRituals.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-white/25 uppercase tracking-[0.15em]">
              عاداتك
            </h3>
            <button
              onClick={() => setIsAddRitualOpen(true)}
              className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة
            </button>
          </div>

          {timeGroups.map((group, gi) => (
            <motion.div
              key={group.id}
              className="space-y-1.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + gi * 0.05 }}
            >
              {/* Time group label */}
              <div className="flex items-center gap-2 px-1">
                {group.icon}
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">
                  {group.label}
                </span>
                {group.id === timeOfDay && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-violet-500/15 text-violet-400 border border-violet-500/20">
                    الآن
                  </span>
                )}
              </div>

              {/* Rituals list */}
              <div className="space-y-1">
                {group.rituals.map((r) => (
                  <RitualItem
                    key={r.id}
                    ritual={r}
                    onToggle={handleToggleRitual}
                  />
                ))}
              </div>
            </motion.div>
          ))}

          {/* Completion celebration */}
          {stats.percentage === 100 && stats.total > 0 && (
            <motion.div
              className="rounded-2xl p-5 text-center space-y-2"
              style={{
                background: "rgba(16,185,129,0.06)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Trophy className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-black text-emerald-400">كل العادات مكتملة! 🎉</p>
              <p className="text-xs text-white/30">يوم عظيم — افتخر بنفسك</p>
            </motion.div>
          )}
        </div>
      ) : (
        /* Empty state — First time */
        <motion.div
          className="rounded-3xl p-8 text-center space-y-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-violet-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">ابدأ ببناء عاداتك</h3>
            <p className="text-xs text-white/30 leading-relaxed">
              أضف عادات يومية عشان المنصة تقدر تخطط يومك وتتابع تقدمك
            </p>
          </div>
          <button
            onClick={() => setIsAddRitualOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
              boxShadow: "0 4px 20px rgba(139,92,246,0.3)",
            }}
          >
            <Plus className="w-4 h-4" />
            أضف أول عادة
          </button>
        </motion.div>
      )}

      {/* Add Ritual Sheet */}
      <AnimatePresence>
        {isAddRitualOpen && (
          <AddRitualSheet
            isOpen={isAddRitualOpen}
            onClose={() => setIsAddRitualOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Evening Nudge Banner */}
      <AnimatePresence>
        {showEveningNudge && (
          <motion.div
            className="rounded-2xl p-4 flex items-center justify-between gap-3"
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🌙</span>
              <div>
                <p className="text-sm font-bold text-white/80">وقت مراجعة يومك</p>
                <p className="text-[10px] text-white/30">دقيقتين بس — راجع يومك قبل ما تنام</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={openEveningFromNudge}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all"
                style={{ background: "rgba(99,102,241,0.3)", border: "1px solid rgba(99,102,241,0.4)" }}
              >
                ابدأ
              </button>
              <button
                onClick={dismissNudge}
                className="text-white/20 hover:text-white/40 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
