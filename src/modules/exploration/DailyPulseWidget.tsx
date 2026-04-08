import { logger } from "@/services/logger";
import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BatteryCharging, BatteryWarning, Check, Zap, Share2 } from "lucide-react";
import { useDailyPulse } from "@/hooks/useDailyPulse";
import { trackEvent } from "@/services/analytics";
import { soundManager } from "@/services/soundManager";
import { ShareableCard } from '@/modules/exploration/ShareableCard';

/**
 *  TACTICAL PULSE (Energy P&L)
 *  A completely revamped widget that focuses on "Energy Accounting"
 *  instead of mood tracking. Zero-friction logging of energy drains & gains.
 */

export const DailyPulseWidget: FC = () => {
  const { todayPulse, savePulse, hasAnsweredToday } = useDailyPulse();

  const [isSaved, setIsSaved] = useState(false);
  const [pulseType, setPulseType] = useState<"charge" | "drain" | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  // Behavioral Logic: Meaning & Diff 
  const meaning = useMemo(() => {
    if (!hasAnsweredToday) return "سجل نبضتك التكتيكية";
    if ((todayPulse?.energy ?? 3) > 3) return "طاقة إيجابية مكتسبة";
    if ((todayPulse?.energy ?? 3) < 3) return "استنزاف طاقي ملحوظ";
    return "اتزان طاقي";
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

      trackEvent("pulse_recorded", {
        target: "tactical_pulse",
        val: type
      });

      soundManager.playSuccess();

      setIsSaved(true);
      // Removed the 2000ms timeout for clearing pulseType so we can use it for sharing
    } catch (error) {
      logger.error(error);
      setPulseType(null);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        layout
        className="flex items-center justify-between gap-4 h-14 px-6 rounded-full glass border border-white/5 relative z-50 overflow-hidden"
        style={{
          backdropFilter: "blur(12px)",
          background: "rgba(10, 10, 10, 0.6)",
          minWidth: "22rem"
        }}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {/* Left Side: Status / Meaning */}
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-emerald-400 opacity-80" />
          <span className="text-sm font-bold text-white/80 tracking-tight">
            {meaning}
          </span>
        </div>

        {/* Right Side: Quick Action Buttons (The Tactical Pulse) */}
        {!isSaved ? (
          <div className="flex items-center gap-2">
            {/* Drain Button */}
            <button
              onClick={() => handleSavePulse("drain")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-bold text-xs uppercase tracking-wider"
              disabled={pulseType !== null}
            >
              <BatteryWarning className="w-3.5 h-3.5" />
              <span>استنزاف</span>
            </button>

            {/* Charge Button */}
            <button
              onClick={() => handleSavePulse("charge")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all font-bold text-xs uppercase tracking-wider"
              disabled={pulseType !== null}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>شحن</span>
            </button>
          </div>
        ) : (
          /* Success Flash / Confirmation & Share Action */
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                تم التسجيل
              </span>
            </div>

            <button
              onClick={() => setShowShareCard(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
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



