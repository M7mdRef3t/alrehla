import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export function EmergencyButton() {
  return (
    <div className="absolute top-6 right-6">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-500/20"
        onClick={() => {
            // Placeholder: This will trigger the "Fix Now" protocol
            alert("emergency protocol triggered");
        }}
      >
        <ShieldAlert className="w-5 h-5" />
        <span>إسعاف فوري</span>
      </motion.button>
    </div>
  );
}
