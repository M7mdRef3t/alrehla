import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSullamState } from "../store/sullam.store";

export function SanctuaryView() {
  const { sanctuary, leaveSanctuary } = useSullamState();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!sanctuary.endsAt) return;

    const updateTimer = () => {
      const diff = sanctuary.endsAt! - Date.now();
      if (diff <= 0) {
        setTimeLeft("اكتملت فترة الاستشفاء");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days} أيام`);
      if (hours > 0) parts.push(`${hours} ساعة`);
      parts.push(`${minutes} دقيقة`);

      setTimeLeft(parts.join(" و "));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [sanctuary.endsAt]);

  if (!sanctuary.isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-slate-950 font-sans"
    >
      {/* Twilight Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/80 to-slate-950"></div>
        {/* Slow glowing orb in the background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"
        />
        
        {/* Fireflies / particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-300 shadow-[0_0_10px_2px_rgba(147,197,253,0.5)]"
            style={{
              width: Math.random() * 4 + 2 + "px",
              height: Math.random() * 4 + 2 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
            }}
            animate={{
              y: [0, Math.random() * -100 - 50],
              x: [0, Math.random() * 40 - 20],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl px-6 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="w-20 h-20 mb-8 rounded-full bg-slate-900/50 border border-blue-900/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_-5px_rgba(30,58,138,0.5)]"
        >
          <span className="text-4xl filter drop-shadow-md">🏕️</span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-100 to-blue-400/50 mb-6 !leading-normal"
        >
          أنت الآن في الملاذ
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1, duration: 1 }}
          className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-lg"
        >
          لا يوجد ما تطارده اليوم. لقد تم تجميد زمن رحلتك بالكامل ولن تخسر أي من تقدمك. استرح، العالم سينتظرك.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="flex flex-col items-center"
        >
          <div className="text-sm font-medium tracking-wider text-blue-300/50 uppercase mb-2">
            متبقي على التعافي
          </div>
          <div className="text-2xl font-light text-blue-200 tracking-wide font-mono">
            {timeLeft}
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          onClick={leaveSanctuary}
          className="mt-16 group relative px-8 py-3 rounded-full overflow-hidden"
        >
          <div className="absolute inset-0 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-full transition-colors group-hover:bg-slate-800/60" />
          <span className="relative text-slate-300 font-medium tracking-wide transition-colors group-hover:text-white">
            العودة لمواصلة الرحلة
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
