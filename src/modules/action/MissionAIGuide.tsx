import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Sparkles, X, Volume2 } from "lucide-react";

interface MissionAIGuideProps {
  missionTitle: string;
  missionGoal: string;
  personLabel: string;
}

export const MissionAIGuide: FC<MissionAIGuideProps> = ({
  missionTitle,
  missionGoal,
  personLabel,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  // Generate a dynamic script based on the mission details
  const script = [
    `أهلاً بيك في مسار التعافي مع ${personLabel}.`,
    `الهدف المباشر من المهمة دي هو: ${missionGoal}.`,
    `مهمتك الأساسية هي: ${missionTitle}.`,
    `السيستم قام بتحليل العلاقة، والخطوات اللي تحت مصممة مخصوص عشان ترجعلك التوازن.`,
    `استخدم الأدوات المطلوبة، ولاحظ مقياس الضغط الخاص بيك بعد التنفيذ.`,
    `إحنا معاك.. ابدأ دلوقتي.`
  ];

  useEffect(() => {
    if (!isPlaying) {
      setTextIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setTextIndex((prev) => {
        if (prev < script.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 3500); // Change text every 3.5 seconds

    return () => clearInterval(interval);
  }, [isPlaying, script.length]);

  return (
    <div className="mb-6" dir="rtl">
      {!isPlaying ? (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsPlaying(true)}
          className="w-full relative overflow-hidden rounded-2xl p-1"
          style={{
            background: "linear-gradient(45deg, rgba(45,212,191,0.2), rgba(168,85,247,0.2))",
          }}
        >
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 opacity-50"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
              backgroundSize: "200% 100%",
            }}
          />

          <div className="relative bg-black/80 backdrop-blur-xl rounded-xl p-5 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-teal-500/50 animate-ping opacity-20" />
                <Play className="w-5 h-5 text-teal-400 fill-teal-400 ml-1" />
              </div>
              <div className="text-right">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  تحليل الذكاء الاصطناعي للمهمة
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  شرح مرئي وتوجيه صوتي لخطواتك القادمة
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">
              متاح الآن
            </div>
          </div>
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="relative rounded-2xl overflow-hidden bg-black border border-teal-500/30 shadow-[0_0_30px_rgba(45,212,191,0.15)]"
        >
          {/* Cinematic aspect ratio container */}
          <div className="relative w-full aspect-video flex flex-col items-center justify-center">
            {/* Generative AI Background effect */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 180],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-[150%] h-[150%] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(45,212,191,0.4) 0%, transparent 50%, rgba(168,85,247,0.2) 100%)",
                  filter: "blur(40px)",
                }}
              />
            </div>

            {/* AI Waveform Visualization */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-50">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-teal-500 rounded-full"
                  animate={{
                    height: ["20%", "80%", "20%"],
                  }}
                  transition={{
                    duration: 0.5 + Math.random(),
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random(),
                  }}
                />
              ))}
            </div>

            {/* Text Overlay */}
            <div className="z-10 w-full px-8 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={textIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-lg md:text-xl font-black text-white leading-relaxed drop-shadow-xl"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
                >
                  {script[textIndex]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Status indicators */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 text-[10px] text-white font-bold tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE AI
              </span>
            </div>
            
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-white/50" />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute bottom-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <motion.div
                className="h-full bg-teal-500"
                initial={{ width: "0%" }}
                animate={{ width: `${((textIndex + 1) / script.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
