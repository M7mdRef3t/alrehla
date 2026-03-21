import { motion, AnimatePresence } from "framer-motion";

interface WarpVelocityEffectProps {
  isWarping: boolean;
}

export function WarpVelocityEffect({ isWarping }: WarpVelocityEffectProps) {
  return (
    <AnimatePresence>
      {isWarping && (
        <motion.div
          key="warp-speed"
          className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[2rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: "rgba(10, 15, 30, 0.4)", backdropFilter: "blur(2px)" }}
        >
          <div className="relative w-full h-full">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-gradient-to-b from-transparent via-teal-400 to-transparent w-[1px]"
                style={{ left: `${8 + (i * 8)}%`, height: "120px", top: "50%" }}
                initial={{ scaleY: 0, opacity: 0, y: -200 }}
                animate={{ scaleY: [0, 18, 0], opacity: [0, 0.6, 0], y: ["-120%", "120%"] }}
                transition={{ 
                  duration: 0.35, 
                  ease: "easeInOut", 
                  delay: i * 0.02,
                  repeat: 0
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
