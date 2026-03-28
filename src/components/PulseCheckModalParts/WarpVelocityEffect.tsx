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
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Radial Flash */}
            <motion.div 
              className="absolute w-24 h-24 rounded-full bg-white blur-3xl opacity-0"
              animate={{ scale: [1, 20], opacity: [0, 0.4, 0] }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute bg-gradient-to-b from-transparent via-cyan-300 to-transparent w-[1.5px] blur-[0.5px]"
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  height: `${60 + Math.random() * 100}px`, 
                  top: "50%",
                  opacity: 0.8
                }}
                initial={{ scaleY: 0, opacity: 0, y: -400 }}
                animate={{ scaleY: [0, 30, 0], opacity: [0, 0.9, 0], y: ["-150%", "150%"] }}
                transition={{ 
                  duration: 0.35, 
                  ease: "easeInOut", 
                  delay: Math.random() * 0.1,
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
