import type { FC } from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Z_LAYERS } from "@/config/zIndices";
import { useScrollLock } from "@/hooks/useScrollLock";

interface CocoonModeModalProps {
  isOpen: boolean;
  onStart: () => void;
  onSkip?: () => void;
  canSkip?: boolean;
  onClose: () => void;
}

function getTimeAwareTheme(): { headline: string; sub: string; color: string; rgb: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return {
    headline: "الصبح مش مسابقة",
    sub: "كل ما بتحاول تسبق نفسك، بتحرق طاقة. رحلتك هتستنى لما ترجع لمركزك.",
    color: "#2dd4bf",
    rgb: "45,212,191"
  };
  if (h >= 12 && h < 18) return {
    headline: "خُد نفس، مفيش حاجة هتفوتك",
    sub: "المستنقع اليومي بيسحب طاقتك. الملاذ هنا عشان يفرمل الزحمة، مش عشان تهرب.",
    color: "#f5a623",
    rgb: "245,158,11"
  };
  if (h >= 18 && h < 22) return {
    headline: "المساء لك، مش لمهامك",
    sub: "لا أجندة، لا توقعات. مجرد مساحة صمت تستاهلها.",
    color: "#818cf8",
    rgb: "129,140,248"
  };
  return {
    headline: "حقك في السكون",
    sub: "الليل ده عشان جسمك يشفي نفسه. سلّم القيادة وارتاح.",
    color: "#60a5fa",
    rgb: "96,165,250"
  };
}

export const CocoonModeModal: FC<CocoonModeModalProps> = ({
  isOpen,
  onStart,
  onSkip,
  canSkip = false,
  onClose
}) => {
  const { headline, sub, color, rgb } = useMemo(() => getTimeAwareTheme(), []);
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="cocoon-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="fixed inset-0 flex items-center justify-center overflow-hidden"
        style={{ background: "#010207", colorScheme: "dark", zIndex: Z_LAYERS.TACTICAL_CONTENT }}
        dir="rtl"
      >
        {/* Chromotherapy Fluid Orbs */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: "120vw",
            height: "120vh",
            background: `radial-gradient(circle at 50% 40%, rgba(${rgb},0.08) 0%, transparent 60%)`,
            pointerEvents: "none"
          }}
        />

        <motion.div
          key="cocoon-card"
          initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center text-center px-8 py-12 max-w-sm w-full mx-4"
        >
          {/* Abstract Pulsing Core */}
          <div className="relative flex items-center justify-center mb-10 w-24 h-24">
            <motion.div
              className="absolute rounded-full"
              style={{ width: "100%", height: "100%", background: `rgba(${rgb},0.08)`, filter: "blur(8px)" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: "60%", height: "60%", background: `rgba(${rgb},0.15)`, filter: "blur(4px)" }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <div
              className="relative z-10 flex items-center justify-center rounded-full"
              style={{
                width: 56,
                height: 56,
                background: `rgba(${rgb},0.1)`,
                border: `1px solid rgba(${rgb},0.2)`,
                boxShadow: `0 0 30px rgba(${rgb},0.15), inset 0 0 15px rgba(${rgb},0.1)`
              }}
            >
              <Sparkles className="w-6 h-6" style={{ color }} />
            </div>
          </div>

          <div
            className="mb-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]"
            style={{
              background: `rgba(${rgb},0.05)`,
              border: `1px solid rgba(${rgb},0.15)`,
              color: `rgba(${rgb},0.8)`
            }}
          >
            الملاذ الآمن
          </div>

          <h2
            className="text-3xl font-black mb-4 leading-snug tracking-tight"
            style={{ color: "#f1f5f9" }}
          >
            {headline}
          </h2>

          <p
            className="text-sm leading-relaxed mb-10 font-medium"
            style={{ color: "rgba(148,163,184,0.65)", maxWidth: 280 }}
          >
            {sub}
          </p>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-3 font-extrabold tracking-wide mb-4 transition-all"
            style={{
              background: `rgba(${rgb},0.1)`,
              border: `1px solid rgba(${rgb},0.2)`,
              color: color,
              boxShadow: `0 0 40px rgba(${rgb},0.1)`
            }}
          >
            ادخل للملاذ
            <motion.div 
               animate={{ x: [0, 4, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="opacity-70"
            >
               ←
            </motion.div>
          </motion.button>

          {canSkip && (
             <motion.button
               type="button"
               onClick={onSkip ?? onClose}
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.3 }}
               whileHover={{ opacity: 0.8 }}
               className="text-xs font-semibold py-3 transition-opacity"
               style={{ color: "rgba(148,163,184,1)" }}
             >
               سأكمل طريقي الآن
             </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
