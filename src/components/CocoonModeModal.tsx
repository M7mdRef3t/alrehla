import type { FC } from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon } from "lucide-react";

interface CocoonModeModalProps {
  isOpen: boolean;
  onStart: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
  onClose: () => void;
}

function getTimeAwareCopy(): { headline: string; sub: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return {
    headline: "الصبح ده مش لازم تكون جاهز",
    sub: "كل ما بتحاول تتماسك، بتصرف طاقة محتاجها. خلّي المنصة تحمل الثقل شوية."
  };
  if (h >= 12 && h < 18) return {
    headline: "خليك مع نفسك شوية",
    sub: "النهار مش هيخلص لو وقفت دقيقتين. الملاذ هنا عشان تشحن مش عشان تهرب."
  };
  if (h >= 18 && h < 22) return {
    headline: "المساء ده ملكك",
    sub: "لا أجندة، لا توقعات. بس أنت وصمتك اللي استاهلته طول النهار."
  };
  return {
    headline: "الليل ده لك وحدك",
    sub: "في وقت الهدوء ده، جسمك بيشفي نفسه لو سمحتله. اكوكن شوية."
  };
}

export const CocoonModeModal: FC<CocoonModeModalProps> = ({
  isOpen,
  onStart,
  onSkip,
  canSkip = false,
  onClose
}) => {
  const { headline, sub } = useMemo(() => getTimeAwareCopy(), []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="cocoon-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[70] flex items-center justify-center"
        style={{ background: "#030409", colorScheme: "dark" }}
        dir="rtl"
      >
        {/* Ambient warm orb */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 65%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -55%)",
            pointerEvents: "none"
          }}
        />
        {/* Second deeper indigo orb */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            width: 450,
            height: 450,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)",
            bottom: "-10%",
            left: "10%",
            pointerEvents: "none"
          }}
        />

        {/* Main card */}
        <motion.div
          key="cocoon-card"
          initial={{ opacity: 0, scale: 0.88, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center text-center px-8 py-12 max-w-sm w-full mx-4"
        >
          {/* Moon icon with pulse rings */}
          <div className="relative flex items-center justify-center mb-10">
            {/* Outermost ring */}
            <motion.div
              className="absolute rounded-full border"
              style={{ width: 120, height: 120, borderColor: "rgba(245,158,11,0.12)" }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Middle ring */}
            <motion.div
              className="absolute rounded-full border"
              style={{ width: 88, height: 88, borderColor: "rgba(245,158,11,0.2)" }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.8, 0.4, 0.8] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />
            {/* Core circle */}
            <div
              className="relative z-10 flex items-center justify-center rounded-full"
              style={{
                width: 64,
                height: 64,
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                boxShadow: "0 0 30px rgba(245,158,11,0.15)"
              }}
            >
              <Moon className="w-7 h-7" style={{ color: "#f5a623" }} />
            </div>
          </div>

          {/* Badge */}
          <div
            className="mb-5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              color: "rgba(245,158,11,0.7)"
            }}
          >
            الملاذ الآمن
          </div>

          {/* Headline */}
          <h2
            className="text-2xl font-black mb-4 leading-snug"
            style={{ color: "#f1f5f9", letterSpacing: "-0.02em" }}
          >
            {headline}
          </h2>

          {/* Sub-text */}
          <p
            className="text-sm leading-relaxed mb-10"
            style={{ color: "rgba(148,163,184,0.75)", maxWidth: 280 }}
          >
            {sub}
          </p>

          {/* Primary CTA */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="w-full rounded-2xl py-4 text-sm font-black tracking-wide mb-4 transition-all"
            style={{
              background: "rgba(20,184,166,0.15)",
              border: "1px solid rgba(20,184,166,0.35)",
              color: "#2dd4bf",
              boxShadow: "0 0 24px rgba(20,184,166,0.12)"
            }}
          >
            ادخل الملاذ
          </motion.button>

          {/* Skip */}
          {canSkip && (
            <button
              type="button"
              onClick={onSkip ?? onClose}
              className="text-xs font-medium transition-colors py-2"
              style={{ color: "rgba(148,163,184,0.4)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(148,163,184,0.7)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(148,163,184,0.4)"; }}
            >
              مش دلوقتي
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
