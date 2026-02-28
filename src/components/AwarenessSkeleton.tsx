import React from 'react';
import { motion } from 'framer-motion';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"
      >
        <div className="w-8 h-8 rounded-full bg-blue-400/40" />
      </motion.div>
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="text-sm font-medium text-blue-300 tracking-widest"
      >
        يتم الآن التناغم مع داتا الرحلة...
      </motion.div>
    </div>
  );
};
