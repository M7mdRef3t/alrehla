import React from 'react';
import { motion } from 'framer-motion';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4 p-8">
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.98, 1.02, 0.98] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="w-16 h-16 rounded-full bg-cyan-900/40 border border-cyan-800/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center justify-center"
      >
        <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-cyan-500 animate-spin" />
      </motion.div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
        className="text-cyan-600/70 font-mono text-sm tracking-widest uppercase text-center"
      >
        <span className="block mb-1">يتم الآن تهيئة الوعي</span>
        <span className="text-xs text-cyan-800/60 lowercase">loading neural patterns...</span>
      </motion.div>
    </div>
  );
};

export default AwarenessSkeleton;
