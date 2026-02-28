import React from 'react';
import { motion } from 'framer-motion';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px] w-full p-8">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.98, 1.02, 0.98] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center"
        >
          <div className="w-8 h-8 rounded-full bg-brand-primary/40" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-2 w-24 bg-surface-border rounded-full"
        />
      </div>
    </div>
  );
};
