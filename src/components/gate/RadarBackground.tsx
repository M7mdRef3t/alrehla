import { motion } from 'framer-motion';

export default function RadarBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950" />
      
      {/* Slow Radar Scan Line */}
      <motion.div
        className="absolute inset-0 origin-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 15, ease: "linear", repeat: Infinity }}
      >
        <div className="w-1/2 h-1/2 absolute border-l border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 to-transparent top-1/2 left-1/2 -translate-y-full transform-gpu" />
      </motion.div>

      {/* Subtle Pulses */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-emerald-500/5"
        animate={{ scale: [1, 2], opacity: [0.1, 0] }}
        transition={{ duration: 4, ease: "easeOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-emerald-400/10"
        animate={{ scale: [1, 3], opacity: [0.2, 0] }}
        transition={{ duration: 4, delay: 1, ease: "easeOut", repeat: Infinity }}
      />
    </div>
  );
}
