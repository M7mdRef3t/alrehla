import type { FC } from "react";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAchievementById } from "../data/achievements";
import { useAchievementState } from "../state/achievementState";
import { getAudioContextConstructor } from "../services/clientDom";

function playAchievementSuccessSound(): void {
  const AudioContextCtor = getAudioContextConstructor();
  if (!AudioContextCtor) return;
  try {
    const context = new AudioContextCtor();
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    gain.connect(context.destination);

    const first = context.createOscillator();
    first.type = "sine";
    first.frequency.setValueAtTime(740, now);
    first.connect(gain);
    first.start(now);
    first.stop(now + 0.11);

    const second = context.createOscillator();
    second.type = "sine";
    second.frequency.setValueAtTime(988, now + 0.12);
    second.connect(gain);
    second.start(now + 0.12);
    second.stop(now + 0.25);

    window.setTimeout(() => { void context.close(); }, 420);
  } catch {
    // تجاهل أي خطأ تشغيل صوتي
  }
}

/** تهنئة صغيرة تظهر عند فتح إنجاز جديد — dark glassmorphism + قابل للضغط */
export const AchievementToast: FC = () => {
  const lastNewAchievementId = useAchievementState((s) => s.lastNewAchievementId);
  const clearLastNew = useAchievementState((s) => s.clearLastNew);
  const requestOpenAchievements = useAchievementState((s) => s.requestOpenAchievements);
  const achievement = lastNewAchievementId ? getAchievementById(lastNewAchievementId) : null;

  useEffect(() => {
    if (!lastNewAchievementId) return;
    playAchievementSuccessSound();
    const t = setTimeout(clearLastNew, 4500);
    return () => clearTimeout(t);
  }, [lastNewAchievementId, clearLastNew]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.88))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,215,0,0.25)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,215,0,0.1), inset 0 1px 0 rgba(255,255,255,0.06)"
          }}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          role="button"
          aria-label="افتح كل إنجازاتك"
          onClick={requestOpenAchievements}
        >
          {/* Golden glow bar */}
          <div
            className="h-0.5 rounded-t-[20px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)" }}
          />

          <div className="px-4 py-3 text-center">
            <p className="text-3xl mb-1.5" aria-hidden>{achievement.icon}</p>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-0.5"
              style={{ color: "rgba(255,215,0,0.8)", letterSpacing: "0.15em" }}
            >
              إنجاز جديد!
            </p>
            <p className="font-black text-white text-base">{achievement.title}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              {achievement.hint}
            </p>
            <p className="text-[10px] mt-2 font-semibold" style={{ color: "rgba(255,215,0,0.4)" }}>
              اضغط لترى كل إنجازاتك ←
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
