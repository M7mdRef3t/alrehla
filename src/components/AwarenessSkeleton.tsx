import React from 'react';
import { motion } from 'framer-motion';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full w-full p-4">
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-8 h-8 rounded-full bg-primary/40"
      />
    </div>
  );
};
