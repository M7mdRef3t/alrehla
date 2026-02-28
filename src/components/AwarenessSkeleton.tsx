import React from 'react';
import { motion } from 'framer-motion';

export const AwarenessSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-surface/50 rounded-lg ${className}`}>
      <motion.div
        className="h-full w-full bg-surface-muted/30 rounded-lg"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export default AwarenessSkeleton;
