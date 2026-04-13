import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle, Flame, Calendar, Trophy } from "lucide-react";
import { useRitualState } from "@/domains/journey/store/ritual.store";

export const RitualTrackerBoard: React.FC = () => {
  const { rituals, logs, perfectDayStreak, logCompletion, undoCompletion, getTodayLogs, getActiveRituals, isRitualCompletedToday } = useRitualState();

  const activeRituals = getActiveRituals();
  const todayLogs = getTodayLogs();
  const progress = activeRituals.length > 0 ? Math.round((todayLogs.length / activeRituals.length) * 100) : 0;
  
  // Weekly Heatmap Data (Last 7 days)
  const heatmapDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayLogs = logs.filter(l => l.logDate === dateStr).length;
    const intensity = activeRituals.length > 0 ? dayLogs / activeRituals.length : 0;
    return { date: dateStr, intensity };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-white to-white/70">
            لوحة العادات
          </h2>
          <p className="text-sm text-white/50 mt-1">
            يومك المثالي بيبدأ بخطوات صغيرة مستمرة
          </p>
        </div>

        {/* Progress Circular Indicator */}
        <div className="relative flex items-center justify-center w-20 h-20">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-white/10"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={226}
              strokeDashoffset={226 - (226 * progress) / 100}
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Left Col: Habits List */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" /> عادات اليوم
            </h3>
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/70">
              {todayLogs.length} / {activeRituals.length} مكتمل
            </span>
          </div>

          <div className="space-y-3">
            {activeRituals.length === 0 ? (
              <div className="text-center py-8 text-white/40 bg-white/5 rounded-2xl border border-white/10">
                لا توجد عادات مفعلة اليوم. يمكنك إضافة عادات جديدة من الإعدادات.
              </div>
            ) : (
              activeRituals.map((ritual) => {
                const isCompleted = isRitualCompletedToday(ritual.id);
                return (
                  <motion.div
                    key={ritual.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (isCompleted) {
                        undoCompletion(ritual.id);
                      } else {
                        logCompletion(ritual.id);
                      }
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-all duration-300 ${
                      isCompleted 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-2xl ${isCompleted ? "bg-primary/20" : "bg-white/5"}`}>
                        {ritual.icon || "✨"}
                      </div>
                      <div>
                        <h4 className={`font-medium ${isCompleted ? "text-primary line-through opacity-80" : "text-white"}`}>
                          {ritual.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/50 mt-1">
                          <span>{ritual.estimatedMinutes} دقيقة</span>
                          {ritual.targetTime && <span>• {ritual.targetTime === "morning" ? "صباحاً" : ritual.targetTime === "evening" ? "مساءً" : "أي وقت"}</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-primary" />
                      ) : (
                        <Circle className="w-6 h-6 text-white/20" />
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Streaks & Heatmap */}
        <div className="space-y-6">
          {/* Perfect Day Streak */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
             
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-3">
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-3xl font-black text-orange-400 mb-1">{perfectDayStreak} <span className="text-lg font-normal text-white/60">أيام</span></h3>
            <p className="text-sm leading-relaxed text-orange-200/80">
              Perfect Day Streak 🔥<br />
              {perfectDayStreak > 0 ? "استمر في الزخم!" : "ابدأ سلسلة اليوم المثالي بإتمام كل العادات."}
            </p>
          </div>

          {/* Weekly Heatmap */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-white/70">
              <Calendar className="w-4 h-4" /> الأيام السبعة الماضية
            </h3>
            <div className="flex justify-between items-center gap-1">
              {heatmapDays.map((day, idx) => {
                let colorClass = "bg-white/5";
                if (day.intensity > 0) colorClass = "bg-primary/30";
                if (day.intensity >= 0.5) colorClass = "bg-primary/60";
                if (day.intensity >= 1) colorClass = "bg-primary";
                
                const isToday = idx === 6;

                return (
                  <div key={day.date} className="flex flex-col items-center gap-2">
                    <div 
                      title={`${Math.round(day.intensity * 100)}% اكتمل في ${day.date}`}
                      className={`w-8 h-8 rounded-lg ${colorClass} ${isToday ? "ring-2 ring-white/50" : ""} transition-colors duration-300`}
                    />
                    <span className="text-[10px] text-white/40">
                      {isToday ? "اليوم" : new Date(day.date).toLocaleDateString("ar-EG", { weekday: 'narrow' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
