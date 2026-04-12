import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { useEmergencyState } from "@/domains/admin/store/emergency.store";
import { AnalyticsEvents, trackEvent } from "@/services/analytics";

export function EmergencyButton() {
  const openEmergency = useEmergencyState((state) => state.open);

  return (
    <div className="absolute top-6 right-6 pointer-events-auto z-[120]">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-500/20"
        onClick={() => {
          trackEvent(AnalyticsEvents.EMERGENCY_USED, { source: "masafaty_map_button" });
          openEmergency();
        }}
      >
        <ShieldAlert className="w-5 h-5" />
        <span>إسعاف فوري</span>
      </motion.button>
    </div>
  );
}
