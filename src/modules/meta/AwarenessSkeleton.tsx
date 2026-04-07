import { motion } from "framer-motion";

interface AwarenessSkeletonProps {
  className?: string;
}

export function AwarenessSkeleton({ className = "" }: AwarenessSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.2 }}
      animate={{ opacity: [0.2, 0.45, 0.2] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/40 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur-md ${className}`}
      aria-live="polite"
      aria-label="Awareness loading state"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
      <span>المنظومة تستوعب السياق...</span>
    </motion.div>
  );
}
