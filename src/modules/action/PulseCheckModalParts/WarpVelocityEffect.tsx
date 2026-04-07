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
          className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[2.5rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ background: "rgba(2, 6, 12, 0.6)", backdropFilter: "blur(4px)" }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Warp Streaks */}
            {[...Array(24)].map((_, i) => {
              const angle = (i * 360) / 24;
              const delay = Math.random() * 0.1;
              const duration = 0.4 + Math.random() * 0.2;
              return (
                <motion.div
                  key={i}
                  className="absolute origin-bottom"
                  style={{ 
                    rotate: angle, 
                    height: "100%", 
                    width: "1.5px",
                    background: "linear-gradient(to top, transparent, #2dd4bf, #fff, transparent)",
                    opacity: 0
                  }}
                  animate={{ 
                    opacity: [0, 0.8, 0],
                    scaleY: [0, 1.5, 0.2],
                    y: ["-20%", "100%"]
                  }}
                  transition={{ 
                    duration, 
                    ease: "easeIn", 
                    delay,
                    repeat: 1
                  }}
                />
              );
            })}
            
            {/* Center Flash */}
            <motion.div 
              className="absolute w-24 h-24 rounded-full bg-white blur-3xl opacity-0"
              animate={{ opacity: [0, 0.4, 0], scale: [0.5, 2] }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
