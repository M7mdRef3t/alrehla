import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BatteryCharging, BatteryWarning, Check, Flame, Share2 } from "lucide-react";
import { useDailyPulse } from "../hooks/useDailyPulse";
import { trackEvent, AnalyticsEvents } from "../services/analytics";
import { soundManager } from "../services/soundManager";
import { ShareableCard } from "./ShareableCard";

/**
 *  TACTICAL PULSE (Energy P&L)
 *  A completely revamped widget that focuses on "Energy Accounting"
 *  instead of mood tracking. Zero-friction logging of energy drains & gains.
 */

export const DailyPulseWidget: FC = () => {
  const { todayPulse, history, savePulse, hasAnsweredToday, streak } = useDailyPulse();

  const [isSaved, setIsSaved] = useState(false);
  const [pulseType, setPulseType] = useState<"charge" | "drain" | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  // Behavioral Logic: Meaning & Diff
  const meaning = useMemo(() => {
    if (!hasAnsweredToday) return "سجّل نبضتك";
    const e = todayPulse?.energy ?? 5;
    if (e >= 8) return "طاقة عالية ⚡";
    if (e >= 5) return "طاقة متوازنة";
    if (e >= 3) return "طاقة متدنية";
    return "استنزاف طاقي 🔋";
  }, [hasAnsweredToday, todayPulse]);

  const handleSavePulse = async (type: "charge" | "drain") => {
    setPulseType(type);

    // Map to the existing Supabase structure for now
    // Charge = High Energy/Good Mood, Drain = Low Energy/Bad Mood
    const energyVal = type === "charge" ? 5 : 1;
    const moodVal = type === "charge" ? 5 : 1;

    try {
      await savePulse({
        mood: moodVal,
        energy: energyVal,
        stress_tag: type === "drain" ? "استنزاف طاقي" : "شحن طاقي",
        note: "",
        focus: 'general'
      });

      trackEvent("pulse_recorded" as any, {
        target: "tactical_pulse",
        val: type
      });

      soundManager.playSuccess();

      setIsSaved(true);
      // Removed the 2000ms timeout for clearing pulseType so we can use it for sharing
    } catch (e) {
      console.error(e);
      setPulseType(null);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        layout
        className="flex items-center justify-between gap-4 h-14 px-6 rounded-full relative z-50 overflow-hidden"
        style={{
          background: "rgba(10, 10, 18, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)",
          minWidth: "24rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4), inset 0 0 10px rgba(255,255,255,0.02)"
        }}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {/* Ambient Pulsing Background (Subtle) */}
        {!isSaved && (
          <motion.div 
            className="absolute inset-0 z-[-1] opacity-20"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 50%)"
              ]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        )}

        {/* Left Side: Status / Meaning + Streak */}
        <div className="flex items-center gap-3 relative z-10">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/25">
              <Flame className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-black text-amber-300">{streak}</span>
            </div>
          )}
          <span className="text-xs font-bold text-white/70">{meaning}</span>
        </div>

        {/* Right Side: Quick Action Buttons (The Tactical Pulse) */}
        {!isSaved ? (
          <div className="flex items-center gap-3 relative z-10">
            {/* زر الاستنزاف */}
            <button
              onClick={() => handleSavePulse("drain")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-bold text-[11px]"
              disabled={pulseType !== null}
            >
              <BatteryWarning className="w-3.5 h-3.5" />
              <span>استنزاف</span>
            </button>

            {/* زر الشحن */}
            <button
              onClick={() => handleSavePulse("charge")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-bold text-[11px]"
              disabled={pulseType !== null}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>شحن</span>
            </button>
          </div>
        ) : (
          /* Success Flash / Confirmation & Share Action */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-400">
                تم التسجيل ✓
              </span>
            </div>

            <button
              onClick={() => setShowShareCard(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
              title="مشاركة النبضة"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Background Glow Effect based on last action if saved */}
      <AnimatePresence>
        {isSaved && pulseType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.15, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-2xl pointer-events-none ${pulseType === 'charge' ? 'bg-emerald-500' : 'bg-red-500'
              }`}
          />
        )}
      </AnimatePresence>

      {showShareCard && pulseType && (
        <ShareableCard
          title={pulseType === "charge" ? "يوم مشحون بالطاقة!" : "يوم بمجهود استثنائي!"}
          description={
            pulseType === "charge"
              ? "طاقتي مرتفعة اليوم، قمت بشحن طاقتي في دوائر بفضل من حولي."
              : "طاقتي مستنزفة اليوم... أحتاج مساحتي الخاصة للتعافي في دوائر."
          }
          type="pulse"
          metrics={[
            { label: "مستوى الطاقة", value: pulseType === "charge" ? "+5" : "-5" },
            { label: "الحالة التكتيكية", value: pulseType === "charge" ? "شحن" : "استنزاف" }
          ]}
          onClose={() => {
            setShowShareCard(false);
            setIsSaved(false);
            setPulseType(null);
          }}
        />
      )}
    </div>
  );
};

